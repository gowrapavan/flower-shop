"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import { Search, SlidersHorizontal } from "lucide-react";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState(3000); 
  const [loading, setLoading] = useState(true);

  // 1. Fetch Products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
        // Small timeout for a smoother visual transition
        setTimeout(() => setLoading(false), 600);
      } catch (error) {
        console.error("Failed to load products", error);
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // 2. Filter Logic
  useEffect(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    result = result.filter(p => p.price <= priceRange);
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, priceRange, products]);

  const categories = [
    "All", "Pooja Flowers", "Loose Flowers", "Wedding Garland", 
    "Bridal Flowers", "Decoration", "Wedding Essentials"
  ];

  // Show the high-end loader while fetching
  if (loading) return <FullScreenLoader />;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8 animate-in fade-in duration-700">
      
      {/* --- SIDEBAR FILTERS --- */}
      <aside className="w-full md:w-64 space-y-6 md:space-y-8 flex-shrink-0">
        
        {/* Search Box */}
        <div className="space-y-2">
          <div className="hidden md:block bg-floral-magenta text-black py-2 px-4 text-sm font-bold uppercase tracking-wider text-center rounded-t-sm">
            Search Products
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search flowers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border p-3 md:p-2 pl-10 md:pl-8 text-sm md:text-xs rounded shadow-sm outline-none focus:border-floral-magenta" 
            />
            <Search className="absolute left-3 md:left-2 top-3.5 md:top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        {/* Category Filter - Responsive Horizontal Scroll */}
        <div>
           <h3 className="font-bold text-xs uppercase mb-3 md:mb-4 border-b pb-2 flex items-center gap-2">
             <SlidersHorizontal size={14} /> Categories
           </h3>
           <ul className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
             {categories.map((cat) => (
               <li key={cat} className="flex-shrink-0">
                 <button 
                   onClick={() => setSelectedCategory(cat)}
                   className={`text-xs px-4 py-2 md:px-0 md:py-1 md:w-full md:text-left transition-all rounded-full md:rounded-none border md:border-0 ${
                     selectedCategory === cat 
                     ? "bg-floral-magenta text-black md:bg-transparent md:text-floral-magenta md:font-bold md:pl-2 md:border-l-2 md:border-floral-magenta" 
                     : "bg-white text-gray-600 border-gray-200 hover:text-black"
                   }`}
                 >
                   {cat}
                 </button>
               </li>
             ))}
           </ul>
        </div>

        {/* Price Filter */}
        <div className="bg-floral-light/20 p-4 rounded-sm md:bg-transparent md:p-0">
          <h3 className="font-bold text-xs uppercase mb-4 border-b pb-2">Price Range</h3>
          <input 
            type="range" 
            min="0" 
            max="3000" 
            value={priceRange} 
            onChange={(e) => setPriceRange(Number(e.target.value))}
            // Remove accent-floral-magenta here as we are using the CSS above for better control
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] md:text-xs text-gray-500 mt-2">
            <span>₹0</span>
            <span className="font-bold text-floral-magenta uppercase font-sans">Under ₹{priceRange}</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN PRODUCT GRID --- */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <h1 className="text-xl md:text-2xl font-serif text-floral-dark">
             {selectedCategory === "All" ? "Collection" : selectedCategory}
           </h1>
           <span className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400">
             {filteredProducts.length} Results
           </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-400 text-sm italic">No flowers found matching your criteria.</p>
            <button 
              onClick={() => {setSelectedCategory("All"); setSearchQuery(""); setPriceRange(3000);}}
              className="text-floral-magenta text-xs font-bold uppercase mt-4 border-b border-floral-magenta"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}