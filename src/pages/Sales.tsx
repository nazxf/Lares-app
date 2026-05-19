import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartTable } from '@/components/features/CartTable';
import { ShoppingCart } from 'lucide-react';
import { TOAST_MESSAGES } from '@/lib/constants';

export default function Sales() {
  const { userProfile, currentUser } = useAuth();
  const { products, getActiveProducts } = useProducts(userProfile?.storeId);
  const { cart, total, isEmpty, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { processTransaction } = useTransactions(userProfile?.storeId);
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const activeProducts = getActiveProducts();

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
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
      // Error already handled by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Penjualan</h1>
          <p className="text-slate-500 mt-1">Catat transaksi penjualan</p>
        </div>
        <ShoppingCart className="w-8 h-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Pilih Produk</h2>
          <div className="space-y-4">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Stok: {product.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddToCart} 
              disabled={!selectedProductId}
              className="w-full"
            >
              Tambah ke Keranjang
            </Button>
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Keranjang</h2>
          
          <CartTable
            cart={cart}
            onUpdateQuantity={(productId, quantity) => {
              const product = products.find(p => p.id === productId);
              updateQuantity(productId, quantity, product?.stock);
            }}
            onRemove={removeFromCart}
            total={total}
          />

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Catatan (opsional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
              />
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isEmpty || loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Memproses...' : 'Proses Penjualan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
