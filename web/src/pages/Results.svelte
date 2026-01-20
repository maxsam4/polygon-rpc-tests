<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { results, loading, error, endpointSummaries, categories } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';

  let filter = '';

  $: filteredData = $endpointSummaries.filter(ep =>
    ep.name.toLowerCase().includes(filter.toLowerCase()) ||
    ep.url.toLowerCase().includes(filter.toLowerCase())
  );

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
                  <span class="node-type">{endpoint.nodeType}</span>
                </div>
              </td>
              {#each categories as category}
                <td class="category-col">
                  {@const summary = endpoint.categorySummaries[category]}
                  <StatusBadge
                    status={summary.status}
                    text={summary.total > 0 ? `${summary.passed}/${summary.total}` : ''}
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

  .node-type {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: capitalize;
  }
</style>
