export interface CleanedKeywordsResult {
  originalKeywords: string[]
  cleanedKeywords: string[]
  duplicatesRemoved: string[]
  stats: {
    originalCount: number
    cleanedCount: number
    duplicatesRemoved: number
    tokensSaved: number
  }
}

/**
 * Limpia y normaliza keywords antes de enviar a IA
 * Ahorra tokens eliminando duplicados y normalizando
 */
export function cleanKeywordsForAI(keywords: string[]): CleanedKeywordsResult {
  const stats = {
    originalCount: keywords.length,
    cleanedCount: 0,
    duplicatesRemoved: 0,
    tokensSaved: 0
  }

  // 1. Eliminar vacíos y espacios
  const trimmed = keywords
    .map(k => k.trim())
    .filter(k => k.length > 0)

  // 2. Normalizar espacios múltiples
  const normalized = trimmed.map(k => 
    k.replace(/\s+/g, ' ').toLowerCase().trim()
  )

  // 3. Detectar duplicados (case-insensitive)
  const seen = new Set<string>()
  const duplicates: string[] = []
  const unique: string[] = []

  normalized.forEach((k, index) => {
    if (seen.has(k)) {
      duplicates.push(trimmed[index]) // Guardar versión original para mostrar
    } else {
      seen.add(k)
      unique.push(trimmed[index]) // Mantener versión original (con mayúsculas si las tiene)
    }
  })

  stats.cleanedCount = unique.length
  stats.duplicatesRemoved = duplicates.length
  
  // Estimación: ~10 tokens por keyword eliminada (prompt + respuesta)
  stats.tokensSaved = duplicates.length * 10

  return {
    originalKeywords: trimmed,
    cleanedKeywords: unique,
    duplicatesRemoved: duplicates,
    stats
  }
}

/**
 * Calcula la estrategia de procesamiento óptima basada en cantidad de keywords
 */
export function calculateProcessingStrategy(totalKeywords: number): {
  batchSize: number
  estimatedBatches: number
  estimatedTime: string
  parallelRequests: boolean
} {
  if (totalKeywords <= 50) {
    return {
      batchSize: totalKeywords,
      estimatedBatches: 1,
      estimatedTime: '10-20 segundos',
      parallelRequests: false
    }
  } else if (totalKeywords <= 200) {
    return {
      batchSize: 50,
      estimatedBatches: Math.ceil(totalKeywords / 50),
      estimatedTime: '30-60 segundos',
      parallelRequests: false
    }
  } else if (totalKeywords <= 500) {
    return {
      batchSize: 100,
      estimatedBatches: Math.ceil(totalKeywords / 100),
      estimatedTime: '1-2 minutos',
      parallelRequests: true
    }
  } else {
    return {
      batchSize: 150,
      estimatedBatches: Math.ceil(totalKeywords / 150),
      estimatedTime: '2-5 minutos',
      parallelRequests: true
    }
  }
}

/**
 * Formatea el ahorro de tokens para mostrar al usuario
 */
export function formatTokenSavings(tokensSaved: number): string {
  if (tokensSaved >= 1000) {
    return `${(tokensSaved / 1000).toFixed(1)}K`
  }
  return tokensSaved.toString()
}
