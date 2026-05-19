import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Product, ProductInput } from '@/types';
import { fetchStoreProducts, addProduct as apiAddProduct, updateProduct as apiUpdateProduct } from '../lib/db';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useProducts(storeId?: string) {
  type ProductsKey = ['products', string];
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Product[], Error, ProductsKey | null>(
    storeId ? ['products', storeId] : null,
    ([, id]: ProductsKey) => fetchStoreProducts(id),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      onError: err => {
        const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.LOAD_PRODUCTS;
        toast.error(message);
      },
    }
  );

  const products = data ?? [];

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    await mutate();
  }, [storeId, mutate]);

  const addProduct = useCallback(async (productData: ProductInput) => {
    if (!storeId) return;

    try {
      await apiAddProduct(storeId, productData);
      toast.success(TOAST_MESSAGES.SUCCESS.PRODUCT_ADDED);
      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.GENERIC;
      toast.error(message);
      throw err;
    }
  }, [storeId, mutate]);

  const updateProduct = useCallback(async (productId: string, productData: Partial<ProductInput>) => {
    if (!storeId) return;

    try {
      await apiUpdateProduct(storeId, productId, productData);
      toast.success(TOAST_MESSAGES.SUCCESS.PRODUCT_UPDATED);
      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.GENERIC;
      toast.error(message);
      throw err;
    }
  }, [storeId, mutate]);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products]);
  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock <= p.minimumStock),
    [products]
  );

  const getActiveProducts = useCallback((): Product[] => activeProducts, [activeProducts]);
  const getLowStockProducts = useCallback((): Product[] => lowStockProducts, [lowStockProducts]);

  return {
    products,
    loading: isLoading && products.length === 0,
    refreshing: isValidating,
    error: error ? (error instanceof Error ? error.message : TOAST_MESSAGES.ERROR.LOAD_PRODUCTS) : null,
    loadProducts,
    addProduct,
    updateProduct,
    getProductById,
    getActiveProducts,
    getLowStockProducts,
  };
}
