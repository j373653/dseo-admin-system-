const SUPABASE_URL = "https://supabase.keepmyweb.com";
const SERVICE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.OMpZRweGghcJPva0FqiOk63gQm_rJoj-KXk4cDqrZ2M";

async function deduplicate() {
  console.log('Fetching all assignments...');
  
  // Get all assignments
  const res = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_keyword_assignments?select=id,keyword_id,page_id,assigned_at&order=assigned_at.desc`, {
    headers: { 
      'apikey': SERVICE_KEY, 
      'Authorization': `Bearer ${SERVICE_KEY}` 
    }
  });
  const data = await res.json();
  console.log(`Total assignments: ${data.length}`);
  
  // Group by keyword_id
  const keywordMap = new Map();
  data.forEach((row) => {
    if (!keywordMap.has(row.keyword_id)) {
      keywordMap.set(row.keyword_id, []);
    }
    keywordMap.get(row.keyword_id).push(row);
  });
  
  // Find IDs to remove (keep only first/latest)
  const idsToRemove = [];
  let duplicatesFound = 0;
  
  keywordMap.forEach((assignments) => {
    if (assignments.length > 1) {
      duplicatesFound += assignments.length - 1;
      for (let i = 1; i < assignments.length; i++) {
        idsToRemove.push(assignments[i].id);
      }
    }
  });
  
  console.log(`Keywords with duplicates: ${duplicatesFound}`);
  console.log(`IDs to remove: ${idsToRemove.length}`);
  
  if (idsToRemove.length === 0) {
    console.log('No duplicates found!');
    return;
  }
  
  // Delete in batches
  const batchSize = 100;
  let totalRemoved = 0;
  
  for (let i = 0; i < idsToRemove.length; i += batchSize) {
    const batch = idsToRemove.slice(i, i + batchSize);
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_keyword_assignments?id=in.(${batch.join(',')})`, {
      method: 'DELETE',
      headers: { 
        'apikey': SERVICE_KEY, 
        'Authorization': `Bearer ${SERVICE_KEY}` 
      }
    });
    
    if (deleteRes.ok) {
      totalRemoved += batch.length;
      console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}: ${totalRemoved}/${idsToRemove.length}`);
    } else {
      console.error('Error deleting batch:', await deleteRes.text());
    }
  }
  
  console.log(`\nDeduplication complete!`);
  console.log(`Duplicates found: ${duplicatesFound}`);
  console.log(`Removed: ${totalRemoved}`);
}

deduplicate().catch(console.error);
