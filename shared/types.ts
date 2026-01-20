export type TestStatus = 'pass' | 'fail' | 'timeout' | 'unsupported' | 'skipped';

export interface Endpoint {
  url: string;
  name: string;
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
  erigon: string[];
  debug: string[];
  trace: string[];
  txpool: string[];
  websocket: string[];
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
}

export interface EndpointResults {
  url: string;
  name: string;
  nodeType: 'archive' | 'full' | 'unknown';
  avgResponseMs: number;
  results: Record<string, TestResult>;
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
}

export type Category = keyof MethodCategories;
