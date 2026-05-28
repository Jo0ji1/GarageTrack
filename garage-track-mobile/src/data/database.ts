import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'garage-track.db';

const DATABASE_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
`);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('car', 'motorcycle')),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT NOT NULL,
  current_mileage INTEGER NOT NULL,
  weekly_mileage INTEGER NOT NULL,
  vin TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  rating REAL NOT NULL,
  phone TEXT NOT NULL,
  services_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  workshop_id TEXT REFERENCES workshops(id) ON DELETE SET NULL,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  service_date TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL,
  notes TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  parts_json TEXT NOT NULL,
  checklist_json TEXT NOT NULL,
  photo_uri TEXT,
  audio_uri TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  interval_days INTEGER NOT NULL,
  interval_km INTEGER NOT NULL,
  lead_days INTEGER NOT NULL,
  lead_km INTEGER NOT NULL,
  enabled INTEGER NOT NULL CHECK(enabled IN (0, 1)),
  UNIQUE(vehicle_id, category_id)
);

CREATE TABLE IF NOT EXISTS workshop_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance_records(vehicle_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_category ON maintenance_records(category_id);
CREATE INDEX IF NOT EXISTS idx_alert_vehicle_category ON alert_preferences(vehicle_id, category_id);
`);

  await seedDatabase(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}

async function seedDatabase(db: SQLiteDatabase) {
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT OR IGNORE INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)',
    ['user-demo', 'Mariana Alves', 'mariana@garagetrack.app', now],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO vehicles
    (id, user_id, type, name, brand, model, year, plate, current_mileage, weekly_mileage, vin, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['veh-civic', 'user-demo', 'car', 'Civic Touring', 'Honda', 'Civic Touring 1.5T', 2020, 'BRA2E19', 68420, 320, '9BWZZZ377VT004251', now],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO vehicles
    (id, user_id, type, name, brand, model, year, plate, current_mileage, weekly_mileage, vin, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['veh-cb500', 'user-demo', 'motorcycle', 'CB 500F', 'Honda', 'CB 500F ABS', 2022, 'MOT8A22', 18640, 180, null, now],
  );

  const workshops = [
    ['wrk-norte', 'Oficina Norte Prime', 'Av. das Torres, 1840 - Natal/RN', -5.8112, -35.2065, 4.8, '(84) 3333-1100', '["oil","brakes","inspection","cooling"]'],
    ['wrk-moto', 'MotoCare Ponta Negra', 'Rua Praia de Ponta Negra, 420 - Natal/RN', -5.8745, -35.1807, 4.7, '(84) 98888-2200', '["oil","brakes","tires","chain"]'],
    ['wrk-fast', 'Auto Fast Center', 'Av. Prudente de Morais, 2399 - Natal/RN', -5.805, -35.2098, 4.5, '(84) 3222-0101', '["tires","battery","inspection","general"]'],
  ] as const;

  for (const workshop of workshops) {
    await db.runAsync(
      'INSERT OR IGNORE INTO workshops (id, name, address, latitude, longitude, rating, phone, services_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [...workshop],
    );
  }

  const records = [
    ['mnt-001', 'veh-civic', 'wrk-norte', 'oil', 'Troca de oleo 5W30 e filtros', '2026-01-18', 62100, 48990, 'Oleo sintetico 5W30, filtro original e revisao visual sem vazamentos.', -5.8112, -35.2065, '{"brand":"Mobil","specification":"Super 3000 5W30 API SP"}', '[{"label":"Tipo do oleo","value":"Sintetico"},{"label":"Viscosidade","value":"5W30"},{"label":"Filtro de oleo","value":"Original Honda"}]'],
    ['mnt-002', 'veh-civic', 'wrk-fast', 'tires', 'Alinhamento, balanceamento e rodizio', '2026-02-22', 64580, 26000, 'Rodizio cruzado e calibragem final em 33 PSI.', -5.805, -35.2098, '{"brand":"Michelin","specification":"Primacy 4 215/50 R17"}', '[{"label":"Calibragem","value":"33 PSI"},{"label":"Alinhamento","value":"OK"},{"label":"Balanceamento","value":"OK"}]'],
    ['mnt-003', 'veh-civic', 'wrk-norte', 'brakes', 'Pastilhas dianteiras e fluido DOT 4', '2025-11-08', 58820, 82000, 'Pastilhas dianteiras trocadas, discos medidos dentro de tolerancia.', -5.8112, -35.2065, '{"brand":"Bosch","specification":"DOT 4 + pastilhas ceramicas"}', '[{"label":"Pastilhas/lonas","value":"Dianteiras novas"},{"label":"Fluido de freio","value":"DOT 4"}]'],
    ['mnt-004', 'veh-cb500', 'wrk-moto', 'chain', 'Lubrificacao e ajuste da relacao', '2026-03-20', 17440, 9000, 'Corrente limpa, folga ajustada para 35 mm.', -5.8745, -35.1807, '{"brand":"Motul","specification":"C2 Chain Lube Road"}', '[{"label":"Folga da corrente","value":"35 mm"},{"label":"Lubrificacao","value":"Motul C2"}]'],
    ['mnt-005', 'veh-cb500', 'wrk-moto', 'oil', 'Troca de oleo 10W30', '2026-02-02', 16200, 31000, 'Oleo e filtro trocados; embreagem sem patinacao.', -5.8745, -35.1807, '{"brand":"Honda","specification":"10W30 MA"}', '[{"label":"Tipo do oleo","value":"Semissintetico"},{"label":"Filtro de oleo","value":"Original"}]'],
  ] as const;

  for (const record of records) {
    await db.runAsync(
      `INSERT OR IGNORE INTO maintenance_records
      (id, vehicle_id, workshop_id, category_id, title, service_date, mileage, cost_cents, notes, latitude, longitude, parts_json, checklist_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...record, now],
    );
  }

  const alertRows = [
    ['veh-civic', 'oil', 180, 10000, 20, 700],
    ['veh-civic', 'brakes', 365, 15000, 30, 1000],
    ['veh-civic', 'tires', 180, 10000, 20, 800],
    ['veh-civic', 'battery', 730, 40000, 45, 2000],
    ['veh-civic', 'cooling', 365, 20000, 30, 1200],
    ['veh-civic', 'inspection', 365, 12000, 30, 1000],
    ['veh-civic', 'general', 365, 12000, 20, 800],
    ['veh-cb500', 'oil', 180, 6000, 15, 500],
    ['veh-cb500', 'brakes', 365, 12000, 25, 800],
    ['veh-cb500', 'tires', 180, 9000, 20, 700],
    ['veh-cb500', 'battery', 730, 30000, 45, 1500],
    ['veh-cb500', 'inspection', 365, 10000, 30, 800],
    ['veh-cb500', 'chain', 90, 1500, 10, 250],
    ['veh-cb500', 'general', 365, 10000, 20, 700],
  ] as const;

  for (const [vehicleId, categoryId, intervalDays, intervalKm, leadDays, leadKm] of alertRows) {
    await db.runAsync(
      `INSERT OR IGNORE INTO alert_preferences
      (id, vehicle_id, category_id, interval_days, interval_km, lead_days, lead_km, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [`alert-${vehicleId}-${categoryId}`, vehicleId, categoryId, intervalDays, intervalKm, leadDays, leadKm],
    );
  }

  await db.runAsync(
    'INSERT OR IGNORE INTO workshop_reviews (id, workshop_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['rev-001', 'wrk-norte', 'user-demo', 5, 'Atendimento tecnico, explicou as pecas usadas e registrou tudo com nota.', now],
  );
}