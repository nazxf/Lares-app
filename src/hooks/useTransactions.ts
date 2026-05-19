import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { fetchStoreTransactions, processSaleOrStockIn } from '../lib/db';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useTransactions(storeId?: string, limit: number = 50) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoreTransactions(storeId, limit);
      setTransactions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.LOAD_TRANSACTIONS;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [storeId, limit]);

  const processTransaction = useCallback(async (
    cashierId: string,
    type: 'sale' | 'stock_in',
    items: any[],
    totalAmount: number,
    notes: string = ''
  ) => {
    if (!storeId) return;

    if (items.length === 0) {
      toast.error(TOAST_MESSAGES.ERROR.EMPTY_CART);
      return;
    }

    try {
      await processSaleOrStockIn(storeId, cashierId, type, items, totalAmount, notes);
      toast.success(TOAST_MESSAGES.SUCCESS.TRANSACTION_PROCESSED);
      await loadTransactions();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.PROCESS_TRANSACTION;
      toast.error(message);
      throw err;
    }
  }, [storeId, loadTransactions]);

  const getRecentTransactions = useCallback((count: number = 10): Transaction[] => {
    return transactions.slice(0, count);
  }, [transactions]);

  const getTotalRevenue = useCallback((): number => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }, [transactions]);

  const getTransactionCount = useCallback((): number => {
    return transactions.length;
  }, [transactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    processTransaction,
    getRecentTransactions,
    getTotalRevenue,
    getTransactionCount,
  };
}
