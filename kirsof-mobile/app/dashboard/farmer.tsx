import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Store } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import {
  CATEGORIES,
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

export default function FarmerDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'add' | 'profile'>('overview');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pCat, setPCat] = useState('fruits');
  const [pImg, setPImg] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.replace('/(auth)/login');
      return;
    }
    setUser(authUser);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (!prof || prof.role !== 'farmer') {
      router.replace('/dashboard' as any);
      return;
    }

    setProfile(prof);
    setFullName(prof.full_name || '');
    setPhone(phoneToDisplay(prof.phone));
    setAddress(prof.address || '');
    setLat(prof.location_lat ? String(prof.location_lat) : '');
    setLng(prof.location_lng ? String(prof.location_lng) : '');

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', authUser.id)
      .order('created_at', { ascending: false });
    setProducts(prods || []);

    const { data: oi } = await supabase
      .from('order_items')
      .select('*, orders(id, status, return_reason, buyer_id, delivery_method, created_at, total_amount), products(name, image_url)')
      .eq('farmer_id', authUser.id)
      .order('created_at', { ascending: false });
    setOrderItems(oi || []);

    const { data: revs } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name), products(name)')
      .eq('farmer_id', authUser.id)
      .order('created_at', { ascending: false });
    setReviews(revs || []);
    setLoading(false);
  }

  function resetProductForm() {
    setEditingProduct(null);
    setPName('');
    setPDesc('');
    setPPrice('');
    setPStock('');
    setPCat('fruits');
    setPImg('');
  }

  function startEditProduct(product: any) {
    setEditingProduct(product);
    setPName(product.name || '');
    setPDesc(product.description || '');
    setPPrice(String(product.price ?? ''));
    setPStock(String(product.stock_quantity ?? ''));
    setPCat(product.category || 'fruits');
    setPImg(product.image_url || '');
    setTab('add');
  }

  async function saveProduct() {
    if (!user) return;
    const price = Number(pPrice);
    const stock = Number.parseInt(pStock, 10);
    if (!pName.trim() || Number.isNaN(price) || Number.isNaN(stock)) {
      Alert.alert('Missing details', 'Product name, price, and stock are required.');
      return;
    }
    setSavingProduct(true);
    const payload = {
      name: pName.trim(),
      description: pDesc.trim() || null,
      price,
      stock_quantity: stock,
      category: pCat,
      image_url: pImg.trim() || null,
      farmer_id: user.id,
    };
    const result = editingProduct
      ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
      : await supabase.from('products').insert(payload);
    setSavingProduct(false);
    if (result.error) {
      Alert.alert('Product error', result.error.message);
      return;
    }
    resetProductForm();
    setTab('products');
    fetchAll();
  }

  async function deleteProduct(productId: string) {
    Alert.alert('Delete product?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', productId);
          if (error) Alert.alert('Product error', error.code === '23503' ? 'This product has existing orders.' : error.message);
          else fetchAll();
        },
      },
    ]);
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) Alert.alert('Order error', error.message);
    else fetchAll();
  }

  async function saveProfile() {
    if (!user) return;
    const rawLat = parseNumber(lat);
    const rawLng = parseNumber(lng);
    const hasCoords = rawLat !== null && rawLng !== null;
    setSavingProfile(true);
    const updates = {
      full_name: fullName,
      phone: phone ? extractPhoneDigits(phone) : null,
      address,
      location_lat: hasCoords ? rawLat : null,
      location_lng: hasCoords ? rawLng : null,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    setSavingProfile(false);
    if (error) Alert.alert('Profile error', error.message);
    else {
      setProfile({ ...profile, ...updates });
      setEditProfile(false);
    }
  }

  const groupedOrders = useMemo(() => {
    const map: Record<string, { order: any; items: any[] }> = {};
    orderItems.forEach((item) => {
      if (!item.orders) return;
      if (!map[item.orders.id]) map[item.orders.id] = { order: item.orders, items: [] };
      map[item.orders.id].items.push(item);
    });
    return Object.values(map).sort(
      (a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
    );
  }, [orderItems]);

  if (loading) return <LoadingState label="Loading farmer dashboard..." />;

  const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const totalTax = totalRevenue * 0.04;
  const netIncome = totalRevenue - totalTax;
  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : 'None';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerPad}>
          <BackHeader
            title="Farmer Dashboard"
            subtitle="Manage your store, orders, and profile"
            right={
              <TouchableOpacity
                style={styles.addRound}
                onPress={() => {
                  resetProductForm();
                  setTab('add');
                }}
              >
                <Plus size={22} color="#fff" />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={styles.tabsWrap}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'products', label: 'Products' },
              { value: 'orders', label: 'Orders' },
              { value: 'add', label: editingProduct ? 'Edit' : 'Add' },
              { value: 'profile', label: 'Profile' },
            ]}
          />
        </View>

        {tab === 'overview' ? (
          <OverviewTab
            products={products}
            groupedOrders={groupedOrders}
            reviews={reviews}
            totalRevenue={totalRevenue}
            totalTax={totalTax}
            netIncome={netIncome}
            avgRating={avgRating}
          />
        ) : null}
        {tab === 'products' ? (
          <ProductsTab products={products} onAdd={() => setTab('add')} onEdit={startEditProduct} onDelete={deleteProduct} />
        ) : null}
        {tab === 'orders' ? (
          <OrdersTab groupedOrders={groupedOrders} onStatus={updateOrderStatus} />
        ) : null}
        {tab === 'add' ? (
          <ProductForm
            editingProduct={editingProduct}
            pName={pName}
            setPName={setPName}
            pDesc={pDesc}
            setPDesc={setPDesc}
            pPrice={pPrice}
            setPPrice={setPPrice}
            pStock={pStock}
            setPStock={setPStock}
            pCat={pCat}
            setPCat={setPCat}
            pImg={pImg}
            setPImg={setPImg}
            saving={savingProduct}
            onSave={saveProduct}
            onCancel={() => {
              resetProductForm();
              setTab('products');
            }}
          />
        ) : null}
        {tab === 'profile' ? (
          <ProfileTab
            profile={profile}
            email={user?.email || ''}
            edit={editProfile}
            setEdit={setEditProfile}
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
            saving={savingProfile}
            onSave={saveProfile}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function OverviewTab(props: {
  products: any[];
  groupedOrders: { order: any; items: any[] }[];
  reviews: any[];
  totalRevenue: number;
  totalTax: number;
  netIncome: number;
  avgRating: string;
}) {
  return (
    <View style={styles.body}>
      <View style={styles.stats}>
        <StatCard label="Products" value={props.products.length} />
        <StatCard label="Orders" value={props.groupedOrders.length} tone={palette.blue} />
        <StatCard label="Revenue" value={money(props.totalRevenue)} tone={palette.emeraldDark} />
        <StatCard label="Tax" value={money(props.totalTax)} tone="#b45309" />
        <StatCard label="Net Income" value={money(props.netIncome)} tone={palette.emeraldDark} />
        <StatCard label="Avg Rating" value={props.avgRating} tone="#b45309" />
      </View>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {props.groupedOrders.length === 0 ? (
          <Text style={styles.muted}>No orders yet.</Text>
        ) : (
          props.groupedOrders.slice(0, 5).map(({ order, items }) => (
            <View key={order.id} style={styles.miniRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{items.map((item) => item.products?.name).join(', ')}</Text>
                <Text style={styles.itemSub}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
              <StatusPill status={order.status} />
            </View>
          ))
        )}
      </Card>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Latest Reviews</Text>
        {props.reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet.</Text>
        ) : (
          props.reviews.slice(0, 4).map((review) => (
            <View key={review.id} style={styles.reviewBlock}>
              <Text style={styles.itemName}>{review.profiles?.full_name || 'Customer'} on {review.products?.name}</Text>
              <Text style={styles.itemSub}>{review.rating}/5</Text>
              <Text style={styles.reviewText}>{review.comment}</Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function ProductsTab({ products, onAdd, onEdit, onDelete }: {
  products: any[];
  onAdd: () => void;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}) {
  if (products.length === 0) {
    return <EmptyState title="No products yet" subtitle="List your first product to start receiving orders." actionLabel="Add Product" onAction={onAdd} />;
  }
  return (
    <View style={styles.body}>
      {products.map((product) => (
        <Card key={product.id} style={styles.productCard}>
          <ProductThumb uri={product.image_url} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemSub}>{product.category || 'uncategorized'} - Stock {product.stock_quantity}</Text>
            <Text style={styles.price}>{money(product.price)}</Text>
          </View>
          <View style={styles.verticalActions}>
            <TouchableOpacity style={styles.smallAction} onPress={() => onEdit(product)}>
              <Text style={styles.smallActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteAction} onPress={() => onDelete(product.id)}>
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

function OrdersTab({ groupedOrders, onStatus }: {
  groupedOrders: { order: any; items: any[] }[];
  onStatus: (id: string, status: string) => void;
}) {
  if (groupedOrders.length === 0) {
    return <EmptyState title="No orders yet" subtitle="When customers buy your products, orders appear here." />;
  }
  return (
    <View style={styles.body}>
      {groupedOrders.map(({ order, items }) => {
        const orderTotal = items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0);
        return (
          <Card key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.smallLabel}>ORDER</Text>
                <Text style={styles.orderId}>#{shortId(order.id)}</Text>
              </View>
              <StatusPill status={order.status} />
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.miniRow}>
                <ProductThumb uri={item.products?.image_url} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.products?.name}</Text>
                  <Text style={styles.itemSub}>{item.quantity} x {money(item.unit_price)}</Text>
                </View>
                <Text style={styles.itemName}>{money(item.unit_price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.taxRow}>
              <Text style={styles.taxText}>Tax withheld: {money(orderTotal * 0.04)}</Text>
              <Text style={styles.netText}>You receive: {money(orderTotal * 0.96)}</Text>
            </View>
            {order.return_reason ? <Text style={styles.returnReason}>Return: {order.return_reason}</Text> : null}
            <View style={styles.actionRow}>
              {order.status === 'paid' ? (
                <PrimaryButton label="Mark Shipped" onPress={() => onStatus(order.id, 'shipped')} style={styles.flexButton} />
              ) : null}
              {order.status === 'shipped' ? (
                <PrimaryButton label="Mark Completed" onPress={() => onStatus(order.id, 'completed')} style={styles.flexButton} />
              ) : null}
              {order.status === 'return_requested' ? (
                <>
                  <PrimaryButton label="Approve Return" tone="amber" onPress={() => onStatus(order.id, 'returned')} style={styles.flexButton} />
                  <PrimaryButton label="Admin Review" tone="purple" onPress={() => onStatus(order.id, 'admin_review')} style={styles.flexButton} />
                </>
              ) : null}
              {order.status === 'paid' || order.status === 'shipped' ? (
                <PrimaryButton label="Cancel" tone="danger" onPress={() => onStatus(order.id, 'canceled')} style={styles.flexButton} />
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function ProductForm(props: {
  editingProduct: any;
  pName: string;
  setPName: (value: string) => void;
  pDesc: string;
  setPDesc: (value: string) => void;
  pPrice: string;
  setPPrice: (value: string) => void;
  pStock: string;
  setPStock: (value: string) => void;
  pCat: string;
  setPCat: (value: string) => void;
  pImg: string;
  setPImg: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>{props.editingProduct ? 'Edit Product' : 'Add New Product'}</Text>
      <Input label="Product Name" value={props.pName} onChangeText={props.setPName} placeholder="Organic tomatoes" />
      <Input label="Description" value={props.pDesc} onChangeText={props.setPDesc} multiline placeholder="Describe your product..." />
      <View style={styles.coordRow}>
        <Input label="Price" value={props.pPrice} onChangeText={props.setPPrice} keyboardType="decimal-pad" style={{ flex: 1 }} />
        <Input label="Stock" value={props.pStock} onChangeText={props.setPStock} keyboardType="number-pad" style={{ flex: 1 }} />
      </View>
      <Text style={styles.inputLabel}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {CATEGORIES.filter((item) => item.value).map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.categoryChip, props.pCat === item.value && styles.categoryChipActive]}
            onPress={() => props.setPCat(item.value)}
          >
            <Text style={[styles.categoryText, props.pCat === item.value && styles.categoryTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Input label="Image URL" value={props.pImg} onChangeText={props.setPImg} placeholder="https://..." />
      <View style={styles.actionRow}>
        <PrimaryButton label={props.saving ? 'Saving...' : props.editingProduct ? 'Update Product' : 'Add Product'} onPress={props.onSave} disabled={props.saving} style={{ flex: 1 }} />
        <PrimaryButton label="Cancel" tone="light" onPress={props.onCancel} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

function ProfileTab(props: {
  profile: any;
  email: string;
  edit: boolean;
  setEdit: (value: boolean) => void;
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
  if (props.edit) {
    return (
      <Card style={styles.formCard}>
        <Input label="Full Name" value={props.fullName} onChangeText={props.setFullName} />
        <Input label="Phone" value={props.phone} onChangeText={(value) => props.setPhone(formatTurkishPhone(value))} keyboardType="phone-pad" />
        <Input label="Farm Address" value={props.address} onChangeText={props.setAddress} multiline />
        <View style={styles.coordRow}>
          <Input label="Latitude" value={props.lat} onChangeText={props.setLat} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Input label="Longitude" value={props.lng} onChangeText={props.setLng} keyboardType="decimal-pad" style={{ flex: 1 }} />
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton label={props.saving ? 'Saving...' : 'Save Profile'} onPress={props.onSave} disabled={props.saving} style={{ flex: 1 }} />
          <PrimaryButton label="Cancel" tone="light" onPress={() => props.setEdit(false)} style={{ flex: 1 }} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.formCard}>
      <View style={styles.profileHead}>
        <View style={styles.profileAvatar}>
          <Store size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{props.profile?.full_name}</Text>
          <Text style={styles.itemSub}>{props.email}</Text>
        </View>
      </View>
      <InfoRow label="Phone" value={props.profile?.phone} />
      <InfoRow label="Farm Address" value={props.profile?.address} />
      <InfoRow label="Map Coordinates" value={props.profile?.location_lat ? `${props.profile.location_lat}, ${props.profile.location_lng}` : 'Not set'} />
      <PrimaryButton label="Edit Profile" tone="light" onPress={() => props.setEdit(true)} style={{ marginTop: 16 }} />
    </Card>
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
  addRound: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    paddingHorizontal: 16,
  },
  body: {
    paddingHorizontal: 16,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  muted: {
    color: palette.muted,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
  reviewBlock: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reviewText: {
    color: '#475569',
    marginTop: 6,
    lineHeight: 20,
  },
  productCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    color: palette.emeraldDark,
    fontWeight: '900',
    marginTop: 5,
  },
  verticalActions: {
    gap: 8,
  },
  smallAction: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  smallActionText: {
    color: palette.blue,
    fontWeight: '900',
    fontSize: 12,
  },
  deleteAction: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  deleteActionText: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  smallLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  orderId: {
    color: palette.text,
    fontWeight: '900',
  },
  taxRow: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  taxText: {
    color: '#92400e',
    fontWeight: '800',
  },
  netText: {
    color: palette.emeraldDark,
    fontWeight: '900',
    marginTop: 4,
  },
  returnReason: {
    color: '#c2410c',
    backgroundColor: '#fff7ed',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  flexButton: {
    flexGrow: 1,
    minWidth: '45%',
  },
  formCard: {
    marginHorizontal: 16,
  },
  formTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: palette.emerald,
    borderColor: palette.emerald,
  },
  categoryText: {
    color: '#475569',
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#fff',
  },
  profileHead: {
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
  profileName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
});
