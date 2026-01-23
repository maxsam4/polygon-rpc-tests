<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { BenchmarkEndpointData } from '../../../shared/types';
  import { benchmarkState } from '../stores/benchmark';

  Chart.register(...registerables);

  export let endpoints: BenchmarkEndpointData[] = [];
  export let dataKey: 'blockNumber' | 'responseMs';
  export let title: string;
  export let yAxisLabel: string;

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

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
    const datasets = endpoints.map((endpoint) => {
      const data = timestamps.map((t) => {
        const point = endpoint.history.find((p) => p.timestamp === t);
        if (!point) return null;
        return point[dataKey];
      });

      // Get stable color from colorMap
      const color = $benchmarkState.colorMap[endpoint.id] || '#00b4d8';

      return {
        label: endpoint.name,
        data,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#e0f7fa',
        pointHoverBorderWidth: 2,
        tension: 0.2,
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
            display: !!title,
            text: title,
            color: '#90a4ae',
            font: {
              family: "'Orbitron', sans-serif",
              size: 12,
              weight: 600,
            },
            padding: { bottom: 16 },
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 2,
              padding: 12,
              color: '#90a4ae',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
              usePointStyle: false,
            },
          },
          tooltip: {
            backgroundColor: '#0c1624',
            titleColor: '#e0f7fa',
            bodyColor: '#90a4ae',
            borderColor: '#1a2d42',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: "'Space Grotesk', sans-serif",
              size: 12,
              weight: 600,
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 11,
            },
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            boxPadding: 4,
            cornerRadius: 2,
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time',
              color: '#546e7a',
              font: {
                family: "'Orbitron', sans-serif",
                size: 10,
                weight: 600,
              },
            },
            ticks: {
              maxTicksLimit: 8,
              color: '#546e7a',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 9,
              },
            },
            grid: {
              color: 'rgba(0, 180, 216, 0.08)',
              lineWidth: 1,
            },
            border: {
              color: '#1a2d42',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: yAxisLabel,
              color: '#546e7a',
              font: {
                family: "'Orbitron', sans-serif",
                size: 10,
                weight: 600,
              },
            },
            beginAtZero: dataKey === 'responseMs',
            ticks: {
              color: '#546e7a',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 9,
              },
            },
            grid: {
              color: 'rgba(0, 180, 216, 0.08)',
              lineWidth: 1,
            },
            border: {
              color: '#1a2d42',
            },
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
    height: 280px;
    width: 100%;
  }
</style>
