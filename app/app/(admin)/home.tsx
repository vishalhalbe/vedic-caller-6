import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

export default function AdminHome() {
  const { profile } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Admin — {profile?.name}</Text>
      <Text style={styles.subtitle}>Platform management</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
