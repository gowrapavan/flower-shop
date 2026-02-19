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