'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { createClient } from '@/lib/supabase';
import type { Ticket } from '@/types';

interface TicketListProps {
  tickets: Ticket[];
  projectName?: string;
  projectId?: string;
  onTimeTrackingStart?: () => void;
  runningTimeEntry?: { id: string; ticket_id: string | null; project_id: string } | null;
  onStopTimeTracking?: () => void;
  onTicketUpdate?: () => void;
}

type SortField = 'ticket_number' | 'title' | 'status' | 'priority' | 'due_date' | 'created_at';
type SortDirection = 'asc' | 'desc';

export const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  projectName, 
  projectId,
  onTimeTrackingStart,
  runningTimeEntry,
  onStopTimeTracking,
  onTicketUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('ticket_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [startingTicketId, setStartingTicketId] = useState<string | null>(null);
  const [stoppingTicketId, setStoppingTicketId] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Schließe Popup beim Klicken außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen]);

  const filteredAndSortedTickets = useMemo(() => {
    // Filtere Tickets basierend auf Suchanfrage
    let filtered = tickets.filter((ticket) => {
      const query = searchQuery.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(query) ||
        ticket.ticket_number.toString().includes(query) ||
        (ticket.description && ticket.description.toLowerCase().includes(query)) ||
        ticket.status.toLowerCase().includes(query) ||
        ticket.priority.toLowerCase().includes(query)
      );
    });

    // Sortiere Tickets
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'ticket_number':
          aValue = a.ticket_number;
          bValue = b.ticket_number;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tickets, searchQuery, sortField, sortDirection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'closed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'closed') => {
    setUpdatingTicketId(ticketId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
      } else {
        if (onTicketUpdate) {
          onTicketUpdate();
        }
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: 'low' | 'medium' | 'high') => {
    setUpdatingTicketId(ticketId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) {
        console.error('Fehler beim Aktualisieren der Priorität:', error);
      } else {
        if (onTicketUpdate) {
          onTicketUpdate();
        }
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Priorität:', err);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const statusOptions = [
    { value: 'open', label: 'Offen' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'closed', label: 'Geschlossen' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Niedrig' },
    { value: 'medium', label: 'Mittel' },
    { value: 'high', label: 'Hoch' },
  ];

  const handleStartTimeTracking = async (ticketId: string) => {
    if (!projectId || runningTimeEntry) {
      return;
    }

    setStartingTicketId(ticketId);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('Benutzer nicht angemeldet');
        setStartingTicketId(null);
        return;
      }

      const { error: insertError } = await supabase.from('time_entries').insert({
        project_id: projectId,
        ticket_id: ticketId,
        user_id: user.id,
        start_time: new Date().toISOString(),
        description: null,
      });

      if (insertError) {
        console.error('Fehler beim Starten des Zeittrackings:', insertError);
        setStartingTicketId(null);
        return;
      }

      // Erfolgreich gestartet - lade Timer sofort neu
      if (onTimeTrackingStart) {
        // Warte kurz, damit die Datenbank aktualisiert ist
        setTimeout(() => {
          onTimeTrackingStart();
        }, 100);
      }
    } catch (err) {
      console.error('Fehler beim Starten des Zeittrackings:', err);
    } finally {
      setStartingTicketId(null);
    }
  };

  const handleStopTimeTracking = async () => {
    if (!runningTimeEntry || !onStopTimeTracking) {
      return;
    }

    setStoppingTicketId(runningTimeEntry.ticket_id || '');

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', runningTimeEntry.id);

      if (error) {
        console.error('Fehler beim Stoppen:', error);
        setStoppingTicketId(null);
        return;
      }

      onStopTimeTracking();
    } catch (err) {
      console.error('Fehler beim Stoppen:', err);
    } finally {
      setStoppingTicketId(null);
    }
  };

  const sortFieldOptions = [
    { value: 'ticket_number', label: 'Ticket-Nummer' },
    { value: 'title', label: 'Titel' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priorität' },
    { value: 'due_date', label: 'Ablaufdatum' },
    { value: 'created_at', label: 'Erstelldatum' },
  ];

  const sortDirectionOptions = [
    { value: 'asc', label: 'Aufsteigend' },
    { value: 'desc', label: 'Absteigend' },
  ];

  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          {projectName
            ? `Keine Tickets für "${projectName}" vorhanden`
            : 'Wählen Sie ein Projekt aus, um Tickets anzuzeigen'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header mit Filter-Button und Ticket-Zähler */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {filteredAndSortedTickets.length} von {tickets.length} Tickets
        </div>
        <div className="relative" ref={popupRef}>
          <Button
            variant="outline"
            onClick={() => setIsPopupOpen(!isPopupOpen)}
            className="text-sm px-3 py-1.5"
          >
            🔍 Filter & Sortierung
          </Button>

          {/* Popup */}
          {isPopupOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-black rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-4 z-50">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Suchen
                  </label>
                  <Input
                    type="text"
                    placeholder="Tickets durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sortieren nach
                  </label>
                  <Select
                    options={sortFieldOptions}
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Richtung
                  </label>
                  <Select
                    options={sortDirectionOptions}
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSortField('ticket_number');
                      setSortDirection('asc');
                    }}
                    className="flex-1 text-sm"
                  >
                    Zurücksetzen
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsPopupOpen(false)}
                    className="flex-1 text-sm"
                  >
                    Schließen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket-Liste */}
      <div className="space-y-3">
        {filteredAndSortedTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-foreground">
                  #{ticket.ticket_number}
                </span>
                <h3 className="font-semibold text-foreground">{ticket.title}</h3>
              </div>
              <div className="flex gap-2">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value as 'open' | 'in_progress' | 'closed')}
                  disabled={updatingTicketId === ticket.id}
                  className={`text-xs px-2 py-1 rounded font-medium border-0 cursor-pointer ${getStatusColor(ticket.status)}`}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(ticket.id, e.target.value as 'low' | 'medium' | 'high')}
                  disabled={updatingTicketId === ticket.id}
                  className={`text-xs px-2 py-1 rounded font-medium border-0 cursor-pointer ${getPriorityColor(ticket.priority)}`}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ticket.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                {ticket.description}
              </p>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                {ticket.due_date && (
                  <span>
                    Fällig: {new Date(ticket.due_date).toLocaleDateString('de-DE')}
                  </span>
                )}
                <span>
                  Erstellt: {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              {projectId && (
                <>
                  {runningTimeEntry && runningTimeEntry.ticket_id === ticket.id && runningTimeEntry.project_id === projectId ? (
                    <Button
                      variant="outline"
                      onClick={handleStopTimeTracking}
                      disabled={stoppingTicketId === ticket.id}
                      className="text-xs px-3 py-1 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {stoppingTicketId === ticket.id ? 'Beendet...' : 'Beenden'}
                    </Button>
                  ) : !runningTimeEntry && (
                    <Button
                      variant="outline"
                      onClick={() => handleStartTimeTracking(ticket.id)}
                      disabled={startingTicketId === ticket.id}
                      className="text-xs px-3 py-1 opacity-70 hover:opacity-100"
                    >
                      {startingTicketId === ticket.id ? 'Startet...' : '⏱️ Starten'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedTickets.length === 0 && searchQuery && (
        <div className="p-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Keine Tickets gefunden, die "{searchQuery}" entsprechen
          </p>
        </div>
      )}
    </div>
  );
};

