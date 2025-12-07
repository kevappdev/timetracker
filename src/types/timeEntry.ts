/**
 * Zeiterfassungs-Typen
 */

export interface TimeEntry {
  id: string;
  project_id: string;
  ticket_id: string | null;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TimeEntryInsert {
  project_id: string;
  ticket_id?: string | null;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  description?: string | null;
}

export interface RunningTimeEntry {
  id: string;
  project_id: string;
  ticket_id: string | null;
  start_time: string;
  project_name?: string;
  ticket_number?: number;
  ticket_title?: string;
}

