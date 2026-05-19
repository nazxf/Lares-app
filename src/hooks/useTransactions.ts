import { useCallback } from 'react';
import useSWR from 'swr';
import { Transaction } from '@/types';
import { fetchStoreTransactions, processSaleOrStockIn } from '../lib/db';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

export function useTransactions(storeId?: string, limit: number = 50) {
  type TransactionsKey = ['transactions', string, number];
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Transaction[], Error, TransactionsKey | null>(
    storeId ? ['transactions', storeId, limit] : null,
    ([, id, transactionLimit]: TransactionsKey) => fetchStoreTransactions(id, transactionLimit),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 15_000,
      onError: err => {
        const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.LOAD_TRANSACTIONS;
        toast.error(message);
      },
    }
  );

  const transactions = data ?? [];

  const loadTransactions = useCallback(async () => {
    if (!storeId) return;
    await mutate();
  }, [storeId, mutate]);

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
      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : TOAST_MESSAGES.ERROR.PROCESS_TRANSACTION;
      toast.error(message);
      throw err;
    }
  }, [storeId, mutate]);

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

  return {
    transactions,
    loading: isLoading && transactions.length === 0,
    refreshing: isValidating,
    error: error ? (error instanceof Error ? error.message : TOAST_MESSAGES.ERROR.LOAD_TRANSACTIONS) : null,
    loadTransactions,
    processTransaction,
    getRecentTransactions,
    getTotalRevenue,
    getTransactionCount,
  };
}
