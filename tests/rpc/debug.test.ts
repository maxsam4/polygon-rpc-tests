import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings, collectLatestData } from './helpers.js';
import type { LatestData } from '../../shared/types.js';

describe('Debug RPC Methods', () => {
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

  it('debug_traceCall - traces a call', async () => {
    const params = getMethodParams('debug_traceCall', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_traceCall', params, 30000);
    assertMethodWorks(response, 'debug_traceCall');
  });

  it('debug_traceBlockByNumber - traces block by number', async () => {
    const params = getMethodParams('debug_traceBlockByNumber', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_traceBlockByNumber', params, 30000);
    assertMethodWorks(response, 'debug_traceBlockByNumber');
  });

  it('debug_traceBlockByHash - traces block by hash', async () => {
    const params = getMethodParams('debug_traceBlockByHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_traceBlockByHash', params, 30000);
    assertMethodWorks(response, 'debug_traceBlockByHash');
  });

  it('debug_traceTransaction - traces transaction', async () => {
    const params = getMethodParams('debug_traceTransaction', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_traceTransaction', params, 30000);
    assertMethodWorks(response, 'debug_traceTransaction');
  });

  it('debug_storageRangeAt - returns storage range', async () => {
    const params = getMethodParams('debug_storageRangeAt', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_storageRangeAt', params, 30000);
    assertMethodWorks(response, 'debug_storageRangeAt');
  });

  it('debug_getBadBlocks - returns bad blocks', async () => {
    const params = getMethodParams('debug_getBadBlocks', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_getBadBlocks', params);
    assertMethodWorks(response, 'debug_getBadBlocks');
  });

  it('debug_accountRange - returns account range', async () => {
    const params = getMethodParams('debug_accountRange', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_accountRange', params, 30000);
    assertMethodWorks(response, 'debug_accountRange');
  });

  it('debug_getModifiedAccountsByNumber - returns modified accounts', async () => {
    const params = getMethodParams('debug_getModifiedAccountsByNumber', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_getModifiedAccountsByNumber', params, 30000);
    assertMethodWorks(response, 'debug_getModifiedAccountsByNumber');
  });

  it('debug_getModifiedAccountsByHash - returns modified accounts by hash', async () => {
    const params = getMethodParams('debug_getModifiedAccountsByHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'debug_getModifiedAccountsByHash', params, 30000);
    assertMethodWorks(response, 'debug_getModifiedAccountsByHash');
  });
});
