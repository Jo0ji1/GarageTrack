import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { MaintenanceRecord, Vehicle } from '../domain/models';

/**
 * Sincronização offline-first.
 * Local sempre é a verdade durante uso normal.
 * push() envia veículos + manutenções locais para Supabase (upsert).
 * pull() traz registros remotos e devolve para o caller mesclar.
 */

export type CloudUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type CloudHealth =
  | { ok: true; user: CloudUser | null }
  | { ok: false; reason: string };

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
  if (vehicles.length === 0) return { pushed: 0 };
  const rows = vehicles.map((v) => ({
    id: v.id,
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
  const { error } = await supabase.from('vehicles').upsert(rows, { onConflict: 'id' });
  if (error) {
    if (__DEV__) console.error('[cloudSync] pushVehicles error:', error);
    throw new Error(describeSupabaseError(error, 'enviar veículos'));
  }
  return { pushed: rows.length };
}

export async function pushRecords(records: MaintenanceRecord[]): Promise<{ pushed: number }> {
  if (!supabase) throw new Error('Supabase não configurado');
  const user = await getCurrentUser();
  if (!user) throw new Error('Faça login para sincronizar');
  if (records.length === 0) return { pushed: 0 };
  const rows = records.map((r) => ({
    id: r.id,
    user_id: user.id,
    vehicle_id: r.vehicleId,
    category_id: r.categoryId,
    title: r.title,
    description: r.notes ?? null,
    mileage: r.mileage,
    cost_cents: r.costCents,
    performed_at: r.serviceDate,
    workshop_name: r.workshopId ?? null,
  }));
  const { error } = await supabase.from('maintenance_records').upsert(rows, { onConflict: 'id' });
  if (error) {
    if (__DEV__) console.error('[cloudSync] pushRecords error:', error);
    throw new Error(describeSupabaseError(error, 'enviar manutenções'));
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
  return (data ?? []) as RemoteVehicle[];
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
  return (data ?? []) as RemoteRecord[];
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
