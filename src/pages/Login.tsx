import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
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
          Aplikasi manajemen inventaris depot air minum dan gas terlengkap.
        </p>
        
        <Button onClick={handleSignIn} className="w-full h-12 text-base rounded-xl font-medium">
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}
