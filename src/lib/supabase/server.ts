import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

/**
 * Erstellt einen Supabase-Client für Server Components
 * 
 * Dieser Client sollte nur in Server Components, API Routes oder Server Actions verwendet werden.
 * Er hat Zugriff auf die Cookies und kann daher die Session des Benutzers lesen.
 * 
 * @example
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createServerClient();
 *   const { data } = await supabase.from('todos').select();
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Die setAll-Methode wurde von einem Server Component aufgerufen.
            // Dies kann ignoriert werden, da Middleware die Cookies setzt.
          }
        },
      },
    }
  );
}

