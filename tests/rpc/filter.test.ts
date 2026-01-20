import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('Filter RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getLogs - returns logs', async () => {
    const response = await callRpc(rpcUrl, 'eth_getLogs', [
      { fromBlock: 'latest', toBlock: 'latest' }
    ]);
    assertMethodWorks(response, 'eth_getLogs');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('eth_newFilter - creates filter', async () => {
    const response = await callRpc(rpcUrl, 'eth_newFilter', [
      { fromBlock: 'latest', toBlock: 'latest' }
    ]);
    assertMethodWorks(response, 'eth_newFilter');
  });

  it('eth_newBlockFilter - creates block filter', async () => {
    const response = await callRpc(rpcUrl, 'eth_newBlockFilter');
    assertMethodWorks(response, 'eth_newBlockFilter');
  });

  it('eth_newPendingTransactionFilter - creates pending tx filter', async () => {
    const response = await callRpc(rpcUrl, 'eth_newPendingTransactionFilter');
    assertMethodWorks(response, 'eth_newPendingTransactionFilter');
  });
});
