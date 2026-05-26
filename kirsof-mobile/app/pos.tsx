import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function POSScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isSimulatingNFC, setIsSimulatingNFC] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (user) fetchMyProducts();
  }, [user]);

  async function fetchMyProducts() {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', user?.id)
      .gt('stock_quantity', 0)
      .order('name');
    
    setProducts(data || []);
    setLoading(false);
  }

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  // Calculate totals
  const subtotal = products.reduce((sum, p) => {
    const qty = cart[p.id] || 0;
    return sum + (p.price * qty);
  }, 0);
  
  const withholdingTax = subtotal * 0.04;
  const total = subtotal; // Assuming stopaj is deducted from the subtotal internally, but the customer pays subtotal. Actually, the customer pays the listed price, the farmer receives price - stopaj. So customer pays `subtotal`.

  const handleNFCScan = async () => {
    if (subtotal === 0) {
      Alert.alert('Empty Cart', 'Add items to the POS terminal before charging.');
      return;
    }

    setIsSimulatingNFC(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate waiting for NFC tap
    setTimeout(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSimulatingNFC(false);
      setPaymentSuccess(true);
      await processTransaction();
    }, 3000);
  };

  const processTransaction = async () => {
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user?.id,
          total_amount: subtotal,
          delivery_method: 'pickup',
          status: 'completed',
          withholding_tax: withholdingTax,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items & Deduct Stock
      for (const [productId, qty] of Object.entries(cart)) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: productId,
          farmer_id: user?.id,
          quantity: qty,
          unit_price: product.price,
        });
      }

    } catch (error) {
      console.error('Transaction processing error:', error);
      Alert.alert('Database Sync Error', 'Payment succeeded but failed to sync stock.');
    }
  };

  const resetPOS = () => {
    setCart({});
    setPaymentSuccess(false);
    fetchMyProducts();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Kırsof POS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.layout}>
        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          {loading ? (
            <ActivityIndicator color="#10b981" />
          ) : (
            <FlatList
              data={products}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.productCard}
                  onPress={() => addToCart(item.id)}
                >
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>₺{item.price}</Text>
                    <Text style={styles.productStock}>Stock: {item.stock_quantity}</Text>
                  </View>
                </TouchableOpacity>
              )}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
          )}
        </View>

        {/* Current Sale (Cart) */}
        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>Current Sale</Text>
          <FlatList
            data={Object.entries(cart)}
            keyExtractor={([id]) => id}
            renderItem={({ item: [id, qty] }) => {
              const product = products.find(p => p.id === id);
              if (!product) return null;
              return (
                <View style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{product.name}</Text>
                    <Text style={styles.cartItemPrice}>₺{product.price} x {qty}</Text>
                  </View>
                  <View style={styles.cartControl}>
                    <TouchableOpacity onPress={() => removeFromCart(id)} style={styles.cartBtn}>
                      <Minus size={16} color="#4b5563" />
                    </TouchableOpacity>
                    <Text style={styles.cartQty}>{qty}</Text>
                    <TouchableOpacity onPress={() => addToCart(id)} style={styles.cartBtn}>
                      <Plus size={16} color="#4b5563" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyCartText}>Tap products to add to sale</Text>
            }
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Total:</Text>
              <Text style={styles.summaryValue}>₺{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Withholding Tax (4%):</Text>
              <Text style={styles.summaryTax}>-₺{withholdingTax.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Charge Amount:</Text>
              <Text style={styles.totalValue}>₺{total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.chargeBtn, subtotal === 0 && { opacity: 0.5 }]} 
              onPress={handleNFCScan}
              disabled={subtotal === 0}
            >
              <CreditCard color="#fff" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.chargeBtnText}>Charge ₺{total.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* NFC Simulation Modal */}
      <Modal visible={isSimulatingNFC} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CreditCard size={64} color="#10b981" />
            <Text style={styles.modalTitle}>Ready to Read</Text>
            <Text style={styles.modalDesc}>Hold the customer card or phone near the NFC reader.</Text>
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 24 }} />
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsSimulatingNFC(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={paymentSuccess} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CheckCircle size={80} color="#10b981" />
            <Text style={styles.modalTitle}>Payment Approved</Text>
            <Text style={styles.modalDesc}>Transaction successful. Stock has been updated.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={resetPOS}>
              <Text style={styles.doneBtnText}>New Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  productsSection: {
    flex: 3,
    padding: 12,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  cartSection: {
    flex: 2,
    backgroundColor: '#fff',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  productStock: {
    fontSize: 10,
    color: '#6b7280',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  cartControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  cartBtn: {
    padding: 6,
  },
  cartQty: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  summaryContainer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryTax: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10b981',
  },
  chargeBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  chargeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelBtn: {
    marginTop: 32,
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
