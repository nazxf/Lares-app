import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStoreDebts, addDebt, markDebtAsPaid, Debt } from '../lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export default function Debts() {
  const { currentStore } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    entityName: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    if (currentStore) {
      loadDebts();
    }
  }, [currentStore]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await fetchStoreDebts(currentStore!.id);
      setDebts(data);
    } catch (error) {
      toast.error('Gagal memuat data utang');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async () => {
    if (!formData.entityName || !formData.amount) {
      toast.error('Nama dan jumlah utang wajib diisi');
      return;
    }
    
    try {
      setSaving(true);
      await addDebt(currentStore!.id, {
        type: activeTab,
        entityName: formData.entityName,
        amount: Number(formData.amount),
        description: formData.description,
        status: 'unpaid',
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined
      });
      
      toast.success('Utang berhasil ditambahkan');
      setIsDialogOpen(false);
      setFormData({ entityName: '', amount: '', description: '', dueDate: '' });
      loadDebts();
    } catch (error) {
      toast.error('Gagal menambahkan utang');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async (debtId: string) => {
    try {
      await markDebtAsPaid(currentStore!.id, debtId);
      toast.success('Utang berhasil ditandai Lunas');
      loadDebts();
    } catch (error) {
      toast.error('Gagal update status utang');
      console.error(error);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.type === activeTab && 
    d.entityName.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnpaid = debts
    .filter(d => d.type === activeTab && d.status === 'unpaid')
    .reduce((sum, d) => sum + d.amount, 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;

  return (
    <div className="p-6 w-full max-w-[1200px] mx-auto space-y-6 pb-24 lg:pb-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catatan Utang Piutang</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola piutang pelanggan dan utang ke supplier</p>
        </div>
      </header>

      <Tabs defaultValue="customer" onValueChange={(val) => setActiveTab(val as 'customer' | 'supplier')} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-slate-100 p-1 w-full sm:w-auto h-auto grid grid-cols-2">
            <TabsTrigger value="customer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              Piutang (Pelanggan)
            </TabsTrigger>
            <TabsTrigger value="supplier" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              Utang (Supplier)
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Cari nama..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl bg-white border-slate-200"
              />
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="h-10 rounded-xl px-4 gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Catatan</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1 md:col-span-3">
            <div className="text-sm text-slate-500 font-medium">
              Total {activeTab === 'customer' ? 'Piutang Belum Lunas' : 'Utang Belum Lunas'}
            </div>
            <div className={`text-2xl font-bold mt-1 ${activeTab === 'customer' ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totalUnpaid)}
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>Nama {activeTab === 'customer' ? 'Pelanggan' : 'Supplier'}</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Tgl Dicatat</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDebts.map(debt => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium text-slate-800">{debt.entityName}</TableCell>
                        <TableCell className="font-bold text-slate-800">{formatCurrency(debt.amount)}</TableCell>
                        <TableCell className="text-slate-600 max-w-[200px] truncate">{debt.description || '-'}</TableCell>
                        <TableCell className="text-slate-600">{formatDate(debt.createdAt)}</TableCell>
                        <TableCell className="text-slate-600">
                          {debt.dueDate ? formatDate(debt.dueDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            debt.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {debt.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {debt.status === 'unpaid' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleMarkAsPaid(debt.id!)}
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-1 rounded-lg"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Lunas
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah {activeTab === 'customer' ? 'Piutang Pelanggan' : 'Utang Supplier'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nama {activeTab === 'customer' ? 'Pelanggan' : 'Supplier'}
              </label>
              <Input 
                placeholder={`Masukkan nama ${activeTab === 'customer' ? 'pelanggan' : 'supplier'}`}
                value={formData.entityName}
                onChange={e => setFormData({ ...formData, entityName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jumlah Utang (Rp)</label>
              <Input 
                type="number"
                min="0"
                placeholder="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Jatuh Tempo (Opsional)</label>
              <Input 
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Keterangan Tambahan</label>
              <Input 
                placeholder="Catatan..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleAddDebt} disabled={saving} className="rounded-xl">
              {saving ? 'Menyimpan...' : 'Simpan Utang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
