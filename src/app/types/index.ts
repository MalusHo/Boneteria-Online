export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  image: string;
  lowStockThreshold: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  deliveryMethod: "home" | "pickup";
  deliveryAddress?: string;
  pickupStore?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "ready-for-pickup" | "completed";
  createdAt: Date;
}
