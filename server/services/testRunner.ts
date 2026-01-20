import type {
  Config,
  Results,
  EndpointResults,
  TestResult,
  ProgressEvent,
  Category,
} from '../../shared/types.js';
import { executeRpcCall, getMethodParams, getActualMethod, getSubscriptionParams } from './rpcClient.js';
import { saveResults } from './storage.js';

type ProgressCallback = (event: ProgressEvent) => void;

let isRunning = false;
let currentProgress: ProgressEvent | null = null;

export function isTestRunning(): boolean {
  return isRunning;
}

export function getCurrentProgress(): ProgressEvent | null {
  return currentProgress;
}

export async function runTests(
  config: Config,
  onProgress: ProgressCallback
): Promise<Results> {
  if (isRunning) {
    throw new Error('Tests are already running');
  }

  isRunning = true;
  const startTime = Date.now();
  const results: Results = {
    lastRun: new Date().toISOString(),
    runDurationMs: 0,
    endpoints: {},
  };

  try {
    const { endpoints, testSettings, methods } = config;
    const categories = Object.keys(methods) as Category[];

    // Process endpoints with concurrency limit
    const chunks = chunkArray(endpoints, testSettings.concurrency);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (endpoint) => {
          const endpointId = slugify(endpoint.name);
          const endpointResults: EndpointResults = {
            url: endpoint.url,
            name: endpoint.name,
            nodeType: 'unknown',
            avgResponseMs: 0,
            results: {},
          };

          let totalResponseMs = 0;
          let responseCount = 0;

          for (const category of categories) {
            const categoryMethods = methods[category];
            let completed = 0;

            for (const method of categoryMethods) {
              // Skip WebSocket methods for HTTP endpoints and vice versa
              const isWsEndpoint = endpoint.url.startsWith('wss://') || endpoint.url.startsWith('ws://');
              const isWsMethod = category === 'websocket';

              if (isWsMethod && !isWsEndpoint) {
                endpointResults.results[method] = { status: 'skipped' };
                completed++;
                continue;
              }

              if (!isWsMethod && isWsEndpoint && category !== 'basic') {
                // For WSS endpoints, only test basic methods and websocket category
                endpointResults.results[method] = { status: 'skipped' };
                completed++;
                continue;
              }

              const actualMethod = getActualMethod(method);
              let params: unknown[];

              if (method.startsWith('eth_subscribe:')) {
                params = getSubscriptionParams(method);
              } else {
                params = getMethodParams(method, testSettings);
              }

              const result = await executeRpcCall(
                endpoint.url,
                actualMethod,
                params,
                testSettings.timeoutMs
              );

              endpointResults.results[method] = result;

              if (result.responseMs) {
                totalResponseMs += result.responseMs;
                responseCount++;
              }

              completed++;

              // Send progress update
              onProgress({
                type: 'result',
                endpoint: endpointId,
                method,
                status: result.status,
                responseMs: result.responseMs,
              });

              currentProgress = {
                type: 'progress',
                endpoint: endpointId,
                category,
                completed,
                total: categoryMethods.length,
              };

              onProgress(currentProgress);

              // Delay between calls
              await sleep(testSettings.delayBetweenCallsMs);
            }
          }

          // Calculate average response time
          endpointResults.avgResponseMs = responseCount > 0
            ? Math.round(totalResponseMs / responseCount)
            : 0;

          // Determine node type based on archive tests
          const archiveResults = Object.entries(endpointResults.results)
            .filter(([key]) => key.endsWith(':archive'))
            .map(([, value]) => value);

          if (archiveResults.length > 0) {
            const archivePasses = archiveResults.filter(r => r.status === 'pass').length;
            endpointResults.nodeType = archivePasses === archiveResults.length ? 'archive' : 'full';
          }

          results.endpoints[endpointId] = endpointResults;
        })
      );
    }

    results.runDurationMs = Date.now() - startTime;
    await saveResults(results);

    onProgress({
      type: 'complete',
      runDurationMs: results.runDurationMs,
    });

    return results;
  } catch (error) {
    onProgress({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    isRunning = false;
    currentProgress = null;
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
