import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Store, Truck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { CATEGORIES } from '@/lib/format';
import { EmptyState, LoadingState, ProductCard, Screen, palette } from '@/components/kirsof';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1200';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, profiles!products_farmer_id_fkey(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(8);

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const openCategory = (category: string) => {
    router.push({ pathname: '/(tabs)/explore', params: { category } } as any);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>Spring Harvest</Text>
            <Text style={styles.heroTitle}>Fresh from the farm to your doorstep</Text>
            <Text style={styles.heroBody}>
              Buy local produce directly from independent farmers, with fair prices and clear
              origins.
            </Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.heroButtonText}>Shop now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/farmers' as any)}>
            <Store size={24} color={palette.emeraldDark} />
            <Text style={styles.quickTitle}>Our Farmers</Text>
            <Text style={styles.quickText}>Meet verified producers.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/map')}>
            <MapPin size={24} color={palette.emeraldDark} />
            <Text style={styles.quickTitle}>Farm Map</Text>
            <Text style={styles.quickText}>Find nearby harvests.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCardWide} onPress={() => router.push('/about' as any)}>
            <Truck size={24} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTitle}>Sell on Kirsof</Text>
              <Text style={styles.quickText}>Farmers keep 96 percent of every sale after tax.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Featured Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.filter((c) => c.value).map((cat) => (
            <TouchableOpacity key={cat.value} style={styles.categoryChip} onPress={() => openCategory(cat.value)}>
              <Text style={styles.categoryText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.categoryChipGhost} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.categoryGhostText}>Show All</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh Arrivals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState label="Loading the market..." />
        ) : products.length === 0 ? (
          <EmptyState title="No products available" subtitle="Fresh listings will appear here as farmers add them." />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => router.push(`/product/${item.id}` as any)} />
            )}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
          />
        )}

        {!user ? (
          <View style={styles.joinBand}>
            <Text style={styles.joinTitle}>Ready for local produce?</Text>
            <Text style={styles.joinText}>Create an account to buy, review, or open your farm store.</Text>
            <View style={styles.joinActions}>
              <TouchableOpacity style={styles.joinPrimary} onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.joinPrimaryText}>Create account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.joinSecondary} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.joinSecondaryText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
  },
  hero: {
    height: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#064e3b',
    marginBottom: 16,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  heroContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: palette.emerald,
    color: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroBody: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 18,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  heroButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2f1',
  },
  quickCardWide: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quickTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  quickText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  sectionLink: {
    color: palette.emeraldDark,
    fontSize: 14,
    fontWeight: '900',
  },
  chips: {
    paddingBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginRight: 10,
  },
  categoryText: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
  categoryChipGhost: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryGhostText: {
    color: '#475569',
    fontWeight: '900',
  },
  productRow: {
    justifyContent: 'space-between',
  },
  joinBand: {
    marginTop: 18,
    backgroundColor: palette.emerald,
    borderRadius: 18,
    padding: 20,
  },
  joinTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  joinText: {
    color: '#d1fae5',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  joinActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  joinPrimary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  joinPrimaryText: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
  joinSecondary: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  joinSecondaryText: {
    color: '#fff',
    fontWeight: '900',
  },
});
