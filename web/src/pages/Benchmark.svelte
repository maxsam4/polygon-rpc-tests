<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    benchmarkState,
    sortedEndpoints,
    initializeEndpoints,
    startBenchmark,
    stopBenchmark,
    addTemporaryEndpoint,
    removeTemporaryEndpoint,
    updatePollingInterval,
    resetBenchmark,
  } from '../stores/benchmark';
  import BenchmarkChart from '../components/BenchmarkChart.svelte';

  import type { BenchmarkEndpointData } from '../../../shared/types';

  let loading = true;
  let error: string | null = null;
  let newEndpointUrl = '';
  let newEndpointName = '';
  let intervalInput = 1000;

  type SortColumn = 'name' | 'block' | 'min' | 'p50' | 'p95' | 'max' | 'reliability';
  let sortColumn: SortColumn = 'p50';
  let sortDirection: 'asc' | 'desc' = 'asc';

  async function loadConfig() {
    try {
      const res = await fetch('/api/benchmark/endpoints');
      if (!res.ok) throw new Error('Failed to fetch endpoints');

      const data = await res.json();
      initializeEndpoints(data.endpoints);
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load endpoints';
      loading = false;
    }
  }

  function handleStart() {
    startBenchmark();
  }

  function handleStop() {
    stopBenchmark();
  }

  function handleReset() {
    resetBenchmark();
    loadConfig();
  }

  function handleAddEndpoint() {
    if (!newEndpointUrl || !newEndpointName) return;

    const success = addTemporaryEndpoint(newEndpointUrl, newEndpointName);
    if (success) {
      newEndpointUrl = '';
      newEndpointName = '';
    } else {
      alert('Endpoint already exists');
    }
  }

  function handleRemoveEndpoint(id: string) {
    removeTemporaryEndpoint(id);
  }

  function handleIntervalChange() {
    if (intervalInput >= 100) {
      updatePollingInterval(intervalInput);
    }
  }

  function formatBlockNumber(num: number | null): string {
    if (num === null) return '-';
    return num.toLocaleString();
  }

  function formatResponseTime(ms: number | null): string {
    if (ms === null) return '-';
    return `${ms}ms`;
  }

  function getReliability(endpoint: { totalCalls: number; successfulCalls: number }): string {
    if (endpoint.totalCalls === 0) return '-';
    const pct = (endpoint.successfulCalls / endpoint.totalCalls) * 100;
    return `${pct.toFixed(1)}%`;
  }

  interface ResponseTimeStats {
    min: number | null;
    max: number | null;
    p50: number | null;
    p95: number | null;
  }

  function getResponseTimeStats(history: { responseMs: number | null; success: boolean }[]): ResponseTimeStats {
    const times = history
      .filter(p => p.success && p.responseMs !== null)
      .map(p => p.responseMs as number)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return { min: null, max: null, p50: null, p95: null };
    }

    const percentile = (arr: number[], p: number): number => {
      const idx = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, idx)];
    };

    return {
      min: times[0],
      max: times[times.length - 1],
      p50: percentile(times, 50),
      p95: percentile(times, 95),
    };
  }

  function getReliabilityValue(endpoint: BenchmarkEndpointData): number {
    if (endpoint.totalCalls === 0) return 0;
    return endpoint.successfulCalls / endpoint.totalCalls;
  }

  function getSortValue(endpoint: BenchmarkEndpointData, column: SortColumn): number | string {
    const stats = getResponseTimeStats(endpoint.history);
    const latest = endpoint.history.at(-1);
    switch (column) {
      case 'name': return endpoint.name.toLowerCase();
      case 'block': return latest?.blockNumber ?? -Infinity;
      case 'min': return stats.min ?? Infinity;
      case 'p50': return stats.p50 ?? Infinity;
      case 'p95': return stats.p95 ?? Infinity;
      case 'max': return stats.max ?? Infinity;
      case 'reliability': return getReliabilityValue(endpoint);
    }
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      // Default directions: name asc, block desc, times asc, reliability desc
      sortDirection = column === 'name' ? 'asc' : column === 'block' || column === 'reliability' ? 'desc' : 'asc';
    }
  }

  $: tableSortedEndpoints = [...$sortedEndpoints].sort((a, b) => {
    const aVal = getSortValue(a, sortColumn);
    const bVal = getSortValue(b, sortColumn);
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  onMount(() => {
    loadConfig();
  });

  onDestroy(() => {
    stopBenchmark();
  });
</script>

<div class="benchmark-page">
  <div class="header">
    <h2>RPC Benchmark</h2>
    <span class="status">
      {#if $benchmarkState.isRunning}
        <span class="running">Running</span>
      {:else}
        <span class="stopped">Stopped</span>
      {/if}
    </span>
  </div>

  {#if loading}
    <p class="loading">Loading endpoints...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="controls">
      <div class="control-row">
        <div class="control-group">
          {#if $benchmarkState.isRunning}
            <button class="btn-stop" on:click={handleStop}>Stop</button>
          {:else}
            <button class="btn-start" on:click={handleStart}>Start</button>
          {/if}
          <button class="btn-reset" on:click={handleReset}>Reset</button>
        </div>

        <div class="control-group">
          <label>
            Interval (ms):
            <input
              type="number"
              min="100"
              step="100"
              bind:value={intervalInput}
              on:change={handleIntervalChange}
            />
          </label>
        </div>
      </div>

      <div class="add-endpoint">
        <input
          type="text"
          placeholder="RPC URL"
          bind:value={newEndpointUrl}
        />
        <input
          type="text"
          placeholder="Name"
          bind:value={newEndpointName}
        />
        <button on:click={handleAddEndpoint}>Add Endpoint</button>
      </div>
    </div>

    <div class="charts">
      <div class="chart">
        <BenchmarkChart
          endpoints={$sortedEndpoints}
          dataKey="blockNumber"
          title="Block Number"
          yAxisLabel="Block"
        />
      </div>
      <div class="chart">
        <BenchmarkChart
          endpoints={$sortedEndpoints}
          dataKey="responseMs"
          title="Response Time"
          yAxisLabel="ms"
        />
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="name-col sortable" on:click={() => handleSort('name')}>
              Endpoint {sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="url-col">URL</th>
            <th class="block-col sortable" on:click={() => handleSort('block')}>
              Latest Block {sortColumn === 'block' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="time-col sortable" on:click={() => handleSort('min')}>
              Min {sortColumn === 'min' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="time-col sortable" on:click={() => handleSort('p50')}>
              P50 {sortColumn === 'p50' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="time-col sortable" on:click={() => handleSort('p95')}>
              P95 {sortColumn === 'p95' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="time-col sortable" on:click={() => handleSort('max')}>
              Max {sortColumn === 'max' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="reliability-col sortable" on:click={() => handleSort('reliability')}>
              Reliability {sortColumn === 'reliability' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each tableSortedEndpoints as endpoint}
            {@const latest = endpoint.history.at(-1)}
            {@const stats = getResponseTimeStats(endpoint.history)}
            <tr>
              <td class="name-col">{endpoint.name}</td>
              <td class="url-col">
                {#if endpoint.sensitive}
                  <span class="sensitive">[hidden]</span>
                {:else}
                  <span class="url">{endpoint.url}</span>
                {/if}
              </td>
              <td class="block-col">{formatBlockNumber(latest?.blockNumber ?? null)}</td>
              <td class="time-col">{formatResponseTime(stats.min)}</td>
              <td class="time-col">{formatResponseTime(stats.p50)}</td>
              <td class="time-col">{formatResponseTime(stats.p95)}</td>
              <td class="time-col">{formatResponseTime(stats.max)}</td>
              <td class="reliability-col">{getReliability(endpoint)}</td>
              <td class="actions-col">
                {#if endpoint.isTemporary}
                  <button class="btn-remove" on:click={() => handleRemoveEndpoint(endpoint.id)}>Remove</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .benchmark-page {
    padding: 1rem 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .status .running {
    color: var(--success);
    font-weight: 500;
  }

  .status .stopped {
    color: var(--text-secondary);
  }

  .controls {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .control-row {
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .control-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-group input[type="number"] {
    width: 100px;
  }

  .add-endpoint {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .add-endpoint input[type="text"]:first-child {
    width: 300px;
  }

  .add-endpoint input[type="text"]:nth-child(2) {
    width: 150px;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-start {
    background-color: var(--success);
    color: white;
  }

  .btn-stop {
    background-color: var(--error);
    color: white;
  }

  .btn-reset {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-remove {
    background-color: transparent;
    color: var(--error);
    border: 1px solid var(--error);
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .chart {
    background-color: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
  }

  .loading, .error {
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
    position: sticky;
    top: 0;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background-color: var(--bg-tertiary, #e0e0e0);
  }

  .name-col {
    min-width: 150px;
  }

  .url-col {
    min-width: 200px;
  }

  .url {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
    word-break: break-all;
  }

  .sensitive {
    color: var(--text-secondary);
    font-style: italic;
  }

  .block-col, .reliability-col {
    min-width: 100px;
    text-align: right;
    font-family: monospace;
  }

  .time-col {
    min-width: 70px;
    text-align: right;
    font-family: monospace;
  }

  .actions-col {
    min-width: 80px;
    text-align: center;
  }

  @media (max-width: 900px) {
    .charts {
      grid-template-columns: 1fr;
    }
  }
</style>
