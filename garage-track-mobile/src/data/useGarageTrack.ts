import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import {
  AlertPreference,
  GarageSnapshot,
  MaintenanceCategoryId,
  MaintenanceChecklistEntry,
  MaintenanceDraft,
  MaintenanceParts,
  MaintenanceRecord,
  UserProfile,
  Vehicle,
  VehicleType,
  Workshop,
  WorkshopReview,
} from '../domain/models';

interface UserRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface VehicleRow {
  id: string;
  user_id: string;
  type: VehicleType;
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  current_mileage: number;
  weekly_mileage: number;
  vin: string | null;
  created_at: string;
}

interface WorkshopRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  phone: string;
  services_json: string;
}

interface MaintenanceRecordRow {
  id: string;
  vehicle_id: string;
  workshop_id: string | null;
  category_id: MaintenanceCategoryId;
  title: string;
  service_date: string;
  mileage: number;
  cost_cents: number;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  parts_json: string;
  checklist_json: string;
  photo_uri: string | null;
  audio_uri: string | null;
  created_at: string;
}

interface AlertPreferenceRow {
  id: string;
  vehicle_id: string;
  category_id: MaintenanceCategoryId;
  interval_days: number;
  interval_km: number;
  lead_days: number;
  lead_km: number;
  enabled: number;
}

interface WorkshopReviewRow {
  id: string;
  workshop_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapUser(row: UserRow): UserProfile {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

function mapVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year,
    plate: row.plate,
    currentMileage: row.current_mileage,
    weeklyMileage: row.weekly_mileage,
    vin: row.vin ?? undefined,
    createdAt: row.created_at,
  };
}

function mapWorkshop(row: WorkshopRow): Workshop {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
    phone: row.phone,
    services: parseJson<MaintenanceCategoryId[]>(row.services_json, []),
  };
}

function mapMaintenanceRecord(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    workshopId: row.workshop_id ?? undefined,
    categoryId: row.category_id,
    title: row.title,
    serviceDate: row.service_date,
    mileage: row.mileage,
    costCents: row.cost_cents,
    notes: row.notes,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    parts: parseJson<MaintenanceParts>(row.parts_json, {}),
    checklist: parseJson<MaintenanceChecklistEntry[]>(row.checklist_json, []),
    photoUri: row.photo_uri ?? undefined,
    audioUri: row.audio_uri ?? undefined,
    createdAt: row.created_at,
  };
}

function mapAlertPreference(row: AlertPreferenceRow): AlertPreference {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    categoryId: row.category_id,
    intervalDays: row.interval_days,
    intervalKm: row.interval_km,
    leadDays: row.lead_days,
    leadKm: row.lead_km,
    enabled: row.enabled === 1,
  };
}

function mapWorkshopReview(row: WorkshopReviewRow): WorkshopReview {
  return {
    id: row.id,
    workshopId: row.workshop_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export function useGarageTrack() {
  const db = useSQLiteContext();
  const [snapshot, setSnapshot] = useState<GarageSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);

    try {
      const userRow = await db.getFirstAsync<UserRow>('SELECT * FROM users LIMIT 1');
      if (!userRow) {
        throw new Error('Usuário inicial nao encontrado no banco local.');
      }

      const vehicleRows = await db.getAllAsync<VehicleRow>('SELECT * FROM vehicles ORDER BY created_at ASC');
      const workshopRows = await db.getAllAsync<WorkshopRow>('SELECT * FROM workshops ORDER BY rating DESC');
      const maintenanceRows = await db.getAllAsync<MaintenanceRecordRow>(
        'SELECT * FROM maintenance_records ORDER BY service_date DESC, created_at DESC',
      );
      const alertRows = await db.getAllAsync<AlertPreferenceRow>('SELECT * FROM alert_preferences ORDER BY category_id ASC');
      const reviewRows = await db.getAllAsync<WorkshopReviewRow>('SELECT * FROM workshop_reviews ORDER BY created_at DESC');

      setSnapshot({
        user: mapUser(userRow),
        vehicles: vehicleRows.map(mapVehicle),
        workshops: workshopRows.map(mapWorkshop),
        maintenanceRecords: maintenanceRows.map(mapMaintenanceRecord),
        alertPreferences: alertRows.map(mapAlertPreference),
        workshopReviews: reviewRows.map(mapWorkshopReview),
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Erro inesperado ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }

  async function addMaintenance(input: MaintenanceDraft) {
    const id = `mnt-${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Atomicidade: insere o registro e atualiza a quilometragem na mesma
    // transação. Se qualquer passo falhar, ambos são revertidos.
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO maintenance_records
        (id, vehicle_id, workshop_id, category_id, title, service_date, mileage, cost_cents, notes, latitude, longitude, parts_json, checklist_json, photo_uri, audio_uri, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.vehicleId,
          input.workshopId ?? null,
          input.categoryId,
          input.title,
          input.serviceDate,
          input.mileage,
          input.costCents,
          input.notes,
          input.latitude ?? null,
          input.longitude ?? null,
          JSON.stringify(input.parts),
          JSON.stringify(input.checklist),
          input.photoUri ?? null,
          input.audioUri ?? null,
          createdAt,
        ],
      );

      await db.runAsync(
        'UPDATE vehicles SET current_mileage = MAX(current_mileage, ?) WHERE id = ?',
        [input.mileage, input.vehicleId],
      );
    });

    await refresh();
    return id;
  }

  async function updateAlertPreference(preference: AlertPreference) {
    await db.runAsync(
      `UPDATE alert_preferences
       SET interval_days = ?, interval_km = ?, lead_days = ?, lead_km = ?, enabled = ?
       WHERE id = ?`,
      [
        preference.intervalDays,
        preference.intervalKm,
        preference.leadDays,
        preference.leadKm,
        preference.enabled ? 1 : 0,
        preference.id,
      ],
    );
    await refresh();
  }

  async function addWorkshopReview(workshopId: string, rating: number, comment: string) {
    const userId = snapshot?.user.id ?? 'user-demo';
    const id = `rev-${Date.now()}`;
    await db.runAsync(
      'INSERT INTO workshop_reviews (id, workshop_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, workshopId, userId, rating, comment, new Date().toISOString()],
    );
    await refresh();
  }

  useEffect(() => {
    void refresh();
  }, [db]);

  return {
    snapshot,
    isLoading,
    error,
    refresh,
    addMaintenance,
    updateAlertPreference,
    addWorkshopReview,
  };
}