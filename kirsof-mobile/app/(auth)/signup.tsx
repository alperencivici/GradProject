import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { extractPhoneDigits, formatTurkishPhone, parseNumber } from '@/lib/format';

export default function SignupScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [role, setRole] = useState<'consumer' | 'farmer'>(params.role === 'farmer' ? 'farmer' : 'consumer');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const handleSignup = async () => {
    if (!email || !password || !fullName || !address) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    const phoneClean = phone ? extractPhoneDigits(phone) : null;
    const rawLat = parseNumber(lat);
    const rawLng = parseNumber(lng);
    const hasCoords = rawLat !== null && rawLng !== null;
    const locationLat = hasCoords ? rawLat : null;
    const locationLng = hasCoords ? rawLng : null;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phoneClean,
          address: address,
          location_lat: locationLat?.toString() || '',
          location_lng: locationLng?.toString() || '',
        }
      }
    });
    
    if (authError) {
      Alert.alert('Signup Failed', authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        phone: phoneClean,
        address: address,
        location_lat: locationLat,
        location_lng: locationLng,
      }, { onConflict: 'id' });
      
      if (profileError) {
        Alert.alert('Profile Error', `Account created, but profile failed to save: ${profileError.message}`);
      } else {
        Alert.alert('Success', 'Account created! Please check your email.');
        router.push('/(auth)/login');
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f0fdf4' }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#166534' }]}>Join Kırsof</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#a3a3a3' : '#4b5563' }]}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>I am a...</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'consumer' && styles.roleButtonActive]} 
              onPress={() => setRole('consumer')}
            >
              <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>Consumer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]} 
              onPress={() => setRole('farmer')}
            >
              <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>Farmer</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="John Doe"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="you@example.com"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Password *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="Min 6 characters"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
            placeholder="+90 5XX XXX XX XX"
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => setPhone(formatTurkishPhone(value))}
          />

          <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db', height: 80, textAlignVertical: 'top' }]}
            placeholder="Your full address..."
            placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
            multiline
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.coordRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Latitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
                placeholder="39.92077"
                placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
                keyboardType="decimal-pad"
                value={lat}
                onChangeText={setLat}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: isDark ? '#e5e5e5' : '#374151' }]}>Longitude</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#404040' : '#d1d5db' }]}
                placeholder="32.85411"
                placeholderTextColor={isDark ? '#737373' : '#9ca3af'}
                keyboardType="decimal-pad"
                value={lng}
                onChangeText={setLng}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup} 
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Complete Registration'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{ color: isDark ? '#a3a3a3' : '#4b5563' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Sign in</Text>
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
    paddingTop: 64,
  },
  header: {
    marginBottom: 24,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  roleText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#047857',
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
    marginTop: 8,
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
    paddingBottom: 32,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
