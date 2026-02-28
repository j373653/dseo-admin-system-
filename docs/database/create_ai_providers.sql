-- ============================================================================
-- Tablas para múltiples proveedores de IA
-- Fecha: 2026-02-28
-- ============================================================================

-- Tabla de proveedores IA
CREATE TABLE IF NOT EXISTS d_seo_admin_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key_env_var VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de modelos disponibles
CREATE TABLE IF NOT EXISTS d_seo_admin_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES d_seo_admin_ai_providers(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración por tarea
CREATE TABLE IF NOT EXISTS d_seo_admin_ai_task_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task VARCHAR(50) NOT NULL,
  model_id UUID REFERENCES d_seo_admin_ai_models(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task, is_default)
);

-- RLS
ALTER TABLE d_seo_admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE d_seo_admin_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE d_seo_admin_ai_task_config ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Admin full access providers" ON d_seo_admin_ai_providers;
CREATE POLICY "Admin full access providers" ON d_seo_admin_ai_providers FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access models" ON d_seo_admin_ai_models;
CREATE POLICY "Admin full access models" ON d_seo_admin_ai_models FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access task_config" ON d_seo_admin_ai_task_config;
CREATE POLICY "Admin full access task_config" ON d_seo_admin_ai_task_config FOR ALL USING (true);

-- Datos iniciales
INSERT INTO d_seo_admin_ai_providers (name, provider, api_key_env_var, is_default) VALUES
  ('Google Principal', 'google', 'GEMINI_MAIN_API_KEY', true),
  ('OpenRouter', 'openrouter', 'OPENROUTER_API_KEY', false)
ON CONFLICT DO NOTHING;

-- Obtener el provider ID para los modelos
DO $$
DECLARE
  google_provider UUID;
  openrouter_provider UUID;
BEGIN
  SELECT id INTO google_provider FROM d_seo_admin_ai_providers WHERE provider = 'google' LIMIT 1;
  SELECT id INTO openrouter_provider FROM d_seo_admin_ai_providers WHERE provider = 'openrouter' LIMIT 1;

  -- Modelos Google
  INSERT INTO d_seo_admin_ai_models (provider_id, model_id, display_name, parameters) VALUES
    (google_provider, 'gemini-2.5-flash', 'Gemini 2.5 Flash', '{"maxTokens": 20000, "temperature": 0.3}'),
    (google_provider, 'gemini-2.5-pro', 'Gemini 2.5 Pro', '{"maxTokens": 20000, "temperature": 0.3}'),
    (google_provider, 'gemini-2.0-flash', 'Gemini 2.0 Flash', '{"maxTokens": 8000, "temperature": 0.3}')
  ON CONFLICT DO NOTHING;

  -- Modelos OpenRouter
  INSERT INTO d_seo_admin_ai_models (provider_id, model_id, display_name, parameters) VALUES
    (openrouter_provider, 'trinity-large', 'Trinity Large', '{"maxTokens": 20000, "temperature": 0.3}'),
    (openrouter_provider, 'liquid-lfm-2.5', 'Liquid LFM 2.5', '{"maxTokens": 8000, "temperature": 0.3}')
  ON CONFLICT DO NOTHING;
END $$;

-- Configuración por tarea (por defecto usa gemini-2.5-flash)
DO $$
DECLARE
  flash_model UUID;
BEGIN
  SELECT id INTO flash_model FROM d_seo_admin_ai_models WHERE model_id = 'gemini-2.5-flash' LIMIT 1;
  
  INSERT INTO d_seo_admin_ai_task_config (task, model_id, is_default) VALUES
    ('silo', flash_model, true),
    ('filter', flash_model, true),
    ('cluster', flash_model, true)
  ON CONFLICT (task, is_default) DO NOTHING;
END $$;

SELECT 'Tablas de proveedores IA creadas correctamente' as result;
