import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  type CloudUser,
  ENABLE_AUTO_SYNC,
  type SyncReport,
  getCurrentUser,
  signInWithEmail,
  signInWithGoogle,
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
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sync: (vehicles: Vehicle[], records: MaintenanceRecord[]) => Promise<SyncReport>;
  refreshUser: () => Promise<void>;
  /** Callback para disparar sync automático após mutações locais (se ENABLE_AUTO_SYNC=true) */
  triggerAutoSync: (vehicles: Vehicle[], records: MaintenanceRecord[]) => void;
}

const CloudContext = createContext<CloudContextValue | null>(null);

export function CloudProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [lastSync, setLastSync] = useState<SyncReport | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<{ vehicles: Vehicle[]; records: MaintenanceRecord[] } | null>(null);
  const isSyncingRef = useRef(false);

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

  const handleSignInWithGoogle = useCallback(async () => {
    setStatus('loading');
    setLastError(null);
    try {
      await signInWithGoogle();
      // onAuthStateChange do Supabase atualiza o user automaticamente;
      // chamamos refreshUser como fallback de segurança.
      await refreshUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'falha no login Google';
      // "Login cancelado" não é um erro que deve aparecer como lastError.
      if (msg !== 'Login cancelado.') setLastError(msg);
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
    if (isSyncingRef.current) {
      if (__DEV__) console.log('[CloudContext] Sync já em andamento, ignorando.');
      return lastSync ?? ({} as SyncReport);
    }
    setStatus('syncing');
    setLastError(null);
    isSyncingRef.current = true;
    try {
      const report = await syncAll(vehicles, records);
      setLastSync(report);
      return report;
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'falha ao sincronizar');
      setStatus('error');
      throw err;
    } finally {
      isSyncingRef.current = false;
      setStatus((s) => (s === 'error' ? 'error' : 'idle'));
    }
  }, [user, lastSync]);

  const triggerAutoSync = useCallback((vehicles: Vehicle[], records: MaintenanceRecord[]) => {
    if (!ENABLE_AUTO_SYNC || !user) return;
    // Debounce: acumula a última versão dos dados e faz sync após 3s de inatividade
    pendingSyncRef.current = { vehicles, records };
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      const pending = pendingSyncRef.current;
      if (pending && !isSyncingRef.current) {
        if (__DEV__) console.log('[CloudContext] Auto-sync disparado.');
        handleSync(pending.vehicles, pending.records).catch((err) => {
          if (__DEV__) console.error('[CloudContext] Auto-sync falhou:', err);
        });
      }
      pendingSyncRef.current = null;
    }, 3000);
  }, [user, handleSync]);

  // Sync periódico (a cada 5 min) se ENABLE_AUTO_SYNC=true e logado
  useEffect(() => {
    if (!ENABLE_AUTO_SYNC || !user) return;
    const interval = setInterval(() => {
      const pending = pendingSyncRef.current;
      if (pending && !isSyncingRef.current) {
        if (__DEV__) console.log('[CloudContext] Sync periódico disparado.');
        handleSync(pending.vehicles, pending.records).catch((err) => {
          if (__DEV__) console.error('[CloudContext] Sync periódico falhou:', err);
        });
      }
    }, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, [user, handleSync]);

  const value = useMemo<CloudContextValue>(() => ({
    configured: isSupabaseConfigured,
    user,
    status,
    lastSync,
    lastError,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signUp: handleSignUp,
    signOut: handleSignOut,
    sync: handleSync,
    refreshUser,
    triggerAutoSync,
  }), [user, status, lastSync, lastError, handleSignIn, handleSignInWithGoogle, handleSignUp, handleSignOut, handleSync, refreshUser, triggerAutoSync]);

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error('useCloud precisa estar dentro de <CloudProvider>');
  return ctx;
}
