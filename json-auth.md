

To achieve a persistent login that remembers the user upon refresh (but logs them out after inactivity) and allows for collecting full profile details, we need to implement a **Session Check** and a **Profile Update** system.

Here is the complete solution.

### **Step 1: Update Data Types**

First, we need to update the User type to include the new fields (phone, address).

**File:** `src/types/index.ts`

```typescript
export interface User {
  id: string;
  name?: string;
  email: string;
  password?: string;
  role: "admin" | "customer";
  // New Fields
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

```

---

### **Step 2: Create the "Me" Endpoint (Session Check)**

This API route checks the browser cookie to see if a valid token exists. If it does, it returns the user's profile. This is what keeps them logged in when they refresh.

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

  // Fetch fresh user data from DB (in case they updated their profile)
  const user = db.users.getByEmail(payload.email as string);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Remove password before sending to client
  const { password, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword });
}

```

---

### **Step 3: Create the "Update Profile" Endpoint**

This allows the user to save their phone number and address.

**File:** `src/app/api/user/update/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db'; // You might need to add an 'update' method to db.ts logic
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
    const { phone, address } = body;

    // We need to implement a simple update logic in our JSON DB
    const users = db.users.getAll();
    const userIndex = users.findIndex(u => u.email === payload.email);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the specific fields
    users[userIndex] = {
      ...users[userIndex],
      phone: phone || users[userIndex].phone,
      address: address || users[userIndex].address
    };

    // Save back to file (Re-using the logic from your db.ts)
    // NOTE: You need to export 'writeJSON' or add an 'update' method to 'db.ts'
    // For now, assuming you added an update method or we just re-write here:
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, user: users[userIndex] });

  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

```

---

### **Step 4: Create the Profile Component**

This component displays the user info and the form to add missing details.

**File:** `src/components/profile/UserProfile.tsx`

```typescript
"use client";
import { useState } from "react";
import { User } from "@/types";
import { LogOut, MapPin, Phone, User as UserIcon } from "lucide-react";

export default function UserProfile({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [isEditing, setIsEditing] = useState(!user.phone || !user.address);
  const [formData, setFormData] = useState({
    phone: user.phone || "",
    street: user.address?.street || "",
    city: user.address?.city || "",
    state: user.address?.state || "",
    zip: user.address?.zip || "",
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        body: JSON.stringify({
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip
          }
        })
      });
      
      if (res.ok) {
        setIsEditing(false);
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif text-floral-dark mb-1">Hello, {user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold uppercase text-red-500 hover:bg-red-50 px-3 py-2 rounded transition"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-xs uppercase text-gray-400 mb-2 flex items-center gap-2">
                <Phone size={14} /> Contact
              </h3>
              <p className="text-gray-800 font-medium">{user.phone || "No phone added"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-xs uppercase text-gray-400 mb-2 flex items-center gap-2">
                <MapPin size={14} /> Address
              </h3>
              {user.address ? (
                <p className="text-gray-800 text-sm leading-relaxed">
                  {user.address.street}<br/>
                  {user.address.city}, {user.address.state} - {user.address.zip}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No address added</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-floral-magenta text-xs font-bold uppercase underline"
          >
            Edit Profile Details
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4 animate-in fade-in">
          <h3 className="font-serif text-lg mb-4">Complete your Profile</h3>
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border p-2 rounded text-sm focus:border-floral-magenta outline-none"
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Street Address</label>
              <input 
                type="text" 
                value={formData.street}
                onChange={e => setFormData({...formData, street: e.target.value})}
                className="w-full border p-2 rounded text-sm focus:border-floral-magenta outline-none"
                placeholder="123 Flower Street"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">City</label>
              <input 
                type="text" 
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full border p-2 rounded text-sm focus:border-floral-magenta outline-none"
                placeholder="Bangalore"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">ZIP Code</label>
              <input 
                type="text" 
                value={formData.zip}
                onChange={e => setFormData({...formData, zip: e.target.value})}
                className="w-full border p-2 rounded text-sm focus:border-floral-magenta outline-none"
                placeholder="560001"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-floral-magenta text-white px-6 py-2 rounded text-xs font-bold uppercase hover:bg-pink-700"
            >
              {loading ? "Saving..." : "Save Details"}
            </button>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-500 px-6 py-2 text-xs font-bold uppercase hover:text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

```

---

### **Step 5: Update the Account Page (The Controller)**

This page now acts as a controller. It tries to verify the user first.

1. **If User Exists:** Shows `UserProfile`.
2. **If No User:** Shows `Login/Register` forms.

**File:** `src/app/account/page.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader"; 
import UserProfile from "@/components/profile/UserProfile";
import { User } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  // 1. Check Session on Load (Persistent Login)
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        // Not logged in, stay on login form
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    // In a real app, call an API to clear the cookie
    // For now, we can just force a cookie expire by setting it to past
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.reload(); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Login Successful
      setUser(data.user);
      // Reload to ensure all components (header etc) update
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  // 2. If User is Logged In -> Show Profile
  if (user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <UserProfile user={user} onLogout={handleLogout} />
      </div>
    );
  }

  // 3. If Not Logged In -> Show Login Form
  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 shadow-sm rounded-lg relative overflow-hidden">
        
        <h1 className="font-serif text-2xl text-center mb-2 text-floral-dark">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-xs text-gray-400 mb-8 uppercase tracking-wider">
          {isLogin ? "Login to access your orders" : "Register to start shopping"}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-500 text-xs p-3 rounded mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
              <input 
                type="text" 
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
                placeholder="John Doe" 
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="name@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-floral-magenta text-white py-3.5 font-bold uppercase text-xs rounded shadow-sm hover:bg-pink-700 transition-all"
          >
            {isLogin ? "Sign In" : "Register Now"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="ml-2 text-black font-bold hover:underline hover:text-floral-magenta transition-colors uppercase"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

```




Double Check Your Folder Structure
Ensure your project looks exactly like this:

Plaintext
src/
└── app/
    └── api/
        ├── auth/
        │   ├── login/
        │   │   └── route.ts      <-- NOT login.ts
        │   └── register/
        │       └── route.ts
        └── user/
            └── update/
                └── route.ts      <-- MUST BE route.ts
Code for src/app/api/user/update/route.ts
(Just in case, verify the content is correct after renaming)

TypeScript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 1. Verify User
    const payload = await verifyToken(token || "");
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Data
    const body = await request.json();
    console.log("📝 Received Update Request for:", payload.email);

    // 3. Update via DB Helper
    const updatedUser = db.users.update(payload.email as string, body);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("❌ Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
After renaming the file, restart your server:

Ctrl + C in the terminal.

npm run dev.

Try saving the profile again.

Double Check Your Folder Structure
Ensure your project looks exactly like this:

Plaintext
src/
└── app/
    └── api/
        ├── auth/
        │   ├── login/
        │   │   └── route.ts      <-- NOT login.ts
        │   └── register/
        │       └── route.ts
        └── user/
            └── update/
                └── route.ts      <-- MUST BE route.ts
Code for src/app/api/user/update/route.ts
(Just in case, verify the content is correct after renaming)

TypeScript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 1. Verify User
    const payload = await verifyToken(token || "");
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Data
    const body = await request.json();
    console.log("📝 Received Update Request for:", payload.email);

    // 3. Update via DB Helper
    const updatedUser = db.users.update(payload.email as string, body);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("❌ Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
After renaming the file, restart your server:

Ctrl + C in the terminal.

npm run dev.

Try saving the profile again.


This is happening because `document.cookie = ...` in your client-side code cannot delete **HttpOnly** cookies (which your secure auth token is).

You must create a server-side route to delete the cookie.

### **Step 1: Create the Logout API Route**

Create a new file at `src/app/api/auth/logout/route.ts`.

**File:** `src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // This explicitly deletes the httpOnly cookie from the server side
  cookieStore.delete('token');

  return NextResponse.json({ success: true });
}

```

### **Step 2: Update Account Page**

Update your `AccountPage` to call this new API instead of trying to clear the cookie manually.

**File:** `src/app/account/page.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader"; 
import UserProfile from "@/components/profile/UserProfile";
import { User } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // ✅ UPDATED LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      // 1. Call the server API to delete the HttpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Clear local state
      setUser(null);
      
      // 3. Force a hard reload to reset all states (Header, etc.)
      window.location.href = "/"; 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  if (user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <UserProfile user={user} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 shadow-sm rounded-lg relative overflow-hidden">
        
        <h1 className="font-serif text-2xl text-center mb-2 text-floral-dark">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-xs text-gray-400 mb-8 uppercase tracking-wider">
          {isLogin ? "Login to access your orders" : "Register to start shopping"}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-500 text-xs p-3 rounded mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
              <input 
                type="text" 
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
                placeholder="John Doe" 
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="name@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-floral-magenta text-white py-3.5 font-bold uppercase text-xs rounded shadow-sm hover:bg-pink-700 transition-all"
          >
            {isLogin ? "Sign In" : "Register Now"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="ml-2 text-black font-bold hover:underline hover:text-floral-magenta transition-colors uppercase"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

```


This is happening because `document.cookie = ...` in your client-side code cannot delete **HttpOnly** cookies (which your secure auth token is).

You must create a server-side route to delete the cookie.

### **Step 1: Create the Logout API Route**

Create a new file at `src/app/api/auth/logout/route.ts`.

**File:** `src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // This explicitly deletes the httpOnly cookie from the server side
  cookieStore.delete('token');

  return NextResponse.json({ success: true });
}

```

### **Step 2: Update Account Page**

Update your `AccountPage` to call this new API instead of trying to clear the cookie manually.

**File:** `src/app/account/page.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader"; 
import UserProfile from "@/components/profile/UserProfile";
import { User } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // ✅ UPDATED LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      // 1. Call the server API to delete the HttpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Clear local state
      setUser(null);
      
      // 3. Force a hard reload to reset all states (Header, etc.)
      window.location.href = "/"; 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  if (user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <UserProfile user={user} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 shadow-sm rounded-lg relative overflow-hidden">
        
        <h1 className="font-serif text-2xl text-center mb-2 text-floral-dark">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-xs text-gray-400 mb-8 uppercase tracking-wider">
          {isLogin ? "Login to access your orders" : "Register to start shopping"}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-500 text-xs p-3 rounded mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
              <input 
                type="text" 
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
                placeholder="John Doe" 
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="name@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-200 p-3 rounded text-sm focus:border-floral-magenta outline-none" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-floral-magenta text-white py-3.5 font-bold uppercase text-xs rounded shadow-sm hover:bg-pink-700 transition-all"
          >
            {isLogin ? "Sign In" : "Register Now"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="ml-2 text-black font-bold hover:underline hover:text-floral-magenta transition-colors uppercase"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

```


