import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/LogoutButton';
import type { Project } from '@/types';

/**
 * Projekte-Übersichtsseite
 * 
 * Zeigt alle Projekte des angemeldeten Benutzers an.
 */
export default async function ProjectsPage() {
  const supabase = await createServerClient();
  
  // Prüfe, ob der Benutzer angemeldet ist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Lade alle Projekte des Benutzers
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Projekte:', error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Meine Projekte
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Verwalten Sie Ihre Projekte und Zeitaufzeichnungen
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/projects/new">
                <Button variant="primary">
                  Neues Projekt
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-black rounded-xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-6 hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {project.name}
                  </h3>
                  
                  {project.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Stundenlohn:</span>
                      <span className="font-medium text-foreground">
                        {project.hourly_rate.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Erstellt:</span>
                      <span className="text-foreground">
                        {new Date(project.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-black/[.08] dark:border-white/[.145]">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm text-foreground hover:underline font-medium"
                    >
                      Details anzeigen →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-black rounded-2xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-12 text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Noch keine Projekte
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Erstellen Sie Ihr erstes Projekt, um zu beginnen.
              </p>
              <Link href="/projects/new">
                <Button variant="primary">
                  Neues Projekt erstellen
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

