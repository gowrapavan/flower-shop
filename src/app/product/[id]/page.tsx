import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getProductDescription } from "@/lib/markdown";
import ProductGallery from "@/components/product/ProductGallery"; 
import ProductTabs from "@/components/product/ProductTabs";
import ClientAddToCart from "@/components/product/ClientAddToCart";
import ProductCard from "@/components/product/ProductCard"; 
import ProductShare from "@/components/product/ProductShare"; 
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params;
  const product = db.products.getById(id);

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    openGraph: {
      images: [product.images[0]],
    },
  };
}
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