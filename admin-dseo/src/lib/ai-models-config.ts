/**
 * Configuración de Modelos de IA y Rate Limits
 * Basado en los límites de Google AI Studio (Feb 2026)
 */

export interface ModelConfig {
  name: string;
  provider: 'google' | 'openrouter';
  rpm: number; // Requests per minute
  tpm: number; // Tokens per minute
  rpd: number | 'unlimited'; // Requests per day
  contextTokens: number;
  costPer1kTokens?: number; // null si es gratuito
  bestFor: string[];
  recommendedBatchSize: number;
  maxBatchSize: number;
}

export const AI_MODELS: Record<string, ModelConfig> = {
  // Google AI Studio Models
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    rpm: 1000,
    tpm: 1000000,
    rpd: 10000,
    contextTokens: 1000000,
    costPer1kTokens: 0, // Gratuito
    bestFor: ['keyword-clustering', 'content-generation', 'text-analysis'],
    recommendedBatchSize: 150,
    maxBatchSize: 200
  },
  
  'gemini-2.5-flash-lite': {
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    rpm: 4000,
    tpm: 4000000,
    rpd: 'unlimited',
    contextTokens: 1000000,
    costPer1kTokens: 0, // Gratuito
    bestFor: ['mass-processing', 'high-throughput', 'parallel-operations'],
    recommendedBatchSize: 500,
    maxBatchSize: 1000
  },
  
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    rpm: 150,
    tpm: 2000000,
    rpd: 1000,
    contextTokens: 2000000,
    costPer1kTokens: 0, // Gratuito
    bestFor: ['complex-analysis', 'high-accuracy', 'reasoning-tasks'],
    recommendedBatchSize: 10,
    maxBatchSize: 20
  },
  
  'gemini-embedding-1': {
    name: 'Gemini Embedding 1',
    provider: 'google',
    rpm: 3000,
    tpm: 1000000,
    rpd: 'unlimited',
    contextTokens: 2048,
    costPer1kTokens: 0, // Gratuito
    bestFor: ['semantic-similarity', 'embeddings', 'vector-search'],
    recommendedBatchSize: 100,
    maxBatchSize: 200
  },
  
  // OpenRouter Models (Fallback)
  'liquid-lfm-2.5': {
    name: 'Liquid LFM 2.5',
    provider: 'openrouter',
    rpm: 60, // Estimado conservador
    tpm: 100000,
    rpd: 'unlimited',
    contextTokens: 32768,
    costPer1kTokens: 0, // Gratuito (modelo :free)
    bestFor: ['fallback', 'keyword-analysis-simple'],
    recommendedBatchSize: 10,
    maxBatchSize: 15
  },

  // Gemini 3 Flash (Nuevo - prioritario)
  'gemini-3-flash': {
    name: 'Gemini 3 Flash',
    provider: 'google',
    rpm: 5,
    tpm: 250000,
    rpd: 20,
    contextTokens: 1000000,
    costPer1kTokens: 0, // Gratuito
    bestFor: ['complex-analysis', 'silo-architecture', 'high-accuracy'],
    recommendedBatchSize: 10,
    maxBatchSize: 20
  }
};

/**
 * Calcula la estrategia óptima de procesamiento basada en el volumen
 */
export function calculateOptimalStrategy(
  itemCount: number,
  modelKey: string = 'gemini-2.5-flash'
): {
  model: string;
  batchSize: number;
  estimatedBatches: number;
  estimatedTimeMinutes: number;
  parallelRequests: boolean;
  warning?: string;
} {
  const model = AI_MODELS[modelKey];
  
  if (!model) {
    throw new Error(`Modelo no encontrado: ${modelKey}`);
  }
  
  let batchSize = model.recommendedBatchSize;
  let warning: string | undefined;
  
  // Ajustar batch size según volumen
  if (itemCount <= 50) {
    batchSize = itemCount;
  } else if (itemCount <= 200) {
    batchSize = Math.min(50, model.maxBatchSize);
  } else if (itemCount <= 500) {
    batchSize = Math.min(100, model.maxBatchSize);
  } else if (itemCount <= 1000) {
    batchSize = Math.min(150, model.maxBatchSize);
  } else {
    batchSize = model.maxBatchSize;
  }
  
  const estimatedBatches = Math.ceil(itemCount / batchSize);
  
  // Calcular tiempo estimado (asumiendo 10-15 segundos por lote)
  const estimatedTimeMinutes = (estimatedBatches * 12) / 60;
  
  // Determinar si podemos hacer requests paralelos
  const parallelRequests = estimatedBatches > 3 && model.rpm >= 1000;
  
  // Verificar RPD
  if (typeof model.rpd === 'number' && estimatedBatches > model.rpd) {
    warning = `⚠️ Se necesitan ${estimatedBatches} requests pero el modelo solo permite ${model.rpd}/día. Considera usar ${modelKey === 'gemini-2.5-flash' ? 'gemini-2.5-flash-lite' : 'otro modelo'}.`;
  }
  
  return {
    model: modelKey,
    batchSize,
    estimatedBatches,
    estimatedTimeMinutes: Math.ceil(estimatedTimeMinutes * 10) / 10, // Redondear a 1 decimal
    parallelRequests,
    warning
  };
}

/**
 * Sugiere el mejor modelo según el caso de uso
 */
export function suggestModel(
  useCase: 'keyword-clustering' | 'mass-processing' | 'embeddings' | 'complex-analysis' | 'fallback',
  expectedDailyVolume: number
): string {
  switch (useCase) {
    case 'keyword-clustering':
      if (expectedDailyVolume > 10000) {
        return 'gemini-2.5-flash-lite';
      }
      return 'gemini-2.5-flash';
      
    case 'mass-processing':
      return 'gemini-2.5-flash-lite';
      
    case 'embeddings':
      return 'gemini-embedding-1';
      
    case 'complex-analysis':
      return 'gemini-2.5-pro';
      
    case 'fallback':
      return 'liquid-lfm-2.5';
      
    default:
      return 'gemini-2.5-flash';
  }
}

/**
 * Rate limiter para respetar los límites de la API
 */
export class GoogleAIRateLimiter {
  private minuteTimestamps: number[] = [];
  private dayTimestamps: number[] = [];
  private rpm: number;
  private rpd: number | 'unlimited';
  
  constructor(modelKey: string = 'gemini-2.5-flash') {
    const model = AI_MODELS[modelKey];
    if (!model) {
      throw new Error(`Modelo no encontrado: ${modelKey}`);
    }
    this.rpm = model.rpm;
    this.rpd = model.rpd;
  }
  
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Limpiar timestamps antiguos
    this.minuteTimestamps = this.minuteTimestamps.filter(t => now - t < 60000);
    this.dayTimestamps = this.dayTimestamps.filter(t => now - t < 86400000);
    
    // Verificar RPM
    if (this.minuteTimestamps.length >= this.rpm) {
      const oldestRequest = this.minuteTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 1000; // +1s buffer
      console.log(`⏳ Rate limit RPM (${this.rpm}) alcanzado. Esperando ${Math.ceil(waitTime/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Verificar RPD
    if (typeof this.rpd === 'number' && this.dayTimestamps.length >= this.rpd) {
      throw new Error(`❌ Rate limit diario (${this.rpd}) alcanzado. Inténtalo mañana.`);
    }
    
    // Registrar request
    this.minuteTimestamps.push(now);
    this.dayTimestamps.push(now);
  }
  
  getUsage(): { rpmUsed: number; rpdUsed: number; rpdLimit: number | 'unlimited' } {
    const now = Date.now();
    this.minuteTimestamps = this.minuteTimestamps.filter(t => now - t < 60000);
    this.dayTimestamps = this.dayTimestamps.filter(t => now - t < 86400000);
    
    return {
      rpmUsed: this.minuteTimestamps.length,
      rpdUsed: this.dayTimestamps.length,
      rpdLimit: this.rpd
    };
  }
}

/**
 * Estimador de tokens para budgeting
 * Asume ~4 caracteres por token (aproximación conservadora)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Verifica si un volumen está dentro de los límites del modelo
 */
export function checkFeasibility(
  itemCount: number,
  itemsPerRequest: number,
  modelKey: string = 'gemini-2.5-flash'
): { feasible: boolean; warning?: string } {
  const model = AI_MODELS[modelKey];
  const requestsNeeded = Math.ceil(itemCount / itemsPerRequest);
  
  if (typeof model.rpd === 'number' && requestsNeeded > model.rpd) {
    return {
      feasible: false,
      warning: `No es factible: se necesitan ${requestsNeeded} requests pero el modelo ${model.name} solo permite ${model.rpd}/día. `
               + `Considera usar ${modelKey === 'gemini-2.5-flash' ? 'gemini-2.5-flash-lite' : 'un modelo con mayor RPD'}.`
    };
  }
  
  return { feasible: true };
}
