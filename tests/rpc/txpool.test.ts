import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('TxPool RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('txpool_status - returns pool status', async () => {
    const params = getMethodParams('txpool_status', settings);
    const response = await callRpc(rpcUrl, 'txpool_status', params);
    assertMethodWorks(response, 'txpool_status');
  });

  it('txpool_content - returns pool content', async () => {
    const params = getMethodParams('txpool_content', settings);
    const response = await callRpc(rpcUrl, 'txpool_content', params);
    assertMethodWorks(response, 'txpool_content');
  });

  it('txpool_inspect - inspects pool', async () => {
    const params = getMethodParams('txpool_inspect', settings);
    const response = await callRpc(rpcUrl, 'txpool_inspect', params);
    assertMethodWorks(response, 'txpool_inspect');
  });
});
