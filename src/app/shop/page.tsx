import { Metadata } from "next";
import ShopClient from "./ShopClient";

// SEO Metadata works here because this is a Server Component
export const metadata: Metadata = {
  title: "Shop All Flowers",
  description: "Browse our collection of fresh Pooja flowers, Loose flowers, and Wedding essentials.",
};

export default function ShopPage() {
  return <ShopClient />;
}