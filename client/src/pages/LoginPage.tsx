import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post<{ token: string }>('/api/v1/auth/login', form);
      login(res.data.token);
      navigate('/');
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Login failed.') : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl text-4xl mb-5 shadow-2xl shadow-indigo-500/50 animate-float">
            🎟
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-white/70 text-base font-medium">Sign in to your TicketApp account</p>
        </div>

        <div className="glass rounded-3xl border-4 border-white/60 shadow-2xl shadow-indigo-900/40 p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email address</label>
              <input type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field" required autoFocus />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
              <input type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field" required />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3.5 text-red-800 text-sm font-bold shadow-sm">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? '⏳ Signing in...' : '🚀 Sign In →'}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t-2 border-slate-100 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="gradient-text font-black hover:underline">Create one free →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
