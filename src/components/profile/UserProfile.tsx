"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { User } from "@/types";
import { LogOut, Camera, Edit2, Check, X, MapPin, Phone, User as UserIcon, Home, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast"; // <-- ADDED


// Just an array of strings: ["1", "2", "3", ... "14"]
const AVATAR_OPTIONS = Array.from({ length: 14 }, (_, i) => (i + 1).toString());

interface LocationData { id: number; name: string; }

export default function UserProfile({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { updateUserCache } = useAuth();
  
  const isProfileIncomplete = !user.phone || !user.address?.doorNo || !user.address?.city;
  const [isEditing, setIsEditing] = useState(isProfileIncomplete);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState<LocationData[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    image: user.image || "1", // defaults to "1"
    phone: user.phone || "",
    doorNo: user.address?.doorNo || "",
    area: user.address?.area || "",
    landmark: user.address?.landmark || "",
    city: user.address?.city || "",
    state: user.address?.state || "",
    country: user.address?.country || "",
    zip: user.address?.zip || "",
  });

  // Helper to safely render image paths in the UI based on the number
  const getAvatarPath = (val: string) => {
    if (!val) return '/profile_pics/1.png';
    return val.includes('/') ? val : `/profile_pics/${val}.png`;
  };

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/map_data/countries.json');
        if (res.ok) setCountries(await res.json());
      } catch (e) { console.error("Failed to load countries"); }
    }
    loadCountries();
  }, []);

  useEffect(() => {
    if (isEditing && formData.country) handleCountryChange(formData.country, false);
  }, [isEditing]); 

  useEffect(() => {
    if (isEditing && formData.country && formData.state) handleStateChange(formData.state, false);
  }, [isEditing, formData.state]); 

  const handleCountryChange = async (selectedCountry: string, resetChildren = true) => {
    if (resetChildren) {
      setFormData(prev => ({ ...prev, country: selectedCountry, state: "", city: "" }));
      setStates([]); setCities([]);
    }
    if (!selectedCountry) return;
    setLoadingStates(true);
    try {
      const res = await fetch('/map_data/countries+states.json');
      const data = await res.json();
      const countryObj = data.find((c: any) => c.name === selectedCountry);
      if (countryObj && countryObj.states) setStates(countryObj.states);
    } catch (e) { } finally { setLoadingStates(false); }
  };

  const handleStateChange = async (selectedState: string, resetChildren = true) => {
    if (resetChildren) {
      setFormData(prev => ({ ...prev, state: selectedState, city: "" }));
      setCities([]);
    }
    if (!selectedState || !formData.country) return;
    setLoadingCities(true);
    try {
      const res = await fetch('/map_data/countries+states+cities.json');
      const data = await res.json();
      const countryObj = data.find((c: any) => c.name === formData.country);
      if (countryObj) {
        const stateObj = countryObj.states.find((s: any) => s.name === selectedState);
        if (stateObj && stateObj.cities) setCities(stateObj.cities);
      }
    } catch (e) { } finally { setLoadingCities(false); }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) setFormData({ ...formData, phone: value });
  };

  // SAVES ONLY THE NUMBER "1", "2", etc.
  const handleImageSelect = async (imgNumber: string) => {
    setFormData(prev => ({ ...prev, image: imgNumber }));
    setShowImagePicker(false);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgNumber })
      });
      if (res.ok) {
        const data = await res.json();
        updateUserCache(data.user); 
      }
    } catch (e) { console.error("Image save error"); }
  };

  // ... imports and state ...
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating your profile...");

    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          address: {
            doorNo: formData.doorNo, area: formData.area, landmark: formData.landmark,
            city: formData.city, state: formData.state, country: formData.country, zip: formData.zip
          }
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsEditing(false);
        updateUserCache(data.user);
        toast.success("Profile saved successfully!", { id: toastId });
      } else {
        toast.error("Failed to update profile. Please check the form.", { id: toastId });
      }
    } catch (error) {
      toast.error("Connection error. Try again later.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 font-sans transition-all duration-300">
      <div className="bg-gradient-to-r from-pink-50 to-white h-32 relative">
         <button onClick={onLogout} className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold uppercase text-gray-500 hover:text-red-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm transition-colors">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="px-8 pb-8">
        <div className="relative flex justify-between items-end -mt-12 mb-8">
          <div className="flex items-end gap-6">
            <div className="relative group">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                {/* Dynamically loads /profile_pics/1.png */}
                <Image src={getAvatarPath(formData.image)} alt="Profile" fill sizes="100px" className="object-cover" />
              </div>
              <button onClick={() => setShowImagePicker(!showImagePicker)} className="absolute bottom-0 right-0 bg-floral-magenta text-black p-2 rounded-full hover:bg-pink-700 shadow-md z-10 border-2 border-white"><Camera size={14} /></button>
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-serif text-gray-900 font-bold leading-tight">{user.name}</h1>
              <p className="text-sm text-gray-500 font-medium">{user.email}</p>
            </div>
          </div>
        </div>

        {showImagePicker && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                 <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Select an Avatar</p>
                 <button onClick={() => setShowImagePicker(false)}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-4 justify-items-center">
              {AVATAR_OPTIONS.map((num) => (
                <button key={num} onClick={() => handleImageSelect(num)} className={`relative w-14 h-14 rounded-full overflow-hidden border-2 hover:scale-110 transition-all ${formData.image === num ? 'border-floral-magenta ring-2 ring-pink-100 scale-110' : 'border-transparent'}`}>
                  <Image src={`/profile_pics/${num}.png`} alt={`Avatar ${num}`} fill sizes="60px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <hr className="border-gray-100 mb-8" />

        {!isEditing ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <UserIcon size={18} className="text-floral-magenta"/> Profile Details
                 </h2>
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-floral-magenta text-sm font-bold uppercase hover:bg-pink-50 px-4 py-2 rounded-lg transition-colors">
                    <Edit2 size={16} /> Edit
                 </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-1 flex items-center gap-2"><Phone size={14}/> Mobile</h3>
                <p className="text-gray-900 font-medium text-lg">+91 {user.phone || "--"}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-1 flex items-center gap-2"><MapPin size={14} /> Address</h3>
                {user.address ? (
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {user.address.doorNo}, {user.address.area} <br/>
                    {user.address.landmark && <span className="text-sm text-gray-500 block mt-1">Near {user.address.landmark}</span>}
                    {user.address.city}, {user.address.state}, {user.address.country} - <span className="font-bold">{user.address.zip}</span>
                  </p>
                ) : <span className="text-gray-400 italic">Not provided</span>}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Update Information</h2>
            
            <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Phone Number (10 Digits)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-gray-400 font-bold">+91</span>
                    <input type="text" value={formData.phone} onChange={handlePhoneChange} className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-floral-magenta focus:ring-4 focus:ring-pink-50/50 outline-none transition-all placeholder:text-gray-300" placeholder="9876543210" required />
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                  <h3 className="text-xs font-bold uppercase text-floral-magenta mb-4 flex gap-2 items-center"><Home size={14}/> Shipping Address</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Door / Flat No</label>
                       <input type="text" value={formData.doorNo} onChange={e => setFormData({...formData, doorNo: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none" placeholder="#101, 2nd Floor" required />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Zip Code</label>
                       <input type="text" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none" placeholder="522001" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Area / Street</label>
                       <input type="text" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none" placeholder="e.g. Brodipet" required />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Landmark</label>
                       <input type="text" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none" placeholder="Near Siva Temple" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Country</label>
                       <select value={formData.country} onChange={(e) => handleCountryChange(e.target.value, true)} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none appearance-none" required>
                         <option value="">-- Select --</option>
                         {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex justify-between">State {loadingStates && <Loader2 size={12} className="animate-spin text-floral-magenta"/>}</label>
                       <select value={formData.state} onChange={(e) => handleStateChange(e.target.value, true)} disabled={!formData.country || loadingStates} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none disabled:bg-gray-100 disabled:text-gray-400 appearance-none" required>
                         <option value="">-- Select --</option>
                         {states.map((s, i) => <option key={i} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex justify-between">City {loadingCities && <Loader2 size={12} className="animate-spin text-floral-magenta"/>}</label>
                       <select value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!formData.state || loadingCities} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm focus:border-floral-magenta outline-none disabled:bg-gray-100 disabled:text-gray-400 appearance-none" required>
                         <option value="">-- Select --</option>
                         {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                  </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-sm font-bold uppercase text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-pink-500 text-white px-8 py-3 rounded-lg text-sm font-bold uppercase shadow-lg hover:bg-pink-700 hover:text-white hover:shadow-xl transition-all disabled:opacity-70">
                {loading ? "Saving..." : <><Check size={18}/> Save Changes</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}