import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, UserPlus } from 'lucide-react-native';
import { useCloud } from '../CloudContext';
import { useTheme } from '../ThemeContext';
import { radii, spacing, typography } from '../theme';
import type { MaintenanceRecord, Vehicle } from '../../domain/models';
import type { RemoteRecord, RemoteVehicle } from '../../services/cloudSync';

interface Props {
  vehicles: Vehicle[];
  records: MaintenanceRecord[];
  applyRemoteData: (vehicles: RemoteVehicle[], records: RemoteRecord[]) => Promise<void>;
}

export function AccountSection({ vehicles, records, applyRemoteData }: Readonly<Props>) {
  const { palette } = useTheme();
  const cloud = useCloud();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  if (!cloud.configured) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.icon}><CloudOff color={palette.graphite} size={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Conta na nuvem indisponível</Text>
            <Text style={styles.hint}>
              Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e reinicie.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Dados incompletos', 'Informe um e-mail válido e senha de pelo menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await cloud.signIn(email.trim(), password);
      } else {
        await cloud.signUp(email.trim(), password, displayName.trim() || undefined);
        Alert.alert(
          'Confirme o e-mail',
          'Enviamos um link de confirmação para a sua caixa de entrada. Confirme e faça login.',
        );
      }
      setPassword('');
    } catch (err) {
      Alert.alert('Falha', err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      await cloud.signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      if (msg !== 'Login cancelado.') {
        Alert.alert('Falha no login Google', msg);
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleSync() {
    try {
      const report = await cloud.sync(vehicles, records);
      await applyRemoteData(report.remoteVehicles, report.remoteRecords);
      Alert.alert(
        'Sincronização concluída',
        `Enviados ${report.pushedVehicles + report.pushedRecords} · recebidos ${report.pulledVehicles + report.pulledRecords}.`,
      );
    } catch (err) {
      Alert.alert('Falha na sincronização', err instanceof Error ? err.message : 'Erro de rede.');
    }
  }

  async function handleSignOut() {
    Alert.alert('Sair da conta?', 'Os dados locais continuam intactos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void cloud.signOut() },
    ]);
  }

  if (cloud.user) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.icon}><Cloud color={palette.accent} size={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{cloud.user.displayName ?? cloud.user.email ?? 'Conta ativa'}</Text>
            {cloud.user.email ? <Text style={styles.hint}>{cloud.user.email}</Text> : null}
          </View>
        </View>

        {cloud.lastSync ? (
          <Text style={styles.hint}>
            Última sincronização em {new Date(cloud.lastSync.finishedAt).toLocaleString('pt-BR')} ·
            ↑ {cloud.lastSync.pushedVehicles + cloud.lastSync.pushedRecords} ·
            ↓ {cloud.lastSync.pulledVehicles + cloud.lastSync.pulledRecords}
          </Text>
        ) : (
          <Text style={styles.hint}>Nenhuma sincronização ainda. Toque em "Sincronizar agora".</Text>
        )}

        <Pressable
          style={[styles.primaryButton, cloud.status === 'syncing' && { opacity: 0.6 }]}
          disabled={cloud.status === 'syncing'}
          onPress={handleSync}
        >
          {cloud.status === 'syncing' ? <ActivityIndicator color="#FFF" /> : <RefreshCw color="#FFF" size={18} />}
          <Text style={styles.primaryButtonText}>
            {cloud.status === 'syncing' ? 'Sincronizando…' : 'Sincronizar agora'}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
          <LogOut color={palette.danger} size={16} />
          <Text style={[styles.secondaryButtonText, { color: palette.danger }]}>Sair da conta</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.icon}><Cloud color={palette.accent} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Conta na nuvem (opcional)</Text>
          <Text style={styles.hint}>
            Sincronize entre dispositivos. Seus dados continuam funcionando offline.
          </Text>
        </View>
      </View>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentItem, mode === 'signin' && styles.segmentItemActive]}
          onPress={() => setMode('signin')}
        >
          <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>Entrar</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentItem, mode === 'signup' && styles.segmentItemActive]}
          onPress={() => setMode('signup')}
        >
          <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Cadastrar</Text>
        </Pressable>
      </View>

      {mode === 'signup' ? (
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Seu nome (opcional)"
          placeholderTextColor={palette.graphite}
          style={styles.input}
          autoCapitalize="words"
          maxLength={60}
        />
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        placeholderTextColor={palette.graphite}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Senha (mín. 6)"
        placeholderTextColor={palette.graphite}
        secureTextEntry
        style={styles.input}
      />

      <Pressable
        style={[styles.primaryButton, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={handleSubmit}
      >
        {busy ? <ActivityIndicator color="#FFF" /> : (mode === 'signin' ? <LogIn color="#FFF" size={18} /> : <UserPlus color="#FFF" size={18} />)}
        <Text style={styles.primaryButtonText}>
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={[styles.googleButton, googleBusy && { opacity: 0.6 }]}
        disabled={googleBusy}
        onPress={handleGoogleSignIn}
      >
        {googleBusy ? (
          <ActivityIndicator color={palette.ink} size="small" />
        ) : (
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
        )}
        <Text style={styles.googleButtonText}>
          {googleBusy ? 'Abrindo…' : 'Continuar com Google'}
        </Text>
      </Pressable>

      {cloud.lastError ? <Text style={styles.error}>{cloud.lastError}</Text> : null}
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.paper,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    icon: {
      width: 36, height: 36, borderRadius: radii.md,
      backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center',
    },
    title: { ...typography.subtitle, color: p.ink, fontSize: 15 },
    hint: { ...typography.body, color: p.graphite },
    segment: {
      flexDirection: 'row', backgroundColor: p.surfaceAlt, borderRadius: radii.md,
      padding: 4, gap: 4,
    },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
    segmentItemActive: { backgroundColor: p.accent },
    segmentText: { ...typography.bodyStrong, color: p.graphite },
    segmentTextActive: { color: '#FFF' },
    input: {
      minHeight: 46, borderRadius: radii.md, borderWidth: 1, borderColor: p.border,
      backgroundColor: p.surfaceAlt, paddingHorizontal: spacing.md, color: p.ink, fontSize: 15,
    },
    primaryButton: {
      minHeight: 50, borderRadius: radii.md, backgroundColor: p.accent,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    primaryButtonText: { ...typography.subtitle, color: '#FFF', fontSize: 15 },
    secondaryButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      paddingVertical: spacing.md, borderRadius: radii.md,
      borderWidth: 1, borderColor: p.danger, backgroundColor: 'transparent',
    },
    secondaryButtonText: { ...typography.bodyStrong },
    dividerRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: p.border },
    dividerText: { ...typography.caption, color: p.graphite },
    googleButton: {
      minHeight: 50, borderRadius: radii.md,
      borderWidth: 1, borderColor: p.border,
      backgroundColor: p.paper,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    googleIcon: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: '#4285F4',
      alignItems: 'center', justifyContent: 'center',
    },
    googleIconText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    googleButtonText: { ...typography.bodyStrong, color: p.ink, fontSize: 15 },
    error: { ...typography.body, color: p.danger },
  });
}
