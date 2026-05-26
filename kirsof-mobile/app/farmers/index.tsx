import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Phone, Store } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { BackHeader, Card, EmptyState, LoadingState, Screen, SearchInput, palette } from '@/components/kirsof';

export default function FarmersScreen() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFarmers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false });
      setFarmers(data || []);
      setLoading(false);
    };

    fetchFarmers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return farmers;
    return farmers.filter(
      (farmer) =>
        farmer.full_name?.toLowerCase().includes(term) ||
        farmer.address?.toLowerCase().includes(term)
    );
  }, [farmers, search]);

  return (
    <Screen>
      <BackHeader title="Our Farmers" subtitle="Verified producers on Kirsof" />
      <Text style={styles.intro}>
        Meet the people behind the food. Every farmer profile links to their public store,
        products, location, and reviews.
      </Text>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search farmers by name or location..." />

      {loading ? (
        <LoadingState label="Loading farmers..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/farmers/${item.id}` as any)}>
              <Card style={styles.farmerCard}>
                <View style={styles.banner}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.full_name?.charAt(0) || 'F'}</Text>
                  </View>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>{item.full_name || 'Unnamed Farmer'}</Text>
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={palette.muted} />
                    <Text style={styles.metaText} numberOfLines={2}>
                      {item.address || 'Turkey'}
                    </Text>
                  </View>
                  {item.phone ? (
                    <View style={styles.metaRow}>
                      <Phone size={14} color={palette.muted} />
                      <Text style={styles.metaText}>{item.phone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.footer}>
                    <Text style={styles.verified}>Verified Farmer</Text>
                    <View style={styles.storeLink}>
                      <Store size={14} color={palette.emeraldDark} />
                      <Text style={styles.storeText}>View Store</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No farmers found"
              subtitle="Try a different search or check back after more farms register."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  list: {
    paddingBottom: 32,
  },
  farmerCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 14,
  },
  banner: {
    height: 92,
    backgroundColor: palette.emerald,
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#fff',
    marginLeft: 16,
    marginBottom: -28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    color: palette.emeraldDark,
    fontSize: 28,
    fontWeight: '900',
  },
  body: {
    padding: 16,
    paddingTop: 42,
  },
  name: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    flex: 1,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  verified: {
    color: palette.emeraldDark,
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
  },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storeText: {
    color: palette.emeraldDark,
    fontSize: 13,
    fontWeight: '900',
  },
});
