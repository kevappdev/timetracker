'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setName(currentUser.user_metadata?.name || '');
      setEmail(currentUser.email || '');

      // Lade Projekte und Tickets für das Layout
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', currentUser.id);

      if (projectsData) {
        setProjects(projectsData);
      }

      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .in('project_id', projectsData?.map((p) => p.id) || []);

      if (ticketsData) {
        setTickets(ticketsData);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: { name },
    });

    if (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Speichern der Änderungen');
    } else {
      alert('Änderungen gespeichert');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Lädt...</p>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} projects={projects} tickets={tickets}>
      <div className="bg-white dark:bg-black rounded-xl p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Account-Einstellungen</h2>

        <div className="space-y-4 max-w-md">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ihr Name"
          />

          <Input
            label="E-Mail"
            value={email}
            disabled
            placeholder="Ihre E-Mail-Adresse"
          />

          <div className="pt-4">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Speichere...' : 'Änderungen speichern'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

