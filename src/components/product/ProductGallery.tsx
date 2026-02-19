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