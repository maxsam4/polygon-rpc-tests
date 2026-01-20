<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fetchTestStatus, startTestRun, subscribeToProgress } from '../lib/api';
  import type { ProgressEvent } from '../../../shared/types';

  let password = '';
  let isRunning = false;
  let progress: ProgressEvent | null = null;
  let progressLog: ProgressEvent[] = [];
  let error: string | null = null;
  let unsubscribe: (() => void) | null = null;
  let globalCompleted = 0;
  let globalTotal = 0;
  $: globalPercentage = globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0;

  onMount(async () => {
    // Check initial status
    try {
      const status = await fetchTestStatus();
      isRunning = status.running;
      progress = status.progress;
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }

    // Subscribe to progress updates
    unsubscribe = subscribeToProgress(
      (event) => {
        if (event.type === 'complete') {
          isRunning = false;
          progress = null;
          globalCompleted = 0;
          globalTotal = 0;
        } else if (event.type === 'error') {
          isRunning = false;
          error = event.error || 'Test run failed';
        } else if (event.type === 'progress') {
          progress = event;
          if (event.globalCompleted !== undefined) globalCompleted = event.globalCompleted;
          if (event.globalTotal !== undefined) globalTotal = event.globalTotal;
        } else if (event.type === 'result') {
          progressLog = [...progressLog.slice(-99), event];
          if (event.globalCompleted !== undefined) globalCompleted = event.globalCompleted;
          if (event.globalTotal !== undefined) globalTotal = event.globalTotal;
        }
      },
      (err) => {
        console.error('SSE error:', err);
      }
    );
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  async function handleStartTests() {
    if (!password) {
      error = 'Please enter the admin password';
      return;
    }

    error = null;
    progressLog = [];
    globalCompleted = 0;
    globalTotal = 0;

    try {
      await startTestRun(password);
      isRunning = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to start tests';
    }
  }
</script>

<div class="admin-page">
  <h2>Admin Panel</h2>

  <div class="section">
    <h3>Run Tests</h3>

    <div class="password-input">
      <label for="password">Admin Password:</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="Enter password"
      />
    </div>

    <button
      class="primary"
      on:click={handleStartTests}
      disabled={isRunning}
    >
      {isRunning ? 'Tests Running...' : 'Start Test Run'}
    </button>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  {#if isRunning && globalTotal > 0}
    <div class="section">
      <h3>Overall Progress</h3>
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {globalPercentage}%"></div>
        </div>
        <div class="progress-stats">{globalCompleted} / {globalTotal} ({globalPercentage}%)</div>
      </div>
    </div>
  {/if}

  {#if isRunning && progress}
    <div class="section">
      <h3>Current Progress</h3>
      <div class="progress-info">
        <span>Endpoint: <strong>{progress.endpoint}</strong></span>
        <span>Category: <strong>{progress.category}</strong></span>
        <span>Progress: <strong>{progress.completed}/{progress.total}</strong></span>
      </div>
    </div>
  {/if}

  {#if progressLog.length > 0}
    <div class="section">
      <h3>Recent Results</h3>
      <div class="log">
        {#each progressLog as event}
          <div class="log-entry {event.status}">
            <span class="method">{event.method}</span>
            <span class="status">{event.status}</span>
            {#if event.responseMs}
              <span class="time">{event.responseMs}ms</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-page {
    padding: 1rem 0;
    max-width: 800px;
  }

  h2 {
    margin-bottom: 1.5rem;
  }

  .section {
    background-color: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .section h3 {
    margin-bottom: 1rem;
  }

  .password-input {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .password-input input {
    flex: 1;
    max-width: 300px;
  }

  .error {
    color: var(--error);
    margin-top: 1rem;
  }

  .progress-info {
    display: flex;
    gap: 2rem;
  }

  .progress-bar-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar {
    height: 20px;
    background-color: var(--bg-primary);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--success);
    transition: width 0.3s ease;
  }

  .progress-stats {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .log {
    max-height: 300px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.75rem;
  }

  .log-entry {
    display: flex;
    gap: 1rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--border);
  }

  .log-entry.pass { color: var(--success); }
  .log-entry.fail { color: var(--error); }
  .log-entry.timeout { color: var(--warning); }
  .log-entry.unsupported { color: var(--text-secondary); }

  .method {
    flex: 1;
  }

  .status {
    width: 100px;
  }

  .time {
    width: 80px;
    text-align: right;
  }
</style>
