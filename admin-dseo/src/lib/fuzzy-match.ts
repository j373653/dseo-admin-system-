// Utilidades de emparejamiento fuzzy para keywords
// - normalizeKeyword: normaliza palabras clave para comparaciones
// - fuzzyMatch: empareja una palabra contra un conjunto de palabras clave, usando Levenshtein con umbral

export function normalizeKeyword(kw: string): string {
  if (!kw) return ''
  // Quitar acentos y caracteres especiales, convertir a minúsculas y normalizar espaciado
  // Usamos NFD para descomponer acentos; fallback si el motor no soporta 
  let withoutDiacritics = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // En navegadores modernos esto ya funciona; por compatibilidad mantenemos segundo paso
  withoutDiacritics = withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return withoutDiacritics
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

export function fuzzyMatch(keyword: string, clusterKeywords: string[]): { matched: boolean; best?: string } {
  const normKw = normalizeKeyword(keyword)
  let bestDist = Infinity
  let bestMatch: string | undefined
  for (const ck of clusterKeywords) {
    const normCk = normalizeKeyword(ck)
    const dist = levenshtein(normKw, normCk)
    if (dist === 0) return { matched: true, best: ck }
    if (dist < bestDist) {
      bestDist = dist
      bestMatch = ck
    }
  }
  // Umbral básico: 25% de la longitud máxima entre las palabras
  const maxLen = Math.max(normKw.length, ...clusterKeywords.map(kw => normalizeKeyword(kw).length))
  const threshold = Math.max(1, Math.floor(maxLen * 0.25))
  return { matched: bestDist <= threshold, best: bestMatch }
}
