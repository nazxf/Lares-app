import { useState, useEffect, useCallback } from 'react';
import { StockMovement } from '@/types';
import { fetchStockMovements } from '../lib/db';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useStockMovements(storeId?: string, limit: number = 100) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMovements = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockMovements(storeId, limit);
      setMovements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.LOAD_MOVEMENTS;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [storeId, limit]);

  const getMovementsByProduct = useCallback((productId: string): StockMovement[] => {
    return movements.filter(m => m.productId === productId);
  }, [movements]);

  const getMovementsByType = useCallback((type: 'sale' | 'stock_in'): StockMovement[] => {
    return movements.filter(m => m.type === type);
  }, [movements]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return {
    movements,
    loading,
    error,
    loadMovements,
    getMovementsByProduct,
    getMovementsByType,
  };
}
