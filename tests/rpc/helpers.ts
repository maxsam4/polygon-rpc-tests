import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config, TestSettings, LatestData } from '../../shared/types.js';

// Re-export from shared module so tests can use the same params as production
export { getMethodParams, getActualMethod, getSubscriptionParams, KNOWN_BLOCK_HASH, KNOWN_TX_HASH } from '../../shared/rpcParams.js';

// Load config for default settings
const configPath = join(process.cwd(), 'config.json');
const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

// Default to DRPC (reliable free tier), can be overridden via environment variable
export function getRpcUrl(): string {
  return process.env.RPC_URL || 'https://polygon.drpc.org';
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
  if (errorMsg.includes('invalid method')) return false;

  return true;
}

// Check if error is due to tier/access restrictions (not a method failure)
export function isTierRestricted(response: RpcResponse): boolean {
  if (!response.error) return false;

  const errorMsg = response.error.message?.toLowerCase() || '';
  return (
    errorMsg.includes('freetier') ||
    errorMsg.includes('free tier') ||
    errorMsg.includes('api key') ||
    errorMsg.includes('upgrade') ||
    errorMsg.includes('not allowed')
  );
}

// Check if error is due to archive node limitations (provider doesn't have full history)
export function isArchiveLimited(response: RpcResponse): boolean {
  if (!response.error) return false;

  const errorMsg = response.error.message?.toLowerCase() || '';
  return (
    errorMsg.includes('haven\'t been fully indexed') ||
    errorMsg.includes('not indexed') ||
    errorMsg.includes('missing trie node') ||
    errorMsg.includes('historical') ||
    errorMsg.includes('pruned')
  );
}

export function assertMethodWorks(response: RpcResponse, method: string): void {
  if (!isMethodSupported(response)) {
    throw new Error(`Method ${method} is not supported: ${response.error?.message}`);
  }

  // Tier restrictions are not method failures - method works but requires paid tier
  if (isTierRestricted(response)) {
    console.log(`Method ${method} requires paid tier access, skipping validation`);
    return;
  }

  // Archive limitations are not method failures - provider doesn't have full history
  if (isArchiveLimited(response)) {
    console.log(`Method ${method} limited by archive data availability, skipping validation`);
    return;
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

/**
 * Collect latest blockchain data for non-archive method tests.
 * Fetches a recent block (10 blocks behind latest for stability) and extracts
 * the block hash and a transaction hash from it.
 */
export async function collectLatestData(
  url: string,
  timeoutMs: number = 10000
): Promise<LatestData | null> {
  try {
    // Get latest block number
    const blockNumResponse = await callRpc(url, 'eth_blockNumber', [], timeoutMs);
    if (!blockNumResponse.result) return null;

    // Use a block 10 behind latest for stability (helps with trace methods)
    const latestNum = parseInt(blockNumResponse.result as string, 16);
    const targetNum = latestNum - 10;
    const targetBlockHex = `0x${targetNum.toString(16)}`;

    // Get block with transactions
    const blockResponse = await callRpc(url, 'eth_getBlockByNumber', [targetBlockHex, true], timeoutMs);
    if (!blockResponse.result) return null;

    const block = blockResponse.result as { hash: string; transactions: Array<{ hash: string }> };
    const blockHash = block.hash;
    let txHash: string | null = null;

    // Try to find a transaction in this block or search recent blocks
    if (block.transactions && block.transactions.length > 0) {
      txHash = block.transactions[0].hash;
    } else {
      // Search up to 10 recent blocks for a transaction
      for (let i = 1; i <= 10; i++) {
        const searchBlockHex = `0x${(targetNum - i).toString(16)}`;
        const searchResponse = await callRpc(url, 'eth_getBlockByNumber', [searchBlockHex, true], timeoutMs);
        const searchBlock = searchResponse.result as { transactions: Array<{ hash: string }> } | null;
        if (searchBlock?.transactions?.length > 0) {
          txHash = searchBlock.transactions[0].hash;
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
  }
}
