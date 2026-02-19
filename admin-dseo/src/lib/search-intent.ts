// Sistema de detección de intención de búsqueda (Search Intent)

export type SearchIntent = 'informational' | 'transactional' | 'commercial' | 'navigational' | 'unknown';

interface IntentPattern {
  type: SearchIntent;
  patterns: RegExp[];
  weight: number;
}

const intentPatterns: IntentPattern[] = [
  {
    type: 'informational',
    weight: 1.0,
    patterns: [
      /\b(que es|que son|como|guia|tutorial|definicion|significado|ejemplos|tipos de)\b/i,
      /\b(como funciona|como hacer|paso a paso|manual|aprender)\b/i,
      /\b(informacion sobre|datos sobre|explicacion|concepto)\b/i,
      /\b(por que|cuando|donde|cuanto|cual)\b/i,
      /\b(guia completa|todo sobre|introduccion a)\b/i,
      /\?$/  // Preguntas terminan en ?
    ]
  },
  {
    type: 'transactional',
    weight: 1.2, // Alta prioridad - intención de compra
    patterns: [
      /\b(comprar|adquirir|contratar|solicitar|reservar)\b/i,
      /\b(precio|precios|tarifa|tarifas|costo|coste)\b/i,
      /\b(descuento|oferta|promocion|rebaja|barato|economico)\b/i,
      /\b(online|por internet|en linea)\b/i,
      /\b(gratis|free|sin costo)\b/i,
      /\b(pack|paquete|kit|bundle)\b/i,
      /\b(mejor precio|mejor oferta|mejor tarifa)\b/i
    ]
  },
  {
    type: 'commercial',
    weight: 1.0,
    patterns: [
      /\b(mejor|top|mejores|ranking|comparativa|vs|versus)\b/i,
      /\b(review|opiniones|valoraciones|test|analisis)\b/i,
      /\b(alternativas|similares|parecidos|como)\b/i,
      /\b(2025|2026|actual|actualizado)\b/i,
      /\b(profesional|experto|calidad|premium)\b/i
    ]
  },
  {
    type: 'navigational',
    weight: 0.8,
    patterns: [
      /\b(login|acceso|entrar|iniciar sesion)\b/i,
      /\b(contacto|contactar|telefono|email|soporte)\b/i,
      /\b(servicios|servicio|productos|producto)\b/i,
      /\b(nosotros|empresa|quienes somos|equipo)\b/i,
      /\b(blog|articulos|noticias|novedades)\b/i,
      /\b(carrito|cesta|checkout|pagar)\b/i
    ]
  }
];

/**
 * Detecta la intención de búsqueda de una keyword
 */
export function detectSearchIntent(keyword: string): { 
  intent: SearchIntent; 
  confidence: number;
  matches: string[];
} {
  const lowerKeyword = keyword.toLowerCase();
  const scores: { [key in SearchIntent]: number } = {
    informational: 0,
    transactional: 0,
    commercial: 0,
    navigational: 0,
    unknown: 0
  };
  const matches: string[] = [];

  // Calcular puntajes para cada tipo de intención
  intentPatterns.forEach(({ type, patterns, weight }) => {
    patterns.forEach(pattern => {
      if (pattern.test(lowerKeyword)) {
        scores[type] += weight;
        // Extraer el match para mostrar
        const match = lowerKeyword.match(pattern);
        if (match) {
          matches.push(match[0]);
        }
      }
    });
  });

  // Encontrar la intención con mayor puntaje
  let maxIntent: SearchIntent = 'unknown';
  let maxScore = 0;

  (Object.keys(scores) as SearchIntent[]).forEach(intent => {
    if (scores[intent] > maxScore) {
      maxScore = scores[intent];
      maxIntent = intent;
    }
  });

  // Calcular confianza (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  return {
    intent: maxIntent,
    confidence: Math.min(confidence, 1),
    matches: [...new Set(matches)] // Eliminar duplicados
  };
}

/**
 * Agrupa keywords por intención de búsqueda
 */
export function groupByIntent(keywords: string[]): Map<SearchIntent, string[]> {
  const groups = new Map<SearchIntent, string[]>();
  
  keywords.forEach(keyword => {
    const { intent } = detectSearchIntent(keyword);
    if (!groups.has(intent)) {
      groups.set(intent, []);
    }
    groups.get(intent)!.push(keyword);
  });

  return groups;
}

/**
 * Genera un nombre de cluster basado en el tema común y la intención
 */
export function generateClusterName(keywords: string[]): string {
  if (keywords.length === 0) return 'Cluster Vacío';
  
  // Extraer palabras comunes
  const words = keywords.map(k => k.toLowerCase().split(/\s+/)).flat();
  const wordCounts: { [key: string]: number } = {};
  
  words.forEach(word => {
    // Ignorar palabras vacías (stop words en español)
    const stopWords = ['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'una', 'su', 'al', 'lo', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad'];
    
    if (word.length > 2 && !stopWords.includes(word) && isNaN(Number(word))) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  // Encontrar las 2-3 palabras más comunes
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (sortedWords.length === 0) {
    // Si no hay palabras comunes, usar la primera keyword
    return keywords[0].split(' ').slice(0, 3).join(' ');
  }

  return sortedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Determina si dos keywords deberían ir en el mismo cluster
 * basándose en similitud semántica e intención
 */
export function shouldClusterTogether(keyword1: string, keyword2: string): boolean {
  const intent1 = detectSearchIntent(keyword1);
  const intent2 = detectSearchIntent(keyword2);
  
  // Si tienen intenciones diferentes, NO van juntas
  if (intent1.intent !== intent2.intent) {
    return false;
  }
  
  // Si ambas tienen baja confianza, usar similitud de palabras
  if (intent1.confidence < 0.3 && intent2.confidence < 0.3) {
    return calculateWordSimilarity(keyword1, keyword2) > 0.5;
  }
  
  return true;
}

/**
 * Calcula similitud básica entre dos keywords (0-1)
 */
function calculateWordSimilarity(keyword1: string, keyword2: string): number {
  const words1 = new Set(keyword1.toLowerCase().split(/\s+/));
  const words2 = new Set(keyword2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Sugiere estructura de URL basada en la intención
 */
export function suggestUrlStructure(keyword: string, intent: SearchIntent): string {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  switch (intent) {
    case 'informational':
      return `/blog/${slug}/`;
    case 'commercial':
      return `/comparativas/${slug}/`;
    case 'transactional':
      return `/comprar/${slug}/`;
    case 'navigational':
      return `/${slug}/`;
    default:
      return `/${slug}/`;
  }
}

/**
 * Obtiene etiquetas visuales para la intención
 */
export function getIntentBadge(intent: SearchIntent): { 
  label: string; 
  color: string; 
  description: string;
} {
  const badges: { [key in SearchIntent]: { label: string; color: string; description: string } } = {
    informational: {
      label: 'Información',
      color: 'bg-blue-100 text-blue-800',
      description: 'El usuario busca información o respuestas'
    },
    transactional: {
      label: 'Transacción',
      color: 'bg-green-100 text-green-800',
      description: 'El usuario quiere comprar o contratar'
    },
    commercial: {
      label: 'Comercial',
      color: 'bg-purple-100 text-purple-800',
      description: 'El usuario investiga antes de comprar'
    },
    navigational: {
      label: 'Navegación',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'El usuario busca una página específica'
    },
    unknown: {
      label: 'Desconocida',
      color: 'bg-gray-100 text-gray-800',
      description: 'No se pudo determinar la intención'
    }
  };

  return badges[intent] || badges['unknown'];
}
