import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

export interface Show {
  id: number;
  name: string;
  start_time: string;
  total_seats: number;
  available_seats: number;
}

interface ShowsContextType {
  shows: Show[];
  setShows: (shows: Show[]) => void;
  loading: boolean;
  error: string;
}

const ShowsContext = createContext<ShowsContextType | null>(null);

export const ShowsProvider = ({ children }: { children: ReactNode }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Show[]>('/api/v1/shows')
      .then((res) => setShows(res.data))
      .catch(() => setError('Failed to load shows.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShowsContext.Provider value={{ shows, setShows, loading, error }}>
      {children}
    </ShowsContext.Provider>
  );
};

export const useShows = () => {
  const ctx = useContext(ShowsContext);
  if (!ctx) throw new Error('useShows must be used within ShowsProvider');
  return ctx;
};
