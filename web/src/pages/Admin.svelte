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
      error = 'Authorization code required';
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
      error = e instanceof Error ? e.message : 'Failed to initiate test sequence';
    }
  }
</script>

<div class="admin-page">
  <div class="page-header">
    <h2 class="section-title">Mission Control</h2>
    <div class="system-status" class:active={isRunning}>
      <span class="status-dot" class:active={isRunning}></span>
      <span class="status-text">{isRunning ? 'SEQUENCE ACTIVE' : 'STANDBY'}</span>
    </div>
  </div>

  <div class="control-panel tactical-panel">
    <div class="corner-bl"></div>
    <div class="corner-br"></div>

    <div class="panel-header">
      <span class="panel-title">Test Sequence Control</span>
    </div>

    <div class="auth-section">
      <label class="auth-label">
        <span class="label-text">Authorization Code</span>
        <div class="auth-input-wrapper">
          <span class="auth-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            type="password"
            bind:value={password}
            placeholder="Enter authorization code"
            disabled={isRunning}
          />
        </div>
      </label>
    </div>

    <button
      class="launch-btn"
      class:active={isRunning}
      on:click={handleStartTests}
      disabled={isRunning}
    >
      <span class="btn-icon">
        {#if isRunning}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        {/if}
      </span>
      <span class="btn-text">{isRunning ? 'Sequence Running...' : 'Launch Test Sequence'}</span>
    </button>

    {#if error}
      <div class="error-message">
        <span class="error-icon">!</span>
        <span class="error-text">{error}</span>
      </div>
    {/if}
  </div>

  {#if isRunning && globalTotal > 0}
    <div class="progress-panel tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>

      <div class="panel-header">
        <span class="panel-title">Global Progress</span>
        <span class="progress-percentage">{globalPercentage}%</span>
      </div>

      <div class="progress-gauge">
        <div class="gauge-track">
          <div class="gauge-fill" style="width: {globalPercentage}%">
            <div class="gauge-shimmer"></div>
          </div>
        </div>
        <div class="gauge-segments">
          {#each Array(10) as _, i}
            <div class="segment" class:filled={globalPercentage > i * 10}></div>
          {/each}
        </div>
      </div>

      <div class="progress-stats">
        <span class="stat">
          <span class="stat-value">{globalCompleted}</span>
          <span class="stat-label">Completed</span>
        </span>
        <span class="stat-divider">/</span>
        <span class="stat">
          <span class="stat-value">{globalTotal}</span>
          <span class="stat-label">Total</span>
        </span>
      </div>
    </div>
  {/if}

  {#if isRunning && progress}
    <div class="current-panel tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>

      <div class="panel-header">
        <span class="panel-title">Current Operation</span>
      </div>

      <div class="current-info">
        <div class="info-item">
          <span class="info-label">Endpoint</span>
          <span class="info-value">{progress.endpoint}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Category</span>
          <span class="info-value category">{progress.category}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Progress</span>
          <span class="info-value mono">{progress.completed}/{progress.total}</span>
        </div>
      </div>
    </div>
  {/if}

  {#if progressLog.length > 0}
    <div class="log-panel tactical-panel">
      <div class="corner-bl"></div>
      <div class="corner-br"></div>

      <div class="panel-header">
        <span class="panel-title">Activity Log</span>
        <span class="log-count">{progressLog.length} entries</span>
      </div>

      <div class="log-container">
        {#each progressLog as event, i}
          <div class="log-entry {event.status}" style="animation-delay: {i * 10}ms">
            <span class="log-dot {event.status}"></span>
            <span class="log-method">{event.method}</span>
            <span class="log-status">{event.status.toUpperCase()}</span>
            {#if event.responseMs}
              <span class="log-time">{event.responseMs}ms</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-page {
    max-width: 900px;
    animation: fadeInUp 0.3s ease-out;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
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

  .system-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .system-status.active {
    border-color: var(--status-nominal);
    color: var(--status-nominal);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--status-inactive);
  }

  .status-dot.active {
    background-color: var(--status-nominal);
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .control-panel,
  .progress-panel,
  .current-panel,
  .log-panel {
    position: relative;
    padding: 1.5rem;
    margin-bottom: 1rem;
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

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .auth-section {
    margin-bottom: 1.5rem;
  }

  .auth-label {
    display: block;
  }

  .label-text {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
    display: block;
    margin-bottom: 0.5rem;
  }

  .auth-input-wrapper {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    max-width: 400px;
  }

  .auth-icon {
    padding: 0.5rem 0 0.5rem 0.75rem;
    color: var(--accent);
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-icon svg {
    width: 16px;
    height: 16px;
  }

  .auth-input-wrapper input {
    border: none;
    background: transparent;
    flex: 1;
    padding: 0.5rem;
    padding-left: 0.5rem;
  }

  .auth-input-wrapper input:focus {
    box-shadow: none;
  }

  .launch-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
    padding: 1rem 1.5rem;
    background-color: var(--status-nominal);
    border: 1px solid var(--status-nominal);
    color: var(--bg-void);
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .launch-btn:hover:not(:disabled) {
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
  }

  .launch-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .launch-btn.active {
    background-color: var(--status-warning);
    border-color: var(--status-warning);
  }

  .btn-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon svg {
    width: 16px;
    height: 16px;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(255, 51, 102, 0.1);
    border: 1px solid var(--status-critical);
    border-radius: 2px;
    max-width: 400px;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--status-critical);
    color: white;
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .error-text {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--status-critical);
  }

  .progress-percentage {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent);
  }

  .progress-gauge {
    position: relative;
    margin-bottom: 1rem;
  }

  .gauge-track {
    height: 8px;
    background-color: var(--bg-secondary);
    border-radius: 2px;
    overflow: hidden;
  }

  .gauge-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--status-nominal));
    border-radius: 2px;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .gauge-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  .gauge-segments {
    display: flex;
    gap: 2px;
    margin-top: 4px;
  }

  .segment {
    flex: 1;
    height: 3px;
    background-color: var(--border);
    border-radius: 1px;
    transition: background-color 0.2s;
  }

  .segment.filled {
    background-color: var(--accent);
  }

  .progress-stats {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    justify-content: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .stat-label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .stat-divider {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--text-muted);
    padding: 0 0.5rem;
  }

  .current-info {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-family: var(--font-display);
    font-size: 0.625rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .info-value {
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .info-value.category {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
  }

  .info-value.mono {
    font-family: var(--font-mono);
  }

  .log-count {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .log-container {
    max-height: 300px;
    overflow-y: auto;
  }

  .log-entry {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    animation: fadeInUp 0.2s ease-out both;
  }

  .log-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .log-dot.pass {
    background-color: var(--status-nominal);
    box-shadow: 0 0 4px rgba(0, 255, 136, 0.6);
  }

  .log-dot.fail {
    background-color: var(--status-critical);
    box-shadow: 0 0 4px rgba(255, 51, 102, 0.6);
  }

  .log-dot.timeout {
    background-color: var(--status-warning);
    box-shadow: 0 0 4px rgba(255, 193, 7, 0.6);
  }

  .log-dot.unsupported {
    background-color: var(--status-inactive);
  }

  .log-method {
    flex: 1;
    color: var(--text-primary);
  }

  .log-status {
    width: 90px;
    text-align: right;
  }

  .log-entry.pass .log-status { color: var(--status-nominal); }
  .log-entry.fail .log-status { color: var(--status-critical); }
  .log-entry.timeout .log-status { color: var(--status-warning); }
  .log-entry.unsupported .log-status { color: var(--text-muted); }

  .log-time {
    width: 70px;
    text-align: right;
    color: var(--text-secondary);
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

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
