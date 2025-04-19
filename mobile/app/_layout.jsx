import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Toaster } from 'sonner-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { View } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { useRouter } from 'expo-router';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { checkAuth, user, token } = useAuthStore();

  const onLayoutRootView = useCallback(async () => {
    if (user !== undefined) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [user]);

  useEffect(() => {
    async function prepare() {
      try {
        // Perform authentication check
        await checkAuth();
      } catch (e) {
        console.warn('Failed to check authentication:', e);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Only run navigation after auth status is known (user is no longer undefined)
    if (user === undefined) return;

    // Navigate based on authentication status
    if (user && token) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)');
    }
  }, [user, token]);

  if (user === undefined) {
    // We're still waiting for auth check to complete
    // Return an empty view that still supports layout events
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* Keep splash screen visible */}
      </View>
    );
  }

  // Auth check is complete, render the app
  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <SafeScreen>
          <Slot />
          <StatusBar style='dark' />
          <Toaster position='top-center' richColors />
        </SafeScreen>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
