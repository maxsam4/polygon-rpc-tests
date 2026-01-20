import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Basic RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('web3_clientVersion - returns client version', async () => {
    const params = getMethodParams('web3_clientVersion', settings);
    const response = await callRpc(rpcUrl, 'web3_clientVersion', params);
    assertMethodWorks(response, 'web3_clientVersion');
    expect(response.result).toBeDefined();
  });

  it('net_version - returns network ID', async () => {
    const params = getMethodParams('net_version', settings);
    const response = await callRpc(rpcUrl, 'net_version', params);
    assertMethodWorks(response, 'net_version');
    expect(response.result).toBeDefined();
  });

  it('net_listening - returns listening status', async () => {
    const params = getMethodParams('net_listening', settings);
    const response = await callRpc(rpcUrl, 'net_listening', params);
    assertMethodWorks(response, 'net_listening');
    expect(typeof response.result).toBe('boolean');
  });

  it('net_peerCount - returns peer count', async () => {
    const params = getMethodParams('net_peerCount', settings);
    const response = await callRpc(rpcUrl, 'net_peerCount', params);
    assertMethodWorks(response, 'net_peerCount');
  });

  it('eth_protocolVersion - returns protocol version', async () => {
    const params = getMethodParams('eth_protocolVersion', settings);
    const response = await callRpc(rpcUrl, 'eth_protocolVersion', params);
    assertMethodWorks(response, 'eth_protocolVersion');
  });

  it('eth_syncing - returns sync status', async () => {
    const params = getMethodParams('eth_syncing', settings);
    const response = await callRpc(rpcUrl, 'eth_syncing', params);
    assertMethodWorks(response, 'eth_syncing');
    expect(response.result !== undefined).toBe(true);
  });

  it('eth_chainId - returns chain ID', async () => {
    const params = getMethodParams('eth_chainId', settings);
    const response = await callRpc(rpcUrl, 'eth_chainId', params);
    assertMethodWorks(response, 'eth_chainId');
    expect(response.result).toBe('0x89'); // Polygon mainnet
  });

  it('eth_gasPrice - returns gas price', async () => {
    const params = getMethodParams('eth_gasPrice', settings);
    const response = await callRpc(rpcUrl, 'eth_gasPrice', params);
    assertMethodWorks(response, 'eth_gasPrice');
    expect(response.result).toBeDefined();
    expect(typeof response.result).toBe('string');
  });

  it('eth_blockNumber - returns current block number', async () => {
    const params = getMethodParams('eth_blockNumber', settings);
    const response = await callRpc(rpcUrl, 'eth_blockNumber', params);
    assertMethodWorks(response, 'eth_blockNumber');
    expect(response.result).toBeDefined();
    expect(typeof response.result).toBe('string');
    expect((response.result as string).startsWith('0x')).toBe(true);
  });

  it('eth_accounts - returns accounts list', async () => {
    const params = getMethodParams('eth_accounts', settings);
    const response = await callRpc(rpcUrl, 'eth_accounts', params);
    assertMethodWorks(response, 'eth_accounts');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('eth_maxPriorityFeePerGas - returns max priority fee', async () => {
    const params = getMethodParams('eth_maxPriorityFeePerGas', settings);
    const response = await callRpc(rpcUrl, 'eth_maxPriorityFeePerGas', params);
    assertMethodWorks(response, 'eth_maxPriorityFeePerGas');
  });

  it('eth_feeHistory - returns fee history', async () => {
    const params = getMethodParams('eth_feeHistory', settings);
    const response = await callRpc(rpcUrl, 'eth_feeHistory', params);
    assertMethodWorks(response, 'eth_feeHistory');
  });
});
