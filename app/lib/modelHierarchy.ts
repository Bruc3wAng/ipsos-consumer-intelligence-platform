export type ModelLayer = {
  id: string;
  parentId: string | null;
  zh: string;
  en: string;
  detailZh: string;
  detailEn: string;
  sharingMode: "shared_prior" | "domain_calibration" | "project_only";
};

export type MetricPromotionCandidate = {
  constructAligned: boolean;
  definitionAligned: boolean;
  denominatorAligned: boolean;
  scaleMapped: boolean;
  segmentInvariant: boolean;
  timeStable: boolean;
  aggregateUseAllowed: boolean;
};

export type MetricPromotionDecision = {
  eligible: boolean;
  destination: "parent_candidate" | "current_layer";
  failedGates: string[];
};

export type ModelFeedbackStep = {
  id: string;
  zh: string;
  en: string;
  outputZh: string;
  outputEn: string;
};

export type RegistryContract = {
  metricId: string;
  questionId: string;
  displayOrder: string;
  optionCode: string;
  rawVariable: string;
  projectIsolation: string;
};

export const REGISTRY_CONTRACT: RegistryContract = {
  metricId: "同一构念、定义、时间窗、Base与单位不变时保持稳定；任一项改变则新建版本或新ID",
  questionId: "通用题号按题库主键保持稳定；题意或量表发生实质变化时新建题号并保留旧题",
  displayOrder: "问卷展示顺序与题号解耦；项目可以调整显示顺序，但不改稳定题号",
  optionCode: "既有Code不改号、不复用；新增选项追加Code；停用Code保留在字典中",
  rawVariable: "Raw字段由命名空间、稳定题号与子项Code生成；每个字段可回溯到题库版本和指标ID",
  projectIsolation: "项目专项题、品牌表达和产品变量使用独立命名空间，只进入本项目模型，禁止自动上行",
};

export function buildMetricKey(namespace: string, metricId: string): string {
  return `${namespace}.${metricId}`.replace(/[^A-Za-z0-9_.-]+/g, "_").toUpperCase();
}

export function buildRawVariable(namespace: string, questionId: string): string {
  const normalizedNamespace = namespace.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  const normalizedQuestion = questionId.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  return `${normalizedNamespace}_${normalizedQuestion}`;
}

export const MODEL_FEEDBACK_CYCLE: ModelFeedbackStep[] = [
  { id: "definition", zh: "上层标准下发", en: "Standards flow down", outputZh: "指标ID · 定义 · Base · 量表 · 先验", outputEn: "Metric ID · definition · base · scale · prior" },
  { id: "collection", zh: "下层项目收数", en: "Local data collection", outputZh: "问卷Raw · 行为/经营结果 · 项目上下文", outputEn: "Survey raw · behavior/outcomes · project context" },
  { id: "local_fit", zh: "本层训练校准", en: "Local fit and calibration", outputZh: "行业参数 · 项目参数 · 样本外表现", outputEn: "Domain parameters · project parameters · holdout performance" },
  { id: "promotion", zh: "通用指标复核", en: "Shared-metric review", outputZh: "口径映射 · 等值检验 · 跨期稳定性 · 授权", outputEn: "Definition map · invariance · temporal stability · permission" },
  { id: "update", zh: "上级模型更新", en: "Parent model update", outputZh: "匿名聚合统计 · 可共享参数 · 新先验", outputEn: "Aggregated statistics · shareable parameters · updated priors" },
];

export const SNACK_MODEL_PATH: ModelLayer[] = [
  { id: "consumer_core", parentId: null, zh: "跨行业消费者核心", en: "Cross-industry consumer core", detailZh: "人口属性 · 购买态度", detailEn: "Demographics · purchase attitudes", sharingMode: "shared_prior" },
  { id: "fmcg", parentId: "consumer_core", zh: "快速消费品", en: "FMCG", detailZh: "购买频率 · 渠道", detailEn: "Frequency · channels", sharingMode: "shared_prior" },
  { id: "food_beverage", parentId: "fmcg", zh: "食品与饮料", en: "Food & beverage", detailZh: "食用场景 · 健康取向", detailEn: "Occasions · health orientation", sharingMode: "domain_calibration" },
  { id: "packaged_food", parentId: "food_beverage", zh: "包装食品", en: "Packaged food", detailZh: "规格 · 包装 · 储存", detailEn: "Pack · format · storage", sharingMode: "domain_calibration" },
  { id: "snacks", parentId: "packaged_food", zh: "零食", en: "Snacks", detailZh: "零食花费 · 偏好", detailEn: "Snack spend · preference", sharingMode: "domain_calibration" },
  { id: "puffed_snacks", parentId: "snacks", zh: "膨化食品", en: "Puffed snacks", detailZh: "口味 · 口感 · 形态", detailEn: "Flavour · texture · form", sharingMode: "domain_calibration" },
  { id: "snack_project", parentId: "puffed_snacks", zh: "项目专项", en: "Project-specific", detailZh: "品牌 · 概念 · 产品", detailEn: "Brand · concept · product", sharingMode: "project_only" },
];

export const AIPC_MODEL_PATH: ModelLayer[] = [
  { id: "consumer_core", parentId: null, zh: "跨行业消费者核心", en: "Cross-industry consumer core", detailZh: "人口属性 · 购买态度", detailEn: "Demographics · purchase attitudes", sharingMode: "shared_prior" },
  { id: "durable_goods", parentId: "consumer_core", zh: "耐用消费品", en: "Consumer durables", detailZh: "换新周期 · 决策角色", detailEn: "Replacement cycle · decision role", sharingMode: "shared_prior" },
  { id: "consumer_electronics", parentId: "durable_goods", zh: "消费电子", en: "Consumer electronics", detailZh: "设备组合 · 技术态度", detailEn: "Device portfolio · technology attitudes", sharingMode: "domain_calibration" },
  { id: "pc", parentId: "consumer_electronics", zh: "个人电脑", en: "PC", detailZh: "用途 · 品牌 · 价格带", detailEn: "Use cases · brand · price tier", sharingMode: "domain_calibration" },
  { id: "ai_pc", parentId: "pc", zh: "AI PC", en: "AI PC", detailZh: "AI认知 · 功能价值", detailEn: "AI awareness · feature value", sharingMode: "domain_calibration" },
  { id: "aipc_project", parentId: "ai_pc", zh: "项目专项", en: "Project-specific", detailZh: "产品 · 概念 · Campaign", detailEn: "Product · concept · campaign", sharingMode: "project_only" },
];

const PROMOTION_GATES: Array<[keyof MetricPromotionCandidate, string]> = [
  ["constructAligned", "构念不一致"],
  ["definitionAligned", "指标定义或时间窗不一致"],
  ["denominatorAligned", "Base或分母不一致"],
  ["scaleMapped", "题目或量表不可映射"],
  ["segmentInvariant", "关键人群测量等值性未通过"],
  ["timeStable", "跨期稳定性未通过"],
  ["aggregateUseAllowed", "未获得匿名聚合复用授权"],
];

export function assessMetricPromotion(candidate: MetricPromotionCandidate): MetricPromotionDecision {
  const failedGates = PROMOTION_GATES.filter(([gate]) => !candidate[gate]).map(([, reason]) => reason);
  return {
    eligible: failedGates.length === 0,
    destination: failedGates.length === 0 ? "parent_candidate" : "current_layer",
    failedGates,
  };
}

export function validateModelPath(path: ModelLayer[]): boolean {
  if (!path.length || path[0].parentId !== null) return false;
  return path.every((layer, index) => index === 0 || layer.parentId === path[index - 1].id);
}
