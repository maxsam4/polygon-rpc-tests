import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Trace RPC Methods', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('trace_call - traces a call', async () => {
    const params = getMethodParams('trace_call', settings);
    const response = await callRpc(rpcUrl, 'trace_call', params, 30000);
    assertMethodWorks(response, 'trace_call');
  });

  it('trace_rawTransaction - traces raw transaction', async () => {
    const params = getMethodParams('trace_rawTransaction', settings);
    const response = await callRpc(rpcUrl, 'trace_rawTransaction', params, 30000);
    assertMethodWorks(response, 'trace_rawTransaction');
  });

  it('trace_replayBlockTransactions - replays block transactions', async () => {
    const params = getMethodParams('trace_replayBlockTransactions', settings);
    const response = await callRpc(rpcUrl, 'trace_replayBlockTransactions', params, 30000);
    assertMethodWorks(response, 'trace_replayBlockTransactions');
  });

  it('trace_replayTransaction - replays transaction', async () => {
    const params = getMethodParams('trace_replayTransaction', settings);
    const response = await callRpc(rpcUrl, 'trace_replayTransaction', params, 30000);
    assertMethodWorks(response, 'trace_replayTransaction');
  });

  it('trace_block - traces a block', async () => {
    const params = getMethodParams('trace_block', settings);
    const response = await callRpc(rpcUrl, 'trace_block', params, 30000);
    assertMethodWorks(response, 'trace_block');
  });

  it('trace_filter - filters traces', async () => {
    const params = getMethodParams('trace_filter', settings);
    const response = await callRpc(rpcUrl, 'trace_filter', params, 30000);
    assertMethodWorks(response, 'trace_filter');
  });

  it('trace_get - gets trace by index', async () => {
    const params = getMethodParams('trace_get', settings);
    const response = await callRpc(rpcUrl, 'trace_get', params, 30000);
    assertMethodWorks(response, 'trace_get');
  });

  it('trace_transaction - traces transaction', async () => {
    const params = getMethodParams('trace_transaction', settings);
    const response = await callRpc(rpcUrl, 'trace_transaction', params, 30000);
    assertMethodWorks(response, 'trace_transaction');
  });
});
