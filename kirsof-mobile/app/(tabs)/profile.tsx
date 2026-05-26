import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Package, Shield, Store, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Card, InfoRow, PrimaryButton, RolePill, palette } from '@/components/kirsof';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guest}>
          <View style={styles.guestIcon}>
            <User size={44} color={palette.emeraldDark} />
          </View>
          <Text style={styles.guestTitle}>Join Kirsof</Text>
          <Text style={styles.guestText}>
            Sign in to manage orders, write reviews, list products, or open your farm dashboard.
          </Text>
          <PrimaryButton label="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.fullButton} />
          <PrimaryButton label="Create Account" tone="light" onPress={() => router.push('/(auth)/signup')} style={styles.fullButton} />
        </View>
      </SafeAreaView>
    );
  }

  const role = profile?.role || user.user_metadata?.role || 'consumer';
  const dashboardPath =
    role === 'admin' ? '/dashboard/admin' : role === 'farmer' ? '/dashboard/farmer' : '/dashboard';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={40} color="#fff" />
          </View>
          <Text style={styles.name}>{profile?.full_name || user.user_metadata?.full_name || 'User Profile'}</Text>
          <RolePill role={role} />
          <Text style={styles.email}>{user.email}</Text>
        </Card>

        <Card style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push(dashboardPath as any)}>
            <View style={styles.menuIcon}>
              {role === 'admin' ? <Shield size={21} color={palette.purple} /> : role === 'farmer' ? <Store size={21} color={palette.emeraldDark} /> : <Package size={21} color={palette.emeraldDark} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Open Dashboard</Text>
              <Text style={styles.menuSub}>Orders, profile, reviews, and role tools</Text>
            </View>
          </TouchableOpacity>

          {role === 'farmer' ? (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pos' as any)}>
              <View style={styles.menuIcon}>
                <Package size={21} color={palette.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>POS Terminal</Text>
                <Text style={styles.menuSub}>Record in-person pickup sales</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/farmers' as any)}>
            <View style={styles.menuIcon}>
              <Store size={21} color={palette.emeraldDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Our Farmers</Text>
              <Text style={styles.menuSub}>Browse all producer stores</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about' as any)}>
            <View style={styles.menuIcon}>
              <Shield size={21} color={palette.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>How Kirsof Works</Text>
              <Text style={styles.menuSub}>Mission, team, sustainability, and fair pricing</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card>
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Address" value={profile?.address} />
          <InfoRow label="Coordinates" value={profile?.location_lat ? `${profile.location_lat}, ${profile.location_lng}` : 'Not set'} />
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={palette.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 14,
  },
  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guestIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  guestText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  fullButton: {
    width: '100%',
    marginTop: 10,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: palette.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 23,
    fontWeight: '900',
    color: palette.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    color: palette.muted,
    marginTop: 8,
  },
  menu: {
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
  },
  menuSub: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    color: palette.red,
    fontSize: 16,
    fontWeight: '900',
  },
});
