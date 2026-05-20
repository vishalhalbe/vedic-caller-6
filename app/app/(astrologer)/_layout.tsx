import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { colors } from '../../lib/theme';

export default function AstrologerLayout() {
  const { profile } = useAuth();

  useEffect(() => {
    if (profile && profile.role !== 'astrologer') {
      router.replace('/auth/login');
    }
  }, [profile]);

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.bg },
    }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
