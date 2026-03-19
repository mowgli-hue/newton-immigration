import { join } from "node:path";

export function getDataDir(): string {
  return process.env.FLOWDESK_DATA_DIR || join(process.cwd(), "data");
}

export function getStorePath(): string {
  return process.env.FLOWDESK_STORE_PATH || join(getDataDir(), "store.json");
}
