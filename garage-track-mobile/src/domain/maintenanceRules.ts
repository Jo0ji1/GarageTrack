import {
  AlertPreference,
  HealthItem,
  HealthStatus,
  MaintenanceCategoryId,
  MaintenanceRecord,
  PreTripChecklistItem,
  Vehicle,
  VehicleHealthSummary,
  getCategoriesForVehicle,
  getCategoryDefinition,
} from './models';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function daysUntil(value: string, now = new Date()) {
  const target = toDate(value).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil((target - today) / DAY_IN_MS);
}

function latestRecord(records: MaintenanceRecord[], categoryId: MaintenanceCategoryId) {
  return records
    .filter((record) => record.categoryId === categoryId)
    .sort((left, right) => right.serviceDate.localeCompare(left.serviceDate) || right.mileage - left.mileage)[0];
}

function resolvePreference(
  vehicle: Vehicle,
  preferences: AlertPreference[],
  categoryId: MaintenanceCategoryId,
) {
  const configured = preferences.find(
    (preference) => preference.vehicleId === vehicle.id && preference.categoryId === categoryId,
  );
  const fallback = getCategoryDefinition(categoryId);

  return {
    intervalDays: configured?.intervalDays ?? fallback.defaultIntervalDays,
    intervalKm: configured?.intervalKm ?? fallback.defaultIntervalKm,
    leadDays: configured?.leadDays ?? fallback.defaultLeadDays,
    leadKm: configured?.leadKm ?? fallback.defaultLeadKm,
    enabled: configured?.enabled ?? true,
  };
}

function estimateDateByMileage(vehicle: Vehicle, lastMileage: number, intervalKm: number) {
  const remainingKm = lastMileage + intervalKm - vehicle.currentMileage;
  if (remainingKm <= 0) {
    return toIsoDate(new Date());
  }

  const weeklyMileage = Math.max(vehicle.weeklyMileage, 1);
  const estimatedDays = Math.ceil((remainingKm / weeklyMileage) * 7);
  const date = new Date();
  date.setDate(date.getDate() + estimatedDays);
  return toIsoDate(date);
}

function compareCriticality(left: HealthItem, right: HealthItem) {
  const order: Record<HealthStatus, number> = { overdue: 0, attention: 1, ok: 2 };
  const statusDelta = order[left.status] - order[right.status];
  if (statusDelta !== 0) {
    return statusDelta;
  }

  const leftDays = left.daysRemaining ?? Number.POSITIVE_INFINITY;
  const rightDays = right.daysRemaining ?? Number.POSITIVE_INFINITY;
  return leftDays - rightDays;
}

export function calculateHealthItem(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  preferences: AlertPreference[],
  categoryId: MaintenanceCategoryId,
): HealthItem {
  const category = getCategoryDefinition(categoryId);
  const preference = resolvePreference(vehicle, preferences, categoryId);
  const record = latestRecord(records, categoryId);

  if (!preference.enabled) {
    return {
      categoryId,
      categoryLabel: category.label,
      status: 'ok',
      reason: 'Alertas desativados para esta categoria.',
    };
  }

  if (!record) {
    return {
      categoryId,
      categoryLabel: category.label,
      status: 'attention',
      reason: 'Sem historico registrado; recomenda-se criar uma linha de base.',
    };
  }

  const nextDueDate = addDays(record.serviceDate, preference.intervalDays);
  const nextDueMileage = record.mileage + preference.intervalKm;
  const mileageBasedDate = estimateDateByMileage(vehicle, record.mileage, preference.intervalKm);
  const dueDate = mileageBasedDate < nextDueDate ? mileageBasedDate : nextDueDate;
  const daysRemaining = daysUntil(dueDate);
  const kmRemaining = nextDueMileage - vehicle.currentMileage;

  const status: HealthStatus =
    daysRemaining <= 0 || kmRemaining <= 0
      ? 'overdue'
      : daysRemaining <= preference.leadDays || kmRemaining <= preference.leadKm
        ? 'attention'
        : 'ok';

  const reason =
    status === 'overdue'
      ? 'Vencido pelo criterio que chegou primeiro: data estimada ou quilometragem.'
      : status === 'attention'
        ? 'Dentro da janela de antecedencia configurada para alerta preventivo.'
        : 'Dentro do intervalo tecnico configurado.';

  return {
    categoryId,
    categoryLabel: category.label,
    status,
    lastServiceDate: record.serviceDate,
    lastMileage: record.mileage,
    nextDueDate: dueDate,
    nextDueMileage,
    daysRemaining,
    kmRemaining,
    reason,
  };
}

export function buildVehicleHealth(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  preferences: AlertPreference[],
): VehicleHealthSummary {
  const vehicleRecords = records.filter((record) => record.vehicleId === vehicle.id);
  const items = getCategoriesForVehicle(vehicle.type)
    .map((category) => calculateHealthItem(vehicle, vehicleRecords, preferences, category.id))
    .sort(compareCriticality);

  const totalSpentCents = vehicleRecords.reduce((total, record) => total + record.costCents, 0);
  const lastServiceDate = vehicleRecords
    .map((record) => record.serviceDate)
    .sort((left, right) => right.localeCompare(left))[0];

  return {
    vehicleId: vehicle.id,
    totalSpentCents,
    lastServiceDate,
    nextCriticalItem: items[0],
    items,
  };
}

export function buildPreTripChecklist(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  preferences: AlertPreference[],
  tripKm: number,
): PreTripChecklistItem[] {
  return buildVehicleHealth(vehicle, records, preferences).items.map((item) => {
    const willConsumeMileage = typeof item.kmRemaining === 'number' && item.kmRemaining <= tripKm + 250;
    const status: HealthStatus = item.status === 'ok' && willConsumeMileage ? 'attention' : item.status;

    return {
      categoryId: item.categoryId,
      label: item.categoryLabel,
      status,
      message:
        status === 'overdue'
          ? 'Resolva antes da viagem; ha item vencido por data ou quilometragem.'
          : status === 'attention'
            ? 'Revisar antes de sair, pois esta proximo do vencimento ou sera consumido pela viagem.'
            : 'Sem bloqueio preventivo para a distancia informada.',
    };
  });
}

export function buildDynamicChecklist(categoryId: MaintenanceCategoryId, vehicleType: Vehicle['type']) {
  const shared: Record<MaintenanceCategoryId, string[]> = {
    oil: ['Tipo do oleo', 'Viscosidade', 'Filtro de oleo', 'Filtro de ar', 'Arruela do bujao'],
    brakes: ['Pastilhas/lonas', 'Discos/tambores', 'Fluido de freio', 'Sangria realizada', 'Teste de pedal/manete'],
    tires: ['Medida do pneu', 'DOT', 'Calibragem', 'Alinhamento', 'Balanceamento'],
    battery: ['Tensao em repouso', 'Teste de carga', 'Limpeza dos polos', 'Data de garantia'],
    cooling: ['Fluido aplicado', 'Proporcao aditivo/agua', 'Mangueiras', 'Valvula termostatica', 'Radiador'],
    inspection: ['Iluminacao', 'Suspensao', 'Direcao', 'Vazamentos', 'Scanner/diagnostico'],
    chain: ['Folga da corrente', 'Lubrificacao', 'Estado da coroa', 'Estado do pinhao', 'Alinhamento da roda'],
    general: ['Sintoma observado', 'Diagnostico', 'Peca substituida', 'Garantia do servico'],
  };

  const checklist = shared[categoryId] ?? shared.general;
  if (vehicleType === 'motorcycle' && categoryId === 'brakes') {
    return [...checklist, 'Regulagem do manete/pedal'];
  }
  return checklist;
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatShortDate(value?: string) {
  if (!value) {
    return 'Sem registro';
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(toDate(value));
}