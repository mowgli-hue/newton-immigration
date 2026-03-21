#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const flowdeskDataDir = process.env.FLOWDESK_DATA_DIR;
const flowdeskStorePath = process.env.FLOWDESK_STORE_PATH;
const localDefault = path.resolve(process.cwd(), "data/store.json");
const dataDirPath = flowdeskDataDir ? path.join(flowdeskDataDir, "store.json") : localDefault;
const sourcePath = flowdeskStorePath || dataDirPath;

if (!fs.existsSync(sourcePath)) {
  console.error(`Store file not found: ${sourcePath}`);
  process.exit(1);
}

const backupDir = path.resolve(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destPath = path.join(backupDir, `store-backup-${stamp}.json`);
fs.copyFileSync(sourcePath, destPath);
console.log(`Backup written: ${destPath}`);

