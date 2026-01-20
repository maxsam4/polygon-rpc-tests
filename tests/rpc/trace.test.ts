import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getTestSettings } from './helpers.js';

describe('Trace RPC Methods', () => {
  let rpcUrl: string;
  let testAddress: string;
  let sampleTxHash: string | null = null;

  beforeAll(async () => {
    rpcUrl = getRpcUrl();
    testAddress = getTestSettings().archiveTestAddress;
    console.log(`Testing against: ${rpcUrl}`);

    // Get a real transaction hash
    const latestBlock = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', true]);
    const txs = (latestBlock.result as any)?.transactions;
    if (txs && txs.length > 0) {
      sampleTxHash = txs[0].hash || txs[0];
    }
  });

  it('trace_call - traces a call', async () => {
    const response = await callRpc(rpcUrl, 'trace_call', [
      { to: testAddress },
      ['trace'],
      'latest'
    ], 30000);
    assertMethodWorks(response, 'trace_call');
  });

  it('trace_block - traces a block', async () => {
    const response = await callRpc(rpcUrl, 'trace_block', ['latest'], 30000);
    assertMethodWorks(response, 'trace_block');
  });

  it('trace_transaction - traces transaction', async () => {
    if (!sampleTxHash) {
      console.log('Skipping: no sample transaction available');
      return;
    }
    const response = await callRpc(rpcUrl, 'trace_transaction', [sampleTxHash], 30000);
    assertMethodWorks(response, 'trace_transaction');
  });

  it('trace_filter - filters traces', async () => {
    const response = await callRpc(rpcUrl, 'trace_filter', [
      { fromBlock: 'latest', toBlock: 'latest', count: 1 }
    ], 30000);
    assertMethodWorks(response, 'trace_filter');
  });

  it('trace_replayBlockTransactions - replays block', async () => {
    const response = await callRpc(rpcUrl, 'trace_replayBlockTransactions', [
      'latest',
      ['trace']
    ], 30000);
    assertMethodWorks(response, 'trace_replayBlockTransactions');
  });
});
