import { useState } from 'react';
import { CreditCard, PackageSearch, Plus, RefreshCw, ShoppingCart } from 'lucide-react';

import { DataPanel } from '@/components/app/DataPanel';
import { EmptyState } from '@/components/app/EmptyState';
import { PageHeader } from '@/components/app/PageHeader';
import { CartTable } from '@/components/features/CartTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency } from '../lib/utils';

export default function Sales() {
  const { userProfile, currentUser } = useAuth();
  const { products, loading: productsLoading, refreshing: productsRefreshing, getActiveProducts } = useProducts(userProfile?.storeId);
  const { cart, total, isEmpty, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { processTransaction } = useTransactions(userProfile?.storeId);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const activeProducts = getActiveProducts();
  const selectedProduct = products.find(product => product.id === selectedProductId);

  const handleAddToCart = () => {
    if (!selectedProductId) return;

    const product = products.find(item => item.id === selectedProductId);
    if (!product) return;

    const success = addToCart(product, 1);
    if (success) {
      setSelectedProductId('');
    }
  };

  const handleCheckout = async () => {
    if (!userProfile?.storeId || !currentUser || isEmpty) {
      return;
    }

    setLoading(true);
    try {
      await processTransaction(currentUser.uid, 'sale', cart, total, notes);
      clearCart();
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 pb-24 sm:p-6 lg:pb-6">
      <PageHeader
        eyebrow="Kasir"
        title="Penjualan"
        description="Catat transaksi harian dengan pilihan produk, keranjang, dan total bayar dalam satu layar."
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600">
              {activeProducts.length} produk aktif
            </span>
            <span className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 font-medium text-cyan-700">
              {cart.length} item keranjang
            </span>
            {productsRefreshing && (
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 font-medium text-cyan-700" aria-live="polite">
                <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
                Sinkronisasi
              </span>
            )}
          </div>
        }
        action={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-cyan-700">{formatCurrency(total)}</p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <DataPanel
          title="Pilih Produk"
          description="Masukkan item ke keranjang transaksi."
          className="lg:col-span-4"
        >
          {productsLoading ? (
            <div className="space-y-3" aria-busy="true">
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : activeProducts.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Belum Ada Produk Aktif"
              description="Aktifkan produk di halaman Produk sebelum mencatat penjualan."
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="sale-product">
                  Produk
                </label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="sale-product" className="h-10 w-full bg-white">
                    <SelectValue placeholder="Pilih produk…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <span className="flex min-w-0 items-center justify-between gap-3">
                          <span className="truncate">{product.name}</span>
                          <span className="font-mono text-xs text-slate-500 tabular-nums">Stok {product.stock}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={cn(
                'rounded-lg border p-3',
                selectedProduct ? 'border-cyan-100 bg-cyan-50/60' : 'border-slate-200 bg-slate-50'
              )}>
                {selectedProduct ? (
                  <div className="space-y-3">
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                      <p className="text-xs text-slate-500">{selectedProduct.category === 'Water' ? 'Air' : 'Gas'} / {selectedProduct.unitType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-white px-2 py-2">
                        <p className="text-slate-500">Harga</p>
                        <p className="font-mono font-semibold tabular-nums text-slate-900">{formatCurrency(selectedProduct.sellingPrice)}</p>
                      </div>
                      <div className="rounded-md bg-white px-2 py-2">
                        <p className="text-slate-500">Stok</p>
                        <p className="font-mono font-semibold tabular-nums text-slate-900">{selectedProduct.stock} {selectedProduct.unitType}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Detail produk tampil setelah dipilih.</p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedProductId}
                className="h-10 w-full"
              >
                <Plus className="size-4" aria-hidden="true" />
                Tambah ke Keranjang
              </Button>
            </div>
          )}
        </DataPanel>

        <DataPanel
          title="Keranjang"
          description="Periksa jumlah sebelum proses penjualan."
          className="lg:col-span-8"
          action={<ShoppingCart className="size-5 text-cyan-700" aria-hidden="true" />}
        >
          <CartTable
            cart={cart}
            onUpdateQuantity={(productId, quantity) => {
              const product = products.find(item => item.id === productId);
              updateQuantity(productId, quantity, product?.stock);
            }}
            onRemove={removeFromCart}
            total={total}
          />

          <div className="mt-5 space-y-4 border-t border-slate-200 pt-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="sale-notes">
                Catatan
              </label>
              <Input
                id="sale-notes"
                name="sale-notes"
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Tambahkan catatan…"
                autoComplete="off"
              />
            </div>

            <Button
              type="button"
              onClick={handleCheckout}
              disabled={isEmpty || loading}
              className="h-11 w-full text-sm font-semibold"
              size="lg"
            >
              <CreditCard className="size-4" aria-hidden="true" />
              {loading ? 'Memproses…' : 'Proses Penjualan'}
            </Button>
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
