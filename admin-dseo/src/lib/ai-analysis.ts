import { SearchIntent } from '@/lib/search-intent'

export interface AIKeywordAnalysis {
  keyword: string
  intent: SearchIntent
  confidence: number
  reasoning: string
  suggestedCluster: string
  shouldBeStandalone: boolean
}

export interface AIAnalysisResult {
  success: boolean
  analyses: AIKeywordAnalysis[]
  clusterSuggestions: { [key: string]: string[] }
  totalAnalyzed: number
  error?: string
}

/**
 * Analiza keywords usando IA (OpenAI)
 */
export async function analyzeKeywordsWithAI(keywords: string[]): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keywords })
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
      analyses: [],
      clusterSuggestions: {},
      totalAnalyzed: 0,
      error: error.message
    }
  }
}

/**
 * Obtiene sugerencias de clusters basadas en análisis de IA
 */
export async function getAIClusterSuggestions(keywords: string[]): Promise<{
  clusters: { name: string; keywords: string[]; avgConfidence: number }[]
  standalone: string[]
  error?: string
}> {
  const result = await analyzeKeywordsWithAI(keywords)

  if (!result.success) {
    return { clusters: [], standalone: [], error: result.error }
  }

  // Agrupar por cluster sugerido
  const clusterMap = new Map<string, { keywords: string[]; confidences: number[] }>()
  const standalone: string[] = []

  result.analyses.forEach(analysis => {
    if (analysis.shouldBeStandalone) {
      standalone.push(analysis.keyword)
    } else {
      const clusterName = analysis.suggestedCluster
      if (!clusterMap.has(clusterName)) {
        clusterMap.set(clusterName, { keywords: [], confidences: [] })
      }
      const cluster = clusterMap.get(clusterName)!
      cluster.keywords.push(analysis.keyword)
      cluster.confidences.push(analysis.confidence)
    }
  })

  const clusters = Array.from(clusterMap.entries()).map(([name, data]) => ({
    name,
    keywords: data.keywords,
    avgConfidence: data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length
  }))

  return { clusters, standalone }
}
