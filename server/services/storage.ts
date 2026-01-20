import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { Config, Results, Endpoint } from '../../shared/types.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'config.local.json');
const RESULTS_PATH = path.join(process.cwd(), 'results.json');

export const MASKED_URL = '***SENSITIVE***';

interface LocalConfig {
  endpoints: Endpoint[];
}

/**
 * Load local config file if it exists.
 * Returns null if the file doesn't exist.
 */
async function loadLocalConfig(): Promise<LocalConfig | null> {
  if (!existsSync(LOCAL_CONFIG_PATH)) {
    return null;
  }
  const content = await readFile(LOCAL_CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load merged config from both public and local config files.
 * Local endpoints are marked as sensitive.
 */
export async function loadConfig(): Promise<Config> {
  const content = await readFile(CONFIG_PATH, 'utf-8');
  const config: Config = JSON.parse(content);

  // Load local config and merge endpoints
  const localConfig = await loadLocalConfig();
  if (localConfig?.endpoints) {
    // Mark all local endpoints as sensitive and add them
    const sensitiveEndpoints = localConfig.endpoints.map(ep => ({
      ...ep,
      sensitive: true,
    }));
    config.endpoints = [...config.endpoints, ...sensitiveEndpoints];
  }

  return config;
}

/**
 * Save config to public config file.
 * Sensitive endpoints are filtered out (they should only exist in config.local.json).
 */
export async function saveConfig(config: Config): Promise<void> {
  // Filter out sensitive endpoints - they shouldn't be saved to public config
  const publicConfig = {
    ...config,
    endpoints: config.endpoints.filter(ep => !ep.sensitive),
  };
  await writeFile(CONFIG_PATH, JSON.stringify(publicConfig, null, 2));
}

/**
 * Mask sensitive URLs in results for API responses.
 */
export function maskSensitiveResults(results: Results | null): Results | null {
  if (!results) return null;

  const maskedEndpoints: Record<string, typeof results.endpoints[string]> = {};

  for (const [id, endpoint] of Object.entries(results.endpoints)) {
    maskedEndpoints[id] = {
      ...endpoint,
      url: endpoint.sensitive ? MASKED_URL : endpoint.url,
    };
  }

  return {
    ...results,
    endpoints: maskedEndpoints,
  };
}

/**
 * Mask sensitive URLs in config for API responses.
 */
export function maskSensitiveConfig(config: Config): Config {
  return {
    ...config,
    endpoints: config.endpoints.map(ep => ({
      ...ep,
      url: ep.sensitive ? MASKED_URL : ep.url,
    })),
  };
}

export async function loadResults(): Promise<Results | null> {
  if (!existsSync(RESULTS_PATH)) {
    return null;
  }
  const content = await readFile(RESULTS_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function saveResults(results: Results): Promise<void> {
  await writeFile(RESULTS_PATH, JSON.stringify(results, null, 2));
}
