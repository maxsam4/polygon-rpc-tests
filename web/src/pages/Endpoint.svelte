<script lang="ts">
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { results, loading, error, categories } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';
  import type { EndpointResults, TestResult, Category } from '../../../shared/types';

  export let params: { id: string } = { id: '' };

  let endpoint: EndpointResults | null = null;
  let filterText = '';
  let filterCategory: Category | 'all' = 'all';
  let filterStatus: 'all' | 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped' = 'all';

  $: if ($results && params.id) {
    endpoint = $results.endpoints[params.id] || null;
  }

  $: methodEntries = endpoint
    ? Object.entries(endpoint.results)
        .filter(([method, result]) => {
          if (filterText && !method.toLowerCase().includes(filterText.toLowerCase())) {
            return false;
          }
          if (filterStatus !== 'all' && result.status !== filterStatus) {
            return false;
          }
          if (filterCategory !== 'all') {
            const cat = getMethodCategory(method);
            if (cat !== filterCategory) return false;
          }
          return true;
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  function getMethodCategory(method: string): Category {
    if (method.endsWith(':archive')) return 'archive';
    if (method.startsWith('eth_subscribe:')) return 'websocket';
    if (method.startsWith('bor_')) return 'bor';
    if (method.startsWith('erigon_')) return 'erigon';
    if (method.startsWith('debug_')) return 'debug';
    if (method.startsWith('trace_')) return 'trace';
    if (method.startsWith('txpool_')) return 'txpool';
    if (method.includes('Filter') || method === 'eth_getLogs') return 'filter';
    if (method.includes('Transaction') && !method.includes('Count')) return 'transaction';
    if (method.includes('Block') || method.includes('Uncle')) return 'block';
    if (['eth_getBalance', 'eth_getStorageAt', 'eth_getTransactionCount', 'eth_getCode', 'eth_call', 'eth_estimateGas', 'eth_createAccessList'].includes(method)) return 'state';
    return 'basic';
  }

  onMount(async () => {
    if (!$results) {
      $loading = true;
      try {
        $results = await fetchResults();
      } catch (e) {
        $error = e instanceof Error ? e.message : 'Failed to load results';
      } finally {
        $loading = false;
      }
    }
  });
</script>

<div class="endpoint-page">
  <a href="/" use:link class="back-link">← Back to Results</a>

  {#if $loading}
    <p class="loading">Loading...</p>
  {:else if $error}
    <p class="error">{$error}</p>
  {:else if !endpoint}
    <p class="not-found">Endpoint not found</p>
  {:else}
    <div class="endpoint-header">
      <h2>{endpoint.name}</h2>
      <div class="endpoint-meta">
        <span class="url">{endpoint.url}</span>
        <span class="node-type">Node Type: <strong>{endpoint.nodeType}</strong></span>
        <span class="avg-response">Avg Response: <strong>{endpoint.avgResponseMs}ms</strong></span>
      </div>
    </div>

    <div class="controls">
      <input
        type="text"
        placeholder="Filter methods..."
        bind:value={filterText}
      />
      <select bind:value={filterCategory}>
        <option value="all">All Categories</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <select bind:value={filterStatus}>
        <option value="all">All Statuses</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="timeout">Timeout</option>
        <option value="unsupported">Unsupported</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>

    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Category</th>
          <th>Status</th>
          <th>Response Time</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {#each methodEntries as [method, result]}
          <tr>
            <td class="method">{method}</td>
            <td class="category">{getMethodCategory(method)}</td>
            <td><StatusBadge status={result.status} /></td>
            <td class="response-time">
              {result.responseMs ? `${result.responseMs}ms` : '—'}
            </td>
            <td class="error-cell">{result.error || '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .endpoint-page {
    padding: 1rem 0;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
  }

  .loading, .error, .not-found {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--error);
  }

  .endpoint-header {
    margin-bottom: 1.5rem;
  }

  .endpoint-header h2 {
    margin-bottom: 0.5rem;
  }

  .endpoint-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .url {
    font-family: monospace;
    background-color: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .controls input {
    width: 250px;
  }

  .controls select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    background-color: var(--bg-secondary);
    font-weight: 600;
  }

  .method {
    font-family: monospace;
    font-weight: 500;
  }

  .category {
    text-transform: capitalize;
    color: var(--text-secondary);
  }

  .response-time {
    font-family: monospace;
  }

  .error-cell {
    color: var(--error);
    font-size: 0.75rem;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
