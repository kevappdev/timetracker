import { RegisterForm } from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-black rounded-2xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Konto erstellen
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Erstellen Sie ein neues Konto, um zu beginnen
            </p>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Bereits ein Konto?{' '}
              <a
                href="/login"
                className="text-foreground hover:underline font-medium"
              >
                Anmelden
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

