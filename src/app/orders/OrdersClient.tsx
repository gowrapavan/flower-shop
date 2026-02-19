"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowLeft, MapPin } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function OrdersClient() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      router.push('/account');
      return;
    }

    const cacheKey = `flower-orders-${user.email}`;
    const cachedOrders = localStorage.getItem(cacheKey);
    
    if (cachedOrders) {
      setOrders(JSON.parse(cachedOrders));
      setLoadingOrders(false);
    }

    fetch('/api/orders')
      .then(res => res.ok ? res.json() : { orders: [] })
      .then(data => {
        if (data.orders) {
          setOrders(data.orders);
          localStorage.setItem(cacheKey, JSON.stringify(data.orders));
        }
      })
      .finally(() => setLoadingOrders(false));
  }, [user, loadingUser, router]);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold uppercase"><Clock size={14}/> Pending</span>;
      case 'processing': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold uppercase"><Package size={14}/> Processing</span>;
      case 'shipped': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs font-bold uppercase"><Truck size={14}/> Shipped</span>;
      case 'delivered': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold uppercase"><CheckCircle size={14}/> Delivered</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold uppercase"><XCircle size={14}/> Cancelled</span>;
      default: return <span className="uppercase text-xs font-bold text-gray-500">{status}</span>;
    }
  };

  if (loadingUser || (loadingOrders && orders.length === 0)) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-gray-400 hover:text-floral-magenta transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders with us yet.</p>
            <button onClick={() => router.push('/shop')} className="bg-floral-magenta text-white px-6 py-3 rounded-lg font-bold uppercase text-sm hover:bg-pink-700 transition-colors">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
                <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-medium text-floral-magenta font-bold">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-sm text-gray-900 font-mono">...{order.id.slice(-8)}</p>
                  </div>
                  <div>{getStatusDisplay(order.status)}</div>
                </div>
                <div className="p-4 sm:px-6">
                  <ul className="divide-y divide-gray-50">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="py-4 flex items-center gap-4">
                        <div className="relative h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                          <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50/50 p-4 sm:px-6 border-t border-gray-100 text-xs text-gray-600 flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
<p>
  <span className="font-bold text-gray-800">Shipped to:</span> {order.shipping_address?.doorNo}, {order.shipping_address?.area}, {order.shipping_address?.city}, {order.shipping_address?.zip}
</p>                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}