# 🤖 Oniket Agente IA para Agendamiento

Agente conversacional que automatiza agendamiento de citas vía WhatsApp usando Claude API.

---

## **CARACTERÍSTICAS**

✅ Responde preguntas sobre servicios  
✅ Sugiere horarios disponibles  
✅ Confirma citas automáticamente  
✅ Crea eventos en Google Calendar  
✅ Responde 24/7 sin intervención  
✅ Clónable para múltiples clientes  

---

## **SETUP INICIAL (Una sola vez)**

### **1. Clonar repositorio**
```bash
git clone https://github.com/tu-usuario/oniket-agente-ia.git
cd oniket-agente-ia
npm install
```

### **2. Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `CLAUDE_API_KEY`
- Datos del cliente

### **3. Testear localmente**
```bash
npm run dev
```

Debería ver: `🚀 Agente IA activo en puerto 3000`

### **4. Conectar webhook de Twilio**
En dashboard Twilio:
1. Ir a: **Messaging → WhatsApp Sandbox**
2. "When a message comes in" → `https://tu-url.vercel.app/webhook/whatsapp`
3. Guardar

---

## **DEPLOYMENT A VERCEL**

### **Opción A: Desde CLI**
```bash
npm install -g vercel
vercel
```

Vercel te pregunta por variables → agregarlas desde CLI

### **Opción B: Desde GitHub (recomendado)**
1. Push código a GitHub: `git push origin main`
2. Ve a vercel.com
3. Click "New Project"
4. Selecciona tu repositorio
5. Agrega variables de entorno en "Environment Variables"
6. Deploy

**Resultado:** URL como `https://oniket-agente-ia.vercel.app`

---

## **CLONAR PARA NUEVO CLIENTE**

Para cada cliente nuevo, solo necesitas **cambiar variables de entorno**:

### **Paso 1: Crear nuevo deployment en Vercel**
```bash
vercel --prod --env-file .env.cliente2
```

### **Paso 2: Variables únicas del cliente**
```
CLIENTE_ID=cliente_002
CLIENTE_NOMBRE=Consultorio Dr. López
CLIENTE_EMAIL=doctor@example.com
TWILIO_WHATSAPP_NUMBER=+14155238886  # (o nuevo número si compras)
CLIENTE_SERVICIOS=Consulta,Urgencia,Control
```

### **Paso 3: Conectar webhook en Twilio**
- Número WhatsApp de cliente → Webhook a su URL Vercel

**Listo.** Cada cliente tiene agente independiente.

---

## **ESTRUCTURA DE ARCHIVOS**

```
oniket-agente-ia/
├── index.js              # Servidor principal
├── package.json          # Dependencias
├── .env.example          # Template de variables
├── README.md             # Este archivo
└── vercel.json           # Config para Vercel
```

---

## **FLUJO DE CONVERSACIÓN**

```
Cliente: "Hola, quiero agendar una cita"
     ↓
Agente: "¡Hola! ¿Qué servicio necesitas? 
         Tenemos: Consulta General, Seguimiento, Procedimiento"
     ↓
Cliente: "Consulta general"
     ↓
Agente: "Perfecto. ¿Qué día te vendría bien? 
         (Ej: 25/04, 26/04)"
     ↓
Cliente: "26 de abril a las 10 AM"
     ↓
Agente: "¿Cuál es tu nombre y teléfono?"
     ↓
Cliente: "Juan García, +52 667 123 4567"
     ↓
Agente: "¡Perfecto! Confirmé tu cita:
         📅 26/04 a las 10:00 AM
         🏥 Consulta General
         ✅ Recibirás recordatorio mañana"
     ↓
[Sistema]: Evento creado en Google Calendar
           Recordatorio automático al paciente
```

---

## **VARIABLES DE ENTORNO**

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | SID de tu cuenta Twilio | `ACe820...` |
| `TWILIO_AUTH_TOKEN` | Token de autenticación Twilio | `a94240...` |
| `TWILIO_WHATSAPP_NUMBER` | Número WhatsApp | `+14155238886` |
| `CLAUDE_API_KEY` | API Key de Anthropic | `sk-ant-...` |
| `GOOGLE_CALENDAR_API_KEY` | API Key Google Calendar | `AIza...` |
| `CLIENTE_NOMBRE` | Nombre del consultorio | `Clínica Dra. María` |
| `CLIENTE_EMAIL` | Email del cliente | `doctor@example.com` |
| `CLIENTE_SERVICIOS` | Servicios (separados por comas) | `Consulta,Seguimiento` |
| `TIMEZONE` | Zona horaria | `America/Mazatlan` |

---

## **TROUBLESHOOTING**

### **Problema: "Webhook no responde"**
- Verificar que Vercel deployment esté activo
- Verificar URL en dashboard Twilio
- Probar: `curl https://tu-url.vercel.app`

### **Problema: "No recibe mensajes"**
- Verificar Account SID y Auth Token en `.env`
- Verificar que WhatsApp Sandbox esté activo
- Revisar logs en Vercel: `vercel logs`

### **Problema: "Claude no responde"**
- Verificar API Key es válida
- Verificar que tengas créditos disponibles
- Revisar rate limits de Claude

---

## **COSTOS ESTIMADOS/MES**

| Servicio | Costo |
|----------|-------|
| Twilio (100 msgs/día) | $40-80 MXN |
| Claude API (50 convs/día) | $40-80 MXN |
| Vercel (Pro) | $0 (gratis) |
| Google Calendar API | $0 (gratis) |
| **TOTAL** | **~$80-160 MXN** |

---

## **SOPORTE**

Para issues, contacta: angel@oniket.com

---

**Hecho con ❤️ por Oniket Performance Lab**
