import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectRunRecord } from "./projectRunContract";

const PROJECT_RUN_ROOT = path.join(process.cwd(), "output", "packaged-food-beverage", "project-run-records");
const SAFE_KEY = /^[A-Za-z0-9._-]{1,100}$/;
const STAGES = new Set(["programming", "soft_launch", "fieldwork", "closed", "data_ready"]);

function validate(record: ProjectRunRecord) {
  if (!SAFE_KEY.test(record.runId) || !SAFE_KEY.test(record.designVersion)) throw new Error("项目运行标识格式无效");
  if (record.projectId !== "SNACK-CN-CRACKER-001" || !STAGES.has(record.stage)) throw new Error("项目运行记录无效");
  if (!record.designConfirmationKey || !Number.isFinite(record.targetN) || !record.fieldwork) throw new Error("项目运行记录缺少必要字段");
  if (record.designSnapshot && (record.designSnapshot.projectId !== record.projectId || record.designSnapshot.designVersion !== record.designVersion || record.designSnapshot.confirmationKey !== record.designConfirmationKey)) throw new Error("项目设计快照与运行记录不一致");
}

function recordKey(record: Pick<ProjectRunRecord, "runId" | "designVersion">) {
  return `${record.runId}__${record.designVersion}`;
}

export async function storeProjectRunRecord(record: ProjectRunRecord) {
  validate(record);
  await mkdir(PROJECT_RUN_ROOT, { recursive: true });
  const key = recordKey(record);
  const target = path.join(PROJECT_RUN_ROOT, `${key}.run.json`);
  try {
    const current = JSON.parse(await readFile(target, "utf8")) as ProjectRunRecord;
    validate(current);
    if (current.updatedAt > record.updatedAt) return current;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      // Invalid or partial prior records are replaced by the validated incoming version.
    }
  }
  const temporary = path.join(PROJECT_RUN_ROOT, `.${key}.${process.pid}.tmp`);
  await writeFile(temporary, JSON.stringify(record), "utf8");
  await rename(temporary, target);
  return record;
}

export async function listProjectRunRecords() {
  try {
    const names = (await readdir(PROJECT_RUN_ROOT)).filter((name) => name.endsWith(".run.json"));
    const records = await Promise.all(names.map(async (name) => {
      try {
        const record = JSON.parse(await readFile(path.join(PROJECT_RUN_ROOT, name), "utf8")) as ProjectRunRecord;
        validate(record);
        return record;
      } catch {
        return null;
      }
    }));
    return records.filter((item): item is ProjectRunRecord => Boolean(item)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}
