'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { createClient } from '@/lib/supabase';
import type { RunningTimeEntry } from '@/types';

interface RunningTimerProps {
  timeEntry: RunningTimeEntry;
  onStop: () => void;
}

export const RunningTimer: React.FC<RunningTimerProps> = ({ timeEntry, onStop }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = new Date(timeEntry.start_time).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // in Sekunden
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeEntry.start_time]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', timeEntry.id);

      if (error) {
        console.error('Fehler beim Stoppen:', error);
        return;
      }

      onStop();
    } catch (err) {
      console.error('Fehler beim Stoppen:', err);
    }
  };

  return (
    <div className="bg-foreground text-background rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
        </div>
        <div className="text-sm opacity-90">
          {timeEntry.project_name}
          {timeEntry.ticket_number && (
            <>
              {' - #'}
              {timeEntry.ticket_number}
              {timeEntry.ticket_title && ` ${timeEntry.ticket_title}`}
            </>
          )}
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={handleStop}
        className="bg-background text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        Stoppen
      </Button>
    </div>
  );
};

