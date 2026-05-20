const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://xoiabprezvsmiadijgoz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWFicHJlenZzbWlhZGlqZ296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0MDU2NSwiZXhwIjoyMDk0NTE2NTY1fQ.sbk3IEpQLWc7eNSuny62TkH7wZMSQnkFgx2Npj9Nsqs"
);

async function run() {
  const { data, error } = await supabase.from('information_schema.columns').select('*').limit(1);
  console.log('Columns Data:', data);
  console.log('Columns Error:', error);
}
run();
