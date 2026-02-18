-- Script de inicialización del schema dseo_admin
-- Sistema D-SEO: Captación de Leads + Contenido SEO
-- Fecha: 2025-02-17

-- Crear schema si no existe
CREATE SCHEMA IF NOT EXISTS dseo_admin;

-- Tabla: dseo_admin_leads
-- Almacena todos los leads capturados
CREATE TABLE IF NOT EXISTS dseo_admin.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    company VARCHAR(100),
    phone VARCHAR(20),
    source VARCHAR(50),
    landing_page VARCHAR(255),
    utm_source VARCHAR(50),
    utm_medium VARCHAR(50),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    company_size VARCHAR(20),
    industry VARCHAR(50),
    service_interest VARCHAR(50),
    message TEXT,
    status VARCHAR(20) DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    downloaded_content JSONB,
    pages_visited TEXT[],
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON dseo_admin.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON dseo_admin.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON dseo_admin.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON dseo_admin.leads(created_at DESC);

-- Comentarios
COMMENT ON TABLE dseo_admin.leads IS 'Tabla principal de leads capturados';
COMMENT ON COLUMN dseo_admin.leads.status IS 'Estado del lead: new, contacted, qualified, proposal, closed_won, closed_lost';
COMMENT ON COLUMN dseo_admin.leads.lead_score IS 'Puntuación automática 0-100 basada en comportamiento y datos';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION dseo_admin.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON dseo_admin.leads 
    FOR EACH ROW 
    EXECUTE FUNCTION dseo_admin.update_updated_at_column();

-- Política RLS: Solo usuarios autenticados pueden leer/escribir
ALTER TABLE dseo_admin.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access" ON dseo_admin.leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Confirmación
SELECT 'Schema dseo_admin y tabla leads creados correctamente' as status;
