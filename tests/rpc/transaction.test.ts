import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Transaction RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getTransactionByHash - returns transaction', async () => {
    const params = getMethodParams('eth_getTransactionByHash', settings);
    const response = await callRpc(rpcUrl, 'eth_getTransactionByHash', params);
    assertMethodWorks(response, 'eth_getTransactionByHash');
  });

  it('eth_getTransactionByBlockNumberAndIndex - returns transaction', async () => {
    const params = getMethodParams('eth_getTransactionByBlockNumberAndIndex', settings);
    const response = await callRpc(rpcUrl, 'eth_getTransactionByBlockNumberAndIndex', params);
    assertMethodWorks(response, 'eth_getTransactionByBlockNumberAndIndex');
  });

  it('eth_getTransactionReceipt - returns receipt', async () => {
    const params = getMethodParams('eth_getTransactionReceipt', settings);
    const response = await callRpc(rpcUrl, 'eth_getTransactionReceipt', params);
    assertMethodWorks(response, 'eth_getTransactionReceipt');
  });
});
