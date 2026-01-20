import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getTestSettings } from './helpers.js';

describe('Debug RPC Methods', () => {
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

  it('debug_traceCall - traces a call', async () => {
    const response = await callRpc(rpcUrl, 'debug_traceCall', [
      { to: testAddress },
      'latest'
    ], 30000);
    assertMethodWorks(response, 'debug_traceCall');
  });

  it('debug_traceBlockByNumber - traces block', async () => {
    const response = await callRpc(rpcUrl, 'debug_traceBlockByNumber', ['latest'], 30000);
    assertMethodWorks(response, 'debug_traceBlockByNumber');
  });

  it('debug_traceTransaction - traces transaction', async () => {
    if (!sampleTxHash) {
      console.log('Skipping: no sample transaction available');
      return;
    }
    const response = await callRpc(rpcUrl, 'debug_traceTransaction', [sampleTxHash], 30000);
    assertMethodWorks(response, 'debug_traceTransaction');
  });

  it('debug_getBadBlocks - returns bad blocks', async () => {
    const response = await callRpc(rpcUrl, 'debug_getBadBlocks');
    assertMethodWorks(response, 'debug_getBadBlocks');
  });
});
