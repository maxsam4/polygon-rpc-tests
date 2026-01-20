# Polygon RPC Endpoint Tester - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Polygon RPC endpoint testing tool with server-side test execution and interactive results UI.

**Architecture:** Node.js backend with Express runs RPC tests using viem, stores results in JSON. Svelte SPA displays results in AG Grid table with sorting/filtering. SSE provides real-time progress during test runs.

**Tech Stack:** TypeScript, Node.js, Express, viem, Svelte, Vite, AG Grid Community

**Design Doc:** `docs/plans/2026-01-20-polygon-rpc-tester-design.md`

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize package.json**

```bash
npm init -y
```

**Step 2: Install backend dependencies**

```bash
npm install express cors viem dotenv
npm install -D typescript tsx @types/node @types/express @types/cors
```

**Step 3: Install frontend dependencies**

```bash
npm install -D vite svelte @sveltejs/vite-plugin-svelte ag-grid-community ag-grid-svelte svelte-spa-router
```

**Step 4: Create tsconfig.json**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "resolveJsonModule": true
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules", "web"]
}
```

**Step 5: Create .env.example**

Create `.env.example`:
```
ADMIN_PASSWORD=change-me-in-production
PORT=3000
```

**Step 6: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
.env
results.json
*.log
```

**Step 7: Update package.json scripts**

Edit `package.json` to add:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx scripts/dev.ts",
    "dev:server": "tsx watch server/index.ts",
    "dev:web": "vite --config web/vite.config.ts",
    "build": "npm run build:server && npm run build:web",
    "build:server": "tsc",
    "build:web": "vite build --config web/vite.config.ts",
    "start": "node dist/server/index.js"
  }
}
```

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize project with dependencies"
```

---

## Task 2: Shared Types

**Files:**
- Create: `shared/types.ts`

**Step 1: Create shared types**

Create `shared/types.ts`:
```typescript
export type TestStatus = 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped';

export interface Endpoint {
  url: string;
  name: string;
}

export interface TestSettings {
  timeoutMs: number;
  delayBetweenCallsMs: number;
  archiveBlockNumber: number;
  archiveTestAddress: string;
  concurrency: number;
}

export interface MethodCategories {
  basic: string[];
  state: string[];
  block: string[];
  transaction: string[];
  filter: string[];
  archive: string[];
  bor: string[];
  erigon: string[];
  debug: string[];
  trace: string[];
  txpool: string[];
  websocket: string[];
}

export interface Config {
  endpoints: Endpoint[];
  testSettings: TestSettings;
  methods: MethodCategories;
}

export interface TestResult {
  status: TestStatus;
  responseMs?: number;
  error?: string;
}

export interface EndpointResults {
  url: string;
  name: string;
  nodeType: 'archive' | 'full' | 'unknown';
  avgResponseMs: number;
  results: Record<string, TestResult>;
}

export interface Results {
  lastRun: string;
  runDurationMs: number;
  endpoints: Record<string, EndpointResults>;
}

export interface ProgressEvent {
  type: 'progress' | 'result' | 'complete' | 'error';
  endpoint?: string;
  category?: string;
  method?: string;
  completed?: number;
  total?: number;
  status?: TestStatus;
  responseMs?: number;
  runDurationMs?: number;
  error?: string;
}

export type Category = keyof MethodCategories;
```

**Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Default Config File

**Files:**
- Create: `config.json`

**Step 1: Create config.json with all endpoints and comprehensive methods**

Create `config.json`:
```json
{
  "endpoints": [
    { "url": "https://rpc.ankr.com/polygon", "name": "Ankr" },
    { "url": "https://polygon-rpc.com", "name": "Polygon RPC" },
    { "url": "https://rpc-mainnet.matic.quiknode.pro", "name": "QuickNode" },
    { "url": "https://polygon-public.nodies.app", "name": "Nodies" },
    { "url": "https://polygon-mainnet.public.blastapi.io", "name": "BlastAPI" },
    { "url": "https://1rpc.io/matic", "name": "1RPC" },
    { "url": "https://polygon-bor-rpc.publicnode.com", "name": "PublicNode" },
    { "url": "wss://polygon-bor-rpc.publicnode.com", "name": "PublicNode WSS" },
    { "url": "https://polygon-mainnet.g.alchemy.com/v2/demo", "name": "Alchemy" },
    { "url": "https://polygon.api.onfinality.io/public", "name": "OnFinality" },
    { "url": "https://polygon.drpc.org", "name": "dRPC" },
    { "url": "https://polygon.gateway.tenderly.co", "name": "Tenderly" },
    { "url": "https://gateway.tenderly.co/public/polygon", "name": "Tenderly Public" },
    { "url": "https://api.zan.top/polygon-mainnet", "name": "ZAN" },
    { "url": "https://polygon.meowrpc.com", "name": "MeowRPC" },
    { "url": "https://public.stackup.sh/api/v1/node/polygon-mainnet", "name": "Stackup" },
    { "url": "https://polygon.rpc.subquery.network/public", "name": "SubQuery" },
    { "url": "https://endpoints.omniatech.io/v1/matic/mainnet/public", "name": "Omnia" },
    { "url": "https://polygon.lava.build", "name": "Lava" },
    { "url": "https://polygon.therpc.io", "name": "TheRPC" },
    { "url": "https://poly.api.pocket.network", "name": "Pocket Network" }
  ],
  "testSettings": {
    "timeoutMs": 10000,
    "delayBetweenCallsMs": 100,
    "archiveBlockNumber": 35000000,
    "archiveTestAddress": "0x0000000000000000000000000000000000001010",
    "concurrency": 5
  },
  "methods": {
    "basic": [
      "web3_clientVersion",
      "web3_sha3",
      "net_version",
      "net_listening",
      "net_peerCount",
      "eth_protocolVersion",
      "eth_syncing",
      "eth_coinbase",
      "eth_chainId",
      "eth_mining",
      "eth_hashrate",
      "eth_gasPrice",
      "eth_accounts",
      "eth_blockNumber",
      "eth_maxPriorityFeePerGas",
      "eth_feeHistory",
      "eth_blobBaseFee"
    ],
    "state": [
      "eth_getBalance",
      "eth_getStorageAt",
      "eth_getTransactionCount",
      "eth_getCode",
      "eth_call",
      "eth_estimateGas",
      "eth_createAccessList"
    ],
    "block": [
      "eth_getBlockByHash",
      "eth_getBlockByNumber",
      "eth_getBlockTransactionCountByHash",
      "eth_getBlockTransactionCountByNumber",
      "eth_getUncleCountByBlockHash",
      "eth_getUncleCountByBlockNumber",
      "eth_getUncleByBlockHashAndIndex",
      "eth_getUncleByBlockNumberAndIndex",
      "eth_getBlockReceipts"
    ],
    "transaction": [
      "eth_getTransactionByHash",
      "eth_getTransactionByBlockHashAndIndex",
      "eth_getTransactionByBlockNumberAndIndex",
      "eth_getTransactionReceipt"
    ],
    "filter": [
      "eth_newFilter",
      "eth_newBlockFilter",
      "eth_newPendingTransactionFilter",
      "eth_uninstallFilter",
      "eth_getFilterChanges",
      "eth_getFilterLogs",
      "eth_getLogs"
    ],
    "archive": [
      "eth_getBalance:archive",
      "eth_getStorageAt:archive",
      "eth_getTransactionCount:archive",
      "eth_getCode:archive",
      "eth_call:archive"
    ],
    "bor": [
      "bor_getAuthor",
      "bor_getCurrentValidators",
      "bor_getCurrentProposer",
      "bor_getRootHash",
      "bor_getSignersAtHash",
      "bor_getSnapshot",
      "bor_getSnapshotAtHash",
      "bor_getSnapshotProposer",
      "bor_getSnapshotProposerSequence"
    ],
    "erigon": [
      "erigon_forks",
      "erigon_getHeaderByNumber",
      "erigon_getHeaderByHash",
      "erigon_getBlockByTimestamp",
      "erigon_getLogsByHash",
      "erigon_blockNumber",
      "erigon_cacheCheck"
    ],
    "debug": [
      "debug_traceTransaction",
      "debug_traceCall",
      "debug_traceBlockByNumber",
      "debug_traceBlockByHash",
      "debug_storageRangeAt",
      "debug_getBadBlocks",
      "debug_accountRange",
      "debug_getModifiedAccountsByNumber",
      "debug_getModifiedAccountsByHash"
    ],
    "trace": [
      "trace_call",
      "trace_callMany",
      "trace_rawTransaction",
      "trace_replayBlockTransactions",
      "trace_replayTransaction",
      "trace_block",
      "trace_filter",
      "trace_get",
      "trace_transaction"
    ],
    "txpool": [
      "txpool_content",
      "txpool_inspect",
      "txpool_status"
    ],
    "websocket": [
      "eth_subscribe:newHeads",
      "eth_subscribe:logs",
      "eth_subscribe:newPendingTransactions",
      "eth_subscribe:syncing"
    ]
  }
}
```

> **Implementation note:** Research Bor and Erigon documentation to expand this list with any additional methods discovered.

**Step 2: Commit**

```bash
git add config.json
git commit -m "feat: add default config with endpoints and methods"
```

---

## Task 4: Storage Service

**Files:**
- Create: `server/services/storage.ts`

**Step 1: Create storage service**

Create `server/services/storage.ts`:
```typescript
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { Config, Results } from '../../shared/types.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const RESULTS_PATH = path.join(process.cwd(), 'results.json');

export async function loadConfig(): Promise<Config> {
  const content = await readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function saveConfig(config: Config): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function loadResults(): Promise<Results | null> {
  if (!existsSync(RESULTS_PATH)) {
    return null;
  }
  const content = await readFile(RESULTS_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function saveResults(results: Results): Promise<void> {
  await writeFile(RESULTS_PATH, JSON.stringify(results, null, 2));
}
```

**Step 2: Commit**

```bash
git add server/services/storage.ts
git commit -m "feat: add storage service for config and results"
```

---

## Task 5: RPC Client Service

**Files:**
- Create: `server/services/rpcClient.ts`

**Step 1: Create RPC client with viem**

Create `server/services/rpcClient.ts`:
```typescript
import { createPublicClient, http, webSocket, type PublicClient, type Chain } from 'viem';
import { polygon } from 'viem/chains';
import type { TestSettings, TestResult, TestStatus } from '../../shared/types.js';

interface RpcRequest {
  method: string;
  params?: unknown[];
}

interface RpcResponse {
  result?: unknown;
  error?: { code: number; message: string };
}

export async function executeRpcCall(
  url: string,
  method: string,
  params: unknown[],
  timeoutMs: number
): Promise<TestResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isWebSocket = url.startsWith('wss://') || url.startsWith('ws://');

    if (isWebSocket) {
      return await executeWebSocketCall(url, method, params, timeoutMs);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
      signal: controller.signal,
    });

    const responseMs = Date.now() - start;
    const data: RpcResponse = await response.json();

    if (data.error) {
      // Check if it's an unsupported method error
      const errorMsg = data.error.message.toLowerCase();
      if (
        errorMsg.includes('not found') ||
        errorMsg.includes('not supported') ||
        errorMsg.includes('not implemented') ||
        errorMsg.includes('method not available') ||
        data.error.code === -32601
      ) {
        return { status: 'unsupported', error: data.error.message };
      }
      return { status: 'fail', responseMs, error: data.error.message };
    }

    return { status: 'pass', responseMs };
  } catch (error) {
    const responseMs = Date.now() - start;
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { status: 'timeout', responseMs };
      }
      return { status: 'fail', responseMs, error: error.message };
    }
    return { status: 'fail', responseMs, error: 'Unknown error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeWebSocketCall(
  url: string,
  method: string,
  params: unknown[],
  timeoutMs: number
): Promise<TestResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const ws = new WebSocket(url);
    const timeoutId = setTimeout(() => {
      ws.close();
      resolve({ status: 'timeout', responseMs: Date.now() - start });
    }, timeoutMs);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }));
    };

    ws.onmessage = (event) => {
      clearTimeout(timeoutId);
      const responseMs = Date.now() - start;
      try {
        const data: RpcResponse = JSON.parse(event.data.toString());
        ws.close();

        if (data.error) {
          const errorMsg = data.error.message.toLowerCase();
          if (
            errorMsg.includes('not found') ||
            errorMsg.includes('not supported') ||
            errorMsg.includes('not implemented') ||
            data.error.code === -32601
          ) {
            resolve({ status: 'unsupported', error: data.error.message });
            return;
          }
          resolve({ status: 'fail', responseMs, error: data.error.message });
          return;
        }
        resolve({ status: 'pass', responseMs });
      } catch (e) {
        ws.close();
        resolve({ status: 'fail', responseMs, error: 'Invalid JSON response' });
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeoutId);
      ws.close();
      resolve({ status: 'fail', responseMs: Date.now() - start, error: 'WebSocket error' });
    };
  });
}

export function getMethodParams(
  method: string,
  settings: TestSettings
): unknown[] {
  // Handle archive methods (e.g., "eth_getBalance:archive")
  const isArchive = method.endsWith(':archive');
  const baseMethod = isArchive ? method.replace(':archive', '') : method;
  const blockTag = isArchive ? `0x${settings.archiveBlockNumber.toString(16)}` : 'latest';

  switch (baseMethod) {
    // Basic methods
    case 'web3_sha3':
      return ['0x68656c6c6f20776f726c64']; // "hello world" in hex
    case 'eth_feeHistory':
      return [4, 'latest', [25, 75]];

    // State methods
    case 'eth_getBalance':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_getStorageAt':
      return [settings.archiveTestAddress, '0x0', blockTag];
    case 'eth_getTransactionCount':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_getCode':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_call':
      return [{ to: settings.archiveTestAddress, data: '0x' }, blockTag];
    case 'eth_estimateGas':
      return [{ to: settings.archiveTestAddress, data: '0x' }];
    case 'eth_createAccessList':
      return [{ to: settings.archiveTestAddress, data: '0x' }, 'latest'];

    // Block methods
    case 'eth_getBlockByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', false];
    case 'eth_getBlockByNumber':
      return ['latest', false];
    case 'eth_getBlockTransactionCountByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'eth_getBlockTransactionCountByNumber':
      return ['latest'];
    case 'eth_getUncleCountByBlockHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'eth_getUncleCountByBlockNumber':
      return ['latest'];
    case 'eth_getUncleByBlockHashAndIndex':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', '0x0'];
    case 'eth_getUncleByBlockNumberAndIndex':
      return ['latest', '0x0'];
    case 'eth_getBlockReceipts':
      return ['latest'];

    // Transaction methods
    case 'eth_getTransactionByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'eth_getTransactionByBlockHashAndIndex':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', '0x0'];
    case 'eth_getTransactionByBlockNumberAndIndex':
      return ['latest', '0x0'];
    case 'eth_getTransactionReceipt':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];

    // Filter methods
    case 'eth_newFilter':
      return [{ fromBlock: 'latest', toBlock: 'latest' }];
    case 'eth_uninstallFilter':
      return ['0x0'];
    case 'eth_getFilterChanges':
      return ['0x0'];
    case 'eth_getFilterLogs':
      return ['0x0'];
    case 'eth_getLogs':
      return [{ fromBlock: 'latest', toBlock: 'latest', limit: 1 }];

    // Bor methods
    case 'bor_getAuthor':
      return ['latest'];
    case 'bor_getRootHash':
      return [0, 100];
    case 'bor_getSignersAtHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'bor_getSnapshotAtHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];

    // Erigon methods
    case 'erigon_getHeaderByNumber':
      return ['latest'];
    case 'erigon_getHeaderByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'erigon_getBlockByTimestamp':
      return [Math.floor(Date.now() / 1000) - 60, false];
    case 'erigon_getLogsByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];

    // Debug methods
    case 'debug_traceTransaction':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'debug_traceCall':
      return [{ to: settings.archiveTestAddress }, 'latest'];
    case 'debug_traceBlockByNumber':
      return ['latest'];
    case 'debug_traceBlockByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
    case 'debug_storageRangeAt':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', 0, settings.archiveTestAddress, '0x0', 1];
    case 'debug_accountRange':
      return ['latest', '0x0', 10, false, false, false];
    case 'debug_getModifiedAccountsByNumber':
      return [1, 2];
    case 'debug_getModifiedAccountsByHash':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];

    // Trace methods
    case 'trace_call':
      return [{ to: settings.archiveTestAddress }, ['trace'], 'latest'];
    case 'trace_callMany':
      return [[[{ to: settings.archiveTestAddress }, ['trace']]], 'latest'];
    case 'trace_rawTransaction':
      return ['0x', ['trace']];
    case 'trace_replayBlockTransactions':
      return ['latest', ['trace']];
    case 'trace_replayTransaction':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', ['trace']];
    case 'trace_block':
      return ['latest'];
    case 'trace_filter':
      return [{ fromBlock: 'latest', toBlock: 'latest', count: 1 }];
    case 'trace_get':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000', ['0x0']];
    case 'trace_transaction':
      return ['0x0000000000000000000000000000000000000000000000000000000000000000'];

    // WebSocket subscription methods
    case 'eth_subscribe':
      return ['newHeads'];

    default:
      return [];
  }
}

export function getActualMethod(method: string): string {
  // Handle archive methods
  if (method.endsWith(':archive')) {
    return method.replace(':archive', '');
  }
  // Handle subscription methods (e.g., "eth_subscribe:newHeads")
  if (method.startsWith('eth_subscribe:')) {
    return 'eth_subscribe';
  }
  return method;
}

export function getSubscriptionParams(method: string): unknown[] {
  if (!method.startsWith('eth_subscribe:')) {
    return [];
  }
  const subType = method.split(':')[1];
  switch (subType) {
    case 'newHeads':
      return ['newHeads'];
    case 'logs':
      return ['logs', {}];
    case 'newPendingTransactions':
      return ['newPendingTransactions'];
    case 'syncing':
      return ['syncing'];
    default:
      return [subType];
  }
}
```

**Step 2: Commit**

```bash
git add server/services/rpcClient.ts
git commit -m "feat: add RPC client service with viem"
```

---

## Task 6: Test Runner Service

**Files:**
- Create: `server/services/testRunner.ts`

**Step 1: Create test runner service**

Create `server/services/testRunner.ts`:
```typescript
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
```

**Step 2: Commit**

```bash
git add server/services/testRunner.ts
git commit -m "feat: add test runner service"
```

---

## Task 7: Auth Middleware

**Files:**
- Create: `server/middleware/auth.ts`

**Step 1: Create auth middleware**

Create `server/middleware/auth.ts`:
```typescript
import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  if (token !== adminPassword) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  next();
}
```

**Step 2: Commit**

```bash
git add server/middleware/auth.ts
git commit -m "feat: add auth middleware"
```

---

## Task 8: API Routes

**Files:**
- Create: `server/routes/results.ts`
- Create: `server/routes/config.ts`
- Create: `server/routes/tests.ts`

**Step 1: Create results route**

Create `server/routes/results.ts`:
```typescript
import { Router } from 'express';
import { loadResults } from '../services/storage.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const results = await loadResults();
    if (!results) {
      res.json({ lastRun: null, endpoints: {} });
      return;
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load results' });
  }
});

export default router;
```

**Step 2: Create config route**

Create `server/routes/config.ts`:
```typescript
import { Router } from 'express';
import { loadConfig, saveConfig } from '../services/storage.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const config = await loadConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    await saveConfig(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

export default router;
```

**Step 3: Create tests route with SSE**

Create `server/routes/tests.ts`:
```typescript
import { Router } from 'express';
import { loadConfig } from '../services/storage.js';
import { runTests, isTestRunning, getCurrentProgress } from '../services/testRunner.js';
import { requireAuth } from '../middleware/auth.js';
import type { ProgressEvent } from '../../shared/types.js';

const router = Router();

// Store SSE clients
const clients: Set<{
  id: number;
  res: any;
}> = new Set();

let clientIdCounter = 0;

function broadcastProgress(event: ProgressEvent): void {
  const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.res.write(data);
  }
}

router.get('/status', (req, res) => {
  res.json({
    running: isTestRunning(),
    progress: getCurrentProgress(),
  });
});

router.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = ++clientIdCounter;
  const client = { id: clientId, res };
  clients.add(client);

  // Send initial status
  res.write(`event: status\ndata: ${JSON.stringify({ running: isTestRunning() })}\n\n`);

  req.on('close', () => {
    clients.delete(client);
  });
});

router.post('/run', requireAuth, async (req, res) => {
  if (isTestRunning()) {
    res.status(409).json({ error: 'Tests are already running' });
    return;
  }

  try {
    const config = await loadConfig();

    // Start tests in background
    runTests(config, broadcastProgress).catch(err => {
      console.error('Test run failed:', err);
    });

    res.json({ success: true, message: 'Test run started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start tests' });
  }
});

export default router;
```

**Step 4: Commit**

```bash
git add server/routes/
git commit -m "feat: add API routes for results, config, and tests"
```

---

## Task 9: Express Server

**Files:**
- Create: `server/index.ts`

**Step 1: Create Express server**

Create `server/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import resultsRouter from './routes/results.js';
import configRouter from './routes/config.js';
import testsRouter from './routes/tests.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/results', resultsRouter);
app.use('/api/config', configRouter);
app.use('/api/tests', testsRouter);

// Serve static files in production
const staticPath = path.join(__dirname, '../web/dist');
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Step 2: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Express server entry point"
```

---

## Task 10: Svelte Frontend Setup

**Files:**
- Create: `web/index.html`
- Create: `web/vite.config.ts`
- Create: `web/src/main.ts`
- Create: `web/src/App.svelte`
- Create: `web/src/app.css`
- Create: `web/svelte.config.js`
- Create: `web/tsconfig.json`

**Step 1: Create web/index.html**

Create `web/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Polygon RPC Tester</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 2: Create web/vite.config.ts**

Create `web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  root: 'web',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

**Step 3: Create web/svelte.config.js**

Create `web/svelte.config.js`:
```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
```

**Step 4: Create web/tsconfig.json**

Create `web/tsconfig.json`:
```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "paths": {
      "$lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 5: Create web/tsconfig.node.json**

Create `web/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["vite.config.ts"]
}
```

**Step 6: Create web/src/main.ts**

Create `web/src/main.ts`:
```typescript
import App from './App.svelte';
import './app.css';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

**Step 7: Create web/src/app.css**

Create `web/src/app.css`:
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  --text-primary: #eaeaea;
  --text-secondary: #a0a0a0;
  --accent: #e94560;
  --success: #4ade80;
  --warning: #fbbf24;
  --error: #ef4444;
  --border: #2d3748;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

button.primary {
  background-color: var(--accent);
  color: white;
}

button.primary:hover {
  background-color: #d63850;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}
```

**Step 8: Create web/src/App.svelte**

Create `web/src/App.svelte`:
```svelte
<script lang="ts">
  import Router from 'svelte-spa-router';
  import Results from './pages/Results.svelte';
  import Endpoint from './pages/Endpoint.svelte';
  import Admin from './pages/Admin.svelte';

  const routes = {
    '/': Results,
    '/endpoint/:id': Endpoint,
    '/admin': Admin,
  };
</script>

<main>
  <header>
    <h1><a href="#/">Polygon RPC Tester</a></h1>
    <nav>
      <a href="#/">Results</a>
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
```

**Step 9: Commit**

```bash
git add web/
git commit -m "feat: add Svelte frontend setup"
```

---

## Task 11: API Client Library

**Files:**
- Create: `web/src/lib/api.ts`

**Step 1: Create API client**

Create `web/src/lib/api.ts`:
```typescript
import type { Results, Config, ProgressEvent } from '../../../shared/types';

const API_BASE = '/api';

export async function fetchResults(): Promise<Results> {
  const res = await fetch(`${API_BASE}/results`);
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}

export async function fetchConfig(password: string): Promise<Config> {
  const res = await fetch(`${API_BASE}/config`, {
    headers: { Authorization: `Bearer ${password}` },
  });
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateConfig(password: string, config: Config): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${password}`,
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update config');
}

export async function startTestRun(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tests/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${password}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to start tests');
  }
}

export async function fetchTestStatus(): Promise<{ running: boolean; progress: ProgressEvent | null }> {
  const res = await fetch(`${API_BASE}/tests/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export function subscribeToProgress(
  onEvent: (event: ProgressEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/tests/progress`);

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      onEvent(event);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.addEventListener('status', (e: any) => {
    try {
      const event = JSON.parse(e.data);
      onEvent({ type: 'progress', ...event });
    } catch (err) {
      console.error('Failed to parse status event:', err);
    }
  });

  eventSource.addEventListener('progress', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse progress event:', err);
    }
  });

  eventSource.addEventListener('result', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse result event:', err);
    }
  });

  eventSource.addEventListener('complete', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse complete event:', err);
    }
  });

  eventSource.addEventListener('error', (e: any) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse error event:', err);
    }
  });

  eventSource.onerror = () => {
    if (onError) {
      onError(new Error('SSE connection error'));
    }
  };

  return () => eventSource.close();
}
```

**Step 2: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add API client library"
```

---

## Task 12: Results Store

**Files:**
- Create: `web/src/stores/results.ts`

**Step 1: Create results store**

Create `web/src/stores/results.ts`:
```typescript
import { writable, derived } from 'svelte/store';
import type { Results, Category } from '../../../shared/types';

export const results = writable<Results | null>(null);
export const loading = writable(false);
export const error = writable<string | null>(null);

export const categories: Category[] = [
  'basic',
  'state',
  'block',
  'transaction',
  'filter',
  'archive',
  'bor',
  'erigon',
  'debug',
  'trace',
  'txpool',
  'websocket',
];

export interface EndpointSummary {
  id: string;
  name: string;
  url: string;
  nodeType: string;
  avgResponseMs: number;
  categorySummaries: Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>;
}

export const endpointSummaries = derived(results, ($results): EndpointSummary[] => {
  if (!$results) return [];

  return Object.entries($results.endpoints).map(([id, endpoint]) => {
    const categorySummaries: Record<string, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }> = {};

    for (const category of categories) {
      const methodsInCategory = Object.entries(endpoint.results)
        .filter(([method]) => {
          // Match methods to categories based on naming
          if (category === 'archive') return method.endsWith(':archive');
          if (category === 'websocket') return method.startsWith('eth_subscribe:');
          if (category === 'bor') return method.startsWith('bor_');
          if (category === 'erigon') return method.startsWith('erigon_');
          if (category === 'debug') return method.startsWith('debug_');
          if (category === 'trace') return method.startsWith('trace_');
          if (category === 'txpool') return method.startsWith('txpool_');
          if (category === 'filter') return method.includes('Filter') || method === 'eth_getLogs';
          if (category === 'transaction') return method.includes('Transaction') && !method.includes('Count');
          if (category === 'block') return method.includes('Block') || method.includes('Uncle');
          if (category === 'state') {
            return ['eth_getBalance', 'eth_getStorageAt', 'eth_getTransactionCount', 'eth_getCode', 'eth_call', 'eth_estimateGas', 'eth_createAccessList'].includes(method);
          }
          if (category === 'basic') {
            return method.startsWith('web3_') || method.startsWith('net_') ||
              ['eth_protocolVersion', 'eth_syncing', 'eth_coinbase', 'eth_chainId', 'eth_mining', 'eth_hashrate', 'eth_gasPrice', 'eth_accounts', 'eth_blockNumber', 'eth_maxPriorityFeePerGas', 'eth_feeHistory', 'eth_blobBaseFee'].includes(method);
          }
          return false;
        });

      const passed = methodsInCategory.filter(([, r]) => r.status === 'pass').length;
      const total = methodsInCategory.length;

      let status: 'pass' | 'partial' | 'fail' | 'none' = 'none';
      if (total > 0) {
        if (passed === total) status = 'pass';
        else if (passed > 0) status = 'partial';
        else status = 'fail';
      }

      categorySummaries[category] = { passed, total, status };
    }

    return {
      id,
      name: endpoint.name,
      url: endpoint.url,
      nodeType: endpoint.nodeType,
      avgResponseMs: endpoint.avgResponseMs,
      categorySummaries: categorySummaries as Record<Category, { passed: number; total: number; status: 'pass' | 'partial' | 'fail' | 'none' }>,
    };
  });
});
```

**Step 2: Commit**

```bash
git add web/src/stores/results.ts
git commit -m "feat: add results store with derived summaries"
```

---

## Task 13: Status Badge Component

**Files:**
- Create: `web/src/components/StatusBadge.svelte`

**Step 1: Create StatusBadge component**

Create `web/src/components/StatusBadge.svelte`:
```svelte
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
```

**Step 2: Commit**

```bash
git add web/src/components/StatusBadge.svelte
git commit -m "feat: add StatusBadge component"
```

---

## Task 14: Results Page

**Files:**
- Create: `web/src/pages/Results.svelte`

**Step 1: Create Results page with AG Grid**

Create `web/src/pages/Results.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import 'ag-grid-community/styles/ag-grid.css';
  import 'ag-grid-community/styles/ag-theme-alpine.css';
  import { results, loading, error, endpointSummaries, categories, type EndpointSummary } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';

  let filter = '';
  let gridData: EndpointSummary[] = [];

  $: filteredData = $endpointSummaries.filter(ep =>
    ep.name.toLowerCase().includes(filter.toLowerCase()) ||
    ep.url.toLowerCase().includes(filter.toLowerCase())
  );

  onMount(async () => {
    $loading = true;
    try {
      $results = await fetchResults();
    } catch (e) {
      $error = e instanceof Error ? e.message : 'Failed to load results';
    } finally {
      $loading = false;
    }
  });

  function handleRowClick(endpoint: EndpointSummary) {
    push(`/endpoint/${endpoint.id}`);
  }
</script>

<div class="results-page">
  <div class="header">
    <h2>RPC Endpoint Results</h2>
    {#if $results?.lastRun}
      <span class="last-run">Last run: {new Date($results.lastRun).toLocaleString()}</span>
    {/if}
  </div>

  <div class="controls">
    <input
      type="text"
      placeholder="Filter endpoints..."
      bind:value={filter}
    />
  </div>

  {#if $loading}
    <p class="loading">Loading results...</p>
  {:else if $error}
    <p class="error">{$error}</p>
  {:else if !$results?.lastRun}
    <p class="no-results">No test results yet. Go to Admin to run tests.</p>
  {:else}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="endpoint-col">Endpoint</th>
            {#each categories as category}
              <th class="category-col">{category}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredData as endpoint}
            <tr on:click={() => handleRowClick(endpoint)} class="clickable">
              <td class="endpoint-col">
                <div class="endpoint-info">
                  <span class="name">{endpoint.name}</span>
                  <span class="node-type">{endpoint.nodeType}</span>
                </div>
              </td>
              {#each categories as category}
                <td class="category-col">
                  {@const summary = endpoint.categorySummaries[category]}
                  <StatusBadge
                    status={summary.status}
                    text={summary.total > 0 ? `${summary.passed}/${summary.total}` : ''}
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .results-page {
    padding: 1rem 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .last-run {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .controls {
    margin-bottom: 1rem;
  }

  .controls input {
    width: 300px;
  }

  .loading, .error, .no-results {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--error);
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    background-color: var(--bg-secondary);
    font-weight: 600;
    text-transform: capitalize;
    position: sticky;
    top: 0;
  }

  .endpoint-col {
    min-width: 200px;
  }

  .category-col {
    min-width: 80px;
    text-align: center;
  }

  .clickable {
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .clickable:hover {
    background-color: var(--bg-secondary);
  }

  .endpoint-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    font-weight: 500;
  }

  .node-type {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: capitalize;
  }
</style>
```

**Step 2: Commit**

```bash
git add web/src/pages/Results.svelte
git commit -m "feat: add Results page with summary table"
```

---

## Task 15: Endpoint Detail Page

**Files:**
- Create: `web/src/pages/Endpoint.svelte`

**Step 1: Create Endpoint detail page**

Create `web/src/pages/Endpoint.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { results, loading, error, categories } from '../stores/results';
  import { fetchResults } from '../lib/api';
  import StatusBadge from '../components/StatusBadge.svelte';
  import type { EndpointResults, TestResult, Category } from '../../../shared/types';

  export let params: { id: string } = { id: '' };

  let endpoint: EndpointResults | null = null;
  let filterText = '';
  let filterCategory: Category | 'all' = 'all';
  let filterStatus: 'all' | 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped' = 'all';

  $: if ($results && params.id) {
    endpoint = $results.endpoints[params.id] || null;
  }

  $: methodEntries = endpoint
    ? Object.entries(endpoint.results)
        .filter(([method, result]) => {
          if (filterText && !method.toLowerCase().includes(filterText.toLowerCase())) {
            return false;
          }
          if (filterStatus !== 'all' && result.status !== filterStatus) {
            return false;
          }
          if (filterCategory !== 'all') {
            const cat = getMethodCategory(method);
            if (cat !== filterCategory) return false;
          }
          return true;
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  function getMethodCategory(method: string): Category {
    if (method.endsWith(':archive')) return 'archive';
    if (method.startsWith('eth_subscribe:')) return 'websocket';
    if (method.startsWith('bor_')) return 'bor';
    if (method.startsWith('erigon_')) return 'erigon';
    if (method.startsWith('debug_')) return 'debug';
    if (method.startsWith('trace_')) return 'trace';
    if (method.startsWith('txpool_')) return 'txpool';
    if (method.includes('Filter') || method === 'eth_getLogs') return 'filter';
    if (method.includes('Transaction') && !method.includes('Count')) return 'transaction';
    if (method.includes('Block') || method.includes('Uncle')) return 'block';
    if (['eth_getBalance', 'eth_getStorageAt', 'eth_getTransactionCount', 'eth_getCode', 'eth_call', 'eth_estimateGas', 'eth_createAccessList'].includes(method)) return 'state';
    return 'basic';
  }

  onMount(async () => {
    if (!$results) {
      $loading = true;
      try {
        $results = await fetchResults();
      } catch (e) {
        $error = e instanceof Error ? e.message : 'Failed to load results';
      } finally {
        $loading = false;
      }
    }
  });
</script>

<div class="endpoint-page">
  <a href="/" use:link class="back-link">← Back to Results</a>

  {#if $loading}
    <p class="loading">Loading...</p>
  {:else if $error}
    <p class="error">{$error}</p>
  {:else if !endpoint}
    <p class="not-found">Endpoint not found</p>
  {:else}
    <div class="endpoint-header">
      <h2>{endpoint.name}</h2>
      <div class="endpoint-meta">
        <span class="url">{endpoint.url}</span>
        <span class="node-type">Node Type: <strong>{endpoint.nodeType}</strong></span>
        <span class="avg-response">Avg Response: <strong>{endpoint.avgResponseMs}ms</strong></span>
      </div>
    </div>

    <div class="controls">
      <input
        type="text"
        placeholder="Filter methods..."
        bind:value={filterText}
      />
      <select bind:value={filterCategory}>
        <option value="all">All Categories</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <select bind:value={filterStatus}>
        <option value="all">All Statuses</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="timeout">Timeout</option>
        <option value="unsupported">Unsupported</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>

    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Category</th>
          <th>Status</th>
          <th>Response Time</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {#each methodEntries as [method, result]}
          <tr>
            <td class="method">{method}</td>
            <td class="category">{getMethodCategory(method)}</td>
            <td><StatusBadge status={result.status} /></td>
            <td class="response-time">
              {result.responseMs ? `${result.responseMs}ms` : '—'}
            </td>
            <td class="error-cell">{result.error || '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .endpoint-page {
    padding: 1rem 0;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
  }

  .loading, .error, .not-found {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--error);
  }

  .endpoint-header {
    margin-bottom: 1.5rem;
  }

  .endpoint-header h2 {
    margin-bottom: 0.5rem;
  }

  .endpoint-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .url {
    font-family: monospace;
    background-color: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .controls input {
    width: 250px;
  }

  .controls select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    background-color: var(--bg-secondary);
    font-weight: 600;
  }

  .method {
    font-family: monospace;
    font-weight: 500;
  }

  .category {
    text-transform: capitalize;
    color: var(--text-secondary);
  }

  .response-time {
    font-family: monospace;
  }

  .error-cell {
    color: var(--error);
    font-size: 0.75rem;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
```

**Step 2: Commit**

```bash
git add web/src/pages/Endpoint.svelte
git commit -m "feat: add Endpoint detail page"
```

---

## Task 16: Admin Page

**Files:**
- Create: `web/src/pages/Admin.svelte`

**Step 1: Create Admin page**

Create `web/src/pages/Admin.svelte`:
```svelte
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
        } else if (event.type === 'error') {
          isRunning = false;
          error = event.error || 'Test run failed';
        } else if (event.type === 'progress') {
          progress = event;
        } else if (event.type === 'result') {
          progressLog = [...progressLog.slice(-99), event];
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
      error = 'Please enter the admin password';
      return;
    }

    error = null;
    progressLog = [];

    try {
      await startTestRun(password);
      isRunning = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to start tests';
    }
  }
</script>

<div class="admin-page">
  <h2>Admin Panel</h2>

  <div class="section">
    <h3>Run Tests</h3>

    <div class="password-input">
      <label for="password">Admin Password:</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="Enter password"
      />
    </div>

    <button
      class="primary"
      on:click={handleStartTests}
      disabled={isRunning}
    >
      {isRunning ? 'Tests Running...' : 'Start Test Run'}
    </button>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  {#if isRunning && progress}
    <div class="section">
      <h3>Progress</h3>
      <div class="progress-info">
        <span>Endpoint: <strong>{progress.endpoint}</strong></span>
        <span>Category: <strong>{progress.category}</strong></span>
        <span>Progress: <strong>{progress.completed}/{progress.total}</strong></span>
      </div>
    </div>
  {/if}

  {#if progressLog.length > 0}
    <div class="section">
      <h3>Recent Results</h3>
      <div class="log">
        {#each progressLog as event}
          <div class="log-entry {event.status}">
            <span class="method">{event.method}</span>
            <span class="status">{event.status}</span>
            {#if event.responseMs}
              <span class="time">{event.responseMs}ms</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-page {
    padding: 1rem 0;
    max-width: 800px;
  }

  h2 {
    margin-bottom: 1.5rem;
  }

  .section {
    background-color: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .section h3 {
    margin-bottom: 1rem;
  }

  .password-input {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .password-input input {
    flex: 1;
    max-width: 300px;
  }

  .error {
    color: var(--error);
    margin-top: 1rem;
  }

  .progress-info {
    display: flex;
    gap: 2rem;
  }

  .log {
    max-height: 300px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.75rem;
  }

  .log-entry {
    display: flex;
    gap: 1rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--border);
  }

  .log-entry.pass { color: var(--success); }
  .log-entry.fail { color: var(--error); }
  .log-entry.timeout { color: var(--warning); }
  .log-entry.unsupported { color: var(--text-secondary); }

  .method {
    flex: 1;
  }

  .status {
    width: 100px;
  }

  .time {
    width: 80px;
    text-align: right;
  }
</style>
```

**Step 2: Commit**

```bash
git add web/src/pages/Admin.svelte
git commit -m "feat: add Admin page with test runner controls"
```

---

## Task 17: Dev Script

**Files:**
- Create: `scripts/dev.ts`

**Step 1: Create dev script to run both servers**

Create `scripts/dev.ts`:
```typescript
import { spawn } from 'child_process';

const server = spawn('npm', ['run', 'dev:server'], {
  stdio: 'inherit',
  shell: true,
});

const web = spawn('npm', ['run', 'dev:web'], {
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  server.kill();
  web.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  web.kill();
  process.exit();
});
```

**Step 2: Create .env file for development**

Create `.env`:
```
ADMIN_PASSWORD=admin123
PORT=3000
```

**Step 3: Commit (excluding .env)**

```bash
git add scripts/dev.ts
git commit -m "feat: add dev script to run both servers"
```

---

## Task 18: Final Integration Test

**Step 1: Install additional Svelte dependencies**

```bash
npm install -D @tsconfig/svelte svelte-check
```

**Step 2: Start the dev server**

```bash
npm run dev
```

**Step 3: Verify the application**

1. Open http://localhost:5173
2. Verify the Results page loads (should show "No test results yet")
3. Go to Admin page
4. Enter password "admin123"
5. Click "Start Test Run"
6. Watch progress updates via SSE
7. After completion, go back to Results page
8. Verify results table shows endpoints with category summaries
9. Click an endpoint to see detail page

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration and cleanup"
```

---

## Summary

This implementation plan creates a complete Polygon RPC testing tool with:

1. **Backend:** Express server with viem for RPC calls, JSON storage, SSE progress
2. **Frontend:** Svelte SPA with results table, endpoint details, admin panel
3. **Features:**
   - Tests ~21 public RPC endpoints
   - Comprehensive method coverage across 12 categories
   - Archive vs full node detection
   - Real-time progress via SSE
   - Password-protected admin endpoints
   - Configurable delays and timeouts

**Total tasks:** 18
**Estimated commits:** 18
