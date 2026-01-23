import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings, collectLatestData } from './helpers.js';
import type { LatestData } from '../../shared/types.js';

describe('Trace RPC Methods', () => {
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

  it('trace_call - traces a call', async () => {
    const params = getMethodParams('trace_call', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_call', params, 30000);
    assertMethodWorks(response, 'trace_call');
  });

  it('trace_replayBlockTransactions - replays block transactions', async () => {
    const params = getMethodParams('trace_replayBlockTransactions', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_replayBlockTransactions', params, 30000);
    assertMethodWorks(response, 'trace_replayBlockTransactions');
  });

  it('trace_replayTransaction - replays transaction', async () => {
    const params = getMethodParams('trace_replayTransaction', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_replayTransaction', params, 30000);
    assertMethodWorks(response, 'trace_replayTransaction');
  });

  it('trace_block - traces a block', async () => {
    const params = getMethodParams('trace_block', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_block', params, 30000);
    assertMethodWorks(response, 'trace_block');
  });

  it('trace_filter - filters traces', async () => {
    const params = getMethodParams('trace_filter', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_filter', params, 30000);
    assertMethodWorks(response, 'trace_filter');
  });

  it('trace_get - gets trace by index', async () => {
    const params = getMethodParams('trace_get', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_get', params, 30000);
    assertMethodWorks(response, 'trace_get');
  });

  it('trace_transaction - traces transaction', async () => {
    const params = getMethodParams('trace_transaction', settings, latestData);
    const response = await callRpc(rpcUrl, 'trace_transaction', params, 30000);
    assertMethodWorks(response, 'trace_transaction');
  });
});
