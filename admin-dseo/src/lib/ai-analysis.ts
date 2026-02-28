import { SearchIntent } from '@/lib/search-intent'

// Tipos para intención de búsqueda avanzada
export type SearchIntentAdvanced = 
  | 'informational' 
  | 'navigational' 
  | 'commercial_investigation' 
  | 'transactional'

// Tipos para etapa del funnel
export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU'

// Tipos para tipo de página en cluster
export type ClusterType = 'pillar' | 'support'

// Tipos para dificultad de contenido
export type ContentDifficulty = 'short' | 'medium' | 'long' | 'guide'

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

// Interface actualizada para clusters avanzados
export interface AICluster {
  name: string
  entity: string           // Entidad principal del cluster
  keywords: string[]
  intent: SearchIntentAdvanced
  stage: FunnelStage       // TOFU/MOFU/BOFU
  is_pillar: boolean
  out_of_scope: boolean   // Keywords que no encajan en el negocio
}

export interface AICanibalization {
  keywords: string[]
}

// Interface para página SILO con campos avanzados
export interface AISiloPage {
  main_keyword: string
  slug: string
  cluster_type: ClusterType
  stage: FunnelStage
  entity: string
  content_difficulty: ContentDifficulty
  internal_linking: string[]
  secondary_keywords: string[]
}

// Interface para categoría SILO
export interface AISiloCategory {
  name: string
  subcategory?: string
  pages: AISiloPage[]
}

// Interface para SILO
export interface AISilo {
  name: string
  priority?: number
  categories: AISiloCategory[]
}

export interface AIAnalysisResult {
  success: boolean
  duplicates: AIDuplicateGroup[]
  clusters: AICluster[]
  canibalizations: AICanibalization[]
  intentions: { [keyword: string]: string }
  silos?: AISilo[]
  totalAnalyzed: number
  totalRequested: number
  batchesProcessed?: number
  failedBatches?: number[]
  error?: string
}

// Parámetros para analizar keywords
export interface AnalyzeKeywordsParams {
  keywords: string[]
  existingClusters?: { name: string; keywords: string[] }[]
  model?: string
  provider?: string
  apiKeyEnvVar?: string
}

/**
 * Analiza keywords usando Google Gemini AI para deduplicación semántica,
 * clustering, detección de canibalizaciones y sugerencia de pilares
 */
export async function analyzeKeywordsWithAI(
  keywords: string[], 
  existingClusters?: { name: string; keywords: string[] }[],
  params?: AnalyzeKeywordsParams
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        keywords, 
        existingClusters,
        model: params?.model,
        provider: params?.provider,
        apiKeyEnvVar: params?.apiKeyEnvVar
      })
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
  existingClusters?: { name: string; keywords: string[] }[],
  params?: AnalyzeKeywordsParams
): Promise<{
  clusters: { 
    name: string; 
    keywords: string[]; 
    avgConfidence: number; 
    contentType: string;
    entity?: string;
    stage?: FunnelStage;
  }[]
  error?: string
}> {
  const result = await analyzeKeywordsWithAI(keywords, existingClusters, params)

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
      contentType: cluster.is_pillar ? 'landing' : 'blog',
      entity: cluster.entity || '',
      stage: cluster.stage || 'MOFU'
    }))
  }

  return { clusters }
}
