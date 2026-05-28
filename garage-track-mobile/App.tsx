import { Suspense } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { DATABASE_NAME, migrateDatabase } from './src/data/database';
import { GarageTrackApp } from './src/presentation/GarageTrackApp';
import { ThemeProvider, useTheme } from './src/presentation/ThemeContext';
import { AuthProvider } from './src/presentation/AuthContext';
import { CloudProvider } from './src/presentation/CloudContext';
import { AuthGate } from './src/presentation/AuthGate';
import { ErrorBoundary } from './src/presentation/ErrorBoundary';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CloudProvider>
            <ThemedShell />
          </CloudProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedShell() {
  const { palette, mode } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "left", "right"]}>
      <ErrorBoundary>
        <AuthGate>
          <Suspense fallback={<BootSplash />}>
            <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
              <GarageTrackApp />
            </SQLiteProvider>
          </Suspense>
        </AuthGate>
      </ErrorBoundary>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

function BootSplash() {
  const { palette } = useTheme();
  return (
    <View style={[styles.bootSplash, { backgroundColor: palette.background }]}>
      <Text style={[styles.bootTitle, { color: palette.ink }]}>GarageTrack</Text>
      <Text style={[styles.bootText, { color: palette.graphite }]}>Preparando sua garagem inteligente...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bootSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bootTitle: {
    fontSize: 30,
    fontWeight: '900',
  },
  bootText: {
    marginTop: 8,
  },
});
