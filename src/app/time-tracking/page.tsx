'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { TimeTrackingChart } from '@/components/TimeTracking/TimeTrackingChart';
import { TimeEntriesList } from '@/components/TimeTracking/TimeEntriesList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase';
import type { TimeEntry } from '@/types';
import type { Project } from '@/types';
import type { Ticket } from '@/types';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

export default function TimeTrackingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

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

      // Lade Projekte
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', currentUser.id);

      if (projectsData) {
        setProjects(projectsData);
      }

      // Lade Tickets für alle Projekte
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .in('project_id', projectsData?.map((p) => p.id) || []);

      if (ticketsData) {
        setTickets(ticketsData);
      }

      // Berechne Startdatum basierend auf Zeitraum
      let startDate: Date | null = null;
      const now = new Date();

      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all':
          startDate = null;
          break;
      }

      // Lade Zeiterfassungen
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', currentUser.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false });

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      const { data: entriesData } = await query;

      if (entriesData) {
        setTimeEntries(entriesData);
      }

      setLoading(false);
    };

    loadData();
  }, [router, timeRange]);

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
      showTimeTrackingButton={true}
    >
      {/* Zeitraum-Auswahl */}
      <div className="mb-6 bg-white dark:bg-black rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {(['day', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'outline'}
              onClick={() => setTimeRange(range)}
              className="text-sm"
            >
              {range === 'day'
                ? 'Heute'
                : range === 'week'
                ? 'Diese Woche'
                : range === 'month'
                ? 'Dieser Monat'
                : range === 'year'
                ? 'Dieses Jahr'
                : 'Gesamt'}
            </Button>
          ))}
        </div>
      </div>

      {/* Diagramm */}
      <div className="bg-white dark:bg-black rounded-xl p-6 mb-6">
        <TimeTrackingChart
          timeEntries={timeEntries}
          projects={projects}
          timeRange={timeRange}
        />
      </div>

      {/* Verlauf */}
      <div className="bg-white dark:bg-black rounded-xl p-6">
        <TimeEntriesList
          timeEntries={timeEntries}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          tickets={tickets.map((t) => ({
            id: t.id,
            ticket_number: t.ticket_number,
            title: t.title,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}

