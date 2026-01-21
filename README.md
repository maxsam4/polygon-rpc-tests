# Polygon RPC Endpoint Tester

A comprehensive testing tool for Polygon RPC endpoints. Tests multiple public RPC providers against JSON-RPC methods, identifies node capabilities (archive vs full), and displays results in an interactive web UI.

## Features

- **Comprehensive RPC Testing**: Tests 70+ JSON-RPC methods across 11 categories
- **Multiple Endpoints**: Pre-configured with 21 public Polygon RPC providers
- **Archive Node Detection**: Identifies archive vs full nodes via historical state queries
- **Real-time Progress**: SSE-based live updates during test runs
- **Interactive UI**: Svelte-based web interface with filtering and sorting
- **Live Benchmark**: Real-time RPC performance comparison with charts
- **Independent Tests**: Vitest-based test suite for CI/CD integration
- **Configurable**: JSON-based configuration for endpoints and test parameters

## Quick Start

### Prerequisites

- Node.js 20.19+
- npm

### Installation

```bash
git clone <repo>
cd polygon-rpc-tests
npm install --legacy-peer-deps
```

### Running the Web UI

```bash
# Create .env file
echo "ADMIN_PASSWORD=admin123" > .env
echo "PORT=3000" >> .env

# Start development servers
npm run dev
```

Open http://localhost:5173 in your browser.

### Running Tests

```bash
# Run all RPC tests (uses DRPC by default)
npm test

# Run specific category
npm run test:basic
npm run test:state
npm run test:archive

# Test against a specific endpoint
RPC_URL="https://polygon-bor-rpc.publicnode.com" npm test
RPC_URL="https://your-private-rpc.com" npm run test:debug
```

## Project Structure

```
polygon-rpc-tests/
├── server/                    # Express backend
│   ├── index.ts              # Server entry point
│   ├── middleware/
│   │   └── auth.ts           # Password authentication
│   ├── routes/
│   │   ├── results.ts        # GET /api/results
│   │   ├── config.ts         # GET/PUT /api/config (protected)
│   │   └── tests.ts          # Test run endpoints + SSE
│   └── services/
│       ├── rpcClient.ts      # RPC call execution
│       ├── testRunner.ts     # Test orchestration
│       └── storage.ts        # JSON file persistence
├── web/                       # Svelte frontend
│   └── src/
│       ├── pages/
│       │   ├── Results.svelte    # Main results table
│       │   ├── Endpoint.svelte   # Endpoint detail view
│       │   ├── Admin.svelte      # Admin panel
│       │   └── Benchmark.svelte  # Live benchmark page
│       ├── components/
│       │   ├── StatusBadge.svelte
│       │   └── BenchmarkChart.svelte  # Chart.js wrapper
│       ├── stores/
│       │   ├── results.ts    # Svelte stores
│       │   └── benchmark.ts  # Benchmark polling state
│       └── lib/
│           └── api.ts        # API client
├── tests/                     # Vitest test suite
│   └── rpc/
│       ├── helpers.ts        # Test utilities
│       ├── basic.test.ts     # Basic methods (eth_blockNumber, etc.)
│       ├── state.test.ts     # State methods (eth_getBalance, etc.)
│       ├── block.test.ts     # Block methods
│       ├── transaction.test.ts
│       ├── filter.test.ts
│       ├── archive.test.ts   # Archive node tests
│       ├── bor.test.ts       # Polygon/Bor specific
│       ├── erigon.test.ts    # Erigon specific
│       ├── debug.test.ts     # Debug methods
│       ├── trace.test.ts     # Trace methods
│       └── txpool.test.ts    # TxPool methods
├── shared/
│   └── types.ts              # Shared TypeScript types
├── config.json               # RPC endpoints and method definitions
└── package.json
```

## Test Categories

| Category | Description | Example Methods |
|----------|-------------|-----------------|
| **basic** | Core functionality | `eth_blockNumber`, `eth_chainId`, `net_version` |
| **state** | Read blockchain state | `eth_getBalance`, `eth_getCode`, `eth_call` |
| **block** | Block data access | `eth_getBlockByNumber`, `eth_getBlockByHash` |
| **transaction** | Transaction handling | `eth_getTransactionByHash`, `eth_getTransactionReceipt` |
| **filter** | Log filtering | `eth_getLogs`, `eth_newFilter` |
| **archive** | Historical state (old blocks) | `eth_getBalance:archive`, `eth_call:archive` |
| **bor** | Polygon/Bor consensus | `bor_getAuthor`, `bor_getCurrentValidators` |
| **erigon** | Erigon extensions | `erigon_forks`, `erigon_getHeaderByNumber` |
| **debug** | Debug methods | `debug_traceTransaction`, `debug_traceCall` |
| **trace** | Trace methods | `trace_call`, `trace_block` |
| **txpool** | Transaction pool | `txpool_content`, `txpool_status` |

## Benchmark Page

The `/benchmark` page provides real-time performance comparison of RPC endpoints:

- **Live Polling**: Calls `eth_blockNumber` on all endpoints at configurable intervals (default: 1s)
- **Block Number Chart**: Shows which endpoints are returning the latest blocks
- **Response Time Chart**: Visualizes latency across all endpoints
- **Reliability Metrics**: Tracks success rate over time
- **Temporary Endpoints**: Add custom RPC URLs for comparison

Navigate to `http://localhost:5173/#/benchmark` to access the benchmark page.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/results` | No | Get latest test results |
| `GET` | `/api/config` | Yes | Get current config |
| `PUT` | `/api/config` | Yes | Update config |
| `POST` | `/api/tests/run` | Yes | Start a test run |
| `GET` | `/api/tests/status` | No | Get current test status |
| `GET` | `/api/tests/progress` | No | SSE stream for real-time progress |

Authentication uses Bearer token: `Authorization: Bearer <ADMIN_PASSWORD>`

## Configuration

### config.json

```json
{
  "endpoints": [
    { "url": "https://polygon.drpc.org", "name": "dRPC" },
    { "url": "https://polygon-bor-rpc.publicnode.com", "name": "PublicNode" }
  ],
  "testSettings": {
    "timeoutMs": 10000,
    "delayBetweenCallsMs": 100,
    "archiveBlockNumber": 35000000,
    "archiveTestAddress": "0x0000000000000000000000000000000000001010",
    "concurrency": 5
  },
  "methods": {
    "basic": ["eth_blockNumber", "eth_chainId", ...],
    "state": ["eth_getBalance", "eth_call", ...],
    ...
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | Required | Password for admin endpoints |
| `PORT` | `3000` | Server port |
| `RPC_URL` | `https://polygon.drpc.org` | Default RPC URL for tests |

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend dev servers |
| `npm run dev:server` | Start backend only (with hot reload) |
| `npm run dev:web` | Start frontend only |
| `npm test` | Run all RPC tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:basic` | Run basic RPC tests only |
| `npm run test:archive` | Run archive node tests only |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## Pre-configured RPC Endpoints

The tool comes with 21 pre-configured public Polygon RPC endpoints:

- dRPC, PublicNode, BlastAPI, 1RPC
- Alchemy (demo), Tenderly, ZAN, MeowRPC
- Stackup, SubQuery, Omnia, Lava
- TheRPC, Pocket Network, and more

## Test Result States

| Status | Icon | Description |
|--------|------|-------------|
| Pass | ✅ | Method works, response valid |
| Fail | ❌ | Method exists but returned error |
| Timeout | ⚠️ | No response within threshold |
| Unsupported | 🚫 | Method not implemented |
| Skipped | ⏭️ | Depends on failed prerequisite |

