<script lang="ts">
  import Router from 'svelte-spa-router';
  import Results from './pages/Results.svelte';
  import Endpoint from './pages/Endpoint.svelte';
  import Admin from './pages/Admin.svelte';
  import Benchmark from './pages/Benchmark.svelte';

  const routes = {
    '/': Results,
    '/endpoint/:id': Endpoint,
    '/admin': Admin,
    '/benchmark': Benchmark,
  };
</script>

<main>
  <header>
    <h1><a href="#/">Polygon RPC Tester</a></h1>
    <nav>
      <a href="#/">Results</a>
      <a href="#/benchmark">Benchmark</a>
      <a href="#/admin">Admin</a>
    </nav>
  </header>
  <Router {routes} />
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  h1 {
    font-size: 1.5rem;
  }

  h1 a {
    color: var(--text-primary);
  }

  nav {
    display: flex;
    gap: 1rem;
  }
</style>
