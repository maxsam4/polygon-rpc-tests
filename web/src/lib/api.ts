import type { Results, Config, ProgressEvent } from '../../../shared/types';

const API_BASE = '/api';

export async function fetchResults(): Promise<Results> {
  const res = await fetch(`${API_BASE}/results`);
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}

export async function fetchConfig(password: string): Promise<Config> {
  const res = await fetch(`${API_BASE}/config`, {
    headers: { Authorization: `Bearer ${password}` },
  });
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateConfig(password: string, config: Config): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${password}`,
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update config');
}

export async function startTestRun(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tests/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${password}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to start tests');
  }
}

export async function fetchTestStatus(): Promise<{ running: boolean; progress: ProgressEvent | null }> {
  const res = await fetch(`${API_BASE}/tests/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export function subscribeToProgress(
  onEvent: (event: ProgressEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/tests/progress`);

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      onEvent(event);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.addEventListener('status', (e: any) => {
    try {
      const event = JSON.parse(e.data);
      onEvent({ type: 'progress', ...event });
    } catch (err) {
      console.error('Failed to parse status event:', err);
    }
  });

  eventSource.addEventListener('progress', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse progress event:', err);
    }
  });

  eventSource.addEventListener('result', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse result event:', err);
    }
  });

  eventSource.addEventListener('complete', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse complete event:', err);
    }
  });

  eventSource.addEventListener('error', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse error event:', err);
    }
  });

  eventSource.onerror = () => {
    if (onError) {
      onError(new Error('SSE connection error'));
    }
  };

  return () => eventSource.close();
}
