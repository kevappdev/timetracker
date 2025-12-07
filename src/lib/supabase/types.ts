/**
 * Supabase TypeScript Typen
 * 
 * Diese Datei kann verwendet werden, um generierte Typen von Supabase zu importieren.
 * 
 * Um Typen zu generieren, verwende:
 * npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
 * 
 * Oder importiere sie manuell:
 * import type { Database } from '@/lib/supabase/types';
 */

// Beispiel-Struktur für Typen (wird durch generierte Typen ersetzt)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Hier werden die generierten Tabellen-Typen eingefügt
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}

