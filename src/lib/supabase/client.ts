'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';

/**
 * Erstellt einen Supabase-Client für den Browser
 * 
 * Dieser Client sollte nur in Client Components verwendet werden.
 * Für Server Components verwende createServerClient aus server.ts
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data } = await supabase.from('todos').select();
 * ```
 */
export function createClient() {
  return createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
}

