import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { BackHeader, Input, PrimaryButton, Screen, palette } from '@/components/kirsof';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetPassword = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please confirm the same password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Reset failed', error.message);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.success}>
          <CheckCircle size={82} color={palette.emerald} />
          <Text style={styles.title}>Password Updated</Text>
          <Text style={styles.subtitle}>You can continue to your dashboard.</Text>
          <PrimaryButton label="Go to Dashboard" onPress={() => router.push('/dashboard' as any)} style={styles.button} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackHeader title="Set New Password" />
          <Text style={styles.subtitle}>Choose a strong password for your Kirsof account.</Text>
          <Input
            label="New Password"
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <PrimaryButton label={loading ? 'Updating...' : 'Reset Password'} onPress={resetPassword} disabled={loading} style={styles.button} />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkWrap}>
            <Text style={styles.link}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  link: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
});
