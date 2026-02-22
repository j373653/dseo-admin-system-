# Modelos de IA - Guía de Selección y Rate Limits

## 📋 Resumen Ejecutivo

Documento técnico unificado para el sistema D-SEO. Define las reglas para:
1. **Selección de modelos** según tarea y volumen
2. **Workflow 3 pasos**: Extracción → Clustering → Silos
3. **Contexto empresarial** para filtrado automático
4. **Rate limits** y estrategias de batching

---

## 🎯 Modelo de Orquestación

### Workflow 3 Pasos

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. EXTRACCIÓN │ → │  2. CLUSTER    │ → │   3. SILOS     │
│  (Filtrado)      │    │  (Semántico)    │    │ (Arquitectura)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ↓                      ↓                      ↓
  Gemini 2.5 Flash       Gemini 2.5 Flash       Gemini 2.5 Pro
  Lite / Flash           (batching)           (alto razonamiento)
  200-500 kws           50-100 kws            1-5 silos
```

| Paso | Modelo | Lote | Función | Estado |
|------|--------|------|---------|--------|
| 1 | Gemini 2.5 Flash Lite | 200-500 | Limpiar, dedupe, filtrar off-topic, clasificar intent | ✅ Implementado |
| 2 | Gemini 2.5 Flash | 50-100 | Clusters semánticos, detectar intención | ✅ Parcial |
| 3 | Gemini 2.5 Pro | 1-5 | Arquitectura SILO + enlazado interno | ✅ Parcial |

---

## 📊 Modelos Disponibles

### **1. Gemini 2.5 Flash Lite** ⭐ Extracción Masiva
- **RPM**: 4,000 requests/minuto
- **TPM**: 4,000,000 tokens/minuto
- **RPD**: Ilimitado
- **Contexto**: 1M tokens
- **Costo**: $0 (gratuito)

**Uso**:
- Paso 1: Extracción y filtrado de keywords
- Procesamiento masivo (>500 keywords)
- Clasificación inicial de intent

**Batching**:
```javascript
if (keywords <= 50) → 1 request
if (keywords <= 200) → batches de 50
if (keywords <= 500) → batches de 100
if (keywords > 500) → batches de 150
```

---

### **2. Gemini 2.5 Flash** ⭐ Clustering
- **RPM**: 1,000 requests/minuto
- **TPM**: 1,000,000 tokens/minuto
- **RPD**: 10,000 requests/día
- **Contexto**: 1M tokens
- **Costo**: $0 (gratuito)

**Uso**:
- Paso 2: Crear clusters semánticos
- Procesamiento de texto con buena precisión
- Hasta ~10,000 keywords/día

---

### **3. Gemini 2.5 Pro** ⭐ Arquitectura SILO
- **RPM**: 150 requests/minuto
- **TPM**: 2,000,000 tokens/minuto
- **RPD**: 1,000 requests/día
- **Contexto**: 2M tokens
- **Costo**: $0 (gratuito)

**Uso**:
- Paso 3: Diseñar estructura SILO
- Análisis complejo que requiere máxima precisión
- Pocos requests pero de alta calidad
- **NO usar para**: Procesamiento en masa

---

## 🏢 Contexto Empresarial

### Datos Almacenados

El sistema guarda en `d_seo_admin_company_context`:

```json
{
  "theme": "Desarrollo Web, SEO, Marketing Digital, Apps, IA",
  "services": [
    "Creación sitios web (WordPress y a medida)",
    "Tiendas online (WooCommerce y custom)",
    "SEO (general, local, ecommerce, técnico)",
    "Apps móviles y PWAs",
    "Inteligencia Artificial y Chatbots"
  ],
  "target_companies": ["PYMEs", "Autónomos", "Startups"],
  "sitemap_urls": [
    "https://d-seo.es/",
    "https://d-seo.es/servicios/",
    ...
  ],
  "discard_topics": [
    "redes sociales",
    "facebook",
    "instagram",
    "ads",
    "google ads",
    "hosting",
    "dominios"
  ]
}
```

### Uso en Prompts

Cada llamada a Gemini incluye:
```
CONTEXTO DE LA EMPRESA:
- Tema: {theme}
- Servicios: {services}
- Clientes: {target_companies}
- NO trabajar con: {discard_topics}

SITUACIÓN ACTUAL DEL SITEMAP:
{列表 de URLs actuales}

INSTRUCCIONES:
1. Descarta keywords off-topic
2. No propongas páginas que ya existen
3. Evita cannibalización
```

---

## 🛠️ Protocolo de Ejecución

### Paso 1: Extracción / Filtrado

```typescript
// API: POST /api/seo/filter-by-topic
// Usa contexto de la DB para filtrar keywords
// Descarta: off-topic, duplicados, errores
// Clasifica: intent (informational/transactional/commercial)
```

**Modelo**: Gemini 2.5 Flash Lite
**Lote**: 200-500 keywords
**Salida**: Lista de keywords válidas

---

### Paso 2: Clustering Semántico

```typescript
// API: POST /api/seo/cluster
// Agrupa keywords por semántica
// Detecta intención de búsqueda
// Calcula prioridad (search volume)
```

**Modelo**: Gemini 2.5 Flash
**Lote**: 50-100 keywords
**Salida**: Clusters con keywords asociadas

---

### Paso 3: Arquitectura SILO

```typescript
// API: POST /api/seo/silos/build
// Diseña estructura SILO
// Define pillar pages
// Plan de enlazado interno
```

**Modelo**: Gemini 2.5 Pro
**Lote**: 1-5 silos por request
**Salida**: Estructura SILO completa

---

## ⚙️ Configuración de Modelos en Supabase

Los modelos IA se configuran en la tabla `d_seo_admin_ai_config`:

```sql
SELECT * FROM d_seo_admin_ai_config;
```

| task | model | parameters |
|------|-------|------------|
| filter | gemini-2.5-flash-lite | {"maxTokens": 4000} |
| cluster | gemini-2.5-flash | {"maxTokens": 8000} |
| silo | gemini-2.5-pro | {"maxTokens": 20000, "temperature": 0.3} |

### APIs de Gestión

| API | Método | Función |
|-----|--------|---------|
| `/api/seo/ai-config` | GET | Obtener configuración actual |
| `/api/seo/ai-config` | PATCH | Actualizar modelo para una tarea |

### ⚠️ IMPORTANTE: Usar siempre el modelo correcto

**Reglas de oro:**
1. **Filtrado (filter)**: Usar `gemini-2.5-flash-lite` - rápido, RPD ilimitado
2. **Clustering (cluster)**: Usar `gemini-2.5-flash` - balance precisión/velocidad
3. **SILO (silo)**: Usar `gemini-2.5-pro` - máximo razonamiento para JSON complejo

**No usar Flash Lite para SILO** - el JSON se truncará.

---

## ⚠️ Rate Limits - Límites a Respetar

### Hard Limits (No negociables)

| Modelo | RPM | RPD | Crítico |
|--------|-----|-----|---------|
| Gemini 2.5 Flash Lite | 4,000 | ∞ | ✅ No |
| Gemini 2.5 Flash | 1,000 | 10,000 | ⚠️ Medio |
| Gemini 2.5 Pro | 150 | 1,000 | 🔴 Sí |

### Estrategias

```typescript
// Rate limiter para Pro
class RateLimiter {
  private minuteRequests = []
  private dayRequests = []
  
  async checkLimit(rpm: number, rpd: number) {
    const now = Date.now()
    this.minuteRequests = this.minuteRequests.filter(t => now - t < 60000)
    this.dayRequests = this.dayRequests.filter(t => now - t < 86400000)
    
    if (this.minuteRequests.length >= rpm) {
      await sleep(60000 - (now - this.minuteRequests[0]))
    }
    if (this.dayRequests.length >= rpd) {
      throw new Error('RPD limit reached')
    }
    
    this.minuteRequests.push(now)
    this.dayRequests.push(now)
  }
}
```

---

## 📈 Matriz de Decisión

### Según volumen de datos:

| Volumen | Modelo | Lote | Tiempo Est. |
|---------|--------|------|-------------|
| < 50 | Gemini 2.5 Flash | Todo | 10-20s |
| 50-200 | Gemini 2.5 Flash | 50 | 30-60s |
| 200-500 | Gemini 2.5 Flash Lite | 100 | 1-2min |
| 500-1,000 | Gemini 2.5 Flash Lite | 150 | 2-5min |
| 1,000-5,000 | Gemini 2.5 Flash Lite | 200 | 3-8min |

### Según tipo de tarea:

| Tarea | Modelo | Razón |
|-------|--------|-------|
| **Filtrado off-topic** | Gemini 2.5 Flash Lite | Velocidad + RPD ilimitado |
| **Clustering** | Gemini 2.5 Flash | Balance precisión/velocidad |
| **Arquitectura SILO** | Gemini 2.5 Pro | Máxima calidad de razonamiento |
| **Generación contenido** | Gemini 2.5 Flash | Buena calidad, buenos límites |

---

## 🔧 APIs del Sistema

| API | Método | Función |
|-----|--------|---------|
| `/api/seo/keywords` | GET/PATCH | CRUD keywords |
| `/api/seo/filter-by-topic` | POST | Filtrar por temática |
| `/api/seo/analyze-proposal` | POST | Generar propuesta SILO |
| `/api/seo/apply-proposal` | POST | Aplicar propuesta |
| `/api/seo/context` | GET/PATCH | Gestionar contexto |
| `/api/seo/silos` | GET/POST | Gestionar silos |

---

## 📊 Campos en Base de Datos

### `d_seo_admin_raw_keywords`

```sql
ALTER TABLE d_seo_admin_raw_keywords ADD COLUMN semantic_cluster_id UUID;
ALTER TABLE d_seo_admin_raw_keywords ADD COLUMN clustering_confidence FLOAT;
ALTER TABLE d_seo_admin_raw_keywords ADD COLUMN clustering_step VARCHAR(20);
ALTER TABLE d_seo_admin_raw_keywords ADD COLUMN discard_reason TEXT;
```

### `d_seo_admin_company_context`

```sql
CREATE TABLE d_seo_admin_company_context (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ
);
```

---

## ✅ Checklist para Implementación

- [x] Contexto empresarial en DB
- [x] API de filtrado con contexto
- [x] API de análisis SILO con contexto
- [ ] API de clustering (en desarrollo)
- [ ] UI de configuración de contexto
- [ ] Sistema de rate limiting
- [ ] Monitoreo de uso

---

## 📚 Referencias

- **Google AI Studio**: https://aistudio.google.com/app/apikey
- **Rate Limits Docs**: https://ai.google.dev/gemini-api/docs/rate-limits
- **Pricing**: https://ai.google.dev/pricing

---

**Última actualización**: 2026-02-22
**Versión**: 2.0 (Workflow 3 pasos)
