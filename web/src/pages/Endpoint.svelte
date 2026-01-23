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
      toastMessage = 'Curl command copied to clipboard';
      showToast = true;
      setTimeout(() => { showToast = false; }, 2000);
    } catch {
      toastMessage = 'Failed to copy';
      showToast = true;
      setTimeout(() => { showToast = false; }, 2000);
    }
  }

  $: if ($results && params.id) {
    // Decode the URL-encoded params.id to match the keys in results.endpoints
    const decodedId = decodeURIComponent(params.id);
    endpoint = $results.endpoints[decodedId] || null;
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

  // Calculate stats
  $: stats = endpoint ? {
    total: Object.keys(endpoint.results).length,
    passed: Object.values(endpoint.results).filter(r => r.status === 'pass').length,
    failed: Object.values(endpoint.results).filter(r => r.status === 'fail').length,
    timeout: Object.values(endpoint.results).filter(r => r.status === 'timeout').length,
    unsupported: Object.values(endpoint.results).filter(r => r.status === 'unsupported').length,
  } : null;

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
  <a href="/#/features" use:link class="back-link">
    <span class="back-icon">←</span>
    <span>Back to Features</span>
  </a>

  {#if $loading}
    <div class="status-message">
      <div class="loading-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Loading...</p>
    </div>
  {:else if $error}
    <div class="status-message error">
      <p>{$error}</p>
    </div>
  {:else if !endpoint}
    <div class="status-message">
      <p>Endpoint not found</p>
    </div>
  {:else}
    <div class="station-card tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="station-header">
        <div class="station-id">
          <span class="label">Station ID</span>
          <h2 class="name">{endpoint.name}</h2>
        </div>
        <div class="node-badge" class:archive={endpoint.nodeType === 'archive'}>
          <span class="badge-dot"></span>
          <span class="badge-text">{endpoint.nodeType.toUpperCase()}</span>
        </div>
      </div>

      <div class="station-meta">
        <div class="meta-item">
          <span class="meta-label">Endpoint URL</span>
          {#if endpoint.sensitive}
            <span class="meta-value sensitive">[CLASSIFIED]</span>
          {:else}
            <span class="meta-value url">{endpoint.url}</span>
          {/if}
        </div>
        <div class="meta-item">
          <span class="meta-label">Avg Response</span>
          <span class="meta-value mono">{endpoint.avgResponseMs}ms</span>
        </div>
      </div>

      {#if stats}
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value nominal">{stats.passed}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat-item">
            <span class="stat-value critical">{stats.failed}</span>
            <span class="stat-label">Failed</span>
          </div>
          <div class="stat-item">
            <span class="stat-value warning">{stats.timeout}</span>
            <span class="stat-label">Timeout</span>
          </div>
          <div class="stat-item">
            <span class="stat-value muted">{stats.unsupported}</span>
            <span class="stat-label">N/A</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="controls">
      <div class="terminal-input">
        <input
          type="text"
          placeholder="Filter methods..."
          bind:value={filterText}
        />
      </div>
      <select bind:value={filterCategory}>
        <option value="all">All Categories</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <select bind:value={filterStatus}>
        <option value="all">All Status</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="timeout">Timeout</option>
        <option value="unsupported">N/A</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>

    <div class="table-wrapper tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Category</th>
              <th>Status</th>
              <th>Response</th>
              <th class="response-col">Result</th>
            </tr>
          </thead>
          <tbody>
            {#each methodEntries as [method, result], i}
              <tr style="animation-delay: {i * 15}ms">
                <td
                  class="method-col"
                  class:clickable={!endpoint.sensitive}
                  onclick={() => copyToClipboard(method)}
                  title={endpoint.sensitive ? 'Curl disabled for classified endpoints' : 'Click to copy curl command'}
                >
                  <span class="method-name">{method}</span>
                </td>
                <td class="category-col">{getMethodCategory(method)}</td>
                <td><StatusBadge status={result.status} /></td>
                <td class="time-col">
                  {result.responseMs ? `${result.responseMs}ms` : '—'}
                </td>
                <td class="response-col" class:error={result.error} class:success={!result.error && result.response !== undefined}>
                  {#if result.error}
                    <span class="response-error">{result.error}</span>
                  {:else if result.response !== undefined}
                    <span class="response-data">{typeof result.response === 'string' ? result.response : JSON.stringify(result.response).slice(0, 200)}</span>
                  {:else}
                    <span class="response-empty">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  {#if showToast}
    <div class="toast">
      <span class="toast-icon">✓</span>
      <span class="toast-message">{toastMessage}</span>
    </div>
  {/if}
</div>

<style>
  .endpoint-page {
    animation: fadeInUp 0.3s ease-out;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-family: var(--font-display);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--accent);
  }

  .back-icon {
    font-size: 1rem;
  }

  .status-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .status-message.error {
    color: var(--status-critical);
  }

  .loading-indicator {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .loading-indicator .dot {
    width: 8px;
    height: 8px;
    background-color: var(--accent);
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
  }

  .loading-indicator .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .loading-indicator .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  .station-card {
    position: relative;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .corner-bl,
  .corner-br {
    position: absolute;
    width: var(--corner-size);
    height: var(--corner-size);
    border-color: var(--accent);
    border-style: solid;
  }

  .corner-bl {
    bottom: -1px;
    left: -1px;
    border-width: 0 0 var(--corner-thickness) var(--corner-thickness);
  }

  .corner-br {
    bottom: -1px;
    right: -1px;
    border-width: 0 var(--corner-thickness) var(--corner-thickness) 0;
  }

  .station-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .station-id .label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-muted);
    display: block;
    margin-bottom: 0.25rem;
  }

  .station-id .name {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    margin: 0;
  }

  .node-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
  }

  .node-badge.archive {
    border-color: var(--status-nominal);
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-muted);
  }

  .node-badge.archive .badge-dot {
    background-color: var(--status-nominal);
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
  }

  .badge-text {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
  }

  .node-badge.archive .badge-text {
    color: var(--status-nominal);
  }

  .station-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .meta-value {
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .meta-value.url {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-secondary);
    background-color: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
  }

  .meta-value.sensitive {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--status-warning);
    font-style: italic;
  }

  .meta-value.mono {
    font-family: var(--font-mono);
    color: var(--accent);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background-color: var(--bg-secondary);
    border-radius: 2px;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-value.nominal { color: var(--status-nominal); }
  .stat-value.critical { color: var(--status-critical); }
  .stat-value.warning { color: var(--status-warning); }
  .stat-value.muted { color: var(--text-muted); }

  .stat-label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .terminal-input {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    flex: 1;
    min-width: 200px;
    max-width: 300px;
  }

  .terminal-input::before {
    content: '>';
    font-family: var(--font-mono);
    color: var(--accent);
    padding: 0.5rem 0 0.5rem 0.75rem;
    font-weight: 600;
  }

  .terminal-input input {
    border: none;
    background: transparent;
    flex: 1;
    padding: 0.5rem;
    padding-left: 0.5rem;
  }

  .terminal-input input:focus {
    box-shadow: none;
  }

  .controls select {
    min-width: 140px;
  }

  .table-wrapper {
    position: relative;
    padding: 1px;
  }

  .table-container {
    overflow-x: auto;
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
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    background-color: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  tbody tr {
    animation: fadeInUp 0.3s ease-out both;
  }

  .method-col {
    min-width: 200px;
  }

  .method-name {
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--text-primary);
  }

  .category-col {
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .time-col {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .response-col {
    max-width: 400px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
  }

  .response-error {
    color: var(--status-critical);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .response-data {
    color: var(--status-nominal);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .response-empty {
    color: var(--text-muted);
  }

  .clickable {
    cursor: pointer;
    transition: color 0.15s;
  }

  .clickable:hover .method-name {
    color: var(--accent);
    text-decoration: underline;
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--status-nominal);
    color: var(--status-nominal);
    padding: 0.75rem 1.5rem;
    border-radius: 2px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 136, 0.1);
    z-index: 1000;
    animation: toastIn 0.3s ease-out;
  }

  .toast-icon {
    font-size: 1rem;
  }

  .toast-message {
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .station-header {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
