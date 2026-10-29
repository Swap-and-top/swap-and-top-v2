'use client';

/**
 * Loading from the API with TanStack Query: one client for the app
 * (QueryProvider, in the root layout), and `apiGet` / `apiSend` to use as a
 * query's or a mutation's function. They throw an `ApiError` with the API's
 * own message, so every page shows loading, a problem and the data the same
 * way, keeps what it loaded (the cache), and tries again by itself when the
 * server could not be reached, but not when the answer was a plain no
 * (not allowed, not there, something wrong with what was sent).
 *
 * `QueryProblem` is the one way a page says it could not load, with
 * Try again. A query with `meta: { toast: true }` says so in a toast
 * instead, for one shared by several screens (the Store console's stock);
 * `meta: { onError }` is called once a query has given up.
 */

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button, Panel, Stack } from '@snt/ui';
import { apiAsViewer } from './supabase';
import styles from './query.module.css';

export class ApiError extends Error {
  /** The HTTP status; none when the server could not be reached. */
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** For a query: the data, or an ApiError with the API's message. */
export async function apiGet<T>(path: string): Promise<T> {
  const { data, error, status, code } = await apiAsViewer<T>(path, { method: 'GET' });
  if (error !== undefined || data === undefined) throw new ApiError(error ?? 'Nothing came back.', status, code);
  return data;
}

/** For a query of something public, needing no sign in (a store's page). */
export async function publicGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`).catch(() => null);
  const body = (await response?.json().catch(() => undefined)) as (T & { error?: string }) | undefined;
  if (!response?.ok || body === undefined) {
    throw new ApiError(body?.error ?? 'Something went wrong. Try again in a minute.', response?.status);
  }
  return body;
}

/** For a mutation: the same, for a change. */
export async function apiSend<T = unknown>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const { data, error, status, code } = await apiAsViewer<T>(path, { method, body });
  if (error !== undefined) throw new ApiError(error, status, code);
  return data as T;
}

/** A plain no from the API: asking again would get the same answer. */
const isFinal = (error: unknown) => error instanceof ApiError && error.status !== undefined && error.status < 500;

function newClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      // Once a query has given up (its retries done).
      onError: (error, query) => {
        if (query.meta?.toast) toast.error(error.message);
        const onError = query.meta?.onError;
        if (typeof onError === 'function') onError(error);
      },
    }),
    defaultOptions: {
      queries: {
        // Shown at once from what was loaded before, and checked again each
        // time a page opens, so what was just added is never missing.
        staleTime: 0,
        // Twice more, a little apart, unless the answer was a plain no.
        retry: (count, error) => !isFinal(error) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client for the life of the page.
  const [client] = useState(newClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Could not load: the API's message, and Try again. */
export function QueryProblem({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message =
    error instanceof ApiError && error.status !== undefined
      ? error.message
      : 'We could not reach Swap & Top. Check your connection and try again.';
  return (
    <Panel padded>
      <Stack gap={5}>
        <p className={styles.message}>{message}</p>
        <Button variant="secondary" block onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    </Panel>
  );
}
