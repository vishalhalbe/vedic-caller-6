import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { BrandHeader } from '../../components/BrandHeader';
import { GoldButton } from '../../components/GoldButton';
import { GlassCard } from '../../components/GlassCard';
import { useRoleSelect } from '../../lib/hooks/use-role-select';
import { authContainer, authInner } from '../../styles/glass';
import { colors, spacing, radius } from '../../lib/theme';

const roles = [
  { key: 'user' as const, icon: '🌟', title: "I'm a Seeker", desc: 'Find guidance from trusted astrologers' },
  { key: 'astrologer' as const, icon: '🔮', title: "I'm an Astrologer", desc: 'Offer your services and grow your practice' },
];

export default function RoleSelectScreen() {
  const { selected, setSelected, loading, error, confirm } = useRoleSelect();

  async function handleContinue() {
    const err = await confirm();
    if (!err) router.replace('/');
  }

  return (
    <View style={authContainer}>
      <View style={authInner}>
        <BrandHeader tagline="Choose your path" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {roles.map(r => {
          const isSelected = selected === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => setSelected(r.key)}
              activeOpacity={0.8}
            >
              <GlassCard elevated={isSelected} style={[styles.card, isSelected && styles.cardSelected]}>
                <Text style={styles.icon}>{r.icon}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <Text style={styles.cardDesc}>{r.desc}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        <GoldButton
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={!selected}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 14,
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  icon: {
    fontSize: 28,
    marginRight: 16,
  },
  cardBody: {
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
    marginLeft: 12,
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
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
});
