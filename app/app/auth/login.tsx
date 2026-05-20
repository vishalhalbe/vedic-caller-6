import { KeyboardAvoidingView, Platform, Text, View, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { GlassInput } from '../../components/GlassInput';
import { GoldButton } from '../../components/GoldButton';
import { BrandHeader } from '../../components/BrandHeader';
import { GlassCard } from '../../components/GlassCard';
import { ScreenShell } from '../../components/ScreenShell';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { useAuthForm } from '../../lib/hooks/use-auth-form';
import { authInner } from '../../styles/glass';
import { colors } from '../../lib/theme';

export default function LoginScreen() {
  const form = useAuthForm('login');

  async function handleLogin() {
    const err = await form.submit();
    if (!err) router.replace('/');
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authInner}>
          <AnimatedEntry>
            <BrandHeader tagline="Connect with trusted astrologers" />
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <GlassCard elevated style={styles.card}>
              {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

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
                placeholder="Enter your password"
                value={form.password}
                onChangeText={form.setPassword}
                secureTextEntry
              />

              <GoldButton title="Sign In" onPress={handleLogin} loading={form.loading} />
            </GlassCard>
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/auth/register" style={styles.link}>Create Account</Link>
            </View>

            <Text style={styles.admin}>Admin? Sign in</Text>
          </AnimatedEntry>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
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
    fontFamily: 'Manrope_400Regular',
  },
  link: {
    color: colors.goldDark,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  admin: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
