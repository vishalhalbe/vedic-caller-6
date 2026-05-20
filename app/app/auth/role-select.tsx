import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

type Role = 'user' | 'astrologer';

export default function RoleSelectScreen() {
  const { setProfileRole } = useAuth();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    const err = await setProfileRole(selected);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're almost in!</Text>
      <Text style={styles.subtitle}>Choose your path</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.card, selected === 'user' && styles.cardSelected]}
        onPress={() => setSelected('user')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🌟</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>I'm a Seeker</Text>
          <Text style={styles.cardDesc}>Find guidance from trusted astrologers</Text>
        </View>
        <View style={[styles.radio, selected === 'user' && styles.radioSelected]}>
          {selected === 'user' && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected === 'astrologer' && styles.cardSelected]}
        onPress={() => setSelected('astrologer')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🔮</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>I'm an Astrologer</Text>
          <Text style={styles.cardDesc}>Offer your services and grow your practice</Text>
        </View>
        <View style={[styles.radio, selected === 'astrologer' && styles.radioSelected]}>
          {selected === 'astrologer' && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          (!selected || loading) && styles.buttonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selected || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#FFFDF5',
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioSelected: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
  },
  button: {
    height: 50,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
