import { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { AlertOctagon, Camera as CameraIcon, Image as ImageIcon, Mic, Send } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radii, spacing, typography } from '../theme';
import type { Vehicle, Workshop } from '../../domain/models';
import { captureServicePhoto, pickServicePhoto } from '../../services/nativeCapabilities';

interface Props {
  vehicle: Vehicle;
  workshops: Workshop[];
  /** Persiste o relato como uma manutenção pendente categorizada como "diagnóstico". */
  onSubmit: (input: {
    description: string;
    workshopId?: string;
    photoUri?: string;
    audioUri?: string;
  }) => Promise<void>;
}

const MAX_DESCRIPTION = 500;

/**
 * Tela "Reportar Problema": registra um sintoma que o motorista percebeu,
 * com evidências (foto, áudio do ruído) e oficina destino.
 */
export function ReportProblemScreen({ vehicle, workshops, onSubmit }: Readonly<Props>) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [workshopId, setWorkshopId] = useState<string | undefined>(workshops[0]?.id);
  const [submitting, setSubmitting] = useState(false);

  async function handleCapture() {
    try {
      const result = await captureServicePhoto();
      if (result.error) {
        Alert.alert('Câmera', result.error);
        return;
      }
      if (result.data) setPhotoUri(result.data);
    } catch (err) {
      Alert.alert('Câmera', err instanceof Error ? err.message : 'Falha ao capturar.');
    }
  }

  async function handlePick() {
    try {
      const result = await pickServicePhoto();
      if (result.error) {
        Alert.alert('Galeria', result.error);
        return;
      }
      if (result.data) setPhotoUri(result.data);
    } catch (err) {
      Alert.alert('Galeria', err instanceof Error ? err.message : 'Falha ao escolher.');
    }
  }

  async function toggleRecord() {
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        if (recorder.uri) setAudioUri(recorder.uri);
        return;
      }
      const granted = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted.granted) {
        Alert.alert('Microfone', 'Permissão negada.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
    } catch (err) {
      Alert.alert('Áudio', err instanceof Error ? err.message : 'Falha na gravação.');
    }
  }

  async function handleSubmit() {
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      Alert.alert('Descrição curta', 'Conte um pouco mais sobre o problema (mín. 10 letras).');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ description: trimmed, workshopId, photoUri, audioUri });
      setDescription('');
      setPhotoUri(undefined);
      setAudioUri(undefined);
      Alert.alert('Enviado', 'Seu relato foi salvo no histórico do veículo.');
    } catch (err) {
      Alert.alert('Falha', err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><AlertOctagon color={palette.accent} size={26} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Reportar problema</Text>
            <Text style={styles.subtitle}>Descreva sintomas e capture evidências para registrar no histórico de {vehicle.name}.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Evidências</Text>
          <View style={styles.evidenceGrid}>
            <EvidenceButton Icon={CameraIcon} label="Tirar foto" onPress={handleCapture} active={!!photoUri} />
            <EvidenceButton Icon={ImageIcon} label="Galeria" onPress={handlePick} active={!!photoUri} />
            <EvidenceButton
              Icon={Mic}
              label={recorderState.isRecording ? 'Parar' : audioUri ? 'Regravar' : 'Gravar áudio'}
              onPress={toggleRecord}
              active={!!audioUri || recorderState.isRecording}
            />
          </View>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
          {audioUri ? <Text style={styles.audioBadge}>🎙️ Áudio anexado</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Descrição do problema</Text>
          <TextInput
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, MAX_DESCRIPTION))}
            placeholder="Descreva o problema (barulho, vibração, falha...)"
            placeholderTextColor={palette.graphite}
            style={styles.textarea}
            multiline
            maxLength={MAX_DESCRIPTION}
          />
          <Text style={styles.counter}>{description.length}/{MAX_DESCRIPTION}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Enviar para oficina</Text>
          {workshops.map((workshop) => {
            const selected = workshop.id === workshopId;
            return (
              <Pressable
                key={workshop.id}
                style={[styles.workshopRow, selected && styles.workshopRowSelected]}
                onPress={() => setWorkshopId(workshop.id)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workshopName}>{workshop.name}</Text>
                  <Text style={styles.workshopMeta}>{workshop.address}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          <Send color="#FFF" size={18} />
          <Text style={styles.primaryButtonText}>{submitting ? 'Enviando…' : 'Enviar para oficina'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EvidenceButton({
  Icon, label, onPress, active,
}: Readonly<{
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  onPress: () => void;
  active: boolean;
}>) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Pressable style={[styles.evidenceButton, active && styles.evidenceButtonActive]} onPress={onPress}>
      <Icon color={active ? '#FFF' : palette.accent} size={22} />
      <Text style={[styles.evidenceButtonText, active && { color: '#FFF' }]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    heroIcon: {
      width: 52, height: 52, borderRadius: radii.lg,
      backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center',
    },
    title: { ...typography.h2, color: p.ink },
    subtitle: { ...typography.body, color: p.graphite },
    sectionLabel: { ...typography.eyebrow, color: p.graphite },
    card: {
      backgroundColor: p.paper, borderRadius: radii.lg, borderWidth: 1, borderColor: p.border,
      padding: spacing.lg, gap: spacing.md,
    },
    evidenceGrid: { flexDirection: 'row', gap: spacing.sm },
    evidenceButton: {
      flex: 1, minHeight: 84, borderRadius: radii.md, borderWidth: 1, borderColor: p.border,
      backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    evidenceButtonActive: { backgroundColor: p.accent, borderColor: p.accent },
    evidenceButtonText: { ...typography.caption, color: p.ink, textAlign: 'center' },
    preview: { width: '100%', height: 200, borderRadius: radii.md, marginTop: spacing.sm },
    audioBadge: { ...typography.bodyStrong, color: p.success },
    textarea: {
      minHeight: 120, borderRadius: radii.md, borderWidth: 1, borderColor: p.border,
      backgroundColor: p.surfaceAlt, padding: spacing.md, color: p.ink, fontSize: 15,
      textAlignVertical: 'top', lineHeight: 20,
    },
    counter: { ...typography.caption, color: p.graphite, textAlign: 'right' },
    workshopRow: {
      flexDirection: 'row', gap: spacing.md, alignItems: 'center',
      paddingVertical: spacing.md, paddingHorizontal: spacing.md,
      borderRadius: radii.md, borderWidth: 1, borderColor: p.border,
    },
    workshopRowSelected: { borderColor: p.accent, backgroundColor: p.accentSoft },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: p.graphite,
      alignItems: 'center', justifyContent: 'center',
    },
    radioSelected: { borderColor: p.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: p.accent },
    workshopName: { ...typography.subtitle, color: p.ink, fontSize: 15 },
    workshopMeta: { ...typography.caption, color: p.graphite, fontWeight: '400' },
    primaryButton: {
      minHeight: 56, borderRadius: radii.lg, backgroundColor: p.accent,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    primaryButtonText: { ...typography.subtitle, color: '#FFF', fontSize: 16 },
  });
}
