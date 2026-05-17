import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStoreProducts, processSaleOrStockIn } from '../lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

export default function StockIn() {
  const { userProfile, currentUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [cost, setCost] = useState('0');

  useEffect(() => {
    if (userProfile?.storeId) {
      fetchStoreProducts(userProfile.storeId).then(setProducts).catch(console.error);
    }
  }, [userProfile]);

  const activeProducts = products.filter(p => p.status === 'active');

  const addToList = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qtyNum = Number(quantity);
    const costNum = Number(cost);

    if (qtyNum <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const existing = cart.find(item => item.productId === selectedProduct);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === selectedProduct 
          ? { ...item, quantity: item.quantity + qtyNum, subtotal: item.subtotal + costNum }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: 0, // Not selling price. This is cost based, but we track cost via subtotal here.
        quantity: qtyNum,
        subtotal: costNum
      }]);
    }
    
    setSelectedProduct('');
    setQuantity('10');
    setCost('0');
  };

  const removeFromList = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (!userProfile?.storeId || !currentUser || cart.length === 0) return;
    setLoading(true);
    try {
      await processSaleOrStockIn(
        userProfile.storeId,
        currentUser.uid,
        'stock_in',
        cart,
        total,
        notes || 'Restock barang'
      );
      toast.success('Penerimaan stok berhasil dicatat');
      setCart([]);
      setNotes('');
      // Reload products
      const updated = await fetchStoreProducts(userProfile.storeId);
      setProducts(updated);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="p-4 lg:p-6 w-full max-w-[1000px] mx-auto space-y-4 lg:space-y-6 pb-24 lg:pb-6">
      <header className="mb-4 lg:mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Stok Masuk</h2>
        <p className="text-slate-500 text-sm mt-1">Catat penerimaan barang dari supplier</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 lg:p-6 space-y-4 lg:space-y-6">
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:items-end bg-slate-50 p-4 rounded-2xl">
          <div className="lg:col-span-5 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Pilih Produk</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full bg-white h-14 lg:h-12 text-base px-4 rounded-xl border-slate-200 shadow-sm">
                <SelectValue placeholder="Pilih produk untuk ditambah..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                {activeProducts.map(p => (
                  <SelectItem key={p.id} value={p.id} className="py-3 px-4 cursor-pointer focus:bg-slate-50 rounded-lg">
                    <div className="flex flex-col text-left justify-center">
                      <span className="font-medium text-slate-800 text-base">{p.name}</span>
                      <span className="text-sm text-slate-500">Stok saat ini: {p.stock}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Kuantitas</label>
            <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-white h-14 lg:h-12 text-base px-4 rounded-xl border-slate-200 shadow-sm" />
          </div>
          <div className="lg:col-span-3 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Total Biaya (Opsional)</label>
            <Input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} className="bg-white h-14 lg:h-12 text-base px-4 rounded-xl border-slate-200 shadow-sm" />
          </div>
          <div className="lg:col-span-2 mt-4 lg:mt-0">
            <Button onClick={addToList} disabled={!selectedProduct} className="w-full h-14 lg:h-12 text-base font-semibold rounded-xl">
              Tambah
            </Button>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-center">Kuantitas Masuk</TableHead>
                <TableHead className="text-right">Biaya Kulakan</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-500">Belum ada data barang.</TableCell>
                </TableRow>
              ) : (
                cart.map(item => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-semibold text-slate-800">{item.productName}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">+{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => removeFromList(item.productId)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="w-full md:w-1/2">
            <Input 
              placeholder="Catatan / Nama Supplier..." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-6">
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Total Biaya Keseluruhan</div>
              <div className="text-xl font-bold text-slate-800">{formatCurrency(total)}</div>
            </div>
            <Button size="lg" onClick={handleCheckout} disabled={cart.length === 0 || loading} className="w-full sm:w-auto shrink-0">
              {loading ? 'Menyimpan...' : 'Simpan Stok Masuk'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
