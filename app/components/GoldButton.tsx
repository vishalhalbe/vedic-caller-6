import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { glass } from '../styles/glass';
import { spacing } from '../lib/theme';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
};

export function GoldButton({ title, loading, style, disabled, ...props }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, glass.button, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
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
