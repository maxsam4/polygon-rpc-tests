import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('Transaction RPC Methods', () => {
  let rpcUrl: string;
  let sampleTxHash: string | null = null;

  beforeAll(async () => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);

    // Get a real transaction hash from the latest block
    const latestBlock = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', true]);
    const txs = (latestBlock.result as any)?.transactions;
    if (txs && txs.length > 0) {
      sampleTxHash = txs[0].hash || txs[0];
    }
  });

  it('eth_getTransactionByHash - returns transaction', async () => {
    if (!sampleTxHash) {
      console.log('Skipping: no sample transaction available');
      return;
    }
    const response = await callRpc(rpcUrl, 'eth_getTransactionByHash', [sampleTxHash]);
    assertMethodWorks(response, 'eth_getTransactionByHash');
    expect(response.result).toBeDefined();
  });

  it('eth_getTransactionByBlockNumberAndIndex - returns transaction', async () => {
    const response = await callRpc(rpcUrl, 'eth_getTransactionByBlockNumberAndIndex', ['latest', '0x0']);
    assertMethodWorks(response, 'eth_getTransactionByBlockNumberAndIndex');
  });

  it('eth_getTransactionReceipt - returns receipt', async () => {
    if (!sampleTxHash) {
      console.log('Skipping: no sample transaction available');
      return;
    }
    const response = await callRpc(rpcUrl, 'eth_getTransactionReceipt', [sampleTxHash]);
    assertMethodWorks(response, 'eth_getTransactionReceipt');
  });
});
