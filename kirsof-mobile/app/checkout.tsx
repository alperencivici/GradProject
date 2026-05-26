import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, CheckCircle, CreditCard, MapPin, Truck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { haversineKm, money, shortId } from '@/lib/format';
import { BackHeader, Card, EmptyState, Input, LoadingState, PrimaryButton, Screen, palette } from '@/components/kirsof';

function onlyDigits(value: string, max: number) {
  return value.replace(/\D/g, '').slice(0, max);
}

function formatCardNumber(value: string) {
  return onlyDigits(value, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPrice, withholdingTax, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | 'cargo'>('pickup');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [buyerProfile, setBuyerProfile] = useState<any>(null);
  const [farmerLocations, setFarmerLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [successOrder, setSuccessOrder] = useState<{ id: string; total: number; tax: number } | null>(null);

  useEffect(() => {
    loadLocations();
  }, [items, user?.id]);

  async function loadLocations() {
    if (!user) {
      setLoadingLocations(false);
      return;
    }
    setLoadingLocations(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('location_lat, location_lng, address')
      .eq('id', user.id)
      .single();
    setBuyerProfile(profile);

    const farmerIds = [...new Set(items.map((item) => item.farmer_id))];
    if (farmerIds.length > 0) {
      const { data: farmers } = await supabase
        .from('profiles')
        .select('id, location_lat, location_lng')
        .in('id', farmerIds);
      const next: Record<string, { lat: number; lng: number }> = {};
      farmers?.forEach((farmer: any) => {
        if (farmer.location_lat && farmer.location_lng) {
          next[farmer.id] = { lat: Number(farmer.location_lat), lng: Number(farmer.location_lng) };
        }
      });
      setFarmerLocations(next);
    } else {
      setFarmerLocations({});
    }
    setLoadingLocations(false);
  }

  const maxDistanceKm = useMemo(() => {
    if (!buyerProfile?.location_lat || !buyerProfile?.location_lng) return null;
    const buyerLat = Number(buyerProfile.location_lat);
    const buyerLng = Number(buyerProfile.location_lng);
    let maxDistance = 0;
    Object.values(farmerLocations).forEach((loc) => {
      const distance = haversineKm(buyerLat, buyerLng, loc.lat, loc.lng);
      if (distance > maxDistance) maxDistance = distance;
    });
    return maxDistance > 0 ? maxDistance : null;
  }, [buyerProfile, farmerLocations]);

  const cargoFee = maxDistanceKm !== null ? Math.round(10 + maxDistanceKm * 0.05) : 20;
  const courierFee = maxDistanceKm !== null ? Math.round(15 + maxDistanceKm * 0.5) : 25;
  const cargoBlocked = maxDistanceKm !== null && maxDistanceKm > 500;
  const courierBlocked = maxDistanceKm !== null && maxDistanceKm > 50;
  const effectiveDeliveryMethod =
    deliveryMethod === 'cargo' && cargoBlocked
      ? 'pickup'
      : deliveryMethod === 'courier' && courierBlocked
        ? 'pickup'
        : deliveryMethod;
  const shippingFee = effectiveDeliveryMethod === 'pickup' ? 0 : effectiveDeliveryMethod === 'courier' ? courierFee : cargoFee;
  const grandTotal = totalPrice + shippingFee;

  const placeOrder = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (items.length === 0) return;
    if (cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCVC.length < 3) {
      Alert.alert('Payment details', 'Please enter the simulated card details.');
      return;
    }

    setProcessing(true);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        status: 'paid',
        total_amount: grandTotal,
        delivery_method: effectiveDeliveryMethod,
        shipping_fee: shippingFee,
        withholding_tax: withholdingTax,
      })
      .select()
      .single();

    if (orderError || !order) {
      setProcessing(false);
      Alert.alert('Checkout error', orderError?.message || 'Could not create the order.');
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      farmer_id: item.farmer_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      setProcessing(false);
      Alert.alert('Checkout error', itemsError.message);
      return;
    }

    clearCart();
    setSuccessOrder({ id: order.id, total: grandTotal, tax: withholdingTax });
    setProcessing(false);
  };

  if (successOrder) {
    return (
      <Screen>
        <View style={styles.success}>
          <CheckCircle size={82} color={palette.emerald} />
          <Text style={styles.successTitle}>Order Confirmed</Text>
          <Text style={styles.successText}>Your order #{shortId(successOrder.id)} has been placed successfully.</Text>
          <Card style={styles.successCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>{money(successOrder.total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Withholding Tax</Text>
              <Text style={styles.taxValue}>{money(successOrder.tax)}</Text>
            </View>
          </Card>
          <PrimaryButton label="View Dashboard" onPress={() => router.push('/dashboard' as any)} style={styles.successButton} />
          <PrimaryButton label="Continue Shopping" tone="light" onPress={() => router.push('/(tabs)/explore')} style={styles.successButton} />
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <BackHeader title="Checkout" />
        <EmptyState
          title="Nothing to checkout"
          subtitle="Add fresh products to your cart first."
          actionLabel="Go to Market"
          onAction={() => router.push('/(tabs)/explore')}
        />
      </Screen>
    );
  }

  if (loadingLocations) return <LoadingState label="Calculating delivery options..." />;

  return (
    <Screen padded={false}>
      <View style={styles.headerPad}>
        <BackHeader title="Checkout" subtitle={`${items.length} item${items.length === 1 ? '' : 's'} in cart`} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Delivery Method</Text>
        {maxDistanceKm !== null ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeText}>Farthest farmer is about {Math.round(maxDistanceKm)} km from your profile location.</Text>
          </Card>
        ) : (
          <Card style={styles.noticeWarn}>
            <Text style={styles.warnText}>Set your profile coordinates for exact shipping rates.</Text>
          </Card>
        )}

        <DeliveryOption
          title="Farm Pickup"
          description="Collect from the farm"
          price="Free"
          active={effectiveDeliveryMethod === 'pickup'}
          icon={<MapPin size={24} color={effectiveDeliveryMethod === 'pickup' ? palette.emeraldDark : palette.muted} />}
          onPress={() => setDeliveryMethod('pickup')}
        />
        <DeliveryOption
          title="Kirsof Courier"
          description={courierBlocked ? 'Unavailable over 50 km' : 'Same-day local delivery'}
          price={courierBlocked ? 'Unavailable' : money(courierFee)}
          active={effectiveDeliveryMethod === 'courier'}
          disabled={courierBlocked}
          icon={<Box size={24} color={effectiveDeliveryMethod === 'courier' ? palette.emeraldDark : palette.muted} />}
          onPress={() => setDeliveryMethod('courier')}
        />
        <DeliveryOption
          title="Standard Cargo"
          description={cargoBlocked ? 'Unavailable over 500 km' : '1-3 business days'}
          price={cargoBlocked ? 'Unavailable' : money(cargoFee)}
          active={effectiveDeliveryMethod === 'cargo'}
          disabled={cargoBlocked}
          icon={<Truck size={24} color={effectiveDeliveryMethod === 'cargo' ? palette.emeraldDark : palette.muted} />}
          onPress={() => setDeliveryMethod('cargo')}
        />

        <Text style={styles.sectionTitle}>Payment Details</Text>
        <Card>
          <View style={styles.paymentTitle}>
            <CreditCard size={20} color={palette.emeraldDark} />
            <Text style={styles.paymentText}>Simulated payment, no real charge is made.</Text>
          </View>
          <Input
            label="Card Number"
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={(value) => setCardNumber(formatCardNumber(value))}
            maxLength={19}
          />
          <View style={styles.cardInputs}>
            <Input
              label="Expiry"
              placeholder="MM/YY"
              keyboardType="number-pad"
              value={cardExpiry}
              onChangeText={(value) => setCardExpiry(formatExpiry(value))}
              maxLength={5}
              style={{ flex: 1 }}
            />
            <Input
              label="CVC"
              placeholder="123"
              keyboardType="number-pad"
              value={cardCVC}
              onChangeText={(value) => setCardCVC(onlyDigits(value, 3))}
              maxLength={3}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Card style={styles.summary}>
          {items.map((item) => (
            <View key={item.product_id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>{money(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{money(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping ({effectiveDeliveryMethod})</Text>
            <Text style={styles.summaryValue}>{shippingFee === 0 ? 'Free' : money(shippingFee)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Withholding Tax (4%)</Text>
            <Text style={styles.taxValue}>{money(withholdingTax)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(grandTotal)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={processing ? 'Processing...' : `Pay ${money(grandTotal)}`}
          onPress={placeOrder}
          disabled={processing}
        />
      </View>
    </Screen>
  );
}

function DeliveryOption({
  title,
  description,
  price,
  active,
  disabled,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.deliveryOption, active && styles.deliveryActive, disabled && styles.deliveryDisabled]}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={[styles.deliveryTitle, active && styles.deliveryTitleActive]}>{title}</Text>
        <Text style={styles.deliveryDesc}>{description}</Text>
      </View>
      <Text style={disabled ? styles.unavailable : styles.deliveryPrice}>{price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 118,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 8,
  },
  notice: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  noticeWarn: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    marginBottom: 12,
  },
  noticeText: {
    color: '#1d4ed8',
    lineHeight: 20,
    fontWeight: '700',
  },
  warnText: {
    color: '#92400e',
    lineHeight: 20,
    fontWeight: '700',
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eef2f1',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },
  deliveryActive: {
    backgroundColor: '#ecfdf5',
    borderColor: palette.emerald,
  },
  deliveryDisabled: {
    opacity: 0.55,
  },
  deliveryTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  deliveryTitleActive: {
    color: palette.emeraldDark,
  },
  deliveryDesc: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  deliveryPrice: {
    color: palette.text,
    fontWeight: '900',
  },
  unavailable: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12,
  },
  paymentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  paymentText: {
    color: palette.muted,
    flex: 1,
    lineHeight: 19,
  },
  cardInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  summary: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    color: '#475569',
  },
  itemPrice: {
    color: palette.text,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#eef2f1',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#475569',
  },
  summaryValue: {
    color: palette.text,
    fontWeight: '900',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  taxLabel: {
    color: '#92400e',
    fontWeight: '800',
  },
  taxValue: {
    color: '#92400e',
    fontWeight: '900',
  },
  totalLabel: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  totalValue: {
    color: palette.emeraldDark,
    fontSize: 20,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingBottom: 30,
  },
  success: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  successText: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  successCard: {
    width: '100%',
    marginTop: 22,
    marginBottom: 12,
  },
  successButton: {
    width: '100%',
    marginTop: 10,
  },
});
