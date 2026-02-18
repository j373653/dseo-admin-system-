-- Migrar tablas de dseo_admin a public con prefijo d_seo_admin_
-- Fecha: 2025-02-18

-- Renombrar tablas existentes (si existen en dseo_admin)
DO $$
BEGIN
    -- Verificar si la tabla leads existe en dseo_admin
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'dseo_admin' AND table_name = 'leads') THEN
        
        -- Crear tabla en public con prefijo (si no existe) - incluye todas las columnas del source
        CREATE TABLE IF NOT EXISTS public.d_seo_admin_leads (
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
        
        -- Copiar datos existentes (especificar columnas explícitamente)
        INSERT INTO public.d_seo_admin_leads (
            id, email, name, company, phone, source, landing_page,
            utm_source, utm_medium, utm_campaign, utm_content,
            company_size, industry, service_interest, message,
            status, lead_score, downloaded_content, pages_visited,
            emails_opened, emails_clicked, notes, created_at, updated_at
        )
        SELECT 
            id, email, name, company, phone, source, landing_page,
            utm_source, utm_medium, utm_campaign, utm_content,
            company_size, industry, service_interest, message,
            status, lead_score, downloaded_content, pages_visited,
            emails_opened, emails_clicked, notes, created_at, updated_at
        FROM dseo_admin.leads 
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Tabla leads migrada a public.d_seo_admin_leads';
    ELSE
        -- Crear tabla vacía si no existe en dseo_admin
        CREATE TABLE IF NOT EXISTS public.d_seo_admin_leads (
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
        
        RAISE NOTICE 'Tabla public.d_seo_admin_leads creada (no existía en dseo_admin)';
    END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_d_seo_admin_leads_email ON public.d_seo_admin_leads(email);
CREATE INDEX IF NOT EXISTS idx_d_seo_admin_leads_status ON public.d_seo_admin_leads(status);
CREATE INDEX IF NOT EXISTS idx_d_seo_admin_leads_created_at ON public.d_seo_admin_leads(created_at DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_d_seo_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_d_seo_admin_leads_updated_at ON public.d_seo_admin_leads;
CREATE TRIGGER update_d_seo_admin_leads_updated_at 
    BEFORE UPDATE ON public.d_seo_admin_leads 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_d_seo_admin_updated_at();

-- RLS (Row Level Security) - desactivado para permitir acceso desde API
ALTER TABLE public.d_seo_admin_leads DISABLE ROW LEVEL SECURITY;

-- Confirmación
SELECT 'Migración completada. Tablas disponibles:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'd_seo_admin_%';
