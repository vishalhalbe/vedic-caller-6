import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { GlassInput } from '../../components/GlassInput';
import { GoldButton } from '../../components/GoldButton';
import { BrandHeader } from '../../components/BrandHeader';
import { GlassCard } from '../../components/GlassCard';
import { ScreenShell } from '../../components/ScreenShell';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { authInner } from '../../styles/glass';
import { colors } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setError('');
    if (!email.trim()) { setError('Enter your email address'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${Platform.OS === 'web' ? window.location.origin : 'vedic-caller-6://'}/auth/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authInner}>
          <AnimatedEntry>
            <BrandHeader tagline="Reset your password" />
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <GlassCard elevated style={styles.card}>
              <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.back} activeOpacity={0.7}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {sent ? (
                <Text style={styles.sentText}>
                  Check your email{'\n'}We sent a password reset link to{' '}
                  <Text style={styles.sentEmail}>{email}</Text>
                </Text>
              ) : (
                <>
                  <GlassInput
                    label="Email"
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  <GoldButton title="Send Reset Link" onPress={handleSend} loading={loading} />
                </>
              )}
            </GlassCard>
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Link href="/auth/login" style={styles.link}>Sign In</Link>
            </View>
          </AnimatedEntry>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, paddingTop: 16 },
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
    color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: 12,
  },
  sentText: {
    color: colors.textPrimary, fontSize: 15, textAlign: 'center', lineHeight: 22,
    fontFamily: 'Manrope_400Regular',
  },
  sentEmail: {
    color: colors.goldDark, fontWeight: '600', fontFamily: 'Manrope_600SemiBold',
  },
  footer: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 24,
  },
  footerText: {
    color: colors.textMuted, fontSize: 14, fontFamily: 'Manrope_400Regular',
  },
  link: {
    color: colors.goldDark, fontSize: 14, fontWeight: '600', fontFamily: 'Manrope_600SemiBold',
  },
});
