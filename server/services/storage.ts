import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { Config, Results } from '../../shared/types.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const RESULTS_PATH = path.join(process.cwd(), 'results.json');

export async function loadConfig(): Promise<Config> {
  const content = await readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function saveConfig(config: Config): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
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
