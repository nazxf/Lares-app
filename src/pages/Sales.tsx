import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStoreProducts, processSaleOrStockIn } from '../lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

export default function Sales() {
  const { userProfile, currentUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.storeId) {
      fetchStoreProducts(userProfile.storeId).then(setProducts).catch(console.error);
    }
  }, [userProfile]);

  const activeProducts = products.filter(p => p.status === 'active');

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      toast.error('Stok produk habis!');
      return;
    }

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Maksimal stok ${product.name} adalah ${product.stock}`);
        return;
      }
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.sellingPrice,
        quantity: 1,
        subtotal: product.sellingPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && qty > product.stock) {
      toast.error(`Maksimal stok: ${product.stock}`);
      return;
    }
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: qty, subtotal: qty * item.price }
        : item
    ));
  };

  const handleCheckout = async () => {
    if (!userProfile?.storeId || !currentUser || cart.length === 0) return;
    setLoading(true);
    try {
      await processSaleOrStockIn(
        userProfile.storeId,
        currentUser.uid,
        'sale',
        cart,
        total,
        notes
      );
      toast.success('Penjualan berhasil dicatat');
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
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Kasir Penjualan</h2>
        <p className="text-slate-500 text-sm mt-1">Catat transaksi penjualan dengan cepat</p>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)]">
        
        {/* Product Catalog */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-4">Pilih Produk</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p.id)}
                className="border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">{p.category}</div>
                  <div className="font-semibold text-slate-800 text-sm leading-tight mb-2">{p.name}</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600 mb-1">{formatCurrency(p.sellingPrice)}</div>
                  <div className="text-xs text-slate-500">Stok: {p.stock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-slate-800">Keranjang</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart className="w-12 h-12 opacity-20 mb-2" />
                <p className="text-sm">Belum ada barang di keranjang</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-sm text-slate-800 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                        className="w-16 h-8 text-center"
                      />
                      <button 
                        onClick={() => updateQuantity(item.productId, 0)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-4 shrink-0">
            <div>
              <Input 
                placeholder="Catatan Transaksi (Opsional)..." 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-slate-50"
              />
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</span>
            </div>
            <Button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || loading}
              className="w-full h-12 text-base rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Memproses...' : 'Selesaikan Transaksi'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
