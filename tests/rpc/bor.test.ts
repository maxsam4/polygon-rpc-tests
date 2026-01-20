import { describe, it, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks, getMethodParams, getTestSettings } from './helpers.js';

describe('Bor RPC Methods (Polygon Specific)', () => {
  let rpcUrl: string;
  const settings = getTestSettings();

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('bor_getAuthor - returns block author', async () => {
    const params = getMethodParams('bor_getAuthor', settings);
    const response = await callRpc(rpcUrl, 'bor_getAuthor', params);
    assertMethodWorks(response, 'bor_getAuthor');
  });

  it('bor_getCurrentValidators - returns current validators', async () => {
    const params = getMethodParams('bor_getCurrentValidators', settings);
    const response = await callRpc(rpcUrl, 'bor_getCurrentValidators', params);
    assertMethodWorks(response, 'bor_getCurrentValidators');
  });

  it('bor_getCurrentProposer - returns current proposer', async () => {
    const params = getMethodParams('bor_getCurrentProposer', settings);
    const response = await callRpc(rpcUrl, 'bor_getCurrentProposer', params);
    assertMethodWorks(response, 'bor_getCurrentProposer');
  });

  it('bor_getRootHash - returns root hash', async () => {
    const params = getMethodParams('bor_getRootHash', settings);
    const response = await callRpc(rpcUrl, 'bor_getRootHash', params);
    assertMethodWorks(response, 'bor_getRootHash');
  });

  it('bor_getSignersAtHash - returns signers at block hash', async () => {
    const params = getMethodParams('bor_getSignersAtHash', settings);
    const response = await callRpc(rpcUrl, 'bor_getSignersAtHash', params);
    assertMethodWorks(response, 'bor_getSignersAtHash');
  });
});
