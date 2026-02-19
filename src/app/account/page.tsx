import { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your profile, shipping address, and view your orders.",
};

export default function AccountPage() {
  return <AccountClient />;
}