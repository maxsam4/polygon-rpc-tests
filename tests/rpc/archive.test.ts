import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getTestSettings } from './helpers.js';

describe('Archive RPC Methods', () => {
  let rpcUrl: string;
  let testAddress: string;
  let archiveBlock: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    const settings = getTestSettings();
    testAddress = settings.archiveTestAddress;
    archiveBlock = `0x${settings.archiveBlockNumber.toString(16)}`;
    console.log(`Testing against: ${rpcUrl}`);
    console.log(`Archive block: ${archiveBlock} (${settings.archiveBlockNumber})`);
  });

  it('eth_getBalance:archive - returns historical balance', async () => {
    const response = await callRpc(rpcUrl, 'eth_getBalance', [testAddress, archiveBlock]);
    assertMethodWorks(response, 'eth_getBalance:archive');
    expect(response.result).toBeDefined();
  });

  it('eth_getStorageAt:archive - returns historical storage', async () => {
    const response = await callRpc(rpcUrl, 'eth_getStorageAt', [testAddress, '0x0', archiveBlock]);
    assertMethodWorks(response, 'eth_getStorageAt:archive');
  });

  it('eth_getTransactionCount:archive - returns historical nonce', async () => {
    const response = await callRpc(rpcUrl, 'eth_getTransactionCount', [testAddress, archiveBlock]);
    assertMethodWorks(response, 'eth_getTransactionCount:archive');
  });

  it('eth_getCode:archive - returns historical code', async () => {
    const response = await callRpc(rpcUrl, 'eth_getCode', [testAddress, archiveBlock]);
    assertMethodWorks(response, 'eth_getCode:archive');
  });

  it('eth_call:archive - executes historical call', async () => {
    const response = await callRpc(rpcUrl, 'eth_call', [
      { to: testAddress, data: '0x' },
      archiveBlock
    ]);
    assertMethodWorks(response, 'eth_call:archive');
  });
});
