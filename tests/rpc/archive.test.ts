import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, isArchiveLimited, getMethodParams, getTestSettings } from './helpers.js';

describe('Archive RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    const archiveBlock = `0x${settings.archiveBlockNumber.toString(16)}`;
    console.log(`Testing against: ${rpcUrl}`);
    console.log(`Archive block: ${archiveBlock} (${settings.archiveBlockNumber})`);
  });

  it('eth_getBalance:archive - returns historical balance', async () => {
    const params = getMethodParams('eth_getBalance:archive', settings);
    const response = await callRpc(rpcUrl, 'eth_getBalance', params);
    assertMethodWorks(response, 'eth_getBalance:archive');
    if (!isArchiveLimited(response)) {
      expect(response.result).toBeDefined();
    }
  });

  it('eth_getStorageAt:archive - returns historical storage', async () => {
    const params = getMethodParams('eth_getStorageAt:archive', settings);
    const response = await callRpc(rpcUrl, 'eth_getStorageAt', params);
    assertMethodWorks(response, 'eth_getStorageAt:archive');
  });

  it('eth_getTransactionCount:archive - returns historical nonce', async () => {
    const params = getMethodParams('eth_getTransactionCount:archive', settings);
    const response = await callRpc(rpcUrl, 'eth_getTransactionCount', params);
    assertMethodWorks(response, 'eth_getTransactionCount:archive');
  });

  it('eth_getCode:archive - returns historical code', async () => {
    const params = getMethodParams('eth_getCode:archive', settings);
    const response = await callRpc(rpcUrl, 'eth_getCode', params);
    assertMethodWorks(response, 'eth_getCode:archive');
  });

  it('eth_call:archive - executes historical call', async () => {
    const params = getMethodParams('eth_call:archive', settings);
    const response = await callRpc(rpcUrl, 'eth_call', params);
    assertMethodWorks(response, 'eth_call:archive');
  });
});
