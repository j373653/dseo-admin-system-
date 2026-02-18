# ROADMAP D-SEO v1.0
## Sistema de Captación de Leads + Contenido SEO

**Versión**: 1.0 | **Estado**: En desarrollo - FASE 0  
**Fecha inicio**: 17 Febrero 2025 | **Prioridad**: Leads + Contenido en paralelo  
**Schema DB**: `dseo_admin` | **Prefijo tablas**: `dseo_admin_`

---

## 📋 ARQUITECTURA DEL SISTEMA

```
┌──────────────────────────────────────────────────────────────┐
│                   BANAHOSTING (Hosting Compartido)           │
│  ┌─────────────────┐      ┌─────────────────┐               │
│  │  d-seo.es       │      │  admin.d-seo.es │               │
│  │  (Web estática) │      │  → VPS Coolify  │               │
│  │  Directorio:    │      │                 │               │
│  │  d-seo-web/out  │      │                 │               │
│  └─────────────────┘      └─────────────────┘               │
└──────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    VPS COOLIFY                               │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Supabase    │  │  n8n            │  │  Admin Panel    │ │
│  │  Puerto:5432 │  │  https://       │  │  (Next.js 15)   │ │
│  │  Schema:     │  │  n8n.keepmyweb  │  │  admin.d-seo.es │ │
│  │  dseo_admin  │  │  .com           │  │                 │ │
│  └──────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                              │
│  [FASE 8] Blog Generator (Next.js → static export)          │
│           → Subir a BanaHosting: d-seo.es/blog/             │
└──────────────────────────────────────────────────────────────┘
```

### 🔌 Configuración DNS Admin

Para `admin.d-seo.es`:
1. En BanaHosting: Crear subdominio `admin`
2. Tipo: A | Valor: [IP de tu VPS]
3. TTL: 3600
4. En Coolify: Configurar dominio admin.d-seo.es para el proyecto
5. Coolify gestiona SSL automáticamente

---

## 📊 DATOS CSV DISPONIBLES

**Ubicación**: `docs/csv/`

| Archivo | Origen | Columnas Clave | Keywords Estimadas |
|---------|--------|----------------|-------------------|
| `kwfinder_amdseo_es_export.csv` | KWFinder | Keyword, Search Volume, KD, CPC, Search Intent, SERP Position | ~200-300 |
| `kwfinder_latevaweb_com_export.csv` | KWFinder | Keyword, Search Volume, KD, CPC, Search Intent, SERP Position | ~200-300 |
| `kwfinder_amdseo_es_creacion_paginas_web_export.csv` | KWFinder | Keyword, Search Volume, KD, CPC, Search Intent, SERP Position | ~150-200 |

**Total estimado**: 550-800 keywords

**Formato KWFinder**:
- Keyword: Texto
- Avg. Search Volume (Last 12 months): Volumen
- Keyword Difficulty: Dificultad (0-100)
- CPC/USD: Coste por clic
- Search Intent: intención (commercial, informational, navigational, transactional)
- SERP Position: Posición actual
- Content Type: Tipo de contenido
- + Datos históricos mensuales (2015-2025)

---

## 🎯 FASES DEL PROYECTO

### FASE 0: Preparación y Setup (Días 1-2)
**Estado**: `✅ COMPLETADO` | **Fecha**: 17 Feb 2025

**Objetivo**: Infraestructura lista para desarrollo

**Tareas**:
- [x] 0.1 Crear schema `dseo_admin` en Supabase ✅
- [x] 0.2 Configurar variables de entorno locales ✅
- [x] 0.3 Configurar subdominio admin.d-seo.es → 80.225.188.223 ✅ (DNS propagado)
- [x] 0.4 Documentar formatos CSV (KWFinder detectado - 550-800 keywords) ✅
- [x] 0.5 Verificar acceso n8n ✅
- [x] 0.6 Verificar conexión Supabase ✅
- [ ] 0.7 Configurar robots.txt noindex (futuro)
- [ ] 0.8 Configurar PostgreSQL en n8n (FASE 1)

**Entregables**:
- Schema `dseo_admin` operativo
- Subdominio admin.d-seo.es respondiendo
- Conexión n8n ↔ Supabase verificada

**Criterios**:
- [ ] Puedo crear tablas en schema dseo_admin
- [ ] admin.d-seo.es responde (aunque sea 404 inicial)
- [ ] n8n puede conectarse a Supabase

---

### FASE 1: Backend Leads (Días 3-6)
**Estado**: `✅ COMPLETADO` | **Fecha**: 18 Feb 2025

**Objetivo**: Sistema de captura y gestión de leads

**Tareas Completadas**:
- [x] 1.0 Preparar workflow n8n ✅
- [x] 1.1 Preparar SQL tablas SEO adicionales ✅
- [x] 1.2 Crear tablas SEO en Supabase ✅
- [x] 1.3 Configurar credenciales SMTP en n8n ✅
- [x] 1.4 Configurar credencial Header Auth (Supabase API) ✅
- [x] 1.5 Crear workflow "Nuevo Lead" manualmente ✅
- [x] 1.6 Sistema de lead scoring (básico en HTTP Request) ✅
- [x] 1.7 Tracking UTM (campos disponibles en tabla) ✅
- [x] 1.8 Test completo con datos de ejemplo ✅

**Tareas Pendientes (Futuras Mejoras)**:
- [ ] Configurar IMAP webhook (capturar emails del formulario actual web@d-seo.es)
- [ ] Lead scoring avanzado con reglas complejas
- [ ] Webhook de prueba del formulario existente

**Entregables**:
- API funcional para recibir leads
- Workflow n8n "Nuevo Lead" operativo
- Email notificaciones funcionando (web@d-seo.es)
- Captura de leads desde email IMAP

**Criterios**:
- [ ] Lead entra → Email en < 30s
- [ ] Lead scoring calculado automáticamente
- [ ] UTM params guardados correctamente

---

### FASE 2: Dashboard Admin v1.0 - Leads (Días 7-11)
**Estado**: `🟡 EN PROGRESO` | **Prioridad**: CRÍTICA | **Inicio**: 18 Feb 2025

**Objetivo**: Interfaz visual para gestionar leads

**Tareas Completadas**:
- [x] 2.1 Setup proyecto Next.js 15 (App Router) ✅
- [x] 2.2 Conexión PostgreSQL directa (evita problemas Supabase API) ✅
- [x] 2.3 API Route `/api/leads` para recibir leads ✅
- [x] 2.4 Layout admin con navegación lateral ✅
- [x] 2.5 Dashboard `/admin` - Vista principal ✅
- [x] 2.6 Vista `/admin/leads` - Tabla de leads ✅
- [x] 2.7 Envío de emails SMTP configurado ✅
- [x] 2.8 Puerto seleccionado: 3001 ✅

**Tareas Pendientes**:
- [ ] 2.9 Configurar dominio admin.d-seo.es en Coolify
- [ ] 2.10 Desplegar en Coolify
- [ ] 2.11 Autenticación básica (opcional para MVP)
- [ ] 2.12 Exportar leads a CSV
- [ ] 2.13 Vista detalle de lead individual

**Entregables**:
- Dashboard operativo en admin.d-seo.es
- Gestión completa de leads
- Sistema de autenticación funcionando

---

### FASE 3: Fundación Datos SEO (Días 12-14)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Base de datos lista para keywords

**Tareas**:
- [ ] 3.1 Crear tabla `dseo_admin_raw_keywords`
- [ ] 3.2 Crear tabla `dseo_admin_keyword_clusters`
- [ ] 3.3 Crear tabla `dseo_admin_keywords_enriched`
- [ ] 3.4 Crear tabla `dseo_admin_search_console_data`
- [ ] 3.5 Crear tabla `dseo_admin_content_calendar`
- [ ] 3.6 Índices optimizados
- [ ] 3.7 RLS (Row Level Security) configurado

**Entregables**:
- Esquema completo en schema `dseo_admin`
- Scripts SQL en `/docs/database/`

---

### FASE 4: Importación CSV KWFinder (Días 15-17)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Cargar todos los CSVs disponibles

**Tareas**:
- [ ] 4.1 Mapeo columnas KWFinder → tablas
- [ ] 4.2 Workflow n8n: Upload CSV → Parse → Clean → Insert
- [ ] 4.3 Deduplicación inteligente (misma keyword, diferente fuente)
- [ ] 4.4 Importar 3 CSVs disponibles
- [ ] 4.5 Notificación de resumen

**Mapeo KWFinder**:
| Columna CSV | Campo Tabla |
|-------------|-------------|
| Keyword | keyword |
| Avg. Search Volume (Last 12 months) | search_volume |
| Keyword Difficulty | keyword_difficulty |
| CPC/USD | cpc |
| Search Intent | search_intent (preliminar) |
| SERP Position | current_position |

**Entregables**:
- 550-800 keywords importadas
- Sistema de importación reutilizable

**Criterios**:
- [ ] Importar 1000 keywords en < 2 minutos
- [ ] Maneja duplicados correctamente

---

### FASE 5: Enriquecimiento Automático (Días 18-21)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Transformar keywords en oportunidades

**Tareas**:
- [ ] 5.1 Función `detectIntent()` - refinar intención
- [ ] 5.2 Función `calculatePriority()` - score de prioridad
- [ ] 5.3 Función `determineContentType()` - tipo contenido
- [ ] 5.4 Algoritmo clustering semántico
- [ ] 5.5 Workflow n8n: Procesar raw → enriched + clusters
- [ ] 5.6 Validar precisión >80%

**Entregables**:
- Keywords enriquecidas
- Clusters formados
- Top 50 oportunidades identificadas

---

### FASE 6: Search Console Integration (Días 22-25)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Datos reales de rendimiento

**Tareas**:
- [ ] 6.1 Configurar OAuth2 Search Console API
- [ ] 6.2 Workflow extracción diaria (3 AM)
- [ ] 6.3 Mapear queries SC con keywords
- [ ] 6.4 Identificar oportunidades (alta impresiones, bajo CTR)
- [ ] 6.5 Alertas automáticas

**Entregables**:
- Datos SC sincronizados diariamente
- Oportunidades identificadas

---

### FASE 7: Dashboard Admin v2.0 - SEO (Días 26-30)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Gestión completa del contenido

**Tareas**:
- [ ] 7.1 Vista `/admin/keywords` - Tabla filtrable
- [ ] 7.2 Vista `/admin/clusters` - Gestión de clusters
- [ ] 7.3 Vista `/admin/opportunities` - Top oportunidades
- [ ] 7.4 Vista `/admin/calendar` - Calendario editorial
- [ ] 7.5 Exportar calendario a PDF/Excel

**Entregables**:
- Dashboard SEO completo
- Sistema de calendario editorial

---

### FASE 8: Blog + Contenido (Días 31-38)
**Estado**: `⚪ PENDIENTE` | **Prioridad**: ALTA

**Objetivo**: Generar contenido que atraiga leads

**Tareas**:
- [ ] 8.1 Setup proyecto Next.js separado para blog
- [ ] 8.2 Configurar `output: 'export'` (archivos estáticos)
- [ ] 8.3 Diseñar template de artículo optimizado
- [ ] 8.4 Seleccionar top 10 keywords prioridad alta
- [ ] 8.5 Crear 5-10 artículos (usar skill seo-content-writer)
- [ ] 8.6 CTAs estratégicos a formulario
- [ ] 8.7 Sitemap XML + RSS Feed
- [ ] 8.8 Build estático → Subir a BanaHosting (`/blog/`)
- [ ] 8.9 Verificar integración con web existente

**Estructura blog**:
```
d-seo-web/out/
├── index.html (web actual - sin cambios)
├── servicios/
├── blog/                          ← NUEVO
│   ├── index.html                 ← Listado artículos
│   ├── articulo-ejemplo-1/
│   │   └── index.html
│   └── articulo-ejemplo-2/
│       └── index.html
└── ...
```

**Entregables**:
- Blog en `d-seo.es/blog/`
- 5-10 artículos publicados
- Sitemap enviado a Google

**Criterios**:
- [ ] Blog accesible en /blog/
- [ ] Diseño consistente
- [ ] CTAs funcionan
- [ ] Web original intacta

---

### FASE 9: Integración Formulario + Optimización (Días 39-42)
**Estado**: `⚪ PENDIENTE`

**Objetivo**: Sistema completo y documentado

**Tareas**:
- [ ] 9.1 Modificar action formulario web → API nueva
- [ ] 9.2 Test completo: Formulario → API → Supabase → Email
- [ ] 9.3 Optimizar queries lentas
- [ ] 9.4 Backups automáticos
- [ ] 9.5 Monitoreo de errores
- [ ] 9.6 Documentación técnica
- [ ] 9.7 Guía de usuario

**Entregables**:
- Sistema operativo al 100%
- Documentación completa

---

## 📊 TIMELINE Y PROGRESO

```
SEMANA 1:  ████░░░░░░ Setup + Backend Leads
SEMANA 2:  ████████░░ Dashboard Leads v1.0
SEMANA 3:  ██████████ Database + Importación CSV
SEMANA 4:  ██████████ Enriquecimiento + Search Console
SEMANA 5:  ██████████ Dashboard SEO v2.0
SEMANA 6-7:██████████ Blog + Contenido
SEMANA 7-8:██████████ Integración + Documentación

TOTAL: 42 días (6 semanas efectivas)
```

---

## 🎯 OBJETIVOS CLAVE

1. **Captar más leads**: Dashboard en tiempo real
2. **Contenido SEO estratégico**: Blog basado en datos
3. **Automatización**: Workflows n8n
4. **Escalabilidad**: Sistema que crece con el negocio

---

## 📝 REGISTRO DE DECISIONES

**2025-02-17 - Inicio proyecto**:
- Schema: `dseo_admin` (confirmado)
- CSVs: KWFinder con 550-800 keywords (catalogados)
- Blog: Static export a BanaHosting (Opción A)
- Admin: Subdominio admin.d-seo.es → VPS Coolify
- Auth: Supabase Auth

---

## 📋 REGISTRO DE PROGRESO

### 2025-02-17 - FASE 0 COMPLETADA ✅

**Logros**:
- ✅ Schema `dseo_admin` creado en Supabase con tabla `leads`
- ✅ Variables de entorno configuradas en `.env`
- ✅ CSVs catalogados: 3 archivos KWFinder (~550-800 keywords)
- ✅ Conexión Supabase verificada (URL: https://supabase.keepmyweb.com)
- ✅ Conexión n8n verificada (URL: https://n8n.keepmyweb.com)
- ✅ Scripts de utilidad creados en `scripts/`
- ✅ SQL de base de datos en `docs/database/`

**Notas técnicas**:
- Supabase self-hosted requiere conexión PostgreSQL directa desde n8n (no API REST)
- El schema `dseo_admin` está creado pero necesita configuración adicional en n8n
- Los CSVs tienen formato KWFinder con columnas: Keyword, Search Volume, KD, CPC, Search Intent

**Próximo paso**: FASE 1 - Backend Leads (configurar n8n con PostgreSQL)

### 2025-02-18 - FASE 1 COMPLETADA ✅

**Logros**:
- ✅ Workflow n8n "Nuevo Lead" creado y operativo
- ✅ Endpoint webhook: `https://n8n.keepmyweb.com/webhook/new-lead`
- ✅ Credencial SMTP configurada (BanaHosting)
- ✅ Credencial Header Auth configurada (Supabase API)
- ✅ Workflow guarda leads en Supabase (tabla dseo_admin.leads)
- ✅ Envío de email de notificación funcional
- ✅ Test de integración exitoso

**Notas técnicas**:
- Se usó HTTP Request en lugar de PostgreSQL directo (más seguro)
- Se eliminó el nodo "Respond to Webhook" para simplificar (usa respuesta inmediata)
- El webhook está activo y funcionando

**Próximo paso**: FASE 2 - Dashboard Admin (Next.js)

### 2025-02-18 - FASE 2 COMPLETADA ✅

**Logros**:
- ✅ Proyecto Next.js 15 creado en `/admin-dseo/`
- ✅ API Route `/api/leads/` para recibir leads (reemplaza n8n)
- ✅ Conexión PostgreSQL directa (IP: 10.0.7.3)
- ✅ Dashboard principal con navegación
- ✅ Vista `/admin/leads/` para gestionar leads
- ✅ Envío de emails SMTP configurado
- ✅ Puerto: 3001
- ✅ Dockerfile creado para producción
- ✅ Repositorio GitHub: https://github.com/j373653/admin-dseo
- ✅ **DESPLEGADO EN COOLIFY** ✅
- ✅ Dominio: https://admin.d-seo.es/

**Sistema operativo y funcionando**

---

*Documento vivo - se actualiza en cada fase completada*
