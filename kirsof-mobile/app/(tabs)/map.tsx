import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { haversineKm } from '@/lib/format';
import MapComponent from '@/components/MapComponent';
import { SearchInput, palette } from '@/components/kirsof';

export default function MapScreen() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [allFarmers, setAllFarmers] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterByRadius, setFilterByRadius] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, location_lat, location_lng')
        .eq('id', user.id)
        .single();
      setCurrentUserRole(prof?.role || null);
      if (prof?.role !== 'admin' && prof?.location_lat && prof?.location_lng) {
        setUserLocation({ lat: Number(prof.location_lat), lng: Number(prof.location_lng) });
        setFilterByRadius(true);
      }
    }

    const { data: farmerRows } = await supabase
      .from('profiles')
      .select('id, full_name, address, location_lat, location_lng, phone, avatar_url')
      .eq('role', 'farmer')
      .order('full_name', { ascending: true });

    const list = farmerRows || [];
    setAllFarmers(list);
    setFarmers(list.filter((farmer) => farmer.location_lat && farmer.location_lng));

    const { data: products } = await supabase.from('products').select('farmer_id');
    const counts: Record<string, number> = {};
    products?.forEach((product: { farmer_id: string }) => {
      counts[product.farmer_id] = (counts[product.farmer_id] || 0) + 1;
    });
    setProductCounts(counts);
    setLoading(false);
  }

  const farmersWithDistance = useMemo(() => {
    return allFarmers.map((farmer) => {
      if (!userLocation || !farmer.location_lat || !farmer.location_lng) {
        return { ...farmer, distanceKm: null };
      }
      return {
        ...farmer,
        distanceKm: Math.round(
          haversineKm(userLocation.lat, userLocation.lng, Number(farmer.location_lat), Number(farmer.location_lng))
        ),
      };
    });
  }, [allFarmers, userLocation]);

  const filtered = farmersWithDistance.filter((farmer) => {
    const term = search.trim().toLowerCase();
    const matches =
      !term ||
      farmer.full_name?.toLowerCase().includes(term) ||
      farmer.address?.toLowerCase().includes(term);
    if (!matches) return false;
    if (currentUserRole !== 'admin' && filterByRadius && userLocation && farmer.distanceKm !== null) {
      return farmer.distanceKm <= 500;
    }
    return true;
  });

  const mapFarmers = farmers.filter((farmer) => {
    if (currentUserRole === 'admin') return true;
    if (!filterByRadius || !userLocation) return true;
    return (
      farmer.location_lat &&
      farmer.location_lng &&
      haversineKm(userLocation.lat, userLocation.lng, Number(farmer.location_lat), Number(farmer.location_lng)) <= 500
    );
  });

  const inRangeCount = userLocation
    ? farmersWithDistance.filter((farmer) => farmer.distanceKm !== null && farmer.distanceKm <= 500).length
    : 0;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={palette.emerald} />
        </View>
      ) : farmers.length === 0 ? (
        <View style={styles.loading}>
          <Text style={styles.emptyTitle}>No farms pinned yet</Text>
          <Text style={styles.emptyText}>Farmers can add GPS coordinates from their dashboard.</Text>
        </View>
      ) : (
        <MapComponent
          farmers={mapFarmers}
          selectedFarmerId={selectedFarmer}
          userLocation={userLocation}
          onFarmerPress={(farmer) => router.push(`/farmers/${farmer.id}` as any)}
        />
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.title}>Discover Farms</Text>
              <Text style={styles.subtitle}>{allFarmers.length} registered producers</Text>
            </View>
            {userLocation ? (
              <TouchableOpacity
                style={[styles.radiusToggle, filterByRadius && styles.radiusToggleActive]}
                onPress={() => setFilterByRadius((value) => !value)}
              >
                <Text style={[styles.radiusText, filterByRadius && styles.radiusTextActive]}>
                  {filterByRadius ? '500km On' : '500km Off'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.locationButton} onPress={() => router.push('/dashboard' as any)}>
                <MapPin size={14} color={palette.emeraldDark} />
                <Text style={styles.locationText}>Set location</Text>
              </TouchableOpacity>
            )}
          </View>

          {currentUserRole === 'admin' ? (
            <Text style={styles.helper}>Admin view shows every farm without radius filtering.</Text>
          ) : userLocation ? (
            <Text style={styles.helper}>{inRangeCount} farms within 500km of your profile location.</Text>
          ) : (
            <Text style={styles.helper}>Add your profile location for distance-aware discovery.</Text>
          )}

          <View style={styles.searchWrap}>
            <Search size={16} color="#94a3b8" style={styles.searchIcon} />
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or city..."
              style={styles.searchInput}
            />
          </View>

          <FlatList
            horizontal
            data={filtered}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.farmerList}
            renderItem={({ item }) => {
              const selected = selectedFarmer === item.id;
              return (
                <TouchableOpacity
                  style={[styles.farmerCard, selected && styles.farmerCardSelected]}
                  onPress={() => {
                    if (item.location_lat && item.location_lng) setSelectedFarmer(item.id);
                  }}
                  onLongPress={() => router.push(`/farmers/${item.id}` as any)}
                >
                  <Text style={styles.farmerName} numberOfLines={1}>{item.full_name}</Text>
                  <Text style={styles.farmerAddress} numberOfLines={2}>{item.address || 'Location not set'}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.productCount}>{productCounts[item.id] || 0} products</Text>
                    {item.distanceKm !== null ? <Text style={styles.distance}>{item.distanceKm} km</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={styles.storeButton}
                    onPress={() => router.push(`/farmers/${item.id}` as any)}
                  >
                    <Text style={styles.storeText}>Open Store</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8faf9',
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  radiusToggle: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  radiusToggleActive: {
    backgroundColor: palette.emerald,
    borderColor: palette.emerald,
  },
  radiusText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  radiusTextActive: {
    color: '#fff',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  locationText: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  helper: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    zIndex: 1,
    left: 13,
    top: 15,
  },
  searchInput: {
    paddingLeft: 38,
    marginBottom: 8,
  },
  farmerList: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  farmerCard: {
    width: 210,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f1',
    padding: 12,
    marginRight: 10,
  },
  farmerCardSelected: {
    borderColor: palette.emerald,
    backgroundColor: '#ecfdf5',
  },
  farmerName: {
    color: palette.text,
    fontWeight: '900',
    fontSize: 15,
  },
  farmerAddress: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    minHeight: 34,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productCount: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  distance: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  storeButton: {
    backgroundColor: palette.emerald,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 9,
    marginTop: 10,
  },
  storeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
