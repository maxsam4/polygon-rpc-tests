import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Filter RPC Methods', () => {
  let rpcUrl: string;
  let filterId: string;
  const settings = getTestSettings();

  beforeAll(async () => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);

    // Create a filter to use for filter-dependent tests
    const params = getMethodParams('eth_newFilter', settings);
    const response = await callRpc(rpcUrl, 'eth_newFilter', params);
    if (response.result) {
      filterId = response.result as string;
      console.log(`Created filter: ${filterId}`);
    }
  });

  it('eth_getLogs - returns logs', async () => {
    const params = getMethodParams('eth_getLogs', settings);
    const response = await callRpc(rpcUrl, 'eth_getLogs', params);
    assertMethodWorks(response, 'eth_getLogs');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('eth_newFilter - creates filter', async () => {
    const params = getMethodParams('eth_newFilter', settings);
    const response = await callRpc(rpcUrl, 'eth_newFilter', params);
    assertMethodWorks(response, 'eth_newFilter');
  });

  it('eth_newBlockFilter - creates block filter', async () => {
    const params = getMethodParams('eth_newBlockFilter', settings);
    const response = await callRpc(rpcUrl, 'eth_newBlockFilter', params);
    assertMethodWorks(response, 'eth_newBlockFilter');
  });

  it('eth_newPendingTransactionFilter - creates pending tx filter', async () => {
    const params = getMethodParams('eth_newPendingTransactionFilter', settings);
    const response = await callRpc(rpcUrl, 'eth_newPendingTransactionFilter', params);
    assertMethodWorks(response, 'eth_newPendingTransactionFilter');
  });

  it('eth_getFilterChanges - gets filter changes', async () => {
    expect(filterId).toBeDefined();
    const response = await callRpc(rpcUrl, 'eth_getFilterChanges', [filterId]);
    assertMethodWorks(response, 'eth_getFilterChanges');
  });

  it('eth_getFilterLogs - gets filter logs', async () => {
    expect(filterId).toBeDefined();
    const response = await callRpc(rpcUrl, 'eth_getFilterLogs', [filterId]);
    assertMethodWorks(response, 'eth_getFilterLogs');
  });

  it('eth_uninstallFilter - uninstalls filter', async () => {
    expect(filterId).toBeDefined();
    const response = await callRpc(rpcUrl, 'eth_uninstallFilter', [filterId]);
    assertMethodWorks(response, 'eth_uninstallFilter');
  });
});
