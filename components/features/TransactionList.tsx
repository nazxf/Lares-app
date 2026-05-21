import React from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function TransactionList({ transactions, loading }: TransactionListProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Memuat transaksi…</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Catatan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {formatDateTime(transaction.createdAt)}
            </TableCell>
            <TableCell>
              <Badge variant={transaction.type === 'sale' ? 'default' : 'secondary'}>
                {transaction.type === 'sale' ? 'Penjualan' : 'Stok Masuk'}
              </Badge>
            </TableCell>
            <TableCell>
              {transaction.items.length} item
              {transaction.items.length > 1 ? 's' : ''}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(transaction.totalAmount)}
            </TableCell>
            <TableCell className="text-slate-500 text-sm">
              {transaction.notes || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
