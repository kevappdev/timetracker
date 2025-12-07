'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Drawer } from '@/components/layout/Drawer';
import { StartTimeTracking } from '@/components/TimeTracking/StartTimeTracking';
import { RunningTimer } from '@/components/TimeTracking/RunningTimer';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import type { Project } from '@/types';
import type { Ticket } from '@/types';
import type { RunningTimeEntry } from '@/types';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  user: any;
  projects: Project[];
  tickets: Ticket[];
  onTimeTrackingStart?: () => void;
  showCreateButton?: boolean;
  showTimeTrackingButton?: boolean;
  renderChildren?: (props: { runningTimeEntry: RunningTimeEntry | null; onStopTimeTracking: () => void; refreshTimer: () => void }) => React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  projects,
  tickets,
  onTimeTrackingStart,
  showCreateButton = false,
  showTimeTrackingButton = false,
  renderChildren,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [runningTimeEntry, setRunningTimeEntry] = useState<RunningTimeEntry | null>(null);
  const createPopupRef = useRef<HTMLDivElement>(null);

  // Funktion zum Laden des laufenden Zeittrackings
  const loadRunningTimeEntry = React.useCallback(async () => {
      if (!user) return;

      const supabase = createClient();

      // Lade laufendes Zeittracking (ohne end_time)
      const { data: runningData } = await supabase
        .from('time_entries')
        .select('id, project_id, ticket_id, start_time')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (runningData) {
        // Lade Projekt- und Ticket-Informationen
        const { data: projectData } = await supabase
          .from('projects')
          .select('name')
          .eq('id', runningData.project_id)
          .single();

        let ticketData = null;
        if (runningData.ticket_id) {
          const { data: ticket } = await supabase
            .from('tickets')
            .select('ticket_number, title')
            .eq('id', runningData.ticket_id)
            .single();
          ticketData = ticket;
        }

        setRunningTimeEntry({
          ...runningData,
          project_name: projectData?.name,
          ticket_number: ticketData?.ticket_number,
          ticket_title: ticketData?.title,
        });
      } else {
        setRunningTimeEntry(null);
      }
  }, [user]);

  // Lade laufendes Zeittracking beim Mount
  useEffect(() => {
    if (user) {
      loadRunningTimeEntry();
    }
  }, [user, loadRunningTimeEntry]);

  // Supabase Realtime Subscription für laufende Zeiterfassungen
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Erstelle eine Subscription für Änderungen an time_entries
    const channel = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${user.id}`, // Nur Einträge des aktuellen Benutzers
        },
        (payload) => {
          // Lade laufendes Zeittracking neu bei jeder Änderung
          // (INSERT für neues Tracking, UPDATE wenn end_time gesetzt wird, DELETE wenn gelöscht)
          loadRunningTimeEntry();
        }
      )
      .subscribe();

    // Cleanup: Unsubscribe beim Unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadRunningTimeEntry]);


  // Schließe Create-Popup beim Klicken außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createPopupRef.current && !createPopupRef.current.contains(event.target as Node)) {
        setIsCreatePopupOpen(false);
      }
    };

    if (isCreatePopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreatePopupOpen]);

  return (
    <>
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-xl"
                  >
                    ☰
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      Time Tracker
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Willkommen zurück, {user?.user_metadata?.name || user?.email}!
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {showTimeTrackingButton && !runningTimeEntry && (
                    <StartTimeTracking
                      projects={projects}
                      tickets={tickets}
                      onStart={() => {
                        // Lade laufendes Zeittracking neu
                        const loadRunningTimeEntry = async () => {
                          if (!user) return;
                          const supabase = createClient();
                          const { data: runningData } = await supabase
                            .from('time_entries')
                            .select('id, project_id, ticket_id, start_time')
                            .eq('user_id', user.id)
                            .is('end_time', null)
                            .order('start_time', { ascending: false })
                            .limit(1)
                            .single();

                          if (runningData) {
                            const { data: projectData } = await supabase
                              .from('projects')
                              .select('name')
                              .eq('id', runningData.project_id)
                              .single();

                            let ticketData = null;
                            if (runningData.ticket_id) {
                              const { data: ticket } = await supabase
                                .from('tickets')
                                .select('ticket_number')
                                .eq('id', runningData.ticket_id)
                                .single();
                              ticketData = ticket;
                            }

                            setRunningTimeEntry({
                              ...runningData,
                              project_name: projectData?.name,
                              ticket_number: ticketData?.ticket_number,
                            });
                          } else {
                            setRunningTimeEntry(null);
                          }
                        };
                        loadRunningTimeEntry();
                        if (onTimeTrackingStart) {
                          onTimeTrackingStart();
                        }
                      }}
                    />
                  )}
                  {showCreateButton && (
                    <div className="relative" ref={createPopupRef}>
                      <Button
                        variant="primary"
                        onClick={() => setIsCreatePopupOpen(!isCreatePopupOpen)}
                      >
                        Erstellen +
                      </Button>

                      {/* Create-Popup */}
                      {isCreatePopupOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50">
                          <div className="p-2">
                            <Link
                              href="/tickets/new"
                              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-foreground"
                              onClick={() => setIsCreatePopupOpen(false)}
                            >
                              <div className="font-medium">Neues Ticket</div>
                              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                Ticket für ein Projekt erstellen
                              </div>
                            </Link>
                            <Link
                              href="/projects/new"
                              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-foreground"
                              onClick={() => setIsCreatePopupOpen(false)}
                            >
                              <div className="font-medium">Neues Projekt</div>
                              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                Neues Projekt anlegen
                              </div>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Laufendes Zeittracking */}
            {runningTimeEntry && (
              <div className="mb-6">
                <RunningTimer
                  timeEntry={runningTimeEntry}
                  onStop={async () => {
                    // Lade den State neu, um sicherzustellen, dass die Zeiterfassung wirklich beendet wurde
                    const loadRunningTimeEntry = async () => {
                      if (!user) return;
                      const supabase = createClient();
                      const { data: runningData } = await supabase
                        .from('time_entries')
                        .select('id, project_id, ticket_id, start_time')
                        .eq('user_id', user.id)
                        .is('end_time', null)
                        .order('start_time', { ascending: false })
                        .limit(1)
                        .single();

                      if (runningData) {
                        const { data: projectData } = await supabase
                          .from('projects')
                          .select('name')
                          .eq('id', runningData.project_id)
                          .single();

                        let ticketData = null;
                        if (runningData.ticket_id) {
                          const { data: ticket } = await supabase
                            .from('tickets')
                            .select('ticket_number, title')
                            .eq('id', runningData.ticket_id)
                            .single();
                          ticketData = ticket;
                        }

                        setRunningTimeEntry({
                          ...runningData,
                          project_name: projectData?.name,
                          ticket_number: ticketData?.ticket_number,
                          ticket_title: ticketData?.title,
                        });
                      } else {
                        setRunningTimeEntry(null);
                      }
                    };
                    await loadRunningTimeEntry();
                    // Aktualisiere nach Stoppen
                    if (onTimeTrackingStart) {
                      onTimeTrackingStart();
                    }
                  }}
                />
              </div>
            )}

            {/* Content */}
            {renderChildren 
              ? renderChildren({ 
                  runningTimeEntry, 
                  onStopTimeTracking: () => {
                    setRunningTimeEntry(null);
                    if (onTimeTrackingStart) {
                      onTimeTrackingStart();
                    }
                  },
                  refreshTimer: loadRunningTimeEntry
                })
              : children}
          </div>
        </div>
      </div>
    </>
  );
};

