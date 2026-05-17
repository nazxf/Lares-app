import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStoreTransactions } from '../lib/db';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileDown, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const exportTransactionsToExcel = async () => {
    if (!userProfile?.storeId) return;
    setLoading(true);
    try {
      const txns = await fetchStoreTransactions(userProfile.storeId);
      
      const flatData = txns.map(t => ({
        "ID Transaksi": t.id,
        "Waktu": format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        "Tipe": t.type === 'sale' ? 'Penjualan' : 'Restock',
        "Catatan": t.notes || '-',
        "Total (Rp)": t.totalAmount,
        "Detail Barang": t.items.map((i: any) => `${i.productName} (${i.quantity}x)` ).join(', ')
      }));

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");
      
      XLSX.writeFile(workbook, `Laporan_Transaksi_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);

    } catch (err) {
      console.error(err);
      alert('Gagal meng-export laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-[1200px] mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Cetak Laporan</h2>
        <p className="text-slate-500 text-sm mt-1">Export data bisnis Anda</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm border">
          <CardHeader>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <FileDown className="w-6 h-6" />
            </div>
            <CardTitle>Laporan Transaksi (.xlsx)</CardTitle>
            <CardDescription>
              Unduh riwayat transaksi (50 data terakhir) berupa Penjualan dan Pembelian ke dalam format Excel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportTransactionsToExcel} disabled={loading} className="w-full h-12 rounded-xl">
              {loading ? 'Menyiapkan Data...' : 'Unduh Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm border bg-slate-50/50">
          <CardHeader>
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <CardTitle className="text-slate-500">Laporan Bulanan (Segera Hadir)</CardTitle>
            <CardDescription>
              Fitur laporan periodik akan hadir pada pembaruan mendatang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full h-12 rounded-xl">
              Cetak Laporan Bulanan
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
