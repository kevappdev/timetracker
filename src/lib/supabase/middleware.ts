import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from './config';

/**
 * Erstellt einen Supabase-Client für Next.js Middleware
 * 
 * Diese Funktion wird in der middleware.ts verwendet, um
 * die Authentifizierung zu handhaben und geschützte Routen zu verwalten.
 * 
 * @param request - Die Next.js Request
 * @returns Supabase-Client und Response
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Aktualisiert die Session, falls sie abgelaufen ist
  await supabase.auth.getUser();

  return response;
}

