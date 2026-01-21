<script lang="ts">
  export let status: 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped' | 'partial' | 'none';
  export let text: string = '';

  const statusConfig = {
    pass: { label: 'PASS', dotClass: 'nominal' },
    fail: { label: 'FAIL', dotClass: 'critical' },
    timeout: { label: 'TIMEOUT', dotClass: 'warning' },
    unsupported: { label: 'N/A', dotClass: 'inactive' },
    skipped: { label: 'SKIP', dotClass: 'inactive' },
    partial: { label: 'PARTIAL', dotClass: 'warning' },
    none: { label: '—', dotClass: 'inactive' },
  };

  $: config = statusConfig[status] || statusConfig.none;
</script>

<span class="badge {status}">
  <span class="status-dot {config.dotClass}" class:animate={status === 'pass' || status === 'partial'}></span>
  {#if text}
    <span class="text">{text}</span>
  {:else}
    <span class="label">{config.label}</span>
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    border: 1px solid transparent;
    background-color: transparent;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.nominal {
    background-color: var(--status-nominal);
    box-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
  }

  .status-dot.warning {
    background-color: var(--status-warning);
    box-shadow: 0 0 6px rgba(255, 193, 7, 0.6);
  }

  .status-dot.critical {
    background-color: var(--status-critical);
    box-shadow: 0 0 6px rgba(255, 51, 102, 0.6);
  }

  .status-dot.inactive {
    background-color: var(--status-inactive);
    box-shadow: none;
  }

  .status-dot.animate {
    animation: pulse 2s ease-in-out infinite;
  }

  .text {
    color: var(--text-primary);
  }

  .label {
    text-transform: uppercase;
  }

  /* Status-specific badge styling */
  .pass {
    border-color: rgba(0, 255, 136, 0.3);
    background-color: rgba(0, 255, 136, 0.08);
    color: var(--status-nominal);
  }

  .fail {
    border-color: rgba(255, 51, 102, 0.3);
    background-color: rgba(255, 51, 102, 0.08);
    color: var(--status-critical);
  }

  .timeout {
    border-color: rgba(255, 193, 7, 0.3);
    background-color: rgba(255, 193, 7, 0.08);
    color: var(--status-warning);
  }

  .unsupported {
    border-color: rgba(74, 85, 104, 0.3);
    background-color: rgba(74, 85, 104, 0.08);
    color: var(--text-muted);
  }

  .skipped {
    border-color: rgba(74, 85, 104, 0.2);
    background-color: rgba(74, 85, 104, 0.05);
    color: var(--text-muted);
  }

  .partial {
    border-color: rgba(255, 193, 7, 0.3);
    background-color: rgba(255, 193, 7, 0.08);
    color: var(--status-warning);
  }

  .none {
    border-color: transparent;
    background-color: transparent;
    color: var(--text-muted);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
