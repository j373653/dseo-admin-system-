-- Migración 15: AI Config - Configuración de Modelos IA
-- Fecha: 2026-02-22
-- Objetivo: Guardar configuración de modelos IA en DB para gestión sin código

-- Tabla de configuración de modelos IA
CREATE TABLE IF NOT EXISTS d_seo_admin_ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuraciones iniciales según AI_MODELS_GUIDE
INSERT INTO d_seo_admin_ai_config (task, model, parameters) VALUES
('filter', 'gemini-2.5-flash-lite', '{"maxTokens": 4000, "description": "Filtrado rápido de keywords"}'),
('cluster', 'gemini-2.5-flash', '{"maxTokens": 8000, "description": "Clustering semántico"}'),
('silo', 'gemini-2.5-pro', '{"maxTokens": 20000, "temperature": 0.3, "description": "Arquitectura SILO compleja"}')
ON CONFLICT (task) DO NOTHING;

-- Disable RLS for development
ALTER TABLE d_seo_admin_ai_config DISABLE ROW LEVEL SECURITY;

-- Función helper para obtener modelo por tarea
CREATE OR REPLACE FUNCTION get_ai_model(p_task VARCHAR)
RETURNS TABLE(model VARCHAR, parameters JSONB) AS $$
BEGIN
  RETURN QUERY 
  SELECT ai.model, ai.parameters 
  FROM d_seo_admin_ai_config ai 
  WHERE ai.task = p_task AND ai.active = true;
END;
$$ LANGUAGE plpgsql;
