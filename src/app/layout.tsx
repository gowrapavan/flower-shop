import type { Metadata } from "next";
import "./globals.css"; // <--- THIS IS THE MAGIC LINE. WITHOUT IT = NO STYLES.
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: "GetFlowersDaily | Fresh Flowers Delivered Daily",
    template: "%s | GetFlowersDaily"
  },
  description: "Order fresh Pooja flowers, Wedding garlands, and Bridal flowers online. Fast delivery for all your floral needs.",
  keywords: ["flowers", "pooja flowers", "wedding garland", "online flower delivery"],
  openGraph: {
    title: "GetFlowersDaily",
    description: "Fresh flowers at your doorstep daily.",
    url: "https://yourdomain.com",
    siteName: "GetFlowersDaily",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-floral-dark font-sans">
        <AuthProvider>
        <CartProvider>
          {/* This component handles the visual rendering of all alerts */}
            <Toaster position="top-center" reverseOrder={false} />
          <Header />
          {children}
          <Footer />
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}