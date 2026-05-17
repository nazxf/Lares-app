import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStoreProducts, fetchStoreTransactions } from '../lib/db';
import {
  TrendingUp,
  Droplet,
  Flame,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, colorClass, borderClass = "" }: any) {
  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-shadow ${borderClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.storeId) return;
    Promise.all([
      fetchStoreProducts(userProfile.storeId),
      fetchStoreTransactions(userProfile.storeId)
    ]).then(([prods, txns]) => {
      setProducts(prods);
      setTransactions(txns);
      setLoading(false);
    }).catch(console.error);
  }, [userProfile]);

  const omzetHariIni = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    return transactions
      .filter(t => t.type === 'sale' && t.createdAt >= today)
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }, [transactions]);

  const todaySalesCount = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    return transactions.filter(t => t.type === 'sale' && t.createdAt >= today).length;
  }, [transactions]);

  const totalWaterStock = products.filter(p => p.category === 'Water').reduce((sum, p) => sum + p.stock, 0);
  const totalGasStock = products.filter(p => p.category === 'Gas').reduce((sum, p) => sum + p.stock, 0);
  
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minimumStock).sort((a,b) => (a.stock/a.minimumStock) - (b.stock/b.minimumStock));
  }, [products]);

  const weeklySalesData = useMemo(() => {
    const data = [];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayName = i === 0 ? 'Hari Ini' : days[d.getDay()];
      
      const daySales = transactions
        .filter(t => t.type === 'sale' && t.createdAt >= d.getTime() && t.createdAt < nextDay.getTime())
        .reduce((sum, t) => sum + t.totalAmount, 0);
        
      data.push({ name: dayName, sales: daySales });
    }
    return data;
  }, [transactions]);

  if (loading) return <div className="p-8">Loading data...</div>;

  return (
    <div className="p-6 pb-20 w-full max-w-[1600px] mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Pantau performa bisnis Anda secara real-time</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Omzet Hari Ini" 
          value={formatCurrency(omzetHariIni)} 
          subtitle={`${todaySalesCount} Transaksi selesai`}
          icon={TrendingUp} 
          trend={todaySalesCount > 0 ? "+Active" : "0%"} 
          trendUp={todaySalesCount > 0}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Stok Air Galon/T botol" 
          value={<>{totalWaterStock} <span className="text-sm font-normal text-slate-400">Unit</span></>} 
          subtitle="Semua kategori Air"
          icon={Droplet} 
          colorClass="bg-sky-50 text-sky-600"
        />
        <StatCard 
          title="Stok Gas LPG" 
          value={<>{totalGasStock} <span className="text-sm font-normal text-slate-400">Tabung</span></>} 
          subtitle="Semua kategori Gas"
          icon={Flame} 
          colorClass="bg-orange-50 text-orange-600"
        />
        <StatCard 
          title="Peringatan Stok" 
          value={<span className={lowStockProducts.length > 0 ? "text-red-600" : "text-emerald-500"}>{lowStockProducts.length} <span className="text-sm font-normal text-slate-400 tracking-normal uppercase">Item</span></span>} 
          subtitle={lowStockProducts.length > 0 ? "Segera isi ulang" : "Semua stok aman"}
          icon={AlertTriangle} 
          colorClass={lowStockProducts.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
          borderClass={lowStockProducts.length > 0 ? "border-l-4 border-l-red-500" : "border-l-4 border-l-emerald-500"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[350px]">
        {/* Chart */}
        <div className="col-span-1 lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">Grafik Penjualan (7 Hari Terakhir)</h4>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySalesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]} barSize={24} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-span-1 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="font-bold text-slate-800 mb-4 text-sm sm:text-base">Stok Menipis</h4>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {lowStockProducts.map(item => {
              const critical = item.stock <= (item.minimumStock / 2);
              const percent = Math.max(2, (item.stock / (item.minimumStock * 2 || 1)) * 100);
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>{item.name}</span>
                    <span className={critical ? "text-red-500" : "text-orange-500"}>
                      {item.stock} Unit
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${critical ? 'bg-red-500' : 'bg-orange-500'}`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {lowStockProducts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Stok semua produk aman.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
