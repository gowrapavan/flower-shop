"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext"; 
import { useAuth } from "@/context/AuthContext";
import { MapPin, CreditCard, CheckCircle2, AlertCircle, Home, Package } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { toast } from "react-hot-toast";

export default function CheckoutClient() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart(); 
  const { user, loadingUser } = useAuth(); 

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const isProfileComplete = !!(user?.phone && user?.address?.doorNo && user?.address?.city);

  useEffect(() => {
    if (!loadingUser && !user) {
      router.push('/account'); 
    }
  }, [user, loadingUser, router]);

  const handlePlaceOrder = async () => {
    if (!isProfileComplete) {
      toast.error("Please complete your profile first!");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart, 
          totalAmount: cartTotal
        })
      });

      const data = await res.json();

      if (res.ok) {
        clearCart(); 
        localStorage.removeItem(`flower-orders-${user?.email}`);
        setOrderSuccess(true);
        toast.success("Order placed successfully!");
      } else {
        throw new Error(data.error || "Failed to place order");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!user) return null; 

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-8">Thank you for your purchase. We are preparing your flowers for delivery.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/orders')} className="w-full flex items-center justify-center gap-2 bg-pink-500 text-white py-3 rounded-lg font-bold uppercase text-sm hover:bg-pink-600 transition-colors shadow-md">
              <Package size={16} /> My Orders
            </button>
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold uppercase text-sm hover:bg-gray-200 transition-colors">
              <Home size={16} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${!isProfileComplete ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin size={18} className={isProfileComplete ? "text-floral-magenta" : "text-red-500"}/> 
                  Shipping Address
                </h2>
                <button onClick={() => router.push('/account')} className="text-xs font-bold text-floral-magenta uppercase underline hover:text-pink-700">
                  {isProfileComplete ? "Edit" : "Fix Now"}
                </button>
              </div>
              
              {isProfileComplete ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.address?.doorNo}, {user.address?.area}<br/>
                    {user.address?.city}, {user.address?.state} - {user.address?.zip}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2 font-medium">📞 +91 {user.phone}</p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-100 flex gap-3">
                  <AlertCircle className="shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-sm">Action Required!</p>
                    <p className="text-xs mt-1">Your shipping address and phone number must be added to your account before you can order.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4">Order Items</h2>
              <ul className="divide-y divide-gray-100">
                {cart.map((item: any, idx: number) => (
                  <li key={idx} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 text-sm uppercase">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900">₹{(item.price - (item.price * (item.discount || 0) / 100)) * item.quantity}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-floral-magenta"/> Order Summary</h2>
              
              <div className="space-y-3 text-sm mb-6 border-b pb-6 text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                <div className="flex justify-between"><span className="text-green-600">Shipping</span><span className="text-green-600 font-medium">FREE</span></div>
              </div>

              <div className="flex justify-between text-xl font-bold mb-8">
                <span>Total</span>
                <span className="text-floral-magenta">₹{cartTotal}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={placingOrder || !isProfileComplete}
                className="w-full bg-pink-500 text-white py-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-md hover:bg-pink-600 hover:shadow-lg transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {placingOrder ? "Processing..." : "Place Order"}
              </button>
              
              {!isProfileComplete && (
                <p className="text-[10px] text-red-500 text-center mt-3 font-bold uppercase animate-pulse">
                  Complete profile to enable checkout
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}