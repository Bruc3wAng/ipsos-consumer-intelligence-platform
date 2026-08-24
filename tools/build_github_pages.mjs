#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const projectRoot = process.cwd();
const apiRoot = resolve(projectRoot, "app/api");
const holdingRoot = mkdtempSync(join(tmpdir(), "aipc-static-api-"));
const heldApi = join(holdingRoot, "api");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/ipsos-consumer-intelligence-platform";

try {
  if (existsSync(apiRoot)) renameSync(apiRoot, heldApi);
  execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_PUBLIC_STATIC_DEMO: "true",
    },
    stdio: "inherit",
  });
} finally {
  if (existsSync(heldApi) && !existsSync(apiRoot)) renameSync(heldApi, apiRoot);
  rmSync(holdingRoot, { recursive: true, force: true });
}
