import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/providers/CartProvider';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, totalPrice, withholdingTax } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items first.');
      return;
    }
    router.push('/checkout' as any);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ fontSize: 24 }}>🥬</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.farmerName}>{item.farmer_name}</Text>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>₺{item.price} / kg</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => removeItem(item.product_id)} style={styles.removeBtn}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
        
        <View style={styles.quantityControl}>
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
          >
            <Minus size={16} color="#4b5563" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
          >
            <Plus size={16} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₺{totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Withholding Tax (4%)</Text>
            <Text style={styles.summaryValue}>₺{withholdingTax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₺{totalPrice.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  removeBtn: {
    padding: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10b981',
  },
  checkoutBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
