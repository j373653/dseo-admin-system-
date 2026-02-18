require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Conectando a Supabase...');
  console.log('   URL:', supabaseUrl);
  
  try {
    // Test básico de conexión
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Tabla no existe
        console.log('⚠️  La tabla no existe todavía. Esto es normal.');
        console.log('   Creando schema y tablas...');
        await createSchema();
      } else {
        throw error;
      }
    } else {
      console.log('✅ Conexión exitosa');
      console.log('✅ Schema y tablas ya existen');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

async function createSchema() {
  try {
    // Crear schema
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE SCHEMA IF NOT EXISTS dseo_admin;'
    });
    
    if (schemaError) {
      console.log('⚠️  Nota:', schemaError.message);
      console.log('   Intentando crear tabla directamente...');
    } else {
      console.log('✅ Schema dseo_admin creado/verificado');
    }
    
    // Crear tabla leads
    const createTableSQL = `
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
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (tableError) {
      console.log('⚠️  Usando método alternativo (directo)...');
      // Si no podemos usar exec_sql, intentamos insertar para que cree la tabla
      const { error: testError } = await supabase
        .from('leads')
        .insert([{ email: 'test@example.com', name: 'Test' }]);
      
      if (testError && testError.code !== '23505') { // No es error de duplicado
        throw testError;
      }
    }
    
    console.log('✅ Tabla dseo_admin.leads creada/verificada');
    
  } catch (error) {
    console.error('❌ Error creando schema:', error.message);
    console.log('\n💡 Solución alternativa:');
    console.log('   Ejecuta el SQL manualmente desde el panel de Supabase:');
    console.log('   docs/database/01_create_schema_leads.sql');
  }
}

console.log('🚀 FASE 0: Setup Schema dseo_admin\n');
testConnection();
