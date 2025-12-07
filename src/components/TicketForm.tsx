'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Alert } from './ui/Alert';
import { createClient } from '@/lib/supabase';
import type { TicketFormData } from '@/types';
import type { Project } from '@/types';

interface TicketFormProps {
  userId: string;
  projects: Project[];
}

export const TicketForm: React.FC<TicketFormProps> = ({ userId, projects }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    project_id: projects.length > 0 ? projects[0].id : '',
    status: 'open',
    priority: 'medium',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validierung
      if (!formData.title.trim()) {
        setError('Bitte geben Sie einen Titel für das Ticket ein.');
        setLoading(false);
        return;
      }

      if (!formData.project_id) {
        setError('Bitte wählen Sie ein Projekt aus.');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Ticket in Supabase speichern
      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          project_id: formData.project_id,
          created_by: userId,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
        })
        .select()
        .single();

      if (insertError) {
        let errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
        
        if (insertError.message.includes('foreign key') || insertError.message.includes('project')) {
          errorMessage = 'Das ausgewählte Projekt existiert nicht oder Sie haben keine Berechtigung.';
        } else {
          errorMessage = insertError.message;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        // Nach 1.5 Sekunden zum Dashboard weiterleiten
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  if (projects.length === 0) {
    return (
      <div className="w-full">
        <Alert variant="info">
          Sie müssen zuerst ein Projekt erstellen, bevor Sie Tickets anlegen können.
        </Alert>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/projects/new')}
            className="w-full"
          >
            Neues Projekt erstellen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          Ticket erfolgreich erstellt! Sie werden zum Dashboard weitergeleitet...
        </Alert>
      )}

      <div className="space-y-4">
        <Select
          label="Projekt *"
          options={projectOptions}
          value={formData.project_id}
          onChange={(e) => handleChange('project_id', e.target.value)}
          required
          disabled={loading || success}
        />

        <Input
          type="text"
          label="Titel *"
          placeholder="z.B. Bug in der Login-Funktion"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          disabled={loading || success}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as TicketFormData['status'])}
            disabled={loading || success}
          />

          <Select
            label="Priorität"
            options={priorityOptions}
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value as TicketFormData['priority'])}
            disabled={loading || success}
          />
        </div>

        <Input
          type="date"
          label="Ablaufdatum"
          value={formData.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          disabled={loading || success}
        />

        <Textarea
          label="Beschreibung"
          placeholder="Beschreiben Sie das Ticket..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={loading || success}
          rows={4}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          className="flex-1 h-12"
          disabled={loading || success}
        >
          {loading ? 'Wird erstellt...' : success ? 'Erfolgreich erstellt!' : 'Ticket erstellen'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="h-12"
          disabled={loading || success}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
};

