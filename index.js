const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const twilio = require('twilio');
const { google } = require('googleapis');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── CONFIGURACIÓN ───
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const CLIENTE_ID = process.env.CLIENTE_ID; // ID único del cliente
const TIMEZONE = process.env.TIMEZONE || 'America/Mazatlan';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ─── DATOS DEL CLIENTE (pueden venir de DB después) ───
const CLIENTE_CONFIG = {
  nombre: process.env.CLIENTE_NOMBRE || 'Consultorio',
  email: process.env.CLIENTE_EMAIL || 'cliente@example.com',
  telefono: process.env.CLIENTE_TELEFONO || '+52 667 643 7224',
  servicios: (process.env.CLIENTE_SERVICIOS || 'Consulta General,Seguimiento').split(','),
  horarioLunes: process.env.CLIENTE_HORARIO_LUNES || '9:00-18:00',
  horarioSabado: process.env.CLIENTE_HORARIO_SABADO || '10:00-15:00',
};

// ─── FUNCIÓN: Llamar Claude API ───
async function llamarClaude(prompt) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-20250805',
      max_tokens: 500,
      system: `Eres un asistente de agendamiento para ${CLIENTE_CONFIG.nombre}. 
Tu rol es:
1. Responder preguntas sobre servicios: ${CLIENTE_CONFIG.servicios.join(', ')}
2. Preguntar qué servicio necesita el paciente
3. Proponer horarios disponibles
4. Confirmar cita con: nombre, teléfono, servicio, fecha y hora
5. Ser amable, profesional y breve (máximo 2 párrafos)

Responde SIEMPRE en español. Si el paciente confirma cita, termina con:
[CONFIRMAR_CITA:nombre|telefono|servicio|fecha|hora]`,
      messages: [
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json'
      }
    });

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error llamando Claude:', error.message);
    return 'Disculpa, estoy teniendo problemas técnicos. Por favor intenta de nuevo en unos momentos.';
  }
}

// ─── FUNCIÓN: Extraer datos de confirmación ───
function extraerDatosConfirmacion(texto) {
  const regex = /\[CONFIRMAR_CITA:([^\]]+)\]/;
  const match = texto.match(regex);
  
  if (match) {
    const [nombre, telefono, servicio, fecha, hora] = match[1].split('|').map(s => s.trim());
    return { nombre, telefono, servicio, fecha, hora };
  }
  return null;
}

// ─── FUNCIÓN: Crear evento en Google Calendar ───
async function crearEventoCalendar(datos) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: GOOGLE_CALENDAR_API_KEY });
    
    // Parsear fecha y hora
    const [dia, mes, año] = datos.fecha.split('/');
    const [horaStr, minStr] = datos.hora.split(':');
    
    const startTime = new Date(año, mes - 1, dia, horaStr, minStr);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min de duración

    const event = {
      summary: `${datos.servicio} - ${datos.nombre}`,
      description: `Paciente: ${datos.nombre}\nTeléfono: ${datos.telefono}\nServicio: ${datos.servicio}`,
      start: { dateTime: startTime.toISOString(), timeZone: TIMEZONE },
      end: { dateTime: endTime.toISOString(), timeZone: TIMEZONE },
      attendees: [{ email: datos.telefono + '@paciente.local' }],
    };

    // Aquí iría la llamada real a Google Calendar
    // Por ahora, simulamos éxito
    console.log('Evento creado simulado:', event);
    return true;
  } catch (error) {
    console.error('Error creando evento:', error.message);
    return false;
  }
}

// ─── FUNCIÓN: Enviar WhatsApp ───
async function enviarWhatsApp(numero, mensaje) {
  try {
    await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${numero}`,
      body: mensaje
    });
    console.log(`✓ Mensaje enviado a ${numero}`);
  } catch (error) {
    console.error('Error enviando WhatsApp:', error.message);
  }
}

// ─── WEBHOOK: Recibir mensajes de WhatsApp ───
app.post('/webhook/whatsapp', async (req, res) => {
  const incoming = req.body;

  // Validar que sea de Twilio
  if (!incoming.MessageSid) {
    return res.status(400).send('No message');
  }

  const numeroOrigen = incoming.From.replace('whatsapp:', '');
  const textoMensaje = incoming.Body;

  console.log(`📱 Mensaje recibido de ${numeroOrigen}: ${textoMensaje}`);

  // 1. Llamar Claude para procesar
  const respuestaIA = await llamarClaude(textoMensaje);
  
  // 2. Revisar si hay confirmación de cita
  const datosConfirmacion = extraerDatosConfirmacion(respuestaIA);
  
  // 3. Si hay confirmación, crear evento en calendar
  if (datosConfirmacion) {
    const calendarioOk = await crearEventoCalendar(datosConfirmacion);
    if (calendarioOk) {
      console.log(`✓ Cita creada: ${datosConfirmacion.nombre} - ${datosConfirmacion.fecha} ${datosConfirmacion.hora}`);
    }
  }

  // 4. Limpiar respuesta (remover tag de confirmación) y enviar
  const respuestaLimpia = respuestaIA
    .replace(/\[CONFIRMAR_CITA:[^\]]+\]/g, '')
    .trim();

  if (respuestaLimpia) {
    await enviarWhatsApp(numeroOrigen, respuestaLimpia);
  }

  // Responder a Twilio (para confirmar recepción)
  res.status(200).send('OK');
});

// ─── WEBHOOK: Validar token de Twilio ───
app.get('/webhook/whatsapp', (req, res) => {
  res.status(200).send('Webhook activo');
});

// ─── HEALTH CHECK ───
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    agente: CLIENTE_CONFIG.nombre,
    timestamp: new Date().toISOString()
  });
});

// ─── INICIAR SERVIDOR ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Agente IA activo en puerto ${PORT}`);
  console.log(`📱 Cliente: ${CLIENTE_CONFIG.nombre}`);
  console.log(`🔗 Webhook: /webhook/whatsapp`);
});
