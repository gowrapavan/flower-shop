"use client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext"; // Import Auth
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { ShoppingBag, Check, Plus, Minus, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ClientAddToCart({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { user } = useAuth(); // Get user status
  const router = useRouter();
  
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to add items to your cart");
      router.push('/account');
      return;
    }

    addToCart(product, qty);
    setIsAdded(true);
    toast.success(`${product.name} added to cart!`);
    
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
      <div className="flex items-center border border-gray-300 rounded-sm h-12">
        <button 
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="px-4 text-gray-500 hover:text-black hover:bg-gray-100 h-full transition"
        >
          <Minus size={14} />
        </button>
        <span className="w-12 text-center font-bold text-sm">{qty}</span>
        <button 
          onClick={() => setQty(qty + 1)}
          className="px-4 text-gray-500 hover:text-black hover:bg-gray-100 h-full transition"
        >
          <Plus size={14} />
        </button>
      </div>

      <button 
        onClick={handleAddToCart}
        disabled={isAdded}
        className={`flex-1 h-12 px-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-300 ${
          !user 
            ? "bg-gray-200 text-gray-500 hover:bg-gray-300" 
            : isAdded 
              ? "bg-floral-green text-white cursor-default" 
              : "bg-black text-white hover:bg-floral-magenta"
        }`}
      >
        {!user ? (
          <>
            <Lock size={16} /> Login to Add
          </>
        ) : isAdded ? (
          <>
            <Check size={16} /> Added to Cart
          </>
        ) : (
          <>
            <ShoppingBag size={16} /> Add to Cart
          </>
        )}
      </button>
    </div>
  );
}