import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const protectedRoots = new Set(['checkout', 'dashboard', 'pos']);
    const isProtectedRoute = protectedRoots.has(String(segments[0] || ''));

    if (!session && isProtectedRoute) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ presentation: 'modal', title: 'Product Detail' }} />
      <Stack.Screen name="farmers/index" options={{ title: 'Farmers' }} />
      <Stack.Screen name="farmers/[id]" options={{ title: 'Farmer Store' }} />
      <Stack.Screen name="about" options={{ title: 'About Kirsof' }} />
      <Stack.Screen name="dashboard/index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="dashboard/farmer" options={{ title: 'Farmer Dashboard' }} />
      <Stack.Screen name="dashboard/admin" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Checkout' }} />
      <Stack.Screen name="pos" options={{ presentation: 'modal', title: 'POS Terminal' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <InitialLayout />
          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
