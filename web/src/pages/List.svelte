<script lang="ts">
  import { onMount } from 'svelte';
  import type { Endpoint } from '../../../shared/types';

  let providers: Endpoint[] = [];
  let loading = true;
  let error: string | null = null;
  let searchQuery = '';
  let copiedUrl: string | null = null;

  async function loadProviders() {
    try {
      const res = await fetch('/api/benchmark/endpoints');
      if (!res.ok) throw new Error('Failed to fetch providers');

      const data = await res.json();
      providers = data.endpoints || [];
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load providers';
      loading = false;
    }
  }

  function extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  function getProviderInitials(name: string): string {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function getProviderColor(name: string): string {
    // Generate consistent color based on name
    const colors = [
      '#00b4d8', '#00ff88', '#ff3366', '#ffc107',
      '#48cae4', '#a855f7', '#14b8a6', '#f97316'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      copiedUrl = url;
      setTimeout(() => {
        copiedUrl = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function navigateToWebsite(url: string, e: MouseEvent) {
    e.preventDefault();
    const domain = extractDomain(url);
    window.open(`https://${domain}`, '_blank', 'noopener,noreferrer');
  }

  $: filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: providerCount = filteredProviders.length;

  onMount(() => {
    loadProviders();
  });
</script>

<div class="list-page">
  <div class="page-header">
    <div class="header-content">
      <h2 class="section-title">RPC Providers</h2>
      {#if !loading}
        <div class="provider-count" class:pulse={providerCount > 0}>
          <span class="count-number">{providerCount}</span>
          <span class="count-label">Station{providerCount !== 1 ? 's' : ''} Online</span>
        </div>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="status-message">
      <div class="loading-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Initializing provider network...</p>
    </div>
  {:else if error}
    <div class="status-message error">
      <p>{error}</p>
    </div>
  {:else}
    <div class="search-container">
      <div class="terminal-input">
        <input
          type="text"
          placeholder="Search by name or URL..."
          bind:value={searchQuery}
        />
      </div>
    </div>

    {#if filteredProviders.length === 0}
      <div class="no-results">
        <p>No providers match your search</p>
      </div>
    {:else}
      <div class="providers-grid">
        {#each filteredProviders as provider, i (provider.url)}
          <article class="provider-card tactical-panel" style="animation-delay: {i * 50}ms">
            <div class="corner-bl"></div>
            <div class="corner-br"></div>

            <div class="card-header">
              <div class="provider-logo" style="--logo-color: {getProviderColor(provider.name)}">
                <span class="logo-text">{getProviderInitials(provider.name)}</span>
              </div>
              <div class="provider-info">
                <h3 class="provider-name">{provider.name}</h3>
                <button
                  class="website-link"
                  on:click={(e) => navigateToWebsite(provider.url, e)}
                  aria-label="Visit {extractDomain(provider.url)}"
                >
                  <svg class="link-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 6.5V10C10 10.55 9.55 11 9 11H2C1.45 11 1 10.55 1 10V3C1 2.45 1.45 2 2 2H5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M7 1H11V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11 1L6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {extractDomain(provider.url)}
                </button>
              </div>
            </div>

            <div class="card-body">
              {#if !provider.sensitive}
                <div class="rpc-url-section">
                  <div class="url-display">
                    <span class="url-prefix">></span>
                    <span class="url-text">{provider.url}</span>
                  </div>
                  <button
                    class="copy-btn"
                    class:copied={copiedUrl === provider.url}
                    on:click={() => copyToClipboard(provider.url)}
                    aria-label="Copy RPC URL"
                  >
                    {#if copiedUrl === provider.url}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7L5.5 10.5L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Copied
                    {:else}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M2 10V3C2 2.44772 2.44772 2 3 2H10" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      Copy URL
                    {/if}
                  </button>
                </div>
              {:else}
                <div class="sensitive-notice">
                  <span class="sensitive-icon">🔒</span>
                  <span class="sensitive-text">Protected endpoint</span>
                </div>
              {/if}
            </div>

            <div class="card-footer">
              <div class="status-indicator">
                <span class="status-dot active"></span>
                <span class="status-text">Online</span>
              </div>
              <a href="#/endpoint/{encodeURIComponent(provider.url)}" class="test-link">
                Test Connection
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6H10M10 6L6 2M10 6L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .list-page {
    animation: fadeInUp 0.3s ease-out;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
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

  .provider-count {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 255, 136, 0.05));
    border: 1px solid var(--border-accent);
    border-radius: 2px;
    animation: fadeInUp 0.3s ease-out 0.2s both;
  }

  .provider-count.pulse {
    animation: fadeInUp 0.3s ease-out 0.2s both, subtlePulse 3s ease-in-out infinite;
  }

  .count-number {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent);
  }

  .count-label {
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
  }

  .search-container {
    margin-bottom: 2rem;
    animation: slideInLeft 0.4s ease-out 0.1s both;
  }

  .terminal-input {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .terminal-input:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 12px rgba(0, 180, 216, 0.2);
  }

  .terminal-input::before {
    content: '>';
    font-family: var(--font-mono);
    color: var(--accent);
    padding: 0.75rem 0 0.75rem 1rem;
    font-weight: 600;
  }

  .terminal-input input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.75rem 1rem 0.75rem 0.5rem;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.875rem;
  }

  .terminal-input input::placeholder {
    color: var(--text-muted);
  }

  .terminal-input input:focus {
    outline: none;
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

  .no-results {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
    font-family: var(--font-body);
  }

  .providers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    animation: fadeIn 0.4s ease-out;
  }

  @media (min-width: 768px) {
    .providers-grid {
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    }
  }

  @media (min-width: 1200px) {
    .providers-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .provider-card {
    position: relative;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    animation: fadeInUp 0.3s ease-out both;
  }

  .provider-card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: var(--shadow-glow), var(--shadow-card);
    border-color: var(--accent);
  }

  .corner-bl,
  .corner-br {
    position: absolute;
    width: var(--corner-size);
    height: var(--corner-size);
    border-color: var(--accent);
    border-style: solid;
    transition: border-color 0.2s;
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

  .provider-card:hover .corner-bl,
  .provider-card:hover .corner-br {
    border-color: var(--accent-light);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .provider-logo {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 255, 136, 0.05));
    border: 2px solid var(--logo-color);
    border-radius: 2px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    transition: all 0.3s;
  }

  .provider-card:hover .provider-logo {
    border-color: var(--accent-light);
    box-shadow: 0 0 16px var(--logo-color);
    transform: rotate(5deg);
  }

  .logo-text {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--logo-color);
    transition: color 0.3s;
  }

  .provider-card:hover .logo-text {
    color: var(--accent-light);
  }

  .provider-info {
    flex: 1;
    min-width: 0;
  }

  .provider-name {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .website-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: none;
    border: none;
    padding: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .website-link:hover {
    color: var(--accent);
  }

  .link-icon {
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .website-link:hover .link-icon {
    opacity: 1;
  }

  .card-body {
    flex: 1;
  }

  .rpc-url-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .url-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    overflow: hidden;
  }

  .url-prefix {
    color: var(--accent);
    font-weight: 600;
    flex-shrink: 0;
  }

  .url-text {
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    background-color: transparent;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(0, 180, 216, 0.05);
  }

  .copy-btn.copied {
    border-color: var(--status-nominal);
    color: var(--status-nominal);
    background-color: rgba(0, 255, 136, 0.05);
  }

  .copy-btn svg {
    width: 14px;
    height: 14px;
  }

  .sensitive-notice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: rgba(255, 193, 7, 0.05);
    border: 1px solid rgba(255, 193, 7, 0.2);
    border-radius: 2px;
  }

  .sensitive-icon {
    font-size: 1rem;
  }

  .sensitive-text {
    font-family: var(--font-body);
    font-size: 0.75rem;
    color: var(--status-warning);
    font-style: italic;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    animation: pulse 2s ease-in-out infinite;
  }

  .status-text {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .test-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background-color: transparent;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
  }

  .test-link:hover {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(0, 180, 216, 0.05);
  }

  .test-link svg {
    width: 12px;
    height: 12px;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes subtlePulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.95;
      transform: scale(0.98);
    }
  }
</style>
