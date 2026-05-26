import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/format';
import { Chip, EmptyState, LoadingState, ProductCard, Screen, SearchInput, palette } from '@/components/kirsof';

const SORTS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price low', value: 'price_asc' },
  { label: 'Price high', value: 'price_desc' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = typeof params.category === 'string' ? params.category : '';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, profiles!products_farmer_id_fkey(full_name, avatar_url)');

    if (category) query = query.eq('category', category);

    if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.profiles?.full_name?.toLowerCase().includes(term)
    );
  }, [products, search]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Market</Text>
        <Text style={styles.subtitle}>Browse fresh, locally sourced produce from verified farmers.</Text>

        <View style={styles.searchWrap}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, farmers..."
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((item) => (
            <Chip
              key={item.value || 'all'}
              label={item.label}
              active={category === item.value}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </ScrollView>

        <View style={styles.sortHeader}>
          <View style={styles.sortTitle}>
            <SlidersHorizontal size={16} color={palette.muted} />
            <Text style={styles.sortTitleText}>Sort</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORTS.map((sort) => (
              <TouchableOpacity
                key={sort.value}
                style={[styles.sortChip, sortBy === sort.value && styles.sortChipActive]}
                onPress={() => setSortBy(sort.value)}
              >
                <Text style={[styles.sortText, sortBy === sort.value && styles.sortTextActive]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading products..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => router.push(`/product/${item.id}` as any)} />
          )}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <EmptyState
              title="No products found"
              subtitle={search ? `No results for "${search}".` : 'This category is waiting for its first listing.'}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 4,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 14,
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    zIndex: 1,
    left: 14,
    top: 15,
  },
  searchInput: {
    paddingLeft: 42,
  },
  chips: {
    paddingBottom: 12,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sortTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  sortTitleText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  sortChip: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  sortText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  sortTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 112,
  },
  row: {
    justifyContent: 'space-between',
  },
});
