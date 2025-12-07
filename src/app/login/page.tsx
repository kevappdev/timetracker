'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { Alert } from '@/components/ui/Alert';

function LoginMessages() {
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
      // Nach 5 Sekunden ausblenden
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
    if (searchParams.get('error') === 'auth_failed') {
      setShowErrorMessage(true);
      const timer = setTimeout(() => setShowErrorMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!showSuccessMessage && !showErrorMessage) {
    return null;
  }

  return (
    <>
      {showSuccessMessage && (
        <div className="mb-6">
          <Alert variant="success">
            Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.
          </Alert>
        </div>
      )}

      {showErrorMessage && (
        <div className="mb-6">
          <Alert variant="error">
            Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.
          </Alert>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-black rounded-2xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Willkommen zurück
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Melden Sie sich an, um fortzufahren
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginMessages />
          </Suspense>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Noch kein Konto?{' '}
              <a
                href="/register"
                className="text-foreground hover:underline font-medium"
              >
                Registrieren
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

