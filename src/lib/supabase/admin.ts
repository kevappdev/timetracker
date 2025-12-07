import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

/**
 * Erstellt einen Supabase-Client mit Admin-Rechten (Service Role)
 * 
 * ACHTUNG: Dieser Client umgeht Row Level Security (RLS)!
 * Nur serverseitig und mit Vorsicht verwenden.
 */
export function createAdminClient() {
  if (!supabaseConfig.serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt. Admin-Funktionen werden fehlschlagen.');
  }

  return createClient(
    supabaseConfig.url,
    supabaseConfig.serviceRoleKey || 'place-holder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

