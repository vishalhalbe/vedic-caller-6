import { useState, useRef, useCallback } from 'react';
import { StyleSheet, TextInput, View, Text, Animated, type TextInputProps } from 'react-native';
import { colors } from '../lib/theme';
import { glass } from '../styles/glass';

type Props = TextInputProps & {
  label: string;
};

export function GlassInput({ label, value, onFocus, onBlur, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';
  const labelAnim = useRef(new Animated.Value(hasValue || focused ? 1 : 0)).current;

  const handleFocus = useCallback((e: any) => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    onFocus?.(e);
  }, [onFocus, labelAnim]);

  const handleBlur = useCallback((e: any) => {
    setFocused(false);
    if (!hasValue) {
      Animated.timing(labelAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    }
    onBlur?.(e);
  }, [onBlur, hasValue, labelAnim]);

  return (
    <View style={styles.wrapper}>
      <Animated.Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[
          styles.input,
          glass.input,
          focused && styles.inputFocused,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelFocused: {
    color: colors.goldDark,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.gold,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
