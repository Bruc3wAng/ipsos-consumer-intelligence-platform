import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RawProductionResult } from "./rawDataProduction";
import { buildGridCsv, buildTableCsv, gridCsvFileName, tableCsvFileName, type TableFamily } from "./tableDelivery.ts";

export type ProjectResultBinding = {
  runId: string;
  designVersion: string;
  designConfirmationKey: string;
};

const PROJECT_RESULT_ROOT = path.join(process.cwd(), "output", "packaged-food-beverage", "project-runs");
const SAFE_KEY = /^[A-Za-z0-9._-]{1,100}$/;
const TABLE_FAMILIES: TableFamily[] = ["count", "no_sig", "sig"];

function assertSafe(value: string, label: string) {
  if (!SAFE_KEY.test(value)) throw new Error(`${label}格式无效`);
}

export function projectResultKey(runId: string, designVersion: string) {
  assertSafe(runId, "运行ID");
  assertSafe(designVersion, "设计版本");
  return `${runId}__${designVersion}`;
}

function versionedFileName(fileName: string, binding: ProjectResultBinding) {
  const suffix = `_${binding.designVersion}_${binding.runId}`;
  return fileName.replace(/\.csv$/i, `${suffix}.csv`);
}

function artifactKey(scope: string, family: TableFamily) {
  return `${scope}-${family.replace("_", "-")}`;
}

export async function storeProjectResult(binding: ProjectResultBinding, result: RawProductionResult) {
  if (!binding.designConfirmationKey || binding.designConfirmationKey.length > 500 || /[\u0000-\u001F]/.test(binding.designConfirmationKey)) throw new Error("设计确认键格式无效");
  const resultKey = projectResultKey(binding.runId, binding.designVersion);
  const storedAt = new Date().toISOString();
  const artifactRoot = path.join(PROJECT_RESULT_ROOT, resultKey);
  await mkdir(artifactRoot, { recursive: true });
  const artifacts: NonNullable<NonNullable<RawProductionResult["binding"]>["artifacts"]> = [];
  for (const banner of result.table.bannerGroups) {
    for (const family of TABLE_FAMILIES) {
      const fileName = versionedFileName(tableCsvFileName(banner, family, "zh"), binding);
      await writeFile(path.join(artifactRoot, fileName), buildTableCsv(result, banner.key, family, "zh"), "utf8");
      artifacts.push({
        key: artifactKey(`banner-${banner.key}`, family),
        kind: "table_csv",
        fileName,
        labelZh: `${banner.labelZh} · ${family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig"}`,
        labelEn: `${banner.labelEn} · ${family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig"}`,
      });
    }
  }
  for (const grid of result.table.grids) {
    for (const family of TABLE_FAMILIES) {
      const baseName = grid.key === "grid101" ? gridCsvFileName(family, "zh") : `中国薄脆饼干新品概念与定价研究_${grid.key}_${family}.csv`;
      const fileName = versionedFileName(baseName, binding);
      await writeFile(path.join(artifactRoot, fileName), buildGridCsv(result, grid.key, family, "zh"), "utf8");
      artifacts.push({
        key: artifactKey(`grid-${grid.key}`, family),
        kind: "table_csv",
        fileName,
        labelZh: `${grid.labelZh} · ${family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig"}`,
        labelEn: `${grid.labelEn} · ${family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig"}`,
      });
    }
  }
  const boundResult: RawProductionResult = {
    ...result,
    binding: { ...binding, resultKey, storedAt, artifacts },
  };
  await mkdir(PROJECT_RESULT_ROOT, { recursive: true });
  const target = path.join(PROJECT_RESULT_ROOT, `${resultKey}.json`);
  const temporary = path.join(PROJECT_RESULT_ROOT, `.${resultKey}.${process.pid}.tmp`);
  await writeFile(temporary, JSON.stringify(boundResult), "utf8");
  await rename(temporary, target);
  await writeFile(path.join(PROJECT_RESULT_ROOT, `${resultKey}.manifest.json`), JSON.stringify({
    resultKey,
    runId: binding.runId,
    designVersion: binding.designVersion,
    sourceFile: result.meta.fileName,
    eligibleRowCount: result.meta.eligibleRowCount,
    storedAt,
    artifacts,
  }), "utf8");
  return boundResult;
}

export async function readProjectResult(runId: string, designVersion: string) {
  const resultKey = projectResultKey(runId, designVersion);
  const source = path.join(PROJECT_RESULT_ROOT, `${resultKey}.json`);
  const parsed = JSON.parse(await readFile(source, "utf8")) as RawProductionResult;
  if (parsed.binding?.runId !== runId || parsed.binding?.designVersion !== designVersion) throw new Error("项目结果版本不一致");
  return parsed;
}

export async function readProjectResultArtifact(runId: string, designVersion: string, requestedArtifactKey: string) {
  assertSafe(requestedArtifactKey, "结果文件标识");
  const result = await readProjectResult(runId, designVersion);
  const artifact = result.binding?.artifacts?.find((item) => item.key === requestedArtifactKey);
  if (!artifact) throw new Error("未找到对应结果文件");
  if (path.basename(artifact.fileName) !== artifact.fileName) throw new Error("结果文件路径无效");
  const resultKey = projectResultKey(runId, designVersion);
  const contents = await readFile(path.join(PROJECT_RESULT_ROOT, resultKey, artifact.fileName), "utf8");
  return { artifact, contents };
}
