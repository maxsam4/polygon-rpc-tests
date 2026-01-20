<script lang="ts">
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { results, loading, error, categories, getMethodCategory } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';
  import type { EndpointResults, TestResult, Category, TestSettings } from '../../../shared/types';
  import { getMethodParams, getActualMethod } from '../../../shared/rpcParams';

  export let params: { id: string } = { id: '' };

  let endpoint: EndpointResults | null = null;
  let filterText = '';
  let filterCategory: Category | 'all' = 'all';
  let filterStatus: 'all' | 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped' = 'all';
  let toastMessage = '';
  let showToast = false;

  // Default test settings for generating curl commands
  const defaultTestSettings: TestSettings = {
    timeoutMs: 10000,
    delayBetweenCallsMs: 100,
    archiveBlockNumber: 35000000,
    archiveTestAddress: '0x0000000000000000000000000000000000001010',
    concurrency: 5,
  };

  function generateCurl(method: string, url: string): string {
    const actualMethod = getActualMethod(method);
    const methodParams = getMethodParams(method, defaultTestSettings);
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: actualMethod,
      params: methodParams,
    };
    return `curl -X POST ${url} -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`;
  }

  async function copyToClipboard(method: string) {
    if (!endpoint || endpoint.sensitive) return;
    const curl = generateCurl(method, endpoint.url);
    try {
      await navigator.clipboard.writeText(curl);
      toastMessage = 'Curl command copied!';
      showToast = true;
      setTimeout(() => { showToast = false; }, 2000);
    } catch {
      toastMessage = 'Failed to copy';
      showToast = true;
      setTimeout(() => { showToast = false; }, 2000);
    }
  }

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
        {#if endpoint.sensitive}
          <span class="url sensitive">URL hidden (sensitive endpoint)</span>
        {:else}
          <span class="url">{endpoint.url}</span>
        {/if}
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
          <th>Response</th>
        </tr>
      </thead>
      <tbody>
        {#each methodEntries as [method, result]}
          <tr>
            <td
              class="method"
              class:clickable={!endpoint.sensitive}
              onclick={() => copyToClipboard(method)}
              title={endpoint.sensitive ? 'Curl disabled for sensitive endpoints' : 'Click to copy curl command'}
            >{method}</td>
            <td class="category">{getMethodCategory(method)}</td>
            <td><StatusBadge status={result.status} /></td>
            <td class="response-time">
              {result.responseMs ? `${result.responseMs}ms` : '—'}
            </td>
            <td class="response-cell" class:error={result.error} class:success={!result.error && result.response !== undefined}>
              {#if result.error}
                {result.error}
              {:else if result.response !== undefined}
                {typeof result.response === 'string' ? result.response : JSON.stringify(result.response).slice(0, 200)}
              {:else}
                —
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if showToast}
    <div class="toast">{toastMessage}</div>
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

  .url.sensitive {
    font-style: italic;
    color: var(--text-secondary);
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

  .response-cell {
    font-size: 0.75rem;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: monospace;
  }

  .response-cell.error {
    color: var(--error);
  }

  .response-cell.success {
    color: var(--success, #22c55e);
  }

  .clickable {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .clickable:hover {
    color: var(--primary, #3b82f6);
    text-decoration: underline;
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--bg-secondary, #374151);
    color: var(--text-primary, #fff);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
