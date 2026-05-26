import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Input, PrimaryButton, palette } from '@/components/kirsof';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendReset = async () => {
    if (!email) {
      Alert.alert('Email required', 'Enter the account email address.');
      return;
    }

    setLoading(true);
    const redirectTo = Linking.createURL('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      Alert.alert('Reset failed', error.message);
      return;
    }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.center}>
            <View style={styles.iconCircle}>
              <MailCheck size={42} color={palette.emeraldDark} />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>We sent reset instructions to {email}.</Text>
            <PrimaryButton label="Try a different email" tone="light" onPress={() => setSent(false)} style={styles.button} />
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>No worries, we will send reset instructions.</Text>
            <Input
              label="Email address"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <PrimaryButton label={loading ? 'Sending...' : 'Send Reset Link'} onPress={sendReset} disabled={loading} style={styles.button} />
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkWrap}>
              <Text style={styles.link}>Remember your password? Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#166534',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 26,
  },
  button: {
    width: '100%',
  },
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  link: {
    color: '#16a34a',
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
