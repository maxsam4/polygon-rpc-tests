<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { BenchmarkEndpointData } from '../../../shared/types';

  Chart.register(...registerables);

  export let endpoints: BenchmarkEndpointData[] = [];
  export let dataKey: 'blockNumber' | 'responseMs';
  export let title: string;
  export let yAxisLabel: string;

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  // Generate distinct colors for endpoints
  function getColor(index: number): string {
    const colors = [
      '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
      '#06b6d4', '#a855f7', '#10b981',
    ];
    return colors[index % colors.length];
  }

  function updateChart() {
    if (!chart) return;

    // Get all unique timestamps across all endpoints
    const allTimestamps = new Set<number>();
    for (const endpoint of endpoints) {
      for (const point of endpoint.history) {
        allTimestamps.add(point.timestamp);
      }
    }
    const timestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Create labels (time only)
    const labels = timestamps.map((t) => {
      const date = new Date(t);
      return date.toLocaleTimeString();
    });

    // Create datasets
    const datasets = endpoints.map((endpoint, index) => {
      const data = timestamps.map((t) => {
        const point = endpoint.history.find((p) => p.timestamp === t);
        if (!point) return null;
        return point[dataKey];
      });

      return {
        label: endpoint.name,
        data,
        borderColor: getColor(index),
        backgroundColor: getColor(index) + '20',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        spanGaps: true,
      };
    });

    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('none');
  }

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: { size: 10 },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time' },
            ticks: { maxTicksLimit: 10 },
          },
          y: {
            display: true,
            title: { display: true, text: yAxisLabel },
            beginAtZero: dataKey === 'responseMs',
          },
        },
      },
    });

    updateChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  $: if (chart && endpoints) {
    updateChart();
  }
</script>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    height: 300px;
    width: 100%;
  }
</style>
