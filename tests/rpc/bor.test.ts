import { describe, it, expect, beforeAll } from 'vitest';
import { getRpcUrl, callRpc, assertMethodWorks } from './helpers.js';

describe('Bor RPC Methods (Polygon Specific)', () => {
  let rpcUrl: string;

  beforeAll(() => {
    rpcUrl = getRpcUrl();
    console.log(`Testing against: ${rpcUrl}`);
  });

  it('bor_getAuthor - returns block author', async () => {
    const response = await callRpc(rpcUrl, 'bor_getAuthor', ['latest']);
    assertMethodWorks(response, 'bor_getAuthor');
  });

  it('bor_getCurrentValidators - returns current validators', async () => {
    const response = await callRpc(rpcUrl, 'bor_getCurrentValidators');
    assertMethodWorks(response, 'bor_getCurrentValidators');
  });

  it('bor_getCurrentProposer - returns current proposer', async () => {
    const response = await callRpc(rpcUrl, 'bor_getCurrentProposer');
    assertMethodWorks(response, 'bor_getCurrentProposer');
  });

  it('bor_getRootHash - returns root hash', async () => {
    const response = await callRpc(rpcUrl, 'bor_getRootHash', [0, 100]);
    assertMethodWorks(response, 'bor_getRootHash');
  });

  it('bor_getSnapshot - returns snapshot', async () => {
    const response = await callRpc(rpcUrl, 'bor_getSnapshot', ['latest']);
    assertMethodWorks(response, 'bor_getSnapshot');
  });

  it('bor_getSnapshotProposer - returns snapshot proposer', async () => {
    const response = await callRpc(rpcUrl, 'bor_getSnapshotProposer');
    assertMethodWorks(response, 'bor_getSnapshotProposer');
  });

  it('bor_getSnapshotProposerSequence - returns proposer sequence', async () => {
    const response = await callRpc(rpcUrl, 'bor_getSnapshotProposerSequence');
    assertMethodWorks(response, 'bor_getSnapshotProposerSequence');
  });
});
