import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  const discountedPrice = product.price - (product.price * (product.discount / 100));

  return (
    <div className="group bg-white rounded-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col h-full overflow-hidden">
      <Link href={`/product/${product.id}`} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative h-36 sm:h-64 w-full overflow-hidden flex-shrink-0">
          <Image 
            src={product.images[0]} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          
          {/* Discount Badge */}
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 bg-floral-magenta text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-2 sm:p-4 flex flex-col flex-grow justify-between min-h-[110px] sm:min-h-[140px]">
          <div>
            {/* Title & Quantity - Using line-clamp to prevent overflow */}
            <h3 className="text-[10px] sm:text-sm font-medium text-gray-900 uppercase tracking-wide leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
              {product.name} {product.quantityUnit && `– ${product.quantityUnit}`}
            </h3>
            
            {/* Availability Badge - Optimized for Mobile */}
            <div className="mb-2">
               {product.availability === '24hr' ? (
                 <span className="bg-[#EB8126] text-white text-[9px] sm:text-[12px] px-1.5 sm:px-3 py-1 rounded-[3px] font-medium inline-block whitespace-nowrap">
                   24hr Lead Time
                 </span>
               ) : (
                 <span className="bg-[#4CAF50] text-white text-[9px] sm:text-[12px] px-1.5 sm:px-3 py-1 rounded-[3px] font-medium inline-block whitespace-nowrap">
                   Anytime Delivery
                 </span>
               )}
            </div>
          </div>

          {/* Pricing - Pushed to bottom */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-3 mt-auto pt-1 border-t border-gray-50">
            <span className="text-[10px] sm:text-base text-gray-400 line-through decoration-1">
              ₹{product.price.toFixed(0)}
            </span>
            <span className="text-xs sm:text-base font-bold text-gray-900">
              ₹{discountedPrice.toFixed(0)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}