import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = (to: string, label: string) => {
    const active = pathname === to;
    return (
      <Link to={to} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40'
          : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
      }`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Navbar ── */}
      <header className="glass sticky top-0 z-30 border-b-4 border-indigo-100 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-400/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              🎟
            </div>
            <div>
              <p className="gradient-text text-xl font-black leading-none">TicketApp</p>
              <p className="text-[11px] text-slate-500 font-semibold">Book Your Experience</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-2">
            {navLink('/', 'Shows')}
            {user?.role === 'admin' && navLink('/admin', 'Admin')}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <span className={`hidden sm:flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl shadow-md ${
                  user.role === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-400/40'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-400/40'
                }`}>
                  {user.role === 'admin' ? '⚡' : '👤'} {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
                <button onClick={handleLogout}
                  className="text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-4 py-2 rounded-xl shadow-md shadow-red-400/40 transition-all hover:scale-105 active:scale-95">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-bold text-slate-600 hover:text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all">
                  Sign in
                </Link>
                <Link to="/register"
                  className="text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-400/40 transition-all hover:scale-105 active:scale-95">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center justify-center gap-3 pb-3 px-4">
          {navLink('/', 'Shows')}
          {user?.role === 'admin' && navLink('/admin', 'Admin')}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex justify-center items-start p-6 sm:p-10">
        <div className="w-full max-w-5xl glass-card rounded-2xl border-2 border-slate-200 shadow-2xl shadow-indigo-900/20 px-6 sm:px-10 py-8 sm:py-10">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="glass-dark py-5 text-center border-t-2 border-white/10">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-semibold">
          <span>🎟</span>
          <span>TicketApp © {new Date().getFullYear()} — Book smarter, not harder.</span>
        </div>
      </footer>

    </div>
  );
}
