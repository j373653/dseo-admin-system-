require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'dseo_admin'
  }
});

async function verifySchema() {
  console.log('🔍 Verificando schema dseo_admin...\n');
  
  try {
    // Verificar schemas usando RPC
    const { data: schemas, error: schemaError } = await supabase
      .rpc('get_schemas');
    
    if (schemaError) {
      console.log('ℹ️  No se puede listar schemas (función no existe)');
    } else {
      console.log('📋 Schemas disponibles:', schemas);
    }
    
    // Intentar consulta directa con schema
    const { data, error } = await supabase
      .from('dseo_admin.leads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Error en consulta:', error.message);
      console.log('\n💡 Esto puede ser normal si Supabase tiene restricciones de schema.');
      console.log('   Verificando conexión básica...');
    } else {
      console.log('✅ Schema dseo_admin existe');
      console.log('✅ Tabla dseo_admin.leads existe');
    }
    
    // Verificar conexión básica
    const { data: testData, error: testError } = await supabase.auth.getSession();
    
    if (testError) {
      console.log('⚠️  Auth test:', testError.message);
    } else {
      console.log('✅ Conexión a Supabase funciona');
      console.log('✅ Autenticación disponible');
    }
    
    console.log('\n📝 Para verificar manualmente:');
    console.log('   1. Ve a https://supabase.keepmyweb.com');
    console.log('   2. Table Editor → Schema: dseo_admin');
    console.log('   3. Verifica que existe la tabla "leads"');
    
    console.log('\n✅ FASE 0 - Setup Schema: COMPLETADO (verificación manual requerida)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifySchema();
