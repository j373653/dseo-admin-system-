import { SearchIntent } from '@/lib/search-intent'

export interface AIKeywordAnalysis {
  keyword: string
  cluster: string
  intent: SearchIntent
  confidence: number
  reasoning: string
  contentType: string
}

export interface AIAnalysisResult {
  success: boolean
  analyses: AIKeywordAnalysis[]
  clusterSuggestions: { [key: string]: string[] }
  totalAnalyzed: number
  totalRequested: number
  batchesProcessed?: number
  error?: string
}

/**
 * Analiza keywords usando Google Gemini AI
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
      standaloneUrls: [],
      totalAnalyzed: 0,
      totalRequested: keywords.length,
      error: error.message
    }
  }
}

/**
 * Obtiene sugerencias de clusters basadas en análisis de IA
 */
export async function getAIClusterSuggestions(keywords: string[]): Promise<{
  clusters: { name: string; keywords: string[]; avgConfidence: number; contentType: string }[]
  error?: string
}> {
  const result = await analyzeKeywordsWithAI(keywords)

  if (!result.success) {
    return { clusters: [], error: result.error }
  }

  // Procesar clusters sugeridos
  const clusters = Object.entries(result.clusterSuggestions).map(([name, keywords]) => {
    const analyses = result.analyses.filter(a => a.cluster === name)
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
    const contentType = analyses[0]?.contentType || 'blog'
    
    return {
      name,
      keywords,
      avgConfidence,
      contentType
    }
  })

  return { clusters }
}
