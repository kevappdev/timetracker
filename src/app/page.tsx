import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Root-Seite
 * 
 * Leitet Benutzer je nach Authentifizierungsstatus weiter:
 * - Angemeldet: Weiterleitung zu /dashboard
 * - Nicht angemeldet: Weiterleitung zu /login
 */
export default async function Home() {
  const supabase = await createServerClient();
  
  // Prüfe, ob der Benutzer angemeldet ist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Benutzer ist angemeldet - weiterleiten zum Dashboard
    redirect('/dashboard');
  } else {
    // Benutzer ist nicht angemeldet - weiterleiten zur Login-Seite
    redirect('/login');
  }
}
