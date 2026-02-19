import { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Shopping Cart | GetFlowersDaily",
  description: "Review your selected flowers and proceed to secure checkout.",
  robots: { index: false }, 
};

export default function CartPage() {
  return <CartClient />;
}