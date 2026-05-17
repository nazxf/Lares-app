import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Settings() {
  const { userProfile } = useAuth();
  
  return (
    <div className="p-6 w-full max-w-[1200px] mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
      </header>

      <Card className="rounded-3xl border-slate-100 shadow-sm border max-w-md">
        <CardHeader>
          <CardTitle>Profil Toko</CardTitle>
          <CardDescription>Informasi umum tentang akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Nama Pemilik</p>
             <p className="text-base font-medium text-slate-800">{userProfile?.name}</p>
           </div>
           <div>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Email</p>
             <p className="text-base font-medium text-slate-800">{userProfile?.email}</p>
           </div>
           <div>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Store ID</p>
             <p className="text-sm font-mono text-slate-600 bg-slate-100 p-2 rounded-lg break-all">
               {userProfile?.storeId}
             </p>
           </div>
           <div>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Role</p>
             <p className="text-base font-medium text-slate-800 capitalize">{userProfile?.role}</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
