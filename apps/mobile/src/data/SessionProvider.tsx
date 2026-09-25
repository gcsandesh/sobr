import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { nameFromEmail } from '../lib/account';

type SessionContextValue = {
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** The name the user chose, or null if they never set one. */
  displayName: string | null;
  /** What to call the user: their chosen name, else one derived from the email. */
  greetingName: string | null;
  initializing: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const email = session?.user.email ?? null;
    const raw = session?.user.user_metadata?.display_name;
    const displayName = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    return {
      session,
      userId: session?.user.id ?? null,
      email,
      displayName,
      greetingName: displayName ?? nameFromEmail(email),
      initializing,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, initializing]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
