import { ShoppingBasket, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/app/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CartItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  total: number;
  editable?: boolean;
}

export function CartTable({ cart, onUpdateQuantity, onRemove, total, editable = true }: CartTableProps) {
  if (cart.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title="Keranjang Kosong"
        description="Pilih produk dari panel kiri untuk mulai mencatat transaksi."
        className="min-h-[260px]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table className="min-w-[620px]">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="px-4">Produk</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-center">Jumlah</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            {editable && <TableHead className="w-12 pr-4 text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.map(item => (
            <TableRow key={item.productId}>
              <TableCell className="px-4 font-semibold text-slate-900">{item.productName}</TableCell>
              <TableCell className="text-right font-mono text-slate-500 tabular-nums">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-center">
                {editable ? (
                  <Input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    name={`quantity-${item.productId}`}
                    value={item.quantity}
                    aria-label={`Jumlah ${item.productName}`}
                    onChange={event => onUpdateQuantity(item.productId, parseInt(event.target.value, 10) || 1)}
                    className="mx-auto h-8 w-20 text-center font-mono tabular-nums"
                    autoComplete="off"
                  />
                ) : (
                  <span className="font-mono tabular-nums">{item.quantity}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono font-semibold tabular-nums text-slate-900">
                {formatCurrency(item.subtotal)}
              </TableCell>
              {editable && (
                <TableCell className="pr-4 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(item.productId)}
                    className="text-slate-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Hapus ${item.productName} dari keranjang`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-600">Total</span>
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-cyan-700">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
