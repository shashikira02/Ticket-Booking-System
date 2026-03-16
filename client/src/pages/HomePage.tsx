import { Link } from 'react-router-dom';
import { useShows } from '../contexts/ShowsContext';
import Layout from '../components/Layout';

function SkeletonCard() {
  return (
    <div className="rounded-3xl border-4 border-slate-200 bg-white p-8 animate-pulse flex flex-col gap-4">
      <div className="h-7 bg-slate-200 rounded-xl w-1/2 mx-auto" />
      <div className="h-5 bg-slate-100 rounded-xl w-2/3 mx-auto" />
      <div className="h-4 bg-slate-100 rounded-full w-full mt-2" />
      <div className="h-14 bg-slate-200 rounded-2xl mt-2" />
    </div>
  );
}

export default function HomePage() {
  const { shows, loading, error } = useShows();

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="text-center mb-12 mx-auto max-w-3xl">
        <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-black px-5 py-2 rounded-full border-2 border-indigo-200 mb-5 shadow-sm">
          🎭 Live Shows
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-4">
          Find your next<br />
          <span className="gradient-text animate-float inline-block">unforgettable show</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">
          Browse upcoming shows and book your seats instantly.
        </p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-center gap-3 max-w-xl mx-auto bg-red-50 border-4 border-red-300 rounded-2xl px-6 py-5 text-red-800 font-bold shadow-lg">
          <span className="text-2xl">⚠️</span> {error}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && shows.length === 0 && (
        <div className="text-center py-24 mx-auto max-w-md">
          <div className="text-8xl mb-5 animate-float">🎭</div>
          <p className="text-2xl font-black text-slate-700">No shows yet</p>
          <p className="text-slate-500 mt-2">Check back soon for upcoming events.</p>
        </div>
      )}

      {/* ── Shows Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shows.map((show) => {
          const avail = Number(show.available_seats);
          const total = show.total_seats;
          const pct = total > 0 ? Math.round((avail / total) * 100) : 0;
          const soldOut = avail === 0;
          const almostFull = pct <= 20 && !soldOut;

          const statusBg = soldOut
            ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-400/40'
            : almostFull
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-400/40'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-400/40';

          const barColor = soldOut
            ? 'bg-gradient-to-r from-red-400 to-rose-500'
            : almostFull
            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
            : pct <= 50
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
            : 'bg-gradient-to-r from-emerald-400 to-teal-500';

          const cardBorder = soldOut
            ? 'border-red-200 hover:border-red-400'
            : almostFull
            ? 'border-amber-200 hover:border-amber-400'
            : 'border-indigo-200 hover:border-indigo-500';

          return (
            <div key={show.id}
              className={`group glass-card rounded-3xl border-4 ${cardBorder} shadow-xl card-hover flex flex-col overflow-hidden`}>

              {/* Card top colour strip */}
              <div className={`h-3 w-full ${barColor}`} />

              <div className="p-7 flex flex-col flex-1">
                {/* Status badge */}
                <div className="flex justify-center mb-5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full text-white shadow-lg ${statusBg}`}>
                    {soldOut ? '❌ Sold Out' : almostFull ? '🔥 Almost Full' : '✅ Available'}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-3 leading-snug group-hover:gradient-text transition-all duration-300">
                  {show.name}
                </h2>

                {/* Date */}
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold mb-6">
                  <span className="text-lg">📅</span>
                  {new Date(show.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-slate-100 mb-5" />

                {/* Availability */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Seats</span>
                    <span className="text-sm font-black text-slate-700">{avail} / {total}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200 shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-center text-xs font-bold text-slate-400 mt-1.5">{pct}% available</p>
                </div>

                {/* Book button */}
                <div className="mt-auto">
                  {soldOut ? (
                    <div className="w-full text-center py-2.5 rounded-xl bg-slate-100 border-2 border-slate-300 text-slate-400 font-bold text-sm cursor-not-allowed">
                      ❌ Sold Out
                    </div>
                  ) : (
                    <Link to={`/booking/${show.id}`}
                      className="btn-primary w-full text-sm">
                      🎟️ Book Now →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
