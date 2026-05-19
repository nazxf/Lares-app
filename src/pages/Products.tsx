import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addStockMovement } from '../lib/db';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit2, PackagePlus, PackageMinus } from 'lucide-react';
import { toast } from 'sonner';
import Fuse from 'fuse.js';

const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

export default function Products() {
  const { userProfile } = useAuth();
  const { products, loading, loadProducts, addProduct, updateProduct } = useProducts(userProfile?.storeId);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Stock adjustment dialog
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<any>(null);
  const [stockType, setStockType] = useState<'in' | 'out'>('in');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfile?.storeId) return;

    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get('name') || ''),
      category: String(fd.get('category') || 'Water'),
      sellingPrice: Number(fd.get('sellingPrice')),
      purchasePrice: Number(fd.get('purchasePrice')),
      stock: editingProduct ? editingProduct.stock : Number(fd.get('stock')),
      minimumStock: Number(fd.get('minimumStock')),
      unitType: String(fd.get('unitType') || 'Unit'),
      status: (fd.get('status') || 'active') as 'active' | 'inactive'
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfile?.storeId || !stockProduct) return;

    const fd = new FormData(e.currentTarget);
    const quantity = Number(fd.get('quantity'));
    const notes = fd.get('notes') as string;

    if (quantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    try {
      await addStockMovement(userProfile.storeId, {
        productId: stockProduct.id,
        type: stockType,
        quantity,
        notes
      });
      
      toast.success(`Stok ${stockType === 'in' ? 'ditambah' : 'dikurangi'} sebanyak ${quantity} ${stockProduct.unitType}`);
      setIsStockDialogOpen(false);
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah stok');
    }
  };

  const openStockDialog = (product: any, type: 'in' | 'out') => {
    setStockProduct(product);
    setStockType(type);
    setIsStockDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const fuse = useMemo(() => new Fuse(products, {
    keys: ['name', 'category'],
    threshold: 0.3,
  }), [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return fuse.search(search).map(result => result.item);
  }, [search, fuse, products]);

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Produk</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola stok dan harga barang Anda</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari produk (nama, kategori)..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10 w-full rounded-xl bg-white border-slate-200 focus-visible:ring-blue-500 transition-all font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold">✕</span>
                </div>
              </button>
            )}
          </div>
          <Button onClick={openAdd} className="h-10 rounded-xl px-4 gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga Beli</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Memuat Data...</TableCell></TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Tidak ada produk ditemukan.</TableCell></TableRow>
            ) : (
              filteredProducts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold text-slate-800">{p.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.category === 'Water' ? 'bg-sky-50 text-sky-600' : 'bg-orange-50 text-orange-600'}`}>
                      {p.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{formatCurrency(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-medium text-slate-800">{formatCurrency(p.sellingPrice)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${p.stock <= p.minimumStock ? 'text-red-500' : 'text-slate-700'}`}>
                      {p.stock} <span className="text-[10px] font-normal">{p.unitType}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openStockDialog(p, 'in')} 
                        className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                        title="Tambah Stok"
                      >
                        <PackagePlus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openStockDialog(p, 'out')} 
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Kurangi Stok"
                      >
                        <PackageMinus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEdit(p)} 
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" name="name" required defaultValue={editingProduct?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select name="category" defaultValue={editingProduct?.category || "Water"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Water">Air</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType">Tipe Satuan</Label>
                <Select name="unitType" defaultValue={editingProduct?.unitType || "Galon"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Galon">Galon</SelectItem>
                    <SelectItem value="Tabung">Tabung</SelectItem>
                    <SelectItem value="Botol">Botol</SelectItem>
                    <SelectItem value="Karton">Karton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Harga Modal (Rp)</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" min="0" required defaultValue={editingProduct?.purchasePrice} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Harga Jual (Rp)</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" min="0" required defaultValue={editingProduct?.sellingPrice} />
              </div>
            </div>

            {!editingProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input id="stock" name="stock" type="number" min="0" required defaultValue={editingProduct?.stock || 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Batas Stok Minimum</Label>
                  <Input id="minimumStock" name="minimumStock" type="number" min="1" required defaultValue={editingProduct?.minimumStock || 10} />
                </div>
              </div>
            )}

            {editingProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Stok Minimum</Label>
                  <Input id="minimumStock" name="minimumStock" type="number" min="1" required defaultValue={editingProduct?.minimumStock} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Aktif</Label>
                  <Select name="status" defaultValue={editingProduct?.status || "active"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif (Dijual)</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit">{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {stockType === 'in' ? '➕ Tambah Stok' : '➖ Kurangi Stok'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockAdjustment} className="space-y-4 pt-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-500">Produk</p>
              <p className="font-bold text-slate-800">{stockProduct?.name}</p>
              <p className="text-sm text-slate-500 mt-2">Stok Saat Ini</p>
              <p className="font-bold text-lg text-slate-800">
                {stockProduct?.stock} <span className="text-sm font-normal">{stockProduct?.unitType}</span>
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
                required 
                placeholder="Contoh: 50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input 
                id="notes" 
                name="notes" 
                placeholder={stockType === 'in' ? 'Contoh: Pembelian dari supplier' : 'Contoh: Rusak/Hilang'}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)}>Batal</Button>
              <Button 
                type="submit"
                className={stockType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
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
