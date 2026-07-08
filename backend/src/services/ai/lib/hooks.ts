"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook for API endpoints.
 * Falls back to provided default data if fetch fails.
 */
export function useFetch<T>(
  url: string,
  options?: { params?: Record<string, string | number | undefined>; defaultData?: T; enabled?: boolean }
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(options?.defaultData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const paramsRef = useRef(options?.params);
  paramsRef.current = options?.params;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fullUrl = url;
      if (paramsRef.current) {
        const searchParams = new URLSearchParams();
        Object.entries(paramsRef.current).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
        const qs = searchParams.toString();
        if (qs) fullUrl += `?${qs}`;
      }

      const res = await fetch(fullUrl, { credentials: "include" });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`API ${res.status}: ${errorBody.slice(0, 100)}`);
      }

      const json = await res.json();
      // API returns { data: ... } or just the raw data
      setData(json.data !== undefined ? json.data : json);
    } catch (err: any) {
      console.warn(`[useFetch] ${url} failed:`, err.message);
      setError(err.message);
      // Keep default/previous data as fallback
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to check if API is reachable.
 */
export function useApiStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => setConnected(r.ok))
      .catch(() => setConnected(false));
  }, []);

  return { connected, isDemo: connected === false };
}
