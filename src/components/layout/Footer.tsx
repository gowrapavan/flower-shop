// Footer Component
import { Facebook, Twitter, Instagram, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#fcf8f5] pt-16 pb-8 border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1: Intro & Map */}
        <div className="space-y-4">
          <h3 className="text-floral-magenta font-serif text-lg font-bold">GETFLOWERSDAILY</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Welcome to Bangalore's first online flower shop with round-the-clock customer support. 
            We're here for you 24/7 to bring beauty and joy.
          </p>
          {/* Map Placeholder */}
          <div className="w-full h-32 bg-gray-200 rounded overflow-hidden relative border border-gray-300">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
              <MapPin size={16} className="mr-1"/> Google Map Embed
            </div>
          </div>
        </div>

        {/* Column 2: Pooja Flowers */}
        <div>
          <h4 className="font-bold text-xs uppercase mb-4 text-gray-700">Pooja Flowers</h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li>Loose Flowers</li>
            <li>Rose Garland</li>
            <li>Pink Rose</li>
            <li>Banana Leaves</li>
            <li>Loose Tulsi</li>
            <li>Marigold (Chendupoo)</li>
          </ul>
        </div>

        {/* Column 3: Wedding Flowers */}
        <div>
          <h4 className="font-bold text-xs uppercase mb-4 text-gray-700">Wedding Flowers</h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li>Wedding Garland</li>
            <li>Flower Jewellery</li>
            <li>Jasmine Garland</li>
            <li>Bridal Hair Makeup Set</li>
            <li>Gypse Muggu Jade</li>
          </ul>
        </div>

        {/* Column 4: Links & Social */}
        <div>
          <h4 className="font-bold text-xs uppercase mb-4 text-gray-700">Terms & Policy</h4>
          <ul className="space-y-2 text-xs text-gray-500 mb-6">
            <li>Terms and Conditions</li>
            <li>Privacy Policy</li>
            <li>Refund Policy</li>
          </ul>
          
          <h4 className="font-bold text-xs uppercase mb-2 text-gray-700">Explore Social Media</h4>
          <div className="flex gap-4 text-floral-magenta">
            <Facebook size={18} />
            <Twitter size={18} />
            <Instagram size={18} />
          </div>
        </div>
      </div>
      
      <div className="text-center text-[10px] text-gray-400 mt-12">
        © 2026 GetFlowersDaily. All Rights Reserved.
      </div>
    </footer>
  );
}