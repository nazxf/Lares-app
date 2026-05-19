// Shared TypeScript types for Lares POS App

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'cashier';
  storeId?: string;
  createdAt: number;
}

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  stock: number;
  minimumStock: number;
  unitType: string;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

export interface ProductInput {
  name: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  stock: number;
  minimumStock: number;
  unitType: string;
  status: 'active' | 'inactive';
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'stock_in';
  items: TransactionItem[];
  totalAmount: number;
  cashierId: string;
  notes: string;
  createdAt: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'sale' | 'stock_in';
  quantity: number;
  notes: string;
  createdAt: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  lowStockProducts: number;
  recentTransactions: Transaction[];
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  name: string;
}

export interface LoginResponse {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
  };
  profile: UserProfile;
}

export interface CreateStoreRequest {
  name: string;
  ownerId: string;
}

export interface ProcessTransactionRequest {
  cashierId: string;
  type: 'sale' | 'stock_in';
  items: TransactionItem[];
  totalAmount: number;
  notes?: string;
}
