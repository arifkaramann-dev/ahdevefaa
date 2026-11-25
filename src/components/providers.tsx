'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Collection, SessionState, WorkspaceData } from '@/lib/types';
import { EMPTY_WORKSPACE } from '@/lib/types';

type WorkspaceContext = {
  session: SessionState;
  data: WorkspaceData;
  loading: boolean;
  refresh: () => Promise<void>;
  mutate: (collection: Collection, method: 'POST' | 'PATCH' | 'DELETE', data: Record<string, unknown>, id?: string) => Promise<boolean>;
  notify: (message: string) => void;
};
const INITIAL_SESSION: SessionState = { configured: false, user: null, profile: null, role: 'member', schemaReady: false };
const Context = createContext<WorkspaceContext | null>(null);

export async function apiRequest(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Ahde-Request': '1' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const result = await response.json().catch(() => ({ error: 'Sunucudan yanıt alınamadı.' }));
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
  return result;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);
  const [data, setData] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestVersion = useRef(0);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 6000);
  }, []);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const next: SessionState = await apiRequest('/api/session', 'GET');
      if (version !== requestVersion.current) return;
      if (next.user && next.schemaReady && next.role !== 'member') {
        const workspace: WorkspaceData = await apiRequest('/api/workspace', 'GET');
        if (version !== requestVersion.current) return;
        setData(workspace);
      } else {
        setData(EMPTY_WORKSPACE);
      }
      setSession(next);
    } catch (error) {
      if (version !== requestVersion.current) return;
      setSession(INITIAL_SESSION);
      setData(EMPTY_WORKSPACE);
      notify(error instanceof Error ? error.message : 'Bağlantı kurulamadı.');
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [notify]);
  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); if (timer.current) clearTimeout(timer.current); };
  }, [refresh]);
  const mutate = useCallback(async (collection: Collection, method: 'POST' | 'PATCH' | 'DELETE', payload: Record<string, unknown>, id?: string) => {
    try {
      await apiRequest('/api/records', method, { collection, ...(method === 'DELETE' ? {} : { data: payload }), ...(id ? { id } : {}) });
      await refresh();
      notify(method === 'DELETE' ? 'Kayıt silindi.' : 'Kaydınız güvenle saklandı.');
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Kayıt saklanamadı.');
      return false;
    }
  }, [notify, refresh]);
  return <Context.Provider value={{ session, data, loading, refresh, mutate, notify }}>
    {children}
    {toast && <div className="toast" role="status"><span>{toast}</span><button aria-label="Bildirimi kapat" onClick={() => setToast('')}>×</button></div>}
  </Context.Provider>;
}

export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error('Workspace provider is required');
  return context;
}
