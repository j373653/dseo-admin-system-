# DESPLIEGUE EN COOLIFY - Admin D-SEO
# Puerto: 3001

## PASO 1: Crear Nuevo Servicio en Coolify

1. Ve a Coolify Dashboard
2. Click en "New Project" o "New Service"
3. Selecciona "Application"
4. Nombre: `admin-dseo`
5. Environment: `production`

## PASO 2: Configurar Source

**Opción A - Git (recomendada):**
- Source: Git
- Repository URL: [URL de tu repo git]
- Branch: main

**Opción B - Manual:**
- Source: Docker Compose o Dockerfile
- Subir archivos manualmente

## PASO 3: Variables de Entorno (Environment Variables)

Añade estas variables en Coolify → Settings → Environment Variables:

```
# PostgreSQL (IP interna del contenedor)
DB_HOST=10.0.7.3
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xV4L26R1a5oSjUh5sr60ZGSpe4dGHhO3

# SMTP (BanaHosting)
SMTP_HOST=mail.d-seo.es
SMTP_PORT=465
SMTP_USER=web@d-seo.es
SMTP_PASSWORD=Kale@80000
SMTP_FROM=web@d-seo.es
```

## PASO 4: Configurar Puerto

1. Ve a Settings → Ports
2. Add Port:
   - Port: 3001
   - Make it publicly available: ✅ (check)
3. Save

## PASO 5: Dominio

1. Ve a Settings → Domains
2. Add Domain:
   - Domain: admin.d-seo.es
   - Port: 3001
3. Save

## PASO 6: Build Settings

Si Coolify no detecta automáticamente:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Dockerfile** (alternativa si no funciona automático):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## PASO 7: Deploy

1. Click en "Deploy"
2. Esperar a que termine el build
3. Verificar que el servicio esté "Running"

## PASO 8: Verificación

Una vez desplegado, prueba:

**Panel Admin:**
```
https://admin.d-seo.es/
```

**API de Leads (Webhook):**
```bash
curl -X POST https://admin.d-seo.es/api/leads/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","company":"Test Company"}'
```

**Verificar email recibido en:** web@d-seo.es

## TROUBLESHOOTING

### Error: Cannot connect to PostgreSQL
- Verificar que DB_HOST=10.0.7.3 es correcto
- Ejecutar en VPS: `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' [contenedor-postgres]`
- Actualizar IP si cambió

### Error: Port already in use
- Cambiar a otro puerto disponible (3002, 3003, etc.)
- Verificar: `sudo netstat -tlnp | grep 3001`

### Error: Build fails
- Verificar que package.json tiene todos los scripts necesarios
- Revisar logs de build en Coolify

## ESTRUCTURA FINAL

```
https://admin.d-seo.es/           ← Dashboard Admin
https://admin.d-seo.es/admin/leads/  ← Lista de leads
https://admin.d-seo.es/api/leads/    ← API para recibir leads (POST)
```

## NOTAS IMPORTANTES

1. **PostgreSQL**: La conexión usa IP interna (10.0.7.3) porque admin-dseo y PostgreSQL están en el mismo servidor
2. **Seguridad**: El panel no tiene autenticación todavía (se añade en FASE 3)
3. **Backups**: Configurar backups de la base de datos en Supabase
4. **SSL**: Coolify gestiona automáticamente SSL para admin.d-seo.es

## PRÓXIMAS MEJORAS (FASE 3)

- [ ] Autenticación (login/password)
- [ ] Gestión de keywords
- [ ] Calendario editorial
- [ ] Importación de CSVs
- [ ] Integración con Search Console
