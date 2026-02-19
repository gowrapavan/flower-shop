"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBasket, ArrowRight, ShoppingBag, CreditCard } from "lucide-react";

export default function CartClient() {
  const { cart, cartTotal } = useCart();
  const router = useRouter();

  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 font-sans px-4 text-center">
      <div className="bg-pink-50 p-8 rounded-full">
        <ShoppingBasket size={64} className="text-floral-magenta opacity-40" />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 max-w-xs mx-auto text-sm">Looks like you haven't added any beautiful flowers to your cart yet.</p>
      </div>
      <Link 
        href="/shop" 
        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-floral-magenta transition-all"
      >
        Start Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 font-sans">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <ShoppingBag className="text-floral-magenta" size={28} />
        <h1 className="font-serif text-3xl font-bold text-gray-900">Shopping Cart</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item: any) => (
            <div key={item.id} className="flex gap-4 border border-gray-100 p-4 rounded-xl items-center bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image src={item.images[0]} alt={item.name} fill className="object-cover rounded-lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">{item.name}</h3>
                <p className="text-xs text-gray-400 mb-1">{item.category}</p>
                <p className="text-floral-magenta font-bold">₹{(item.price - (item.price * (item.discount || 0) / 100)).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 px-4">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Quantity</span>
                 <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">x{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-8 rounded-2xl h-fit border border-gray-100 shadow-lg sticky top-24">
          <h3 className="font-serif text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
            <開CreditCard size={20} className="text-floral-magenta" /> Summary
          </h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Shipping</span>
              <span className="text-green-600 font-bold uppercase text-[10px]">Calculated at checkout</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-100">
              <span className="text-gray-900">Total</span>
              <span className="text-floral-magenta text-2xl">₹{cartTotal}</span>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/checkout')}
            className="w-full bg-floral-magenta text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-md hover:bg-pink-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Checkout Now <ArrowRight size={18} />
          </button>
          
          <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-tighter">
            Secure checkout powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}