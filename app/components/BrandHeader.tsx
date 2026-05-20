import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';

export function BrandHeader({ tagline }: { tagline?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.logoRing}>
        <Text style={styles.icon}>🪐</Text>
      </View>
      <Text style={styles.brand}>VedicCaller</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  icon: {
    fontSize: 30,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.goldDark,
    letterSpacing: 1.5,
    fontFamily: fonts.heading,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    fontFamily: fonts.body,
  },
});
