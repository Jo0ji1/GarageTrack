import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type CloudUser,
  type SyncReport,
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  syncAll,
} from '../services/cloudSync';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import type { MaintenanceRecord, Vehicle } from '../domain/models';

type Status = 'idle' | 'loading' | 'syncing' | 'error';

interface CloudContextValue {
  configured: boolean;
  user: CloudUser | null;
  status: Status;
  lastSync: SyncReport | null;
  lastError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sync: (vehicles: Vehicle[], records: MaintenanceRecord[]) => Promise<SyncReport>;
  refreshUser: () => Promise<void>;
}

const CloudContext = createContext<CloudContextValue | null>(null);

export function CloudProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [lastSync, setLastSync] = useState<SyncReport | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setStatus('loading');
    try {
      const u = await getCurrentUser();
      setUser(u);
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'falha de rede');
    } finally {
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          displayName:
            (session.user.user_metadata?.full_name as string | undefined) ??
            (session.user.user_metadata?.name as string | undefined) ??
            null,
        });
      } else {
        setUser(null);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    setLastError(null);
    try {
      await signInWithEmail(email, password);
      await refreshUser();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'falha no login');
      throw err;
    } finally {
      setStatus('idle');
    }
  }, [refreshUser]);

  const handleSignUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setStatus('loading');
    setLastError(null);
    try {
      await signUpWithEmail(email, password, displayName);
      await refreshUser();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'falha no cadastro');
      throw err;
    } finally {
      setStatus('idle');
    }
  }, [refreshUser]);

  const handleSignOut = useCallback(async () => {
    setStatus('loading');
    try {
      await signOut();
      setUser(null);
    } finally {
      setStatus('idle');
    }
  }, []);

  const handleSync = useCallback(async (vehicles: Vehicle[], records: MaintenanceRecord[]) => {
    if (!user) {
      throw new Error('Faça login para sincronizar');
    }
    setStatus('syncing');
    setLastError(null);
    try {
      const report = await syncAll(vehicles, records);
      setLastSync(report);
      return report;
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'falha ao sincronizar');
      setStatus('error');
      throw err;
    } finally {
      setStatus((s) => (s === 'error' ? 'error' : 'idle'));
    }
  }, [user]);

  const value = useMemo<CloudContextValue>(() => ({
    configured: isSupabaseConfigured,
    user,
    status,
    lastSync,
    lastError,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    sync: handleSync,
    refreshUser,
  }), [user, status, lastSync, lastError, handleSignIn, handleSignUp, handleSignOut, handleSync, refreshUser]);

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error('useCloud precisa estar dentro de <CloudProvider>');
  return ctx;
}
