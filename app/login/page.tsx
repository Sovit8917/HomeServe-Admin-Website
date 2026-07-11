'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome, Admin!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100/60 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/60 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-1">HomeService Marketplace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Sign in</p>
              <p className="text-xs text-slate-400 mb-3">Use your admin email and password</p>
            </div>

            <Input
              type="email"
              placeholder="admin@homeservice.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoFocus
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" loading={loading} className="w-full py-2.5">
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secure access · HomeService Admin v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
