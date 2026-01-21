import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings, collectLatestData } from './helpers.js';
import type { LatestData } from '../../shared/types.js';

describe('Block RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();
  let latestData: LatestData | null = null;

  beforeAll(async () => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);

    // Collect latest block/tx data for non-archive tests
    latestData = await collectLatestData(rpcUrl, 30000);
    if (latestData) {
      console.log(`Collected latest data - block: ${latestData.blockNumber}, tx: ${latestData.txHash}`);
    }
  });

  it('eth_getBlockByNumber - returns block by number', async () => {
    const params = getMethodParams('eth_getBlockByNumber', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getBlockByNumber', params);
    assertMethodWorks(response, 'eth_getBlockByNumber');
    expect(response.result).toBeDefined();
  });

  it('eth_getBlockByHash - returns block by hash', async () => {
    const params = getMethodParams('eth_getBlockByHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getBlockByHash', params);
    assertMethodWorks(response, 'eth_getBlockByHash');
  });

  it('eth_getBlockTransactionCountByNumber - returns tx count', async () => {
    const params = getMethodParams('eth_getBlockTransactionCountByNumber', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByNumber', params);
    assertMethodWorks(response, 'eth_getBlockTransactionCountByNumber');
  });

  it('eth_getBlockTransactionCountByHash - returns tx count by hash', async () => {
    const params = getMethodParams('eth_getBlockTransactionCountByHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getBlockTransactionCountByHash', params);
    assertMethodWorks(response, 'eth_getBlockTransactionCountByHash');
  });

  it('eth_getUncleCountByBlockNumber - returns uncle count', async () => {
    const params = getMethodParams('eth_getUncleCountByBlockNumber', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getUncleCountByBlockNumber', params);
    assertMethodWorks(response, 'eth_getUncleCountByBlockNumber');
  });

  it('eth_getBlockReceipts - returns block receipts', async () => {
    const params = getMethodParams('eth_getBlockReceipts', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getBlockReceipts', params);
    assertMethodWorks(response, 'eth_getBlockReceipts');
  });
});
