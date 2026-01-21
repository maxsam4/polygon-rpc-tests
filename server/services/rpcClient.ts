import type { TestResult } from '../../shared/types.js';

// Re-export from shared module for backward compatibility
export { getMethodParams, getActualMethod } from '../../shared/rpcParams.js';

interface RpcResponse {
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Truncate a response to a maximum length string representation.
 */
function truncateResponse(response: unknown, maxLength: number): string {
  const str = JSON.stringify(response);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
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

    return { status: 'pass', responseMs, response: truncateResponse(data.result, 100) };
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

/**
 * Execute a batch RPC call with N eth_blockNumber requests.
 * Tests batch request support and validates all responses are returned.
 */
export async function executeBatchCall(
  url: string,
  batchSize: number,
  timeoutMs: number
): Promise<TestResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Build array of N eth_blockNumber requests
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

    const responseMs = Date.now() - start;
    const data = await response.json();

    // Check if batch is not supported (returns single error object)
    if (!Array.isArray(data)) {
      if (data.error) {
        const errorMsg = data.error.message?.toLowerCase() || '';
        if (
          errorMsg.includes('not found') ||
          errorMsg.includes('not supported') ||
          errorMsg.includes('not implemented') ||
          errorMsg.includes('batch') ||
          data.error.code === -32601
        ) {
          return { status: 'unsupported', error: data.error.message };
        }
        return { status: 'fail', responseMs, error: data.error.message };
      }
      return { status: 'fail', responseMs, error: 'Expected array response for batch request' };
    }

    // Validate we got all responses
    if (data.length !== batchSize) {
      return {
        status: 'fail',
        responseMs,
        error: `Expected ${batchSize} responses, got ${data.length}`,
      };
    }

    // Check all responses are valid
    for (const item of data as RpcResponse[]) {
      if (item.error) {
        return { status: 'fail', responseMs, error: `Batch item error: ${item.error.message}` };
      }
      if (item.result === undefined) {
        return { status: 'fail', responseMs, error: 'Batch item missing result' };
      }
    }

    return {
      status: 'pass',
      responseMs,
      response: truncateResponse(`${batchSize} responses received`, 100),
    };
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
