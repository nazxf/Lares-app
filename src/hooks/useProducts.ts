import { useState, useEffect, useCallback } from 'react';
import { Product, ProductInput } from '@/types';
import { fetchStoreProducts, addProduct as apiAddProduct, updateProduct as apiUpdateProduct } from '../lib/db';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useProducts(storeId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoreProducts(storeId);
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.LOAD_PRODUCTS;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const addProduct = useCallback(async (productData: ProductInput) => {
    if (!storeId) return;

    try {
      await apiAddProduct(storeId, productData);
      toast.success(TOAST_MESSAGES.SUCCESS.PRODUCT_ADDED);
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.GENERIC;
      toast.error(message);
      throw err;
    }
  }, [storeId, loadProducts]);

  const updateProduct = useCallback(async (productId: string, productData: Partial<ProductInput>) => {
    if (!storeId) return;

    try {
      await apiUpdateProduct(storeId, productId, productData);
      toast.success(TOAST_MESSAGES.SUCCESS.PRODUCT_UPDATED);
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.GENERIC;
      toast.error(message);
      throw err;
    }
  }, [storeId, loadProducts]);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const getActiveProducts = useCallback((): Product[] => {
    return products.filter(p => p.status === 'active');
  }, [products]);

  const getLowStockProducts = useCallback((): Product[] => {
    return products.filter(p => p.stock <= p.minimumStock);
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    getProductById,
    getActiveProducts,
    getLowStockProducts,
  };
}
