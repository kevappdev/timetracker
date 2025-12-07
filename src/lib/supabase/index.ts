/**
 * Supabase Client Module
 * 
 * Zentrale Export-Datei für alle Supabase-bezogenen Funktionen
 * 
 * HINWEIS: createServerClient wird NICHT hier exportiert, da es next/headers verwendet
 * und nur in Server Components funktioniert. Importiere es direkt aus './server'
 */

// Client-Erstellung (nur Browser-Client)
export { createClient } from './client';
export { updateSession } from './middleware';

// Konfiguration
export { supabaseConfig, validateSupabaseConfig } from './config';

// Typen
export type { Database, Json } from './types';

