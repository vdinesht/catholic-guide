import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

export interface ApiState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  reload: () => void;
  setData: (data: T) => void;
}

/** GETs {@code url} whenever it changes. Pass null to skip. Responses for stale URLs are dropped. */
export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(url !== null);
  const [tick, setTick] = useState(0);
  const current = useRef(url);

  useEffect(() => {
    current.current = url;
    if (url === null) return;
    setLoading(true);
    setError(undefined);
    api
      .get<T>(url)
      .then((d) => {
        if (current.current === url) setData(d);
      })
      .catch((e: unknown) => {
        if (current.current === url) setError(e instanceof ApiError ? e : new ApiError(0, 'Network error.'));
      })
      .finally(() => {
        if (current.current === url) setLoading(false);
      });
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}
