import { useState, useCallback, useMemo } from 'react';
import { CartItem, Product } from '@/types';
import { calculateCartTotal, calculateSubtotal } from '@/lib/utils';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      toast.error(TOAST_MESSAGES.ERROR.OUT_OF_STOCK);
      return false;
    }

    if (quantity <= 0) {
      toast.error(TOAST_MESSAGES.ERROR.INVALID_QUANTITY);
      return false;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Maksimal stok ${product.name} adalah ${product.stock}`);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: calculateSubtotal(newQuantity, item.price),
              }
            : item
        );
      }

      if (quantity > product.stock) {
        toast.error(`Maksimal stok ${product.name} adalah ${product.stock}`);
        return prevCart;
      }

      return [
        ...prevCart,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          price: product.sellingPrice,
          subtotal: calculateSubtotal(quantity, product.sellingPrice),
        },
      ];
    });

    return true;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, maxStock?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (maxStock && quantity > maxStock) {
      toast.error(`Maksimal stok adalah ${maxStock}`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: calculateSubtotal(quantity, item.price),
            }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const total = useMemo(() => calculateCartTotal(cart), [cart]);

  const itemCount = useMemo(() => cart.length, [cart]);

  const isEmpty = useMemo(() => cart.length === 0, [cart]);

  return {
    cart,
    total,
    itemCount,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
