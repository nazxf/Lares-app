// Application constants

export const APP_NAME = 'Lares POS';
export const APP_VERSION = '1.0.0';

// Product categories
export const PRODUCT_CATEGORIES = [
  'Water',
  'Gas',
  'Beverage',
  'Snack',
  'Other',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Unit types
export const UNIT_TYPES = [
  'Unit',
  'Galon',
  'Tabung',
  'Botol',
  'Dus',
  'Karton',
  'Pcs',
] as const;

export type UnitType = typeof UNIT_TYPES[number];

// Product status
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// Transaction types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  STOCK_IN: 'stock_in',
} as const;

// User roles
export const USER_ROLES = {
  OWNER: 'owner',
  CASHIER: 'cashier',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  USERS: {
    GET: (userId: string) => `/api/users/${userId}`,
    UPDATE: (userId: string) => `/api/users/${userId}`,
  },
  STORES: {
    CREATE: '/api/stores',
    GET: (storeId: string) => `/api/stores/${storeId}`,
  },
  PRODUCTS: {
    LIST: (storeId: string) => `/api/stores/${storeId}/products`,
    CREATE: (storeId: string) => `/api/stores/${storeId}/products`,
    UPDATE: (storeId: string, productId: string) => 
      `/api/stores/${storeId}/products/${productId}`,
  },
  TRANSACTIONS: {
    LIST: (storeId: string, limit?: number) => 
      `/api/stores/${storeId}/transactions${limit ? `?limit=${limit}` : ''}`,
    PROCESS: (storeId: string) => `/api/stores/${storeId}/transactions/process`,
  },
  STOCK_MOVEMENTS: {
    LIST: (storeId: string, limit?: number) => 
      `/api/stores/${storeId}/stock-movements${limit ? `?limit=${limit}` : ''}`,
  },
  HEALTH: '/api/health',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
} as const;

// Validation rules
export const VALIDATION = {
  MIN_PRODUCT_NAME_LENGTH: 2,
  MAX_PRODUCT_NAME_LENGTH: 100,
  MIN_STORE_NAME_LENGTH: 2,
  MAX_STORE_NAME_LENGTH: 100,
  MIN_STOCK: 0,
  MAX_STOCK: 999999,
  MIN_PRICE: 0,
  MAX_PRICE: 999999999,
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    PRODUCT_ADDED: 'Produk berhasil ditambahkan',
    PRODUCT_UPDATED: 'Produk berhasil diperbarui',
    TRANSACTION_PROCESSED: 'Transaksi berhasil diproses',
    STORE_CREATED: 'Toko berhasil dibuat',
  },
  ERROR: {
    GENERIC: 'Terjadi kesalahan',
    LOAD_PRODUCTS: 'Gagal memuat produk',
    LOAD_TRANSACTIONS: 'Gagal memuat transaksi',
    LOAD_MOVEMENTS: 'Gagal memuat riwayat stok',
    PROCESS_TRANSACTION: 'Gagal memproses transaksi',
    EMPTY_CART: 'Keranjang masih kosong',
    OUT_OF_STOCK: 'Stok produk habis',
    INVALID_QUANTITY: 'Jumlah tidak valid',
  },
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'dd MMM yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd MMM yyyy HH:mm',
} as const;

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'lares_user',
  THEME: 'lares_theme',
  CART: 'lares_cart',
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
} as const;
