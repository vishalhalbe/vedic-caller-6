import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export function BrandHeader({ tagline }: { tagline?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.logoRing}>
        <Text style={styles.om}>🪐</Text>
      </View>
      <Text style={styles.brand}>VedicCaller</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  om: {
    fontSize: 28,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
  },
});
