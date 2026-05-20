import { KeyboardAvoidingView, Platform, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { GlassInput } from '../../components/GlassInput';
import { GoldButton } from '../../components/GoldButton';
import { BrandHeader } from '../../components/BrandHeader';
import { GlassCard } from '../../components/GlassCard';
import { ScreenShell } from '../../components/ScreenShell';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { useAuthForm } from '../../lib/hooks/use-auth-form';
import { authInner } from '../../styles/glass';
import { colors, spacing } from '../../lib/theme';

const roles = [
  { key: 'user' as const, icon: '🌟', label: 'Seeker' },
  { key: 'astrologer' as const, icon: '🔮', label: 'Astrologer' },
];

export default function RegisterScreen() {
  const form = useAuthForm('register');

  async function handleRegister() {
    const err = await form.submit();
    if (!err) {
      const route = form.role === 'astrologer' ? '/(astrologer)/home' : '/(user)/home';
      router.replace(route);
    }
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authInner}>
          <AnimatedEntry>
            <BrandHeader tagline="Create your account" />
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <GlassCard elevated style={styles.card}>
              <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.back} activeOpacity={0.7}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

              <View style={styles.toggle}>
                {roles.map((r) => {
                  const active = form.role === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => form.setRole(r.key)}
                      activeOpacity={0.8}
                      style={[styles.toggleBtn, active && styles.toggleActive]}
                    >
                      <Text style={styles.toggleIcon}>{r.icon}</Text>
                      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

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

              <GoldButton
                title={form.role === 'astrologer' ? 'Join as Astrologer' : 'Create Account'}
                onPress={handleRegister}
                loading={form.loading}
              />
            </GlassCard>
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login" style={styles.link}>Sign In</Link>
            </View>
          </AnimatedEntry>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    paddingTop: 16,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 4,
  },
  backArrow: {
    color: colors.goldDark,
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
  },
  backText: {
    color: colors.goldDark,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    gap: 6,
  },
  toggleActive: {
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  toggleIcon: {
    fontSize: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: 'Manrope_600SemiBold',
  },
  toggleLabelActive: {
    color: colors.goldDark,
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
  },
});
