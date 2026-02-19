import { Metadata } from "next";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Order History | GetFlowersDaily",
  description: "Track your deliveries and view past orders.",
  robots: { index: false }, 
};

export default function OrdersPage() {
  return <OrdersClient />;
}