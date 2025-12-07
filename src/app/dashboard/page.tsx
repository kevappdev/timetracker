'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { TicketList } from '@/components/dashboard/TicketList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase';
import type { Project } from '@/types';
import type { Ticket } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Prüfe, ob der Benutzer angemeldet ist
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Lade alle Projekte des Benutzers
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', currentUser.id)
        .order('name', { ascending: true });

      if (projectsError) {
        console.error('Fehler beim Laden der Projekte:', projectsError);
      } else {
        setProjects(projectsData || []);
        // Wähle automatisch das erste Projekt aus, falls vorhanden
        if (projectsData && projectsData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsData[0].id);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  useEffect(() => {
    const loadTickets = async () => {
      if (!selectedProjectId) {
        setTickets([]);
        return;
      }

      const supabase = createClient();
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('ticket_number', { ascending: true });

      if (ticketsError) {
        console.error('Fehler beim Laden der Tickets:', ticketsError);
      } else {
        setTickets(ticketsData || []);
      }
    };

    loadTickets();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Lädt...</p>
      </div>
    );
  }


  return (
    <DashboardLayout
      user={user}
      projects={projects}
      tickets={tickets}
      showCreateButton={true}
      renderChildren={({ runningTimeEntry, onStopTimeTracking, refreshTimer }) => (
        <>
          {/* Hauptbereich: 2-Spalten-Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Linke Spalte: Projekte */}
            <div className="lg:col-span-1">
              <div className="p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-foreground mb-4">Projekte</h2>
                <ProjectList
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                />
              </div>
            </div>

            {/* Rechte Spalte: Tickets */}
            <div className="lg:col-span-2">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {selectedProject ? `Tickets: ${selectedProject.name}` : 'Tickets'}
                </h2>
                <TicketList 
                  tickets={tickets} 
                  projectName={selectedProject?.name}
                  projectId={selectedProjectId || undefined}
                  runningTimeEntry={runningTimeEntry ? {
                    id: runningTimeEntry.id,
                    ticket_id: runningTimeEntry.ticket_id,
                    project_id: runningTimeEntry.project_id
                  } : null}
                  onTimeTrackingStart={() => {
                    // Warte kurz, damit die Datenbank aktualisiert ist, dann lade Timer neu
                    setTimeout(() => {
                      refreshTimer();
                    }, 200);
                  }}
                  onStopTimeTracking={onStopTimeTracking}
                  onTicketUpdate={() => {
                    // Lade Tickets neu
                    const loadTickets = async () => {
                      if (!selectedProjectId) {
                        setTickets([]);
                        return;
                      }
                      const supabase = createClient();
                      const { data: ticketsData } = await supabase
                        .from('tickets')
                        .select('*')
                        .eq('project_id', selectedProjectId)
                        .order('ticket_number', { ascending: true });
                      if (ticketsData) {
                        setTickets(ticketsData);
                      }
                    };
                    loadTickets();
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    />
  );
}
