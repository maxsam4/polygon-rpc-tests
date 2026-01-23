import { writable, derived, get } from 'svelte/store';
import type {
  BenchmarkState,
  BenchmarkDataPoint,
  BenchmarkEndpointData,
  Endpoint,
} from '../../../shared/types';

// Mission control themed colors - cyan/teal variants with high contrast
const chartColors = [
  '#00b4d8', // Primary cyan
  '#00ff88', // Nominal green
  '#ff3366', // Critical pink
  '#ffc107', // Warning amber
  '#48cae4', // Light cyan
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan variant
  '#22c55e', // Green variant
  '#eab308', // Yellow
];

// Default state
const defaultState: BenchmarkState = {
  endpoints: {},
  colorMap: {},
  pollingIntervalMs: 2000,
  maxDataPoints: 60,
  isRunning: false,
};

// Main store
export const benchmarkState = writable<BenchmarkState>(defaultState);

// Derived store: endpoints sorted by block number desc, then response time asc
export const sortedEndpoints = derived(benchmarkState, ($state) => {
  const endpoints = Object.values($state.endpoints);

  return endpoints.sort((a, b) => {
    const aLatest = a.history.at(-1);
    const bLatest = b.history.at(-1);

    const aBlock = aLatest?.blockNumber ?? -1;
    const bBlock = bLatest?.blockNumber ?? -1;

    if (aBlock !== bBlock) return bBlock - aBlock;

    const aTime = aLatest?.responseMs ?? Infinity;
    const bTime = bLatest?.responseMs ?? Infinity;
    return aTime - bTime;
  });
});

// Polling interval reference
let pollingInterval: number | null = null;

// Generate a unique ID for an endpoint
function generateEndpointId(url: string): string {
  // Simple hash for browser
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Assign a color to an endpoint based on the number of existing colors
function assignColor(state: BenchmarkState, endpointId: string): string {
  if (state.colorMap[endpointId]) {
    return state.colorMap[endpointId];
  }
  const colorIndex = Object.keys(state.colorMap).length;
  const color = chartColors[colorIndex % chartColors.length];
  state.colorMap[endpointId] = color;
  return color;
}

// Fetch block number from an RPC endpoint
async function fetchBlockNumber(url: string, timeoutMs: number = 5000): Promise<BenchmarkDataPoint> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
      signal: controller.signal,
    });

    const responseMs = Date.now() - start;
    const data = await response.json();

    if (data.error || !data.result) {
      return {
        timestamp: Date.now(),
        blockNumber: null,
        responseMs,
        success: false,
      };
    }

    const blockNumber = parseInt(data.result, 16);
    return {
      timestamp: Date.now(),
      blockNumber,
      responseMs,
      success: true,
    };
  } catch {
    const responseMs = Date.now() - start;
    return {
      timestamp: Date.now(),
      blockNumber: null,
      responseMs,
      success: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Poll all endpoints
async function pollEndpoints(): Promise<void> {
  const state = get(benchmarkState);
  const endpointIds = Object.keys(state.endpoints);

  // Poll all endpoints in parallel
  const results = await Promise.all(
    endpointIds.map(async (id) => {
      const endpoint = state.endpoints[id];
      const dataPoint = await fetchBlockNumber(endpoint.url);
      return { id, dataPoint };
    })
  );

  // Update state with results
  benchmarkState.update((s) => {
    for (const { id, dataPoint } of results) {
      const endpoint = s.endpoints[id];
      if (!endpoint) continue;

      endpoint.history.push(dataPoint);
      endpoint.totalCalls++;
      if (dataPoint.success) {
        endpoint.successfulCalls++;
      }

      // Trim history to maxDataPoints
      while (endpoint.history.length > s.maxDataPoints) {
        endpoint.history.shift();
      }
    }
    return s;
  });
}

// Initialize endpoints from config
export function initializeEndpoints(endpoints: Endpoint[]): void {
  benchmarkState.update((state) => {
    for (const endpoint of endpoints) {
      if (endpoint.showInBenchmark !== false) {
        const id = generateEndpointId(endpoint.url);
        if (!state.endpoints[id]) {
          assignColor(state, id); // Assign color when adding endpoint
          state.endpoints[id] = {
            id,
            url: endpoint.url,
            name: endpoint.name,
            sensitive: endpoint.sensitive,
            isTemporary: false,
            history: [],
            totalCalls: 0,
            successfulCalls: 0,
          };
        }
      }
    }
    return state;
  });
}

// Start benchmark polling
export function startBenchmark(): void {
  const state = get(benchmarkState);
  if (state.isRunning) return;

  benchmarkState.update((s) => ({ ...s, isRunning: true }));

  // Start polling
  pollingInterval = window.setInterval(pollEndpoints, state.pollingIntervalMs);

  // Do first poll immediately
  pollEndpoints();
}

// Stop benchmark polling
export function stopBenchmark(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  benchmarkState.update((s) => ({ ...s, isRunning: false }));
}

// Add a temporary endpoint
export function addTemporaryEndpoint(url: string, name: string): boolean {
  const id = generateEndpointId(url);
  const state = get(benchmarkState);

  if (state.endpoints[id]) {
    return false; // Already exists
  }

  benchmarkState.update((s) => {
    assignColor(s, id); // Assign color when adding endpoint
    s.endpoints[id] = {
      id,
      url,
      name,
      isTemporary: true,
      history: [],
      totalCalls: 0,
      successfulCalls: 0,
    };
    return s;
  });

  return true;
}

// Remove a temporary endpoint
export function removeTemporaryEndpoint(id: string): boolean {
  const state = get(benchmarkState);
  const endpoint = state.endpoints[id];

  if (!endpoint || !endpoint.isTemporary) {
    return false;
  }

  benchmarkState.update((s) => {
    delete s.endpoints[id];
    delete s.colorMap[id]; // Remove color mapping when removing endpoint
    return s;
  });

  return true;
}

// Update polling interval
export function updatePollingInterval(intervalMs: number): void {
  benchmarkState.update((s) => ({ ...s, pollingIntervalMs: intervalMs }));

  const state = get(benchmarkState);
  if (state.isRunning && pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = window.setInterval(pollEndpoints, intervalMs);
  }
}

// Reset benchmark state
export function resetBenchmark(): void {
  stopBenchmark();
  benchmarkState.set(defaultState);
}
