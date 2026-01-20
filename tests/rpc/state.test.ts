import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getTestSettings } from './helpers.js';

describe('State RPC Methods', () => {
  let rpcUrl: string;
  let testAddress: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    testAddress = getTestSettings().archiveTestAddress;
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('eth_getBalance - returns address balance', async () => {
    const response = await callRpc(rpcUrl, 'eth_getBalance', [testAddress, 'latest']);
    assertMethodWorks(response, 'eth_getBalance');
    expect(response.result).toBeDefined();
    expect(typeof response.result).toBe('string');
  });

  it('eth_getStorageAt - returns storage value', async () => {
    const response = await callRpc(rpcUrl, 'eth_getStorageAt', [testAddress, '0x0', 'latest']);
    assertMethodWorks(response, 'eth_getStorageAt');
    expect(response.result).toBeDefined();
  });

  it('eth_getTransactionCount - returns nonce', async () => {
    const response = await callRpc(rpcUrl, 'eth_getTransactionCount', [testAddress, 'latest']);
    assertMethodWorks(response, 'eth_getTransactionCount');
    expect(response.result).toBeDefined();
  });

  it('eth_getCode - returns contract code', async () => {
    const response = await callRpc(rpcUrl, 'eth_getCode', [testAddress, 'latest']);
    assertMethodWorks(response, 'eth_getCode');
    expect(response.result).toBeDefined();
  });

  it('eth_call - executes call', async () => {
    const response = await callRpc(rpcUrl, 'eth_call', [
      { to: testAddress, data: '0x' },
      'latest'
    ]);
    assertMethodWorks(response, 'eth_call');
  });

  it('eth_estimateGas - estimates gas', async () => {
    const response = await callRpc(rpcUrl, 'eth_estimateGas', [
      { to: testAddress, data: '0x' }
    ]);
    assertMethodWorks(response, 'eth_estimateGas');
  });

  it('eth_createAccessList - creates access list', async () => {
    const response = await callRpc(rpcUrl, 'eth_createAccessList', [
      { to: testAddress, data: '0x' },
      'latest'
    ]);
    assertMethodWorks(response, 'eth_createAccessList');
  });
});
