import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createStore } from '../lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StoreSetup() {
  const { currentUser, updateProfile } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !storeName.trim()) return;

    setLoading(true);
    try {
      const store = await createStore(storeName, currentUser.uid);
      await updateProfile({ storeId: store.id });
    } catch (error) {
      console.error(error);
      alert('Gagal membuat toko. Cek koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Buat Toko Baru</h2>
        <p className="text-slate-500 mb-6 text-sm">Masukan nama toko Anda untuk memulai menggunakan aplikasi.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nama Toko (Depot / Pangkalan)</Label>
            <Input 
              id="storeName" 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)} 
              placeholder="Misal: Depot Tirta Abadi" 
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !storeName.trim()}>
            {loading ? 'Membuat...' : 'Buat Toko'}
          </Button>
        </form>
      </div>
    </div>
  );
}
