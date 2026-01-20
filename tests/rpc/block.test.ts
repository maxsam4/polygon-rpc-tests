import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('Block RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getBlockByNumber - returns block by number', async () => {
    const response = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
    assertMethodWorks(response, 'eth_getBlockByNumber');
    expect(response.result).toBeDefined();
    expect((response.result as any).number).toBeDefined();
  });

  it('eth_getBlockByHash - returns block by hash', async () => {
    // First get a real block hash
    const latestBlock = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
    const blockHash = (latestBlock.result as any)?.hash;

    if (blockHash) {
      const response = await callRpc(rpcUrl, 'eth_getBlockByHash', [blockHash, false]);
      assertMethodWorks(response, 'eth_getBlockByHash');
      expect(response.result).toBeDefined();
    }
  });

  it('eth_getBlockTransactionCountByNumber - returns tx count', async () => {
    const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByNumber', ['latest']);
    assertMethodWorks(response, 'eth_getBlockTransactionCountByNumber');
    expect(response.result).toBeDefined();
  });

  it('eth_getBlockTransactionCountByHash - returns tx count by hash', async () => {
    const latestBlock = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
    const blockHash = (latestBlock.result as any)?.hash;

    if (blockHash) {
      const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByHash', [blockHash]);
      assertMethodWorks(response, 'eth_getBlockTransactionCountByHash');
    }
  });

  it('eth_getUncleCountByBlockNumber - returns uncle count', async () => {
    const response = await callRpc(rpcUrl, 'eth_getUncleCountByBlockNumber', ['latest']);
    assertMethodWorks(response, 'eth_getUncleCountByBlockNumber');
  });

  it('eth_getBlockReceipts - returns block receipts', async () => {
    const response = await callRpc(rpcUrl, 'eth_getBlockReceipts', ['latest']);
    assertMethodWorks(response, 'eth_getBlockReceipts');
  });
});
