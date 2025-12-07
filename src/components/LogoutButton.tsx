'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { createClient } from '@/lib/supabase';

export const LogoutButton: React.FC = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="w-full sm:w-auto"
    >
      Abmelden
    </Button>
  );
};

