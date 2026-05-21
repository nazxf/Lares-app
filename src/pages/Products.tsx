import { useMemo, useState, type FormEvent } from 'react';
import Fuse from 'fuse.js';
import {
  Edit2,
  PackageMinus,
  PackagePlus,
  PackageSearch,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataPanel } from '@/components/app/DataPanel';
import { EmptyState } from '@/components/app/EmptyState';
import { PageHeader } from '@/components/app/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { useAuth } from '../contexts/AuthContext';
import { addStockMovement } from '../lib/db';
import { cn, formatCurrency } from '../lib/utils';

function categoryLabel(category: string) {
  return category === 'Water' ? 'Air' : 'Gas';
}

function ProductTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><div className="h-4 w-40 animate-pulse rounded bg-slate-100" /></TableCell>
          <TableCell><div className="h-5 w-14 animate-pulse rounded-md bg-slate-100" /></TableCell>
          <TableCell><div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" /></TableCell>
          <TableCell><div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" /></TableCell>
          <TableCell><div className="mx-auto h-4 w-16 animate-pulse rounded bg-slate-100" /></TableCell>
          <TableCell><div className="mx-auto h-5 w-16 animate-pulse rounded-md bg-slate-100" /></TableCell>
          <TableCell><div className="ml-auto h-8 w-24 animate-pulse rounded-lg bg-slate-100" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function Products() {
  const { userProfile } = useAuth();
  const { products, loading, refreshing, error, loadProducts, addProduct, updateProduct } = useProducts(userProfile?.storeId);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockType, setStockType] = useState<'in' | 'out'>('in');

  const stats = useMemo(() => {
    const active = products.filter(product => product.status === 'active').length;
    const low = products.filter(product => product.stock <= product.minimumStock).length;
    return { active, low, total: products.length };
  }, [products]);

  const fuse = useMemo(() => new Fuse(products, {
    keys: ['name', 'category', 'unitType'],
    threshold: 0.3,
  }), [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return fuse.search(search).map(result => result.item);
  }, [search, fuse, products]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile?.storeId) return;

    const formData = new FormData(event.currentTarget);
    const productData = {
      name: String(formData.get('name') || '').trim(),
      category: String(formData.get('category') || 'Water'),
      sellingPrice: Number(formData.get('sellingPrice')),
      purchasePrice: Number(formData.get('purchasePrice')),
      stock: editingProduct ? editingProduct.stock : Number(formData.get('stock')),
      minimumStock: Number(formData.get('minimumStock')),
      unitType: String(formData.get('unitType') || 'Unit'),
      status: (formData.get('status') || 'active') as 'active' | 'inactive',
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile?.storeId || !stockProduct) return;

    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get('quantity'));
    const notes = String(formData.get('notes') || '');

    if (quantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    try {
      await addStockMovement(userProfile.storeId, {
        productId: stockProduct.id,
        type: stockType,
        quantity,
        notes,
      });

      toast.success(`Stok ${stockType === 'in' ? 'ditambah' : 'dikurangi'} sebanyak ${quantity} ${stockProduct.unitType}`);
      setIsStockDialogOpen(false);
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah stok';
      toast.error(message);
    }
  };

  const openStockDialog = (product: Product, type: 'in' | 'out') => {
    setStockProduct(product);
    setStockType(type);
    setIsStockDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 pb-24 sm:p-6 lg:pb-6">
      <PageHeader
        eyebrow="Inventori"
        title="Produk"
        description="Kelola harga, stok, dan status jual produk air serta gas."
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600">
              {stats.total} produk
            </span>
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
              {stats.active} aktif
            </span>
            <span className={cn(
              'rounded-md border px-2 py-1 font-medium',
              stats.low > 0 ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'
            )}>
              {stats.low} stok rendah
            </span>
            {refreshing && <span className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 font-medium text-cyan-700" aria-live="polite">Menyegarkan</span>}
            {error && <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 font-medium text-red-700" aria-live="polite">{error}</span>}
          </div>
        }
        action={
          <Button type="button" onClick={openAdd} className="h-9 px-3">
            <Plus className="size-4" aria-hidden="true" />
            Tambah Produk
          </Button>
        }
      />

      <DataPanel
        title="Daftar Produk"
        description="Gunakan pencarian untuk menemukan produk harian lebih cepat."
        contentClassName="p-0"
        action={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              name="product-search"
              type="search"
              placeholder="Cari produk…"
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-9 rounded-lg border-slate-200 bg-white pl-9 pr-9 font-medium"
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cyan-600/25"
                aria-label="Bersihkan pencarian"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        }
      >
        <Table className="min-w-[860px]">
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <TableRow>
              <TableHead className="px-4">Nama Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga Beli</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="pr-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <ProductTableSkeleton />
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-4">
                  <EmptyState
                    icon={search ? Search : PackageSearch}
                    title={search ? 'Produk Tidak Ditemukan' : 'Belum Ada Produk'}
                    description={search ? 'Coba kata kunci lain atau bersihkan pencarian.' : 'Tambahkan produk pertama agar stok dan transaksi bisa dicatat.'}
                    action={!search && (
                      <Button type="button" onClick={openAdd}>
                        <Plus className="size-4" aria-hidden="true" />
                        Tambah Produk
                      </Button>
                    )}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => {
                const lowStock = product.stock <= product.minimumStock;

                return (
                  <TableRow key={product.id} className="hover:bg-slate-50/80">
                    <TableCell className="px-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">Min. {product.minimumStock} {product.unitType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1',
                        product.category === 'Water'
                          ? 'bg-sky-50 text-sky-700 ring-sky-100'
                          : 'bg-amber-50 text-amber-700 ring-amber-100'
                      )}>
                        {categoryLabel(product.category)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-500 tabular-nums">{formatCurrency(product.purchasePrice)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-900 tabular-nums">{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums',
                        lowStock ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      )}>
                        {product.stock} {product.unitType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1',
                        product.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                      )}>
                        {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openStockDialog(product, 'in')}
                          className="text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                          aria-label={`Tambah stok ${product.name}`}
                        >
                          <PackagePlus className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openStockDialog(product, 'out')}
                          className="text-slate-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Kurangi stok ${product.name}`}
                        >
                          <PackageMinus className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(product)}
                          className="text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                          aria-label={`Edit produk ${product.name}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DataPanel>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Perbarui data harga, batas stok, atau status produk.' : 'Isi data produk baru untuk mulai mencatat stok.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" name="name" required defaultValue={editingProduct?.name} autoComplete="off" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select name="category" defaultValue={editingProduct?.category || 'Water'}>
                  <SelectTrigger id="category" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Water">Air</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType">Satuan</Label>
                <Select name="unitType" defaultValue={editingProduct?.unitType || 'Galon'}>
                  <SelectTrigger id="unitType" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Galon">Galon</SelectItem>
                    <SelectItem value="Tabung">Tabung</SelectItem>
                    <SelectItem value="Botol">Botol</SelectItem>
                    <SelectItem value="Karton">Karton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Harga Modal</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" min="0" inputMode="numeric" required defaultValue={editingProduct?.purchasePrice} autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Harga Jual</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" min="0" inputMode="numeric" required defaultValue={editingProduct?.sellingPrice} autoComplete="off" />
              </div>
            </div>

            {!editingProduct && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input id="stock" name="stock" type="number" min="0" inputMode="numeric" required defaultValue={0} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Stok Minimum</Label>
                  <Input id="minimumStock" name="minimumStock" type="number" min="1" inputMode="numeric" required defaultValue={10} autoComplete="off" />
                </div>
              </div>
            )}

            {editingProduct && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Stok Minimum</Label>
                  <Input id="minimumStock" name="minimumStock" type="number" min="1" inputMode="numeric" required defaultValue={editingProduct.minimumStock} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingProduct.status || 'active'}>
                    <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit">{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{stockType === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}</DialogTitle>
            <DialogDescription>
              Catat penyesuaian stok untuk produk yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockAdjustment} className="space-y-4 pt-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Produk</p>
              <p className="truncate text-sm font-semibold text-slate-900">{stockProduct?.name}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">Stok Saat Ini</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-slate-900">
                {stockProduct?.stock} <span className="text-sm font-medium text-slate-500">{stockProduct?.unitType}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Jumlah {stockType === 'in' ? 'Masuk' : 'Keluar'} ({stockProduct?.unitType})
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                inputMode="numeric"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                name="notes"
                placeholder={stockType === 'in' ? 'Pembelian dari supplier…' : 'Rusak atau hilang…'}
                autoComplete="off"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)}>Batal</Button>
              <Button
                type="submit"
                className={stockType === 'in' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'}
              >
                {stockType === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
