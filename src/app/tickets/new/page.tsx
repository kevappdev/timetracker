import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TicketForm } from '@/components/TicketForm';
import type { Project } from '@/types';

/**
 * Seite zum Erstellen eines neuen Tickets
 * 
 * Geschützte Seite, die nur für angemeldete Benutzer zugänglich ist.
 */
export default async function NewTicketPage() {
  const supabase = await createServerClient();
  
  // Prüfe, ob der Benutzer angemeldet ist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Lade alle Projekte des Benutzers für die Auswahl
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Fehler beim Laden der Projekte:', error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-black rounded-2xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Neues Ticket erstellen
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Erstellen Sie ein neues Ticket und ordnen Sie es einem Projekt zu.
              </p>
            </div>

            <TicketForm userId={user.id} projects={projects || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

