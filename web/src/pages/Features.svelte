<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { results, loading, error, endpointSummaries, categories, type EndpointSummary } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';
  import type { Category } from '../../../shared/types';

  let filter = '';
  let sortColumn: 'name' | 'total' | 'responseTime' | Category = 'total';
  let sortDirection: 'asc' | 'desc' = 'desc';

  function getCategorySummary(endpoint: EndpointSummary, category: Category) {
    return endpoint.categorySummaries[category];
  }

  function getTotalSummary(endpoint: EndpointSummary): { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none'; text: string } {
    let passed = 0;
    let total = 0;
    for (const category of categories) {
      const summary = endpoint.categorySummaries[category];
      if (summary) {
        passed += summary.passed;
        total += summary.total;
      }
    }
    let status: 'pass' | 'partial' | 'fail' | 'none' = 'none';
    if (total > 0) {
      if (passed === total) status = 'pass';
      else if (passed > 0) status = 'partial';
      else status = 'fail';
    }
    return { passed, total, status, text: total > 0 ? `${passed}/${total}` : '' };
  }

  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = column === 'name' ? 'asc' : 'desc';
    }
  }

  function getSortValue(endpoint: EndpointSummary, column: typeof sortColumn): number | string {
    if (column === 'name') return endpoint.name.toLowerCase();
    if (column === 'total') return getTotalSummary(endpoint).passed;
    if (column === 'responseTime') return endpoint.medianResponseMs || Infinity;
    return getCategorySummary(endpoint, column)?.passed ?? 0;
  }

  function getSortIndicator(column: typeof sortColumn): string {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  }

  $: filteredData = $endpointSummaries
    .filter(ep =>
      ep.name.toLowerCase().includes(filter.toLowerCase()) ||
      (!ep.sensitive && ep.url.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = getSortValue(a, sortColumn);
      const bVal = getSortValue(b, sortColumn);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  onMount(async () => {
    $loading = true;
    try {
      $results = await fetchResults();
    } catch (e) {
      $error = e instanceof Error ? e.message : 'Failed to load results';
    } finally {
      $loading = false;
    }
  });

  function handleRowClick(endpoint: EndpointSummary) {
    push(`/endpoint/${endpoint.id}`);
  }
</script>

<div class="results-page">
  <div class="page-header">
    <div class="header-left">
      <h2 class="section-title">RPC provider endpoint support summary</h2>
      {#if $results?.lastRun}
        <span class="timestamp">
          <span class="label">Last Scan:</span>
          <span class="value">{new Date($results.lastRun).toLocaleString()}</span>
        </span>
      {/if}
    </div>
    <div class="endpoint-count">
      <span class="count-value">{filteredData.length}</span>
      <span class="count-label">Endpoints</span>
    </div>
  </div>

  <div class="disclaimer tactical-panel">
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="disclaimer-icon">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 4.5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
      </svg>
    </div>
    <div class="disclaimer-content">
      <p class="disclaimer-item">
        <span class="bullet">›</span>
        <span class="text">Results reflect free/public endpoint capabilities only. Many providers offer enhanced features and higher rate limits in their paid tiers.</span>
      </p>
      <p class="disclaimer-item">
        <span class="bullet">›</span>
        <span class="text">Tests execute upto one request per second per endpoint. Some failures may indicate rate limiting rather than missing functionality.</span>
      </p>
    </div>
  </div>

  <div class="controls">
    <div class="terminal-input">
      <input
        type="text"
        placeholder="Filter endpoints..."
        bind:value={filter}
      />
    </div>
  </div>

  {#if $loading}
    <div class="status-message">
      <div class="loading-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Loading results...</p>
    </div>
  {:else if $error}
    <div class="status-message error">
      <p>{$error}</p>
    </div>
  {:else if !$results?.lastRun}
    <div class="status-message">
      <p>No test results available. Navigate to Admin to run tests.</p>
    </div>
  {:else}
    <div class="table-wrapper tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="endpoint-col sortable" on:click={() => handleSort('name')}>
                Endpoint{getSortIndicator('name')}
              </th>
              <th class="total-col sortable" on:click={() => handleSort('total')}>
                Total{getSortIndicator('total')}
              </th>
              {#each categories as category}
                <th class="category-col sortable" on:click={() => handleSort(category)}>
                  {category}{getSortIndicator(category)}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each filteredData as endpoint, i}
              <tr
                on:click={() => handleRowClick(endpoint)}
                class="clickable"
                style="animation-delay: {i * 20}ms"
              >
                <td class="endpoint-col">
                  <div class="endpoint-info">
                    <span class="name">{endpoint.name}</span>
                    <span class="meta">
                      <span class="node-type">{endpoint.nodeType}</span>
                      {#if endpoint.medianResponseMs > 0}
                        <span class="response-time">p50: {endpoint.medianResponseMs}ms</span>
                      {/if}
                    </span>
                  </div>
                </td>
                <td class="total-col">
                  <StatusBadge
                    status={getTotalSummary(endpoint).status}
                    text={getTotalSummary(endpoint).text}
                  />
                </td>
                {#each categories as category}
                  <td class="category-col">
                    <StatusBadge
                      status={getCategorySummary(endpoint, category).status}
                      text={getCategorySummary(endpoint, category).total > 0 ? `${getCategorySummary(endpoint, category).passed}/${getCategorySummary(endpoint, category).total}` : ''}
                    />
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .results-page {
    animation: fadeInUp 0.3s ease-out;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-title::before {
    content: '//';
    color: var(--text-muted);
  }

  .timestamp {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    gap: 0.5rem;
  }

  .timestamp .label {
    color: var(--text-muted);
  }

  .endpoint-count {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 0.5rem 1rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
  }

  .count-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
    line-height: 1;
  }

  .count-label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .disclaimer {
    margin-bottom: 1.5rem;
    padding: 1rem 1.25rem;
    background-color: rgba(0, 180, 216, 0.03);
    border: 1px solid rgba(0, 180, 216, 0.2);
    border-radius: 2px;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    position: relative;
  }

  .disclaimer-icon {
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 0.125rem;
    opacity: 0.8;
  }

  .disclaimer-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .disclaimer-item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    margin: 0;
    line-height: 1.5;
  }

  .disclaimer-item .bullet {
    color: var(--accent);
    font-family: var(--font-mono);
    font-weight: 700;
    flex-shrink: 0;
  }

  .disclaimer-item .text {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .corner-tl,
  .corner-tr {
    position: absolute;
    width: 8px;
    height: 8px;
    border-style: solid;
    border-color: var(--accent);
  }

  .corner-tl {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
  }

  .corner-tr {
    top: -1px;
    right: -1px;
    border-width: 2px 2px 0 0;
  }

  .controls {
    margin-bottom: 1rem;
  }

  .terminal-input {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    max-width: 400px;
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

  .table-wrapper {
    position: relative;
    padding: 1px;
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
    white-space: nowrap;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: color 0.2s;
  }

  th.sortable:hover {
    color: var(--accent);
  }

  .endpoint-col {
    min-width: 200px;
  }

  .category-col {
    min-width: 80px;
    text-align: center;
  }

  .total-col {
    min-width: 90px;
    text-align: center;
  }

  .clickable {
    cursor: pointer;
    transition: background-color 0.15s;
    animation: fadeInUp 0.3s ease-out both;
  }

  .clickable:hover {
    background-color: rgba(0, 180, 216, 0.08);
  }

  .endpoint-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.7rem;
    color: var(--text-secondary);
  }

  .node-type {
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .response-time {
    font-family: var(--font-mono);
    color: var(--text-muted);
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

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  @media (max-width: 900px) {
    .page-header {
      flex-direction: column;
    }

    .endpoint-count {
      align-items: flex-start;
    }
  }
</style>
