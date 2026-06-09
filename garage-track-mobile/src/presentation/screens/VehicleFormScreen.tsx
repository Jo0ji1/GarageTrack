import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bike, Car, Save, Trash2 } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radii, spacing, typography } from '../theme';
import type { Vehicle, VehicleDraft, VehicleType } from '../../domain/models';

interface Props {
  /** Veículo existente → modo edição; undefined → modo adição. */
  initialValues?: Vehicle;
  onSave: (draft: VehicleDraft) => Promise<void>;
  /** Disponível apenas no modo edição. */
  onDelete?: () => Promise<void>;
}

/**
 * Formulário de adição e edição de veículo.
 * Deve ser renderizado dentro de um modal (ModalHeader + back button no pai).
 */
export function VehicleFormScreen({ initialValues, onSave, onDelete }: Readonly<Props>) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const isEdit = !!initialValues;

  const [type, setType] = useState<VehicleType>(initialValues?.type ?? 'car');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [brand, setBrand] = useState(initialValues?.brand ?? '');
  const [model, setModel] = useState(initialValues?.model ?? '');
  const [year, setYear] = useState(String(initialValues?.year ?? new Date().getFullYear()));
  const [plate, setPlate] = useState(initialValues?.plate ?? '');
  const [mileage, setMileage] = useState(String(initialValues?.currentMileage ?? 0));
  const [weeklyMileage, setWeeklyMileage] = useState(String(initialValues?.weeklyMileage ?? 0));
  const [vin, setVin] = useState(initialValues?.vin ?? '');
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return 'Informe um nome para o veículo.';
    if (!brand.trim()) return 'Informe a marca.';
    if (!model.trim()) return 'Informe o modelo.';
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2)
      return 'Ano inválido (ex: 2020).';
    if (!plate.trim()) return 'Informe a placa.';
    const mileageNum = parseInt(mileage, 10);
    if (isNaN(mileageNum) || mileageNum < 0) return 'Quilometragem inválida.';
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Campos inválidos', validationError);
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        type,
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        plate: plate.trim().toUpperCase(),
        currentMileage: Math.max(0, parseInt(mileage, 10) || 0),
        weeklyMileage: Math.max(0, parseInt(weeklyMileage, 10) || 0),
        vin: vin.trim() || undefined,
      });
    } catch (e) {
      Alert.alert('Erro ao salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir veículo',
      `Tem certeza que deseja excluir "${name || 'este veículo'}"?\n\nTodos os registros de manutenção e alertas associados serão removidos permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete?.();
            } catch (e) {
              Alert.alert('Erro ao excluir', e instanceof Error ? e.message : 'Tente novamente.');
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Tipo */}
        <View style={styles.card}>
          <Text style={styles.label}>Tipo de veículo</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeOption, type === 'car' && styles.typeOptionSelected]}
              onPress={() => setType('car')}
            >
              <Car size={22} color={type === 'car' ? '#FFF' : palette.pine} />
              <Text style={[styles.typeOptionText, type === 'car' && styles.typeOptionTextSelected]}>Carro</Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, type === 'motorcycle' && styles.typeOptionSelected]}
              onPress={() => setType('motorcycle')}
            >
              <Bike size={22} color={type === 'motorcycle' ? '#FFF' : palette.pine} />
              <Text style={[styles.typeOptionText, type === 'motorcycle' && styles.typeOptionTextSelected]}>Moto</Text>
            </Pressable>
          </View>
        </View>

        {/* Identificação */}
        <View style={styles.card}>
          <Text style={styles.label}>Apelido / nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Meu Civic, Moto do Trabalho"
            placeholderTextColor={palette.graphite}
          />

          <Text style={styles.label}>Marca</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Ex: Honda, Toyota, Yamaha"
            placeholderTextColor={palette.graphite}
          />

          <Text style={styles.label}>Modelo</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Ex: Civic 1.5T, CG 160 Titan"
            placeholderTextColor={palette.graphite}
          />
        </View>

        {/* Detalhes */}
        <View style={styles.card}>
          <Text style={styles.label}>Ano</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder={String(new Date().getFullYear())}
            placeholderTextColor={palette.graphite}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>Placa</Text>
          <TextInput
            style={styles.input}
            value={plate}
            onChangeText={(t) => setPlate(t.toUpperCase())}
            placeholder="Ex: BRA2E19"
            placeholderTextColor={palette.graphite}
            autoCapitalize="characters"
            maxLength={8}
          />
        </View>

        {/* Quilometragem */}
        <View style={styles.card}>
          <Text style={styles.label}>Quilometragem atual (km)</Text>
          <TextInput
            style={styles.input}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="numeric"
            placeholder="Ex: 45000"
            placeholderTextColor={palette.graphite}
          />

          <Text style={styles.label}>Km rodados por semana (estimativa)</Text>
          <TextInput
            style={styles.input}
            value={weeklyMileage}
            onChangeText={setWeeklyMileage}
            keyboardType="numeric"
            placeholder="Ex: 250"
            placeholderTextColor={palette.graphite}
          />
          <Text style={styles.hint}>
            Usado para calcular a data estimada dos próximos serviços por quilometragem.
          </Text>
        </View>

        {/* VIN opcional */}
        <View style={styles.card}>
          <Text style={styles.label}>VIN / Chassi (opcional)</Text>
          <TextInput
            style={styles.input}
            value={vin}
            onChangeText={setVin}
            placeholder="Ex: 9BWZZZ377VT004251"
            placeholderTextColor={palette.graphite}
            autoCapitalize="characters"
            maxLength={17}
          />
        </View>

        <Pressable
          style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={submitting}
        >
          <Save size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar veículo'}
          </Text>
        </Pressable>

        {isEdit && onDelete ? (
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Trash2 size={18} color={palette.danger} />
            <Text style={styles.deleteButtonText}>Excluir veículo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    card: {
      backgroundColor: p.paper,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    label: { ...typography.eyebrow, color: p.graphite },
    hint: { ...typography.caption, color: p.graphite, fontWeight: '400', lineHeight: 18 },
    input: {
      minHeight: 48,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surfaceAlt,
      paddingHorizontal: spacing.md,
      color: p.ink,
      fontSize: 15,
    },
    typeRow: { flexDirection: 'row', gap: spacing.sm },
    typeOption: {
      flex: 1,
      minHeight: 68,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    typeOptionSelected: { backgroundColor: p.pine, borderColor: p.pine },
    typeOptionText: { ...typography.caption, color: p.ink },
    typeOptionTextSelected: { color: '#FFF', fontWeight: '700' },
    primaryButton: {
      minHeight: 56,
      borderRadius: radii.lg,
      backgroundColor: p.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    primaryButtonText: { ...typography.subtitle, color: '#FFF', fontSize: 16 },
    deleteButton: {
      minHeight: 48,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: p.danger,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    deleteButtonText: { ...typography.subtitle, color: p.danger, fontSize: 15 },
  });
}
