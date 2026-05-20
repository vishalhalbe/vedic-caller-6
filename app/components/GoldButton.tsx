import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform, type TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../lib/theme';
import { colors } from '../lib/theme';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
};

const SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 4px 20px rgba(212, 175, 55, 0.30)' }
  : {
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    };

export function GoldButton({ title, loading, style, disabled, ...props }: Props) {
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.wrapper, style]}
      {...props}
    >
      <LinearGradient
        colors={[colors.goldLight, colors.gold, colors.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
    ...SHADOW,
  },
  gradient: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
