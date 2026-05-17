import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Lazy loading pages could be done, but for simplicity we will import them directly or just stub them out for now
import LoginPage from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockIn from './pages/StockIn';
import Sales from './pages/Sales';
import StockMovements from './pages/StockMovements';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StoreSetup from './pages/StoreSetup';
import Debts from './pages/Debts';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, userProfile } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  
  if (userProfile && !userProfile.storeId) {
    // If user has no store, ask them to create one
    return <StoreSetup />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="debts" element={<Debts />} />
            <Route path="stock-movements" element={<StockMovements />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

