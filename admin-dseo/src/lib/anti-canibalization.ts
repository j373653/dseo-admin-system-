import { AICluster } from './ai-analysis'

export interface AntiCanibalizationResult {
  mergedClusters: AICluster[]
  removedKeywords: string[]
  notes: string[]
}

export function antiCanibalization(clusters: AICluster[]): AntiCanibalizationResult {
  const result: AntiCanibalizationResult = {
    mergedClusters: [],
    removedKeywords: [],
    notes: []
  }

  if (!clusters || clusters.length === 0) {
    return result
  }

  const normalizedClusters = clusters.filter(c => !c.out_of_scope)
  const toRemove = new Set<string>()
  const merged: Map<string, AICluster> = new Map()

  for (const cluster of normalizedClusters) {
    const key = `${cluster.entity?.toLowerCase()}-${cluster.intent}-${cluster.stage}`
    
    if (merged.has(key)) {
      const existing = merged.get(key)!
      existing.keywords = [...new Set([...existing.keywords, ...cluster.keywords])]
      
      if (cluster.is_pillar && !existing.is_pillar) {
        existing.is_pillar = true
        existing.name = cluster.name
      }
      
      result.notes.push(`Fusionado cluster "${cluster.name}" con "${existing.name}" (misma entidad/intención)`)
      cluster.keywords.forEach(k => toRemove.add(k))
    } else {
      merged.set(key, { ...cluster })
    }
  }

  result.mergedClusters = Array.from(merged.values())
  result.removedKeywords = Array.from(toRemove)

  return result
}

export function assignGenericKeywordsToPillars(
  clusters: AICluster[], 
  genericKeywords: string[]
): AICluster[] {
  const pillars = clusters.filter(c => c.is_pillar)
  const nonPillars = clusters.filter(c => !c.is_pillar)
  
  const updatedNonPillars = nonPillars.map(cluster => {
    const hasGeneric = cluster.keywords.some(k => genericKeywords.includes(k))
    if (hasGeneric) {
      const pillar = pillars.find(p => p.entity === cluster.entity)
      if (pillar) {
        return {
          ...cluster,
          keywords: cluster.keywords.filter(k => !genericKeywords.includes(k)),
          is_pillar: true
        }
      }
    }
    return cluster
  })
  
  return [...pillars, ...updatedNonPillars.filter(c => c.keywords.length > 0)]
}
