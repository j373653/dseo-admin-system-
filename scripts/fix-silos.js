const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.keepmyweb.com';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.OMpZRweGghcJPva0FqiOk63gQm_rJoj-KXk4cDqrZ2M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSilos() {
  console.log('=== Fix silos duplicados ===\n');
  
  // 1. Ver estado actual
  console.log('1. Estado actual de silos:');
  const { data: silosBefore } = await supabase
    .from('d_seo_admin_silos')
    .select('id, name')
    .order('name');
  console.table(silosBefore);
  
  // 2. Obtener IDs
  const dwSilo = silosBefore?.find(s => s.name === 'Desarrollo Web');
  const dwecomSilo = silosBefore?.find(s => s.name === 'Desarrollo Web & E-commerce');
  
  console.log('Desarrollo Web ID:', dwSilo?.id);
  console.log('Desarrollo Web & E-commerce ID:', dwecomSilo?.id);
  
  if (dwSilo && dwecomSilo) {
    // 3. Migrar categorías
    console.log('\n2. Migrando categorías...');
    const { error: updateError } = await supabase
      .from('d_seo_admin_categories')
      .update({ silo_id: dwecomSilo.id })
      .eq('silo_id', dwSilo.id);
    
    if (updateError) {
      console.error('Error migrando:', updateError);
    } else {
      console.log('Categorías migradas correctamente');
    }
    
    // 4. Eliminar silo duplicado
    console.log('\n3. Eliminando silo duplicado...');
    const { error: deleteError } = await supabase
      .from('d_seo_admin_silos')
      .delete()
      .eq('id', dwSilo.id);
    
    if (deleteError) {
      console.error('Error eliminando:', deleteError);
    } else {
      console.log('Silo duplicado eliminado');
    }
  } else {
    console.log('\nNo se encontró el silo "Desarrollo Web" o "Desarrollo Web & E-commerce"');
  }
  
  // 5. Verificar resultado
  console.log('\n4. Estado final de silos:');
  const { data: silosAfter } = await supabase
    .from('d_seo_admin_silos')
    .select('id, name')
    .order('name');
  console.table(silosAfter);
  
  // 6. Conteo por silo
  console.log('\n5. Conteo de keywords por silo:');
  const { data: stats } = await supabase.rpc('get_silo_stats', {});
  console.log(stats);
  
  // Alternative:手动统计
  const { data: silos } = await supabase
    .from('d_seo_admin_silos')
    .select('id, name');
  
  for (const silo of silos || []) {
    const { data: cats } = await supabase
      .from('d_seo_admin_categories')
      .select('id', { count: 'exact' })
      .eq('silo_id', silo.id);
    
    const { data: pages } = await supabase
      .from('d_seo_admin_pages')
      .select('id', { count: 'exact' })
      .in('category_id', cats?.map(c => c.id) || []);
    
    console.log(`${silo.name}: ${cats?.length || 0} categorías, ${pages?.length || 0} páginas`);
  }
  
  console.log('\n=== FIX COMPLETADO ===');
}

fixSilos().catch(console.error);
