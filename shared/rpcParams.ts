import type { TestSettings, LatestData } from './types.js';

// Known valid block hash from Polygon mainnet (block 35,000,000)
export const KNOWN_BLOCK_HASH = '0x7ea975390c67cd9c4c2d8295063b2ca9938c5a43582eb477541af73bbf6f878e';

// Known valid transaction hash from Polygon mainnet (from block 35,000,000)
export const KNOWN_TX_HASH = '0xcbd124780ce7d6801bc9cb588b6a4aff4669761baf0337e5dd45392fa039c609';

// Known valid block number for archive tests
export const KNOWN_BLOCK_NUMBER = 35000000;

// Known valid raw transaction from Polygon mainnet (a simple MATIC transfer)
// This is a real RLP-encoded signed EIP-1559 transaction for trace_rawTransaction tests
export const KNOWN_RAW_TX = '0x02f87281898320821c86246139ca800086246139ca8000825208946efdade3d235fdebdf9c4fb61424809fddde48fc8080c080a028ad7d9bb468d48411f5fa2124c3de742c7a150715600ce16772e140cec9a609a03260c9426e8b446b3159e600020ddb6a968c38b7e8cc68c3c14659b6fb7f9ab4';

// USDC contract on Polygon mainnet - reliable for eth_call tests
export const USDC_CONTRACT = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359';

// balanceOf(address) call data for the zero address
// Function selector: 0x70a08231 (balanceOf)
// Argument: 0x0000000000000000000000000000000000000000 (zero address, padded to 32 bytes)
export const BALANCE_OF_CALL_DATA = '0x70a082310000000000000000000000000000000000000000000000000000000000000000';

/**
 * Get the actual JSON-RPC method name from a test method identifier.
 * Handles archive method variants (e.g., "eth_getBalance:archive" -> "eth_getBalance")
 */
export function getActualMethod(method: string): string {
  if (method.endsWith(':archive')) {
    return method.replace(':archive', '');
  }
  return method;
}

/**
 * Get the parameters for a given RPC method.
 * This function is used by both the production test runner and the vitest tests
 * to ensure consistent parameter generation.
 *
 * @param method - The RPC method name (may include :archive suffix)
 * @param settings - Test settings containing archive block number and test address
 * @param latestData - Optional latest blockchain data for non-archive methods
 */
export function getMethodParams(
  method: string,
  settings: TestSettings,
  latestData?: LatestData | null
): unknown[] {
  // Handle archive methods (e.g., "eth_getBalance:archive")
  const isArchive = method.endsWith(':archive');
  const baseMethod = isArchive ? method.replace(':archive', '') : method;

  // For archive methods, always use known constants
  // For latest methods, use latestData if available, otherwise fall back to 'latest' tag or known constants
  const archiveBlockTag = `0x${settings.archiveBlockNumber.toString(16)}`;
  const blockTag = isArchive ? archiveBlockTag : 'latest';

  // Helper to get block hash - archive uses KNOWN_BLOCK_HASH, latest uses latestData or KNOWN_BLOCK_HASH
  const getBlockHash = () => isArchive ? KNOWN_BLOCK_HASH : (latestData?.blockHash ?? KNOWN_BLOCK_HASH);

  // Helper to get block number - archive uses archiveBlockTag, latest uses latestData or 'latest'
  const getBlockNumber = () => isArchive ? archiveBlockTag : (latestData?.blockNumber ?? 'latest');

  // Helper to get tx hash - archive uses KNOWN_TX_HASH, latest uses latestData or KNOWN_TX_HASH
  const getTxHash = () => isArchive ? KNOWN_TX_HASH : (latestData?.txHash ?? KNOWN_TX_HASH);

  switch (baseMethod) {
    // Basic methods
    case 'eth_feeHistory':
      return ['0x4', 'latest', [25, 75]]; // block count must be hex string

    // State methods
    case 'eth_getBalance':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_getStorageAt':
      return [settings.archiveTestAddress, '0x0', blockTag];
    case 'eth_getTransactionCount':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_getCode':
      return [settings.archiveTestAddress, blockTag];
    case 'eth_call':
      // Call balanceOf(address(0)) on USDC - always succeeds
      return [{ to: USDC_CONTRACT, data: BALANCE_OF_CALL_DATA }, blockTag];
    case 'eth_estimateGas':
      // Estimate gas for balanceOf call on USDC - always succeeds
      return [{ to: USDC_CONTRACT, data: BALANCE_OF_CALL_DATA }];
    case 'eth_createAccessList':
      // Create access list for balanceOf call on USDC
      return [{ to: USDC_CONTRACT, data: BALANCE_OF_CALL_DATA }, 'latest'];
    case 'eth_getProof':
      // Get merkle proof for account state
      return [settings.archiveTestAddress, ['0x0'], blockTag];
    case 'eth_simulateV1':
      // Simulate transaction execution
      return [
        {
          blockStateCalls: [
            {
              calls: [{ to: USDC_CONTRACT, data: BALANCE_OF_CALL_DATA }],
            },
          ],
        },
        'latest',
      ];

    // Block methods
    case 'eth_getBlockByHash':
      return [getBlockHash(), false];
    case 'eth_getBlockByNumber':
      return [getBlockNumber(), false];
    case 'eth_getBlockTransactionCountByHash':
      return [getBlockHash()];
    case 'eth_getBlockTransactionCountByNumber':
      return [getBlockNumber()];
    case 'eth_getUncleCountByBlockHash':
      return [getBlockHash()];
    case 'eth_getUncleCountByBlockNumber':
      return [getBlockNumber()];
    case 'eth_getUncleByBlockHashAndIndex':
      return [getBlockHash(), '0x0'];
    case 'eth_getUncleByBlockNumberAndIndex':
      return [getBlockNumber(), '0x0'];
    case 'eth_getBlockReceipts':
      return [getBlockNumber()];

    // Transaction methods
    case 'eth_getTransactionByHash':
      return [getTxHash()];
    case 'eth_getTransactionByBlockHashAndIndex':
      return [getBlockHash(), '0x0'];
    case 'eth_getTransactionByBlockNumberAndIndex':
      return [getBlockNumber(), '0x0'];
    case 'eth_getTransactionReceipt':
      return [getTxHash()];

    // Filter methods
    case 'eth_newFilter':
      return [{ fromBlock: 'latest', toBlock: 'latest' }];
    case 'eth_newBlockFilter':
      return [];
    case 'eth_newPendingTransactionFilter':
      return [];
    case 'eth_uninstallFilter':
      return ['0x0'];
    case 'eth_getFilterChanges':
      return ['0x0'];
    case 'eth_getFilterLogs':
      return ['0x0'];
    case 'eth_getLogs':
      return [{ fromBlock: 'latest', toBlock: 'latest', limit: 1 }];

    // Bor methods
    case 'bor_getAuthor':
      return ['latest'];
    case 'bor_getCurrentValidators':
      return [];
    case 'bor_getCurrentProposer':
      return [];
    case 'bor_getRootHash':
      return [0, 100];
    case 'bor_getSignersAtHash':
      return [getBlockHash()];
    case 'bor_getSnapshotAtHash':
      return [getBlockHash()];

    // Erigon methods
    case 'erigon_forks':
      return [];
    case 'erigon_getHeaderByNumber':
      return ['latest'];
    case 'erigon_getHeaderByHash':
      return [getBlockHash()];
    case 'erigon_getBlockByTimestamp':
      return [Math.floor(Date.now() / 1000) - 60, false];
    case 'erigon_getLogsByHash':
      return [getBlockHash()];
    case 'erigon_blockNumber':
      return [];
    case 'erigon_cacheCheck':
      return [];

    // Debug methods - require { tracer: 'callTracer' } config
    case 'debug_traceTransaction':
      return [getTxHash(), { tracer: 'callTracer' }];
    case 'debug_traceCall':
      return [{ to: settings.archiveTestAddress }, 'latest', { tracer: 'callTracer' }];
    case 'debug_traceBlockByNumber':
      return [getBlockNumber(), { tracer: 'callTracer' }];
    case 'debug_traceBlockByHash':
      return [getBlockHash(), { tracer: 'callTracer' }];
    case 'debug_storageRangeAt':
      return [getBlockHash(), 0, settings.archiveTestAddress, '0x0000000000000000000000000000000000000000000000000000000000000000', 1000];
    case 'debug_getBadBlocks':
      return [];
    case 'debug_accountRange':
      return [getBlockHash(), 0, '0x0000000000000000000000000000000000000000000000000000000000000000', 100];
    case 'debug_getModifiedAccountsByNumber':
      // For archive, use archive block range; for latest, use recent blocks
      if (isArchive) {
        return [archiveBlockTag, archiveBlockTag];
      }
      return [getBlockNumber(), getBlockNumber()];
    case 'debug_getModifiedAccountsByHash':
      return [getBlockHash(), getBlockHash()];

    // Trace methods
    case 'trace_call':
      return [{ to: settings.archiveTestAddress }, ['trace'], 'latest'];
    case 'trace_callMany':
      return [[[{ to: settings.archiveTestAddress }, ['trace']]], 'latest'];
    case 'trace_rawTransaction':
      return [KNOWN_RAW_TX, ['trace']];
    case 'trace_replayBlockTransactions':
      return [getBlockNumber(), ['trace']];
    case 'trace_replayTransaction':
      return [getTxHash(), ['trace']];
    case 'trace_block':
      return [getBlockNumber()];
    case 'trace_filter':
      return [{ fromBlock: getBlockNumber(), toBlock: getBlockNumber() }];
    case 'trace_get':
      return [getTxHash(), ['0x0']];
    case 'trace_transaction':
      return [getTxHash()];

    // TxPool methods
    case 'txpool_content':
      return [];
    case 'txpool_inspect':
      return [];
    case 'txpool_status':
      return [];

    default:
      return [];
  }
}
