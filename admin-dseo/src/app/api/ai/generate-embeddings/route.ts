import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MODEL = 'gemini-embedding-001'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

interface EmbeddingResult {
  keyword: string
  keyword_id: string
  embedding: number[]
  success: boolean
  error?: string
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `${API_URL}/${MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { role: 'user', parts: [{ text }] },
        taskType: 'SEMANTIC_SIMILARITY'
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini embedding error: ${response.status}`)
  }

  const data = await response.json()
  return data.embedding?.values || []
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function POST(request: NextRequest) {
  try {
    const { keyword_ids, keywords } = await request.json()

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: 'Se requiere array de keywords' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada' }, { status: 500 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Generando embeddings para ${keywords.length} keywords...`)

    const results: EmbeddingResult[] = []
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i]
      const keywordId = keyword_ids?.[i] || null
      
      try {
        const embedding = await generateEmbedding(keyword, apiKey)
        
        if (embedding.length > 0 && keywordId) {
          await supabase
            .from('d_seo_admin_raw_keywords')
            .update({ embedding })
            .eq('id', keywordId)
        }

        results.push({
          keyword,
          keyword_id: keywordId || '',
          embedding,
          success: true
        })
      } catch (error: any) {
        results.push({
          keyword,
          keyword_id: keywordId || '',
          embedding: [],
          success: false,
          error: error.message
        })
      }

      if (i < keywords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const successful = results.filter(r => r.success).length
    console.log(`✅ Embeddings generados: ${successful}/${keywords.length}`)

    return NextResponse.json({
      success: true,
      total: keywords.length,
      successful,
      results: results.map(r => ({ keyword: r.keyword, success: r.success, error: r.error }))
    })

  } catch (error: any) {
    console.error('Error generando embeddings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { cluster_ids } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Calculando centroides y relaciones para ${cluster_ids?.length || 'todos'} clusters...`)

    const { data: clusters } = await supabase
      .from('d_seo_admin_keyword_clusters')
      .select('id, name, keyword_count')

    if (!clusters || clusters.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay clusters' })
    }

    const { data: keywordsWithEmbedding } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('id, keyword, embedding, cluster_id')
      .not('embedding', 'is', null)

    const clusterEmbeddings: Record<string, number[][]> = {}
    keywordsWithEmbedding?.forEach(kw => {
      if (kw.cluster_id) {
        if (!clusterEmbeddings[kw.cluster_id]) {
          clusterEmbeddings[kw.cluster_id] = []
        }
        clusterEmbeddings[kw.cluster_id].push(kw.embedding)
      }
    })

    const relations: Array<{
      source_cluster_id: string
      target_cluster_id: string
      similarity_score: number
      relation_type: string
    }> = []

    const clustersWithCentroid = clusters.map(cluster => {
      const embeddings = clusterEmbeddings[cluster.id] || []
      
      if (embeddings.length === 0) {
        return { ...cluster, centroid: null, count: 0 }
      }

      const dimension = embeddings[0].length
      const centroid = new Array(dimension).fill(0)
      
      embeddings.forEach(emb => {
        emb.forEach((val, i) => {
          centroid[i] += val
        })
      })
      
      centroid.map((val, i) => centroid[i] = val / embeddings.length)

      return {
        ...cluster,
        centroid,
        count: embeddings.length
      }
    })

    for (let i = 0; i < clustersWithCentroid.length; i++) {
      const clusterA = clustersWithCentroid[i]
      if (!clusterA.centroid) continue

      for (let j = i + 1; j < clustersWithCentroid.length; j++) {
        const clusterB = clustersWithCentroid[j]
        if (!clusterB.centroid) continue

        const similarity = cosineSimilarity(clusterA.centroid, clusterB.centroid)

        let relationType = 'related'
        if (similarity > 0.85) {
          relationType = 'canibalization'
        } else if (similarity > 0.7) {
          relationType = 'sibling'
        } else if (similarity > 0.5) {
          relationType = 'internal_link'
        }

        if (relationType !== 'related') {
          relations.push({
            source_cluster_id: clusterA.id,
            target_cluster_id: clusterB.id,
            similarity_score: Math.round(similarity * 100) / 100,
            relation_type: relationType
          })
        }
      }

      await supabase
        .from('d_seo_admin_keyword_clusters')
        .update({
          centroid_embedding: clusterA.centroid,
          keywords_with_embedding: clusterA.count
        })
        .eq('id', clusterA.id)
    }

    if (relations.length > 0) {
      await supabase.from('d_seo_admin_cluster_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      const uniqueRelations = relations.filter((r, index, self) =>
        index === self.findIndex(t => 
          (t.source_cluster_id === r.source_cluster_id && t.target_cluster_id === r.target_cluster_id) ||
          (t.source_cluster_id === r.target_cluster_id && t.target_cluster_id === r.source_cluster_id)
        )
      )

      await supabase.from('d_seo_admin_cluster_relations').insert(uniqueRelations)
    }

    console.log(`✅ Relaciones calculadas: ${relations.length}`)

    return NextResponse.json({
      success: true,
      clusters_processed: clustersWithCentroid.length,
      relations_found: relations.length,
      canibalizations: relations.filter(r => r.relation_type === 'canibalization').length
    })

  } catch (error: any) {
    console.error('Error calculando relaciones:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
