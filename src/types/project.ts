/**
 * Projekt-Typen
 */

export interface Project {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  hourly_rate: number;
  description: string | null;
  updated_at?: string;
}

export interface ProjectInsert {
  name: string;
  created_by: string;
  hourly_rate: number;
  description?: string | null;
}

export interface ProjectFormData {
  name: string;
  hourly_rate: string;
  description: string;
}

