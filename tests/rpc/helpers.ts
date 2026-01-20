import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config, TestSettings } from '../../shared/types.js';

// Load config for default settings
const configPath = join(process.cwd(), 'config.json');
const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

// Default to first endpoint in config, can be overridden via environment variable
export function getRpcUrl(): string {
  return process.env.RPC_URL || config.endpoints[0].url;
}

export function getTestSettings(): TestSettings {
  return config.testSettings;
}

export interface RpcResponse {
  result?: unknown;
  error?: { code: number; message: string };
}

export async function callRpc(
  url: string,
  method: string,
  params: unknown[] = [],
  timeoutMs: number = 10000
): Promise<RpcResponse> {
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

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isMethodSupported(response: RpcResponse): boolean {
  if (!response.error) return true;

  const errorMsg = response.error.message?.toLowerCase() || '';
  const unsupportedCodes = [-32601, -32600];

  if (unsupportedCodes.includes(response.error.code)) return false;
  if (errorMsg.includes('not found')) return false;
  if (errorMsg.includes('not supported')) return false;
  if (errorMsg.includes('not implemented')) return false;
  if (errorMsg.includes('method not available')) return false;
  if (errorMsg.includes('does not exist')) return false;

  return true;
}

export function assertMethodWorks(response: RpcResponse, method: string): void {
  if (!isMethodSupported(response)) {
    throw new Error(`Method ${method} is not supported: ${response.error?.message}`);
  }

  if (response.error) {
    // Some errors are expected (e.g., invalid params for test data)
    // but the method itself works
    const acceptableErrors = [
      'invalid argument',
      'missing value',
      'invalid params',
      'execution reverted',
      'invalid block number',
      'block not found',
      'transaction not found',
      'filter not found',
    ];

    const errorMsg = response.error.message?.toLowerCase() || '';
    const isAcceptable = acceptableErrors.some(e => errorMsg.includes(e));

    if (!isAcceptable) {
      throw new Error(`Method ${method} failed: ${response.error.message}`);
    }
  }
}
