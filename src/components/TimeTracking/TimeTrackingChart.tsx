'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeEntry } from '@/types';
import type { Project } from '@/types';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

interface TimeTrackingChartProps {
  timeEntries: TimeEntry[];
  projects: Project[];
  timeRange: TimeRange;
}

interface ChartDataPoint {
  name: string;
  Stunden?: number;
  [key: string]: string | number | undefined;
}

export const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({
  timeEntries,
  projects,
  timeRange,
}) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = new Map<string, Map<string, number>>();
    const allProjects = Array.from(new Set(projects.map((p) => p.name)));

    // Erstelle alle Zeiträume basierend auf timeRange
    let periods: Array<{ key: string; date: Date }> = [];

    switch (timeRange) {
      case 'day':
        // Alle 24 Stunden des Tages
        for (let hour = 0; hour < 24; hour++) {
          const date = new Date(now);
          date.setHours(hour, 0, 0, 0);
          periods.push({
            key: date.toLocaleTimeString('de-DE', { hour: '2-digit' }),
            date,
          });
        }
        break;
      case 'week':
        // Alle 7 Tage der Woche
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
          periods.push({
            key: `${dayName} ${date.getDate()}.${date.getMonth() + 1}`,
            date,
          });
        }
        break;
      case 'month':
        // Alle Tage des aktuellen Monats
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(monthStart);
          date.setDate(day);
          periods.push({
            key: `Tag ${day}`,
            date,
          });
        }
        break;
      case 'year':
        // Alle 12 Monate des Jahres
        for (let month = 0; month < 12; month++) {
          const date = new Date(now.getFullYear(), month, 1);
          periods.push({
            key: date.toLocaleDateString('de-DE', { month: 'short' }),
            date,
          });
        }
        break;
      case 'all':
        // Alle Jahre von der ersten Zeiterfassung bis heute
        if (timeEntries.length > 0) {
          const firstEntry = timeEntries[timeEntries.length - 1];
          const firstYear = new Date(firstEntry.start_time).getFullYear();
          const currentYear = now.getFullYear();
          for (let year = firstYear; year <= currentYear; year++) {
            periods.push({
              key: year.toString(),
              date: new Date(year, 0, 1),
            });
          }
        }
        break;
    }

    // Initialisiere alle Perioden mit 0
    periods.forEach((period) => {
      dataMap.set(period.key, new Map());
      allProjects.forEach((projectName) => {
        dataMap.get(period.key)!.set(projectName, 0);
      });
    });

    // Fülle mit tatsächlichen Daten
    timeEntries.forEach((entry) => {
      const projectName =
        projects.find((p) => p.id === entry.project_id)?.name || 'Unbekannt';
      
      if (timeRange === 'day' && entry.start_time && entry.end_time) {
        // Spezielle Behandlung für Tagesansicht: Teile Einträge stundenweise auf
        const startTime = new Date(entry.start_time);
        const endTime = new Date(entry.end_time);
        
        let currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
          const currentHour = currentTime.getHours();
          const hourKey = currentTime.toLocaleTimeString('de-DE', { hour: '2-digit' });
          
          // Berechne das Ende der aktuellen Stunde
          const hourEnd = new Date(currentTime);
          hourEnd.setHours(currentHour + 1, 0, 0, 0);
          
          // Berechne die Dauer für diese Stunde
          const segmentEnd = endTime < hourEnd ? endTime : hourEnd;
          const segmentMinutes = (segmentEnd.getTime() - currentTime.getTime()) / (1000 * 60);
          const segmentHours = segmentMinutes / 60;
          
          if (dataMap.has(hourKey)) {
            const projectMap = dataMap.get(hourKey)!;
            const currentHours = projectMap.get(projectName) || 0;
            projectMap.set(projectName, currentHours + segmentHours);
          }
          
          // Gehe zur nächsten Stunde
          currentTime = new Date(hourEnd);
        }
      } else {
        // Normale Behandlung für andere Zeiträume
        let key: string;
        const entryDate = new Date(entry.start_time);

        switch (timeRange) {
          case 'week':
            const dayName = entryDate.toLocaleDateString('de-DE', { weekday: 'short' });
            key = `${dayName} ${entryDate.getDate()}.${entryDate.getMonth() + 1}`;
            break;
          case 'month':
            key = `Tag ${entryDate.getDate()}`;
            break;
          case 'year':
            key = entryDate.toLocaleDateString('de-DE', { month: 'short' });
            break;
          case 'all':
            key = entryDate.getFullYear().toString();
            break;
          default:
            key = entryDate.toLocaleDateString('de-DE');
        }

        if (dataMap.has(key)) {
          const projectMap = dataMap.get(key)!;
          const currentHours = projectMap.get(projectName) || 0;
          const entryHours = (entry.duration_minutes || 0) / 60;
          projectMap.set(projectName, currentHours + entryHours);
        }
      }
    });

    // Konvertiere zu Array-Format für Recharts
    const result: ChartDataPoint[] = Array.from(dataMap.entries())
      .map(([name, projectMap]) => {
        const dataPoint: ChartDataPoint = { name, Stunden: 0 };
        let total = 0;

        allProjects.forEach((projectName) => {
          const hours = projectMap.get(projectName) || 0;
          dataPoint[projectName] = Math.round(hours * 100) / 100;
          total += hours;
        });

        dataPoint.Stunden = Math.round(total * 100) / 100;
        return dataPoint;
      })
      .sort((a, b) => {
        // Sortiere chronologisch basierend auf Zeitraum
        if (timeRange === 'day') {
          // Sortiere nach Stunde (z.B. "08", "09", "10")
          return parseInt(a.name.split(':')[0] || '0') - parseInt(b.name.split(':')[0] || '0');
        } else if (timeRange === 'week' || timeRange === 'month') {
          // Sortiere nach Datum (extrahiere Tag-Nummer)
          const aDay = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const bDay = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return aDay - bDay;
        } else if (timeRange === 'year') {
          // Sortiere nach Monat
          const monthOrder: Record<string, number> = {
            Jan: 1, Feb: 2, Mär: 3, Apr: 4, Mai: 5, Jun: 6,
            Jul: 7, Aug: 8, Sep: 9, Okt: 10, Nov: 11, Dez: 12,
          };
          return (monthOrder[a.name] || 0) - (monthOrder[b.name] || 0);
        } else {
          // Sortiere nach Jahr
          return parseInt(a.name) - parseInt(b.name);
        }
      });

    return result;
  }, [timeEntries, projects, timeRange]);

  const projectColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  if (chartData.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Keine Daten für den ausgewählten Zeitraum vorhanden
        </p>
      </div>
    );
  }

  const allProjects = Array.from(new Set(projects.map((p) => p.name)));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        Arbeitszeit nach {timeRange === 'day' ? 'Stunden' : timeRange === 'week' ? 'Tagen' : timeRange === 'month' ? 'Tagen' : timeRange === 'year' ? 'Monaten' : 'Jahren'}
      </h2>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
          <XAxis
            dataKey="name"
            stroke="currentColor"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            stroke="currentColor"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Stunden',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'currentColor' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--foreground)',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toFixed(2)}h`, '']}
          />
          <Legend />
          {allProjects.map((projectName, index) => (
            <Bar
              key={projectName}
              dataKey={projectName}
              stackId="a"
              fill={projectColors[index % projectColors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Zusammenfassung */}
      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Gesamtstunden</div>
            <div className="text-2xl font-bold text-foreground">
              {chartData
                .reduce((sum, d) => sum + (d.Stunden || 0), 0)
                .toFixed(2)}
              h
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Gesamtgehalt</div>
            <div className="text-2xl font-bold text-foreground text-green-600 dark:text-green-400">
              {(() => {
                const totalEarnings = timeEntries.reduce((sum, entry) => {
                  const project = projects.find((p) => p.id === entry.project_id);
                  const hourlyRate = project?.hourly_rate || 0;
                  const hours = (entry.duration_minutes || 0) / 60;
                  return sum + hours * hourlyRate;
                }, 0);
                return totalEarnings.toFixed(2);
              })()} €
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Einträge</div>
            <div className="text-2xl font-bold text-foreground">{timeEntries.length}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Projekte</div>
            <div className="text-2xl font-bold text-foreground">{allProjects.length}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Ø pro Eintrag</div>
            <div className="text-2xl font-bold text-foreground">
              {timeEntries.length > 0
                ? (
                    timeEntries.reduce(
                      (sum, e) => sum + (e.duration_minutes || 0),
                      0
                    ) /
                    60 /
                    timeEntries.length
                  ).toFixed(2)
                : '0.00'}
              h
            </div>
          </div>
        </div>
        
        {/* Gehalt pro Projekt */}
        {projects.length > 0 && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Gehalt nach Projekt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const projectEntries = timeEntries.filter((e) => e.project_id === project.id);
                const projectHours = projectEntries.reduce(
                  (sum, e) => sum + (e.duration_minutes || 0) / 60,
                  0
                );
                const projectEarnings = projectHours * (project.hourly_rate || 0);
                
                if (projectHours === 0) return null;
                
                return (
                  <div
                    key={project.id}
                    className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4"
                  >
                    <div className="font-medium text-foreground mb-2">{project.name}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                      {projectHours.toFixed(2)}h × {project.hourly_rate?.toFixed(2) || '0.00'} €/h
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {projectEarnings.toFixed(2)} €
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

