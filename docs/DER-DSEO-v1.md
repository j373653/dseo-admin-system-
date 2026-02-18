DOCUMENTO 1: ESPECIFICACIONES TÉCNICAS (DER)
Markdown
Copy
Code
Preview
# DOCUMENTO DE ESPECIFICACIONES TÉCNICAS (DER)
## Sistema de Captación de Leads D-SEO
### Versión 1.0 - Febrero 2024

---

## 1. RESUMEN EJECUTIVO

**Objetivo:** Construir un sistema automatizado de captación de leads basado en contenido SEO, integrando herramientas existentes (Semrush, CSVs) con infraestructura propia (Coolify VPS, Supabase, n8n).

**Stack Tecnológico:**
- Frontend: Next.js 14 (estático o ISR según decisión)
- Backend: Supabase (Postgres + Edge Functions)
- Automatización: n8n (self-hosted en VPS)
- Hosting: Coolify VPS + Hosting compartido (actual)
- Datos: Search Console API, CSVs manuales de herramientas SEO

---

## 2. ARQUITECTURA DE DATOS

### 2.1 Base de Datos Supabase

#### Tabla: `raw_keywords` (Importación CSV)

```sql
CREATE TABLE raw_keywords (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    cpc DECIMAL(8,2),
    competition DECIMAL(3,2),
    source_tool VARCHAR(50),
    source_file VARCHAR(100),
    import_date DATE DEFAULT CURRENT_DATE,
    raw_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_raw_keywords_processed ON raw_keywords(processed);
CREATE INDEX idx_raw_keywords_volume ON raw_keywords(search_volume) WHERE search_volume > 0;
Tabla: keywords_enriched (Procesadas)
sql
Copy
CREATE TABLE keywords_enriched (
    id uuid PRIMARY KEY,
    keyword VARCHAR(255) UNIQUE NOT NULL,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    cpc DECIMAL(8,2),
    search_intent VARCHAR(20) CHECK (search_intent IN ('informational', 'commercial', 'transactional', 'navigational', 'unknown')),
    intent_confidence DECIMAL(3,2),
    cluster_id UUID REFERENCES keyword_clusters(id),
    cluster_main BOOLEAN DEFAULT FALSE,
    content_type VARCHAR(20) CHECK (content_type IN ('pillar', 'supporting', 'service_page', 'landing_local', 'comparison')),
    priority_score DECIMAL(5,2),
    assigned_url VARCHAR(255),
    content_status VARCHAR(20) DEFAULT 'pending',
    current_position DECIMAL(4,1),
    current_clicks INTEGER,
    current_impressions INTEGER,
    current_ctr DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keywords_enriched_cluster ON keywords_enriched(cluster_id);
CREATE INDEX idx_keywords_enriched_status ON keywords_enriched(content_status);
CREATE INDEX idx_keywords_enriched_priority ON keywords_enriched(priority_score DESC) WHERE content_status = 'pending';
Tabla: keyword_clusters
sql
Copy
CREATE TABLE keyword_clusters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cluster_name VARCHAR(100),
    main_keyword VARCHAR(255),
    search_volume_total INTEGER,
    difficulty_avg INTEGER,
    content_strategy TEXT,
    pillar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
Tabla: search_console_data
sql
Copy
CREATE TABLE search_console_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    query VARCHAR(255) NOT NULL,
    page VARCHAR(255),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4),
    position DECIMAL(4,1),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, query, page)
);

CREATE INDEX idx_sc_data_date ON search_console_data(date);
CREATE INDEX idx_sc_data_query ON search_console_data(query);
CREATE INDEX idx_sc_data_page ON search_console_data(page);
Tabla: content_calendar
sql
Copy
CREATE TABLE content_calendar (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword_id UUID REFERENCES keywords_enriched(id),
    content_type VARCHAR(20),
    title VARCHAR(255),
    outline JSONB,
    assigned_writer VARCHAR(100),
    due_date DATE,
    publish_date DATE,
    status VARCHAR(20) DEFAULT 'planned',
    url_published VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
Tabla: leads
sql
Copy
CREATE TABLE leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    company VARCHAR(100),
    phone VARCHAR(20),
    source VARCHAR(50),
    landing_page VARCHAR(255),
    utm_source VARCHAR(50),
    utm_medium VARCHAR(50),
    utm_campaign VARCHAR(100),
    company_size VARCHAR(20),
    industry VARCHAR(50),
    service_interest VARCHAR(50),
    status VARCHAR(20) DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    downloaded_content JSONB,
    pages_visited TEXT[],
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
3. WORKFLOWS N8N
3.1 Importación de Keywords (CSV → Supabase)
Trigger: Manual o Schedule
Pasos:
Read Binary Files (lee CSV de /uploads/keywords/)
Spreadsheet File (convierte CSV a JSON)
Function Node (limpieza)
Supabase Insert (tabla raw_keywords)
Slack Notification
Código Function Node:
JavaScript
Copy
return items.map(item => ({
  json: {
    keyword: item.json.Keyword?.trim().toLowerCase(),
    search_volume: parseInt(item.json.Volume) || 0,
    keyword_difficulty: parseInt(item.json['Keyword Difficulty']) || null,
    cpc: parseFloat(item.json.CPC?.replace('$','')) || null,
    source_tool: 'semrush',
    source_file: $input.first().binary.data.fileName,
    raw_data: item.json
  }
}));
3.2 Enriquecimiento de Keywords
Código Function Node:
JavaScript
Copy
function detectIntent(keyword) {
  const kw = keyword.toLowerCase();
  const transactional = ['comprar', 'contratar', 'precio', 'presupuesto', 'online'];
  const commercial = ['mejor', 'agencia', 'empresa', 'servicio', 'profesional'];
  const informational = ['qué es', 'cómo', 'guía', 'tutorial', 'ejemplos'];
  
  if (transactional.some(t => kw.includes(t))) return { intent: 'transactional', confidence: 0.9 };
  if (commercial.some(t => kw.includes(t))) return { intent: 'commercial', confidence: 0.8 };
  if (informational.some(t => kw.includes(t))) return { intent: 'informational', confidence: 0.85 };
  return { intent: 'unknown', confidence: 0 };
}

function calculatePriority(volume, difficulty, intent) {
  const intentValue = { transactional: 3, commercial: 2, informational: 1, unknown: 0.5 };
  const diff = difficulty || 50;
  return ((volume * intentValue[intent]) / (diff * 0.5)).toFixed(2);
}

function determineContentType(keyword, intent, volume, difficulty) {
  if (intent === 'transactional' && volume < 500) return 'service_page';
  if (intent === 'commercial' && difficulty < 30) return 'landing_local';
  if (volume > 2000 && difficulty < 40) return 'pillar';
  if (intent === 'informational') return 'supporting';
  return 'blog';
}

const enriched = items.map(item => {
  const kw = item.json.keyword;
  const intentData = detectIntent(kw);
  
  return {
    json: {
      keyword: kw,
      search_volume: item.json.search_volume,
      keyword_difficulty: item.json.keyword_difficulty,
      cpc: item.json.cpc,
      search_intent: intentData.intent,
      intent_confidence: intentData.confidence,
      priority_score: calculatePriority(item.json.search_volume, item.json.keyword_difficulty, intentData.intent),
      content_type: determineContentType(kw, intentData.intent, item.json.search_volume, item.json.keyword_difficulty),
      content_status: 'pending'
    }
  };
});

return enriched;
3.3 Extracción Search Console
Trigger: Schedule (diario 3 AM)
Configuración HTTP Request:
URL: https://www.googleapis.com/webmasters/v3/sites/https://d-seo.es/searchAnalytics/query
Auth: OAuth2
Body:
JSON
Copy
{
  "startDate": "{{ $today.minus({days: 3}).format('YYYY-MM-DD') }}",
  "endDate": "{{ $today.format('YYYY-MM-DD') }}",
  "dimensions": ["query", "page", "date"],
  "rowLimit": 25000
}
4. DASHBOARD INTERNO (Next.js)
Vistas Requeridas:
/admin - Dashboard principal con KPIs
/admin/keywords - Gestión de keywords (tabla filtrable)
/admin/calendar - Calendario editorial
/admin/leads - Gestión de leads con filtros
API Routes:
plain
Copy
GET    /api/keywords?status=pending&limit=50
POST   /api/keywords/bulk-update
GET    /api/keywords/clusters
GET    /api/search-console/opportunities
GET    /api/search-console/performance?days=30
GET    /api/leads
POST   /api/leads
PATCH  /api/leads/[id]
5. VARIABLES DE ENTORNO
plain
Copy
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SEARCH_CONSOLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY...
SEARCH_CONSOLE_CLIENT_EMAIL=...
BREVO_API_KEY=xkeysib-...
TELEGRAM_BOT_TOKEN=...
N8N_WEBHOOK_SECRET=...
6. CRONOGRAMA
Table
Copy
Fase	Semana	Entregables
1. Fundación	1-2	Setup Supabase, tablas, n8n instalado
2. Importación	3	Workflow CSV→Supabase funcionando
3. Enriquecimiento	4	Lógica de intent y priority_score
4. Search Console	5-6	Integración API, alertas
5. Leads	7-8	Formularios, email automation
6. Optimización	9-10	Dashboard completo
7. CRITERIOS DE ACEPTACIÓN
[ ] Importar CSV de 1000 keywords en < 2 minutos
[ ] Enriquecimiento automático de intención con >80% precisión
[ ] Dashboard muestra top 50 oportunidades actualizadas diariamente
[ ] Lead capturado → Notificación en Telegram < 30 segundos
[ ] Search Console data actualizada diariamente sin intervención manual