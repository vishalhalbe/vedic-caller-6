import { StyleSheet, TextInput, type TextInputProps, View, Text } from 'react-native';
import { colors } from '../lib/theme';
import { glass } from '../styles/glass';

type Props = TextInputProps & {
  label?: string;
};

export function GlassInput({ label, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, glass.input, style]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
