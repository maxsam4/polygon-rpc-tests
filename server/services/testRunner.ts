import type {
  Config,
  Endpoint,
  Results,
  EndpointResults,
  TestResult,
  ProgressEvent,
  Category,
  LatestData,
} from '../../shared/types.js';
import { executeRpcCall, executeBatchCall, getMethodParams, getActualMethod, getSubscriptionParams } from './rpcClient.js';
import { saveResults } from './storage.js';

type ProgressCallback = (event: ProgressEvent) => void;

// Methods that require a filter ID from eth_newFilter
const FILTER_DEPENDENT_METHODS = ['eth_getFilterChanges', 'eth_getFilterLogs', 'eth_uninstallFilter'];

/**
 * Extract batch size from method name (e.g., "batch:10" -> 10).
 * Returns null if not a batch method.
 */
function getBatchSize(method: string): number | null {
  if (method.startsWith('batch:')) {
    return parseInt(method.replace('batch:', ''), 10);
  }
  return null;
}

let isRunning = false;
let currentProgress: ProgressEvent | null = null;

/**
 * Create a fresh filter for filter-dependent methods.
 * Each method gets its own filter to avoid issues where eth_uninstallFilter
 * removes the filter before other methods can use it.
 */
async function createFilterId(
  endpointUrl: string,
  testSettings: Config['testSettings']
): Promise<string | null> {
  const params = getMethodParams('eth_newFilter', testSettings);
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_newFilter',
        params,
      }),
    });
    const data = await response.json();
    if (data.result) {
      return data.result;
    }
  } catch {
    // Filter creation failed
  }
  return null;
}

/**
 * Collect latest blockchain data for non-archive method tests.
 * Fetches a recent block (10 blocks behind latest for stability) and extracts
 * the block hash and a transaction hash from it.
 */
async function collectLatestData(
  endpointUrl: string,
  timeoutMs: number
): Promise<LatestData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Get latest block number
    const blockNumResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
      signal: controller.signal,
    });
    const blockNumData = await blockNumResponse.json();
    if (!blockNumData.result) return null;

    // Use a block 10 behind latest for stability (helps with trace methods)
    const latestNum = parseInt(blockNumData.result, 16);
    const targetNum = latestNum - 10;
    const targetBlockHex = `0x${targetNum.toString(16)}`;

    // Get block with transactions
    const blockResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBlockByNumber',
        params: [targetBlockHex, true],
      }),
      signal: controller.signal,
    });
    const blockData = await blockResponse.json();

    if (!blockData.result) return null;

    const block = blockData.result;
    const blockHash = block.hash;
    let txHash: string | null = null;

    // Try to find a transaction in this block or search recent blocks
    if (block.transactions && block.transactions.length > 0) {
      txHash = block.transactions[0].hash;
    } else {
      // Search up to 10 recent blocks for a transaction
      for (let i = 1; i <= 10; i++) {
        const searchBlockHex = `0x${(targetNum - i).toString(16)}`;
        const searchResponse = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'eth_getBlockByNumber',
            params: [searchBlockHex, true],
          }),
          signal: controller.signal,
        });
        const searchData = await searchResponse.json();
        if (searchData.result?.transactions?.length > 0) {
          txHash = searchData.result.transactions[0].hash;
          break;
        }
      }
    }

    if (!txHash) return null;

    return {
      blockNumber: targetBlockHex,
      blockHash,
      txHash,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

    // Calculate global total for progress tracking
    const methodsPerEndpoint = categories.reduce((sum, cat) => sum + methods[cat].length, 0);
    const globalTotal = methodsPerEndpoint * endpoints.length;
    let globalCompleted = 0;

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
            sensitive: endpoint.sensitive,
          };

          let totalResponseMs = 0;
          let responseCount = 0;

          // Use endpoint-specific delay or fall back to global setting
          const delay = endpoint.delayBetweenCallsMs ?? testSettings.delayBetweenCallsMs;

          // Collect latest blockchain data once per endpoint for non-archive tests
          const latestData = await collectLatestData(endpoint.url, testSettings.timeoutMs);

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
                globalCompleted++;
                continue;
              }

              if (!isWsMethod && isWsEndpoint && category !== 'basic') {
                // For WSS endpoints, only test basic methods and websocket category
                endpointResults.results[method] = { status: 'skipped' };
                completed++;
                globalCompleted++;
                continue;
              }

              // Check if this is a batch method
              const batchSize = getBatchSize(method);
              let result: TestResult;

              if (batchSize !== null) {
                // Execute batch call
                result = await executeBatchCall(endpoint.url, batchSize, testSettings.timeoutMs);
              } else {
                const actualMethod = getActualMethod(method);
                let params: unknown[];

                if (method.startsWith('eth_subscribe:')) {
                  params = getSubscriptionParams(method);
                } else if (FILTER_DEPENDENT_METHODS.includes(method)) {
                  // These methods need a valid filter ID - create fresh filter for each
                  const filterId = await createFilterId(endpoint.url, testSettings);
                  if (filterId) {
                    params = [filterId];
                  } else {
                    // Can't test without a filter
                    endpointResults.results[method] = { status: 'fail', error: 'Could not create filter' };
                    completed++;
                    globalCompleted++;
                    continue;
                  }
                } else {
                  // Pass latestData only for non-archive methods
                  const isArchive = method.endsWith(':archive');
                  params = getMethodParams(method, testSettings, isArchive ? undefined : latestData);
                }

                result = await executeRpcCall(
                  endpoint.url,
                  actualMethod,
                  params,
                  testSettings.timeoutMs
                );
              }

              endpointResults.results[method] = result;

              if (result.responseMs) {
                totalResponseMs += result.responseMs;
                responseCount++;
              }

              completed++;
              globalCompleted++;

              // Send progress update
              onProgress({
                type: 'result',
                endpoint: endpointId,
                method,
                status: result.status,
                responseMs: result.responseMs,
                globalCompleted,
                globalTotal,
              });

              currentProgress = {
                type: 'progress',
                endpoint: endpointId,
                category,
                completed,
                total: categoryMethods.length,
                globalCompleted,
                globalTotal,
              };

              onProgress(currentProgress);

              // Delay between calls (use per-endpoint or global setting)
              await sleep(delay);
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
