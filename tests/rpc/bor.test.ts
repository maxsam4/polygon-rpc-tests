import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings, collectLatestData } from './helpers.js';
import type { LatestData } from '../../shared/types.js';

describe('Bor RPC Methods (Polygon Specific)', () => {
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

  it('bor_getAuthor - returns block author', async () => {
    const params = getMethodParams('bor_getAuthor', settings, latestData);
    const response = await callRpc(rpcUrl, 'bor_getAuthor', params);
    assertMethodWorks(response, 'bor_getAuthor');
  });

  it('bor_getCurrentValidators - returns current validators', async () => {
    const params = getMethodParams('bor_getCurrentValidators', settings, latestData);
    const response = await callRpc(rpcUrl, 'bor_getCurrentValidators', params);
    assertMethodWorks(response, 'bor_getCurrentValidators');
  });

  it('bor_getCurrentProposer - returns current proposer', async () => {
    const params = getMethodParams('bor_getCurrentProposer', settings, latestData);
    const response = await callRpc(rpcUrl, 'bor_getCurrentProposer', params);
    assertMethodWorks(response, 'bor_getCurrentProposer');
  });

  it('bor_getRootHash - returns root hash', async () => {
    const params = getMethodParams('bor_getRootHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'bor_getRootHash', params);
    assertMethodWorks(response, 'bor_getRootHash');
  });

  it('bor_getSignersAtHash - returns signers at block hash', async () => {
    const params = getMethodParams('bor_getSignersAtHash', settings, latestData);
    const response = await callRpc(rpcUrl, 'bor_getSignersAtHash', params);
    assertMethodWorks(response, 'bor_getSignersAtHash');
  });
});
