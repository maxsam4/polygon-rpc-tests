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
  import type { Config } from '../../../shared/types';

  let loading = true;
  let error: string | null = null;
  let newEndpointUrl = '';
  let newEndpointName = '';
  let intervalInput = 1000;

  async function loadConfig() {
    try {
      const res = await fetch('/api/results');
      if (!res.ok) throw new Error('Failed to fetch config');

      // Fetch config from results endpoint to get endpoint list
      const configRes = await fetch('/api/config', {
        headers: { Authorization: 'Bearer ' },
      });

      // If config fetch fails (no auth), try to get endpoints from results
      if (!configRes.ok) {
        // Fallback: use hardcoded default endpoints
        const defaultEndpoints = [
          { url: 'https://polygon.drpc.org', name: 'dRPC public', showInBenchmark: true },
          { url: 'https://polygon-bor-rpc.publicnode.com', name: 'PublicNode', showInBenchmark: true },
          { url: 'https://polygon-rpc.com', name: 'Polygon-RPC', showInBenchmark: true },
          { url: 'https://polygon.gateway.tenderly.co', name: 'Tenderly', showInBenchmark: true },
          { url: 'https://polygon.lava.build', name: 'Lava', showInBenchmark: true },
          { url: 'https://api.zan.top/polygon-mainnet', name: 'ZAN', showInBenchmark: true },
          { url: 'https://polygon-public.nodies.app', name: 'Nodies', showInBenchmark: true },
          { url: 'https://1rpc.io/matic', name: '1RPC', showInBenchmark: true },
          { url: 'https://polygon.rpc.subquery.network/public', name: 'SubQuery', showInBenchmark: true },
          { url: 'https://rpc-mainnet.matic.quiknode.pro', name: 'QuikNode', showInBenchmark: true },
          { url: 'https://polygon-mainnet.gateway.tatum.io', name: 'Tatum', showInBenchmark: true },
          { url: 'https://endpoints.omniatech.io/v1/matic/mainnet/public', name: 'Omnia', showInBenchmark: true },
          { url: 'https://poly.api.pocket.network', name: 'Pocket Network', showInBenchmark: true },
        ];
        initializeEndpoints(defaultEndpoints);
      } else {
        const config: Config = await configRes.json();
        initializeEndpoints(config.endpoints);
      }

      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load config';
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
            <th class="name-col">Endpoint</th>
            <th class="url-col">URL</th>
            <th class="block-col">Latest Block</th>
            <th class="time-col">Response Time</th>
            <th class="reliability-col">Reliability</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $sortedEndpoints as endpoint}
            {@const latest = endpoint.history.at(-1)}
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
              <td class="time-col">{formatResponseTime(latest?.responseMs ?? null)}</td>
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

  .name-col {
    min-width: 150px;
  }

  .url-col {
    min-width: 250px;
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

  .block-col, .time-col, .reliability-col {
    min-width: 100px;
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
