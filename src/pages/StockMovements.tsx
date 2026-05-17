import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchStoreProducts } from '../lib/db';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StockMovements() {
  const { userProfile } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.storeId) return;

    const loadData = async () => {
      try {
        const prodData = await fetchStoreProducts(userProfile.storeId);
        const prodMap: Record<string, string> = {};
        prodData.forEach(p => prodMap[p.id] = p.name);
        setProducts(prodMap);

        const q = query(
          collection(db, `stores/${userProfile.storeId}/stock_movements`),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        setMovements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userProfile]);

  return (
    <div className="p-6 w-full max-w-[1200px] mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Riwayat Pergerakan Stok</h2>
        <p className="text-slate-500 text-sm mt-1">100 riwayat keluar-masuk stok terakhir</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-center">Kuantitas</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">Memuat...</TableCell></TableRow>
            ) : movements.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada riwayat stok.</TableCell></TableRow>
            ) : (
              movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(m.createdAt), 'dd MMM yyyy, HH:mm')}
                  </TableCell>
                  <TableCell>
                    {m.type === 'sale' ? (
                      <span className="flex items-center gap-1 w-fit bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                        <ArrowUpRight className="w-3 h-3" /> Keluar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 w-fit bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                        <ArrowDownRight className="w-3 h-3" /> Masuk
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {products[m.productId] || 'Produk dihapus/tidak diketahui'}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <span className={m.type === 'sale' ? 'text-orange-600' : 'text-emerald-600'}>
                      {m.type === 'sale' ? '-' : '+'}{m.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {m.notes || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
