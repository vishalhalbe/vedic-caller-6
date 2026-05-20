import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

export default function AdminHome() {
  const { profile, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Admin — {profile?.name}</Text>
      <Text style={styles.subtitle}>Platform management</Text>
      <TouchableOpacity style={styles.logout} onPress={signOut} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
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
  logout: {
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  logoutText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
