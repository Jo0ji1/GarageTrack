export type VehicleType = 'car' | 'motorcycle';

export type MaintenanceCategoryId =
  | 'oil'
  | 'brakes'
  | 'tires'
  | 'battery'
  | 'cooling'
  | 'inspection'
  | 'chain'
  | 'general';

export type HealthStatus = 'ok' | 'attention' | 'overdue';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  type: VehicleType;
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentMileage: number;
  weeklyMileage: number;
  vin?: string;
  createdAt: string;
}

export interface Workshop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  phone: string;
  services: MaintenanceCategoryId[];
}

export interface WorkshopReview {
  id: string;
  workshopId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MaintenanceChecklistEntry {
  label: string;
  value: string;
}

export interface MaintenanceParts {
  brand?: string;
  specification?: string;
  serialNumber?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  workshopId?: string;
  categoryId: MaintenanceCategoryId;
  title: string;
  serviceDate: string;
  mileage: number;
  costCents: number;
  notes: string;
  latitude?: number;
  longitude?: number;
  parts: MaintenanceParts;
  checklist: MaintenanceChecklistEntry[];
  photoUri?: string;
  audioUri?: string;
  createdAt: string;
}

export interface AlertPreference {
  id: string;
  vehicleId: string;
  categoryId: MaintenanceCategoryId;
  intervalDays: number;
  intervalKm: number;
  leadDays: number;
  leadKm: number;
  enabled: boolean;
}

export interface MaintenanceCategoryDefinition {
  id: MaintenanceCategoryId;
  label: string;
  description: string;
  appliesTo: VehicleType[];
  defaultIntervalDays: number;
  defaultIntervalKm: number;
  defaultLeadDays: number;
  defaultLeadKm: number;
}

export interface HealthItem {
  categoryId: MaintenanceCategoryId;
  categoryLabel: string;
  status: HealthStatus;
  lastServiceDate?: string;
  lastMileage?: number;
  nextDueDate?: string;
  nextDueMileage?: number;
  daysRemaining?: number;
  kmRemaining?: number;
  reason: string;
}

export interface VehicleHealthSummary {
  vehicleId: string;
  totalSpentCents: number;
  lastServiceDate?: string;
  nextCriticalItem?: HealthItem;
  items: HealthItem[];
}

export interface PreTripChecklistItem {
  categoryId: MaintenanceCategoryId;
  label: string;
  status: HealthStatus;
  message: string;
}

export interface MaintenanceDraft {
  vehicleId: string;
  workshopId?: string;
  categoryId: MaintenanceCategoryId;
  title: string;
  serviceDate: string;
  mileage: number;
  costCents: number;
  notes: string;
  latitude?: number;
  longitude?: number;
  parts: MaintenanceParts;
  checklist: MaintenanceChecklistEntry[];
  photoUri?: string;
  audioUri?: string;
}

export interface GarageSnapshot {
  user: UserProfile;
  vehicles: Vehicle[];
  workshops: Workshop[];
  workshopReviews: WorkshopReview[];
  maintenanceRecords: MaintenanceRecord[];
  alertPreferences: AlertPreference[];
}

export const maintenanceCategories: MaintenanceCategoryDefinition[] = [
  {
    id: 'oil',
    label: 'Oleo e filtros',
    description: 'Troca de oleo, filtro de oleo, filtro de ar e especificacao usada.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 180,
    defaultIntervalKm: 10000,
    defaultLeadDays: 20,
    defaultLeadKm: 700,
  },
  {
    id: 'brakes',
    label: 'Freios',
    description: 'Pastilhas, discos, fluido, lonas e sangria.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 365,
    defaultIntervalKm: 15000,
    defaultLeadDays: 30,
    defaultLeadKm: 1000,
  },
  {
    id: 'tires',
    label: 'Pneus',
    description: 'Rodizio, calibragem, alinhamento, balanceamento e troca.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 180,
    defaultIntervalKm: 10000,
    defaultLeadDays: 20,
    defaultLeadKm: 800,
  },
  {
    id: 'battery',
    label: 'Bateria',
    description: 'Teste de carga, troca e limpeza de polos.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 730,
    defaultIntervalKm: 40000,
    defaultLeadDays: 45,
    defaultLeadKm: 2000,
  },
  {
    id: 'cooling',
    label: 'Arrefecimento',
    description: 'Fluido, mangueiras, bomba, valvula e radiador.',
    appliesTo: ['car'],
    defaultIntervalDays: 365,
    defaultIntervalKm: 20000,
    defaultLeadDays: 30,
    defaultLeadKm: 1200,
  },
  {
    id: 'inspection',
    label: 'Revisao geral',
    description: 'Checklist preventivo com itens eletricos, suspensao e seguranca.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 365,
    defaultIntervalKm: 12000,
    defaultLeadDays: 30,
    defaultLeadKm: 1000,
  },
  {
    id: 'chain',
    label: 'Relacao e corrente',
    description: 'Corrente, coroa, pinhao, lubrificacao e ajuste.',
    appliesTo: ['motorcycle'],
    defaultIntervalDays: 90,
    defaultIntervalKm: 1500,
    defaultLeadDays: 10,
    defaultLeadKm: 250,
  },
  {
    id: 'general',
    label: 'Servico avulso',
    description: 'Servicos corretivos, diagnosticos e observacoes livres.',
    appliesTo: ['car', 'motorcycle'],
    defaultIntervalDays: 365,
    defaultIntervalKm: 12000,
    defaultLeadDays: 20,
    defaultLeadKm: 800,
  },
];

export function getCategoryDefinition(categoryId: MaintenanceCategoryId) {
  return maintenanceCategories.find((category) => category.id === categoryId) ?? maintenanceCategories[0];
}

export function getCategoriesForVehicle(type: VehicleType) {
  return maintenanceCategories.filter((category) => category.appliesTo.includes(type));
}