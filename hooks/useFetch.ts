import { useState, useEffect } from 'react';
import type { ApiResponse } from '@/types';

interface UseFetchOptions {
  autoFetch?: boolean;
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = { autoFetch: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoFetch) {
      fetchData();
    }
  }, [url, options.autoFetch]);

  return { data, loading, error, refetch: fetchData };
}
