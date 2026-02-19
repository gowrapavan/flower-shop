import { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your order securely on GetFlowersDaily.",
  robots: { index: false }, 
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}