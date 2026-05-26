import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Alert } from 'react-native';

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  farmer_id: string;
  farmer_name: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  withholdingTax: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Load cart from storage
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem('kirsof-cart');
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    // Save cart to storage
    AsyncStorage.setItem('kirsof-cart', JSON.stringify(items)).catch(console.error);
  }, [items]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        setUserRole(data?.role || null);
      });
    } else {
      setUserRole(null);
    }
  }, [user]);

  const addItem = (item: Omit<CartItem, 'id'>): boolean => {
    if (loading) {
      Alert.alert('Please wait', 'Checking your account.');
      return false;
    }
    if (!user) {
      Alert.alert('Error', 'Please log in to add items to your cart.');
      return false;
    }
    if (userRole === 'farmer') {
      Alert.alert('Error', 'Farmers cannot purchase products. Switch to a consumer account.');
      return false;
    }

    let wasAdded = false;
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      wasAdded = true;
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id: Math.random().toString(36).substring(7) }];
    });
    
    if (wasAdded) {
      // Optional: Add a local toast or simple alert if needed
    }
    return wasAdded;
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const withholdingTax = totalPrice * 0.04; // 4% stopaj

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        withholdingTax,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
