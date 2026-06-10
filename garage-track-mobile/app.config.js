// app.config.js — lê chaves do .env (não versionado) e injeta no app.
// Por padrão app.json estático seria carregado, mas existindo este arquivo, ele toma prioridade.
require('dotenv').config();

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || '';
const googleOAuthWebClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID || '';
const googleOAuthAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID || '';

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: 'GarageTrack',
  slug: 'garage-track-mobile',
  version: '1.4.1',
  scheme: 'garagetrack',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.garagetrack.app',
  },
  android: {
    package: 'com.garagetrack.app',
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: googleMapsKey
      ? { googleMaps: { apiKey: googleMapsKey } }
      : undefined,
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    ['expo-sqlite', { enableFTS: true, useSQLCipher: false }],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O GarageTrack usa sua localização para registrar onde o serviço foi realizado e encontrar oficinas próximas.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'O GarageTrack acessa suas fotos para anexar evidências de manutenção.',
        cameraPermission:
          'O GarageTrack usa a câmera para fotografar veículos, peças e problemas mecânicos.',
        microphonePermission: false,
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'O GarageTrack usa o microfone para gravar descrições de problemas mecânicos.',
        recordAudioAndroid: true,
        enableBackgroundRecording: false,
        enableBackgroundPlayback: false,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#1F6F4A',
        defaultChannel: 'maintenance',
      },
    ],
    'expo-secure-store',
    'expo-sharing',
    'expo-web-browser',
  ],
  extra: {
    eas: {
      projectId: 'c66f16e0-5404-4371-af3e-572b538fbca2',
    },
  },
});
