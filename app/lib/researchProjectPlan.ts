export type ResearchProjectObjective = "tracking" | "concept" | "pricing" | "channel";
export type ResearchProjectStage = "design" | "fieldwork" | "analysis" | "validation" | "outcome";
export type ResearchProjectStatus = "ready" | "planned" | "waiting";

export type ResearchProjectInput = {
  objective: ResearchProjectObjective;
  sampleN: number;
  marketScope: "china" | "china_overseas" | "overseas";
  markets: string;
  availableEvidence: string[];
};

type MetricDefinition = { metric_id: string; name: string; role: string; question: string; denominator: string; decision: string };
type DeliveryTemplate = {
  deliverable_id: string;
  phase: ResearchProjectStage;
  name: string;
  name_en: string;
  owner: string;
  owner_en: string;
  required_evidence: string[];
  acceptance: string;
  acceptance_en: string;
};

export type ResearchProjectSystem = {
  evidence_requirements: Array<{ evidence_id: string; name: string; name_en: string; phase: string; enables: string; enables_en: string }>;
  delivery_templates: DeliveryTemplate[];
};

const OBJECTIVE_EVIDENCE_PRIORITY: Record<ResearchProjectObjective, string[]> = {
  tracking: ["prior_questionnaire", "prior_raw", "prior_tables"],
  concept: ["product_spec", "qualitative", "prior_tables"],
  pricing: ["product_spec", "prior_tables", "business_outcome"],
  channel: ["prior_raw", "qualitative", "social_search"],
};

export const PROJECT_STAGE_LABELS: Record<ResearchProjectStage, { zh: string; en: string }> = {
  design: { zh: "研究设计", en: "Research design" },
  fieldwork: { zh: "数据采集", en: "Fieldwork" },
  analysis: { zh: "KPI与模型", en: "KPIs & models" },
  validation: { zh: "跨期验证", en: "Cross-period validation" },
  outcome: { zh: "结果回流", en: "Outcome calibration" },
};

export function marginOfError95(sampleN: number) {
  if (!Number.isFinite(sampleN) || sampleN <= 0) return 0;
  return 98 / Math.sqrt(sampleN);
}

export function buildResearchProjectPlan(
  input: ResearchProjectInput,
  metrics: MetricDefinition[],
  system: ResearchProjectSystem,
) {
  const evidence = new Set(input.availableEvidence);
  const priorityEvidence = OBJECTIVE_EVIDENCE_PRIORITY[input.objective];
  const missingPriorityEvidence = priorityEvidence.filter((key) => !evidence.has(key));
  const deliverables = system.delivery_templates.map((item) => {
    const missingEvidence = item.required_evidence.filter((key) => !evidence.has(key));
    const requiresMarketLocalization = input.marketScope !== "china" && ["D03", "D04"].includes(item.deliverable_id);
    const status: ResearchProjectStatus = item.phase === "design"
      ? requiresMarketLocalization ? "planned" : "ready"
      : item.phase === "fieldwork"
        ? "planned"
        : missingEvidence.length === 0
          ? "ready"
          : "waiting";
    return { ...item, status, missingEvidence };
  });
  const byStage = (Object.keys(PROJECT_STAGE_LABELS) as ResearchProjectStage[]).map((stage) => {
    const rows = deliverables.filter((item) => item.phase === stage);
    const status: ResearchProjectStatus = rows.every((item) => item.status === "ready")
      ? "ready"
      : rows.some((item) => item.status === "planned")
        ? "planned"
        : "waiting";
    return { stage, status, ready: rows.filter((item) => item.status === "ready").length, total: rows.length };
  });
  const metricRoles = metrics.reduce<Record<string, number>>((profile, metric) => {
    profile[metric.role] = (profile[metric.role] ?? 0) + 1;
    return profile;
  }, {});
  const marketCount = input.marketScope === "china" ? 1 : Math.max(1, input.markets.split(/[、,，;；]/).map((item) => item.trim()).filter(Boolean).length + (input.marketScope === "china_overseas" ? 1 : 0));
  return {
    precision95Pp: Number(marginOfError95(input.sampleN).toFixed(1)),
    stableMutuallyExclusiveGroups: Math.max(1, Math.floor(input.sampleN / 400)),
    marketCount,
    metricRoles,
    priorityEvidence,
    missingPriorityEvidence,
    deliverables,
    byStage,
    readyDeliverables: deliverables.filter((item) => item.status === "ready").length,
    waitingDeliverables: deliverables.filter((item) => item.status === "waiting").length,
  };
}
