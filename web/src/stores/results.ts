import { writable, derived } from 'svelte/store';
import type { Results, Category } from '../../../shared/types';

export const results = writable<Results | null>(null);
export const loading = writable(false);
export const error = writable<string | null>(null);

export const categories: Category[] = [
  'basic',
  'state',
  'block',
  'transaction',
  'filter',
  'archive',
  'bor',
  'debug',
  'trace',
  'txpool',
  'websocket',
];

// Determine which category a method belongs to (order matters - first match wins)
export function getMethodCategory(method: string): Category {
  if (method.endsWith(':archive')) return 'archive';
  if (method.startsWith('eth_subscribe:')) return 'websocket';
  if (method.startsWith('bor_')) return 'bor';
  if (method.startsWith('debug_')) return 'debug';
  if (method.startsWith('trace_')) return 'trace';
  if (method.startsWith('txpool_')) return 'txpool';
  if (method.includes('Filter') || method === 'eth_getLogs') return 'filter';
  if (method.includes('Transaction') && !method.includes('Count')) return 'transaction';
  if (method.includes('Block') || method.includes('Uncle')) return 'block';
  if (['eth_getBalance', 'eth_getStorageAt', 'eth_getTransactionCount', 'eth_getCode', 'eth_call', 'eth_estimateGas', 'eth_createAccessList'].includes(method)) return 'state';
  return 'basic';
}

export interface EndpointSummary {
  id: string;
  name: string;
  url: string;
  nodeType: string;
  avgResponseMs: number;
  sensitive?: boolean;
  categorySummaries: Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>;
}

export const endpointSummaries = derived(results, ($results): EndpointSummary[] => {
  if (!$results) return [];

  return Object.entries($results.endpoints).map(([id, endpoint]) => {
    const categorySummaries: Record<string, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }> = {};

    for (const category of categories) {
      const methodsInCategory = Object.entries(endpoint.results)
        .filter(([method]) => getMethodCategory(method) === category);

      const passed = methodsInCategory.filter(([, r]) => r.status === 'pass').length;
      const total = methodsInCategory.length;

      let status: 'pass' | 'partial' | 'fail' | 'none' = 'none';
      if (total > 0) {
        if (passed === total) status = 'pass';
        else if (passed > 0) status = 'partial';
        else status = 'fail';
      }

      categorySummaries[category] = { passed, total, status };
    }

    return {
      id,
      name: endpoint.name,
      url: endpoint.url,
      nodeType: endpoint.nodeType,
      avgResponseMs: endpoint.avgResponseMs,
      sensitive: endpoint.sensitive,
      categorySummaries: categorySummaries as Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>,
    };
  });
});
