To make your app work with Supabase, we are going to change how your **backend API** talks to the database.

The best part? **You do not need to change `account/page.tsx` or `UserProfile.tsx` at all.** Your frontend code is already perfect; we just need to update the server to save the data to Supabase instead of the local file.

*Note: Since you shared your actual Supabase URL and Key, I have included them in the code below. However, please remember never to upload these keys to a public GitHub repository.*

Here is the step-by-step updated code.

### Step 1: Install the Supabase package

Run this command in your terminal to install the Supabase client:

```bash
npm install @supabase/supabase-js

```

### Step 2: Set up Environment Variables

Create a file named `.env.local` in the root of your project (next to `package.json`) and add your keys:

**File:** `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL= My_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= MY_API

```

### Step 3: Create the Supabase Client

Create a new file in your `lib` folder to connect to Supabase.

**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

```

### Step 4: Update `db.ts` (The most important part)

We are going to rewrite your user functions to use Supabase instead of the local file system. *Note: I left the `products` logic alone so your products still load from JSON.*

**File:** `src/lib/db.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { Product, User } from '@/types';
import { supabase } from './supabase'; // Import Supabase

const dataDir = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(fileContents);
  } catch (e) {
    return [];
  }
}

export const db = {
  products: {
    getAll: () => readJSON<Product>('products.json'),
    getById: (id: string) => readJSON<Product>('products.json').find(p => p.id === id),
  },
  
  // Update users to use Async Supabase calls
  users: {
    getByEmail: async (email: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // maybeSingle returns null if not found
      
      if (error || !data) return null;
      return data as User;
    },
    
    create: async (user: User) => {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Create Error:", error);
        throw error;
      }
      return data as User;
    },

    update: async (email: string, updates: Partial<User>) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', email)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Update Error:", error);
        return null;
      }
      return data as User;
    }
  }
};

```

### Step 5: Update your Auth Routes

Because Supabase databases are in the cloud, retrieving data takes a tiny fraction of a second. This means our `db.users` functions are now **Promises** and we must add the word `await` in front of them in your API routes.

**File:** `src/app/api/auth/login/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ADDED AWAIT HERE
    const user = await db.users.getByEmail(email);
    
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ success: true, user: { email: user.email, name: user.name } });
    
    response.cookies.set('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, 
      path: '/',
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

```

**File:** `src/app/api/auth/register/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ADDED AWAIT HERE
    const existingUser = await db.users.getByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ADDED AWAIT HERE
    const newUser = await db.users.create({
      id: crypto.randomUUID(), 
      email,
      password: hashedPassword,
      name: name || "Flower Lover",
      role: "customer"
    });

    const token = await signToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    const response = NextResponse.json({ success: true, user: { email: newUser.email, name: newUser.name } });
    
    response.cookies.set('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, 
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

```

**File:** `src/app/api/auth/me/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ADDED AWAIT HERE
  const user = await db.users.getByEmail(payload.email as string);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword });
}

```

**File:** `src/app/api/user/update/route.ts` *(Make sure to update this one too!)*

```typescript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const payload = await verifyToken(token || "");
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // ADDED AWAIT HERE
    const updatedUser = await db.users.update(payload.email as string, body);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("❌ Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

```

Everything else in your codebase (`types/index.ts`, `lib/auth.ts`, `api/auth/logout/route.ts`) is fine and doesn't need to change.

Gemini said
Yes, let's absolutely tackle Option 1: The Checkout Page!

It is the perfect next step because it instantly makes use of the Supabase user profile and address management system we just finished building. By auto-filling the user's saved address, you will create a seamless, professional shopping experience.

Since we just migrated your user data to Supabase, it makes the most sense to create an orders table in Supabase as well, rather than relying on a local JSON file.

The Plan for the Checkout Flow
To get this working, we will need to build three main pieces:

The Supabase orders Table: A quick SQL query to create a table that stores the user's ID, their cart items, the total price, the shipping address, and the order status (e.g., "pending").

The Checkout API Route (api/checkout/route.ts): A secure server endpoint that takes the cart data, verifies the user's session, and inserts the new order into Supabase.

The Checkout UI (app/checkout/page.tsx): A page that displays the cart summary, shows the auto-filled address from their profile, and has a "Place Order" button.

What I need from you first:
Before I write out the code, I need to know how you are currently handling the shopping cart in your app.

Are you using a React Context, a state manager like Zustand/Redux, or are you just saving the cart items to localStorage?

Once you let me know how the cart is built, I can give you the exact code to connect it to the checkout page!

You said
src



├───app

│   │   favicon.ico

│   │   globals.css

│   │   layout.tsx

│   │   page.tsx

│   │   

│   ├───account

│   │       page.tsx

│   │       

│   ├───api

│   │   ├───auth

│   │   │   ├───login

│   │   │   │       route.ts

│   │   │   │       

│   │   │   ├───logout

│   │   │   │       route.ts

│   │   │   │       

│   │   │   ├───me

│   │   │   │       route.ts

│   │   │   │

│   │   │   └───register

│   │   │           route.ts

│   │   │

│   │   ├───products

│   │   │       route.ts

│   │   │

│   │   └───user

│   │       └───update

│   │               route.ts

│   │

│   ├───cart

│   │       page.tsx

│   │

│   ├───product

│   │   └───[id]

│   │           page.tsx

│   │

│   └───shop

│           page.tsx

│

├───components

│   ├───layout

│   │       Footer.tsx

│   │       Header.tsx

│   │

│   ├───product

│   │       ClientAddToCart.tsx

│   │       ProductCard.tsx

│   │       ProductGallery.tsx

│   │       ProductShare.tsx

│   │       ProductTabs.tsx

│   │

│   ├───profile

│   │       UserProfile.tsx

│   │

│   └───ui

│           Button.tsx

│           FullScreenLoader.tsx

│           Loader.tsx

│

├───context

│       CartContext.tsx

│

├───lib

│       auth.ts

│       db.ts

│       markdown.ts

│       supabase.ts

│       utils.ts

│

└───types

        index.ts

Gemini said
I see it! You have a src/context/CartContext.tsx file, which is perfect. This means your cart is managed globally using React Context, making it very easy to pull that data into our new Checkout Page.

Here is the complete step-by-step guide to building the Checkout flow.

Step 1: Create the orders Table in Supabase
First, we need a place to save the orders.

Go to your Supabase Dashboard and open the SQL Editor.

Click New Query, paste the following SQL, and hit Run:

SQL
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  items jsonb not null,
  total_amount numeric not null,
  shipping_address jsonb not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
Step 2: Update Your Types
Let's add the Order types so TypeScript knows what an order looks like.

File: src/types/index.ts
(Add this to the bottom of the file)

TypeScript
export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  user_email: string;
  items: CartItem[];
  total_amount: number;
  shipping_address: User['address'];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}
Step 3: Create the Checkout API Route
This server route will securely receive the cart data and save the order to Supabase.

Create a new file: src/app/api/checkout/route.ts

TypeScript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // 1. Verify the user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Get order details from the frontend
    const body = await request.json();
    const { items, totalAmount, shippingAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.doorNo) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    // 3. Save the order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_email: payload.email,
          items: items,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Order Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
Step 4: Create the Checkout Page
This page will pull the cart from your CartContext, fetch the user's address from the /api/auth/me route, and allow them to place the order.

(Note: Replace useCart with whatever hook name you export from your CartContext.tsx if it is slightly different).

Create a new file: src/app/checkout/page.tsx

TypeScript
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext"; // Verify this path/import
import { User } from "@/types";
import { MapPin, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart(); // Destructure your actual cart context methods
  
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // 1. Check Auth & Get Address on Load
  useEffect(() => {
    async function getUserDetails() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // If not logged in, force them to login first
          router.push('/account');
        }
      } catch (e) {
        console.error("Failed to fetch user");
      } finally {
        setLoadingUser(false);
      }
    }
    getUserDetails();
  }, [router]);

  // 2. Handle Order Placement
  const handlePlaceOrder = async () => {
    if (!user?.address || !user.address.doorNo) {
      setError("Please complete your shipping address in your profile first.");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          totalAmount: cartTotal, // Make sure your CartContext provides the total!
          shippingAddress: user.address
        })
      });

      const data = await res.json();

      if (res.ok) {
        clearCart(); // Empty the cart
        setOrderSuccess(true);
      } else {
        throw new Error(data.error || "Failed to place order");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

  // 3. Success View
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-8">Thank you for your purchase. We are preparing your flowers for delivery.</p>
          <button 
            onClick={() => router.push('/shop')}
            className="w-full bg-floral-magenta text-white py-3 rounded-lg font-bold uppercase text-sm hover:bg-pink-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 4. Empty Cart View
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button onClick={() => router.push('/shop')} className="text-floral-magenta font-bold hover:underline">Go to Shop</button>
        </div>
      </div>
    );
  }

  // 5. Checkout View
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center gap-3 text-red-700">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Shipping & Items */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Address Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><MapPin size={18} className="text-floral-magenta"/> Shipping Address</h2>
                <button onClick={() => router.push('/account')} className="text-xs font-bold text-gray-500 hover:text-floral-magenta uppercase underline">Edit</button>
              </div>
              
              {user?.address && user.address.doorNo ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.address.doorNo}, {user.address.area}<br/>
                    {user.address.city}, {user.address.state} - {user.address.zip}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">📞 +91 {user.phone}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 text-sm">
                  <p className="font-bold mb-2">Address Missing!</p>
                  <p className="mb-3">We need your shipping address before you can place an order.</p>
                  <button onClick={() => router.push('/account')} className="bg-yellow-800 text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-yellow-900">Add Address</button>
                </div>
              )}
            </div>

            {/* Cart Items Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4">Order Items</h2>
              <ul className="divide-y divide-gray-100">
                {cartItems.map((item: any, idx: number) => (
                  <li key={idx} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Payment */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-floral-magenta"/> Order Summary</h2>
              
              <div className="space-y-3 text-sm mb-6 border-b pb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-8">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>

              {/* Payment Info (Cash on Delivery placeholder for now) */}
              <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 text-center mb-6 border border-gray-100">
                Payment Method: <span className="font-bold text-gray-900">Cash on Delivery</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={placingOrder || !user?.address?.doorNo}
                className="w-full bg-floral-magenta text-white py-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-md hover:bg-pink-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
Next Steps:
Double-check the imports in page.tsx (especially useCart, cartTotal, and cartItems) to ensure they perfectly match how you exported them from your CartContext.tsx.

Add an "Empty Cart" or "Checkout" button to your app/cart/page.tsx that links directly to /checkout.

Would you like me to help link your existing Cart page to this Checkout page?

You said
now what



context/CartContext.tsx



// Cart Context Provider

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



  const addToCart = (product: Product, quantity = 1) => {

    setCart(prev => {

      const existing = prev.find(item => item.id === product.id);

      return existing

        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)

        : [...prev, { ...product, quantity }];

    });

  };



  return (

    <CartContext.Provider value={{ cart, addToCart }}>

      {children}

    </CartContext.Provider>

  );

}



export const useCart = () => useContext(CartContext);



---



product

│   │       ClientAddToCart.tsx

│   │       ProductCard.tsx

│   │       ProductGallery.tsx

│   │       ProductShare.tsx

│   │       ProductTabs.tsx



click to cart



"use client";

import { useCart } from "@/context/CartContext";

import { useState } from "react";

import { Product } from "@/types";

import { ShoppingBag, Check, Plus, Minus } from "lucide-react";



export default function ClientAddToCart({ product }: { product: Product }) {

  const { addToCart } = useCart();

  const [qty, setQty] = useState(1);

  const [isAdded, setIsAdded] = useState(false);



  const handleAddToCart = () => {

    addToCart(product, qty);

    setIsAdded(true);

   

    // Reset the "Added" state after 2 seconds

    setTimeout(() => setIsAdded(false), 2000);

  };



  return (

    <div className="flex flex-col sm:flex-row gap-4 items-center w-full">

      {/* Quantity Selector */}

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



      {/* Add Button with Feedback */}

      <button

        onClick={handleAddToCart}

        disabled={isAdded}

        className={`flex-1 h-12 px-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-300 ${

          isAdded

            ? "bg-floral-green text-white cursor-default"

            : "bg-black text-white hover:bg-floral-magenta"

        }`}

      >

        {isAdded ? (

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



---



product card



import Image from "next/image";

import Link from "next/link";

import { Product } from "@/types";



export default function ProductCard({ product }: { product: Product }) {

  const discountedPrice = product.price - (product.price * (product.discount / 100));



  return (

    <div className="group bg-white rounded-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">

      {/* Wrap the entire clickable area in a Link for better UX */}

      <Link href={`/product/${product.id}`} className="block">

        {/* Image Section */}

        <div className="relative h-44 sm:h-64 w-full overflow-hidden">

          <Image

            src={product.images[0]}

            alt={product.name}

            fill

            className="object-cover group-hover:scale-105 transition-transform duration-500"

          />

         

          {/* Discount Badge */}

          {product.discount > 0 && (

            <span className="absolute top-2 left-2 bg-floral-magenta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">

              -{product.discount}%

            </span>

          )}

        </div>



        {/* Content Section */}

        <div className="p-3 md:p-4">

          {/* Title & Quantity - Format: ASH GOURD – 1 PIECE */}

          <h3 className="text-[12px] md:text-sm font-medium text-gray-900 uppercase tracking-wide leading-tight mb-3">

            {product.name} {product.quantityUnit && `– ${product.quantityUnit}`}

          </h3>

         

          {/* Availability Badge - Solid Orange Style */}

          <div className="mb-3">

             {product.availability === '24hr' ? (

               <span className="bg-[#EB8126] text-white text-[13px] md:text-[15px] px-3 py-1.5 rounded-[4px] font-medium inline-block">

                 24hr Lead Time

               </span>

             ) : (

               <span className="bg-[#4CAF50] text-white text-[13px] md:text-[15px] px-3 py-1.5 rounded-[4px] font-medium inline-block">

                 Anytime Delivery

               </span>

             )}

          </div>



          {/* Pricing */}

          <div className="flex items-center gap-3 mt-1">

            <span className="text-sm md:text-base text-gray-400 line-through decoration-1">

              ₹{product.price.toFixed(2)}

            </span>

            <span className="text-sm md:text-base font-bold text-gray-900">

              ₹{discountedPrice.toFixed(2)}

            </span>

          </div>

        </div>

      </Link>

    </div>

  );

}



---

"use client";

import Image from "next/image";

import { useState } from "react";



export default function ProductGallery({ images }: { images: string[] }) {

  const [selected, setSelected] = useState(images[0]);



  return (

    <div className="space-y-4">

      <div className="relative h-80 md:h-116 w-full rounded border border-gray-100 overflow-hidden bg-white">

        <Image

          src={selected}

          alt="Product"

          fill

          className="object-cover"

          priority

        />

      </div>

     

      {images.length > 1 && (

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

          {images.map((img, idx) => (

            <button

              key={idx}

              onClick={() => setSelected(img)}

              className={`relative h-14 w-16 md:h-16 md:w-20 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${

                selected === img ? 'border-floral-magenta' : 'border-transparent'

              }`}

            >

              <Image src={img} alt="Thumb" fill className="object-cover" />

            </button>

          ))}

        </div>

      )}

    </div>

  );

}



---



product tab



"use client";

import { useState } from "react";



interface ProductTabsProps {

  shortDescription: string;

  longDescription: string | null;

}



export default function ProductTabs({ shortDescription, longDescription }: ProductTabsProps) {

  const [active, setActive] = useState("description");



  const renderContent = (text: string) => {

    return text.split('\n').map((line, index) => {

      if (line.startsWith('# ')) {

        return <h2 key={index} className="text-xl md:text-2xl font-serif text-floral-magenta mt-6 mb-4 border-b border-gray-100 pb-2 tracking-normal">{line.replace('# ', '')}</h2>;

      }

      if (line.startsWith('## ')) {

        return <h3 key={index} className="text-base md:text-lg font-serif font-bold text-gray-900 mt-5 mb-3 uppercase tracking-normal">{line.replace('## ', '')}</h3>;

      }



      if (line.trim().startsWith('* ')) {

        const cleanLine = line.replace('* ', '');

        const parts = cleanLine.split('**');

        return (

          <div key={index} className="flex gap-2 md:gap-3 mb-2 ml-1">

            <span className="font-serif text-floral-magenta mt-1.5 text-[10px]">●</span>

            <p className="text-xs md:text-sm font-serif text-gray-600 leading-relaxed tracking-wide">

              {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-gray-900 font-bold">{part}</strong> : part)}

            </p>

          </div>

        );

      }



      const parts = line.split('**');

      return (

        <p key={index} className="text-xs md:text-sm text-gray-600 leading-6 md:leading-7 mb-3 tracking-wide">

          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-gray-900 font-bold">{part}</strong> : part)}

        </p>

      );

    });

  };



  return (

    <div className="mt-8 md:mt-16 font-serif border-t border-gray-100 pt-8">

      {/* Scrollable Tab Headers on Mobile */}

      <div className="flex gap-6 md:gap-8 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide whitespace-nowrap">

        {['Description', 'Additional Info', 'Reviews (0)'].map((tab) => {

          const key = tab.split(" ")[0].toLowerCase();

          return (

            <button

              key={key}

              onClick={() => setActive(key)}

              className={`pb-4 text-[11px] md:text-xs font-bold uppercase transition-colors tracking-normal ${

                active === key ? 'text-floral-magenta border-b-2 border-floral-magenta' : 'text-gray-500 hover:text-black'

              }`}

            >

              {tab}

            </button>

          );

        })}

      </div>

     

      <div className="min-h-[200px] px-1">

        {active === 'description' && (

          <div className="product-description">

            {longDescription ? (

              renderContent(longDescription)

            ) : (

              <p className="text-xs md:text-sm text-gray-600 leading-relaxed tracking-wide">

                {shortDescription}

              </p>

            )}

          </div>

        )}

       

        {active === 'additional' && (

          <div className="text-xs md:text-sm text-gray-600 space-y-4 tracking-wide">

            <h3 className="font-serif text-base md:text-lg text-black mb-4 tracking-normal">Product Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">

              {[

                { label: "Origin", val: "Local Sustainable Farms" },

                { label: "Freshness", val: "24-48 Hours guaranteed" },

                { label: "Packaging", val: "Eco-friendly box" },

                { label: "Delivery", val: "Morning / Evening Slots" }

              ].map((spec, i) => (

                <div key={i} className="flex justify-between border-b border-gray-50 pb-2">

                  <span className="font-bold">{spec.label}</span>

                  <span>{spec.val}</span>

                </div>

              ))}

            </div>

          </div>

        )}

       

        {active === 'reviews' && (

          <div className="text-center py-10 text-gray-500 text-xs md:text-sm bg-gray-50 rounded tracking-wide">

            <p>There are no reviews yet.</p>

          </div>

        )}

      </div>

    </div>

  );

}



----



Header.tsx



"use client";

import Link from "next/link";

import Image from "next/image";

import { useState, useEffect } from "react";

import { usePathname } from "next/navigation"; // <--- Import this

import { Search, ShoppingBag, Heart, Menu, X, User as UserIcon } from "lucide-react";

import { useCart } from "@/context/CartContext";

import { User } from "@/types";



export default function Header() {

  const { cart } = useCart();

  const pathname = usePathname(); // <--- Get current route

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  const today = new Date().toISOString().split('T')[0];



  useEffect(() => {

    async function checkSession() {

      try {

        const res = await fetch('/api/auth/me');

        if (res.ok) {

          const data = await res.json();

          setUser(data.user);

        }

      } catch (e) { }

    }

    checkSession();

  }, []);



  const getProfileImage = () => {

    if (user?.image) return user.image;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=FCE4EC&color=C2185B&bold=true`;

  };



  // Helper to check active state

  const isActive = (path: string) => pathname === path;



  return (

    <header className="w-full bg-white shadow-sm sticky top-0 z-50">

      <div className="container mx-auto px-4 py-3 flex items-center justify-between">

        <button className="md:hidden text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>

          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}

        </button>



        <Link href="/" className="flex flex-col items-center md:items-start md:flex-row md:gap-2">

           <span className="text-lg md:text-2xl font-serif text-floral-magenta font-bold leading-none">GETFLOWERSDAILY</span>

           <span className="text-[10px] md:text-xs text-gray-400 italic">flowers at a click</span>

        </Link>



        <div className="flex items-center gap-4 md:gap-6 text-xs font-medium uppercase tracking-wide text-gray-600">

          <div className="hidden lg:flex items-center gap-2 bg-pink-50 px-3 py-1 rounded border border-pink-100">

            <span className="text-floral-magenta">Check Price by Date:</span>

            <input type="date" defaultValue={today} className="bg-transparent outline-none text-gray-700 cursor-pointer" />

          </div>



          <div className="flex items-center gap-4">

            <Link href="/cart" className="flex items-center gap-1.5 cursor-pointer hover:text-floral-magenta">

              <ShoppingBag size={20} />

              <span className="hidden sm:inline">Cart ({cart?.length || 0})</span>

              <span className="sm:hidden text-[10px] bg-floral-magenta text-white px-1.5 rounded-full">{cart?.length || 0}</span>

            </Link>



            <div className="hidden sm:flex items-center gap-1.5 cursor-pointer hover:text-floral-magenta">

              <Search size={20} />

              <span className="hidden md:inline">Search</span>

            </div>

          </div>

        </div>

      </div>



      <nav className="hidden md:block border-t border-gray-100">

        <div className="container mx-auto px-4 py-3 flex justify-end gap-8 text-[11px] font-bold uppercase text-gray-500 items-center">

         

          {/* Dynamic Links */}

          <Link

            href="/shop"

            className={`transition-colors border-b-2 pb-1 ${isActive('/shop') ? 'text-floral-magenta border-floral-magenta' : 'border-transparent hover:text-floral-magenta'}`}

          >

            Home

          </Link>

         

          <Link href="/" className="hover:text-floral-magenta transition-colors border-b-2 border-transparent pb-1">

            Shivratri Package <Heart size={10} className="inline ml-1 text-black fill-black" />

          </Link>

         

          {/* Use specific category route if you have one, or keep /shop */}

          <Link

            href="/shop?filter=category"

            className={`transition-colors border-b-2 pb-1 ${pathname.includes('shop') && !isActive('/shop') ? 'text-floral-magenta border-floral-magenta' : 'border-transparent hover:text-floral-magenta'}`}

          >

            By Category

          </Link>

         

          <Link

            href="/account"

            className={`flex items-center gap-2 transition-colors border-b-2 pb-1 ${isActive('/account') ? 'text-floral-magenta border-floral-magenta' : 'border-transparent hover:text-floral-magenta'}`}

          >

            {user ? (

              <>

                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200">

                  <Image src={getProfileImage()} alt="Profile" fill className="object-cover" />

                </div>

                <span className="text-floral-magenta font-bold">{user.name?.split(' ')[0]}</span>

              </>

            ) : (

              <>

                <UserIcon size={16} />

                <span>My Account</span>

              </>

            )}

          </Link>

        </div>

      </nav>



      {isMenuOpen && (

        <nav className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl z-50">

          <div className="flex flex-col p-4 space-y-4 text-sm font-bold uppercase text-gray-600">

             <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="border-b border-gray-50 pb-2">Quick Order</Link>

             <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="border-b border-gray-50 pb-2">By Category</Link>

             <Link href="/account" onClick={() => setIsMenuOpen(false)}>My Account</Link>

          </div>

        </nav>

      )}

    </header>

  );

}



---



product

│   │   └───[id]

│   │           page.tsx



import { db } from "@/lib/db";

import { notFound } from "next/navigation";

import { getProductDescription } from "@/lib/markdown";

import ProductGallery from "@/components/product/ProductGallery";

import ProductTabs from "@/components/product/ProductTabs";

import ClientAddToCart from "@/components/product/ClientAddToCart";

import ProductCard from "@/components/product/ProductCard";

import ProductShare from "@/components/product/ProductShare";



export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;

  const product = db.products.getById(id);

 

  if (!product) return notFound();



  const longDescription = await getProductDescription(id);

  const discountedPrice = product.price - (product.price * (product.discount / 100));



  const allProducts = db.products.getAll();

  const relatedProducts = allProducts

    .filter(p => p.category === product.category && p.id !== product.id)

    .slice(0, 4);



  return (

    <div className="container font-serif mx-auto px-4 py-6 md:py-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-start">

        {/* Left: Gallery */}

        <ProductGallery images={product.images} />



        {/* Right: Info */}

        <div className="space-y-5">

          <div>

            <h1 className="text-xl md:text-3xl text-gray-900 mb-3 leading-tight font-medium">{product.name}</h1>

           

            {/* ✅ UPDATED AVAILABILITY BADGE */}

            <div className="mb-3">

               {product.availability === '24hr' ? (

                 <span className="bg-[#EB8126] text-white text-[13px] md:text-[15px] px-3 py-1.5 rounded-[4px] font-medium inline-block">

                   24hr Lead Time

                 </span>

               ) : (

                 <span className="bg-[#4CAF50] text-white text-[13px] md:text-[15px] px-3 py-1.5 rounded-[4px] font-medium inline-block">

                   Anytime Delivery

                 </span>

               )}

            </div>

          </div>



          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">

             <span className="text-gray-400 line-through text-base md:text-lg">₹{product.price.toFixed(2)}</span>

             <span className="text-floral-magenta font-bold text-xl md:text-2xl">₹{discountedPrice.toFixed(2)}</span>

             {product.discount > 0 && (

               <span className="text-[10px] md:text-xs font-bold bg-pink-100 text-floral-magenta px-2 py-1 rounded">- {product.discount}%</span>

             )}

          </div>



          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

         

          <div className="py-2">

             <ClientAddToCart product={product} />

          </div>

         

          <div className="text-[11px] md:text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-5">

            <p className="flex flex-col sm:flex-row sm:gap-2">

              <strong className="text-black uppercase sm:w-40">Stock Keeping Unit:</strong>

              <span>FLW-{product.id}00X</span>

            </p>

            <p className="flex flex-col sm:flex-row sm:gap-2">

              <strong className="text-black uppercase sm:w-40">Category:</strong>

              <span>{product.category}</span>

            </p>

            <p className="flex flex-col sm:flex-row sm:gap-2">

              <strong className="text-black uppercase sm:w-40">Tags:</strong>

              <span>{product.tags.join(', ')}</span>

            </p>

           

            <div className="pt-2">

              <ProductShare product={product} />

            </div>

          </div>

        </div>

      </div>



      <div className="mb-12">

        <ProductTabs

          shortDescription={product.description}

          longDescription={longDescription}

        />

      </div>



      {relatedProducts.length > 0 && (

        <div className="border-t border-gray-200 pt-8">

          <h2 className="text-lg md:text-xl text-center mb-8 relative">

            <span className="bg-white px-4 relative z-10 font-bold uppercase tracking-wider text-gray-800">Related Products</span>

            <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-200 -z-0"></span>

          </h2>

         

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {relatedProducts.map(p => (

              <ProductCard key={p.id} product={p} />

            ))}

          </div>

        </div>

      )}

    </div>

  );

}



---



cart/page.tsx



"use client";

import { useCart } from "@/context/CartContext";

import Image from "next/image";

import Link from "next/link";



export default function CartPage() {

  const { cart, addToCart } = useCart();



  const total = cart.reduce((acc: number, item: any) => {

    const price = item.price - (item.price * (item.discount / 100));

    return acc + (price * item.quantity);

  }, 0);



  if (cart.length === 0) return (

    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">

      <h2 className="font-serif text-2xl">Your cart is empty</h2>

      <Link href="/shop" className="text-floral-magenta underline hover:text-black">Return to Shop</Link>

    </div>

  );



  return (

    <div className="container mx-auto px-4 py-12">

      <h1 className="font-serif text-3xl mb-8 border-b pb-4">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        <div className="lg:col-span-2 space-y-6">

          {cart.map((item: any) => (

            <div key={item.id} className="flex gap-4 border p-4 rounded items-center bg-white">

              <div className="relative h-20 w-20 flex-shrink-0">

                <Image src={item.images[0]} alt={item.name} fill className="object-cover rounded" />

              </div>

              <div className="flex-1">

                <h3 className="font-bold text-sm">{item.name}</h3>

                <p className="text-floral-magenta font-bold">₹{(item.price - (item.price * item.discount / 100)).toFixed(2)}</p>

              </div>

              <div className="flex items-center gap-2">

                 <span className="text-xs font-bold">Qty: {item.quantity}</span>

              </div>

            </div>

          ))}

        </div>

        <div className="bg-gray-50 p-6 rounded h-fit border">

          <h3 className="font-serif text-xl mb-6">Cart Totals</h3>

          <div className="flex justify-between font-bold text-lg mb-6">

            <span>Total</span>

            <span className="text-floral-magenta">₹{total.toFixed(2)}</span>

          </div>

          <button className="w-full bg-black text-white py-3 font-bold uppercase text-xs hover:bg-floral-magenta transition">

            Proceed to Checkout

          </button>

        </div>

      </div>

    </div>

  );

}

Gemini said
Perfect! I see exactly how your CartContext is set up.

To make the Checkout Flow work flawlessly, we just need to do two quick things:

Add a clearCart function to your CartContext.

Update the "Proceed to Checkout" button on your CartPage to actually navigate to the new checkout route.

Here are the updated files based on the code you just provided.

1. Update the Cart Context
We need to add a clearCart method so that when a user successfully places an order, their cart empties out automatically. We also need to add a cartTotal property.

File: src/context/CartContext.tsx

TypeScript
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

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      return existing 
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { ...product, quantity }];
    });
  };

  // NEW: Add a way to clear the cart after checkout
  const clearCart = () => {
    setCart([]);
  };

  // NEW: Calculate the total price directly in context so it's always accurate
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
2. Update the Cart Page
We need to link the "Proceed to Checkout" button to our new /checkout page. I have added useRouter to handle the navigation.

File: src/app/cart/page.tsx

TypeScript
"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // NEW: Added useRouter

export default function CartPage() {
  const { cart, cartTotal } = useCart(); // NEW: Using cartTotal from context
  const router = useRouter(); // NEW: Initialize router

  if (cart.length === 0) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 font-sans">
      <h2 className="font-serif text-2xl font-bold text-gray-900">Your cart is empty</h2>
      <Link href="/shop" className="text-floral-magenta font-bold uppercase text-sm hover:underline hover:text-pink-700 transition-colors">Return to Shop</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 font-sans">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item: any) => (
            <div key={item.id} className="flex gap-4 border border-gray-100 p-4 rounded-xl items-center bg-white shadow-sm">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image src={item.images[0]} alt={item.name} fill className="object-cover rounded-lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">{item.name}</h3>
                <p className="text-floral-magenta font-bold mt-1">₹{(item.price - (item.price * item.discount / 100)).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                 <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-8 rounded-xl h-fit border border-gray-100 shadow-sm sticky top-24">
          <h3 className="font-serif text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">Cart Totals</h3>
          
          <div className="flex justify-between font-bold text-lg mb-8 border-b border-gray-200 pb-6">
            <span className="text-gray-600">Total</span>
            <span className="text-floral-magenta text-2xl">₹{cartTotal}</span>
          </div>
          
          {/* NEW: Updated Button to route to /checkout */}
          <button 
            onClick={() => router.push('/checkout')}
            className="w-full bg-floral-magenta text-white py-4 rounded-lg font-bold uppercase tracking-wider text-sm shadow-md hover:bg-pink-700 hover:shadow-lg transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
3. Review the Checklist
Before you test, make sure you have completed all four steps from our previous discussion:

Ran the SQL Query in Supabase to create the orders table.

Updated types/index.ts with the new Order and CartItem interfaces.

Created src/app/api/checkout/route.ts (The server endpoint).

Created src/app/checkout/page.tsx (The UI page).

If you have those four files set up, along with these two quick updates to CartContext and CartPage, your entire checkout flow should be fully functional!

Try adding an item to your cart, clicking "Proceed to Checkout", and placing an order. Let me know if it successfully saves to your Supabase orders table!

You said
i dont want supase to get request every time user clicks refresh



once the user logeed in succesful or created account and logged succesfully



it should store in local storeage



when loggedout or time imit extended it shoud be removed

so that we could redce the request iit to supabase



only supabase should be called when user updated ,created ,logged in or made check out



even i cart to be saved in supabase ,but when or once it loads then it should bestored in local storeage

,only local storeage should be dispalyed no active caaling to spabase should be



unless it is adding or remving a product or update profile etc..



i ned this mechnismm

Gemini said
This is a very smart optimization. Right now, your Header, AccountPage, and CheckoutPage are all independently calling /api/auth/me every time they load. That means 3 database hits per page refresh!

By moving the user session into a global React Context and caching it in localStorage, we can reduce this to 0 database hits on refresh.

Here is exactly how to build this caching mechanism.

Step 1: Create the Auth Context
This file will handle checking localStorage first. It only talks to Supabase if the local storage is empty, or when you explicitly tell it to update.

Create a new file: src/context/AuthContext.tsx

TypeScript
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loadingUser: boolean;
  loginUser: (userData: User) => void;
  logoutUser: () => async void;
  updateUserCache: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // 1. Check Local Storage FIRST (Zero API calls)
    const cachedUser = localStorage.getItem('flower-user');
    
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoadingUser(false);
    } else {
      // 2. Only if local storage is empty, check the server (in case they have a cookie but cleared cache)
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : { user: null })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('flower-user', JSON.stringify(data.user));
          }
        })
        .finally(() => setLoadingUser(false));
    }
  }, []);

  // Call this when Login or Register succeeds
  const loginUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('flower-user', JSON.stringify(userData));
  };

  // Call this when updating profile details
  const updateUserCache = (userData: User) => {
    setUser(userData);
    localStorage.setItem('flower-user', JSON.stringify(userData));
  };

  // Call this to logout
  const logoutUser = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('flower-user');
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, loadingUser, loginUser, logoutUser, updateUserCache }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
Step 2: Wrap your App in the Provider
Just like you did with your CartContext, you need to wrap your app in the AuthProvider.

File: src/app/layout.tsx (Find where you put your CartProvider and wrap it like this):

TypeScript
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

// Inside your RootLayout return statement:
return (
  <html lang="en">
    <body>
      <AuthProvider>
        <CartProvider>
          {/* Your Header and children go here */}
          {children}
        </CartProvider>
      </AuthProvider>
    </body>
  </html>
);
Step 3: Clean up your existing files!
Now that the context handles everything, you can delete all those fetch('/api/auth/me') calls from your components. This makes your code much cleaner!

1. Update Header.tsx:
Delete the useEffect that fetches the user.

TypeScript
// Delete the useEffect block and replace it with this single line:
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { cart } = useCart();
  const { user } = useAuth(); // <--- THAT'S IT! It reads instantly from cache.
  const pathname = usePathname();
  // ... rest of your code
2. Update AccountPage.tsx:
Delete the useEffect check. Use the context functions instead.

TypeScript
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  // Get everything from context
  const { user, loadingUser, loginUser, logoutUser } = useAuth(); 
  
  // ... your other state (isLogin, formData, error)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... your fetch logic to /api/auth/login ...
    
    if (res.ok) {
      // INSTEAD OF RELOADING THE PAGE, JUST DO THIS:
      loginUser(data.user); 
    }
  };

  if (loadingUser) return <Loader />;
  if (user) return <UserProfile user={user} onLogout={logoutUser} />;
  
  // ... rest of your login form
}
3. Update UserProfile.tsx:
When the user successfully updates their profile, update the local cache so they don't have to refresh to see changes!

TypeScript
import { useAuth } from "@/context/AuthContext";

export default function UserProfile({ user, onLogout }) {
  const { updateUserCache } = useAuth(); // Get the updater function

  const handleUpdate = async (e: React.FormEvent) => {
    // ... your fetch logic to /api/user/update ...
    
    if (res.ok) {
      setIsEditing(false);
      // INSTEAD OF window.location.reload(), DO THIS:
      const data = await res.json();
      updateUserCache(data.user); 
    }
  }
}
Step 4: How to Handle the Cart
Because you want to minimize Supabase calls, your current CartContext using localStorage is actually already perfect for your frontend!

If you want the cart to save to Supabase only when an item is added or removed, you simply add a small fetch call inside your existing addToCart function.

In Supabase SQL Editor run: alter table public.users add column cart jsonb default '[]'::jsonb;

In CartContext.tsx: Add a background fetch to save the cart quietly without interrupting the user.

TypeScript
// Inside CartContext.tsx
const addToCart = (product: Product, quantity = 1) => {
  setCart(prev => {
    const existing = prev.find(item => item.id === product.id);
    const newCart = existing 
      ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
      : [...prev, { ...product, quantity }];
    
    // Background sync to DB (Fire and forget, no need to await)
    fetch('/api/user/update', { 
      method: 'PUT', 
      body: JSON.stringify({ cart: newCart }) 
    }).catch(e => console.log("Failed to sync cart to DB"));

    return newCart;
  });
};
The Result:
Page Refresh: 0 API calls (Reads instantly from localStorage).

Navigating pages: 0 API calls.

Adding to Cart: 1 background API call to save state securely.

Checkout/Login: 1 API call.

