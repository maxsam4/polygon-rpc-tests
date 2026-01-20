<script lang="ts">
  export let status: 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped' | 'partial' | 'none';
  export let text: string = '';
</script>

<span class="badge {status}">
  {#if status === 'pass'}✅{:else if status === 'fail'}❌{:else if status === 'timeout'}⚠️{:else if status === 'unsupported'}🚫{:else if status === 'skipped'}⏭️{:else if status === 'partial'}🟡{:else}—{/if}
  {#if text}<span class="text">{text}</span>{/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .text {
    font-family: monospace;
  }

  .pass { background-color: rgba(74, 222, 128, 0.2); }
  .fail { background-color: rgba(239, 68, 68, 0.2); }
  .timeout { background-color: rgba(251, 191, 36, 0.2); }
  .unsupported { background-color: rgba(107, 114, 128, 0.2); }
  .skipped { background-color: rgba(107, 114, 128, 0.1); }
  .partial { background-color: rgba(251, 191, 36, 0.2); }
  .none { background-color: rgba(107, 114, 128, 0.1); }
</style>
