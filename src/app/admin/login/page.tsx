'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError('Password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" suppressHydrationWarning>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black mb-2 tracking-tight">ADMIN</h1>
          <p className="text-zinc-500">Project Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          {error && (
            <div className="bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div suppressHydrationWarning>
            <label htmlFor="password" className="block text-sm font-bold mb-2 uppercase tracking-widest">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition"
              disabled={loading}
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition uppercase tracking-widest"
            suppressHydrationWarning
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-8 uppercase tracking-widest">
          Admin Access Only
        </p>
      </div>
    </div>
  );
}