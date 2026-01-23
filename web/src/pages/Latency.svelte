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
      // Filter endpoints by showInBenchmark (default to true if not specified)
      const benchmarkEndpoints = (data.endpoints || []).filter((ep: any) => ep.showInBenchmark !== false);
      initializeEndpoints(benchmarkEndpoints);
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
      sortDirection = column === 'name' ? 'asc' : column === 'block' || column === 'reliability' ? 'desc' : 'asc';
    }
  }

  function getSortIndicator(column: SortColumn): string {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
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
  <div class="page-header">
    <div class="header-left">
      <h2 class="section-title">Real-Time Benchmark</h2>
      <div class="status-indicator" class:running={$benchmarkState.isRunning}>
        <span class="status-dot" class:active={$benchmarkState.isRunning}></span>
        <span class="status-text">{$benchmarkState.isRunning ? 'ACTIVE' : 'STANDBY'}</span>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="status-message">
      <div class="loading-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Loading endpoints...</p>
    </div>
  {:else if error}
    <div class="status-message error">
      <p>{error}</p>
    </div>
  {:else}
    <div class="controls-panel tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="controls-content">
        <div class="control-row">
          <div class="control-group buttons">
            {#if $benchmarkState.isRunning}
              <button class="btn-stop danger" on:click={handleStop}>
                <span class="btn-icon">■</span>
                Stop
              </button>
            {:else}
              <button class="btn-start success" on:click={handleStart}>
                <span class="btn-icon">▶</span>
                Start
              </button>
            {/if}
            <button class="btn-reset" on:click={handleReset}>Reset</button>
          </div>

          <div class="control-group interval">
            <label>
              <span class="label-text">Interval</span>
              <div class="input-with-suffix">
                <input
                  type="number"
                  min="100"
                  step="100"
                  bind:value={intervalInput}
                  on:change={handleIntervalChange}
                />
                <span class="suffix">ms</span>
              </div>
            </label>
          </div>
        </div>

        <div class="add-endpoint-row">
          <span class="row-label">Add Endpoint</span>
          <div class="terminal-input url-input">
            <input
              type="text"
              placeholder="https://rpc.example.com"
              bind:value={newEndpointUrl}
            />
          </div>
          <input
            type="text"
            placeholder="Name"
            class="name-input"
            bind:value={newEndpointName}
          />
          <button on:click={handleAddEndpoint}>Add</button>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-panel tactical-panel">
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="chart-header">
          <span class="chart-title">Block Number</span>
        </div>
        <BenchmarkChart
          endpoints={$sortedEndpoints}
          dataKey="blockNumber"
          title=""
          yAxisLabel="Block"
        />
      </div>
      <div class="chart-panel tactical-panel">
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="chart-header">
          <span class="chart-title">Response Time</span>
        </div>
        <BenchmarkChart
          endpoints={$sortedEndpoints}
          dataKey="responseMs"
          title=""
          yAxisLabel="ms"
        />
      </div>
    </div>

    <div class="table-wrapper tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="name-col sortable" on:click={() => handleSort('name')}>
                Endpoint{getSortIndicator('name')}
              </th>
              <th class="url-col">URL</th>
              <th class="block-col sortable" on:click={() => handleSort('block')}>
                Block{getSortIndicator('block')}
              </th>
              <th class="time-col sortable" on:click={() => handleSort('min')}>
                Min{getSortIndicator('min')}
              </th>
              <th class="time-col sortable" on:click={() => handleSort('p50')}>
                P50{getSortIndicator('p50')}
              </th>
              <th class="time-col sortable" on:click={() => handleSort('p95')}>
                P95{getSortIndicator('p95')}
              </th>
              <th class="time-col sortable" on:click={() => handleSort('max')}>
                Max{getSortIndicator('max')}
              </th>
              <th class="reliability-col sortable" on:click={() => handleSort('reliability')}>
                Reliability{getSortIndicator('reliability')}
              </th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each tableSortedEndpoints as endpoint, i}
              {@const latest = endpoint.history.at(-1)}
              {@const stats = getResponseTimeStats(endpoint.history)}
              <tr style="animation-delay: {i * 20}ms">
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
    </div>
  {/if}
</div>

<style>
  .benchmark-page {
    animation: fadeInUp 0.3s ease-out;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
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

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .status-indicator.running {
    border-color: var(--status-nominal);
    color: var(--status-nominal);
  }

  .status-indicator .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--status-inactive);
  }

  .status-indicator .status-dot.active {
    background-color: var(--status-nominal);
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
    animation: pulse 1.5s ease-in-out infinite;
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

  .controls-panel {
    position: relative;
    margin-bottom: 1.5rem;
    padding: 1rem;
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

  .controls-content {
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

  .control-group.buttons button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-icon {
    font-size: 0.625rem;
  }

  .control-group label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .label-text {
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .input-with-suffix {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
  }

  .input-with-suffix input {
    width: 80px;
    border: none;
    background: transparent;
    text-align: right;
    padding-right: 0.25rem;
  }

  .input-with-suffix input:focus {
    box-shadow: none;
  }

  .input-with-suffix .suffix {
    padding: 0.5rem 0.5rem 0.5rem 0;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .add-endpoint-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .row-label {
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .terminal-input {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
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
    padding: 0.5rem;
    padding-left: 0.5rem;
  }

  .terminal-input input:focus {
    box-shadow: none;
  }

  .url-input {
    flex: 1;
    min-width: 250px;
  }

  .name-input {
    width: 150px;
  }

  .btn-stop, .btn-start {
    font-weight: 600;
  }

  .btn-reset {
    background-color: transparent;
    border-color: var(--border);
  }

  .btn-remove {
    background-color: transparent;
    color: var(--status-critical);
    border-color: var(--status-critical);
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .btn-remove:hover {
    background-color: rgba(255, 51, 102, 0.1);
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .chart-panel {
    position: relative;
    padding: 1rem;
  }

  .chart-header {
    margin-bottom: 0.5rem;
  }

  .chart-title {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
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

  tbody tr {
    animation: fadeInUp 0.3s ease-out both;
  }

  .name-col {
    min-width: 150px;
    font-weight: 500;
  }

  .url-col {
    min-width: 200px;
  }

  .url {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-secondary);
    word-break: break-all;
  }

  .sensitive {
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.75rem;
  }

  .block-col, .reliability-col {
    min-width: 100px;
    text-align: right;
    font-family: var(--font-mono);
  }

  .time-col {
    min-width: 70px;
    text-align: right;
    font-family: var(--font-mono);
  }

  .actions-col {
    min-width: 80px;
    text-align: center;
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
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 900px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
