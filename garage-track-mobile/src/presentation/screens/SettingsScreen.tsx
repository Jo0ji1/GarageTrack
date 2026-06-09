import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ChevronRight, Download, Fingerprint, LogOut, Moon, Shield, Sun, User } from 'lucide-react-native';
import { useAuth } from '../AuthContext';
import { useTheme, type ThemePreference } from '../ThemeContext';
import { radii, spacing, typography } from '../theme';
import type { GarageSnapshot } from '../../domain/models';
import type { RemoteRecord, RemoteVehicle } from '../../services/cloudSync';
import { exportEncryptedBackup } from '../../services/backup';
import { AccountSection } from './AccountSection';

interface Props {
  snapshot: GarageSnapshot;
  applyRemoteData: (vehicles: RemoteVehicle[], records: RemoteRecord[]) => Promise<void>;
}

/**
 * Tela de configurações: perfil, segurança, aparência e backup.
 */
export function SettingsScreen({ snapshot, applyRemoteData }: Readonly<Props>) {
  const { palette, mode, preference, setPreference } = useTheme();
  const {
    userName,
    setUserName,
    biometric,
    biometricEnabled,
    setBiometricEnabled,
    lock,
    resetAuth,
  } = useAuth();

  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [editName, setEditName] = useState(userName);
  const [backupPassword, setBackupPassword] = useState('');
  const [exporting, setExporting] = useState(false);

  const themeOptions: Array<{ value: ThemePreference; label: string }> = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
    { value: 'system', label: 'Sistema' },
  ];

  async function handleExport() {
    if (backupPassword.length < 8) {
      Alert.alert('Senha curta', 'Defina ao menos 8 caracteres para o backup.');
      return;
    }
    setExporting(true);
    try {
      await exportEncryptedBackup(snapshot, backupPassword);
      setBackupPassword('');
      Alert.alert('Backup pronto', 'Arquivo cifrado gerado e enviado para compartilhamento.');
    } catch (err) {
      Alert.alert('Falha no backup', err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setExporting(false);
    }
  }

  function handleResetAuth() {
    Alert.alert(
      'Remover PIN?',
      'Você precisará criar um novo PIN. Os dados do GarageTrack continuam intactos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => void resetAuth() },
      ],
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Conta na nuvem</Text>
        <AccountSection vehicles={snapshot.vehicles} records={snapshot.maintenanceRecords} applyRemoteData={applyRemoteData} />

        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}><User color={palette.accent} size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Como te chamamos</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                onBlur={() => editName !== userName && setUserName(editName)}
                style={styles.input}
                maxLength={60}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>{mode === 'dark' ? <Moon color={palette.accent} size={18} /> : <Sun color={palette.accent} size={18} />}</View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Tema</Text>
          </View>
          <View style={styles.segment}>
            {themeOptions.map((option) => {
              const active = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => setPreference(option.value)}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}><Fingerprint color={palette.accent} size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Biometria</Text>
              <Text style={styles.rowHint}>
                {biometric.available && biometric.enrolled
                  ? 'Use Face ID / impressão digital como atalho do PIN.'
                  : 'Cadastre uma biometria no sistema para habilitar.'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              disabled={!biometric.available || !biometric.enrolled}
              trackColor={{ true: palette.accent, false: palette.border }}
              thumbColor={palette.paper}
            />
          </View>
          <Pressable style={styles.dangerButton} onPress={handleResetAuth}>
            <Shield color={palette.danger} size={16} />
            <Text style={styles.dangerButtonText}>Remover PIN do dispositivo</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={lock}>
            <LogOut color={palette.graphite} size={16} />
            <Text style={styles.linkRowText}>Bloquear agora</Text>
            <ChevronRight color={palette.graphite} size={16} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Backup</Text>
        <View style={styles.card}>
          <Text style={styles.rowHint}>
            Exporta seu histórico em um arquivo cifrado com senha. Guarde a senha em local seguro —
            sem ela, o backup é irrecuperável.
          </Text>
          <TextInput
            value={backupPassword}
            onChangeText={setBackupPassword}
            placeholder="Senha do backup (mín. 8)"
            placeholderTextColor={palette.graphite}
            secureTextEntry
            style={styles.input}
            maxLength={64}
          />
          <Pressable
            style={[styles.primaryButton, exporting && { opacity: 0.6 }]}
            disabled={exporting}
            onPress={handleExport}
          >
            <Download color="#FFF" size={18} />
            <Text style={styles.primaryButtonText}>
              {exporting ? 'Gerando…' : 'Exportar backup cifrado'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://github.com/expo/expo')}
          >
            <Text style={[styles.rowLabel, { flex: 1 }]}>Versão</Text>
            <Text style={styles.rowHint}>1.3.0 · Expo SDK 56</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    sectionTitle: { ...typography.eyebrow, color: p.graphite, marginTop: spacing.md },
    card: {
      backgroundColor: p.paper,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowIcon: {
      width: 36, height: 36, borderRadius: radii.md,
      backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center',
    },
    rowLabel: { ...typography.subtitle, color: p.ink, fontSize: 15 },
    rowHint: { ...typography.body, color: p.graphite },
    input: {
      minHeight: 46, borderRadius: radii.md, borderWidth: 1, borderColor: p.border,
      backgroundColor: p.surfaceAlt, paddingHorizontal: spacing.md, color: p.ink, fontSize: 15,
    },
    segment: {
      flexDirection: 'row', backgroundColor: p.surfaceAlt, borderRadius: radii.md,
      padding: 4, gap: 4,
    },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
    segmentItemActive: { backgroundColor: p.accent },
    segmentText: { ...typography.bodyStrong, color: p.graphite },
    segmentTextActive: { color: '#FFF' },
    primaryButton: {
      minHeight: 50, borderRadius: radii.md, backgroundColor: p.accent,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    primaryButtonText: { ...typography.subtitle, color: '#FFF', fontSize: 15 },
    dangerButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      paddingVertical: spacing.md, borderRadius: radii.md,
      borderWidth: 1, borderColor: p.danger, backgroundColor: 'transparent',
    },
    dangerButtonText: { ...typography.bodyStrong, color: p.danger },
    linkRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    linkRowText: { ...typography.bodyStrong, color: p.graphite, flex: 1 },
  });
}
