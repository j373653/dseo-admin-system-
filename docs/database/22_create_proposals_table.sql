-- ============================================================================
-- Tabla para guardar propuestas SILO
-- Fecha: 2026-02-26
-- ============================================================================

-- Tabla de propuestas
CREATE TABLE IF NOT EXISTS d_seo_admin_silo_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  proposal JSONB NOT NULL,
  intentions JSONB,
  discard_selected UUID[],
  keywords_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE d_seo_admin_silo_proposals ENABLE ROW LEVEL SECURITY;

-- Política de acceso
DROP POLICY IF EXISTS "Admin full access proposals" ON d_seo_admin_silo_proposals;
CREATE POLICY "Admin full access proposals" ON d_seo_admin_silo_proposals
  FOR ALL USING (true);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_silo_proposals_status ON d_seo_admin_silo_proposals(status);
CREATE INDEX IF NOT EXISTS idx_silo_proposals_created ON d_seo_admin_silo_proposals(created_at DESC);

SELECT 'Tabla d_seo_admin_silo_proposals creada correctamente' as result;
