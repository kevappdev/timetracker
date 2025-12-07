'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { createClient } from '@/lib/supabase';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Anmeldung bei Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Fehlerbehandlung für verschiedene Supabase-Fehler
        let errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
        
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Ungültige E-Mail-Adresse oder Passwort.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
        } else {
          errorMessage = signInError.message;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Erfolgreiche Anmeldung - zur Dashboard-Seite weiterleiten
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          type="email"
          label="E-Mail-Adresse"
          placeholder="ihre.email@beispiel.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Passwort"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-sm text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
          >
            {showPassword ? 'Verbergen' : 'Anzeigen'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2 w-4 h-4 rounded border-black/[.08] dark:border-white/[.145] text-foreground focus:ring-2 focus:ring-foreground"
          />
          <span className="text-zinc-600 dark:text-zinc-400">Angemeldet bleiben</span>
        </label>
        <a
          href="#"
          className="text-foreground hover:underline font-medium"
        >
          Passwort vergessen?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full h-12 text-base"
        disabled={loading}
      >
        {loading ? 'Wird angemeldet...' : 'Anmelden'}
      </Button>
    </form>
  );
};

