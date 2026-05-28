import { supabase, isSupabaseConfigured } from './supabaseClient';

export type CloudHealth =
  | { ok: true; user: string | null }
  | { ok: false; reason: string };

/**
 * Faz uma chamada leve ao Supabase para verificar credenciais e conectividade.
 * Não escreve nada; apenas tenta recuperar a sessão atual.
 */
export async function pingCloud(): Promise<CloudHealth> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: 'Supabase não configurado (.env ausente)' };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true, user: data.session?.user?.email ?? null };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'falha desconhecida' };
  }
}
