export type ProductionStatus = "ready" | "blocked";

export type FieldMapping = {
  canonical: string;
  sourceColumn: string;
  questionId: string;
  labelZh: string;
  labelEn: string;
  role: "id" | "weight" | "dimension" | "metric" | "model_feature";
};

export type ProductionCell = {
  baseN: number;
  weightedBase: number;
  positiveN: number;
  weightedPositive: number;
  percent: number | null;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  sigHigherThan: string[];
};

export type ProductionStatistic = "proportion" | "mean" | "median";

export type ProductionMetricDefinition = {
  key: string;
  questionId: string;
  labelZh: string;
  labelEn: string;
  sourceColumn: string;
  positiveRule: string;
  statistic: ProductionStatistic;
  groupKey: string;
  groupLabelZh: string;
  groupLabelEn: string;
  unit: "percent" | "score" | "times" | "cny";
  decimalPlaces: number;
};

export type ProductionMetricGroup = {
  key: string;
  labelZh: string;
  labelEn: string;
  questionRange: string;
  metricKeys: string[];
};

export type ProductionTableRow = {
  key: string;
  label: string;
  letter: string | null;
  baseN: number;
  metrics: Record<string, ProductionCell>;
};

export type ProductionBannerGroup = {
  key: "gender" | "age" | "region" | string;
  labelZh: string;
  labelEn: string;
  sourceColumn: string;
  relation: "independent_mutually_exclusive";
  confidenceLevel: number;
  totalLetter: "A";
  rows: ProductionTableRow[];
};

export type ProductionGridColumn = {
  key: string;
  label: string;
  letter: string;
  bannerKey: "total" | "gender" | "age" | "region" | string;
  baseN: number;
  metrics: Record<string, ProductionCell>;
};

export type ProductionGrid = {
  key: string;
  labelZh: string;
  labelEn: string;
  metricKeys: string[];
  columns: ProductionGridColumn[];
};

export type RawProductionResult = {
  binding?: {
    runId: string;
    designVersion: string;
    designConfirmationKey: string;
    resultKey: string;
    storedAt: string;
    artifacts?: Array<{
      key: string;
      kind: "table_csv";
      fileName: string;
      labelZh: string;
      labelEn: string;
    }>;
  };
  meta: {
    fileName: string;
    processedAt: string;
    rowCount: number;
    eligibleRowCount: number;
    columnCount: number;
    status: ProductionStatus;
  };
  schema: {
    mappings: FieldMapping[];
    mappedColumnCount: number;
    unmappedColumns: string[];
    requiredFields: string[];
    missingRequiredFields: string[];
  };
  structuralChecks: {
    duplicateRespondentIds: number;
    missingRespondentIds: number;
    invalidWeights: number;
    metricCount: number;
    warnings: string[];
    blockers: string[];
  };
  preview: {
    headers: string[];
    rows: string[][];
  };
  table: {
    banner: string;
    relation: "independent_mutually_exclusive" | "total_only";
    confidenceLevel: number;
    defaultBannerKey: string;
    bannerGroups: ProductionBannerGroup[];
    metricGroups: ProductionMetricGroup[];
    metricDefinitions: ProductionMetricDefinition[];
    grids: ProductionGrid[];
    rows: ProductionTableRow[];
  };
  model: {
    status: "fitted" | "blocked";
    target: string;
    targetSourceColumn: string | null;
    targetRule: string;
    trainN: number;
    testN: number;
    testAuc: number | null;
    testBrier: number | null;
    coefficients: Array<{
      variable: string;
      sourceColumn: string;
      standardizedBeta: number;
      oddsRatio: number;
      direction: "positive" | "negative";
    }>;
    blockers: string[];
    boundary: string;
  };
};

type FieldSpec = Omit<FieldMapping, "sourceColumn"> & {
  aliases: string[];
};

type MetricSpec = {
  key: string;
  canonical: string;
  questionId: string;
  labelZh: string;
  labelEn: string;
  positiveRule: string;
  statistic: ProductionStatistic;
  groupKey: string;
  groupLabelZh: string;
  groupLabelEn: string;
  unit: "percent" | "score" | "times" | "cny";
  decimalPlaces: number;
  isPositive?: (value: number, values: number[]) => boolean;
};

type ParsedRow = {
  source: Record<string, string>;
  respondentId: string;
  weight: number;
};

type BannerCategory = {
  labelZh: string;
  labelEn: string;
  letter: string;
  values: string[];
};

type BannerSpec = {
  key: "gender" | "age" | "region";
  canonical: "gender" | "age_group" | "region";
  labelZh: string;
  labelEn: string;
  categories: BannerCategory[];
};

const FIELD_SPECS: FieldSpec[] = [
  { canonical: "respondent_id", aliases: ["respondent_id", "respondentid", "response_id", "record", "id"], questionId: "SYS_ID", labelZh: "样本ID", labelEn: "Respondent ID", role: "id" },
  { canonical: "weight", aliases: ["weight", "final_weight", "wt", "weight_final"], questionId: "WEIGHT", labelZh: "最终权重", labelEn: "Final weight", role: "weight" },
  { canonical: "age_group", aliases: ["age_group", "agegroup", "age_band", "s1"], questionId: "S1", labelZh: "年龄", labelEn: "Age", role: "dimension" },
  { canonical: "gender", aliases: ["gender", "sex", "s2"], questionId: "S2", labelZh: "性别", labelEn: "Gender", role: "dimension" },
  { canonical: "region", aliases: ["region", "macro_region", "area", "s3"], questionId: "S3", labelZh: "地区", labelEn: "Region", role: "dimension" },
  { canonical: "penetration_3m", aliases: ["puffed_3m", "cracker_3m", "snack_3m", "q1", "q1_1"], questionId: "Q1", labelZh: "过去3个月购买", labelEn: "Purchased in past 3 months", role: "metric" },
  { canonical: "monthly_frequency", aliases: ["monthly_frequency", "purchase_frequency_monthly", "q2"], questionId: "Q2", labelZh: "月度购买频次", labelEn: "Monthly purchase frequency", role: "metric" },
  { canonical: "importance_taste", aliases: ["importance_taste", "q7_1"], questionId: "Q7_1", labelZh: "口味重要性", labelEn: "Taste importance", role: "metric" },
  { canonical: "importance_crispness", aliases: ["importance_crispness", "q7_2"], questionId: "Q7_2", labelZh: "酥脆口感重要性", labelEn: "Crispness importance", role: "metric" },
  { canonical: "importance_health", aliases: ["importance_health", "q7_3"], questionId: "Q7_3", labelZh: "健康属性重要性", labelEn: "Health importance", role: "metric" },
  { canonical: "importance_price", aliases: ["importance_price", "q7_4"], questionId: "Q7_4", labelZh: "价格重要性", labelEn: "Price importance", role: "metric" },
  { canonical: "importance_pack", aliases: ["importance_pack", "q7_5"], questionId: "Q7_5", labelZh: "包装重要性", labelEn: "Pack importance", role: "metric" },
  { canonical: "importance_novelty", aliases: ["importance_novelty", "q7_6"], questionId: "Q7_6", labelZh: "新奇感重要性", labelEn: "Novelty importance", role: "metric" },
  { canonical: "satisfaction_taste", aliases: ["satisfaction_taste", "q8_1"], questionId: "Q8_1", labelZh: "口味满足度", labelEn: "Taste satisfaction", role: "metric" },
  { canonical: "satisfaction_crispness", aliases: ["satisfaction_crispness", "q8_2"], questionId: "Q8_2", labelZh: "酥脆口感满足度", labelEn: "Crispness satisfaction", role: "metric" },
  { canonical: "satisfaction_health", aliases: ["satisfaction_health", "health_fit", "q8_3"], questionId: "Q8_3", labelZh: "健康需求匹配", labelEn: "Health fit", role: "metric" },
  { canonical: "satisfaction_price", aliases: ["satisfaction_price", "q8_4"], questionId: "Q8_4", labelZh: "价格满足度", labelEn: "Price satisfaction", role: "metric" },
  { canonical: "satisfaction_pack", aliases: ["satisfaction_pack", "pack_fit", "q8_5"], questionId: "Q8_5", labelZh: "包装满足度", labelEn: "Pack satisfaction", role: "metric" },
  { canonical: "satisfaction_novelty", aliases: ["satisfaction_novelty", "q8_6"], questionId: "Q8_6", labelZh: "新奇感满足度", labelEn: "Novelty satisfaction", role: "metric" },
  { canonical: "price_accept_6_9", aliases: ["accept_price_6_9", "price_accept_6_9", "q9_1"], questionId: "Q9_1", labelZh: "¥6.9接受", labelEn: "Acceptance at ¥6.9", role: "metric" },
  { canonical: "price_accept_8_9", aliases: ["accept_price_8_9", "price_accept_8_9", "q9_2", "price_accept_7_9", "accept_price_7_9"], questionId: "Q9_2", labelZh: "¥8.9接受", labelEn: "Acceptance at ¥8.9", role: "metric" },
  { canonical: "price_accept_9_9", aliases: ["accept_price_9_9", "price_accept_9_9", "q9_3"], questionId: "Q9_3", labelZh: "¥9.9接受", labelEn: "Acceptance at ¥9.9", role: "metric" },
  { canonical: "price_accept_10_9", aliases: ["accept_price_10_9", "price_accept_10_9", "q9_4"], questionId: "Q9_4", labelZh: "¥10.9接受", labelEn: "Acceptance at ¥10.9", role: "metric" },
  { canonical: "price_accept_12_9", aliases: ["accept_price_12_9", "price_accept_12_9", "q9_5"], questionId: "Q9_5", labelZh: "¥12.9接受", labelEn: "Acceptance at ¥12.9", role: "metric" },
  { canonical: "price_accept_15_9", aliases: ["accept_price_15_9", "price_accept_15_9", "q9_6"], questionId: "Q9_6", labelZh: "¥15.9接受", labelEn: "Acceptance at ¥15.9", role: "metric" },
  { canonical: "concept_relevance", aliases: ["concept_relevance", "q10_1"], questionId: "Q10_1", labelZh: "概念相关性", labelEn: "Concept relevance", role: "metric" },
  { canonical: "concept_uniqueness", aliases: ["concept_uniqueness", "q10_2"], questionId: "Q10_2", labelZh: "概念差异化", labelEn: "Concept uniqueness", role: "metric" },
  { canonical: "concept_credibility", aliases: ["concept_credibility", "q10_3"], questionId: "Q10_3", labelZh: "概念可信度", labelEn: "Concept credibility", role: "metric" },
  { canonical: "concept_trial", aliases: ["concept_trial", "concept_purchase_intent", "q10_4", "q10"], questionId: "Q10_4", labelZh: "概念购买意向", labelEn: "Concept trial intent", role: "metric" },
  { canonical: "ingredient_fit", aliases: ["ingredient_fit"], questionId: "MODEL_INGREDIENT", labelZh: "配料需求匹配", labelEn: "Ingredient fit", role: "model_feature" },
  { canonical: "wtp_reference_cny", aliases: ["wtp_70g_cny", "wtp_80g_cny", "wtp_cny"], questionId: "MODEL_WTP", labelZh: "支付意愿", labelEn: "Willingness to pay", role: "model_feature" },
];

const scaleMetricSpecs = (
  canonical: string,
  questionId: string,
  labelZh: string,
  labelEn: string,
  groupKey: string,
  groupLabelZh: string,
  groupLabelEn: string,
): MetricSpec[] => [
  { key: `${canonical}_mean`, canonical, questionId, labelZh: `${labelZh} Mean`, labelEn: `${labelEn} mean`, positiveRule: "加权均值", statistic: "mean", groupKey, groupLabelZh, groupLabelEn, unit: "score", decimalPlaces: 2 },
  { key: `${canonical}_t2b`, canonical, questionId, labelZh: `${labelZh} T2B`, labelEn: `${labelEn} T2B`, positiveRule: "5点量表取4–5", statistic: "proportion", groupKey, groupLabelZh, groupLabelEn, unit: "percent", decimalPlaces: 1, isPositive: (value) => value >= 4 },
  { key: `${canonical}_b2b`, canonical, questionId, labelZh: `${labelZh} B2B`, labelEn: `${labelEn} B2B`, positiveRule: "5点量表取1–2", statistic: "proportion", groupKey, groupLabelZh, groupLabelEn, unit: "percent", decimalPlaces: 1, isPositive: (value) => value <= 2 },
];

const importanceItems = [
  ["importance_taste", "Q7_1", "口味重要性", "Taste importance"],
  ["importance_crispness", "Q7_2", "酥脆口感重要性", "Crispness importance"],
  ["importance_health", "Q7_3", "健康属性重要性", "Health importance"],
  ["importance_price", "Q7_4", "价格重要性", "Price importance"],
  ["importance_pack", "Q7_5", "包装重要性", "Pack importance"],
  ["importance_novelty", "Q7_6", "新奇感重要性", "Novelty importance"],
] as const;

const satisfactionItems = [
  ["satisfaction_taste", "Q8_1", "口味满足度", "Taste satisfaction"],
  ["satisfaction_crispness", "Q8_2", "酥脆口感满足度", "Crispness satisfaction"],
  ["satisfaction_health", "Q8_3", "健康需求匹配", "Health fit"],
  ["satisfaction_price", "Q8_4", "价格满足度", "Price satisfaction"],
  ["satisfaction_pack", "Q8_5", "包装满足度", "Pack satisfaction"],
  ["satisfaction_novelty", "Q8_6", "新奇感满足度", "Novelty satisfaction"],
] as const;

const conceptItems = [
  ["concept_relevance", "Q10_1", "概念相关性", "Concept relevance"],
  ["concept_uniqueness", "Q10_2", "概念差异化", "Concept uniqueness"],
  ["concept_credibility", "Q10_3", "概念可信度", "Concept credibility"],
] as const;

const pricePoints = [
  ["price_accept_6_9", "Q9_1", "¥6.9接受率", "Acceptance at ¥6.9"],
  ["price_accept_8_9", "Q9_2", "¥8.9接受率", "Acceptance at ¥8.9"],
  ["price_accept_9_9", "Q9_3", "¥9.9接受率", "Acceptance at ¥9.9"],
  ["price_accept_10_9", "Q9_4", "¥10.9接受率", "Acceptance at ¥10.9"],
  ["price_accept_12_9", "Q9_5", "¥12.9接受率", "Acceptance at ¥12.9"],
  ["price_accept_15_9", "Q9_6", "¥15.9接受率", "Acceptance at ¥15.9"],
] as const;

const METRIC_SPECS: MetricSpec[] = [
  { key: "penetration_3m", canonical: "penetration_3m", questionId: "Q1", labelZh: "过去3个月购买率", labelEn: "3-month purchase rate", positiveRule: "值=1", statistic: "proportion", groupKey: "core", groupLabelZh: "核心购买指标", groupLabelEn: "Core purchase metrics", unit: "percent", decimalPlaces: 1, isPositive: (value) => value === 1 },
  { key: "monthly_frequency_mean", canonical: "monthly_frequency", questionId: "Q2", labelZh: "月度购买频次 Mean", labelEn: "Monthly purchase frequency mean", positiveRule: "加权均值", statistic: "mean", groupKey: "core", groupLabelZh: "核心购买指标", groupLabelEn: "Core purchase metrics", unit: "times", decimalPlaces: 2 },
  { key: "monthly_frequency_median", canonical: "monthly_frequency", questionId: "Q2", labelZh: "月度购买频次 Median", labelEn: "Monthly purchase frequency median", positiveRule: "加权中位数", statistic: "median", groupKey: "core", groupLabelZh: "核心购买指标", groupLabelEn: "Core purchase metrics", unit: "times", decimalPlaces: 2 },
  ...importanceItems.flatMap(([canonical, questionId, labelZh, labelEn]) => scaleMetricSpecs(canonical, questionId, labelZh, labelEn, "importance", "需求重要性", "Need importance")),
  ...satisfactionItems.flatMap(([canonical, questionId, labelZh, labelEn]) => scaleMetricSpecs(canonical, questionId, labelZh, labelEn, "satisfaction", "需求满足度", "Need satisfaction")),
  ...pricePoints.map(([canonical, questionId, labelZh, labelEn]) => ({ key: canonical === "price_accept_8_9" ? "price_accept_reference" : canonical, canonical, questionId, labelZh, labelEn, positiveRule: "值=1", statistic: "proportion" as const, groupKey: "price", groupLabelZh: "价格接受曲线", groupLabelEn: "Price acceptance curve", unit: "percent" as const, decimalPlaces: 1, isPositive: (value: number) => value === 1 })),
  ...conceptItems.flatMap(([canonical, questionId, labelZh, labelEn]) => scaleMetricSpecs(canonical, questionId, labelZh, labelEn, "concept", "概念评价", "Concept evaluation")),
  { key: "concept_trial_t2b", canonical: "concept_trial", questionId: "Q10_4", labelZh: "概念购买意向T2B", labelEn: "Concept trial T2B", positiveRule: "5点量表取4–5；二元字段取1", statistic: "proportion", groupKey: "concept", groupLabelZh: "概念评价", groupLabelEn: "Concept evaluation", unit: "percent", decimalPlaces: 1, isPositive: (value, values) => Math.max(...values) <= 1 ? value === 1 : value >= 4 },
];

const METRIC_GROUPS: ProductionMetricGroup[] = [
  { key: "summary", labelZh: "关键KPI", labelEn: "Key KPIs", questionRange: "Q1 / Q2 / Q9 / Q10", metricKeys: ["penetration_3m", "monthly_frequency_mean", "monthly_frequency_median", "price_accept_reference", "concept_relevance_mean", "concept_trial_t2b"] },
  { key: "importance", labelZh: "需求重要性", labelEn: "Need importance", questionRange: "Q7", metricKeys: METRIC_SPECS.filter((metric) => metric.groupKey === "importance").map((metric) => metric.key) },
  { key: "satisfaction", labelZh: "需求满足度", labelEn: "Need satisfaction", questionRange: "Q8", metricKeys: METRIC_SPECS.filter((metric) => metric.groupKey === "satisfaction").map((metric) => metric.key) },
  { key: "price", labelZh: "价格接受曲线", labelEn: "Price acceptance curve", questionRange: "Q9", metricKeys: METRIC_SPECS.filter((metric) => metric.groupKey === "price").map((metric) => metric.key) },
  { key: "concept", labelZh: "概念评价", labelEn: "Concept evaluation", questionRange: "Q10", metricKeys: METRIC_SPECS.filter((metric) => metric.groupKey === "concept").map((metric) => metric.key) },
];

const CORE_GRID_METRIC_KEYS = [
  "penetration_3m",
  "monthly_frequency_mean",
  "monthly_frequency_median",
  "price_accept_reference",
  "concept_relevance_mean",
  "concept_trial_t2b",
];

const MODEL_FEATURE_CANONICALS = [
  "penetration_3m",
  "price_accept_8_9",
  "satisfaction_health",
  "ingredient_fit",
  "satisfaction_pack",
  "importance_taste",
  "importance_price",
  "importance_health",
  "wtp_reference_cny",
];

const BANNER_SPECS: BannerSpec[] = [
  {
    key: "gender",
    canonical: "gender",
    labelZh: "性别",
    labelEn: "Gender",
    categories: [
      { labelZh: "男性", labelEn: "Male", letter: "B", values: ["1", "男", "男性", "male", "m"] },
      { labelZh: "女性", labelEn: "Female", letter: "C", values: ["2", "女", "女性", "female", "f"] },
    ],
  },
  {
    key: "age",
    canonical: "age_group",
    labelZh: "年龄",
    labelEn: "Age",
    categories: [
      { labelZh: "18–24", labelEn: "18–24", letter: "D", values: ["1", "18-24", "18–24"] },
      { labelZh: "25–34", labelEn: "25–34", letter: "E", values: ["2", "25-34", "25–34"] },
      { labelZh: "35–44", labelEn: "35–44", letter: "F", values: ["3", "35-44", "35–44"] },
      { labelZh: "45–54", labelEn: "45–54", letter: "G", values: ["4", "45-54", "45–54"] },
    ],
  },
  {
    key: "region",
    canonical: "region",
    labelZh: "地区",
    labelEn: "Region",
    categories: [
      { labelZh: "华东", labelEn: "East China", letter: "H", values: ["1", "华东", "east china"] },
      { labelZh: "华南", labelEn: "South China", letter: "I", values: ["2", "华南", "south china"] },
      { labelZh: "华北", labelEn: "North China", letter: "J", values: ["3", "华北", "north china"] },
      { labelZh: "华中", labelEn: "Central China", letter: "K", values: ["4", "华中", "central china"] },
      { labelZh: "西南", labelEn: "Southwest China", letter: "L", values: ["5", "西南", "southwest china"] },
      { labelZh: "东北", labelEn: "Northeast China", letter: "M", values: ["6", "东北", "northeast china"] },
    ],
  },
];

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s.\-\/\\\[\](){}]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseNumber(value: string | undefined) {
  if (value == null) return null;
  const clean = value.trim().replaceAll(",", "").replace(/%$/, "");
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function weightedMedian(items: Array<{ value: number; weight: number }>) {
  if (!items.length) return null;
  const ordered = [...items].sort((left, right) => left.value - right.value);
  const totalWeight = ordered.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  let cumulative = 0;
  for (const item of ordered) {
    cumulative += item.weight;
    if (cumulative >= totalWeight / 2) return item.value;
  }
  return ordered.at(-1)?.value ?? null;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
}

function resolveMappings(headers: string[]) {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));
  return FIELD_SPECS.flatMap((spec) => {
    const sourceColumn = spec.aliases.map(normalizeHeader).map((alias) => normalized.get(alias)).find(Boolean);
    return sourceColumn ? [{ ...spec, sourceColumn, aliases: undefined }] : [];
  }).map(({ aliases: _aliases, ...mapping }) => mapping as FieldMapping);
}

function cellForRows(rows: ParsedRow[], sourceColumn: string, metric: MetricSpec) {
  const eligible = rows.flatMap((row) => {
    const value = parseNumber(row.source[sourceColumn]);
    return value == null ? [] : [{ row, value }];
  });
  const values = eligible.map((item) => item.value);
  const positive = metric.statistic === "proportion" && metric.isPositive
    ? eligible.filter((item) => metric.isPositive!(item.value, values))
    : [];
  const weightedBase = eligible.reduce((sum, item) => sum + item.row.weight, 0);
  const weightedPositive = positive.reduce((sum, item) => sum + item.row.weight, 0);
  const mean = weightedBase > 0 ? eligible.reduce((sum, item) => sum + item.value * item.row.weight, 0) / weightedBase : null;
  const variance = mean == null || weightedBase <= 0
    ? null
    : eligible.reduce((sum, item) => sum + item.row.weight * (item.value - mean) ** 2, 0) / weightedBase;
  const median = weightedMedian(eligible.map((item) => ({ value: item.value, weight: item.row.weight })));
  return {
    baseN: eligible.length,
    weightedBase: round(weightedBase, 1),
    positiveN: positive.length,
    weightedPositive: round(weightedPositive, 1),
    percent: metric.statistic === "proportion" && weightedBase > 0 ? round(weightedPositive / weightedBase * 100, metric.decimalPlaces) : null,
    mean: mean == null ? null : round(mean, metric.decimalPlaces),
    median: median == null ? null : round(median, metric.decimalPlaces),
    standardDeviation: variance == null ? null : round(Math.sqrt(variance), 3),
    sigHigherThan: [],
  } satisfies ProductionCell;
}

function effectiveN(rows: ParsedRow[], sourceColumn: string) {
  const weights = rows.filter((row) => parseNumber(row.source[sourceColumn]) != null).map((row) => row.weight);
  const sum = weights.reduce((total, value) => total + value, 0);
  const squared = weights.reduce((total, value) => total + value ** 2, 0);
  return squared > 0 ? sum ** 2 / squared : 0;
}

function significantDifference(a: ProductionCell, b: ProductionCell, effectiveA: number, effectiveB: number, metric: MetricSpec) {
  if (effectiveA < 30 || effectiveB < 30 || metric.statistic === "median") return false;
  if (metric.statistic === "mean") {
    if (a.mean == null || b.mean == null || a.standardDeviation == null || b.standardDeviation == null) return false;
    const standardError = Math.sqrt(a.standardDeviation ** 2 / effectiveA + b.standardDeviation ** 2 / effectiveB);
    return standardError > 0 && Math.abs((a.mean - b.mean) / standardError) >= 1.96;
  }
  if (a.percent == null || b.percent == null) return false;
  const p1 = a.percent / 100;
  const p2 = b.percent / 100;
  const pooled = (p1 * effectiveA + p2 * effectiveB) / (effectiveA + effectiveB);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / effectiveA + 1 / effectiveB));
  return standardError > 0 && Math.abs((p1 - p2) / standardError) >= 1.96;
}

function normalizeCategoryValue(value: string) {
  return value.trim().toLowerCase().replaceAll("—", "–");
}

function buildBannerGroup(
  rows: ParsedRow[],
  mapping: FieldMapping,
  spec: BannerSpec,
  metricDefinitions: Array<MetricSpec & { sourceColumn: string }>,
) {
  const observed = Array.from(new Set(rows.map((row) => row.source[mapping.sourceColumn]?.trim()).filter(Boolean)));
  const matchedValues = new Set<string>();
  const groups = spec.categories.flatMap((category) => {
    const accepted = new Set(category.values.map(normalizeCategoryValue));
    const categoryRows = rows.filter((row) => accepted.has(normalizeCategoryValue(row.source[mapping.sourceColumn] ?? "")));
    if (!categoryRows.length) return [];
    categoryRows.forEach((row) => matchedValues.add(normalizeCategoryValue(row.source[mapping.sourceColumn] ?? "")));
    return [{ key: category.letter, label: category.labelZh, letter: category.letter, rows: categoryRows }];
  });
  const nextLetters = "NOPQRSTUVWXYZ";
  observed.filter((value) => !matchedValues.has(normalizeCategoryValue(value))).forEach((value, index) => {
    groups.push({
      key: `extra-${index + 1}`,
      label: value,
      letter: nextLetters[index] ?? String(index + 1),
      rows: rows.filter((row) => row.source[mapping.sourceColumn]?.trim() === value),
    });
  });
  const tableRows: ProductionTableRow[] = [
    {
      key: "total",
      label: "Total",
      letter: null,
      baseN: rows.length,
      metrics: Object.fromEntries(metricDefinitions.map((metric) => [metric.key, cellForRows(rows, metric.sourceColumn, metric)])),
    },
    ...groups.map((group) => ({
      key: group.key,
      label: group.label,
      letter: group.letter,
      baseN: group.rows.length,
      metrics: Object.fromEntries(metricDefinitions.map((metric) => [metric.key, cellForRows(group.rows, metric.sourceColumn, metric)])),
    })),
  ];
  const subgroupRows = tableRows.slice(1);
  for (const metric of metricDefinitions) {
    for (let left = 0; left < subgroupRows.length; left += 1) {
      for (let right = left + 1; right < subgroupRows.length; right += 1) {
        const leftCell = subgroupRows[left].metrics[metric.key];
        const rightCell = subgroupRows[right].metrics[metric.key];
        const effectiveLeft = effectiveN(groups[left].rows, metric.sourceColumn);
        const effectiveRight = effectiveN(groups[right].rows, metric.sourceColumn);
        if (!significantDifference(leftCell, rightCell, effectiveLeft, effectiveRight, metric)) continue;
        const leftValue = metric.statistic === "mean" ? leftCell.mean : leftCell.percent;
        const rightValue = metric.statistic === "mean" ? rightCell.mean : rightCell.percent;
        if ((leftValue ?? 0) > (rightValue ?? 0)) leftCell.sigHigherThan.push(subgroupRows[right].letter!);
        else rightCell.sigHigherThan.push(subgroupRows[left].letter!);
      }
    }
  }
  return {
    key: spec.key,
    labelZh: spec.labelZh,
    labelEn: spec.labelEn,
    sourceColumn: mapping.sourceColumn,
    relation: "independent_mutually_exclusive" as const,
    confidenceLevel: 95,
    totalLetter: "A" as const,
    rows: tableRows,
  } satisfies ProductionBannerGroup;
}

function buildCoreGrid(bannerGroups: ProductionBannerGroup[], metricDefinitions: Array<MetricSpec & { sourceColumn: string }>) {
  const total = bannerGroups[0]?.rows[0];
  if (!total) return [];
  const age = bannerGroups.find((group) => group.key === "age");
  const gender = bannerGroups.find((group) => group.key === "gender");
  const metricKeys = CORE_GRID_METRIC_KEYS.filter((key) => metricDefinitions.some((metric) => metric.key === key));
  const columns: ProductionGridColumn[] = [
    { key: "total", label: "Total", letter: "A", bannerKey: "total", baseN: total.baseN, metrics: total.metrics },
    ...(age?.rows.slice(1).map((row) => ({ key: `age-${row.key}`, label: row.label, letter: row.letter ?? "", bannerKey: "age", baseN: row.baseN, metrics: row.metrics })) ?? []),
    ...(gender?.rows.slice(1).map((row) => ({ key: `gender-${row.key}`, label: row.label, letter: row.letter ?? "", bannerKey: "gender", baseN: row.baseN, metrics: row.metrics })) ?? []),
  ];
  return [{
    key: "grid101",
    labelZh: "Grid101｜核心购买与新品指标",
    labelEn: "Grid101 | Core purchase and launch metrics",
    metricKeys,
    columns,
  }] satisfies ProductionGrid[];
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function sigmoid(value: number) {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

function auc(labels: number[], scores: number[]) {
  const pairs = scores.map((score, index) => ({ score, label: labels[index] })).sort((a, b) => a.score - b.score);
  const positiveN = labels.reduce((sum, label) => sum + label, 0);
  const negativeN = labels.length - positiveN;
  if (!positiveN || !negativeN) return null;
  let positiveRankSum = 0;
  let cursor = 0;
  while (cursor < pairs.length) {
    let end = cursor + 1;
    while (end < pairs.length && pairs[end].score === pairs[cursor].score) end += 1;
    const averageRank = ((cursor + 1) + end) / 2;
    for (let index = cursor; index < end; index += 1) if (pairs[index].label === 1) positiveRankSum += averageRank;
    cursor = end;
  }
  return (positiveRankSum - positiveN * (positiveN + 1) / 2) / (positiveN * negativeN);
}

function fitLogisticModel(rows: ParsedRow[], mappingByCanonical: Map<string, FieldMapping>, productionStatus: ProductionStatus) {
  const targetMapping = mappingByCanonical.get("concept_trial");
  const blockers: string[] = [];
  if (productionStatus === "blocked") blockers.push("数据结构检查未通过，模型运行被阻断");
  if (!targetMapping) blockers.push("缺少概念购买意向字段（Q10 / concept_trial）");
  const featureMappings = MODEL_FEATURE_CANONICALS.map((key) => mappingByCanonical.get(key)).filter((item): item is FieldMapping => Boolean(item));
  if (featureMappings.length < 2) blockers.push("至少需要两个已映射预测变量");
  if (blockers.length || !targetMapping) return {
    status: "blocked" as const,
    target: "概念购买意向T2B",
    targetSourceColumn: targetMapping?.sourceColumn ?? null,
    targetRule: "5点量表取4–5；二元字段取1",
    trainN: 0,
    testN: 0,
    testAuc: null,
    testBrier: null,
    coefficients: [],
    blockers,
    boundary: "模型目标是问卷中的概念购买意向，不是实际购买、销量或市场份额。",
  };

  const targetValues = rows.map((row) => parseNumber(row.source[targetMapping.sourceColumn])).filter((value): value is number => value != null);
  const binaryTarget = targetValues.length > 0 && Math.max(...targetValues) <= 1;
  const records = rows.flatMap((row) => {
    const target = parseNumber(row.source[targetMapping.sourceColumn]);
    const features = featureMappings.map((mapping) => parseNumber(row.source[mapping.sourceColumn]));
    if (target == null || features.some((value) => value == null)) return [];
    return [{ id: row.respondentId, y: binaryTarget ? Number(target === 1) : Number(target >= 4), x: features as number[] }];
  });
  if (records.length < 300) blockers.push("完整模型样本少于300");
  const prevalence = records.length ? records.reduce((sum, row) => sum + row.y, 0) / records.length : 0;
  if (prevalence < .05 || prevalence > .95) blockers.push("目标变量正例比例不在5%–95%之间");
  const train = records.filter((row) => stableHash(row.id) % 5 !== 0);
  const test = records.filter((row) => stableHash(row.id) % 5 === 0);
  if (test.length < 60) blockers.push("确定性留出样本少于60");
  if (blockers.length) return {
    status: "blocked" as const,
    target: "概念购买意向T2B",
    targetSourceColumn: targetMapping.sourceColumn,
    targetRule: binaryTarget ? "值=1" : "5点量表取4–5",
    trainN: train.length,
    testN: test.length,
    testAuc: null,
    testBrier: null,
    coefficients: [],
    blockers,
    boundary: "模型目标是问卷中的概念购买意向，不是实际购买、销量或市场份额。",
  };

  const featureCount = featureMappings.length;
  const means = Array.from({ length: featureCount }, (_, feature) => train.reduce((sum, row) => sum + row.x[feature], 0) / train.length);
  const standardDeviations = means.map((mean, feature) => Math.sqrt(train.reduce((sum, row) => sum + (row.x[feature] - mean) ** 2, 0) / Math.max(1, train.length - 1)) || 1);
  const standardize = (values: number[]) => values.map((value, feature) => (value - means[feature]) / standardDeviations[feature]);
  const trainX = train.map((row) => standardize(row.x));
  const beta = Array(featureCount + 1).fill(0) as number[];
  const learningRate = .08;
  const l2 = .015;
  for (let iteration = 0; iteration < 900; iteration += 1) {
    const gradient = Array(featureCount + 1).fill(0) as number[];
    for (let rowIndex = 0; rowIndex < train.length; rowIndex += 1) {
      const linear = beta[0] + trainX[rowIndex].reduce((sum, value, feature) => sum + value * beta[feature + 1], 0);
      const error = sigmoid(linear) - train[rowIndex].y;
      gradient[0] += error;
      for (let feature = 0; feature < featureCount; feature += 1) gradient[feature + 1] += error * trainX[rowIndex][feature];
    }
    beta[0] -= learningRate * gradient[0] / train.length;
    for (let feature = 1; feature < beta.length; feature += 1) beta[feature] -= learningRate * (gradient[feature] / train.length + l2 * beta[feature]);
  }
  const testScores = test.map((row) => {
    const values = standardize(row.x);
    return sigmoid(beta[0] + values.reduce((sum, value, feature) => sum + value * beta[feature + 1], 0));
  });
  const testLabels = test.map((row) => row.y);
  const testAuc = auc(testLabels, testScores);
  const testBrier = testScores.reduce((sum, score, index) => sum + (score - testLabels[index]) ** 2, 0) / testScores.length;
  const coefficients = featureMappings.map((mapping, index) => ({
    variable: mapping.labelZh,
    sourceColumn: mapping.sourceColumn,
    standardizedBeta: round(beta[index + 1], 3),
    oddsRatio: round(Math.exp(beta[index + 1]), 3),
    direction: beta[index + 1] >= 0 ? "positive" as const : "negative" as const,
  })).sort((a, b) => Math.abs(b.standardizedBeta) - Math.abs(a.standardizedBeta));
  return {
    status: "fitted" as const,
    target: "概念购买意向T2B",
    targetSourceColumn: targetMapping.sourceColumn,
    targetRule: binaryTarget ? "值=1" : "5点量表取4–5",
    trainN: train.length,
    testN: test.length,
    testAuc: testAuc == null ? null : round(testAuc, 3),
    testBrier: round(testBrier, 3),
    coefficients,
    blockers: [],
    boundary: "模型估计变量与问卷概念购买意向的联合关联；留出集按样本ID固定划分，不代表因果效应、实际购买、销量或市场份额。",
  };
}

export function buildRawProductionResult(csvText: string, fileName: string): RawProductionResult {
  const matrix = parseCsv(csvText);
  if (matrix.length < 2) throw new Error("CSV至少需要一行表头和一行数据");
  if (matrix.length > 50_001) throw new Error("单次最多处理50,000行数据");
  const headers = matrix[0].map((value, index) => value.replace(/^\uFEFF/, "").trim() || `column_${index + 1}`);
  if (new Set(headers.map(normalizeHeader)).size !== headers.length) throw new Error("表头存在重复字段，请先统一字段名");
  const mappings = resolveMappings(headers);
  const mappingByCanonical = new Map(mappings.map((mapping) => [mapping.canonical, mapping]));
  const idMapping = mappingByCanonical.get("respondent_id");
  const weightMapping = mappingByCanonical.get("weight");
  const rows = matrix.slice(1).map((values) => ({
    source: Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  }));
  const ids = new Set<string>();
  let duplicateRespondentIds = 0;
  let missingRespondentIds = 0;
  let invalidWeights = 0;
  const eligibleRows: ParsedRow[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const respondentId = idMapping ? rows[index].source[idMapping.sourceColumn].trim() : `ROW-${index + 1}`;
    if (!respondentId) {
      missingRespondentIds += 1;
      continue;
    }
    if (ids.has(respondentId)) {
      duplicateRespondentIds += 1;
      continue;
    }
    ids.add(respondentId);
    let weight = 1;
    if (weightMapping) {
      const parsedWeight = parseNumber(rows[index].source[weightMapping.sourceColumn]);
      if (parsedWeight == null || parsedWeight <= 0) invalidWeights += 1;
      else weight = parsedWeight;
    }
    eligibleRows.push({ source: rows[index].source, respondentId, weight });
  }
  const metricDefinitions = METRIC_SPECS.flatMap((metric) => {
    const mapping = mappingByCanonical.get(metric.canonical);
    return mapping ? [{ ...metric, sourceColumn: mapping.sourceColumn }] : [];
  });
  const missingRequiredFields = idMapping ? [] : ["respondent_id"];
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!idMapping) blockers.push("缺少样本ID字段 respondent_id");
  if (!metricDefinitions.length) blockers.push("未识别Q1、Q9或Q10对应的KPI字段");
  if (duplicateRespondentIds) blockers.push(`发现${duplicateRespondentIds}个重复样本ID`);
  if (missingRespondentIds) blockers.push(`发现${missingRespondentIds}行缺少样本ID`);
  if (invalidWeights) blockers.push(`发现${invalidWeights}行权重为空、非数值或不大于0`);
  if (!weightMapping) warnings.push("未识别权重字段，当前按权重=1计算");
  if (!mappingByCanonical.get("age_group")) warnings.push("未识别年龄字段，仅生成Total结果");
  const status: ProductionStatus = blockers.length ? "blocked" : "ready";

  const bannerGroups = BANNER_SPECS.flatMap((spec) => {
    const mapping = mappingByCanonical.get(spec.canonical);
    return mapping ? [buildBannerGroup(eligibleRows, mapping, spec, metricDefinitions)] : [];
  });
  const grids = buildCoreGrid(bannerGroups, metricDefinitions);
  const availableMetricKeys = new Set(metricDefinitions.map((metric) => metric.key));
  const defaultBanner = bannerGroups.find((group) => group.key === "age") ?? bannerGroups[0];
  const ageMapping = mappingByCanonical.get("age_group");
  const unmappedColumns = headers.filter((header) => !mappings.some((mapping) => mapping.sourceColumn === header));
  const previewHeaders = Array.from(new Set([
    idMapping?.sourceColumn,
    ageMapping?.sourceColumn,
    mappingByCanonical.get("gender")?.sourceColumn,
    mappingByCanonical.get("region")?.sourceColumn,
    ...metricDefinitions.map((metric) => metric.sourceColumn),
    weightMapping?.sourceColumn,
  ].filter((value): value is string => Boolean(value)))).slice(0, 8);
  return {
    meta: {
      fileName,
      processedAt: new Date().toISOString(),
      rowCount: rows.length,
      eligibleRowCount: eligibleRows.length,
      columnCount: headers.length,
      status,
    },
    schema: {
      mappings,
      mappedColumnCount: new Set(mappings.map((mapping) => mapping.sourceColumn)).size,
      unmappedColumns,
      requiredFields: ["respondent_id"],
      missingRequiredFields,
    },
    structuralChecks: {
      duplicateRespondentIds,
      missingRespondentIds,
      invalidWeights,
      metricCount: metricDefinitions.length,
      warnings,
      blockers,
    },
    preview: {
      headers: previewHeaders,
      rows: eligibleRows.slice(0, 5).map((row) => previewHeaders.map((header) => row.source[header] ?? "")),
    },
    table: {
      banner: defaultBanner?.sourceColumn ?? "Total",
      relation: defaultBanner ? "independent_mutually_exclusive" : "total_only",
      confidenceLevel: 95,
      defaultBannerKey: defaultBanner?.key ?? "total",
      bannerGroups,
      metricGroups: METRIC_GROUPS.map((group) => ({ ...group, metricKeys: group.metricKeys.filter((key) => availableMetricKeys.has(key)) })).filter((group) => group.metricKeys.length > 0),
      metricDefinitions: metricDefinitions.map((metric) => ({ key: metric.key, questionId: metric.questionId, labelZh: metric.labelZh, labelEn: metric.labelEn, sourceColumn: metric.sourceColumn, positiveRule: metric.positiveRule, statistic: metric.statistic, groupKey: metric.groupKey, groupLabelZh: metric.groupLabelZh, groupLabelEn: metric.groupLabelEn, unit: metric.unit, decimalPlaces: metric.decimalPlaces })),
      grids,
      rows: defaultBanner?.rows ?? [{
        key: "total",
        label: "Total",
        letter: null,
        baseN: eligibleRows.length,
        metrics: Object.fromEntries(metricDefinitions.map((metric) => [metric.key, cellForRows(eligibleRows, metric.sourceColumn, metric)])),
      }],
    },
    model: fitLogisticModel(eligibleRows, mappingByCanonical, status),
  };
}
