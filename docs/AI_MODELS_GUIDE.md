# Modelos de IA - Guía de Selección y Rate Limits

## 📋 Resumen Ejecutivo

Documento técnico para tomar decisiones informadas sobre qué modelo de IA usar según la funcionalidad, volumen de datos y rate limits.

## 🎯 Modelos Disponibles (Google AI Studio)

### **Para Análisis de Keywords / Clustering (Texto)**

#### **1. Gemini 2.5 Flash** ⭐ RECOMENDADO
- **RPM**: 1,000 requests/minuto
- **TPM**: 1,000,000 tokens/minuto
- **RPD**: 10,000 requests/día
- **Contexto**: 1M tokens
- **Costo**: $0 (gratuito)
- **Uso actual**: ✅ Clustering de keywords

**Cuándo usar**:
- Análisis de keywords (clustering, intención)
- Generación de contenido SEO
- Procesamiento de texto en lote
- Hasta ~10,000 keywords/día

**Estrategia de lotes**:
```javascript
if (keywords <= 50) → 1 lote (único)
if (keywords <= 200) → lotes de 50
if (keywords <= 500) → lotes de 100
if (keywords > 500) → lotes de 150
```

---

#### **2. Gemini 2.5 Flash Lite**
- **RPM**: 4,000 requests/minuto (¡4x más!)
- **TPM**: 4,000,000 tokens/minuto
- **RPD**: Ilimitado
- **Contexto**: 1M tokens
- **Costo**: $0 (gratuito)

**Cuándo usar**:
- Procesamiento masivo (más de 10,000 items)
- Tareas donde la velocidad > precisión
- Operaciones paralelas intensivas
- Cuando necesites más RPM que el Flash normal

**Trade-off**: Ligeramente menos preciso que Flash normal, pero mucho más rápido

---

#### **3. Gemini 2.5 Pro**
- **RPM**: 150 requests/minuto (limitado)
- **TPM**: 2,000,000 tokens/minuto
- **RPD**: 1,000 requests/día
- **Contexto**: 2M tokens
- **Costo**: $0 (gratuito)

**Cuándo usar**:
- Análisis complejos que requieren máxima precisión
- pocos requests pero de alta calidad
- Cuando 2M de contexto sean necesarios
- **NO usar para**: Procesamiento en masa (rate limits muy bajos)

---

### **Para Embeddings / Similitud Semántica**

#### **Gemini Embedding 1**
- **RPM**: 3,000 requests/minuto
- **TPM**: 1,000,000 tokens/minuto
- **RPD**: Ilimitado
- **Costo**: $0 (gratuito)

**Cuándo usar** (Fase 3):
- Clustering semántico avanzado
- Detección de duplicados semánticos
- Búsqueda por similitud
- Recomendaciones de contenido

---

### **Para Generación de Imágenes**

#### **Imagen 4 Generate**
- **RPM**: 10 requests/minuto
- **RPD**: 70 requests/día
- **Costo**: $0 (gratuito)

#### **Imagen 4 Fast Generate**
- **RPM**: 10 requests/minuto
- **RPD**: 70 requests/día
- **Costo**: $0 (gratuito)

**Cuándo usar** (Fase 4+):
- Generación de imágenes para posts
- Thumbnails automáticos
- Ilustraciones para contenido

---

## 📊 Matriz de Decisión

### Según volumen de datos:

| Volumen | Modelo Recomendado | Lote Size | Tiempo Est. |
|---------|-------------------|-----------|-------------|
| < 50 | Gemini 2.5 Flash | Todo | 10-20s |
| 50-200 | Gemini 2.5 Flash | 50 | 30-60s |
| 200-500 | Gemini 2.5 Flash | 100 | 1-2min |
| 500-1,000 | Gemini 2.5 Flash | 150 | 2-5min |
| 1,000-5,000 | Gemini 2.5 Flash Lite | 200 | 3-8min |
| 5,000-10,000 | Gemini 2.5 Flash Lite | 500 | 5-15min |
| > 10,000 | Gemini 2.5 Flash Lite | 1,000 | 10-30min |

### Según tipo de tarea:

| Tarea | Modelo | Razón |
|-------|--------|-------|
| **Clustering keywords** | Gemini 2.5 Flash | Balance precisión/velocidad |
| **Embeddings** | Gemini Embedding 1 | Especializado para similitud |
| **Generar contenido** | Gemini 2.5 Flash | Buena calidad, buenos límites |
| **Análisis complejo** | Gemini 2.5 Pro | Máxima precisión |
| **Procesamiento masivo** | Gemini 2.5 Flash Lite | Máximos RPM |
| **Imágenes** | Imagen 4 | Especializado |

---

## ⚠️ Límites a Respetar

### **Hard Limits (No negociables)**

1. **RPD (Requests Per Day)**
   - Gemini 2.5 Pro: 1,000/día ← **CRÍTICO**
   - Gemini 2.5 Flash: 10,000/día
   - Gemini 2.5 Flash Lite: Ilimitado ✅

2. **RPM (Requests Per Minute)**
   - Gemini 2.5 Pro: 150/min ← **MUY LIMITADO**
   - Gemini 2.5 Flash: 1,000/min ✅
   - Gemini 2.5 Flash Lite: 4,000/min ✅✅

3. **TPM (Tokens Per Minute)**
   - Todos los modelos: 1M-4M/min (suficiente)

### **Estrategias para respetar límites**

```javascript
// Rate limiter simple
class RateLimiter {
  constructor(requestsPerMinute, requestsPerDay) {
    this.rpm = requestsPerMinute;
    this.rpd = requestsPerDay;
    this.minuteRequests = [];
    this.dayRequests = [];
  }
  
  async checkLimit() {
    const now = Date.now();
    // Limpiar requests antiguos
    this.minuteRequests = this.minuteRequests.filter(t => now - t < 60000);
    this.dayRequests = this.dayRequests.filter(t => now - t < 86400000);
    
    if (this.minuteRequests.length >= this.rpm) {
      const waitTime = 60000 - (now - this.minuteRequests[0]);
      console.log(`Rate limit RPM alcanzado. Esperando ${waitTime}ms...`);
      await sleep(waitTime);
    }
    
    if (this.dayRequests.length >= this.rpd) {
      throw new Error('Rate limit diario alcanzado');
    }
    
    this.minuteRequests.push(now);
    this.dayRequests.push(now);
  }
}
```

---

## 🚀 Recomendaciones por Fase del Proyecto

### **Fase 2 (Actual)**: Clustering inicial ✅
- **Modelo**: Gemini 2.5 Flash
- **Lote**: Adaptativo según volumen
- **Justificación**: Buena precisión, buenos límites

### **Fase 3 (Futura)**: Embeddings + TF-IDF
- **Modelo**: Gemini Embedding 1 para embeddings
- **Modelo**: Gemini 2.5 Flash Lite para procesamiento masivo
- **Justificación**: Embedding 1 es especializado para similitud semántica

### **Fase 4 (Futura)**: Generación de contenido
- **Modelo**: Gemini 2.5 Flash para textos
- **Modelo**: Imagen 4 para imágenes (máx 70/día)
- **Justificación**: Balance calidad/velocidad/costos

### **Fase 5+ (Futura)**: Escalamiento masivo
- **Modelo**: Gemini 2.5 Flash Lite (RPD ilimitado)
- **Justificación**: Máximo throughput para grandes volúmenes

---

## 📈 Monitoreo de Uso

### **Métricas a trackear**:
1. Requests por minuto (vs RPM limit)
2. Requests por día (vs RPD limit)
3. Tokens por request (estimación de costos futuros)
4. Tiempo de respuesta promedio
5. Tasa de éxito/fallo

### **Alertas recomendadas**:
- ⚠️ 80% del RPD alcanzado
- ⚠️ 90% del RPM alcanzado
- 🚨 Rate limit exceeded
- 🚨 Tiempo de respuesta > 30s (timeout)

---

## 🔮 Escenarios Futuros

### **¿Qué pasa si Google cambia los límites?**
- Plan B: Migrar a OpenRouter (ya tenemos código)
- Plan C: Implementar colas con reintentos
- Plan D: Usar múltiples cuentas/API keys (rotación)

### **¿Qué pasa si necesitamos más de 10,000 requests/día?**
1. Usar Gemini 2.5 Flash Lite (RPD ilimitado)
2. Implementar sistema de colas distribuidas
3. Considerar cuenta de pago (aún así, límites son altos)

### **¿Qué pasa si necesitamos procesar 100,000 keywords?**
- Estrategia: Usar Gemini 2.5 Flash Lite
- Lotes de 1,000 keywords
- ~100 requests (dentro de límites)
- Tiempo estimado: ~20-30 minutos con paralelización

---

## ✅ Checklist para Implementación

Antes de usar cualquier modelo, verificar:
- [ ] ¿El RPD es suficiente para mi volumen diario esperado?
- [ ] ¿El RPM permite mi patrón de uso (burst vs steady)?
- [ ] ¿Tengo implementado rate limiting y reintentos?
- [ ] ¿Tengo monitoreo de uso activo?
- [ ] ¿Tengo plan de fallback si el modelo falla?

---

## 📚 Referencias

- **Google AI Studio**: https://aistudio.google.com/app/apikey
- **Rate Limits Docs**: https://ai.google.dev/gemini-api/docs/rate-limits
- **Pricing**: https://ai.google.dev/pricing (actualmente gratuito para estos modelos)

---

**Última actualización**: 2026-02-19
**Próxima revisión**: Cuando se añadan nuevos modelos o cambien límites
