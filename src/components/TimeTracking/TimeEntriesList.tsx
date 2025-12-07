'use client';

import React, { useState } from 'react';
import type { TimeEntry } from '@/types';

interface TimeEntriesListProps {
  timeEntries: TimeEntry[];
  projects: Array<{ id: string; name: string }>;
  tickets: Array<{ id: string; ticket_number: number; title: string }>;
}

export const TimeEntriesList: React.FC<TimeEntriesListProps> = ({
  timeEntries,
  projects,
  tickets,
}) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'Unbekannt';
  };

  const getTicketInfo = (ticketId: string | null) => {
    if (!ticketId) return null;
    const ticket = tickets.find((t) => t.id === ticketId);
    return ticket ? `#${ticket.ticket_number} - ${ticket.title}` : null;
  };

  if (timeEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Noch keine Zeiterfassungen vorhanden
        </p>
      </div>
    );
  }

  // Gruppiere nach Datum
  const groupedEntries = timeEntries.reduce((acc, entry) => {
    const date = new Date(entry.start_time).toLocaleDateString('de-DE');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const totalMinutes = timeEntries.reduce(
    (sum, entry) => sum + (entry.duration_minutes || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-foreground">Zeiterfassungen</h3>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Gesamt: <span className="font-semibold text-foreground">{formatDuration(totalMinutes)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedEntries).map(([date, entries]) => {
          const dayTotal = entries.reduce(
            (sum, e) => sum + (e.duration_minutes || 0),
            0
          );
          const isExpanded = expandedDates.has(date);

          return (
            <div key={date} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDate(date)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <h4 className="text-sm font-medium text-foreground">
                    {date}
                  </h4>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    ({entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'})
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatDuration(dayTotal)}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
                  {entries.map((entry) => {
                    const ticketInfo = getTicketInfo(entry.ticket_id);

                    return (
                      <div
                        key={entry.id}
                        className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {getProjectName(entry.project_id)}
                          </div>
                          {ticketInfo && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              {ticketInfo}
                            </div>
                          )}
                          {entry.description && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                              {entry.description}
                            </div>
                          )}
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {new Date(entry.start_time).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {entry.end_time &&
                              ` - ${new Date(entry.end_time).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`}
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-foreground">
                          {formatDuration(entry.duration_minutes)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

