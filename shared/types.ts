export type TestStatus = 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped';

export interface LatestData {
  blockNumber: string;  // Hex string
  blockHash: string;    // 32-byte hex
  prevBlockHash: string;  // 32-byte hex - hash of block before blockNumber
  txHash: string;       // 32-byte hex
}

export interface Endpoint {
  url: string;
  name: string;
  delayBetweenCallsMs?: number;  // Optional per-endpoint override
  sensitive?: boolean;  // If true, URL is hidden in UI and API responses
  showInBenchmark?: boolean;  // If true, endpoint appears in benchmark page
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

// Benchmark types
export interface BenchmarkDataPoint {
  timestamp: number;
  blockNumber: number | null;
  responseMs: number | null;
  success: boolean;
}

export interface BenchmarkEndpointData {
  id: string;
  url: string;
  name: string;
  sensitive?: boolean;
  isTemporary?: boolean;
  history: BenchmarkDataPoint[];
  totalCalls: number;
  successfulCalls: number;
}

export interface BenchmarkState {
  endpoints: Record<string, BenchmarkEndpointData>;
  colorMap: Record<string, string>; // Maps endpoint ID to color
  pollingIntervalMs: number;
  maxDataPoints: number;
  isRunning: boolean;
}

export interface BenchmarkEvent {
  type: 'init' | 'update' | 'endpoint_added' | 'endpoint_removed' | 'stopped';
  state?: BenchmarkState;
  endpointId?: string;
  dataPoint?: BenchmarkDataPoint;
}
