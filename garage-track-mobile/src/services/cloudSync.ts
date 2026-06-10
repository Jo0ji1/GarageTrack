import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { MaintenanceRecord, Vehicle } from '../domain/models';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Permite ao WebBrowser completar a sessão OAuth no Expo Go / standalone.
WebBrowser.maybeCompleteAuthSession();

/**
 * Sincronização offline-first.
 * Local sempre é a verdade durante uso normal.
 * push() envia veículos + manutenções locais para Supabase (upsert).
 * pull() traz registros remotos e devolve para o caller mesclar.
 *
 * AUTO-SYNC: para habilitar sync automático após cada mutação local,
 * defina ENABLE_AUTO_SYNC=true. Recomendado apenas para conexões estáveis.
 */

export const ENABLE_AUTO_SYNC = true; // Mude para true para ativar sync automático

export type CloudUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type CloudHealth =
  | { ok: true; user: CloudUser | null }
  | { ok: false; reason: string };

function toScopedCloudId(userId: string, localId: string): string {
  return `${userId}::${localId}`;
}

function fromScopedCloudId(userId: string, cloudId: string): string {
  const prefix = `${userId}::`;
  return cloudId.startsWith(prefix) ? cloudId.slice(prefix.length) : cloudId;
}

export async function pingCloud(): Promise<CloudHealth> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: 'Supabase não configurado (.env ausente)' };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { ok: false, reason: error.message };
    const session = data.session;
    if (!session) return { ok: true, user: null };
    return {
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        displayName:
          (session.user.user_metadata?.full_name as string | undefined) ??
          (session.user.user_metadata?.name as string | undefined) ??
          null,
      },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'falha desconhecida' };
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName ?? '' } },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Login com Google via Supabase OAuth + WebBrowser.
 * Fluxo: abre browser nativo → Google autentica → redireciona para
 * garagetrack://auth/callback → Supabase troca o code por sessão.
 *
 * Pré-requisito (Supabase dashboard):
 *   Authentication → Providers → Google → habilitar
 *   Client ID = Web OAuth Client ID
 *   Client Secret = Web OAuth Client Secret
 *   Redirect URL permitida = garagetrack://auth/callback
 *
 * FIX para PKCE: extrair code e code_verifier da URL de retorno.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado');

  const redirectTo = makeRedirectUri({ scheme: 'garagetrack', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });

  if (error) throw new Error(describeSupabaseError(error, 'iniciar login com Google'));
  if (!data.url) throw new Error('Não foi possível obter a URL de autenticação Google.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Login cancelado.');
  }
  if (result.type === 'success' && result.url) {
    // Parse da URL de retorno: garagetrack://auth/callback#access_token=...&refresh_token=...
    // OU garagetrack://auth/callback?code=...&state=...
    const url = new URL(result.url);
    
    // PKCE flow: o Supabase retorna um 'code' nos query params
    const code = url.searchParams.get('code');
    
    if (code) {
      // Exchange code por session (PKCE)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        throw new Error(describeSupabaseError(exchangeError, 'concluir login com Google'));
      }
    } else {
      // Implicit flow (menos seguro, mas pode acontecer em dev)
      // Tenta extrair tokens do fragment
      const fragment = url.hash.slice(1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setError) {
          throw new Error(describeSupabaseError(setError, 'estabelecer sessão com Google'));
        }
      } else {
        throw new Error('URL de retorno não contém code nem tokens. Verifique configuração OAuth no Supabase.');
      }
    }
  }
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  const health = await pingCloud();
  return health.ok ? health.user : null;
}

function describeSupabaseError(err: unknown, action: string): string {
  if (!err) return `Falha ao ${action}`;
  const e = err as { message?: string; details?: string; hint?: string; code?: string };
  const parts: string[] = [];
  if (e.message) parts.push(e.message);
  if (e.details) parts.push(e.details);
  if (e.hint) parts.push(`Dica: ${e.hint}`);
  if (e.code) parts.push(`[${e.code}]`);
  const joined = parts.join(' · ');
  if (!joined) return `Falha ao ${action} (sem detalhes da API)`;
  // Erros típicos de fetch do RN
  if (/Network request failed/i.test(joined)) {
    return 'Sem conexão com o Supabase. Verifique sua internet ou a URL do projeto.';
  }
  if (/invalid input syntax for type uuid/i.test(joined)) {
    return 'Schema do Supabase desatualizado: rode a migration 20260528000200_text_ids.sql.';
  }
  return `${joined}`;
}

export async function pushVehicles(vehicles: Vehicle[]): Promise<{ pushed: number }> {
  if (!supabase) throw new Error('Supabase não configurado');
  const user = await getCurrentUser();
  if (!user) throw new Error('Faça login para sincronizar');
  const rows = vehicles.map((v) => ({
    id: toScopedCloudId(user.id, v.id),
    user_id: user.id,
    name: v.name,
    type: v.type,
    plate: v.plate ?? null,
    brand: v.brand ?? null,
    model: v.model ?? null,
    year: v.year ?? null,
    current_mileage: v.currentMileage,
    image_uri: null,
  }));

  const localIds = new Set(rows.map((row) => row.id));
  const { data: existingRows, error: existingError } = await supabase
    .from('vehicles')
    .select('id')
    .eq('user_id', user.id);
  if (existingError) {
    if (__DEV__) console.error('[cloudSync] list vehicles error:', existingError);
    throw new Error(describeSupabaseError(existingError, 'listar veículos remotos'));
  }

  const idsToDelete = (existingRows ?? [])
    .map((row) => row.id as string)
    .filter((id) => !localIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('user_id', user.id)
      .in('id', idsToDelete);
    if (deleteError) {
      if (__DEV__) console.error('[cloudSync] delete vehicles error:', deleteError);
      throw new Error(describeSupabaseError(deleteError, 'remover veículos remotos'));
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('vehicles').upsert(rows, { onConflict: 'id' });
    if (error) {
      if (__DEV__) console.error('[cloudSync] pushVehicles error:', error);
      throw new Error(describeSupabaseError(error, 'enviar veículos'));
    }
  }

  return { pushed: rows.length };
}

export async function pushRecords(records: MaintenanceRecord[]): Promise<{ pushed: number }> {
  if (!supabase) throw new Error('Supabase não configurado');
  const user = await getCurrentUser();
  if (!user) throw new Error('Faça login para sincronizar');
  const rows = records.map((r) => ({
    id: toScopedCloudId(user.id, r.id),
    user_id: user.id,
    vehicle_id: toScopedCloudId(user.id, r.vehicleId),
    category_id: r.categoryId,
    title: r.title,
    description: r.notes ?? null,
    mileage: r.mileage,
    cost_cents: r.costCents,
    performed_at: r.serviceDate,
    workshop_name: r.workshopId ?? null,
  }));

  const localIds = new Set(rows.map((row) => row.id));
  const { data: existingRows, error: existingError } = await supabase
    .from('maintenance_records')
    .select('id')
    .eq('user_id', user.id);
  if (existingError) {
    if (__DEV__) console.error('[cloudSync] list records error:', existingError);
    throw new Error(describeSupabaseError(existingError, 'listar manutenções remotas'));
  }

  const idsToDelete = (existingRows ?? [])
    .map((row) => row.id as string)
    .filter((id) => !localIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('user_id', user.id)
      .in('id', idsToDelete);
    if (deleteError) {
      if (__DEV__) console.error('[cloudSync] delete records error:', deleteError);
      throw new Error(describeSupabaseError(deleteError, 'remover manutenções remotas'));
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('maintenance_records').upsert(rows, { onConflict: 'id' });
    if (error) {
      if (__DEV__) console.error('[cloudSync] pushRecords error:', error);
      throw new Error(describeSupabaseError(error, 'enviar manutenções'));
    }
  }

  return { pushed: rows.length };
}

export type RemoteVehicle = {
  id: string;
  name: string;
  type: 'car' | 'motorcycle';
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  current_mileage: number;
  image_uri: string | null;
};

export type RemoteRecord = {
  id: string;
  vehicle_id: string;
  category_id: string;
  title: string;
  description: string | null;
  mileage: number;
  cost_cents: number;
  performed_at: string;
  workshop_name: string | null;
};

export async function pullVehicles(): Promise<RemoteVehicle[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, name, type, plate, brand, model, year, current_mileage, image_uri')
    .eq('user_id', user.id);
  if (error) throw error;
  const rows = (data ?? []) as RemoteVehicle[];
  return rows.map((row) => ({
    ...row,
    id: fromScopedCloudId(user.id, row.id),
  }));
}

export async function pullRecords(): Promise<RemoteRecord[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('id, vehicle_id, category_id, title, description, mileage, cost_cents, performed_at, workshop_name')
    .eq('user_id', user.id)
    .order('performed_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as RemoteRecord[];
  return rows.map((row) => ({
    ...row,
    id: fromScopedCloudId(user.id, row.id),
    vehicle_id: fromScopedCloudId(user.id, row.vehicle_id),
  }));
}

export type SyncReport = {
  pushedVehicles: number;
  pushedRecords: number;
  pulledVehicles: number;
  pulledRecords: number;
  remoteVehicles: RemoteVehicle[];
  remoteRecords: RemoteRecord[];
  startedAt: string;
  finishedAt: string;
};

export async function syncAll(
  localVehicles: Vehicle[],
  localRecords: MaintenanceRecord[],
): Promise<SyncReport> {
  const startedAt = new Date().toISOString();
  // Veículos devem ser inseridos antes dos registros (FK vehicle_id → vehicles.id).
  const pv = await pushVehicles(localVehicles);
  const pr = await pushRecords(localRecords);
  const [rv, rr] = await Promise.all([pullVehicles(), pullRecords()]);
  return {
    pushedVehicles: pv.pushed,
    pushedRecords: pr.pushed,
    pulledVehicles: rv.length,
    pulledRecords: rr.length,
    remoteVehicles: rv,
    remoteRecords: rr,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}
