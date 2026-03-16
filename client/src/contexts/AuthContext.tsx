import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthUser {
  token: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
}

function parseRole(token: string): 'user' | 'admin' {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return payload.role === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}

function loadUser(): AuthUser | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return { token, role: parseRole(token) };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  function login(token: string) {
    localStorage.setItem('token', token);
    setUser({ token, role: parseRole(token) });
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
