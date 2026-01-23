<script lang="ts">
  import Router from 'svelte-spa-router';
  import List from './pages/List.svelte';
  import Results from './pages/Results.svelte';
  import Endpoint from './pages/Endpoint.svelte';
  import Admin from './pages/Admin.svelte';
  import Benchmark from './pages/Benchmark.svelte';

  const routes = {
    '/': List,
    '/results': Results,
    '/endpoint/:id': Endpoint,
    '/admin': Admin,
    '/benchmark': Benchmark,
  };

  // Get current route for active state
  let currentPath = '/';

  function handleRouteChange(event: CustomEvent) {
    currentPath = event.detail.location || '/';
  }
</script>

<main>
  <header>
    <div class="header-content">
      <a href="#/" class="logo">
        <span class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="8.5" x2="22" y2="8.5" />
          </svg>
        </span>
        <span class="logo-text">
          <span class="logo-title">Polygon RPC</span>
          <span class="logo-subtitle">Tester</span>
        </span>
      </a>

      <nav>
        <a href="#/" class="nav-btn" class:active={currentPath === '/'}>
          <span class="nav-indicator"></span>
          <span class="nav-label">Providers</span>
        </a>
        <a href="#/results" class="nav-btn" class:active={currentPath === '/results'}>
          <span class="nav-indicator"></span>
          <span class="nav-label">Results</span>
        </a>
        <a href="#/benchmark" class="nav-btn" class:active={currentPath === '/benchmark'}>
          <span class="nav-indicator"></span>
          <span class="nav-label">Benchmark</span>
        </a>
        <a href="#/admin" class="nav-btn" class:active={currentPath === '/admin'}>
          <span class="nav-indicator"></span>
          <span class="nav-label">Admin</span>
        </a>
      </nav>
    </div>
    <div class="header-accent"></div>
  </header>

  <Router {routes} on:routeLoaded={handleRouteChange} />
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
  }

  header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-primary);
    text-decoration: none;
  }

  .logo:hover {
    text-shadow: none;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    color: var(--accent);
    filter: drop-shadow(0 0 8px var(--accent-glow));
  }

  .logo-icon svg {
    width: 100%;
    height: 100%;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .logo-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .logo-subtitle {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
  }

  nav {
    display: flex;
    gap: 0.5rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 2px;
    background-color: transparent;
    transition: all 0.2s;
    position: relative;
  }

  .nav-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-accent);
    background-color: var(--bg-secondary);
    text-shadow: 0 0 8px var(--accent-glow);
  }

  .nav-btn.active {
    color: var(--accent);
    border-color: var(--accent);
    background-color: var(--bg-secondary);
  }

  .nav-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--status-inactive);
    transition: all 0.2s;
  }

  .nav-btn:hover .nav-indicator {
    background-color: var(--text-secondary);
  }

  .nav-btn.active .nav-indicator {
    background-color: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
    animation: pulse 2s ease-in-out infinite;
  }

  .header-accent {
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 20%,
      var(--accent) 80%,
      transparent 100%
    );
    opacity: 0.6;
    margin-top: 0.5rem;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 600px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    nav {
      width: 100%;
      justify-content: center;
    }

    .logo-title {
      font-size: 1rem;
    }
  }
</style>
