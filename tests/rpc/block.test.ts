import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Block RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getBlockByNumber - returns block by number', async () => {
    const params = getMethodParams('eth_getBlockByNumber', settings);
    const response = await callRpc(rpcUrl, 'eth_getBlockByNumber', params);
    assertMethodWorks(response, 'eth_getBlockByNumber');
    expect(response.result).toBeDefined();
  });

  it('eth_getBlockByHash - returns block by hash', async () => {
    const params = getMethodParams('eth_getBlockByHash', settings);
    const response = await callRpc(rpcUrl, 'eth_getBlockByHash', params);
    assertMethodWorks(response, 'eth_getBlockByHash');
  });

  it('eth_getBlockTransactionCountByNumber - returns tx count', async () => {
    const params = getMethodParams('eth_getBlockTransactionCountByNumber', settings);
    const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByNumber', params);
    assertMethodWorks(response, 'eth_getBlockTransactionCountByNumber');
  });

  it('eth_getBlockTransactionCountByHash - returns tx count by hash', async () => {
    const params = getMethodParams('eth_getBlockTransactionCountByHash', settings);
    const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByHash', params);
    assertMethodWorks(response, 'eth_getBlockTransactionCountByHash');
  });

  it('eth_getUncleCountByBlockNumber - returns uncle count', async () => {
    const params = getMethodParams('eth_getUncleCountByBlockNumber', settings);
    const response = await callRpc(rpcUrl, 'eth_getUncleCountByBlockNumber', params);
    assertMethodWorks(response, 'eth_getUncleCountByBlockNumber');
  });

  it('eth_getBlockReceipts - returns block receipts', async () => {
    const params = getMethodParams('eth_getBlockReceipts', settings);
    const response = await callRpc(rpcUrl, 'eth_getBlockReceipts', params);
    assertMethodWorks(response, 'eth_getBlockReceipts');
  });
});
