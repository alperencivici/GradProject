import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, ORDER_STATUSES, money, parseNumber, roleColors, shortId } from '@/lib/format';
import {
  BackHeader,
  Card,
  EmptyState,
  Input,
  LoadingState,
  PrimaryButton,
  ProductThumb,
  RolePill,
  Screen,
  StatCard,
  StatusPill,
  Tabs,
  palette,
} from '@/components/kirsof';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'products' | 'orders' | 'reviews'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!prof || prof.role !== 'admin') {
      router.replace('/dashboard' as any);
      return;
    }

    const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: allProducts } = await supabase
      .from('products')
      .select('*, profiles!products_farmer_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*, profiles!orders_buyer_id_fkey(full_name), order_items(quantity, unit_price)')
      .order('created_at', { ascending: false });
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name), products(name)')
      .order('created_at', { ascending: false });

    setUsers(allUsers || []);
    setProducts(allProducts || []);
    setOrders(allOrders || []);
    setReviews(allReviews || []);
    setLoading(false);
  }

  async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) Alert.alert('Order error', error.message);
    else setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
  }

  async function deleteProduct(id: string) {
    Alert.alert('Delete product?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) Alert.alert('Product error', error.message);
          else setProducts((current) => current.filter((product) => product.id !== id));
        },
      },
    ]);
  }

  async function deleteReview(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) Alert.alert('Review error', error.message);
    else setReviews((current) => current.filter((review) => review.id !== id));
  }

  async function saveUser(updates: any) {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', editingUser.id);
    if (error) {
      Alert.alert('User error', error.message);
      return;
    }
    setUsers((current) => current.map((user) => (user.id === editingUser.id ? { ...user, ...updates } : user)));
    setEditingUser(null);
  }

  async function deleteAccount(targetUser: any) {
    Alert.alert('Delete account?', `Delete ${targetUser.full_name || 'this user'} and related auth data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('admin_delete_user', { p_user_id: targetUser.id });
          if (error) Alert.alert('Delete error', error.message);
          else {
            setUsers((current) => current.filter((user) => user.id !== targetUser.id));
            setEditingUser(null);
          }
        },
      },
    ]);
  }

  async function saveProduct(updates: any) {
    if (!editingProduct) return;
    const { error } = await supabase.from('products').update(updates).eq('id', editingProduct.id);
    if (error) {
      Alert.alert('Product error', error.message);
      return;
    }
    setProducts((current) => current.map((product) => (product.id === editingProduct.id ? { ...product, ...updates } : product)));
    setEditingProduct(null);
  }

  if (loading) return <LoadingState label="Loading admin panel..." />;

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalTax = orders.reduce((sum, order) => sum + Number(order.withholding_tax || 0), 0);
  const farmerCount = users.filter((user) => user.role === 'farmer').length;
  const consumerCount = users.filter((user) => user.role === 'consumer').length;
  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.phone?.includes(userSearch) ||
      user.address?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerPad}>
          <BackHeader title="Admin Panel" subtitle="Platform overview and management" />
        </View>

        <View style={styles.tabsWrap}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'users', label: 'Users' },
              { value: 'products', label: 'Products' },
              { value: 'orders', label: 'Orders' },
              { value: 'reviews', label: 'Reviews' },
            ]}
          />
        </View>

        {tab === 'overview' ? (
          <OverviewTab
            users={users}
            products={products}
            orders={orders}
            reviews={reviews}
            farmerCount={farmerCount}
            consumerCount={consumerCount}
            totalRevenue={totalRevenue}
            totalTax={totalTax}
          />
        ) : null}
        {tab === 'users' ? (
          <UsersTab users={filteredUsers} search={userSearch} setSearch={setUserSearch} onEdit={setEditingUser} />
        ) : null}
        {tab === 'products' ? (
          <ProductsTab products={products} onEdit={setEditingProduct} onDelete={deleteProduct} />
        ) : null}
        {tab === 'orders' ? (
          <OrdersTab orders={orders} onStatus={updateOrderStatus} />
        ) : null}
        {tab === 'reviews' ? (
          <ReviewsTab reviews={reviews} onDelete={deleteReview} />
        ) : null}
      </ScrollView>

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={saveUser} onDelete={deleteAccount} />
      <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={saveProduct} />
    </Screen>
  );
}

function OverviewTab(props: {
  users: any[];
  products: any[];
  orders: any[];
  reviews: any[];
  farmerCount: number;
  consumerCount: number;
  totalRevenue: number;
  totalTax: number;
}) {
  return (
    <View style={styles.body}>
      <View style={styles.stats}>
        <StatCard label="Users" value={props.users.length} />
        <StatCard label="Farmers" value={props.farmerCount} tone={palette.emeraldDark} />
        <StatCard label="Consumers" value={props.consumerCount} tone={palette.blue} />
        <StatCard label="Products" value={props.products.length} />
        <StatCard label="Orders" value={props.orders.length} tone="#b45309" />
        <StatCard label="Revenue" value={money(props.totalRevenue)} tone={palette.emeraldDark} />
      </View>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
        <SummaryRow label="Gross Revenue" value={money(props.totalRevenue)} />
        <SummaryRow label="Total Tax Collected" value={money(props.totalTax)} tone="#92400e" />
        <SummaryRow label="Paid to Farmers" value={money(props.totalRevenue - props.totalTax)} tone={palette.emeraldDark} />
      </Card>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Returns Awaiting Admin Review</Text>
        {props.orders.filter((order) => order.status === 'admin_review').length === 0 ? (
          <Text style={styles.muted}>No return requests need admin review.</Text>
        ) : (
          props.orders.filter((order) => order.status === 'admin_review').map((order) => (
            <View key={order.id} style={styles.reviewLine}>
              <Text style={styles.itemName}>#{shortId(order.id)}</Text>
              <Text style={styles.itemSub}>{order.return_reason || 'No reason provided'}</Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function UsersTab({ users, search, setSearch, onEdit }: {
  users: any[];
  search: string;
  setSearch: (value: string) => void;
  onEdit: (user: any) => void;
}) {
  return (
    <View style={styles.body}>
      <Input value={search} onChangeText={setSearch} placeholder="Search users..." />
      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        users.map((user) => (
          <Card key={user.id} style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.full_name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{user.full_name || 'Unnamed user'}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{user.address || 'No address'}</Text>
              <View style={styles.userMeta}>
                <RolePill role={user.role} />
                <Text style={styles.phoneText}>{user.phone || 'No phone'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(user)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </View>
  );
}

function ProductsTab({ products, onEdit, onDelete }: {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.body}>
      {products.map((product) => (
        <Card key={product.id} style={styles.productCard}>
          <ProductThumb uri={product.image_url} size={58} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemSub}>{product.profiles?.full_name || 'Farmer'} - {product.category}</Text>
            <Text style={styles.price}>{money(product.price)} / stock {product.stock_quantity}</Text>
          </View>
          <View style={styles.verticalActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(product)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(product.id)}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

function OrdersTab({ orders, onStatus }: { orders: any[]; onStatus: (id: string, status: string) => void }) {
  return (
    <View style={styles.body}>
      {orders.map((order) => (
        <Card key={order.id} style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View>
              <Text style={styles.smallLabel}>ORDER</Text>
              <Text style={styles.itemName}>#{shortId(order.id)}</Text>
              <Text style={styles.itemSub}>{order.profiles?.full_name || 'Customer'} - {new Date(order.created_at).toLocaleDateString()}</Text>
            </View>
            <StatusPill status={order.status} />
          </View>
          {order.return_reason ? <Text style={styles.returnReason}>Return: {order.return_reason}</Text> : null}
          <Text style={styles.totalText}>{money(order.total_amount)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {ORDER_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusChoice, order.status === status && styles.statusChoiceActive]}
                onPress={() => onStatus(order.id, status)}
              >
                <Text style={[styles.statusChoiceText, order.status === status && styles.statusChoiceTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {order.status === 'admin_review' ? (
            <View style={styles.actionRow}>
              <PrimaryButton label="Approve Return" tone="purple" onPress={() => onStatus(order.id, 'returned')} style={{ flex: 1 }} />
              <PrimaryButton label="Reject Return" tone="light" onPress={() => onStatus(order.id, 'completed')} style={{ flex: 1 }} />
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function ReviewsTab({ reviews, onDelete }: { reviews: any[]; onDelete: (id: string) => void }) {
  return (
    <View style={styles.body}>
      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        reviews.map((review) => (
          <Card key={review.id} style={styles.sectionCard}>
            <View style={styles.orderTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{review.profiles?.full_name || 'Customer'} on {review.products?.name}</Text>
                <Text style={styles.itemSub}>{review.rating}/5 - {new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => onDelete(review.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewText}>{review.comment}</Text>
          </Card>
        ))
      )}
    </View>
  );
}

function SummaryRow({ label, value, tone = palette.text }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.summaryValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function EditUserModal({ user, onClose, onSave, onDelete }: {
  user: any;
  onClose: () => void;
  onSave: (updates: any) => void;
  onDelete: (user: any) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [role, setRole] = useState('consumer');

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setLat(user.location_lat ? String(user.location_lat) : '');
    setLng(user.location_lng ? String(user.location_lng) : '');
    setRole(user.role || 'consumer');
  }, [user]);

  const submit = () => {
    const rawLat = parseNumber(lat);
    const rawLng = parseNumber(lng);
    const hasCoords = rawLat !== null && rawLng !== null;
    onSave({
      full_name: fullName,
      phone,
      address,
      role,
      location_lat: hasCoords ? rawLat : null,
      location_lng: hasCoords ? rawLng : null,
    });
  };

  return (
    <Modal visible={!!user} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit User</Text>
          <Input label="Full Name" value={fullName} onChangeText={setFullName} />
          <Input label="Phone" value={phone} onChangeText={setPhone} />
          <Input label="Address" value={address} onChangeText={setAddress} multiline />
          <View style={styles.coordRow}>
            <Input label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Input label="Longitude" value={lng} onChangeText={setLng} keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>
          <View style={styles.roleRow}>
            {['consumer', 'farmer', 'admin'].map((item) => {
              const colors = roleColors(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.roleChoice, role === item && { backgroundColor: colors.bg, borderColor: colors.border }]}
                  onPress={() => setRole(item)}
                >
                  <Text style={[styles.roleText, role === item && { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.actionRow}>
            <PrimaryButton label="Save" onPress={submit} style={{ flex: 1 }} />
            <PrimaryButton label="Cancel" tone="light" onPress={onClose} style={{ flex: 1 }} />
          </View>
          <PrimaryButton label="Delete Account" tone="danger" onPress={() => onDelete(user)} style={{ marginTop: 10 }} />
        </Card>
      </View>
    </Modal>
  );
}

function EditProductModal({ product, onClose, onSave }: {
  product: any;
  onClose: () => void;
  onSave: (updates: any) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('fruits');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!product) return;
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(String(product.price ?? ''));
    setStock(String(product.stock_quantity ?? ''));
    setCategory(product.category || 'fruits');
    setImageUrl(product.image_url || '');
  }, [product]);

  const submit = () => {
    const parsedPrice = Number(price);
    const parsedStock = Number.parseInt(stock, 10);
    if (!name.trim() || Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
      Alert.alert('Missing details', 'Name, price, and stock are required.');
      return;
    }
    onSave({
      name,
      description,
      price: parsedPrice,
      stock_quantity: parsedStock,
      category,
      image_url: imageUrl || null,
    });
  };

  return (
    <Modal visible={!!product} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Product</Text>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline />
          <View style={styles.coordRow}>
            <Input label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Input label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORIES.filter((item) => item.value).map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.categoryChip, category === item.value && styles.categoryChipActive]}
                onPress={() => setCategory(item.value)}
              >
                <Text style={[styles.categoryText, category === item.value && styles.categoryTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Input label="Image URL" value={imageUrl} onChangeText={setImageUrl} />
          <View style={styles.actionRow}>
            <PrimaryButton label="Save" onPress={submit} style={{ flex: 1 }} />
            <PrimaryButton label="Cancel" tone="light" onPress={onClose} style={{ flex: 1 }} />
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  summaryValue: {
    fontWeight: '900',
  },
  reviewLine: {
    paddingVertical: 9,
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
  userCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  phoneText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    color: palette.blue,
    fontWeight: '900',
    fontSize: 12,
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
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonText: {
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
  },
  smallLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  returnReason: {
    color: '#c2410c',
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  totalText: {
    color: palette.emeraldDark,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  statusChoice: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  statusChoiceActive: {
    backgroundColor: palette.emerald,
    borderColor: palette.emerald,
  },
  statusChoiceText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  statusChoiceTextActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  reviewText: {
    color: '#475569',
    lineHeight: 20,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '88%',
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleText: {
    color: '#475569',
    fontWeight: '900',
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
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
});
