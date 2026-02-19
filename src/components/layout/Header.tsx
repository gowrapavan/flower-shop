"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X, User as UserIcon, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { cart } = useCart();
  const { user } = useAuth(); 
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Translates "1" from DB into "/profile_pics/1.png"
  const getProfileImage = () => {
    if (user?.image) {
      return user.image.includes('/') ? user.image : `/profile_pics/${user.image}.png`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=FCE4EC&color=C2185B&bold=true`;
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* SINGLE LINE DESKTOP CONTAINER */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Mobile Hamburger Button */}
        <button className="md:hidden text-gray-600 mr-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* LOGO */}
        <Link href="/" className="flex flex-col items-center md:items-start flex-1 md:flex-none">
           <span className="text-lg md:text-2xl font-serif text-floral-magenta font-bold leading-none tracking-tight">GETFLOWERSDAILY</span>
           <span className="text-[10px] md:text-xs text-gray-400 italic">flowers at a click</span>
        </Link>

        {/* RIGHT SIDE NAV ITEMS - Perfectly Aligned */}
        <div className="flex items-center gap-5 md:gap-7 text-[11px] md:text-xs font-bold uppercase tracking-wide text-gray-600">
          
          {/* Price Check (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
            <span className="text-floral-magenta">Date:</span>
            <input type="date" defaultValue={today} className="bg-transparent outline-none text-gray-700 cursor-pointer font-sans" />
          </div>

          {/* Search (Desktop only) */}
          <div className="hidden md:flex items-center gap-1.5 cursor-pointer hover:text-floral-magenta transition-colors">
            <Search size={16} />
            <span className="mt-[2px]">Search</span>
          </div>

          {/* Home (Desktop only) */}
          <Link href="/shop" className={`hidden md:flex items-center transition-colors ${isActive('/shop') ? 'text-floral-magenta' : 'hover:text-floral-magenta'}`}>
            <span className="mt-[2px]">Home</span>
          </Link>

          {/* My Orders (Desktop only - Only shows if logged in) */}
          {user && (
            <Link href="/orders" className={`hidden md:flex items-center gap-1.5 transition-colors ${isActive('/orders') ? 'text-floral-magenta' : 'hover:text-floral-magenta'}`}>
              <Package size={16} />
              <span className="mt-[2px]">My Orders</span>
            </Link>
          )}

          {/* Cart (Mobile & Desktop) */}
          <Link href="/cart" className="flex items-center gap-1.5 cursor-pointer hover:text-floral-magenta transition-colors relative">
            <ShoppingBag size={18} />
            <span className="hidden md:inline mt-[2px]">Cart ({cart?.length || 0})</span>
            
            {/* Mobile Cart Badge */}
            <span className="md:hidden absolute -top-1.5 -right-2 text-[9px] bg-floral-magenta text-white w-4 h-4 flex items-center justify-center rounded-full">
              {cart?.length || 0}
            </span>
          </Link>

          {/* Profile (Desktop only) */}
          <Link href="/account" className="hidden md:flex items-center gap-2 hover:text-floral-magenta transition-colors">
            {user ? (
              <>
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                  <Image src={getProfileImage()} alt="Profile" fill className="object-cover" />
                </div>
                <span className="text-floral-magenta mt-[2px] truncate max-w-[100px]">{user.name?.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <UserIcon size={16} />
                <span className="mt-[2px]">Account</span>
              </>
            )}
          </Link>

        </div>
      </div>

      {/* MOBILE MENU DROP DOWN */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl z-50">
          <div className="flex flex-col p-4 space-y-4 text-sm font-bold uppercase text-gray-600">
             <div className="flex items-center gap-2 bg-pink-50 px-3 py-2 rounded border border-pink-100 mb-2">
               <span className="text-floral-magenta text-xs">Date:</span>
               <input type="date" defaultValue={today} className="bg-transparent outline-none text-gray-700 cursor-pointer text-xs" />
             </div>
             <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="border-b border-gray-50 pb-2">Home</Link>
             <Link href="/shop?filter=category" onClick={() => setIsMenuOpen(false)} className="border-b border-gray-50 pb-2">By Category</Link>
             
             {user && (
               <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="border-b border-gray-50 pb-2">My Orders</Link>
             )}

             <Link href="/account" onClick={() => setIsMenuOpen(false)}>My Account</Link>
          </div>
        </nav>
      )}
    </header>
  );
}