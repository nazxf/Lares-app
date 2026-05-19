import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardSummary } from '../lib/db';
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

function DashboardSkeleton() {
  return (
    <div className="p-6 pb-20 w-full max-w-[1600px] mx-auto space-y-6 animate-pulse">
      <header className="mb-6 space-y-2">
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-5">
              <div className="h-9 w-9 rounded-lg bg-slate-100" />
              <div className="h-5 w-14 rounded-full bg-slate-100" />
            </div>
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-5 w-56 rounded bg-slate-200 mb-8" />
          <div className="h-[280px] w-full rounded-2xl bg-slate-100" />
        </div>
        <div className="col-span-1 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-5 w-32 rounded bg-slate-200 mb-6" />
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-28 rounded bg-slate-100" />
                  <div className="h-3 w-12 rounded bg-slate-100" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const timezoneOffset = new Date().getTimezoneOffset();
  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR(
    userProfile?.storeId ? ['dashboard', userProfile.storeId, timezoneOffset] : null,
    ([, storeId, offset]) => fetchDashboardSummary(storeId, offset),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      refreshInterval: 30_000,
      dedupingInterval: 10_000,
    }
  );

  if (isLoading || !data) return <DashboardSkeleton />;

  const lowStockProducts = data.lowStockProducts;

  return (
    <div className="p-6 pb-20 w-full max-w-[1600px] mx-auto space-y-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Pantau performa bisnis Anda secara real-time</p>
        </div>
        {(error || isValidating) && (
          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${error ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Omzet Hari Ini"
          value={formatCurrency(data.omzetHariIni)}
          subtitle={`${data.todaySalesCount} Transaksi selesai`}
          icon={TrendingUp}
          trend={data.todaySalesCount > 0 ? "+Active" : "0%"}
          trendUp={data.todaySalesCount > 0}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Stok Air Galon/T botol"
          value={<>{data.totalWaterStock} <span className="text-sm font-normal text-slate-400">Unit</span></>}
          subtitle="Semua kategori Air"
          icon={Droplet}
          colorClass="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Stok Gas LPG"
          value={<>{data.totalGasStock} <span className="text-sm font-normal text-slate-400">Tabung</span></>}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">Grafik Penjualan (7 Hari Terakhir)</h4>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklySalesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]} barSize={24} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4 text-sm sm:text-base">Stok Menipis</h4>
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
            {lowStockProducts.map(item => {
              const critical = item.stock <= (item.minimumStock / 2);
              const percent = Math.max(2, (item.stock / (item.minimumStock * 2 || 1)) * 100);
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-[11px] font-medium text-slate-700">
                    <span className="truncate">{item.name}</span>
                    <span className={`shrink-0 ${critical ? "text-red-500" : "text-orange-500"}`}>
                      {item.stock} {item.unitType || 'Unit'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${critical ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${percent}%` }}
                    />
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
