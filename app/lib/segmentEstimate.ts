export const SEGMENT_KPI_KEYS = [
  "penetration_3m",
  "monthly_buyer_rate",
  "purchase_intent_t2b",
  "frequency_buyer",
  "monthly_spend_buyer",
  "price_accept_7_9",
  "concept_relevance_t2b",
  "concept_trial_t2b",
  "health_fit_t2b",
  "unmet_need_index",
] as const;

export type SegmentKpiKey = (typeof SEGMENT_KPI_KEYS)[number];
export type SegmentDimension = "age_group" | "income" | "region";

export type SegmentKpiValues = Record<SegmentKpiKey, number>;

export type SegmentKpiRow = SegmentKpiValues & {
  dimension: string;
  value: string;
  base_n: number;
};

export type SegmentEstimateInput = {
  overall: SegmentKpiValues & { base_n: number };
  subgroupRows: SegmentKpiRow[];
  age: string;
  income: string;
  region: string;
  channelShift: number;
};

export type SegmentEstimate = {
  kpis: SegmentKpiValues;
  modelBaseN: number;
  approximateCellBaseN: number;
  interval90Pp: number;
  matchedRows: Record<SegmentDimension, SegmentKpiRow>;
  method: "partial_pooling_additive";
};

const DIMENSION_WEIGHTS: Record<SegmentDimension, number> = {
  age_group: 0.62,
  income: 0.58,
  region: 0.48,
};

const CHANNEL_EFFECT: Record<SegmentKpiKey, number> = {
  penetration_3m: 0.18,
  monthly_buyer_rate: 0.16,
  purchase_intent_t2b: 0.22,
  frequency_buyer: 0.006,
  monthly_spend_buyer: 0.08,
  price_accept_7_9: 0.24,
  concept_relevance_t2b: 0.12,
  concept_trial_t2b: 0.2,
  health_fit_t2b: 0.05,
  unmet_need_index: -0.08,
};

const PERCENTAGE_KEYS = new Set<SegmentKpiKey>([
  "penetration_3m",
  "monthly_buyer_rate",
  "purchase_intent_t2b",
  "price_accept_7_9",
  "concept_relevance_t2b",
  "concept_trial_t2b",
  "health_fit_t2b",
]);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function requireRow(rows: SegmentKpiRow[], dimension: SegmentDimension, value: string) {
  const row = rows.find((item) => item.dimension === dimension && item.value === value);
  if (!row) throw new Error(`Missing subgroup KPI row: ${dimension}=${value}`);
  return row;
}

function metricBounds(key: SegmentKpiKey): [number, number] {
  if (PERCENTAGE_KEYS.has(key)) return [0, 100];
  if (key === "frequency_buyer") return [0, 12];
  if (key === "monthly_spend_buyer") return [0, 500];
  return [0, 100];
}

export function buildSegmentEstimate(input: SegmentEstimateInput): SegmentEstimate {
  const matchedRows = {
    age_group: requireRow(input.subgroupRows, "age_group", input.age),
    income: requireRow(input.subgroupRows, "income", input.income),
    region: requireRow(input.subgroupRows, "region", input.region),
  };
  const centeredChannelShift = input.channelShift - 3.275;
  const kpis = Object.fromEntries(SEGMENT_KPI_KEYS.map((key) => {
    const marginalShift = (Object.keys(matchedRows) as SegmentDimension[]).reduce((sum, dimension) => {
      return sum + (matchedRows[dimension][key] - input.overall[key]) * DIMENSION_WEIGHTS[dimension];
    }, 0);
    const raw = input.overall[key] + marginalShift + centeredChannelShift * CHANNEL_EFFECT[key];
    const [min, max] = metricBounds(key);
    return [key, Number(clamp(raw, min, max).toFixed(key === "frequency_buyer" ? 2 : 1))];
  })) as SegmentKpiValues;

  const approximateCellBaseN = Math.max(30, Math.round((matchedRows.age_group.base_n * matchedRows.income.base_n * matchedRows.region.base_n) / Math.pow(input.overall.base_n, 2)));
  const intentProbability = clamp(kpis.purchase_intent_t2b / 100, 0.01, 0.99);
  const interval90Pp = Number((1.645 * Math.sqrt(intentProbability * (1 - intentProbability) / approximateCellBaseN) * 100).toFixed(1));

  return {
    kpis,
    modelBaseN: input.overall.base_n,
    approximateCellBaseN,
    interval90Pp,
    matchedRows,
    method: "partial_pooling_additive",
  };
}

function logit(probability: number) {
  const p = clamp(probability, 0.001, 0.999);
  return Math.log(p / (1 - p));
}

function logistic(score: number) {
  return 1 / (1 + Math.exp(-score));
}

export function adjustPriceAcceptanceCurve<T extends { acceptance_rate: number }>(
  curve: T[],
  overallAcceptance: number,
  segmentAcceptance: number,
) {
  const logOddsShift = logit(segmentAcceptance / 100) - logit(overallAcceptance / 100);
  return curve.map((point) => ({
    ...point,
    acceptance_rate: Number((logistic(logit(point.acceptance_rate / 100) + logOddsShift) * 100).toFixed(1)),
  }));
}
