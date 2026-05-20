import { KeyboardAvoidingView, Platform, Text, View, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { GlassInput } from '../../components/GlassInput';
import { GoldButton } from '../../components/GoldButton';
import { BrandHeader } from '../../components/BrandHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthForm } from '../../lib/hooks/use-auth-form';
import { authContainer, authInner } from '../../styles/glass';
import { colors } from '../../lib/theme';

export default function RegisterScreen() {
  const form = useAuthForm('register');

  async function handleRegister() {
    const err = await form.submit();
    if (!err) router.replace('/auth/role-select');
  }

  return (
    <KeyboardAvoidingView style={authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={authInner}>
        <BrandHeader tagline="Create your account" />

        <GlassCard elevated style={styles.card}>
          {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

          <GlassInput
            label="Full Name"
            placeholder="Your name"
            value={form.name}
            onChangeText={form.setName}
            autoCapitalize="words"
          />

          <GlassInput
            label="Email"
            placeholder="your@email.com"
            value={form.email}
            onChangeText={form.setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          <GlassInput
            label="Password"
            placeholder="At least 6 characters"
            value={form.password}
            onChangeText={form.setPassword}
            secureTextEntry
          />

          <GlassInput
            label="Confirm Password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChangeText={form.setConfirm}
            secureTextEntry
          />

          <GoldButton title="Create Account" onPress={handleRegister} loading={form.loading} />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/login" style={styles.link}>Sign In</Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
