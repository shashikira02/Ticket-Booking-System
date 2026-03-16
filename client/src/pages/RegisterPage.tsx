import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post<{ token: string }>('/api/v1/auth/register', form);
      login(res.data.token);
      navigate(form.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Registration failed.') : 'Unexpected error.');
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
          <h1 className="text-4xl font-black text-white mb-2">Create account</h1>
          <p className="text-white/70 text-base font-medium">Join TicketApp and start booking</p>
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
              <input type="password" placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field" required minLength={6} />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {(['user', 'admin'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border-3 font-black text-sm transition-all duration-200 ${
                      form.role === r
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg shadow-indigo-200 scale-105'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:scale-105'
                    }`}>
                    <span className="text-3xl">{r === 'user' ? '🎫' : '⚡'}</span>
                    <span>{r === 'user' ? 'Book Tickets' : 'Manage Shows'}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3.5 text-red-800 text-sm font-bold shadow-sm">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? '⏳ Creating...' : '🎉 Create Account →'}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t-2 border-slate-100 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="gradient-text font-black hover:underline">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
