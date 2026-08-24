import type { ProjectRunRecord, ProjectRunStage } from "./projectRunContract";

export const PROJECT_EXECUTION_SEQUENCE: ProjectRunStage[] = ["programming", "program_test", "soft_launch", "fieldwork", "monitoring", "closed", "data_ready"];

export function canTransitionProjectStage(from: ProjectRunStage, to: ProjectRunStage) {
  if (from === to || to === "programming") return true;
  return PROJECT_EXECUTION_SEQUENCE.indexOf(to) === PROJECT_EXECUTION_SEQUENCE.indexOf(from) + 1;
}

export function programConfigurationReady(programId: string, accessUrl: string) {
  const normalizedUrl = accessUrl.trim();
  return Boolean(programId.trim() && (/^https?:\/\//i.test(normalizedUrl) || /^\/(?!\/)/.test(normalizedUrl)));
}

export function checkSetReady(checks: Record<string, boolean>) {
  const values = Object.values(checks);
  return values.length > 0 && values.every(Boolean);
}

export function deCheckReady(completedN: number, randomSeed: string, checks: Record<string, boolean>) {
  return Number.isFinite(completedN) && completedN >= 30 && Boolean(randomSeed.trim()) && checkSetReady(checks);
}

export function fieldworkCloseReady(completedN: number, targetN: number, minimumQuotaCompletion: number) {
  return Number.isFinite(completedN) && Number.isFinite(targetN) && completedN >= targetN && minimumQuotaCompletion >= 100;
}

export function projectRunStageEvidenceReady(record: ProjectRunRecord) {
  if (record.stage === "programming") return true;
  if (!record.program || !programConfigurationReady(record.program.programId, record.program.accessUrl)) return false;
  if (record.stage === "program_test") return true;
  if (!record.programTest || !checkSetReady({
    questionnaireLoaded: record.programTest.questionnaireLoaded,
    routingPassed: record.programTest.routingPassed,
    validationPassed: record.programTest.validationPassed,
    completionPassed: record.programTest.completionPassed,
  })) return false;
  if (record.stage === "soft_launch") return true;
  if (!record.softLaunch || !deCheckReady(record.softLaunch.completedN, record.softLaunch.randomSeed ?? "", {
    routingPassed: record.softLaunch.routingPassed,
    randomizationPassed: record.softLaunch.randomizationPassed,
    fieldMapPassed: record.softLaunch.fieldMapPassed,
    quotaCountPassed: record.softLaunch.quotaCountPassed,
  })) return false;
  if (record.stage === "fieldwork") return true;
  if (!record.fieldwork.startedAt) return false;
  if (record.stage === "monitoring") return true;
  if (!fieldworkCloseReady(record.fieldwork.completedN, record.targetN, record.fieldwork.minimumQuotaCompletion)) return false;
  if (record.stage === "closed") return true;
  return Boolean(record.dataConfirmation && record.finalRaw && record.finalRaw.designVersion === record.designVersion);
}
