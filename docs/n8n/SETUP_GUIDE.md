# Configuración n8n - Guía Paso a Paso

## FASE 1: Backend Leads

### Paso 1: Acceder a n8n

URL: https://n8n.keepmyweb.com
Usuario: j373653@gmail.com
Password: Kale@80000

---

### Paso 2: Crear Credencial Supabase API (HTTP)

**NOTA**: Usamos HTTP Request en lugar de PostgreSQL directo (más seguro, no requiere abrir puertos)

1. Ve a **Credentials** → **New**
2. Selecciona **Header Auth**
3. Configura:
   - **Name**: Supabase API Key
   - **Value**: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.OMpZRweGghcJPva0FqiOk63gQm_rJoj-KXk4cDqrZ2M
     (Este es el SERVICE_KEY de Supabase)
4. Guarda

**Nota**: Si tienes una credencial PostgreSQL creada anteriormente, puedes borrarla.

---

### Paso 3: Crear Credencial SMTP (OBLIGATORIA - Para enviar emails)

**⚠️ IMPORTANTE**: Esta credencial SÍ es necesaria para enviar notificaciones por email.

1. Ve a **Credentials** → **New**
2. Selecciona **SMTP**
3. Configura:
   - **Name**: BanaHosting SMTP
   - **Host**: mail.d-seo.es
   - **Port**: 587
   - **User**: web@d-seo.es
   - **Password**: Kale@80000
   - **From Email**: web@d-seo.es
4. Guarda

**Resumen de credenciales**:
- ✅ **Header Auth (Supabase API)**: SÍ crear
- ✅ **SMTP (BanaHosting)**: SÍ crear  
- ❌ **PostgreSQL**: NO crear (usamos HTTP en su lugar)

---

### Paso 4: Importar Workflow "Nuevo Lead"

**Usa el archivo HTTP (no el PostgreSQL)**:
1. Descarga el archivo: `docs/n8n/workflow-new-lead-http.json`
2. En n8n: **Workflow** → **Import from File**
3. Selecciona el archivo JSON
4. Verifica que los nodos tengan las credenciales correctas:
   - **Insert Lead API**: Debe usar "Supabase API Key"
   - **Email Notificación**: Debe usar "BanaHosting SMTP"
5. Activa el workflow (toggle en la esquina superior derecha)

---

### Paso 5: Probar el Workflow

Ejecuta este curl para probar:

```bash
curl -X POST https://n8n.keepmyweb.com/webhook/new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Usuario Test",
    "company": "Empresa Test",
    "source": "test",
    "landing_page": "https://d-seo.es/",
    "message": "Mensaje de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Lead recibido correctamente",
  "leadId": "uuid-del-lead"
}
```

---

### Paso 6: Verificar en Supabase

1. Ve a https://supabase.keepmyweb.com
2. Table Editor → Schema: dseo_admin
3. Tabla: leads
4. Deberías ver el lead de prueba

---

## Troubleshooting

### Error: "relation does not exist"
Asegúrate de que el schema `dseo_admin` y la tabla `leads` existen en Supabase.

### Error de conexión PostgreSQL
- Verifica que el contenedor de PostgreSQL está corriendo
- Comprueba que el puerto 5432 está accesible
- Si n8n está en Coolify y PostgreSQL en otro servicio, usa la IP interna

### No llegan los emails
- Verifica credenciales SMTP
- Revisa logs en n8n: **Executions** → selecciona la ejecución fallida
- Comprueba spam/correo no deseado

---

## Workflows Adicionales (Fases Futuras)

### FASE 4: Importación CSV
**Trigger**: Manual
**Nodos**:
1. Read Binary Files (lee CSV de uploads)
2. Spreadsheet File (convierte a JSON)
3. Function (limpia y normaliza datos)
4. Postgres (inserta en raw_keywords)

### FASE 5: Enriquecimiento
**Trigger**: Schedule (diario) o Manual
**Nodos**:
1. Postgres (lee keywords no procesadas)
2. Function (detecta intención, calcula prioridad)
3. Postgres (inserta en keywords_enriched)

### FASE 6: Search Console
**Trigger**: Schedule (3 AM diario)
**Nodos**:
1. HTTP Request (Google Search Console API)
2. Function (procesa datos)
3. Postgres (guarda en search_console_data)

---

## Variables del Workflow

El webhook acepta estos campos:

```json
{
  "email": "requerido",
  "name": "opcional",
  "company": "opcional",
  "phone": "opcional",
  "source": "opcional (default: website)",
  "landing_page": "opcional",
  "utm_source": "opcional",
  "utm_medium": "opcional",
  "utm_campaign": "opcional",
  "utm_content": "opcional",
  "message": "opcional",
  "lead_score": "opcional (calculado automáticamente)"
}
```

---

## URLs Importantes

- **Webhook Lead**: `https://n8n.keepmyweb.com/webhook/new-lead`
- **n8n Panel**: `https://n8n.keepmyweb.com`
- **Supabase**: `https://supabase.keepmyweb.com`
