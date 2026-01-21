export type TestStatus = 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped';

export interface LatestData {
  blockNumber: string;  // Hex string
  blockHash: string;    // 32-byte hex
  txHash: string;       // 32-byte hex
}

export interface Endpoint {
  url: string;
  name: string;
  delayBetweenCallsMs?: number;  // Optional per-endpoint override
  sensitive?: boolean;  // If true, URL is hidden in UI and API responses
}

export interface TestSettings {
  timeoutMs: number;
  delayBetweenCallsMs: number;
  archiveBlockNumber: number;
  archiveTestAddress: string;
  concurrency: number;
}

export interface MethodCategories {
  basic: string[];
  state: string[];
  block: string[];
  transaction: string[];
  filter: string[];
  archive: string[];
  bor: string[];
  debug: string[];
  trace: string[];
  txpool: string[];
  batch: string[];
}

export interface Config {
  endpoints: Endpoint[];
  testSettings: TestSettings;
  methods: MethodCategories;
}

export interface TestResult {
  status: TestStatus;
  responseMs?: number;
  error?: string;
  response?: unknown;
}

export interface EndpointResults {
  url: string;
  name: string;
  nodeType: 'archive' | 'full' | 'unknown';
  avgResponseMs: number;
  medianResponseMs: number;
  results: Record<string, TestResult>;
  sensitive?: boolean;  // If true, URL is hidden in UI and API responses
}

export interface Results {
  lastRun: string;
  runDurationMs: number;
  endpoints: Record<string, EndpointResults>;
}

export interface ProgressEvent {
  type: 'progress' | 'result' | 'complete' | 'error';
  endpoint?: string;
  category?: string;
  method?: string;
  completed?: number;
  total?: number;
  status?: TestStatus;
  responseMs?: number;
  runDurationMs?: number;
  error?: string;
  globalCompleted?: number;
  globalTotal?: number;
}

export type Category = keyof MethodCategories;
