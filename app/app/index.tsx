import { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { colors } from '../lib/theme';

function useProtectedRoute() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = segments[0] === 'auth';

    if (!session) {
      if (!isAuthRoute) router.replace('/auth/login');
      return;
    }

    if (!profile?.role) {
      if (segments[0] !== 'auth') router.replace('/auth/role-select');
      return;
    }

    if (isAuthRoute) {
      const route = profile.role === 'admin'
        ? '/(admin)/home'
        : profile.role === 'astrologer'
        ? '/(astrologer)/home'
        : '/(user)/home';
      router.replace(route);
    }
  }, [session, profile, isLoading]);
}

export default function IndexScreen() {
  useProtectedRoute();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.brand}>VedicCaller</Text>
        <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={styles.splash}>
      <Text style={styles.brand}>VedicCaller</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
  },
});
