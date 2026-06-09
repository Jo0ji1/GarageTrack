import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface NativeResult<T> {
  data?: T;
  error?: string;
}

// expo-notifications foi removido do Expo Go a partir do SDK 53 para push remoto.
// Carregamos a lib de forma defensiva: se o import falhar (Expo Go), as funcoes
// de notificacao viram no-op, sem quebrar o app.
let Notifications: typeof import('expo-notifications') | null = null;
let notificationsHandlerConfigured = false;

function loadNotifications(): typeof import('expo-notifications') | null {
  if (Notifications || notificationsHandlerConfigured) {
    return Notifications;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationsHandlerConfigured = true;
    return Notifications;
  } catch {
    notificationsHandlerConfigured = true;
    return null;
  }
}

export async function getCurrentGarageLocation(): Promise<NativeResult<DeviceLocation>> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Permissão de localização negada.' };
  }

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 });
  const position = lastKnown ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

  return {
    data: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    },
  };
}

export async function captureServicePhoto(): Promise<NativeResult<string | null>> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Permissão de camera negada.' };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  });

  return { data: result.canceled ? null : result.assets[0]?.uri ?? null };
}

export async function pickServicePhoto(): Promise<NativeResult<string | null>> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Permissão de galeria negada.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  });

  return { data: result.canceled ? null : result.assets[0]?.uri ?? null };
}

export async function ensureMaintenanceNotificationChannel() {
  const Notif = loadNotifications();
  if (!Notif) return;
  if (Platform.OS === 'android') {
    await Notif.setNotificationChannelAsync('maintenance', {
      name: 'Lembretes de manutenção',
      importance: Notif.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1F6F4A',
    });
  }
}

export async function scheduleHealthNotifications(
  items: Array<{ label: string; status: string; nextDueDate?: string }>,
): Promise<void> {
  const Notif = loadNotifications();
  if (!Notif) return;

  await ensureMaintenanceNotificationChannel();
  const permission = await Notif.requestPermissionsAsync();
  if (!permission.granted) return;

  // Cancela notificações de manutenção anteriores para não duplicar
  const scheduled = await Notif.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => (n.content.data as Record<string, unknown>)?.['type'] === 'maintenance-alert')
      .map((n) => Notif!.cancelScheduledNotificationAsync(n.identifier)),
  );

  for (const item of items) {
    if (item.status === 'overdue') {
      await Notif.scheduleNotificationAsync({
        content: {
          title: `Manutenção vencida: ${item.label}`,
          body: 'Este item precisa de atenção imediata.',
          data: { screen: 'health', type: 'maintenance-alert' },
        },
        trigger: null,
      });
    } else if (item.status === 'attention' && item.nextDueDate) {
      const triggerDate = new Date(`${item.nextDueDate}T09:00:00`);
      triggerDate.setDate(triggerDate.getDate() - 1);
      if (triggerDate > new Date()) {
        await Notif.scheduleNotificationAsync({
          content: {
            title: `${item.label} vence amanhã`,
            body: 'Agende a revisão para não perder o prazo.',
            data: { screen: 'health', type: 'maintenance-alert' },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trigger: { type: 'date', date: triggerDate } as any,
        });
      }
    }
  }
}

export async function scheduleImmediateReviewNotification(title: string, body: string) {
  const Notif = loadNotifications();
  if (!Notif) {
    // Expo Go SDK 53+ nao suporta notificacoes. Silencioso: o registro ja foi salvo.
    return { data: null };
  }
  await ensureMaintenanceNotificationChannel();
  const permission = await Notif.requestPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Permissão de notificacao negada.' };
  }

  const id = await Notif.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: 'health' },
    },
    trigger: null,
  });

  return { data: id };
}