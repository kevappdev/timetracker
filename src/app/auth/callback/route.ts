import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route
 * 
 * Diese Route wird von Supabase aufgerufen, nachdem ein Benutzer
 * seine E-Mail bestätigt hat oder sich über einen Magic Link angemeldet hat.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Erfolgreiche Authentifizierung - weiterleiten
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Bei Fehler zur Login-Seite weiterleiten
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}

