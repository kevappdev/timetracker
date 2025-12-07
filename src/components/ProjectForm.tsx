'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Alert } from './ui/Alert';
import { createClient } from '@/lib/supabase';
import type { ProjectFormData } from '@/types';

interface ProjectFormProps {
  userId: string;
  userName?: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ userId, userName }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    hourly_rate: '',
    description: '',
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
      if (!formData.name.trim()) {
        setError('Bitte geben Sie einen Projektnamen ein.');
        setLoading(false);
        return;
      }

      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        setError('Bitte geben Sie einen gültigen Stundenlohn ein (größer als 0).');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Projekt in Supabase speichern
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: formData.name.trim(),
          created_by: userId,
          hourly_rate: hourlyRate,
          description: formData.description.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        let errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
        
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          errorMessage = 'Ein Projekt mit diesem Namen existiert bereits.';
        } else {
          errorMessage = insertError.message;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        // Nach 1.5 Sekunden zur Projekte-Übersicht weiterleiten
        setTimeout(() => {
          router.push('/projects');
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          Projekt erfolgreich erstellt! Sie werden zur Übersicht weitergeleitet...
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          type="text"
          label="Projektname *"
          placeholder="z.B. Website Redesign"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={loading || success}
        />

        <Input
          type="number"
          label="Stundenlohn (€) *"
          placeholder="50.00"
          step="0.01"
          min="0"
          value={formData.hourly_rate}
          onChange={(e) => handleChange('hourly_rate', e.target.value)}
          required
          disabled={loading || success}
        />

        <Textarea
          label="Beschreibung"
          placeholder="Beschreiben Sie das Projekt..."
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
          {loading ? 'Wird erstellt...' : success ? 'Erfolgreich erstellt!' : 'Projekt erstellen'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/projects')}
          className="h-12"
          disabled={loading || success}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
};

