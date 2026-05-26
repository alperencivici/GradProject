import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);
    
    if (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f0fdf4' }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#166534' }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#a3a3a3' : '#4b5563' }]}>Sign in to your Kırsof account</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Email address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="you@example.com"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="••••••••"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password' as any)}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{ color: isDark ? '#a3a3a3' : '#4b5563' }}>Not a member? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>Sign up now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#16a34a',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
