import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, ShoppingCart, Store } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/providers/CartProvider';
import { money } from '@/lib/format';
import { BackHeader, Card, EmptyState, LoadingState, Screen, StatusPill, palette } from '@/components/kirsof';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    if (!id) return;
    setLoading(true);

    const { data: prod } = await supabase
      .from('products')
      .select('*, profiles!products_farmer_id_fkey(*)')
      .eq('id', id)
      .single();

    if (prod) {
      setProduct(prod);
      setFarmer(prod.profiles);

      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      setReviews(revs || []);
    }

    setLoading(false);
  }

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
  }, [reviews]);

  const handleAddToCart = () => {
    if (!product) return;
    const added = addItem({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      image_url: product.image_url || '',
      farmer_id: product.farmer_id,
      farmer_name: farmer?.full_name || 'Farmer',
    });

    if (added) {
      Alert.alert('Added to cart', `${product.name} is ready for checkout.`);
    }
  };

  if (loading) return <LoadingState label="Loading product..." />;

  if (!product) {
    return (
      <Screen>
        <BackHeader title="Product" />
        <EmptyState
          title="Product not found"
          subtitle="This listing may have been removed."
          actionLabel="Back to market"
          onAction={() => router.push('/(tabs)/explore')}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerWrap}>
          <BackHeader title="Product Detail" subtitle="Fresh local listing" />
        </View>

        <View style={styles.imageFrame}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>Fresh</Text>
            </View>
          )}
          {product.stock_quantity === 0 ? (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>Out of Stock</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {product.category ? <Text style={styles.category}>{product.category}</Text> : null}
          <Text style={styles.title}>{product.name}</Text>

          {avgRating ? (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>{avgRating.toFixed(1)} / 5</Text>
              <Text style={styles.ratingSub}>from {reviews.length} review{reviews.length === 1 ? '' : 's'}</Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(product.price)}</Text>
            <Text style={styles.unit}>/ kg</Text>
          </View>

          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: product.stock_quantity > 0 ? palette.emerald : palette.red }]} />
            <Text style={styles.stockText}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </Text>
          </View>

          <Text style={styles.description}>{product.description || 'No product description was provided.'}</Text>

          {farmer ? (
            <TouchableOpacity style={styles.farmerCard} onPress={() => router.push(`/farmers/${farmer.id}` as any)}>
              <View style={styles.farmerAvatar}>
                <Store size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.farmerName}>{farmer.full_name}</Text>
                <Text style={styles.farmerLocation} numberOfLines={2}>
                  {farmer.address || 'Local producer'}
                </Text>
              </View>
              <Text style={styles.storeLink}>Store</Text>
            </TouchableOpacity>
          ) : null}

          <Card style={styles.taxNotice}>
            <Text style={styles.taxTitle}>Tax Info</Text>
            <Text style={styles.taxText}>
              A 4 percent withholding tax is calculated at checkout for tax compliance.
            </Text>
          </Card>

          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Customer Reviews</Text>
            <StatusPill status={reviews.length ? 'completed' : 'pending'} />
          </View>

          {reviews.length === 0 ? (
            <Card>
              <Text style={styles.noReviews}>No reviews yet. Completed orders can be reviewed from the dashboard.</Text>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View>
                    <Text style={styles.reviewer}>{review.profiles?.full_name || 'Customer'}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewRating}>{review.rating}/5</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment || 'No comment provided.'}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {product.stock_quantity > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.quantity}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus size={20} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            >
              <Plus size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  imageFrame: {
    height: 330,
    backgroundColor: '#eef2f1',
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: palette.emeraldDark,
    fontSize: 32,
    fontWeight: '900',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  body: {
    padding: 16,
  },
  category: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  ratingText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '900',
  },
  ratingSub: {
    color: palette.muted,
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 18,
  },
  price: {
    color: palette.emeraldDark,
    fontSize: 36,
    fontWeight: '900',
  },
  unit: {
    color: palette.muted,
    fontSize: 15,
    marginLeft: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  stockText: {
    color: '#475569',
    fontWeight: '700',
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 18,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2f1',
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: palette.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
  },
  farmerLocation: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 3,
  },
  storeLink: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
  taxNotice: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    marginTop: 16,
  },
  taxTitle: {
    color: '#92400e',
    fontWeight: '900',
    marginBottom: 4,
  },
  taxText: {
    color: '#92400e',
    lineHeight: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  reviewsTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  noReviews: {
    color: palette.muted,
    lineHeight: 20,
  },
  reviewCard: {
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  reviewer: {
    color: palette.text,
    fontWeight: '900',
  },
  reviewDate: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  reviewRating: {
    color: '#b45309',
    fontWeight: '900',
  },
  reviewComment: {
    color: '#475569',
    lineHeight: 21,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 12,
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
  },
  qtyBtn: {
    padding: 13,
  },
  qtyText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 34,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: palette.emerald,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
