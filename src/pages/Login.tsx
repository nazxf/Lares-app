import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Droplet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/app/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, name);
    } catch (err) {
      console.error(err);
      setError('Gagal masuk. Cek email dan nama, lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] bg-slate-50 p-4 text-slate-900 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:p-6">
      <section className="hidden overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-8 text-slate-50 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
              <Droplet className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Lares POS</p>
              <p className="text-xs text-slate-400">Air & Gas</p>
            </div>
          </div>
          <div className="mt-16 max-w-md">
            <h1 className="text-3xl font-semibold tracking-tight text-pretty">
              Ruang kerja kasir yang cepat dibaca.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Masuk untuk membuka dashboard, stok, dan transaksi toko.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-slate-400">Mode</p>
            <p className="mt-1 font-semibold text-slate-100">POS</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-slate-400">Data</p>
            <p className="mt-1 font-semibold text-slate-100">Neon</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-slate-400">Cache</p>
            <p className="mt-1 font-semibold text-slate-100">Redis</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.5)] sm:p-8">
          <div className="mb-5 flex justify-end lg:mb-0">
            <ThemeToggle />
          </div>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-700 text-white">
              <Droplet className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950">Lares POS</p>
              <p className="text-xs text-slate-500">Air & Gas</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Masuk</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Gunakan email dan nama yang terdaftar di toko.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
                autoComplete="email"
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={event => setName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? 'Masuk…' : 'Masuk'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
