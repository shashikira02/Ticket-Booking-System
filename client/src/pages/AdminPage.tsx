import { useState } from 'react';
import axios from 'axios';
import api from '../api';
import type { Show } from '../contexts/ShowsContext';
import { useShows } from '../contexts/ShowsContext';
import Layout from '../components/Layout';

interface FormState { name: string; startTime: string; totalSeats: number; }
const INITIAL: FormState = { name: '', startTime: '', totalSeats: 50 };

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
  const { shows, setShows, loading, error: fetchError } = useShows();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/api/v1/admin/shows', form, { headers: authHeader() });
      const res = await api.get<Show[]>('/api/v1/admin/shows', { headers: authHeader() });
      setShows(res.data);
      setForm(INITIAL);
      setSuccess(`"${form.name}" created with ${form.totalSeats} seats.`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to create show.') : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="text-center">
        <div className="mb-14 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-sm font-bold px-5 py-2.5 rounded-full mb-6 border-2 border-indigo-200 shadow-md">
            <span className="gradient-text">⚡ Admin Dashboard</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black gradient-text mb-4">Manage Shows</h1>
          <p className="text-slate-600 text-lg sm:text-xl font-medium">Create new shows and monitor seat availability.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start max-w-6xl mx-auto text-left">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-slate-200 shadow-xl p-8">
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg shadow-lg">+</span>
                New Show
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Show Name</label>
                  <input type="text" placeholder="e.g. Avengers: Endgame"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border-2 border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white font-medium"
                    required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Start Time</label>
                  <input type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="border-2 border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white font-medium"
                    required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    Total Seats
                    <span className="ml-2 text-slate-400 normal-case font-normal">(1–1000)</span>
                  </label>
                  <input type="number" min={1} max={1000}
                    value={form.totalSeats}
                    onChange={(e) => setForm({ ...form, totalSeats: parseInt(e.target.value) || 1 })}
                    className="border-2 border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white font-medium"
                    required />
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-sm text-red-800 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl px-4 py-4 font-bold shadow-md">
                    <span className="text-xl">⚠️</span> {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-3 text-sm text-emerald-800 bg-gradient-to-r from-emerald-50 to-green-100 border-2 border-emerald-300 rounded-xl px-4 py-4 font-bold shadow-md">
                    <span className="text-xl">✓</span> {success}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Creating...' : 'Create Show →'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">
                All Shows
                {!loading && (
                  <span className="ml-3 text-lg font-normal text-slate-500">({shows.length})</span>
                )}
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 rounded-3xl animate-pulse" />
                ))}
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-3 text-sm text-red-800 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl px-4 py-4 font-bold shadow-md">
                <span className="text-xl">⚠️</span> {fetchError}
              </div>
            )}

            {!loading && !fetchError && shows.length === 0 && (
              <div className="text-center py-24 bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-dashed border-slate-300 shadow-inner">
                <div className="text-7xl mb-5 animate-float">🎭</div>
                <p className="font-black text-slate-700 text-xl">No shows yet</p>
                <p className="text-base mt-2 text-slate-500">Create your first show using the form.</p>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {shows.map((show) => {
                const avail = Number(show.available_seats);
                const pct = show.total_seats > 0 ? Math.round((avail / show.total_seats) * 100) : 0;
                const soldOut = avail === 0;
                return (
                  <div key={show.id}
                    className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-200 px-7 py-6 flex items-center justify-between gap-6 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-slate-900 truncate">{show.name}</p>
                      <p className="text-sm text-slate-600 mt-1.5 flex items-center gap-2 font-semibold">
                        <span>📅</span>
                        {new Date(show.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-500 ${soldOut ? 'bg-gradient-to-r from-red-400 to-red-500' : pct <= 30 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-green-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm text-slate-600 whitespace-nowrap font-black">{avail}/{show.total_seats}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-black px-5 py-2.5 rounded-full shadow-md ${soldOut ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                      }`}>
                      {soldOut ? 'Sold Out' : `${avail} left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
