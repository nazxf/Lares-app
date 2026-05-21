import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import LoginPage from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import StoreSetup from './pages/StoreSetup';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const StockIn = React.lazy(() => import('./pages/StockIn'));
const Sales = React.lazy(() => import('./pages/Sales'));
const StockMovements = React.lazy(() => import('./pages/StockMovements'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6" aria-busy="true">
      <div className="h-8 w-40 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      <div className="h-72 rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" />
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, userProfile } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 text-sm font-medium text-slate-500" aria-live="polite">
        Memuat…
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" />;
  
  if (userProfile && !userProfile.storeId) {
    // If user has no store, ask them to create one
    return <StoreSetup />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="lares-theme" disableTransitionOnChange>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="stock-in" element={<StockIn />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="stock-movements" element={<StockMovements />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

