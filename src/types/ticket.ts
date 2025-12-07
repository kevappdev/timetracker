/**
 * Ticket-Typen
 */

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  description: string | null;
  project_id: string;
  created_at: string;
  created_by: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  updated_at?: string;
}

export interface TicketInsert {
  title: string;
  description?: string | null;
  project_id: string;
  created_by: string;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

export interface TicketFormData {
  title: string;
  description: string;
  project_id: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
}

