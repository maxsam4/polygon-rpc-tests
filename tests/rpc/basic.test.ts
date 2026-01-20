import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getTestSettings } from './helpers.js';

describe('Basic RPC Methods', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('web3_clientVersion - returns client version', async () => {
    const response = await callRpc(rpcUrl, 'web3_clientVersion');
    assertMethodWorks(response, 'web3_clientVersion');
    expect(response.result).toBeDefined();
  });

  it('web3_sha3 - hashes data', async () => {
    const response = await callRpc(rpcUrl, 'web3_sha3', ['0x68656c6c6f']);
    assertMethodWorks(response, 'web3_sha3');
    expect(response.result).toBeDefined();
  });

  it('net_version - returns network ID', async () => {
    const response = await callRpc(rpcUrl, 'net_version');
    assertMethodWorks(response, 'net_version');
    expect(response.result).toBeDefined();
  });

  it('net_listening - returns listening status', async () => {
    const response = await callRpc(rpcUrl, 'net_listening');
    assertMethodWorks(response, 'net_listening');
    expect(typeof response.result).toBe('boolean');
  });

  it('net_peerCount - returns peer count', async () => {
    const response = await callRpc(rpcUrl, 'net_peerCount');
    assertMethodWorks(response, 'net_peerCount');
  });

  it('eth_protocolVersion - returns protocol version', async () => {
    const response = await callRpc(rpcUrl, 'eth_protocolVersion');
    assertMethodWorks(response, 'eth_protocolVersion');
  });

  it('eth_syncing - returns sync status', async () => {
    const response = await callRpc(rpcUrl, 'eth_syncing');
    assertMethodWorks(response, 'eth_syncing');
    // Result is either false or an object
    expect(response.result !== undefined).toBe(true);
  });

  it('eth_chainId - returns chain ID', async () => {
    const response = await callRpc(rpcUrl, 'eth_chainId');
    assertMethodWorks(response, 'eth_chainId');
    expect(response.result).toBe('0x89'); // Polygon mainnet
  });

  it('eth_gasPrice - returns gas price', async () => {
    const response = await callRpc(rpcUrl, 'eth_gasPrice');
    assertMethodWorks(response, 'eth_gasPrice');
    expect(response.result).toBeDefined();
    expect(typeof response.result).toBe('string');
  });

  it('eth_blockNumber - returns current block number', async () => {
    const response = await callRpc(rpcUrl, 'eth_blockNumber');
    assertMethodWorks(response, 'eth_blockNumber');
    expect(response.result).toBeDefined();
    expect(typeof response.result).toBe('string');
    expect((response.result as string).startsWith('0x')).toBe(true);
  });

  it('eth_accounts - returns accounts list', async () => {
    const response = await callRpc(rpcUrl, 'eth_accounts');
    assertMethodWorks(response, 'eth_accounts');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('eth_maxPriorityFeePerGas - returns max priority fee', async () => {
    const response = await callRpc(rpcUrl, 'eth_maxPriorityFeePerGas');
    assertMethodWorks(response, 'eth_maxPriorityFeePerGas');
  });

  it('eth_feeHistory - returns fee history', async () => {
    const response = await callRpc(rpcUrl, 'eth_feeHistory', [4, 'latest', [25, 75]]);
    assertMethodWorks(response, 'eth_feeHistory');
  });
});
