# Polygon RPC Endpoint Tester - Design Document

## Overview

A Polygon RPC endpoint testing tool that tests multiple public RPC providers against a comprehensive list of JSON-RPC methods, identifies node capabilities (archive vs full), and displays results in an interactive table.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Svelte SPA                           │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ Results Table   │  │ Admin Panel                 │   │
│  │ (AG Grid)       │  │ - Trigger tests             │   │
│  │ - Sort/Filter   │  │ - View progress             │   │
│  │ - Group by      │  │ - Edit config               │   │
│  └─────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │ HTTP / SSE
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Node.js Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Test Runner │  │ Config      │  │ Results Store   │  │
│  │ (viem)      │  │ (JSON file) │  │ (JSON file)     │  │
│  │ HTTP + WSS  │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** Svelte + TypeScript + Vite + AG Grid
- **Backend:** Node.js + Express + viem
- **Storage:** JSON files (config.json, results.json)
- **Progress:** Server-Sent Events (SSE)
- **Dev:** `npm run dev` starts both frontend and backend

## Test Categories

| Category | Purpose | Example Methods |
|----------|---------|-----------------|
| **basic** | Core functionality | `eth_blockNumber`, `eth_chainId`, `net_version` |
| **state** | Read blockchain state | `eth_getBalance`, `eth_getCode`, `eth_call` |
| **block** | Block data access | `eth_getBlockByNumber`, `eth_getBlockByHash` |
| **transaction** | Tx handling | `eth_getTransactionByHash`, `eth_getTransactionReceipt` |
| **filter** | Log filtering | `eth_getLogs`, `eth_newFilter` |
| **archive** | Historical state (>1 year old) | `eth_getBalance:archive`, `eth_call:archive` |
| **bor** | Polygon/Bor consensus | `bor_getAuthor`, `bor_getCurrentValidators` |
| **erigon** | Erigon extensions | `erigon_forks`, `erigon_getHeaderByNumber` |
| **debug** | Debug methods | `debug_traceTransaction`, `debug_traceCall` |
| **trace** | Trace methods | `trace_call`, `trace_block` |
| **txpool** | Transaction pool | `txpool_content`, `txpool_status` |
| **websocket** | Subscription support | `eth_subscribe:newHeads`, `eth_subscribe:logs` |

> **Implementation note:** Research Bor and Erigon documentation to compile an exhaustive list of all supported JSON-RPC methods for each category.

## Test Result States

- ✅ **Pass** - Method works, response valid
- ❌ **Fail** - Method exists but returned error
- ⚠️ **Timeout** - No response within threshold (default 10s)
- 🚫 **Unsupported** - Method not implemented
- ⏭️ **Skipped** - Depends on failed prerequisite

## Archive Node Detection

- Use a hardcoded block from ~1.5 years ago (e.g., block 35,000,000 from early 2023)
- Test `eth_getBalance` for a known address at that block
- If successful → archive node; if error → full node

## UI Layout

### Main Results Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Polygon RPC Tester                              [Admin] [Last run: ...]│
├─────────────────────────────────────────────────────────────────────────┤
│  Filter: [________]   Group by: [Category ▼]   Show: [All ▼]            │
├──────────────────┬───────┬───────┬───────┬───────┬───────┬──────┬───────┤
│  Endpoint        │ Basic │ State │ Block │Archive│  Bor  │Erigon│ Debug │
├──────────────────┼───────┼───────┼───────┼───────┼───────┼──────┼───────┤
│ ▶ ankr.com       │ 5/5 ✅│ 8/8 ✅│ 6/6 ✅│ 0/3 ❌│ 4/4 ✅│ 0/3 🚫│ 2/5 ⚠️│
│ ▶ polygon-rpc.com│ 5/5 ✅│ 8/8 ✅│ 6/6 ✅│ 3/3 ✅│ 4/4 ✅│ 0/3 🚫│ 0/5 🚫│
│ ...              │       │       │       │       │       │      │       │
└──────────────────┴───────┴───────┴───────┴───────┴───────┴──────┴───────┘
```

### Endpoint Detail Page (click on a row)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back    ankr.com/polygon                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  URL: https://rpc.ankr.com/polygon                                      │
│  Node Type: Full Node (no archive)                                      │
│  Last Tested: 2026-01-20 14:30:00     Response Time (avg): 245ms        │
├─────────────────────────────────────────────────────────────────────────┤
│  Filter: [________]    Category: [All ▼]    Status: [All ▼]             │
├──────────────────────────┬──────────┬───────────┬───────────────────────┤
│  Method                  │ Category │  Status   │  Response Time        │
├──────────────────────────┼──────────┼───────────┼───────────────────────┤
│  eth_blockNumber         │ Basic    │  ✅ Pass  │  120ms                │
│  eth_getBalance (archive)│ Archive  │  ❌ Fail  │  --                   │
│  ...                     │          │           │                       │
└──────────────────────────┴──────────┴───────────┴───────────────────────┘
```

### Routes

- `/` - Main results table
- `/endpoint/:id` - Endpoint detail page
- `/admin` - Admin panel (trigger tests, edit config)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/results` | No | Get latest test results |
| `GET` | `/api/config` | Yes | Get current config |
| `PUT` | `/api/config` | Yes | Update config |
| `POST` | `/api/tests/run` | Yes | Start a test run |
| `GET` | `/api/tests/status` | No | Get current test run progress |
| `GET` | `/api/tests/progress` | No | SSE stream for real-time progress |

### Authentication

- Password-based auth via `Authorization: Bearer <password>` header
- Password set via environment variable `ADMIN_PASSWORD`
- Admin endpoints return `401 Unauthorized` if password missing/incorrect

### SSE Progress Stream

```
GET /api/tests/progress

event: progress
data: {"endpoint":"ankr","category":"basic","completed":5,"total":17}

event: result
data: {"endpoint":"ankr","method":"eth_blockNumber","status":"pass","responseMs":120}

event: complete
data: {"runDurationMs":45000}
```

## Config File Format

**`config.json`:**

```json
{
  "endpoints": [
    { "url": "https://rpc.ankr.com/polygon", "name": "Ankr" },
    { "url": "wss://polygon-bor-rpc.publicnode.com", "name": "PublicNode (WSS)" }
  ],
  "testSettings": {
    "timeoutMs": 10000,
    "delayBetweenCallsMs": 100,
    "archiveBlockNumber": 35000000,
    "archiveTestAddress": "0x0000000000000000000000000000000000001010",
    "concurrency": 5
  },
  "methods": {
    "basic": ["eth_blockNumber", "eth_chainId", "..."],
    "state": ["eth_getBalance", "eth_call", "..."],
    "block": ["eth_getBlockByNumber", "..."],
    "transaction": ["eth_getTransactionByHash", "..."],
    "filter": ["eth_getLogs", "eth_newFilter", "..."],
    "archive": ["eth_getBalance:archive", "eth_call:archive", "..."],
    "bor": ["bor_getAuthor", "bor_getCurrentValidators", "..."],
    "erigon": ["erigon_forks", "erigon_getHeaderByNumber", "..."],
    "debug": ["debug_traceTransaction", "debug_traceCall", "..."],
    "trace": ["trace_call", "trace_block", "..."],
    "txpool": ["txpool_content", "txpool_status", "..."],
    "websocket": ["eth_subscribe:newHeads", "eth_subscribe:logs", "..."]
  }
}
```

## Results File Format

**`results.json`:**

```json
{
  "lastRun": "2026-01-20T14:30:00Z",
  "runDurationMs": 45000,
  "endpoints": {
    "ankr": {
      "url": "https://rpc.ankr.com/polygon",
      "nodeType": "full",
      "avgResponseMs": 245,
      "results": {
        "eth_blockNumber": { "status": "pass", "responseMs": 120 },
        "eth_getBalance:archive": { "status": "fail", "error": "missing trie node" }
      }
    }
  }
}
```

## Test Runner Logic

```
1. Load config (endpoints + methods)
2. For each endpoint (up to `concurrency` in parallel):
   a. For each method category:
      - For each method in category:
        - Execute RPC call with timeout
        - Wait `delayBetweenCallsMs`
        - Record result (status, responseMs, error)
      - Broadcast progress via SSE
   b. Classify node type (archive/full) based on archive test results
3. Save results.json
4. Broadcast completion
```

## Project File Structure

```
polygon-rpc-tests/
├── package.json
├── .env.example                 # ADMIN_PASSWORD=...
├── config.json                  # Default RPC endpoints and methods
├── results.json                 # Test results (generated)
│
├── server/
│   ├── index.ts                 # Express server entry point
│   ├── routes/
│   │   ├── results.ts           # GET /api/results
│   │   ├── config.ts            # GET/PUT /api/config (protected)
│   │   └── tests.ts             # POST /api/tests/run, GET status, SSE progress
│   ├── middleware/
│   │   └── auth.ts              # Password auth middleware
│   ├── services/
│   │   ├── testRunner.ts        # Main test execution logic
│   │   ├── rpcClient.ts         # viem HTTP + WSS client wrapper
│   │   └── storage.ts           # Read/write config.json and results.json
│   └── types.ts                 # Shared TypeScript types
│
├── web/
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.svelte           # Main app with routing
│   │   ├── main.ts              # Entry point
│   │   ├── pages/
│   │   │   ├── Results.svelte   # Main results table
│   │   │   ├── Endpoint.svelte  # Endpoint detail page
│   │   │   └── Admin.svelte     # Admin panel
│   │   ├── components/
│   │   │   ├── ResultsTable.svelte
│   │   │   ├── ProgressBar.svelte
│   │   │   └── StatusBadge.svelte
│   │   ├── lib/
│   │   │   └── api.ts           # API client functions
│   │   └── stores/
│   │       └── results.ts       # Svelte store for results
│   └── public/
│
└── scripts/
    └── dev.ts                   # Starts both server and web dev server
```

## npm Scripts

```json
{
  "dev": "tsx scripts/dev.ts",
  "build": "npm run build:server && npm run build:web",
  "start": "node dist/server/index.js"
}
```

## Default RPC Endpoints

Extract from provided list (HTTP only for v1, WSS support included):

- https://rpc.ankr.com/polygon (Ankr)
- https://polygon-rpc.com
- https://rpc-mainnet.matic.quiknode.pro (QuickNode)
- https://polygon-public.nodies.app (Nodies)
- https://polygon-mainnet.public.blastapi.io (BlastAPI)
- https://1rpc.io/matic (1RPC)
- https://polygon-mainnet.rpcfast.com?api_key=xbhWBI1Wkguk8SNMu1bvvLurPGLXmgwYeC4S6g2H7WdwFigZSmPWVZRxrskEQwIf (RPCFast)
- https://polygon-bor-rpc.publicnode.com (PublicNode)
- wss://polygon-bor-rpc.publicnode.com (PublicNode WSS)
- https://polygon-mainnet.g.alchemy.com/v2/demo (Alchemy)
- https://go.getblock.io/02667b699f05444ab2c64f9bff28f027 (GetBlock)
- https://polygon.api.onfinality.io/public (OnFinality)
- https://polygon.rpc.blxrbdn.com/ (bloXroute)
- https://polygon.drpc.org (dRPC)
- https://polygon.gateway.tenderly.co (Tenderly)
- https://gateway.tenderly.co/public/polygon (Tenderly Public)
- https://api.zan.top/polygon-mainnet (ZAN)
- https://polygon.meowrpc.com (MeowRPC)
- https://public.stackup.sh/api/v1/node/polygon-mainnet (Stackup)
- https://polygon-mainnet.gateway.tatum.io (Tatum)
- https://polygon.rpc.subquery.network/public (SubQuery)
- https://polygon-mainnet.4everland.org/v1/37fa9972c1b1cd5fab542c7bdd4cde2f (4everland)
- wss://polygon-mainnet.4everland.org/ws/v1/37fa9972c1b1cd5fab542c7bdd4cde2f (4everland WSS)
- https://endpoints.omniatech.io/v1/matic/mainnet/public (Omnia)
- https://polygon.lava.build (Lava)
- https://rpc.owlracle.info/poly/70d38ce1826c4a60bb2a8e05a6c8b20f (Owlracle)
- https://polygon.therpc.io (TheRPC)
- https://rpc.poolz.finance/polygon (Poolz)
- https://poly.api.pocket.network (Pocket Network)
- https://api-polygon-mainnet-full.n.dwellir.com/2ccf18bf-2916-4198-8856-42172854353c (Dwellir)

## Out of Scope for v1

- Client-side testing (users adding their own RPC in browser)
- Docker packaging
- Database storage
- User accounts
