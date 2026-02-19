"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';

interface CartItem extends Product {
  quantity: number;
}

const CartContext = createContext<any>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('flower-cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('flower-cart', JSON.stringify(cart));
  }, [cart]);

  // Sync to database silently
  const syncCartToDB = (newCart: CartItem[]) => {
    fetch('/api/user/update', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: newCart }) 
    }).catch(e => console.log("Silent cart sync failed"));
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const newCart = existing 
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { ...product, quantity }];
      
      syncCartToDB(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    syncCartToDB([]);
  };

  const cartTotal = cart.reduce((acc: number, item: any) => {
    const price = item.price - (item.price * (item.discount / 100));
    return acc + (price * item.quantity);
  }, 0).toFixed(2);

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);