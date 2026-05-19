import React from 'react';
import { CartItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

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
      <div className="text-center py-12 text-slate-400">
        <p>Keranjang masih kosong</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-center">Jumlah</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            {editable && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.map((item) => (
            <TableRow key={item.productId}>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-center">
                {editable ? (
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    className="w-20 mx-auto text-center"
                  />
                ) : (
                  <span>{item.quantity}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(item.subtotal)}
              </TableCell>
              {editable && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.productId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
