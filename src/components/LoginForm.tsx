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

  const handleSlackLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'slack_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // Redirect happens automatically
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-black text-zinc-500">Oder weiter mit</span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full h-12 text-base flex items-center justify-center gap-2"
        onClick={handleSlackLogin}
        disabled={loading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.522-2.521V2.522A2.527 2.527 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.521A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.522-2.522v-2.52h2.522zM15.166 17.688a2.527 2.527 0 0 1-2.522-2.521 2.527 2.527 0 0 1 2.522-2.522h6.312A2.527 2.527 0 0 1 24 15.167a2.528 2.528 0 0 1-2.522 2.52h-6.312z"/>
        </svg>
        Mit Slack anmelden
      </Button>
    </div>
  );
};
