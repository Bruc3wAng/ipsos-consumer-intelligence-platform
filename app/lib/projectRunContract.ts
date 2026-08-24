export type QuotaMode = "independent" | "age_gender" | "priority_boost";
export type NextWaveExperimentKey = "health" | "price" | "concept";

export type ProjectQuestionSnapshot = {
  module: string;
  questionId: string;
  questionText: string;
  responseType: string;
  options: string[];
  base: string;
  logic: string;
  kpiIds: string[];
  modelRoles: string[];
  indicatorLayer: string;
};

export type FinalQuestionnaireSnapshot = {
  version: string;
  finalizedAt: string;
  questions: ProjectQuestionSnapshot[];
  retainedKpis: string[];
  reviewKpis: string[];
  removedKpis: string[];
  blockedModelRoles: string[];
};

export type LockedProjectDesign = {
  projectId: "SNACK-CN-CRACKER-001";
  designVersion: string;
  artifactVersion: "V2";
  revision: number;
  lockedAt: string;
  confirmationKey: string;
  sampleN: number;
  quotaMode: QuotaMode;
  experimentKeys: NextWaveExperimentKey[];
  experimentQuestionIds: string[];
  sourceProductionFile: string;
  sourceProductionProcessedAt: string;
  files: { questionnaire: string; quota: string; dpSpec: string };
  finalQuestionnaire?: FinalQuestionnaireSnapshot;
  quotaRows?: string[][];
};

export type ProjectDesignLockInput = Omit<LockedProjectDesign, "designVersion" | "revision" | "lockedAt">;
export type ProjectRunStage = "programming" | "program_test" | "soft_launch" | "fieldwork" | "monitoring" | "closed" | "data_ready";

export type ProjectDeliveryFile = {
  fileName: string;
  version: string;
  kind: "report" | "model" | "table" | "other";
  size: number;
  registeredAt: string;
};

export type ProjectRunRecord = {
  runId: string;
  projectId: LockedProjectDesign["projectId"];
  designVersion: string;
  designConfirmationKey: string;
  designSnapshot?: LockedProjectDesign;
  stage: ProjectRunStage;
  createdAt: string;
  updatedAt: string;
  targetN: number;
  program?: { programId: string; accessUrl: string; confirmedAt: string };
  programTest?: { questionnaireLoaded: boolean; routingPassed: boolean; validationPassed: boolean; completionPassed: boolean; confirmedAt: string };
  softLaunch?: { completedN: number; randomSeed?: string; routingPassed: boolean; randomizationPassed: boolean; fieldMapPassed: boolean; quotaCountPassed: boolean; confirmedAt: string };
  fieldwork: { completedN: number; minimumQuotaCompletion: number; frmUrl?: string; startedAt?: string; updatedAt: string | null };
  closedAt?: string;
  dataConfirmation?: { source: "current_collection" | "uploaded_raw"; fileName: string; confirmedAt: string };
  finalRaw?: { fileName: string; processedAt: string; rowCount: number; eligibleRowCount: number; designVersion: string; resultKey: string; storedAt: string };
  finalDeliverables?: ProjectDeliveryFile[];
};
