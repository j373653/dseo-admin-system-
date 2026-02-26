const SUPABASE_URL = 'https://supabase.keepmyweb.com';
const SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.OMpZRweGghcJPva0FqiOk63gQm_rJoj-KXk4cDqrZ2M';

async function fixSilos() {
  console.log('=== Fix silos duplicados v2 ===\n');

  // 1. Obtener IDs
  const silosRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_silos?select=id,name`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const silos = await silosRes.json();
  
  console.log('Silos actuales:', silos.map(s => s.name));
  
  const dwSilo = silos.find(s => s.name === 'Desarrollo Web');
  const dwecomSilo = silos.find(s => s.name === 'Desarrollo Web & E-commerce');
  
  console.log('\nDesarrollo Web ID:', dwSilo?.id);
  console.log('Desarrollo Web & E-commerce ID:', dwecomSilo?.id);
  
  if (!dwSilo || !dwecomSilo) {
    console.log('ERROR: No se encontró alguno de los silos');
    return;
  }

  // 2. Obtener categorías del silo "Desarrollo Web"
  const catsRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_categories?select=id,name,silo_id&silo_id=eq.${dwSilo.id}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const categories = await catsRes.json();
  console.log('\nCategorías a migrar:', categories.map(c => c.name));

  // 3. Obtener páginas con silo_id directo
  const pagesDirectRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_pages?select=id,main_keyword,silo_id&silo_id=eq.${dwSilo.id}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const pagesDirect = await pagesDirectRes.json();
  console.log('Páginas con silo_id directo:', pagesDirect.length);

  // 4. Migrar páginas con silo_id directo
  for (const page of pagesDirect) {
    console.log('  Migrando página:', page.main_keyword);
    await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_pages?id=eq.${page.id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SERVICE_KEY, 
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ silo_id: dwecomSilo.id })
    });
  }

  // 5. Migrar categorías
  for (const cat of categories) {
    console.log('  Migrando categoría:', cat.name);
    await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_categories?id=eq.${cat.id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SERVICE_KEY, 
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ silo_id: dwecomSilo.id })
    });
  }

  // 6. Eliminar silo duplicado
  console.log('\nEliminando silo duplicado...');
  await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_silos?id=eq.${dwSilo.id}`, {
    method: 'DELETE',
    headers: { 
      'apikey': SERVICE_KEY, 
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    }
  });

  // 7. Verificar resultado
  console.log('\n=== Resultado ===');
  const finalSilosRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_silos?select=id,name&order=name`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const finalSilos = await finalSilosRes.json();
  console.log('Silos finales:', finalSilos.map(s => s.name));
  
  console.log('\n=== FIX COMPLETADO ===');
}

fixSilos().catch(console.error);
