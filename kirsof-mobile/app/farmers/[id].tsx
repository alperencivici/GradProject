import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Plus, Store } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/providers/CartProvider';
import { money } from '@/lib/format';
import {
  BackHeader,
  Card,
  EmptyState,
  LoadingState,
  ProductThumb,
  Screen,
  palette,
} from '@/components/kirsof';

export default function FarmerStoreScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [farmer, setFarmer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarmer();
  }, [id]);

  async function fetchFarmer() {
    if (!id) return;
    setLoading(true);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', id)
      .order('created_at', { ascending: false });
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('farmer_id', id)
      .order('created_at', { ascending: false });

    setFarmer(prof);
    setProducts(prods || []);
    setReviews(revs || []);
    setLoading(false);
  }

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
  }, [reviews]);

  const quickAdd = (product: any) => {
    const added = addItem({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image_url: product.image_url || '',
      farmer_id: product.farmer_id,
      farmer_name: farmer?.full_name || 'Farmer',
    });
    if (added) Alert.alert('Added to cart', `${product.name} is in your cart.`);
  };

  if (loading) return <LoadingState label="Loading farmer store..." />;

  if (!farmer) {
    return (
      <Screen>
        <BackHeader title="Farmer Store" />
        <EmptyState
          title="Farmer not found"
          subtitle="This store may have been removed."
          actionLabel="All Farmers"
          onAction={() => router.push('/farmers' as any)}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerPad}>
          <BackHeader title="Farmer Store" subtitle="Products and reviews" />
        </View>

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{farmer.full_name?.charAt(0) || 'F'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{farmer.full_name}</Text>
            <View style={styles.metaRow}>
              <MapPin size={15} color="#d1fae5" />
              <Text style={styles.metaText}>{farmer.address || 'Registered producer'}</Text>
            </View>
            {farmer.phone ? (
              <View style={styles.metaRow}>
                <Phone size={15} color="#d1fae5" />
                <Text style={styles.metaText}>{farmer.phone}</Text>
              </View>
            ) : null}
            {avgRating ? <Text style={styles.rating}>{avgRating.toFixed(1)} / 5 from {reviews.length} reviews</Text> : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
        </View>
        {products.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No products listed yet.</Text>
          </Card>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
            renderItem={({ item }) => (
              <Card style={styles.productRow}>
                <TouchableOpacity
                  style={styles.productMain}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                >
                  <ProductThumb uri={item.image_url} size={76} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {item.description || 'Fresh local product'}
                    </Text>
                    <Text style={styles.productPrice}>{money(item.price)}</Text>
                  </View>
                </TouchableOpacity>
                {item.stock_quantity > 0 ? (
                  <TouchableOpacity style={styles.quickAdd} onPress={() => quickAdd(item)}>
                    <Plus size={18} color={palette.emeraldDark} />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.outText}>Out</Text>
                )}
              </Card>
            )}
          />
        )}

        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No reviews yet.</Text>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{review.profiles?.full_name?.charAt(0) || 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewer}>{review.profiles?.full_name || 'Customer'}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reviewRating}>{review.rating}/5</Text>
              </View>
              <Text style={styles.reviewText}>{review.comment || 'No comment provided.'}</Text>
            </Card>
          ))
        )}

        <TouchableOpacity style={styles.mapLink} onPress={() => router.push('/(tabs)/map')}>
          <Store size={20} color={palette.emeraldDark} />
          <Text style={styles.mapLinkText}>Open Farm Map</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: palette.emerald,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  name: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  metaText: {
    color: '#d1fae5',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  rating: {
    color: '#fef3c7',
    fontWeight: '900',
    marginTop: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 23,
    fontWeight: '900',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  productsList: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  productRow: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productMain: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  productName: {
    color: palette.text,
    fontWeight: '900',
    fontSize: 16,
  },
  productDesc: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  productPrice: {
    color: palette.emeraldDark,
    fontWeight: '900',
    marginTop: 6,
  },
  quickAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outText: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  emptyText: {
    color: palette.muted,
    lineHeight: 20,
  },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#475569',
    fontWeight: '900',
  },
  reviewer: {
    color: palette.text,
    fontWeight: '900',
  },
  reviewDate: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  reviewRating: {
    color: '#b45309',
    fontWeight: '900',
  },
  reviewText: {
    color: '#475569',
    lineHeight: 21,
  },
  mapLink: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapLinkText: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
});
