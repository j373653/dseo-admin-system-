# AGENT.md - D-SEO Ecosystem Documentation

> **Última actualización:** 2026-02-19
> **Versión:** 1.0

---

## 1. Introducción

Este documento es la fuente de verdad para cualquier agente que trabaje en el ecosistema D-SEO. Contiene información sobre los dos sistemas principales, las habilidades disponibles, el contexto de negocio y las fases de desarrollo completadas.

---

## 2. Sistemas del Ecosistema

### 2.1 admin-dseo (Panel de Gestión SEO)

**Propósito:** Sistema interno de gestión de keywords, clustering, análisis de IA y estrategia de contenido.

**Ubicación:** `admin-dseo/`

**Stack:**
- Next.js 16 (App Router)
- TypeScript
- Supabase (Base de datos + Auth)
- Gemini AI (Análisis de keywords + Embeddings)
- Tailwind CSS

**Endpoints importantes:**
- `/admin` - Dashboard principal
- `/admin/keywords` - Gestión de keywords
- `/admin/keywords/overview` - Vista unificada de clusters
- `/admin/keywords/clusters` - Lista de clusters
- `/admin/keywords/clusters/[id]` - Detalle de cluster
- `/admin/keywords/import` - Importar keywords desde CSV
- `/admin/content` - Gestión de páginas de contenido
- `/admin/leads` - Gestión de leads
- `/api/ai/analyze-keywords` - Análisis de IA
- `/api/ai/generate-embeddings` - Generación de embeddings

**Base de datos (Supabase):**
- `d_seo_admin_raw_keywords` - Keywords importadas
- `d_seo_admin_keyword_clusters` - Clusters de keywords
- `d_seo_admin_content_pages` - Páginas de contenido
- `d_seo_admin_cluster_relations` - Relaciones entre clusters
- `d_seo_leads` - Leads capturados

### 2.2 d-seo-web (Web Corporativa)

**Propósito:** Web pública de la agencia D-SEO. **NO editable desde admin-dseo** - se mantiene manualmente o mediante otro agente.

**Ubicación:** `d-seo-web/`

**Stack:**
- Next.js 13.5.6 (App Router)
- React 18
- Tailwind CSS
- Framer Motion (animaciones)
- Three.js / React Three Fiber (3D)
- Lucide React (iconos)

**Configuración:**
```javascript
// next.config.js
{
  output: 'export',        // Static HTML export
  trailingSlash: true      // URLs con /
}
```

**Despliegue:** BanaHosting (carpeta `out/`)

**Sitemap (18 URLs protegidas):**
```
/, /servicios/, /servicios/sitios-web/, /servicios/sitios-web/legal/,
/servicios/sitios-web/wordpress/, /servicios/ecommerce/, /servicios/ia/,
/servicios/apps/, /servicios/seo/, /servicios/seo/local/,
/servicios/seo/ecommerce/, /servicios/seo/tecnico/, /servicios/seo/keyword-research/,
/servicios/sectores/, /legal/aviso-legal/, /legal/privacidad/, /legal/cookies/
```

**Patrón de componentes:**
- `page.tsx` (Server Component) → Exporta metadata + renderiza Client Component
- `XXXClient.tsx` (Client Component) → Lógica, animaciones, interactividad

---

## 3. Contexto de Negocio: D-SEO

### 3.1 Empresa

**Nombre:** D-SEO (Agencia de Marketing Digital)

**Misión:** Transformar pymes y autónomos a través de tecnología de vanguardia para aumentar su productividad y visibilidad digital.

### 3.2 Servicios Ofrecidos

Basados en el sitemap y la web corporativa:

| Servicio | Ruta | Descripción |
|----------|------|-------------|
| **Desarrollo Web** | `/servicios/sitios-web/` | Sitios web, WordPress, soluciones legales |
| **E-commerce** | `/servicios/ecommerce/` | Tiendas online |
| **Apps** | `/servicios/apps/` | Desarrollo de aplicaciones |
| **IA** | `/servicios/ia/` | Inteligencia artificial aplicada |
| **SEO** | `/servicios/seo/` | Posicionamiento web |
| **SEO Local** | `/servicios/seo/local/` | SEO para negocios locales |
| **SEO Ecommerce** | `/servicios/seo/ecommerce/` | SEO para tiendas online |
| **SEO Técnico** | `/servicios/seo/tecnico/` | Auditorías técnicas |
| **Keyword Research** | `/servicios/seo/keyword-research/` | Investigación de palabras clave |
| **Sectores** | `/servicios/sectores/` | Soluciones por sectores |

### 3.3 Clientes Objetivo

- **Pymes** (Pequeñas y medianas empresas)
- **Autónomos**
- **Sectores:** Servicios profesionales, comercio local, ecommerce, tecnología

### 3.4 Propuesta de Valor

- Ingeniería de posicionamiento real (no "magia")
- Enfoque en resultados medibles
- SEO sostenible a largo plazo
- Transformación digital completa

---

## 4. Habilidades Disponibles

Ubicación: `.agent/skills/`

### 4.1 SEO y Contenido

| Skill | Descripción |
|-------|-------------|
| **seo-clustering-keywords** | Organización de keywords en topic clusters, arquitectura pillar pages, estrategia de internal linking |
| **seo-content-writer** | Redacción de contenido optimizado para SEO, mejores prácticas, E-E-A-T |
| **seo-meta-optimizer** | Optimización de meta titles, descriptions, structured data |
| **seo-snippet-hunter** | Captura de featured snippets, FAQ optimization |
| **seo-structure-architect** | Arquitectura de información, siloing, site architecture |

### 4.2 Desarrollo y Diseño

| Skill | Descripción |
|-------|-------------|
| **frontend-developer** | Desarrollo Next.js, React, TypeScript, Tailwind |
| **web-design-guidelines** | Diseño UI/UX, accessibility (WCAG 2.1), mejores prácticas |
| **3d-web-experience** | Experiencias 3D con Three.js y React Three Fiber |

### 4.3 Especializadas

| Skill | Descripción |
|-------|-------------|
| **experto-legal-web** | Aspectos legales (RGPD, cookies, aviso legal) |
| **generador-de-habilidades** | Creación de nuevas habilidades cuando se necesite |

---

## 5. Modelos de IA

### Modelos Disponibles (Google AI Studio)

| Modelo | Uso Principal | RPM | RPD | Costo |
|--------|---------------|-----|-----|-------|
| **Gemini 2.5 Flash** | Clustering/Contenido | 1,000/min | 10,000/día | $0 |
| **Gemini 2.5 Flash Lite** | Procesamiento masivo | 4,000/min | Ilimitado | $0 |
| **Gemini 2.5 Pro** | Análisis complejo | 150/min | 1,000/día | $0 |
| **Gemini Embedding 1** | Similitud semántica | 3,000/min | Ilimitado | $0 |

### Selección por Tarea

| Tarea | Modelo Recomendado |
|-------|-------------------|
| Clustering keywords | Gemini 2.5 Flash |
| Embeddings | Gemini Embedding 1 |
| Generación contenido | Gemini 2.5 Flash |
| Análisis complejo | Gemini 2.5 Pro |
| Procesamiento masivo (>10k items) | Gemini 2.5 Flash Lite |

### Rate Limits a Respetar

- **PRO**: 150/min, 1,000/día (MUY LIMITADO - evitar para batch)
- **Flash**: 1,000/min, 10,000/día (balanceado)
- **Flash Lite**: 4,000/min, Ilimitado (para grandes volúmenes)
- **Embedding**: 3,000/min, Ilimitado (semántica)

### Estrategias Obligatorias

1. **Rate Limiting**: Implementar en todas las APIs que usen IA
2. **Batch Processing**: Usar lotes según volumen
   - < 50 keywords → 1 request
   - 50-200 → lotes de 50
   - 200-500 → lotes de 100
   - > 500 → lotes de 150-200
3. **Monitoreo**: Trackear requests diarios
4. **Fallback**: Plan B si se alcanzan límites

### Documento de Referencia

Ver `docs/AI_MODELS_GUIDE.md` para detalles completos sobre rates, estrategias y timeouts.

---

## 6. Fases de Desarrollo Completadas

### Fase 0: Infraestructura y Fixes
- [x] Schema de base de datos (soft delete, persistencia IA, jerarquía)
- [x] Fixes UI (loading states, prevenir duplicados)

**Archivos:**
- `docs/database/07_fase0_papelera_persistencia_jerarquia.sql`

### Fase 1: Página de Detalle de Cluster
- [x] Página de detalle con métricas
- [x] Gestión de keywords (mover, quitar, eliminar)
- [x] Acciones masivas con checkboxes
- [x] Búsqueda y filtros
- [x] Distribución de intenciones

**Archivos:**
- `admin-dseo/src/app/admin/keywords/clusters/[id]/page.tsx`

### Fase 2: Pillar Pages + Jerarquía
- [x] Configuración Pillar Page en detalle de cluster
- [x] Toggle "Es Pillar Page"
- [x] Campos: URL, Título, Estado, Notas
- [x] Selector de cluster padre
- [x] Indicador visual 📄 para Pillar Pages
- [x] Jerarquía visual con indentación
- [x] Detección de clusters huérfanos

**Archivos:**
- `admin-dseo/src/app/admin/keywords/clusters/page.tsx` (modificado)

### Fase 3: Embeddings + Content Strategy
- [x] Sistema de embeddings con Gemini
- [x] Tabla de relaciones entre clusters
- [x] Clasificación: Service / Blog / Landing
- [x] Scoring de prioridad (0-100)
- [x] Detección de canibalizaciones
- [x] Sugerencias de links internos
- [x] Dashboard de estrategia

**Archivos:**
- `docs/database/09_embeddings_strategy.sql`
- `admin-dseo/src/app/api/ai/generate-embeddings/route.ts`
- `admin-dseo/src/app/admin/keywords/strategy/page.tsx`

### Fase 4: Importar CSV + Descartar Keywords
- [x] Menú "Importar CSV" en sidebar
- [x] Importación smart: ignora keywords existentes (pending/clustered)
- [x] Reactivación: keywords descartadas se reactivan al importar de nuevo
- [x] Botón "Descartar" en Overview (marca keywords como discarded)
- [x] Cálculo automático de search_volume_total al crear clusters
- [x] Filtros por intención (transactional, commercial, informational, navigational)
- [x] Ordenación por priority, volume, keywords, name
- [x] Propuesta automática de pilares

**Archivos:**
- `admin-dseo/src/app/admin/layout.tsx` (menú)
- `admin-dseo/src/app/admin/keywords/import/page.tsx` (lógica importación)
- `admin-dseo/src/app/admin/keywords/overview/page.tsx` (descartar, filtros, ordenación)

---

## 7. Integración Futura (Roadmap)

### 7.1 Visión General

```
admin-dseo (CMS Headless)  →  d-seo-web (Web Pública)
         │
         ├── Keywords importadas
         ├── Clustering (IA)
         ├── Pillar Pages
         ├── Embeddings + Estrategia
         │
         └── [FUTURO] → Generación de contenido → Publicación en d-seo-web
```

### 6.2 Próximos Pasos Sugeridos

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| Alta | **Generación de Contenido** | Usar IA para generar contenido basado en clusters |
| Alta | **Editor de Páginas** | Interfaz para editar contenido antes de publicar |
| Media | **Publicación Automatizada** | Conexión con d-seo-web para publicar páginas |
| Media | **Blog** | Añadir sección blog al sitemap |
| Baja | **Analytics** | Seguimiento de rendimiento de contenido |

### 7.3 Notas sobre Integración

- Las 18 URLs del sitemap están **protegidas** y no deben modificarse
- Las nuevas páginas pueden usar estructura:
  - `/blog/[slug]/` - Para contenido informativo
  - `/servicios/[categoria]/[slug]/` - Para páginas de servicio
- El sistema actual detecta automáticamente si una URL está protegida

---

## 8. Variables de Entorno

### admin-dseo
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
GOOGLE_AI_API_KEY=...
```

### d-seo-web
```
# No requiere variables de entorno (static export)
```

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Cluster** | Grupo de keywords relacionadas semánticamente |
| **Pillar Page** | Página principal de un topic cluster |
| **Embedding** | Vector numérico que representa el significado de un texto |
| **Canibalización** | Cuando dos páginas compiten por las mismas keywords |
| **Search Intent** | Intención de búsqueda (informational, transactional, commercial, navigational) |
| **Static Export** | Generación de HTML estático (no requiere servidor) |

---

## 10. Notas para Agentes

### 9.1 Reglas de Oro

1. **NO editar d-seo-web** sin autorización explícita - es mantenido manualmente
2. **Proteger las 18 URLs** del sitemap - nunca sobreescribir
3. **Usar habilidades** disponibles para tareas específicas
4. **Actualizar este documento** cuando haya cambios significativos

### 9.2 Stack de admin-dseo

- Next.js 16 con App Router
- TypeScript strict
- Tailwind CSS para estilos
- Supabase para datos
- Gemini AI para análisis

### 9.3 Stack de d-seo-web

- Next.js 13.5.6 con App Router
- Static Export (output: 'export')
- Framer Motion para animaciones
- Three.js para elementos 3D

---

## 11. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-02-19 | 1.1 | Añadido Fase 4: Importar CSV + Descartar Keywords |
| 2026-02-19 | 1.0 | Versión inicial del documento |

---

*Documento generado automáticamente para el ecosistema D-SEO*
