import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://lrbmdxrikfwrxgsawgwi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYm1keHJpa2Z3cnhnc2F3Z3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIzNTU3MCwiZXhwIjoyMDc0ODExNTcwfQ.3G8khAUTM_FqI8P2id7wtg_k4NGpPBy85AcWdhmMgVE'
);