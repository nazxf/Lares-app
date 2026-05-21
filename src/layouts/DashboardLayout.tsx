import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ArrowDownToLine,
  Droplet,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Package,
  Settings,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../lib/db';
import { cn, getInitials } from '../lib/utils';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Produk' },
  { to: '/stock-in', icon: ArrowDownToLine, label: 'Stok Masuk' },
  { to: '/sales', icon: LineChart, label: 'Penjualan' },
  { to: '/stock-movements', icon: Package, label: 'Riwayat Stok' },
  { to: '/reports', icon: FileText, label: 'Laporan' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

interface SidebarPanelProps {
  userProfile: UserProfile | null;
  initials: string;
  signOut: () => Promise<void>;
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}

function SidebarPanel({
  userProfile,
  initials,
  signOut,
  onNavigate,
  onClose,
  showClose = false,
}: SidebarPanelProps) {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-700 text-white shadow-[0_8px_22px_-16px_rgba(14,116,144,0.75)]">
            <Droplet className="size-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-950">Lares POS</p>
            <p className="truncate text-xs text-slate-500">Air & Gas</p>
          </div>
        </div>
        {showClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
        {menuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cyan-600/25',
                isActive
                  ? 'bg-cyan-50 text-cyan-800 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.16)]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Avatar className="size-9 shrink-0 border border-slate-200 bg-white">
            <AvatarFallback className="bg-white text-xs font-semibold text-slate-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{userProfile?.name || 'Pengguna'}</p>
            <p className="truncate text-xs capitalize text-slate-500">{userProfile?.role || 'cashier'}</p>
          </div>
          <ThemeToggle compact />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-slate-500 hover:bg-red-50 hover:text-red-700"
            onClick={signOut}
            aria-label="Keluar akun"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { userProfile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = getInitials(userProfile?.name || 'Lares');

  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-slate-50 font-sans text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:ring-3 focus:ring-cyan-500/35 dark:focus:bg-slate-900 dark:focus:text-slate-50"
      >
        Lewati ke konten
      </a>
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarPanel userProfile={userProfile} initials={initials} signOut={signOut} />
      </aside>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-[100dvh] w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden">
            <SidebarPanel
              userProfile={userProfile}
              initials={initials}
              signOut={signOut}
              onNavigate={() => setMobileMenuOpen(false)}
              onClose={() => setMobileMenuOpen(false)}
              showClose
            />
          </aside>
        </>
      )}

      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-700 text-white">
              <Droplet className="size-[18px]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Lares POS</p>
              <p className="text-xs text-slate-500">Air & Gas</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:bg-red-50 hover:text-red-700"
              onClick={signOut}
              aria-label="Keluar akun"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-600"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-22px_rgba(15,23,42,0.45)] backdrop-blur lg:hidden" aria-label="Navigasi cepat">
          <div className="grid h-16 grid-cols-4">
            {menuItems.slice(0, 4).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cyan-600/25',
                    isActive ? 'text-cyan-700' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                <item.icon className="size-5" aria-hidden="true" />
                <span className="w-full truncate text-center">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
