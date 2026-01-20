import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('TxPool RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('txpool_status - returns pool status', async () => {
    const response = await callRpc(rpcUrl, 'txpool_status');
    assertMethodWorks(response, 'txpool_status');
  });

  it('txpool_content - returns pool content', async () => {
    const response = await callRpc(rpcUrl, 'txpool_content');
    assertMethodWorks(response, 'txpool_content');
  });

  it('txpool_inspect - inspects pool', async () => {
    const response = await callRpc(rpcUrl, 'txpool_inspect');
    assertMethodWorks(response, 'txpool_inspect');
  });
});
