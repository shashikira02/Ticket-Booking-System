import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { useShows } from '../contexts/ShowsContext';
import confetti from 'canvas-confetti';

interface SeatsData {
  showId: number;
  totalSeats: number;
  availableSeats: number[];
  bookedSeats: number[];
}

interface BookingResult {
  status: string;
  bookingId?: number;
  message?: string;
}

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function BookingPage() {
  const { id: showId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shows } = useShows();
  const show = shows.find((s) => String(s.id) === showId);

  const [seatsData, setSeatsData] = useState<SeatsData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showId) return;
    setLoading(true);
    axios.get<SeatsData>(`/api/v1/shows/${showId}/seats`)
      .then((res) => setSeatsData(res.data))
      .catch(() => setError('Failed to load seats.'))
      .finally(() => setLoading(false));
    return () => setSelected([]);
  }, [showId]);

  const toggleSeat = useCallback((num: number, isBooked: boolean) => {
    if (isBooked) return;
    setSelected((prev) => prev.includes(num) ? prev.filter((s) => s !== num) : [...prev, num]);
  }, []);

  const handleBook = async () => {
    if (selected.length === 0) return setError('Select at least one seat.');
    setError(''); setResult(null); setBooking(true);
    try {
      const res = await axios.post<BookingResult>(
        '/api/v1/bookings',
        { showId: Number(showId), seatNumbers: selected },
        { headers: authHeader() }
      );
      setResult(res.data);

      if (res.data.status === 'CONFIRMED') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
        });
      }

      const updated = await axios.get<SeatsData>(`/api/v1/shows/${showId}/seats`);
      setSeatsData(updated.data);
      setSelected([]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { status?: string; message?: string; error?: string };
        setResult({ status: data?.status ?? 'FAILED', message: data?.message ?? data?.error });
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6 mt-6 max-w-4xl mx-auto">
          <div className="h-10 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl mx-auto" />
          <div className="h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  if (error && !seatsData) {
    return (
      <Layout>
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 px-6 py-5 text-sm text-red-800 font-semibold shadow-lg max-w-2xl mx-auto">
          <span className="text-2xl">⚠️</span> {error}
        </div>
      </Layout>
    );
  }

  if (!seatsData) return null;

  const bookedSet = new Set(seatsData.bookedSeats);
  const allSeats = Array.from({ length: seatsData.totalSeats }, (_, i) => i + 1);
  const COLS = Math.min(10, Math.ceil(Math.sqrt(seatsData.totalSeats)));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto text-center">
        <div className="text-left mb-10">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-all font-bold hover:gap-3 group">
            <span className="group-hover:scale-125 transition-transform">←</span> Back to Shows
          </button>
        </div>

        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-6 pb-8 border-b-2 border-slate-200">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-black gradient-text">{show?.name ?? `Show #${showId}`}</h1>
            {show && (
              <p className="text-slate-600 mt-3 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base font-medium">
                <span className="text-lg">📅</span>
                {new Date(show.start_time).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div>
              <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">{seatsData.availableSeats.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Available</p>
            </div>
            <div className="w-px h-10 sm:h-12 bg-slate-300" />
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-400">{seatsData.bookedSeats.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Booked</p>
            </div>
            <div className="w-px h-10 sm:h-12 bg-slate-300" />
            <div>
              <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{selected.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Selected</p>
            </div>
          </div>
        </div>

        {result && (
          <div className={`mb-8 flex items-center justify-center gap-4 rounded-2xl border-2 px-6 py-5 text-sm sm:text-base font-bold shadow-xl ${
            result.status === 'CONFIRMED'
              ? 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-300 text-emerald-900'
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-900'
          }`}>
            <span className="text-2xl sm:text-3xl">{result.status === 'CONFIRMED' ? '🎉' : '❌'}</span>
            <span>
              {result.status === 'CONFIRMED'
                ? `Booking confirmed! Your reference is #${result.bookingId}`
                : (result.message ?? 'Booking failed. Please try again.')}
            </span>
          </div>
        )}

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-b from-indigo-50 via-purple-50 to-white px-8 pt-10 pb-6 text-center border-b-2 border-slate-200">
            <div className="mx-auto w-3/4 h-3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full mb-3 shadow-lg" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Screen</p>
          </div>

          <div className="flex items-center justify-center gap-8 px-8 py-5 border-b-2 border-slate-200 text-sm font-bold text-slate-600 bg-slate-50">
            <span className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-slate-200 border-2 border-slate-300 inline-block shadow-sm" /> Booked
            </span>
            <span className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300 inline-block shadow-sm" /> Available
            </span>
            <span className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 inline-block shadow-md" /> Selected
            </span>
          </div>

          <div className="p-10">
            <div className="grid gap-3 max-w-3xl mx-auto" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {allSeats.map((num) => {
                const isBooked = bookedSet.has(num);
                const isSelected = selected.includes(num);
                return (
                  <button key={num}
                    onClick={() => toggleSeat(num, isBooked)}
                    disabled={isBooked}
                    title={isBooked ? `Seat ${num} — Booked` : `Seat ${num}`}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm font-black select-none transition-all duration-150 ${
                      isBooked
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
                        : isSelected
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl scale-110 ring-4 ring-indigo-300 animate-glow'
                          : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:scale-110 cursor-pointer shadow-md hover:shadow-lg'
                    }`}>
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-5">
            <div className="text-sm sm:text-base text-slate-700 font-medium">
              {selected.length === 0 ? (
                <span className="text-slate-500">Click seats above to select them</span>
              ) : (
                <span>
                  <span className="font-black text-slate-900">{selected.length}</span> seat{selected.length !== 1 ? 's' : ''} selected:{' '}
                  <span className="gradient-text font-black">{[...selected].sort((a, b) => a - b).join(', ')}</span>
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              {selected.length > 0 && (
                <button onClick={() => setSelected([])}
                  className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-white">
                  Clear
                </button>
              )}
              {error && <p className="text-xs sm:text-sm text-red-600 font-bold">{error}</p>}
              <button onClick={handleBook}
                disabled={booking || selected.length === 0}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                {booking ? 'Booking...' : `Confirm ${selected.length > 0 ? `(${selected.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
