import { SearchIntent } from '@/lib/search-intent'

export interface AIKeywordAnalysis {
  keyword: string
  cluster: string
  intent: SearchIntent
  confidence: number
  reasoning: string
  contentType: string
}

export interface AIDuplicateGroup {
  keywords: string[]
}

export interface AICluster {
  name: string
  keywords: string[]
  intent: string
  is_pillar: boolean
}

export interface AICanibalization {
  keywords: string[]
}

export interface AIAnalysisResult {
  success: boolean
  duplicates: AIDuplicateGroup[]
  clusters: AICluster[]
  canibalizations: AICanibalization[]
  intentions: { [keyword: string]: string }
  silos?: {
    name: string
    categories: {
      name: string
      pages: { mainKeyword: string; secondaryKeywords: string[]; intent: string; urlTarget: string; isPillar: boolean }[]
    }[]
  }[]
  totalAnalyzed: number
  totalRequested: number
  batchesProcessed?: number
  failedBatches?: number[]
  error?: string
}

/**
 * Analiza keywords usando Google Gemini AI para deduplicación semántica,
 * clustering, detección de canibalizaciones y sugerencia de pilares
 */
export async function analyzeKeywordsWithAI(keywords: string[], existingClusters?: { name: string; keywords: string[] }[]): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keywords, existingClusters })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en análisis con IA')
    }

    return data
  } catch (error: any) {
    console.error('Error analyzing with AI:', error)
    return {
      success: false,
      duplicates: [],
      clusters: [],
      canibalizations: [],
      intentions: {},
      totalAnalyzed: 0,
      totalRequested: keywords.length,
      error: error.message
    }
  }
}

/**
 * Obtiene sugerencias de clusters basadas en análisis de IA
 */
export async function getAIClusterSuggestions(
  keywords: string[],
  existingClusters?: { name: string; keywords: string[] }[]
): Promise<{
  clusters: { name: string; keywords: string[]; avgConfidence: number; contentType: string }[]
  error?: string
}> {
  const result = await analyzeKeywordsWithAI(keywords, existingClusters)

  if (!result.success) {
    return { clusters: [], error: result.error }
  }

  let clusters = (result.clusters || []) as any[]

  // Si no hay clusters pero existen silos, derivar clusters desde silos
  if ((!clusters || clusters.length === 0) && (result as any).silos) {
    const silos = (result as any).silos as any[]
    const derived: { name: string; keywords: string[]; avgConfidence: number; contentType: string }[] = []
    for (const silo of silos) {
      for (const cat of (silo.categories || [])) {
        for (const page of (cat.pages || [])) {
          derived.push({
            name: cat.name,
            keywords: [page.mainKeyword, ...(page.secondaryKeywords || [])],
            avgConfidence: 0.8,
            contentType: page.isPillar ? 'landing' : 'blog'
          })
        }
      }
    }
    clusters = derived
  } else {
    clusters = (result.clusters || []).map(cluster => ({
      name: cluster.name,
      keywords: cluster.keywords,
      avgConfidence: 0.8,
      contentType: cluster.is_pillar ? 'landing' : 'blog'
    }))
  }

  return { clusters }
}
