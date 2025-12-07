import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProjectForm } from '@/components/ProjectForm';

/**
 * Seite zum Erstellen eines neuen Projekts
 * 
 * Geschützte Seite, die nur für angemeldete Benutzer zugänglich ist.
 */
export default async function NewProjectPage() {
  const supabase = await createServerClient();
  
  // Prüfe, ob der Benutzer angemeldet ist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userName = user.user_metadata?.name || user.email;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-black rounded-2xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Neues Projekt erstellen
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Erstellen Sie ein neues Projekt und verwalten Sie Ihre Zeitaufzeichnungen.
              </p>
            </div>

            <ProjectForm userId={user.id} userName={userName} />
          </div>
        </div>
      </div>
    </div>
  );
}

