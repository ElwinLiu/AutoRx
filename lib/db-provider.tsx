import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase } from './db';

interface DbContextType {
  isReady: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextType>({
  isReady: false,
  error: null,
});

export function useDatabase() {
  return useContext(DbContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))));
  }, []);

  return (
    <DbContext.Provider value={{ isReady, error }}>
      {children}
    </DbContext.Provider>
  );
}
