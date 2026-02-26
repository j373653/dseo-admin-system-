const SUPABASE_URL = 'https://supabase.keepmyweb.com';
const SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.OMpZRweGghcJPva0FqiOk63gQm_rJoj-KXk4cDqrZ2M';

async function updateModel() {
  console.log('=== Actualizando modelo a gemini-3-flash ===\n');

  // 1. Ver configuración actual
  const res = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?select=task,model`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const config = await res.json();
  console.log('Configuración actual:');
  console.table(config);

  // 2. Actualizar modelo silo a gemini-3-flash
  console.log('\nActualizando modelo silo a gemini-3-flash...');
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?task=eq.silo`, {
    method: 'PATCH',
    headers: { 
      'apikey': SERVICE_KEY, 
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ 
      model: 'gemini-3-flash',
      parameters: { maxTokens: 20000, temperature: 0.3 }
    })
  });
  
  const updated = await updateRes.json();
  console.log('Modelo actualizado:', updated);

  // 3. Verificar cambio
  console.log('\n=== Configuración final ===');
  const finalRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_ai_config?select=task,model`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const finalConfig = await finalRes.json();
  console.table(finalConfig);

  console.log('\n=== COMPLETADO ===');
}

updateModel().catch(console.error);
