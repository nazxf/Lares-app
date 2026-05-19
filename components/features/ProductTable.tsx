import React from 'react';
import { Product } from '@/types';
import { formatCurrency, getStockStatusColor, getStockStatusText } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  loading?: boolean;
}

export function ProductTable({ products, onEdit, loading }: ProductTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Memuat produk...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Belum ada produk</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Produk</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">Harga Jual</TableHead>
          <TableHead className="text-right">Harga Beli</TableHead>
          <TableHead className="text-center">Stok</TableHead>
          <TableHead className="text-center">Status</TableHead>
          {onEdit && <TableHead className="w-[50px]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
            <TableCell className="text-right">{formatCurrency(product.purchasePrice)}</TableCell>
            <TableCell className="text-center">
              <span className={getStockStatusColor(product.stock, product.minimumStock)}>
                {product.stock} {product.unitType}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </TableCell>
            {onEdit && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
