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
