import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings, collectLatestData } from './helpers.js';
import type { LatestData } from '../../shared/types.js';

describe('Transaction RPC Methods', () => {
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

  it('eth_getTransactionByHash - returns transaction', async () => {
    const params = getMethodParams('eth_getTransactionByHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getTransactionByHash', params);
    assertMethodWorks(response, 'eth_getTransactionByHash');
  });

  it('eth_getTransactionByBlockNumberAndIndex - returns transaction', async () => {
    const params = getMethodParams('eth_getTransactionByBlockNumberAndIndex', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getTransactionByBlockNumberAndIndex', params);
    assertMethodWorks(response, 'eth_getTransactionByBlockNumberAndIndex');
  });

  it('eth_getTransactionReceipt - returns receipt', async () => {
    const params = getMethodParams('eth_getTransactionReceipt', settings, latestData);
    const response = await callRpc(rpcUrl, 'eth_getTransactionReceipt', params);
    assertMethodWorks(response, 'eth_getTransactionReceipt');
  });
});
