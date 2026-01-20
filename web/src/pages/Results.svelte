<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { results, loading, error, endpointSummaries, categories, type EndpointSummary } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';
  import type { Category } from '../../../shared/types';

  let filter = '';

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

  $: filteredData = $endpointSummaries
    .filter(ep =>
      ep.name.toLowerCase().includes(filter.toLowerCase()) ||
      (!ep.sensitive && ep.url.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => getTotalSummary(b).passed - getTotalSummary(a).passed);

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
  <div class="header">
    <h2>RPC Endpoint Results</h2>
    {#if $results?.lastRun}
      <span class="last-run">Last run: {new Date($results.lastRun).toLocaleString()}</span>
    {/if}
  </div>

  <div class="controls">
    <input
      type="text"
      placeholder="Filter endpoints..."
      bind:value={filter}
    />
  </div>

  {#if $loading}
    <p class="loading">Loading results...</p>
  {:else if $error}
    <p class="error">{$error}</p>
  {:else if !$results?.lastRun}
    <p class="no-results">No test results yet. Go to Admin to run tests.</p>
  {:else}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="endpoint-col">Endpoint</th>
            <th class="total-col">Total</th>
            {#each categories as category}
              <th class="category-col">{category}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredData as endpoint}
            <tr on:click={() => handleRowClick(endpoint)} class="clickable">
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
  {/if}
</div>

<style>
  .results-page {
    padding: 1rem 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .last-run {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .controls {
    margin-bottom: 1rem;
  }

  .controls input {
    width: 300px;
  }

  .loading, .error, .no-results {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--error);
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
    background-color: var(--bg-secondary);
    font-weight: 600;
    text-transform: capitalize;
    position: sticky;
    top: 0;
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
    font-weight: 600;
  }

  .clickable {
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .clickable:hover {
    background-color: var(--bg-secondary);
  }

  .endpoint-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    font-weight: 500;
  }

  .meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .node-type {
    text-transform: capitalize;
  }

  .response-time {
    font-family: monospace;
  }
</style>
