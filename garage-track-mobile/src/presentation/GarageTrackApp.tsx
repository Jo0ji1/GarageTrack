import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bike,
  CalendarClock,
  Camera,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  History,
  ImagePlus,
  MapPin,
  Mic,
  Navigation,
  Pencil,
  Play,
  PlusCircle,
  Route,
  Save,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Square as StopIcon,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { useGarageTrack } from '../data/useGarageTrack';
import {
  AlertPreference,
  HealthStatus,
  MaintenanceCategoryId,
  MaintenanceDraft,
  MaintenanceRecord,
  Vehicle,
  VehicleDraft,
  Workshop,
  WorkshopReview,
  getCategoriesForVehicle,
  getCategoryDefinition,
} from '../domain/models';
import {
  buildDynamicChecklist,
  buildPreTripChecklist,
  buildVehicleHealth,
  formatCurrency,
  formatShortDate,
} from '../domain/maintenanceRules';
import {
  captureServicePhoto,
  getCurrentGarageLocation,
  pickServicePhoto,
  scheduleHealthNotifications,
  scheduleImmediateReviewNotification,
} from '../services/nativeCapabilities';
import { searchNearbyWorkshops, type NearbyWorkshop } from '../services/workshopsApi';
import { colors, layout, radii, shadow, shadowSoft, spacing } from './theme';
import { useAuth } from './AuthContext';
import { useCloud } from './CloudContext';
import { SettingsScreen } from './screens/SettingsScreen';
import { ReportProblemScreen } from './screens/ReportProblemScreen';
import { VehicleFormScreen } from './screens/VehicleFormScreen';

type ScreenKey = 'dashboard' | 'health' | 'new' | 'history' | 'map' | 'trip' | 'alerts' | 'report' | 'settings' | 'vehicle-form';
type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

const tabs: Array<{ key: ScreenKey; label: string; Icon: IconComponent }> = [
  { key: 'dashboard', label: 'Início', Icon: Gauge },
  { key: 'health', label: 'Saúde', Icon: ShieldCheck },
  { key: 'new', label: 'Registrar', Icon: Wrench },
  { key: 'report', label: 'Problema', Icon: AlertOctagon },
  { key: 'history', label: 'Histórico', Icon: History },
  { key: 'map', label: 'Mapa', Icon: MapPin },
  { key: 'trip', label: 'Viagem', Icon: Route },
  { key: 'alerts', label: 'Alertas', Icon: Bell },
];

export function GarageTrackApp() {
  const { snapshot, isLoading, error, addMaintenance, updateAlertPreference, addWorkshopReview, applyRemoteData, addVehicle, updateVehicle, deleteVehicle } = useGarageTrack();
  const { userName: authUserName } = useAuth();
  const { user, triggerAutoSync } = useCloud();
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const didMountRef = useRef(false);
  const hasPendingLocalMutationRef = useRef(false);

  const vehicles = snapshot?.vehicles ?? [];

  useEffect(() => {
    if (!selectedVehicleId && vehicles[0]) {
      setSelectedVehicleId(vehicles[0].id);
      return;
    }

    if (selectedVehicleId && !vehicles.some((vehicle) => vehicle.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicles[0]?.id ?? null);
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (!snapshot) return;
    const sv = snapshot.vehicles.find((v) => v.id === selectedVehicleId) ?? snapshot.vehicles[0];
    if (!sv) return;
    const h = buildVehicleHealth(sv, snapshot.maintenanceRecords, snapshot.alertPreferences);
    scheduleHealthNotifications(
      h.items.map((i) => ({ label: i.categoryLabel, status: i.status, nextDueDate: i.nextDueDate })),
    ).catch(() => {});
  }, [selectedVehicleId, snapshot]);

  useEffect(() => {
    if (!snapshot || !user) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!hasPendingLocalMutationRef.current) return;
    hasPendingLocalMutationRef.current = false;
    triggerAutoSync(snapshot.vehicles, snapshot.maintenanceRecords, {
      priority: 'normal',
      reason: 'local-mutation',
    });
  }, [snapshot, user, triggerAutoSync]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if ((nextState === 'background' || nextState === 'inactive') && snapshot && user) {
        triggerAutoSync(snapshot.vehicles, snapshot.maintenanceRecords, {
          priority: 'high',
          reason: 'app-background',
        });
      }
    });
    return () => sub.remove();
  }, [snapshot, user, triggerAutoSync]);

  if (isLoading || !snapshot) {
    return <StateScreen title="Preparando garagem" description="Abrindo banco local, aplicando migrações e carregando seu histórico." />;
  }

  if (error) {
    return <StateScreen title="Não foi possível carregar" description={error} tone="danger" />;
  }

  const garage = snapshot;
  const displayUserName = authUserName || garage.user.name;

  if (vehicles.length === 0) {
    const isModalScreen = activeScreen === 'settings' || activeScreen === 'vehicle-form';
    const modalTitle = activeScreen === 'settings' ? 'Configurações' : 'Novo veículo';

    return (
      <View style={styles.appShell}>
        {isModalScreen ? (
          <>
            <ModalHeader title={modalTitle} onBack={() => { setVehicleToEdit(null); setActiveScreen('dashboard'); }} />
            {activeScreen === 'settings' ? (
              <SettingsScreen snapshot={garage} applyRemoteData={applyRemoteData} />
            ) : (
              <VehicleFormScreen
                initialValues={undefined}
                onSave={handleAddVehicle}
              />
            )}
          </>
        ) : (
          <>
            <AppHeader userName={displayUserName} vehicleCount={0} onOpenSettings={() => setActiveScreen('settings')} />
            <EmptyGarageScreen
              onCreateVehicle={() => {
                setVehicleToEdit(null);
                setActiveScreen('vehicle-form');
              }}
              onOpenSettings={() => setActiveScreen('settings')}
            />
          </>
        )}
      </View>
    );
  }

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const vehicleRecords = garage.maintenanceRecords.filter((record) => record.vehicleId === selectedVehicle.id);
  const health = buildVehicleHealth(selectedVehicle, garage.maintenanceRecords, garage.alertPreferences);

  async function handleReportProblem(input: {
    description: string;
    workshopId?: string;
    photoUri?: string;
    audioUri?: string;
  }) {
    await addMaintenance({
      vehicleId: selectedVehicle.id,
      workshopId: input.workshopId,
      categoryId: 'general',
      title: input.description.slice(0, 80),
      serviceDate: new Date().toISOString().slice(0, 10),
      mileage: selectedVehicle.currentMileage,
      costCents: 0,
      notes: input.description,
      parts: {},
      checklist: [{ label: 'Tipo', value: 'Relato de problema' }],
      photoUri: input.photoUri,
      audioUri: input.audioUri,
    });
    hasPendingLocalMutationRef.current = true;
  }

  async function handleAddVehicle(draft: VehicleDraft) {
    await addVehicle(draft);
    hasPendingLocalMutationRef.current = true;
    setActiveScreen('dashboard');
  }

  async function handleUpdateVehicle(draft: VehicleDraft) {
    if (!vehicleToEdit) return;
    await updateVehicle(vehicleToEdit.id, draft);
    hasPendingLocalMutationRef.current = true;
    setVehicleToEdit(null);
    setActiveScreen('dashboard');
  }

  async function handleDeleteVehicle() {
    if (!vehicleToEdit) return;
    const deletedId = vehicleToEdit.id;
    setVehicleToEdit(null);
    setActiveScreen('dashboard');
    await deleteVehicle(deletedId);
    hasPendingLocalMutationRef.current = true;
  }

  async function handleQuickKmUpdate(newMileage: number) {
    await updateVehicle(selectedVehicle.id, {
      type: selectedVehicle.type,
      name: selectedVehicle.name,
      brand: selectedVehicle.brand,
      model: selectedVehicle.model,
      year: selectedVehicle.year,
      plate: selectedVehicle.plate,
      currentMileage: newMileage,
      weeklyMileage: selectedVehicle.weeklyMileage,
      vin: selectedVehicle.vin,
    });
    hasPendingLocalMutationRef.current = true;
  }

  async function handleAddMaintenance(input: MaintenanceDraft): Promise<string> {
    const id = await addMaintenance(input);
    hasPendingLocalMutationRef.current = true;
    return id;
  }

  async function handleUpdateAlertPreference(preference: AlertPreference) {
    await updateAlertPreference(preference);
    hasPendingLocalMutationRef.current = true;
  }

  async function handleAddWorkshopReview(workshopId: string, rating: number, comment: string) {
    await addWorkshopReview(workshopId, rating, comment);
    hasPendingLocalMutationRef.current = true;
  }

  function renderScreen() {
    switch (activeScreen) {
      case 'health':
        return <HealthScreen vehicle={selectedVehicle} records={vehicleRecords} preferences={garage.alertPreferences} />;
      case 'new':
        return (
          <MaintenanceFormScreen
            vehicle={selectedVehicle}
            workshops={garage.workshops}
            onSave={handleAddMaintenance}
            onSaved={() => setActiveScreen('history')}
          />
        );
      case 'report':
        return (
          <ReportProblemScreen
            vehicle={selectedVehicle}
            workshops={garage.workshops}
            onSubmit={handleReportProblem}
          />
        );
      case 'history':
        return <HistoryScreen vehicle={selectedVehicle} records={vehicleRecords} workshops={garage.workshops} />;
      case 'map':
        return (
          <ServiceMapScreen
            records={vehicleRecords}
            workshops={garage.workshops}
            reviews={garage.workshopReviews}
            onReview={handleAddWorkshopReview}
          />
        );
      case 'trip':
        return <PreTripScreen vehicle={selectedVehicle} records={vehicleRecords} preferences={garage.alertPreferences} />;
      case 'alerts':
        return <AlertsScreen vehicle={selectedVehicle} preferences={garage.alertPreferences} onUpdate={handleUpdateAlertPreference} />;
      case 'settings':
        return <SettingsScreen snapshot={garage} applyRemoteData={applyRemoteData} />;
      case 'vehicle-form':
        return (
          <VehicleFormScreen
            initialValues={vehicleToEdit ?? undefined}
            onSave={vehicleToEdit ? handleUpdateVehicle : handleAddVehicle}
            onDelete={vehicleToEdit ? handleDeleteVehicle : undefined}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardScreen
            userName={displayUserName}
            vehicle={selectedVehicle}
            records={vehicleRecords}
            totalSpentCents={health.totalSpentCents}
            nextItem={health.nextCriticalItem}
            onNavigate={setActiveScreen}
            onUpdateMileage={handleQuickKmUpdate}
          />
        );
    }
  }

  const isModalScreen = activeScreen === 'settings' || activeScreen === 'vehicle-form';
  const modalTitle = activeScreen === 'settings' ? 'Configurações' : vehicleToEdit ? 'Editar veículo' : 'Novo veículo';

  return (
    <View style={styles.appShell}>
      {isModalScreen ? (
        <ModalHeader title={modalTitle} onBack={() => { setVehicleToEdit(null); setActiveScreen('dashboard'); }} />
      ) : (
        <>
          <AppHeader userName={displayUserName} vehicleCount={vehicles.length} onOpenSettings={() => setActiveScreen('settings')} />
          <VehicleSwitcher
            vehicles={vehicles}
            selectedVehicleId={selectedVehicle.id}
            onSelect={setSelectedVehicleId}
            onAdd={() => { setVehicleToEdit(null); setActiveScreen('vehicle-form'); }}
            onEdit={(v) => { setVehicleToEdit(v); setActiveScreen('vehicle-form'); }}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabRailScroll}
            contentContainerStyle={styles.tabRail}
          >
            {tabs.map(({ key, label, Icon }) => {
              const selected = activeScreen === key;
              return (
                <Pressable key={key} style={[styles.tab, selected && styles.tabSelected]} onPress={() => setActiveScreen(key)}>
                  <Icon size={17} color={selected ? colors.paper : colors.graphite} strokeWidth={2.2} />
                  <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
      {renderScreen()}
    </View>
  );
}

function ModalHeader({ title, onBack }: Readonly<{ title: string; onBack: () => void }>) {
  return (
    <View style={styles.modalHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onBack}
        style={({ pressed }) => [styles.modalBackButton, pressed && { opacity: 0.6 }]}
      >
        <ArrowLeft size={20} color={colors.ink} />
      </Pressable>
      <Text style={styles.modalHeaderTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function StateScreen({ title, description, tone = 'default' }: Readonly<{ title: string; description: string; tone?: 'default' | 'danger' }>) {
  return (
    <View style={styles.stateScreen}>
      <View style={[styles.stateIcon, tone === 'danger' && styles.stateIconDanger]}>
        {tone === 'danger' ? <AlertTriangle color={colors.danger} size={30} /> : <Wrench color={colors.pine} size={30} />}
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
    </View>
  );
}

function EmptyGarageScreen({
  onCreateVehicle,
  onOpenSettings,
}: Readonly<{
  onCreateVehicle: () => void;
  onOpenSettings: () => void;
}>) {
  return (
    <View style={styles.stateScreen}>
      <View style={styles.stateIcon}>
        <Car color={colors.pine} size={30} />
      </View>
      <Text style={styles.stateTitle}>Sua garagem está vazia</Text>
      <Text style={styles.stateDescription}>
        Você removeu todos os veículos. Crie um novo para continuar registrando manutenções.
      </Text>
      <View style={styles.emptyStateActions}>
        <PrimaryButton Icon={PlusCircle} label="Criar veículo" onPress={onCreateVehicle} />
        <Pressable style={styles.secondaryButton} onPress={onOpenSettings}>
          <SettingsIcon color={colors.pine} size={16} />
          <Text style={styles.secondaryButtonText}>Abrir configurações</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AppHeader({ userName, vehicleCount, onOpenSettings }: Readonly<{ userName: string; vehicleCount: number; onOpenSettings: () => void }>) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{greeting}, {userName.split(' ')[0]}</Text>
        <Text style={styles.headerTitle}>Manutenção inteligente</Text>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.headerBadge}>
          <Car size={18} color={colors.pine} />
          <Text style={styles.headerBadgeText}>{vehicleCount}</Text>
        </View>
        <Pressable
          accessibilityLabel="Abrir configurações"
          accessibilityRole="button"
          onPress={onOpenSettings}
          style={({ pressed }) => [styles.headerIconButton, pressed && { opacity: 0.6 }]}
        >
          <SettingsIcon size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

function VehicleSwitcher({
  vehicles,
  selectedVehicleId,
  onSelect,
  onAdd,
  onEdit,
}: Readonly<{
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (vehicle: Vehicle) => void;
}>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.vehicleSwitcher}
      contentContainerStyle={styles.vehicleRail}
    >
      {vehicles.map((vehicle) => {
        const selected = vehicle.id === selectedVehicleId;
        const Icon = vehicle.type === 'motorcycle' ? Bike : Car;
        return (
          <Pressable key={vehicle.id} style={[styles.vehicleChip, selected && styles.vehicleChipSelected]} onPress={() => onSelect(vehicle.id)}>
            <Icon size={19} color={selected ? colors.paper : colors.pine} />
            <View style={styles.vehicleChipBody}>
              <Text numberOfLines={1} style={[styles.vehicleChipTitle, selected && styles.vehicleChipTitleSelected]}>{vehicle.name}</Text>
              <Text style={[styles.vehicleChipMeta, selected && styles.vehicleChipMetaSelected]}>{vehicle.currentMileage.toLocaleString('pt-BR')} km</Text>
            </View>
            {selected ? (
              <Pressable
                hitSlop={8}
                onPress={() => onEdit(vehicle)}
                style={styles.vehicleEditButton}
                accessibilityLabel={`Editar ${vehicle.name}`}
              >
                <Pencil size={13} color={colors.paper} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}
      {/* Botão de adicionar novo veículo */}
      <Pressable style={styles.vehicleAddChip} onPress={onAdd} accessibilityLabel="Adicionar veículo">
        <PlusCircle size={19} color={colors.pine} />
        <Text style={styles.vehicleAddText}>Novo</Text>
      </Pressable>
    </ScrollView>
  );
}

function DashboardScreen({
  userName,
  vehicle,
  records,
  totalSpentCents,
  nextItem,
  onNavigate,
  onUpdateMileage,
}: Readonly<{
  userName: string;
  vehicle: Vehicle;
  records: MaintenanceRecord[];
  totalSpentCents: number;
  nextItem?: ReturnType<typeof buildVehicleHealth>['nextCriticalItem'];
  onNavigate: (screen: ScreenKey) => void;
  onUpdateMileage: (km: number) => Promise<void>;
}>) {
  const lastRecord = records[0];
  const [showKmModal, setShowKmModal] = useState(false);
  const [kmDraft, setKmDraft] = useState(String(vehicle.currentMileage));
  const [savingKm, setSavingKm] = useState(false);

  async function submitKmUpdate() {
    const parsed = Number(kmDraft.replace(/\D/g, ''));
    if (!parsed || parsed < vehicle.currentMileage) {
      Alert.alert('Quilometragem inválida', `Informe um valor ≥ ${vehicle.currentMileage.toLocaleString('pt-BR')} km.`);
      return;
    }
    setSavingKm(true);
    try {
      await onUpdateMileage(parsed);
      setShowKmModal(false);
    } finally {
      setSavingKm(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Modal visible={showKmModal} transparent animationType="fade" onRequestClose={() => setShowKmModal(false)}>
        <Pressable style={styles.kmModalOverlay} onPress={() => setShowKmModal(false)}>
          <Pressable style={styles.kmModalBox} onPress={() => {}}>
            <Text style={styles.sectionHeading}>Atualizar quilometragem</Text>
            <Text style={styles.cardText}>Informe a leitura atual do odômetro.</Text>
            <TextInput
              style={styles.input}
              value={kmDraft}
              onChangeText={setKmDraft}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              placeholder={String(vehicle.currentMileage)}
              placeholderTextColor="#9A9387"
            />
            <PrimaryButton
              Icon={Save}
              label={savingKm ? 'Salvando...' : 'Salvar'}
              onPress={submitKmUpdate}
              disabled={savingKm}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.heroPanel}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Olá, {userName.split(' ')[0]}</Text>
          <Text style={styles.heroTitle}>{vehicle.name}</Text>
          <Text style={styles.heroMeta}>{vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.plate}</Text>
        </View>
        <HealthPill status={nextItem?.status ?? 'ok'} label={nextItem?.categoryLabel ?? 'Tudo em dia'} />
      </View>

      <View style={styles.statGrid}>
        <StatCard
          Icon={Gauge}
          label="Quilometragem"
          value={`${vehicle.currentMileage.toLocaleString('pt-BR')} km`}
          onPress={() => { setKmDraft(String(vehicle.currentMileage)); setShowKmModal(true); }}
        />
        <StatCard Icon={CircleDollarSign} label="Total gasto" value={formatCurrency(totalSpentCents)} />
        <StatCard Icon={CalendarClock} label="Último serviço" value={formatShortDate(lastRecord?.serviceDate)} />
        <StatCard Icon={Bell} label="Próximo alerta" value={nextItem?.categoryLabel ?? 'Sem alerta'} />
      </View>

      <View style={styles.actionGrid}>
        <ActionCard Icon={Wrench} title="Registrar manutenção" description="Salve data, oficina, custo, mídia e local." onPress={() => onNavigate('new')} />
        <ActionCard Icon={Route} title="Modo pré-viagem" description="Cruze vencimentos com a distância planejada." onPress={() => onNavigate('trip')} />
      </View>

      <SectionTitle title="Prioridade técnica" action="ver saúde" onPress={() => onNavigate('health')} />
      <View style={styles.priorityCard}>
        <View style={styles.priorityIcon}>{statusIcon(nextItem?.status ?? 'ok')}</View>
        <View style={styles.flexOne}>
          <Text style={styles.cardTitle}>{nextItem?.categoryLabel ?? 'Nenhum item crítico'}</Text>
          <Text style={styles.cardText}>{nextItem?.reason ?? 'As categorias acompanhadas estão dentro das regras configuradas.'}</Text>
          {nextItem?.nextDueDate ? <Text style={styles.cardMeta}>Vence em {formatShortDate(nextItem.nextDueDate)} ou {nextItem.nextDueMileage?.toLocaleString('pt-BR')} km</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}

function HealthScreen({ vehicle, records, preferences }: Readonly<{ vehicle: Vehicle; records: MaintenanceRecord[]; preferences: AlertPreference[] }>) {
  const health = buildVehicleHealth(vehicle, records, preferences);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHero Icon={ShieldCheck} title="Painel de saúde" description="Status por categoria considerando tempo, quilometragem média semanal e antecedência configurada." />
      <View style={styles.statGrid}>
        <StatCard Icon={CircleDollarSign} label="Investimento" value={formatCurrency(health.totalSpentCents)} />
        <StatCard Icon={CalendarClock} label="Última revisão" value={formatShortDate(health.lastServiceDate)} />
      </View>
      <CostByCategoryChart records={records} vehicleType={vehicle.type} />
      {health.items.map((item) => (
        <View key={item.categoryId} style={styles.healthRow}>
          <View style={styles.healthRowHeader}>
            <Text style={styles.cardTitle}>{item.categoryLabel}</Text>
            <HealthPill status={item.status} label={statusLabel(item.status)} />
          </View>
          <Text style={styles.cardText}>{item.reason}</Text>
          <View style={styles.healthMetaRow}>
            <Text style={styles.cardMeta}>Último: {formatShortDate(item.lastServiceDate)} • {item.lastMileage?.toLocaleString('pt-BR') ?? '0'} km</Text>
            <Text style={styles.cardMeta}>Próximo: {formatShortDate(item.nextDueDate)} • {item.nextDueMileage?.toLocaleString('pt-BR') ?? '-'} km</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function MaintenanceFormScreen({
  vehicle,
  workshops,
  onSave,
  onSaved,
}: Readonly<{
  vehicle: Vehicle;
  workshops: Workshop[];
  onSave: (input: MaintenanceDraft) => Promise<string>;
  onSaved: () => void;
}>) {
  const categories = getCategoriesForVehicle(vehicle.type);
  const [categoryId, setCategoryId] = useState<MaintenanceCategoryId>(categories[0].id);
  const [title, setTitle] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState(String(vehicle.currentMileage));
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [workshopId, setWorkshopId] = useState<string | undefined>(workshops[0]?.id);
  const [brand, setBrand] = useState('');
  const [specification, setSpecification] = useState('');
  const [checklistValues, setChecklistValues] = useState<Record<string, string>>({});
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const checklist = buildDynamicChecklist(categoryId, vehicle.type);
  const selectedWorkshop = workshops.find((workshop) => workshop.id === workshopId);
  let audioButtonLabel = 'Gravar áudio';

  if (recorderState.isRecording) {
    audioButtonLabel = 'Parar áudio';
  } else if (audioUri) {
    audioButtonLabel = 'Áudio salvo';
  }

  useEffect(() => {
    if (!categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
    setMileage(String(vehicle.currentMileage));
  }, [vehicle.id]);

  async function handleLocation() {
    const result = await getCurrentGarageLocation();
    if (result.error) {
      Alert.alert('Localização', result.error);
      return;
    }
    if (result.data) {
      setLocation({ latitude: result.data.latitude, longitude: result.data.longitude });
    }
  }

  async function handleCamera() {
    const result = await captureServicePhoto();
    if (result.error) {
      Alert.alert('Camera', result.error);
      return;
    }
    if (result.data) {
      setPhotoUri(result.data);
    }
  }

  async function handleGallery() {
    const result = await pickServicePhoto();
    if (result.error) {
      Alert.alert('Galeria', result.error);
      return;
    }
    if (result.data) {
      setPhotoUri(result.data);
    }
  }

  async function handleAudio() {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      setAudioUri(audioRecorder.uri ?? undefined);
      return;
    }

    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Audio', 'Permissão de microfone negada.');
      return;
    }

    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  }

  async function submit() {
    const mileageNumber = Number(mileage.replace(/\D/g, ''));
    const costNumber = Number(cost.replace(',', '.'));

    if (!Number.isFinite(mileageNumber) || mileageNumber <= 0) {
      Alert.alert('Quilometragem', 'Informe uma quilometragem válida.');
      return;
    }

    if (!Number.isFinite(costNumber) || costNumber < 0) {
      Alert.alert('Custo', 'Informe um custo válido.');
      return;
    }

    const fallbackLocation = selectedWorkshop
      ? { latitude: selectedWorkshop.latitude, longitude: selectedWorkshop.longitude }
      : undefined;
    const category = getCategoryDefinition(categoryId);

    setIsSaving(true);
    try {
      await onSave({
        vehicleId: vehicle.id,
        workshopId,
        categoryId,
        title: title.trim() || category.label,
        serviceDate,
        mileage: mileageNumber,
        costCents: Math.round(costNumber * 100),
        notes,
        latitude: location?.latitude ?? fallbackLocation?.latitude,
        longitude: location?.longitude ?? fallbackLocation?.longitude,
        parts: { brand, specification },
        checklist: checklist.map((label) => ({ label, value: checklistValues[label] ?? '' })),
        photoUri,
        audioUri,
      });
      await scheduleImmediateReviewNotification('Manutenção registrada', `${vehicle.name}: ${category.label} salvo no histórico.`);
      Alert.alert('Registro salvo', 'A manutenção foi adicionada ao histórico técnico do veículo.');
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexOne}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <SectionHero Icon={Wrench} title="Registrar nova manutenção" description="O registro salva histórico, checklist contextual, oficina, local, foto e áudio em uma única entrada." />

        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.chipGrid}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.selectChip, categoryId === category.id && styles.selectChipSelected]}
              onPress={() => setCategoryId(category.id)}
            >
              <Text style={[styles.selectChipText, categoryId === category.id && styles.selectChipTextSelected]}>{category.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.formCard}>
          <Input label="Título do serviço" value={title} onChangeText={setTitle} placeholder={getCategoryDefinition(categoryId).label} />
          <View style={styles.inputRow}>
            <Input label="Data" value={serviceDate} onChangeText={setServiceDate} placeholder="2026-05-25" />
            <Input label="Km" value={mileage} onChangeText={setMileage} keyboardType="numeric" />
          </View>
          <Input label="Custo (R$)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="489,90" />
          <Input label="Marca da peça/produto" value={brand} onChangeText={setBrand} placeholder="Mobil, Bosch, Honda..." />
          <Input label="Especificação" value={specification} onChangeText={setSpecification} placeholder="5W30 API SP, DOT 4..." />
          <Input label="Notas técnicas" value={notes} onChangeText={setNotes} placeholder="Sintomas, diagnóstico, garantia, observações" multiline />
        </View>

        <Text style={styles.fieldLabel}>Oficina</Text>
        <View style={styles.chipGrid}>
          {workshops.map((workshop) => (
            <Pressable
              key={workshop.id}
              style={[styles.selectChip, workshopId === workshop.id && styles.selectChipSelected]}
              onPress={() => setWorkshopId(workshop.id)}
            >
              <Text style={[styles.selectChipText, workshopId === workshop.id && styles.selectChipTextSelected]}>{workshop.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Checklist contextual</Text>
          {checklist.map((item) => (
            <Input
              key={item}
              label={item}
              value={checklistValues[item] ?? ''}
              onChangeText={(value) => setChecklistValues((current) => ({ ...current, [item]: value }))}
              placeholder="Informe o valor ou marque OK"
            />
          ))}
        </View>

        <View style={styles.nativeGrid}>
          <NativeButton Icon={MapPin} label={location ? 'GPS salvo' : 'Usar GPS'} onPress={handleLocation} active={Boolean(location)} />
          <NativeButton Icon={Camera} label="Câmera" onPress={handleCamera} active={Boolean(photoUri)} />
          <NativeButton Icon={ImagePlus} label="Galeria" onPress={handleGallery} active={Boolean(photoUri)} />
          <NativeButton Icon={Mic} label={audioButtonLabel} onPress={handleAudio} active={recorderState.isRecording || Boolean(audioUri)} />
        </View>

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}
        {audioUri ? <Text style={styles.cardMeta}>Áudio anexado: {audioUri.split('/').pop()}</Text> : null}

        <PrimaryButton Icon={Save} label={isSaving ? 'Salvando...' : 'Salvar manutenção'} onPress={submit} disabled={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HistoryScreen({ vehicle, records, workshops }: Readonly<{ vehicle: Vehicle; records: MaintenanceRecord[]; workshops: Workshop[] }>) {
  const categories = getCategoriesForVehicle(vehicle.type);
  const [filter, setFilter] = useState<MaintenanceCategoryId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const lowerSearch = search.toLowerCase().trim();
  const filteredRecords = records.filter((record) => {
    const matchCat = filter === 'all' || record.categoryId === filter;
    const matchSearch =
      !lowerSearch ||
      record.title.toLowerCase().includes(lowerSearch) ||
      record.notes.toLowerCase().includes(lowerSearch) ||
      (record.parts.brand ?? '').toLowerCase().includes(lowerSearch);
    return matchCat && matchSearch;
  });

  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHero Icon={History} title="Histórico técnico" description="Consulte registros por categoria, pesquise por texto e veja evidências e mídias anexadas." />

      <View style={styles.searchBox}>
        <Search size={16} color={colors.graphite} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título, notas ou marca..."
          placeholderTextColor="#9A9387"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Limpar busca">
            <X size={16} color={colors.graphite} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
        <Pressable style={[styles.selectChip, filter === 'all' && styles.selectChipSelected]} onPress={() => setFilter('all')}>
          <Text style={[styles.selectChipText, filter === 'all' && styles.selectChipTextSelected]}>Todos</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable key={category.id} style={[styles.selectChip, filter === category.id && styles.selectChipSelected]} onPress={() => setFilter(category.id)}>
            <Text style={[styles.selectChipText, filter === category.id && styles.selectChipTextSelected]}>{category.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filteredRecords.length === 0 ? (
        <Text style={styles.cardMeta}>Nenhum registro encontrado.</Text>
      ) : null}

      {filteredRecords.map((record) => (
        <Pressable key={record.id} style={styles.historyItem} onPress={() => setSelectedRecordId(record.id)}>
          <View style={styles.historyDateBox}>
            <Text style={styles.historyDateDay}>{record.serviceDate.slice(8, 10)}</Text>
            <Text style={styles.historyDateMonth}>{record.serviceDate.slice(5, 7)}</Text>
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.cardTitle}>{record.title}</Text>
            <Text style={styles.cardMeta}>{getCategoryDefinition(record.categoryId).label} • {record.mileage.toLocaleString('pt-BR')} km • {formatCurrency(record.costCents)}</Text>
          </View>
          {(record.photoUri || record.audioUri) ? (
            <View style={styles.historyAttachBadge}>
              {record.photoUri ? <Camera size={13} color={colors.graphite} /> : null}
              {record.audioUri ? <Mic size={13} color={colors.graphite} /> : null}
            </View>
          ) : null}
        </Pressable>
      ))}

      {selectedRecord ? (
        <RecordDetailModal
          record={selectedRecord}
          workshop={workshops.find((w) => w.id === selectedRecord.workshopId)}
          onClose={() => setSelectedRecordId(null)}
        />
      ) : null}
    </ScrollView>
  );
}

function ServiceMapScreen({
  records,
  workshops,
  reviews,
  onReview,
}: Readonly<{
  records: MaintenanceRecord[];
  workshops: Workshop[];
  reviews: WorkshopReview[];
  onReview: (workshopId: string, rating: number, comment: string) => Promise<void>;
}>) {
  const locatedRecords = records.filter((record) => typeof record.latitude === 'number' && typeof record.longitude === 'number');
  const firstLocation = locatedRecords[0] ?? workshops[0];
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState('5');
  const [workshopId, setWorkshopId] = useState(workshops[0]?.id ?? '');
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [nearby, setNearby] = useState<NearbyWorkshop[]>([]);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  async function handleSearchNearby() {
    setSearching(true);
    try {
      const loc = await getCurrentGarageLocation();
      if (loc.error || !loc.data) {
        Alert.alert('Localização', loc.error ?? 'Não foi possível obter sua posição.');
        return;
      }
      setUserLocation({ latitude: loc.data.latitude, longitude: loc.data.longitude });
      const list = await searchNearbyWorkshops(loc.data.latitude, loc.data.longitude, 5_000);
      setNearby(list);
      if (list.length === 0) {
        Alert.alert('Sem resultados', 'Nenhuma oficina encontrada num raio de 5 km. Tente novamente em outra área.');
      }
    } catch (err) {
      Alert.alert('Falha na busca', err instanceof Error ? err.message : 'Erro de rede ao consultar OpenStreetMap.');
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (mapReady) {
      return;
    }
    const timeout = setTimeout(() => {
      if (!mapReady) {
        setMapFailed(true);
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [mapReady]);

  function openInExternalMaps(lat: number, lng: number, label?: string) {
    const query = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:${lat},${lng}?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    }) as string;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  }

  async function submitReview() {
    if (!workshopId) {
      return;
    }
    await onReview(workshopId, Math.min(5, Math.max(1, Number(rating) || 5)), reviewText || 'Atendimento registrado pelo GarageTrack.');
    setReviewText('');
    Alert.alert('Avaliação salva', 'Sua avaliação da oficina foi registrada localmente.');
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHero Icon={MapPin} title="Mapa de serviços" description="Veja onde cada manutenção foi feita e mantenha uma memória geográfica das oficinas confiáveis." />
      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          loadingEnabled
          loadingIndicatorColor={colors.pine}
          loadingBackgroundColor={colors.paper}
          onMapReady={() => setMapReady(true)}
          initialRegion={{
            latitude: firstLocation?.latitude ?? -5.7945,
            longitude: firstLocation?.longitude ?? -35.211,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
        >
          {workshops.map((workshop) => (
            <Marker key={workshop.id} coordinate={{ latitude: workshop.latitude, longitude: workshop.longitude }} title={workshop.name} description={workshop.address} pinColor={colors.pine} />
          ))}
          {locatedRecords.map((record) => (
            <Marker
              key={record.id}
              coordinate={{ latitude: record.latitude ?? 0, longitude: record.longitude ?? 0 }}
              title={record.title}
              description={formatShortDate(record.serviceDate)}
              pinColor={colors.amber}
            />
          ))}
          {nearby.map((shop) => (
            <Marker
              key={shop.osmId}
              coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
              title={shop.name}
              description={shop.address ?? `${shop.distanceMeters} m`}
              pinColor="#FF6F3C"
            />
          ))}
          {userLocation ? (
            <Marker
              coordinate={userLocation}
              title="Você está aqui"
              pinColor={colors.sky}
            />
          ) : null}
        </MapView>
        {mapReady ? null : (
          <View style={styles.mapOverlay} pointerEvents={mapFailed ? 'box-none' : 'none'}>
            {mapFailed ? (
              <View style={styles.mapFailedBox}>
                <Text style={styles.mapOverlayText}>
                  {'O mapa do Google não carregou. Verifique se a API "Maps SDK for Android" está ativa no Google Cloud Console.'}
                </Text>
                <Pressable style={styles.mapFallbackButton} onPress={() => openInExternalMaps(firstLocation?.latitude ?? -5.7945, firstLocation?.longitude ?? -35.211)}>
                  <Navigation size={15} color={colors.pine} />
                  <Text style={styles.mapFallbackButtonText}>Abrir no app de mapas</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <ActivityIndicator color={colors.pine} />
                <Text style={styles.mapOverlayText}>Carregando mapa...</Text>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.formCard}>
        <View style={styles.healthRowHeader}>
          <Text style={styles.cardTitle}>Buscar oficinas próximas</Text>
          {nearby.length > 0 ? <Text style={styles.cardMeta}>{nearby.length} resultados</Text> : null}
        </View>
        <Text style={styles.cardText}>Consulta em tempo real ao OpenStreetMap num raio de 5 km da sua posição atual.</Text>
        <PrimaryButton
          Icon={Search}
          label={searching ? 'Buscando...' : 'Buscar agora'}
          onPress={handleSearchNearby}
          disabled={searching}
        />
      </View>

      {nearby.length > 0 ? (
        <>
          <Text style={styles.sectionHeading}>Oficinas próximas (OSM)</Text>
          {nearby.slice(0, 10).map((shop) => (
            <View key={shop.osmId} style={styles.workshopCard}>
              <View style={styles.healthRowHeader}>
                <Text style={styles.cardTitle}>{shop.name}</Text>
                <Text style={styles.cardMeta}>{(shop.distanceMeters / 1000).toFixed(1)} km</Text>
              </View>
              {shop.address ? <Text style={styles.cardText}>{shop.address}</Text> : null}
              {shop.phone ? <Text style={styles.cardMeta}>{shop.phone}</Text> : null}
              <Pressable
                onPress={() => openInExternalMaps(shop.latitude, shop.longitude, shop.name)}
                style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              >
                <Navigation color={colors.pine} size={16} />
                <Text style={styles.linkButtonText}>Abrir no app de mapas</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionHeading}>Oficinas próximas e histórico</Text>
      {workshops.map((workshop) => {
        const workshopReviews = reviews.filter((review) => review.workshopId === workshop.id);
        return (
          <View key={workshop.id} style={styles.workshopCard}>
            <View style={styles.healthRowHeader}>
              <Text style={styles.cardTitle}>{workshop.name}</Text>
              <Text style={styles.rating}>{workshop.rating.toFixed(1)} ★</Text>
            </View>
            <Text style={styles.cardText}>{workshop.address}</Text>
            <Text style={styles.cardMeta}>{workshop.phone} • {workshop.services.map((service) => getCategoryDefinition(service).label).join(', ')}</Text>
            {workshopReviews.map((review) => (
              <Text key={review.id} style={styles.reviewText}>“{review.comment}”</Text>
            ))}
            <Pressable
              onPress={() => openInExternalMaps(workshop.latitude, workshop.longitude, workshop.name)}
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            >
              <Navigation color={colors.pine} size={16} />
              <Text style={styles.linkButtonText}>Abrir no app de mapas</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Avaliar oficina</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
          {workshops.map((workshop) => (
            <Pressable key={workshop.id} style={[styles.selectChip, workshopId === workshop.id && styles.selectChipSelected]} onPress={() => setWorkshopId(workshop.id)}>
              <Text style={[styles.selectChipText, workshopId === workshop.id && styles.selectChipTextSelected]}>{workshop.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Input label="Nota" value={rating} onChangeText={setRating} keyboardType="numeric" />
        <Input label="Comentário" value={reviewText} onChangeText={setReviewText} multiline placeholder="Atendimento, prazo, qualidade técnica..." />
        <PrimaryButton Icon={Save} label="Salvar avaliação" onPress={submitReview} />
      </View>
    </ScrollView>
  );
}

function PreTripScreen({ vehicle, records, preferences }: Readonly<{ vehicle: Vehicle; records: MaintenanceRecord[]; preferences: AlertPreference[] }>) {
  const [tripKm, setTripKm] = useState('360');
  const checklist = buildPreTripChecklist(vehicle, records, preferences, Number(tripKm.replace(/\D/g, '')) || 0);
  const blocked = checklist.some((item) => item.status === 'overdue');

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHero Icon={Route} title="Modo pré-viagem" description="Informe a distância estimada e o app cruza a viagem com vencimentos por data e quilometragem." />
      <View style={styles.formCard}>
        <Input label="Distância prevista (km)" value={tripKm} onChangeText={setTripKm} keyboardType="numeric" />
        <View style={[styles.tripBanner, blocked ? styles.tripBannerDanger : styles.tripBannerOk]}>
          {blocked ? <AlertTriangle color={colors.danger} size={20} /> : <Navigation color={colors.pine} size={20} />}
          <Text style={styles.tripBannerText}>{blocked ? 'Resolva itens vencidos antes de sair.' : 'Viagem liberada com os cuidados indicados abaixo.'}</Text>
        </View>
      </View>

      {checklist.map((item) => (
        <View key={item.categoryId} style={styles.healthRow}>
          <View style={styles.healthRowHeader}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <HealthPill status={item.status} label={statusLabel(item.status)} />
          </View>
          <Text style={styles.cardText}>{item.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function AlertsScreen({
  vehicle,
  preferences,
  onUpdate,
}: Readonly<{
  vehicle: Vehicle;
  preferences: AlertPreference[];
  onUpdate: (preference: AlertPreference) => Promise<void>;
}>) {
  const vehiclePreferences = preferences.filter((preference) => preference.vehicleId === vehicle.id);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHero Icon={Bell} title="Configurar alertas" description="Cada categoria tem intervalo técnico e antecedência própria em dias e quilômetros." />
      {vehiclePreferences.map((preference) => {
        const category = getCategoryDefinition(preference.categoryId);
        return (
          <View key={preference.id} style={styles.alertCard}>
            <View style={styles.healthRowHeader}>
              <View>
                <Text style={styles.cardTitle}>{category.label}</Text>
                <Text style={styles.cardMeta}>{category.description}</Text>
              </View>
              <Switch
                value={preference.enabled}
                onValueChange={(enabled) => void onUpdate({ ...preference, enabled })}
                trackColor={{ true: colors.mint, false: colors.border }}
                thumbColor={preference.enabled ? colors.pine : colors.graphite}
              />
            </View>
            <View style={styles.alertGrid}>
              <Stepper label="Intervalo dias" value={preference.intervalDays} step={15} onChange={(intervalDays) => onUpdate({ ...preference, intervalDays })} />
              <Stepper label="Intervalo km" value={preference.intervalKm} step={500} onChange={(intervalKm) => onUpdate({ ...preference, intervalKm })} />
              <Stepper label="Avisar dias" value={preference.leadDays} step={5} onChange={(leadDays) => onUpdate({ ...preference, leadDays })} />
              <Stepper label="Avisar km" value={preference.leadKm} step={100} onChange={(leadKm) => onUpdate({ ...preference, leadKm })} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function Stepper({ label, value, step, onChange }: Readonly<{ label: string; value: number; step: number; onChange: (value: number) => Promise<void> }>) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperButton} onPress={() => void onChange(Math.max(step, value - step))}>
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value.toLocaleString('pt-BR')}</Text>
        <Pressable style={styles.stepperButton} onPress={() => void onChange(value + step)}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionHero({ Icon, title, description }: Readonly<{ Icon: IconComponent; title: string; description: string }>) {
  return (
    <View style={styles.sectionHero}>
      <View style={styles.sectionHeroIcon}><Icon size={22} color={colors.paper} /></View>
      <View style={styles.flexOne}>
        <Text style={styles.sectionHeroTitle}>{title}</Text>
        <Text style={styles.sectionHeroText}>{description}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, action, onPress }: Readonly<{ title: string; action?: string; onPress?: () => void }>) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StatCard({ Icon, label, value, onPress }: Readonly<{ Icon: IconComponent; label: string; value: string; onPress?: () => void }>) {
  if (onPress) {
    return (
      <Pressable style={[styles.statCard, styles.statCardPressable]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. Toque para editar`}>
        <View style={styles.statCardTop}>
          <Icon size={19} color={colors.sky} />
          <Pencil size={11} color={colors.graphiteLight} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.statCard}>
      <Icon size={19} color={colors.sky} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ActionCard({ Icon, title, description, onPress }: Readonly<{ Icon: IconComponent; title: string; description: string; onPress: () => void }>) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}><Icon size={20} color={colors.paper} /></View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{description}</Text>
    </Pressable>
  );
}

function NativeButton({ Icon, label, onPress, active }: Readonly<{ Icon: IconComponent; label: string; onPress: () => void; active?: boolean }>) {
  return (
    <Pressable style={[styles.nativeButton, active && styles.nativeButtonActive]} onPress={onPress}>
      <Icon size={18} color={active ? colors.paper : colors.pine} />
      <Text style={[styles.nativeButtonText, active && styles.nativeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RecordDetailModal({
  record,
  workshop,
  onClose,
}: Readonly<{
  record: MaintenanceRecord;
  workshop?: Workshop;
  onClose: () => void;
}>) {
  const player = useAudioPlayer(record.audioUri ?? null);
  const playerStatus = useAudioPlayerStatus(player);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.detailModal}>
        <View style={styles.detailModalHeader}>
          <Text style={styles.detailModalTitle} numberOfLines={2}>{record.title}</Text>
          <Pressable onPress={onClose} style={styles.detailModalClose} accessibilityLabel="Fechar detalhes">
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.detailModalContent}>
          <View style={styles.statGrid}>
            <StatCard Icon={CalendarClock} label="Data" value={formatShortDate(record.serviceDate)} />
            <StatCard Icon={Gauge} label="Quilometragem" value={`${record.mileage.toLocaleString('pt-BR')} km`} />
            <StatCard Icon={CircleDollarSign} label="Custo" value={formatCurrency(record.costCents)} />
            <StatCard Icon={ShieldCheck} label="Categoria" value={getCategoryDefinition(record.categoryId).label} />
          </View>

          {record.notes ? (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Notas técnicas</Text>
              <Text style={styles.cardText}>{record.notes}</Text>
            </View>
          ) : null}

          {(record.parts.brand || record.parts.specification) ? (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Peça / Produto</Text>
              {record.parts.brand ? <Text style={styles.cardText}>Marca: {record.parts.brand}</Text> : null}
              {record.parts.specification ? <Text style={styles.cardText}>Especificação: {record.parts.specification}</Text> : null}
            </View>
          ) : null}

          {workshop ? (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Oficina</Text>
              <Text style={styles.cardText}>{workshop.name}</Text>
              {workshop.address ? <Text style={styles.cardMeta}>{workshop.address}</Text> : null}
            </View>
          ) : null}

          {record.checklist.length > 0 ? (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Checklist</Text>
              {record.checklist.map((item) => (
                <View key={`${record.id}-ck-${item.label}`} style={styles.checklistLine}>
                  <CheckCircle2 size={15} color={colors.pine} />
                  <Text style={styles.cardText}>{item.label}: {item.value || 'OK'}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {record.audioUri ? (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Áudio anexado</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => { playerStatus.playing ? player.pause() : player.play(); }}
              >
                {playerStatus.playing
                  ? <StopIcon size={18} color={colors.paper} />
                  : <Play size={18} color={colors.paper} />}
                <Text style={styles.primaryButtonText}>
                  {playerStatus.playing ? 'Pausar' : 'Reproduzir áudio'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {record.photoUri ? (
            <Image source={{ uri: record.photoUri }} style={styles.photoPreview} />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function CostByCategoryChart({
  records,
  vehicleType,
}: Readonly<{ records: MaintenanceRecord[]; vehicleType: Vehicle['type'] }>) {
  const categories = getCategoriesForVehicle(vehicleType);
  const totals = categories
    .map((cat) => ({
      id: cat.id,
      label: cat.label,
      total: records.filter((r) => r.categoryId === cat.id).reduce((sum, r) => sum + r.costCents, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  if (totals.length === 0) {
    return (
      <View style={styles.formCard}>
        <View style={styles.healthRowHeader}>
          <Text style={styles.cardTitle}>Gastos por categoria</Text>
          <TrendingUp size={18} color={colors.sky} />
        </View>
        <Text style={styles.cardText}>Nenhum registro com custo informado ainda.</Text>
      </View>
    );
  }

  const max = totals[0].total;

  return (
    <View style={styles.formCard}>
      <View style={styles.healthRowHeader}>
        <Text style={styles.cardTitle}>Gastos por categoria</Text>
        <TrendingUp size={18} color={colors.sky} />
      </View>
      {totals.map((cat) => (
        <View key={cat.id} style={styles.costBarRow}>
          <View style={styles.costBarLabelRow}>
            <Text style={styles.costBarLabel}>{cat.label}</Text>
            <Text style={styles.costBarValue}>{formatCurrency(cat.total)}</Text>
          </View>
          <View style={styles.costBarTrack}>
            <View style={[styles.costBarFill, { width: `${Math.round((cat.total / max) * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function PrimaryButton({ Icon, label, onPress, disabled }: Readonly<{ Icon: IconComponent; label: string; onPress: () => void; disabled?: boolean }>) {
  return (
    <Pressable style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]} onPress={onPress} disabled={disabled}>
      <Icon size={19} color={colors.paper} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: Readonly<{
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9387"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function HealthPill({ status, label }: Readonly<{ status: HealthStatus; label: string }>) {
  return (
    <View style={[styles.healthPill, status === 'attention' && styles.healthPillAttention, status === 'overdue' && styles.healthPillOverdue]}>
      <Text style={[styles.healthPillText, status === 'overdue' && styles.healthPillTextOverdue]}>{label}</Text>
    </View>
  );
}

function statusLabel(status: HealthStatus) {
  if (status === 'overdue') {
    return 'Vencido';
  }
  if (status === 'attention') {
    return 'Atenção';
  }
  return 'OK';
}

function statusIcon(status: HealthStatus) {
  if (status === 'overdue') {
    return <AlertTriangle color={colors.danger} size={22} />;
  }
  if (status === 'attention') {
    return <CalendarClock color={colors.warning} size={22} />;
  }
  return <CheckCircle2 color={colors.success} size={22} />;
}

const baseFont = Platform.select({ ios: 'Avenir Next', android: 'sans-serif-condensed', default: 'sans-serif' });

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: spacing.lg,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.pine,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: baseFont,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  headerBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: colors.pine,
    fontWeight: '900',
  },
  headerActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUser: {
    color: colors.graphite,
    fontSize: 12,
    maxWidth: 86,
  },
  vehicleRail: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  vehicleSwitcher: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 80,
  },
  tabRailScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 60,
  },
  vehicleChip: {
    minWidth: 178,
    maxWidth: 240,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vehicleChipBody: {
    flex: 1,
    minWidth: 0,
  },
  vehicleChipSelected: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  vehicleChipTitle: {
    color: colors.ink,
    fontWeight: '800',
  },
  vehicleChipTitleSelected: {
    color: colors.paper,
  },
  vehicleChipMeta: {
    color: colors.graphite,
    fontSize: 12,
  },
  vehicleChipMetaSelected: {
    color: colors.mint,
  },
  vehicleEditButton: {
    padding: 4,
    marginLeft: 2,
    opacity: 0.85,
  },
  vehicleAddChip: {
    height: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.pine,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 70,
  },
  vehicleAddText: {
    color: colors.pine,
    fontSize: 12,
    fontWeight: '700',
  },
  tabRail: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabText: {
    color: colors.graphite,
    fontWeight: '800',
    fontSize: 12,
  },
  tabTextSelected: {
    color: colors.paper,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: 56,
    gap: spacing.lg,
  },
  heroPanel: {
    minHeight: 160,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    justifyContent: 'space-between',
    ...shadow,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.paper,
    fontSize: 30,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  heroMeta: {
    color: '#D5E7DB',
    fontSize: 13,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47.8%',
    minHeight: 112,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  statLabel: {
    color: colors.graphite,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.sky,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  sectionAction: {
    color: colors.pine,
    fontWeight: '900',
  },
  sectionHero: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeroTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  sectionHeroText: {
    color: colors.graphite,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  cardText: {
    color: colors.graphite,
    lineHeight: 20,
  },
  cardMeta: {
    color: colors.graphite,
    fontSize: 12,
    lineHeight: 18,
  },
  healthRow: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  healthRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  healthMetaRow: {
    gap: spacing.xs,
  },
  healthPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.mint,
  },
  healthPillAttention: {
    backgroundColor: '#F7E3C2',
  },
  healthPillOverdue: {
    backgroundColor: '#F8D7D2',
  },
  healthPillText: {
    color: colors.pine,
    fontWeight: '900',
    fontSize: 12,
  },
  healthPillTextOverdue: {
    color: colors.danger,
  },
  formCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadowSoft,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  inputGroup: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: layout.inputHeight,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  chipRail: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  selectChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  selectChipSelected: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  selectChipText: {
    color: colors.graphite,
    fontWeight: '800',
  },
  selectChipTextSelected: {
    color: colors.paper,
  },
  nativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nativeButton: {
    width: '47.8%',
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nativeButtonActive: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  nativeButtonText: {
    color: colors.pine,
    fontWeight: '900',
  },
  nativeButtonTextActive: {
    color: colors.paper,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.paper,
    fontWeight: '900',
    fontSize: 15,
  },
  photoPreview: {
    width: '100%',
    height: 210,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  historyItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  historyItemSelected: {
    borderColor: colors.pine,
  },
  historyDateBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDateDay: {
    color: colors.pine,
    fontWeight: '900',
    fontSize: 18,
  },
  historyDateMonth: {
    color: colors.pine,
    fontWeight: '800',
    fontSize: 11,
  },
  detailCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  checklistLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapCard: {
    height: 320,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    ...shadowSoft,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  mapOverlayText: {
    flex: 1,
    color: colors.graphite,
    fontSize: 13,
  },
  mapFailedBox: {
    flex: 1,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  mapFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.pine,
  },
  mapFallbackButtonText: {
    color: colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mint,
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: colors.pine,
    fontWeight: '800',
    fontSize: 13,
  },
  workshopCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadowSoft,
  },
  rating: {
    color: colors.amber,
    fontWeight: '900',
  },
  reviewText: {
    color: colors.ink,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // ── km update modal ──
  kmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 34, 29, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  kmModalBox: {
    width: '100%',
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow,
  },
  // ── record detail modal ──
  detailModal: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
    gap: spacing.md,
  },
  detailModalTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: baseFont,
  },
  detailModalClose: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalContent: {
    padding: spacing.lg,
    paddingBottom: 56,
    gap: spacing.lg,
  },
  // ── cost chart ──
  costBarRow: {
    gap: spacing.xs,
  },
  costBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costBarLabel: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  costBarValue: {
    color: colors.graphite,
    fontSize: 12,
    fontWeight: '700',
  },
  costBarTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  costBarFill: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.pine,
  },
  // ── history search ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: layout.inputHeight,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  historyAttachBadge: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  // ── stat card pressable ──
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardPressable: {
    borderStyle: 'dashed',
    borderColor: colors.pine,
  },
  tripBanner: {
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tripBannerOk: {
    backgroundColor: colors.mint,
  },
  tripBannerDanger: {
    backgroundColor: '#F8D7D2',
  },
  tripBannerText: {
    color: colors.ink,
    fontWeight: '800',
    flex: 1,
  },
  alertCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  alertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stepper: {
    width: '47.8%',
    gap: spacing.xs,
  },
  stepperLabel: {
    color: colors.graphite,
    fontSize: 12,
    fontWeight: '800',
  },
  stepperControls: {
    minHeight: 42,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFCF5',
  },
  stepperButton: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: colors.pine,
    fontSize: 20,
    fontWeight: '900',
  },
  stepperValue: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 12,
  },
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream,
    gap: spacing.md,
  },
  stateIcon: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIconDanger: {
    backgroundColor: '#F8D7D2',
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateDescription: {
    color: colors.graphite,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyStateActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.pine,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.pine,
    fontWeight: '900',
    fontSize: 15,
  },
});