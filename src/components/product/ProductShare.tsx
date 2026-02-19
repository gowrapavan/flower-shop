"use client";
import { Facebook, Twitter, Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "@/types";

export default function ProductShare({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(""); // Start with empty state

  // Set the URL only after mounting to prevent hydration mismatch
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const text = `Check out ${product.name} on GetFlowersDaily!`;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-4 mt-2">
      <span className="text-[10px] md:text-xs font-bold uppercase text-gray-500 tracking-wider">Share:</span>
      <div className="flex gap-5 sm:gap-4">
        {/* Facebook */}
        <a 
          href={shareUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` : "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-[#1877F2] transition-colors p-1"
        >
          <Facebook size={18} />
        </a>

        {/* Twitter/X */}
        <a 
          href={shareUrl ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}` : "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-[#1DA1F2] transition-colors p-1"
        >
          <Twitter size={18} />
        </a>

        {/* WhatsApp */}
        <a 
          href={shareUrl ? `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}` : "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-[#25D366] transition-colors p-1"
        >
          <Share2 size={18} />
        </a>

        {/* Copy Link */}
        <button 
          onClick={handleCopy} 
          className={`transition-colors p-1 ${copied ? 'text-green-600' : 'text-gray-400 hover:text-black'}`}
        >
          {copied ? <Check size={18} /> : <LinkIcon size={18} />}
        </button>
      </div>
    </div>
  );
}