# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User instructions

- Always try to deduplicate code as much as possible and make use of common base functions
- Add tests for changes you make and run the new tests to verify things are working after you're done with changes. Don't run full test suite unless requested.
- Remove planning files after you're done implementing them
- When you add new methods, also add corresponding archive method targeting block 35m
- For non-archive methods: use data from current block - 10 (latestData in testRunner) for stability
- For archive methods: use hardcoded data from block 35m (KNOWN_BLOCK_HASH, KNOWN_TX_HASH)
- commit changes after you're done
- Update readme.md after changes
- Update claude.md with notes you think will be helpful later or mistakes i corrected. Keep claude.md succinct.

## Project Overview

Polygon RPC Endpoint Tester - A comprehensive testing tool that evaluates multiple Polygon RPC providers against 70+ JSON-RPC methods across 11 categories. Features an interactive web UI with real-time progress updates via SSE.

**Tech Stack:** Svelte 5 + TypeScript + Vite (frontend), Node.js + Express 5 + viem (backend), Vitest (testing)

## Common Commands

```bash
# Development (starts both backend:3000 and frontend:5173)
npm run dev

# Run all tests against default RPC (polygon.drpc.org)
npm test

# Run category-specific tests
npm run test:basic     # eth_blockNumber, etc.

# Build for production
npm run build
npm start

# Note: Install with --legacy-peer-deps due to dependency compatibility
npm install --legacy-peer-deps
```

## Architecture

```
server/              Express backend (port 3000)
├── routes/          API endpoints (/api/results, /api/config, /api/tests/*)
├── services/
│   ├── rpcClient.ts    HTTP RPC execution with timeout handling
│   ├── testRunner.ts   Test orchestration, concurrency, SSE broadcasting
│   └── storage.ts      JSON file persistence (config.json, results.json)
└── middleware/auth.ts  Bearer token authentication (ADMIN_PASSWORD env)

web/                 Svelte frontend (port 5173, proxies to backend)
├── pages/           Results.svelte, Endpoint.svelte, Admin.svelte
├── stores/results.ts   Svelte stores with derived category summaries
└── lib/api.ts          Fetch wrappers + SSE subscription

tests/rpc/           Vitest test suite (30s timeout per test)
├── helpers.ts          callRpc(), assertMethodWorks() utilities
└── *.test.ts           Category-specific test files

shared/types.ts      Shared TypeScript interfaces
```

**Data Flow:** Admin UI → /api/tests/run → testRunner (concurrent RPC calls) → saveResults() → SSE broadcast → UI updates

**Concurrency:** Endpoints processed in chunks (default 5), methods within categories run sequentially with configurable delay.

## Key Patterns

- **Archive Node Detection:** Tests state methods against block 35,000,000. All pass = archive node, any fail = full node.
- **Error Classification:** Distinguishes "method not supported" vs "method failed" vs "timeout" in test results.
- **SSE Real-time Updates:** /api/tests/progress streams results to all connected clients.
- **Test Address:** Uses `0x0000000000000000000000000000000000001010` (Polygon system contract) for state queries.

## Environment Variables

```
ADMIN_PASSWORD    # Required - Bearer token for /api/config and /api/tests/* endpoints
PORT              # Server port (default: 3000)
RPC_URL           # Default RPC for vitest tests (default: https://polygon.drpc.org)
```

## Test Categories

| Category | Methods | Purpose |
|----------|---------|---------|
| basic | 17 | Core RPC methods (web3_*, net_*, eth_blockNumber) |
| state | 7 | Account state (eth_getBalance, eth_call) |
| block | 9 | Block retrieval methods |
| transaction | 4 | Transaction retrieval |
| filter | 7 | Event filtering and logs |
| archive | 5 | Historical state (requires archive node) |
| bor | 5 | Polygon-specific consensus methods |
| debug | 9 | Debug tracing methods |
| trace | 9 | trace_* methods |
| txpool | 3 | Transaction pool inspection |
