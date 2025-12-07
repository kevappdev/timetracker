'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { createClient } from '@/lib/supabase';
import type { Project } from '@/types';
import type { Ticket } from '@/types';

interface StartTimeTrackingProps {
  projects: Project[];
  tickets: Ticket[];
  onStart: () => void;
}

export const StartTimeTracking: React.FC<StartTimeTrackingProps> = ({
  projects,
  tickets,
  onStart,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Filtere Tickets basierend auf ausgewähltem Projekt
  const filteredTickets = selectedProjectId
    ? tickets.filter((t) => t.project_id === selectedProjectId)
    : [];

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const ticketOptions = [
    { value: '', label: 'Kein Ticket' },
    ...filteredTickets.map((ticket) => ({
      value: ticket.id,
      label: `#${ticket.ticket_number} - ${ticket.title}`,
    })),
  ];

  const handleStart = async () => {
    if (!selectedProjectId) {
      setError('Bitte wählen Sie ein Projekt aus.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Sie sind nicht angemeldet.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('time_entries').insert({
        project_id: selectedProjectId,
        ticket_id: selectedTicketId || null,
        user_id: user.id,
        start_time: new Date().toISOString(),
        description: description.trim() || null,
      });

      if (insertError) {
        setError('Fehler beim Starten des Zeittrackings. Bitte versuchen Sie es erneut.');
        setLoading(false);
        return;
      }

      // Erfolgreich gestartet
      setIsPopupOpen(false);
      setSelectedProjectId('');
      setSelectedTicketId('');
      setDescription('');
      onStart();
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
      setLoading(false);
    }
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={popupRef}>
      <Button
        variant="outline"
        onClick={() => setIsPopupOpen(!isPopupOpen)}
        className="text-sm"
      >
        ⏱️ Zeittracking starten
      </Button>

      {isPopupOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-black rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-4 z-50">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Zeittracking starten</h3>

            {error && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-sm">
                {error}
              </div>
            )}

            <Select
              label="Projekt *"
              options={projectOptions}
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedTicketId(''); // Reset Ticket-Auswahl bei Projektwechsel
              }}
              required
              disabled={loading}
            />

            <Select
              label="Ticket (optional)"
              options={ticketOptions}
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              disabled={loading || !selectedProjectId}
            />

            <Input
              type="text"
              label="Beschreibung (optional)"
              placeholder="Was arbeiten Sie an?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPopupOpen(false)}
                className="flex-1 text-sm"
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleStart}
                className="flex-1 text-sm"
                disabled={loading || !selectedProjectId}
              >
                {loading ? 'Startet...' : 'Starten'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

