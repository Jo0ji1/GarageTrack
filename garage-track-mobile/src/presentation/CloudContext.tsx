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
type SyncPriority = 'normal' | 'high';

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
  sync: (
    vehicles: Vehicle[],
    records: MaintenanceRecord[],
    options?: { allowRemoteDelete?: boolean },
  ) => Promise<SyncReport>;
  refreshUser: () => Promise<void>;
  /** Enfileira sync automático com debounce e suporte a prioridade. */
  triggerAutoSync: (
    vehicles: Vehicle[],
    records: MaintenanceRecord[],
    options?: { priority?: SyncPriority; reason?: string },
  ) => void;
}

const CloudContext = createContext<CloudContextValue | null>(null);

export function CloudProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [lastSync, setLastSync] = useState<SyncReport | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queuedPayloadRef = useRef<{ vehicles: Vehicle[]; records: MaintenanceRecord[] } | null>(null);
  const hasQueuedSyncRef = useRef(false);
  const rerunAfterCurrentSyncRef = useRef(false);
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

  const handleSync = useCallback(async (
    vehicles: Vehicle[],
    records: MaintenanceRecord[],
    options?: { allowRemoteDelete?: boolean },
  ) => {
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
      const report = await syncAll(vehicles, records, {
        allowRemoteDelete: options?.allowRemoteDelete === true,
      });
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

  const clearAutoTimers = useCallback(() => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const flushQueuedSync = useCallback(async () => {
    if (!ENABLE_AUTO_SYNC || !user) return;
    if (!hasQueuedSyncRef.current || !queuedPayloadRef.current) return;

    if (isSyncingRef.current) {
      rerunAfterCurrentSyncRef.current = true;
      return;
    }

    const payload = queuedPayloadRef.current;
    hasQueuedSyncRef.current = false;

    try {
      await handleSync(payload.vehicles, payload.records, { allowRemoteDelete: true });
    } catch {
      // Mantém o último snapshot na fila e tenta novamente em poucos segundos.
      hasQueuedSyncRef.current = true;
      if (!retryTimerRef.current) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          void flushQueuedSync();
        }, 5000);
      }
      return;
    }

    if (rerunAfterCurrentSyncRef.current || hasQueuedSyncRef.current) {
      rerunAfterCurrentSyncRef.current = false;
      void flushQueuedSync();
    }
  }, [user, handleSync]);

  const triggerAutoSync = useCallback((
    vehicles: Vehicle[],
    records: MaintenanceRecord[],
    options?: { priority?: SyncPriority; reason?: string },
  ) => {
    if (!ENABLE_AUTO_SYNC || !user) return;
    queuedPayloadRef.current = { vehicles, records };
    hasQueuedSyncRef.current = true;

    const priority = options?.priority ?? 'normal';
    if (__DEV__) {
      console.log(`[CloudContext] Auto-sync enfileirado (${priority})${options?.reason ? `: ${options.reason}` : ''}`);
    }

    if (priority === 'high') {
      clearAutoTimers();
      void flushQueuedSync();
      return;
    }

    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      autoSyncTimerRef.current = null;
      void flushQueuedSync();
    }, 3000);
  }, [user, flushQueuedSync, clearAutoTimers]);

  // Sync periódico (a cada 5 min) se ENABLE_AUTO_SYNC=true e logado
  useEffect(() => {
    if (!ENABLE_AUTO_SYNC || !user) return;
    const interval = setInterval(() => {
      if (hasQueuedSyncRef.current) {
        if (__DEV__) console.log('[CloudContext] Sync periódico da fila disparado.');
        void flushQueuedSync();
      }
    }, 5 * 60 * 1000); // 5 minutos
    return () => {
      clearInterval(interval);
      clearAutoTimers();
    };
  }, [user, flushQueuedSync, clearAutoTimers]);

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
