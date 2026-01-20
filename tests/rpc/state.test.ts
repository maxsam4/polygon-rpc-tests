import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('State RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getBalance - returns address balance', async () => {
    const params = getMethodParams('eth_getBalance', settings);
    const response = await callRpc(rpcUrl, 'eth_getBalance', params);
    assertMethodWorks(response, 'eth_getBalance');
    expect(response.result).toBeDefined();
  });

  it('eth_getStorageAt - returns storage value', async () => {
    const params = getMethodParams('eth_getStorageAt', settings);
    const response = await callRpc(rpcUrl, 'eth_getStorageAt', params);
    assertMethodWorks(response, 'eth_getStorageAt');
  });

  it('eth_getTransactionCount - returns nonce', async () => {
    const params = getMethodParams('eth_getTransactionCount', settings);
    const response = await callRpc(rpcUrl, 'eth_getTransactionCount', params);
    assertMethodWorks(response, 'eth_getTransactionCount');
  });

  it('eth_getCode - returns contract code', async () => {
    const params = getMethodParams('eth_getCode', settings);
    const response = await callRpc(rpcUrl, 'eth_getCode', params);
    assertMethodWorks(response, 'eth_getCode');
  });

  it('eth_call - executes call', async () => {
    const params = getMethodParams('eth_call', settings);
    const response = await callRpc(rpcUrl, 'eth_call', params);
    assertMethodWorks(response, 'eth_call');
  });

  it('eth_estimateGas - estimates gas', async () => {
    const params = getMethodParams('eth_estimateGas', settings);
    const response = await callRpc(rpcUrl, 'eth_estimateGas', params);
    assertMethodWorks(response, 'eth_estimateGas');
  });

  it('eth_createAccessList - creates access list', async () => {
    const params = getMethodParams('eth_createAccessList', settings);
    const response = await callRpc(rpcUrl, 'eth_createAccessList', params);
    assertMethodWorks(response, 'eth_createAccessList');
  });
});
