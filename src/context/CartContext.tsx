"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

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
  addItem: (item: Omit<CartItem, "id">) => void;
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
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        setUserRole(prof?.role || null);
      }
    };
    init();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setUserRole(prof?.role || null);
      } else {
        setUserRole(null);
      }
    });

    const saved = localStorage.getItem("kirsof-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("kirsof-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }
    if (userRole === "farmer") {
      toast.error("Farmers cannot purchase products. Switch to a consumer account.");
      return;
    }
    if (userRole === "admin") {
      toast.error("Admin accounts cannot purchase products.");
      return;
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
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
    if (wasAdded) {
      toast.success(`${item.name} added to cart!`);
    }
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const item = prev.find(i => i.product_id === productId);
      if (item) toast.success(`${item.name} removed from cart`);
      return prev.filter((i) => i.product_id !== productId);
    });
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
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
