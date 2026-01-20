import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('Erigon RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('erigon_forks - returns fork information', async () => {
    const response = await callRpc(rpcUrl, 'erigon_forks');
    assertMethodWorks(response, 'erigon_forks');
  });

  it('erigon_getHeaderByNumber - returns header by number', async () => {
    const response = await callRpc(rpcUrl, 'erigon_getHeaderByNumber', ['latest']);
    assertMethodWorks(response, 'erigon_getHeaderByNumber');
  });

  it('erigon_getHeaderByHash - returns header by hash', async () => {
    // Get a real block hash first
    const latestBlock = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
    const blockHash = (latestBlock.result as any)?.hash;

    if (blockHash) {
      const response = await callRpc(rpcUrl, 'erigon_getHeaderByHash', [blockHash]);
      assertMethodWorks(response, 'erigon_getHeaderByHash');
    }
  });

  it('erigon_getBlockByTimestamp - returns block by timestamp', async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 60;
    const response = await callRpc(rpcUrl, 'erigon_getBlockByTimestamp', [timestamp, false]);
    assertMethodWorks(response, 'erigon_getBlockByTimestamp');
  });

  it('erigon_blockNumber - returns block number', async () => {
    const response = await callRpc(rpcUrl, 'erigon_blockNumber');
    assertMethodWorks(response, 'erigon_blockNumber');
  });
});
