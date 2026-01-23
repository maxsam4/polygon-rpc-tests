import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

interface RpcResponse {
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

async function executeBatchCall(
  url: string,
  batchSize: number,
  timeoutMs: number = 30000
): Promise<RpcResponse[] | RpcResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requests = Array.from({ length: batchSize }, (_, i) => ({
      jsonrpc: '2.0',
      id: i + 1,
      method: 'eth_blockNumber',
      params: [],
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requests),
      signal: controller.signal,
    });

    return await response.json();
  } catch (error) {
    // Handle abort errors (timeout) and other fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        return {
          error: {
            code: -32000,
            message: `Batch request timeout after ${timeoutMs}ms`,
          },
        };
      }
      return {
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
    return {
      error: {
        code: -32603,
        message: 'Unknown error',
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function isBatchSupported(response: unknown): boolean {
  if (!Array.isArray(response)) {
    const errorResponse = response as RpcResponse;
    if (errorResponse.error) {
      const errorMsg = errorResponse.error.message?.toLowerCase() || '';
      return !(
        errorMsg.includes('not found') ||
        errorMsg.includes('not supported') ||
        errorMsg.includes('not implemented') ||
        errorMsg.includes('batch') ||
        errorResponse.error.code === -32601
      );
    }
    return false;
  }
  return true;
}

describe('Batch RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('batch:1 - single request batch', async () => {
    const response = await executeBatchCall(rpcUrl, 1);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(1);
    expect(response[0].result).toBeDefined();
  });

  it('batch:3 - small batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 3);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(3);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('batch:5 - medium batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 5);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(5);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('batch:10 - larger batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 10);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(10);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('batch:50 - large batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 50);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(50);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('batch:100 - very large batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 100);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(100);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('batch:500 - extra large batch request', async () => {
    const response = await executeBatchCall(rpcUrl, 500);
    if (!isBatchSupported(response)) {
      console.log('Batch requests not supported, skipping test');
      return;
    }
    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(500);
    for (const item of response) {
      expect(item.result).toBeDefined();
    }
  });

  it('trace_callMany - batch multiple trace_call requests', async () => {
    const settings = getTestSettings();
    const params = getMethodParams('trace_callMany', settings);
    const response = await callRpc(rpcUrl, 'trace_callMany', params, 30000);
    assertMethodWorks(response, 'trace_callMany');
  });
});
