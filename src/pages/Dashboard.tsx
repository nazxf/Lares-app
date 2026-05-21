import useSWR from 'swr';
import {
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Flame,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DataPanel } from '@/components/app/DataPanel';
import { EmptyState } from '@/components/app/EmptyState';
import { MetricTile } from '@/components/app/MetricTile';
import { PageHeader } from '@/components/app/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardSummary } from '../lib/db';
import { formatCurrency } from '../lib/utils';

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 pb-24 sm:p-6 lg:pb-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex justify-between">
              <div className="size-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-6 w-16 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3 w-36 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[360px] animate-pulse rounded-lg border border-slate-200/80 bg-card lg:col-span-8" />
        <div className="h-[360px] animate-pulse rounded-lg border border-slate-200/80 bg-card lg:col-span-4" />
      </div>
    </div>
  );
}

function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-[0_10px_28px_-18px_rgba(15,23,42,0.5)]">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="mt-1 font-mono font-semibold tabular-nums text-cyan-700">
        {formatCurrency(Number(payload[0].value ?? 0))}
      </p>
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
  const updatedAt = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data.generatedAt));
  const hasSales = data.weeklySalesData.some(day => day.sales > 0);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 pb-24 sm:p-6 lg:pb-6">
      <PageHeader
        eyebrow="Operasional Hari Ini"
        title="Dashboard"
        description="Pantau omzet, stok kritis, dan tren penjualan tanpa membuka banyak halaman."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium">
              Diperbarui {updatedAt}
            </span>
            {isValidating && (
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 font-medium text-cyan-700" aria-live="polite">
                <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
                Sinkronisasi
              </span>
            )}
            {error && (
              <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 font-medium text-red-700" aria-live="polite">
                Data lama ditampilkan
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          title="Omzet Hari Ini"
          value={formatCurrency(data.omzetHariIni)}
          subtitle={`${data.todaySalesCount} transaksi selesai`}
          icon={TrendingUp}
          badge={data.todaySalesCount > 0 ? 'Aktif' : 'Belum Ada'}
          tone="primary"
          valueClassName="text-[1.35rem] leading-8"
        />
        <MetricTile
          title="Stok Air"
          value={<>{data.totalWaterStock} <span className="text-sm font-medium text-slate-400">unit</span></>}
          subtitle="Semua kategori air"
          icon={Droplet}
          tone="water"
        />
        <MetricTile
          title="Stok Gas LPG"
          value={<>{data.totalGasStock} <span className="text-sm font-medium text-slate-400">tabung</span></>}
          subtitle="Semua kategori gas"
          icon={Flame}
          tone="gas"
        />
        <MetricTile
          title="Peringatan Stok"
          value={<>{lowStockProducts.length} <span className="text-sm font-medium text-slate-400">item</span></>}
          subtitle={lowStockProducts.length > 0 ? 'Perlu dicek sebelum jam ramai' : 'Semua stok aman'}
          icon={lowStockProducts.length > 0 ? AlertTriangle : CheckCircle2}
          badge={lowStockProducts.length > 0 ? 'Perlu Aksi' : 'Aman'}
          tone={lowStockProducts.length > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <DataPanel
          title="Penjualan 7 Hari"
          description="Ringkasan omzet harian dari transaksi selesai."
          className="lg:col-span-8"
          contentClassName="p-3 sm:p-4"
        >
          {hasSales ? (
            <div className="h-[310px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                initialDimension={{ width: 720, height: 310 }}
              >
                <BarChart data={data.weeklySalesData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(value) => `Rp${Number(value) / 1000}k`}
                  />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} content={<SalesTooltip />} />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={28} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="Belum Ada Penjualan Mingguan"
              description="Grafik akan terisi setelah transaksi penjualan pertama dicatat."
              className="min-h-[310px]"
            />
          )}
        </DataPanel>

        <DataPanel
          title="Stok Menipis"
          description="Prioritas restock berdasarkan batas minimum."
          className="lg:col-span-4"
          contentClassName="p-0"
        >
          {lowStockProducts.length > 0 ? (
            <div className="max-h-[334px] overflow-y-auto">
              {lowStockProducts.map(item => {
                const critical = item.stock <= item.minimumStock / 2;
                const percent = Math.max(4, Math.min(100, (item.stock / (item.minimumStock * 2 || 1)) * 100));

                return (
                  <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Minimum {item.minimumStock} {item.unitType || 'unit'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums ${critical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.stock} {item.unitType || 'unit'}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-[width] duration-300 ${critical ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Stok Aman"
              description="Tidak ada produk di bawah batas minimum."
              className="m-4 min-h-[302px]"
            />
          )}
        </DataPanel>
      </div>
    </div>
  );
}
