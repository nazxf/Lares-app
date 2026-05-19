import { CartItem } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/**
 * Format timestamp as Indonesian date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format timestamp as Indonesian date and time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate total from cart items
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Calculate subtotal for a cart item
 */
export function calculateSubtotal(quantity: number, price: number): number {
  return quantity * price;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

/**
 * Parse number from string (remove non-numeric characters)
 */
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Check if product stock is low
 */
export function isLowStock(stock: number, minimumStock: number): boolean {
  return stock <= minimumStock;
}

/**
 * Get stock status color
 */
export function getStockStatusColor(stock: number, minimumStock: number): string {
  if (stock === 0) return 'text-red-600';
  if (stock <= minimumStock) return 'text-orange-600';
  return 'text-green-600';
}

/**
 * Get stock status text
 */
export function getStockStatusText(stock: number, minimumStock: number): string {
  if (stock === 0) return 'Habis';
  if (stock <= minimumStock) return 'Stok Rendah';
  return 'Tersedia';
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random ID (fallback if UUID not available)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
