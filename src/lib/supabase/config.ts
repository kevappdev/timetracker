/**
 * Supabase Konfiguration
 * 
 * Diese Datei enthält die Konfiguration für die Supabase-Verbindung.
 * Die Umgebungsvariablen sollten in einer .env.local Datei definiert werden:
 * 
 * NEXT_PUBLIC_SUPABASE_URL=your-project-url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 * SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (nur server-side!)
 */

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * Validiert, ob alle erforderlichen Umgebungsvariablen gesetzt sind
 */
export function validateSupabaseConfig(): void {
  if (!supabaseConfig.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ist nicht gesetzt');
  }
  if (!supabaseConfig.anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht gesetzt');
  }
}
