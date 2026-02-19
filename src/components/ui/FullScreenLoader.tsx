"use client";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        {/* Spinning Outer Ring */}
        <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-floral-magenta/20 border-t-floral-magenta rounded-full animate-spin"></div>
        {/* Pulsing Core */}
        <div className="absolute inset-0 m-auto w-8 h-8 md:w-10 md:h-10 bg-floral-magenta/10 rounded-full animate-pulse"></div>
      </div>
      
      <h2 className="text-floral-magenta font-serif text-xl md:text-2xl font-bold mb-2 tracking-tight">
        GETFLOWERSDAILY
      </h2>
      <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.3em]">
        Flowers at a click
      </p>
    </div>
  );
}