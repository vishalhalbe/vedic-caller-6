import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GlassInput } from '../../components/GlassInput';
import { GoldButton } from '../../components/GoldButton';
import { BrandHeader } from '../../components/BrandHeader';
import { GlassCard } from '../../components/GlassCard';
import { ScreenShell } from '../../components/ScreenShell';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { authInner } from '../../styles/glass';
import { colors } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset() {
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <ScreenShell>
        <View style={authInner}>
          <AnimatedEntry>
            <BrandHeader tagline="Password updated" />
          </AnimatedEntry>
          <AnimatedEntry delay={100}>
            <GlassCard elevated style={styles.card}>
              <Text style={styles.doneText}>Your password has been reset successfully.</Text>
              <GoldButton title="Sign In" onPress={() => router.replace('/auth/login')} style={{ marginTop: 16 }} />
            </GlassCard>
          </AnimatedEntry>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authInner}>
          <AnimatedEntry>
            <BrandHeader tagline="Choose new password" />
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <GlassCard elevated style={styles.card}>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <GlassInput
                label="New Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <GlassInput
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
              <GoldButton title="Reset Password" onPress={handleReset} loading={loading} />
            </GlassCard>
          </AnimatedEntry>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24 },
  error: {
    color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: 12,
  },
  doneText: {
    color: colors.textPrimary, fontSize: 15, textAlign: 'center', lineHeight: 22,
    fontFamily: 'Manrope_400Regular',
  },
});
