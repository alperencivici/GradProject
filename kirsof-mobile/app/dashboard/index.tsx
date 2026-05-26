import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PackageCheck, PenLine, RotateCcw, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  extractPhoneDigits,
  formatTurkishPhone,
  money,
  parseNumber,
  phoneToDisplay,
  shortId,
} from '@/lib/format';
import {
  BackHeader,
  Card,
  EmptyState,
  InfoRow,
  Input,
  LoadingState,
  PrimaryButton,
  ProductThumb,
  Screen,
  StatCard,
  StatusPill,
  Tabs,
  palette,
} from '@/components/kirsof';

const RETURN_REASONS = [
  { value: 'rotten', label: 'Rotten / Spoiled Product' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'damaged', label: 'Damaged in Transit' },
  { value: 'quality', label: 'Poor Quality' },
  { value: 'unwanted', label: 'Changed My Mind' },
  { value: 'other', label: 'Other Reason' },
];

export default function ConsumerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'reviews' | 'profile'>('orders');
  const [editProfile, setEditProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);
  const [reviewProduct, setReviewProduct] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [returningOrder, setReturningOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.replace('/(auth)/login');
      return;
    }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (prof?.role === 'farmer') {
      router.replace('/dashboard/farmer' as any);
      return;
    }
    if (prof?.role === 'admin') {
      router.replace('/dashboard/admin' as any);
      return;
    }

    setProfile(prof);
    setFullName(prof?.full_name || '');
    setPhone(phoneToDisplay(prof?.phone));
    setAddress(prof?.address || '');
    setLat(prof?.location_lat ? String(prof.location_lat) : '');
    setLng(prof?.location_lng ? String(prof.location_lng) : '');

    const { data: ords } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, image_url, farmer_id))')
      .eq('buyer_id', authUser.id)
      .order('created_at', { ascending: false });
    setOrders(ords || []);

    const { data: revs } = await supabase
      .from('reviews')
      .select('*, products(name, image_url)')
      .eq('reviewer_id', authUser.id)
      .order('created_at', { ascending: false });
    setReviews(revs || []);
    setLoading(false);
  }

  async function saveProfile() {
    if (!user) return;
    const rawLat = parseNumber(lat);
    const rawLng = parseNumber(lng);
    const hasCoords = rawLat !== null && rawLng !== null;
    const phoneClean = phone ? extractPhoneDigits(phone) : null;
    setSaving(true);
    const updates = {
      full_name: fullName,
      phone: phoneClean,
      address,
      location_lat: hasCoords ? rawLat : null,
      location_lng: hasCoords ? rawLng : null,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Profile error', error.message);
      return;
    }
    setProfile({ ...profile, ...updates });
    setEditProfile(false);
  }

  async function markReceived(orderId: string) {
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
    if (error) Alert.alert('Order error', error.message);
    else fetchAll();
  }

  async function submitReturn() {
    if (!returningOrder || !returnReason) return;
    const fullReason = returnDetails.trim() ? `${returnReason}: ${returnDetails.trim()}` : returnReason;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'return_requested', return_reason: fullReason })
      .eq('id', returningOrder.id);
    if (error) Alert.alert('Return error', error.message);
    else {
      setReturningOrder(null);
      setReturnReason('');
      setReturnDetails('');
      fetchAll();
    }
  }

  async function submitReview() {
    if (!reviewingOrder || !reviewProduct || !reviewComment.trim() || !user) return;
    const item = reviewingOrder.order_items?.find((orderItem: any) => orderItem.products?.id === reviewProduct);
    const farmerId = item?.products?.farmer_id;
    if (!farmerId) {
      Alert.alert('Review error', 'Farmer ID not found for this product.');
      return;
    }
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      product_id: reviewProduct,
      farmer_id: farmerId,
      rating: reviewRating,
      comment: reviewComment,
    });
    if (error) Alert.alert('Review error', error.message);
    else {
      setReviewingOrder(null);
      setReviewProduct('');
      setReviewRating(5);
      setReviewComment('');
      fetchAll();
    }
  }

  async function deleteReview(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) Alert.alert('Review error', error.message);
    else setReviews((current) => current.filter((review) => review.id !== id));
  }

  if (loading) return <LoadingState label="Loading dashboard..." />;

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const completedOrders = orders.filter((order) => order.status === 'completed').length;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerPad}>
          <BackHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`} subtitle={user?.email || ''} />
        </View>

        <View style={styles.stats}>
          <StatCard label="Total Orders" value={orders.length} />
          <StatCard label="Completed" value={completedOrders} tone={palette.emeraldDark} />
          <StatCard label="Total Spent" value={money(totalSpent)} />
          <StatCard label="My Reviews" value={reviews.length} tone="#b45309" />
        </View>

        <View style={styles.tabsWrap}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'orders', label: `Orders (${orders.length})` },
              { value: 'reviews', label: `Reviews (${reviews.length})` },
              { value: 'profile', label: 'Profile' },
            ]}
          />
        </View>

        {tab === 'orders' ? (
          <OrdersTab
            orders={orders}
            onShop={() => router.push('/(tabs)/explore')}
            onReceived={markReceived}
            onReturn={(order) => {
              setReturningOrder(order);
              setReturnReason('');
              setReturnDetails('');
            }}
            onReview={(order) => {
              setReviewingOrder(order);
              setReviewProduct(order.order_items?.[0]?.products?.id || '');
            }}
          />
        ) : null}

        {tab === 'reviews' ? (
          <ReviewsTab reviews={reviews} onDelete={deleteReview} />
        ) : null}

        {tab === 'profile' ? (
          <ProfileTab
            profile={profile}
            userEmail={user?.email || ''}
            editProfile={editProfile}
            setEditProfile={setEditProfile}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            address={address}
            setAddress={setAddress}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            saving={saving}
            onSave={saveProfile}
          />
        ) : null}
      </ScrollView>

      <ReviewModal
        order={reviewingOrder}
        productId={reviewProduct}
        setProductId={setReviewProduct}
        rating={reviewRating}
        setRating={setReviewRating}
        comment={reviewComment}
        setComment={setReviewComment}
        onClose={() => setReviewingOrder(null)}
        onSubmit={submitReview}
      />
      <ReturnModal
        order={returningOrder}
        reason={returnReason}
        setReason={setReturnReason}
        details={returnDetails}
        setDetails={setReturnDetails}
        onClose={() => setReturningOrder(null)}
        onSubmit={submitReturn}
      />
    </Screen>
  );
}

function OrdersTab({
  orders,
  onShop,
  onReceived,
  onReturn,
  onReview,
}: {
  orders: any[];
  onShop: () => void;
  onReceived: (id: string) => void;
  onReturn: (order: any) => void;
  onReview: (order: any) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" subtitle="Discover fresh produce from local farmers." actionLabel="Start Shopping" onAction={onShop} />;
  }

  return (
    <View style={styles.stack}>
      {orders.map((order) => (
        <Card key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.smallLabel}>ORDER</Text>
              <Text style={styles.orderId}>#{shortId(order.id)}</Text>
            </View>
            <StatusPill status={order.status} />
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.metaText}>{new Date(order.created_at).toLocaleDateString()}</Text>
            <Text style={styles.metaText}>{order.delivery_method}</Text>
            <Text style={styles.orderTotal}>{money(order.total_amount)}</Text>
          </View>
          {order.order_items?.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <ProductThumb uri={item.products?.image_url} size={50} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.products?.name || 'Product'}</Text>
                <Text style={styles.itemSub}>Qty {item.quantity} x {money(item.unit_price)}</Text>
              </View>
              <Text style={styles.itemPrice}>{money(item.unit_price * item.quantity)}</Text>
            </View>
          ))}
          {Number(order.withholding_tax) > 0 ? (
            <View style={styles.taxLine}>
              <Text style={styles.taxLabel}>Withholding tax</Text>
              <Text style={styles.taxValue}>{money(order.withholding_tax)}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {order.status === 'shipped' ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => onReceived(order.id)}>
                <PackageCheck size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Received</Text>
              </TouchableOpacity>
            ) : null}
            {order.status === 'shipped' || order.status === 'completed' ? (
              <TouchableOpacity style={styles.lightButton} onPress={() => onReturn(order)}>
                <RotateCcw size={16} color="#c2410c" />
                <Text style={styles.lightButtonText}>Return</Text>
              </TouchableOpacity>
            ) : null}
            {order.status === 'completed' ? (
              <TouchableOpacity style={styles.reviewButton} onPress={() => onReview(order)}>
                <PenLine size={16} color={palette.emeraldDark} />
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>
      ))}
    </View>
  );
}

function ReviewsTab({ reviews, onDelete }: { reviews: any[]; onDelete: (id: string) => void }) {
  if (reviews.length === 0) {
    return <EmptyState title="No reviews written" subtitle="After receiving an order, leave a review from the Orders tab." />;
  }
  return (
    <View style={styles.stack}>
      {reviews.map((review) => (
        <Card key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <ProductThumb uri={review.products?.image_url} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{review.products?.name || 'Product'}</Text>
              <Text style={styles.itemSub}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#b45309" />
              <Text style={styles.ratingText}>{review.rating}/5</Text>
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
          <TouchableOpacity onPress={() => onDelete(review.id)} style={styles.deleteLink}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </View>
  );
}

function ProfileTab(props: {
  profile: any;
  userEmail: string;
  editProfile: boolean;
  setEditProfile: (value: boolean) => void;
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  lat: string;
  setLat: (value: string) => void;
  lng: string;
  setLng: (value: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  if (props.editProfile) {
    return (
      <Card style={styles.profileCard}>
        <Input label="Full Name" value={props.fullName} onChangeText={props.setFullName} />
        <Input label="Phone" value={props.phone} onChangeText={(value) => props.setPhone(formatTurkishPhone(value))} keyboardType="phone-pad" />
        <Input label="Delivery Address" value={props.address} onChangeText={props.setAddress} multiline />
        <View style={styles.coordRow}>
          <Input label="Latitude" value={props.lat} onChangeText={props.setLat} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Input label="Longitude" value={props.lng} onChangeText={props.setLng} keyboardType="decimal-pad" style={{ flex: 1 }} />
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton label={props.saving ? 'Saving...' : 'Save Changes'} onPress={props.onSave} disabled={props.saving} style={{ flex: 1 }} />
          <PrimaryButton label="Cancel" tone="light" onPress={() => props.setEditProfile(false)} style={{ flex: 1 }} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{props.profile?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{props.profile?.full_name}</Text>
          <Text style={styles.profileEmail}>{props.userEmail}</Text>
        </View>
      </View>
      <InfoRow label="Full Name" value={props.profile?.full_name} />
      <InfoRow label="Email" value={props.userEmail} />
      <InfoRow label="Phone" value={props.profile?.phone} />
      <InfoRow label="Address" value={props.profile?.address} />
      <InfoRow label="Coordinates" value={props.profile?.location_lat ? `${props.profile.location_lat}, ${props.profile.location_lng}` : 'Not set'} />
      <PrimaryButton label="Edit Profile" tone="light" onPress={() => props.setEditProfile(true)} style={styles.editButton} />
    </Card>
  );
}

function ReviewModal(props: {
  order: any;
  productId: string;
  setProductId: (value: string) => void;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={!!props.order} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>Write a Review</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {props.order?.order_items?.map((item: any) => (
              <TouchableOpacity
                key={item.products?.id}
                onPress={() => props.setProductId(item.products?.id)}
                style={[styles.productPick, props.productId === item.products?.id && styles.productPickActive]}
              >
                <Text style={[styles.productPickText, props.productId === item.products?.id && styles.productPickTextActive]}>
                  {item.products?.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity key={rating} onPress={() => props.setRating(rating)}>
                <Text style={[styles.star, rating <= props.rating && styles.starActive]}>{rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Your Review" value={props.comment} onChangeText={props.setComment} multiline placeholder="Share your experience..." />
          <View style={styles.actionRow}>
            <PrimaryButton label="Submit" onPress={props.onSubmit} style={{ flex: 1 }} />
            <PrimaryButton label="Cancel" tone="light" onPress={props.onClose} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function ReturnModal(props: {
  order: any;
  reason: string;
  setReason: (value: string) => void;
  details: string;
  setDetails: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={!!props.order} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>Request a Return</Text>
          <Text style={styles.modalSub}>Order #{shortId(props.order?.id)}</Text>
          {RETURN_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[styles.reason, props.reason === reason.value && styles.reasonActive]}
              onPress={() => props.setReason(reason.value)}
            >
              <Text style={[styles.reasonText, props.reason === reason.value && styles.reasonTextActive]}>{reason.label}</Text>
            </TouchableOpacity>
          ))}
          <Input label="Additional Details" value={props.details} onChangeText={props.setDetails} multiline placeholder="Describe the issue..." />
          <View style={styles.actionRow}>
            <PrimaryButton label="Submit Return" onPress={props.onSubmit} disabled={!props.reason} style={{ flex: 1 }} />
            <PrimaryButton label="Cancel" tone="light" onPress={props.onClose} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
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
  stats: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabsWrap: {
    paddingHorizontal: 16,
  },
  stack: {
    paddingHorizontal: 16,
    gap: 12,
  },
  orderCard: {
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  smallLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  orderId: {
    color: palette.text,
    fontWeight: '900',
    marginTop: 2,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  orderTotal: {
    marginLeft: 'auto',
    color: palette.text,
    fontSize: 17,
    fontWeight: '900',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  itemName: {
    color: palette.text,
    fontWeight: '900',
  },
  itemSub: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  itemPrice: {
    color: palette.text,
    fontWeight: '800',
  },
  taxLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
  },
  taxLabel: {
    color: '#92400e',
    fontWeight: '800',
  },
  taxValue: {
    color: '#92400e',
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: palette.emerald,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  lightButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ffedd5',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: 'center',
  },
  lightButtonText: {
    color: '#c2410c',
    fontWeight: '900',
  },
  reviewButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: palette.emeraldDark,
    fontWeight: '900',
  },
  reviewCard: {
    gap: 10,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ratingText: {
    color: '#92400e',
    fontWeight: '900',
    fontSize: 12,
  },
  reviewComment: {
    color: '#475569',
    lineHeight: 21,
  },
  deleteLink: {
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: palette.red,
    fontWeight: '900',
  },
  profileCard: {
    marginHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: palette.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  profileName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  profileEmail: {
    color: palette.muted,
    marginTop: 3,
  },
  editButton: {
    marginTop: 16,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '86%',
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalSub: {
    color: palette.muted,
    marginBottom: 12,
  },
  productPick: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  productPickActive: {
    backgroundColor: palette.emerald,
    borderColor: palette.emerald,
  },
  productPickText: {
    color: '#475569',
    fontWeight: '800',
  },
  productPickTextActive: {
    color: '#fff',
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  star: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    color: palette.muted,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '900',
  },
  starActive: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  reason: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reasonActive: {
    borderColor: '#fb923c',
    backgroundColor: '#fff7ed',
  },
  reasonText: {
    color: '#475569',
    fontWeight: '800',
  },
  reasonTextActive: {
    color: '#c2410c',
  },
});
