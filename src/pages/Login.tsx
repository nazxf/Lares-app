import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signIn(email, name);
    } catch (error) {
      console.error(error);
      alert('Gagal masuk. Cek data lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6">
          <Droplet className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">AquaGas SaaS</h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          Masuk lokal dengan database SQL. Tidak ada koneksi Firebase.
        </p>

        <form onSubmit={handleSignIn} className="w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@toko.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama pemilik"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-base rounded-xl font-medium">
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
}
