export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discount: number;
  availability: "24hr" | "anytime" | "evening" | "morning";
  quantityUnit: string;
  images: string[];
  description: string;
  tags: string[];
}

export interface User {
  id: string;
  name?: string;
  email: string;
  password?: string;
  role: "admin" | "customer";
  // New Strict Phone Field
  phone?: string; 
  image?: string;
  // Expanded Address Structure
  address?: {
    doorNo: string;
    area: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  user_email: string;
  items: CartItem[];
  total_amount: number;
  shipping_address: User['address'];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}