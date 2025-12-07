'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Tickets', icon: '🎫' },
    { href: '/time-tracking', label: 'Zeiterfassung', icon: '⏱️' },
    { href: '/account', label: 'Account', icon: '👤' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-black
          border-r border-zinc-200 dark:border-zinc-800
          z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Time Tracker</h2>
              <button
                onClick={onClose}
                className="text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            {user && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.user_metadata?.name || user.email}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors
                        ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-foreground font-medium'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground'
                        }
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push('/login');
                router.refresh();
              }}
              className="w-full"
            >
              Abmelden
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

