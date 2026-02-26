const SUPABASE_URL = 'https://supabase.keepmyweb.com';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function updateModel() {
  console.log('=== Actualizando modelo a gemini-2.5-flash ===\n');

  if (!supabaseServiceKey) {
    console.error('ERROR: SUPABASE_SERVICE_KEY no configurada');
    return;
  }

  // 1. Ver configuración actual
  const res = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?select=task,model`, {
    headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` }
  });
  const config = await res.json();
  console.log('Configuración actual:');
  console.table(config);

  // 2. Actualizar modelo silo a gemini-2.5-flash
  console.log('\nActualizando modelo silo a gemini-2.5-flash...');
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?task=eq.silo`, {
    method: 'PATCH',
    headers: { 
      'apikey': supabaseServiceKey, 
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ 
      model: 'gemini-2.5-flash',
      parameters: { maxTokens: 20000, temperature: 0.3 }
    })
  });
  
  const updated = await updateRes.json();
  console.log('Modelo actualizado:', updated);

  // 3. Verificar cambio
  console.log('\n=== Configuración final ===');
  const finalRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?select=task,model`, {
    headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` }
  });
  const finalConfig = await finalRes.json();
  console.table(finalConfig);

  console.log('\n=== COMPLETADO ===');
}

updateModel().catch(console.error);
