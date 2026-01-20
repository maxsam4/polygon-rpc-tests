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
  'erigon',
  'debug',
  'trace',
  'txpool',
  'websocket',
];

export interface EndpointSummary {
  id: string;
  name: string;
  url: string;
  nodeType: string;
  avgResponseMs: number;
  categorySummaries: Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>;
}

export const endpointSummaries = derived(results, ($results): EndpointSummary[] => {
  if (!$results) return [];

  return Object.entries($results.endpoints).map(([id, endpoint]) => {
    const categorySummaries: Record<string, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }> = {};

    for (const category of categories) {
      const methodsInCategory = Object.entries(endpoint.results)
        .filter(([method]) => {
          // Match methods to categories based on naming
          if (category === 'archive') return method.endsWith(':archive');
          if (category === 'websocket') return method.startsWith('eth_subscribe:');
          if (category === 'bor') return method.startsWith('bor_');
          if (category === 'erigon') return method.startsWith('erigon_');
          if (category === 'debug') return method.startsWith('debug_');
          if (category === 'trace') return method.startsWith('trace_');
          if (category === 'txpool') return method.startsWith('txpool_');
          if (category === 'filter') return method.includes('Filter') || method === 'eth_getLogs';
          if (category === 'transaction') return method.includes('Transaction') && !method.includes('Count');
          if (category === 'block') return method.includes('Block') || method.includes('Uncle');
          if (category === 'state') {
            return ['eth_getBalance', 'eth_getStorageAt', 'eth_getTransactionCount', 'eth_getCode', 'eth_call', 'eth_estimateGas', 'eth_createAccessList'].includes(method);
          }
          if (category === 'basic') {
            return method.startsWith('web3_') || method.startsWith('net_') ||
              ['eth_protocolVersion', 'eth_syncing', 'eth_coinbase', 'eth_chainId', 'eth_mining', 'eth_hashrate', 'eth_gasPrice', 'eth_accounts', 'eth_blockNumber', 'eth_maxPriorityFeePerGas', 'eth_feeHistory', 'eth_blobBaseFee'].includes(method);
          }
          return false;
        });

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
      categorySummaries: categorySummaries as Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>,
    };
  });
});
