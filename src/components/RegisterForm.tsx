'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { createClient } from '@/lib/supabase';

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validierung
      if (!passwordsMatch) {
        setError('Passwörter stimmen nicht überein');
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Passwort muss mindestens 8 Zeichen lang sein');
        setLoading(false);
        return;
      }

      if (!acceptTerms) {
        setError('Bitte akzeptieren Sie die Allgemeinen Geschäftsbedingungen');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Registrierung bei Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Fehlerbehandlung für verschiedene Supabase-Fehler
        let errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
        
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'Diese E-Mail-Adresse ist bereits registriert.';
        } else if (signUpError.message.includes('invalid email')) {
          errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        } else if (signUpError.message.includes('Password')) {
          errorMessage = 'Das Passwort erfüllt nicht die Anforderungen.';
        } else {
          errorMessage = signUpError.message;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Nach 2 Sekunden zur Login-Seite weiterleiten
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          Registrierung erfolgreich! Sie werden zur Anmeldeseite weitergeleitet...
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          type="text"
          label="Name"
          placeholder="Max Mustermann"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
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
            error={password.length > 0 && password.length < 8 ? 'Passwort muss mindestens 8 Zeichen lang sein' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-sm text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
          >
            {showPassword ? 'Verbergen' : 'Anzeigen'}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Passwort bestätigen"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwörter stimmen nicht überein' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-sm text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? 'Verbergen' : 'Anzeigen'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 mr-3 w-4 h-4 rounded border-black/[.08] dark:border-white/[.145] text-foreground focus:ring-2 focus:ring-foreground"
            required
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Ich akzeptiere die{' '}
            <a href="#" className="text-foreground hover:underline font-medium">
              Allgemeinen Geschäftsbedingungen
            </a>{' '}
            und die{' '}
            <a href="#" className="text-foreground hover:underline font-medium">
              Datenschutzerklärung
            </a>
          </span>
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full h-12 text-base"
        disabled={!acceptTerms || !passwordsMatch || password.length < 8 || loading || success}
      >
        {loading ? 'Wird registriert...' : success ? 'Erfolgreich registriert!' : 'Registrieren'}
      </Button>
    </form>
  );
};

