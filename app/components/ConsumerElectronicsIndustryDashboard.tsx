"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import dashboardJson from "../../output/consumer-electronics-industry/dashboard-data.json";
import propensityJson from "../../output/consumer-electronics-industry/propensity-model-results.json";
import lenovoPcJson from "../../output/lenovo-pc-intelligence/platform-metrics.json";
import lenovoEvidenceJson from "../../output/lenovo-pc-intelligence/evidence-register.json";
import pcMetricSystemJson from "../../output/lenovo-pc-intelligence/pc-metric-system-v2.json";
import aipcW2AggregatesJson from "../../output/lenovo-pc-intelligence/aipc-w2-dashboard.json";
import lenovoRealModelJson from "../../output/lenovo-pc-intelligence/real-pc-purchase-intent-model.json";
import pcQ14DriftJson from "../../output/lenovo-pc-intelligence/pc-q14-dynamic-forecast.json";
import aipcDecisionOutputsJson from "../../output/lenovo-pc-intelligence/aipc-decision-outputs.json";
import pcDataReleaseJson from "../../output/lenovo-pc-intelligence/pc-data-release.json";
import lenovoSchemaJson from "../../output/lenovo-pc-intelligence/raw-schema-overlap.json";
import databaseManifestJson from "../../output/lenovo-pc-intelligence/database-manifest.json";
import multisourceSignalsJson from "../../output/lenovo-pc-intelligence/multisource-signals.json";
import researchAgentRegistryJson from "../../output/lenovo-pc-intelligence/research-agent-registry.json";
import platformPcIndexJson from "../../output/lenovo-pc-intelligence/platform-pc-dashboard-index.json";
import populationProjectionJson from "../../output/lenovo-pc-intelligence/pc-population-projection-gate.json";
import externalCalibrationJson from "../../output/consumer-electronics-industry/external-calibration-register.json";
import PlatformBrand from "./PlatformBrand";

type AggregateRow = {
  wave: string;
  market: string;
  category: string;
  dimension: string;
  dimension_value: string;
  n: number;
  ownership: number;
  purchase_intent: number;
  ai_interest: number;
  ai_premium: number;
  acceptable_price: number;
  price_sensitivity: number;
  demand_score: number;
};

type ForecastRow = {
  market: string;
  category: string;
  dimension: string;
  dimension_value: string;
  wave: string;
  prediction: number;
  low: number;
  high: number;
  trend_pp: number;
};

type DashboardData = {
  meta: {
    title: string;
    data_status: string;
    respondents_per_wave: number;
    historical_waves: number;
    historical_respondents: number;
    latest_complete_wave: string;
    forecast_wave: string;
    tracking_plan: string;
  };
  markets: Array<{ code: string; name: string; n: number; factor: number; price: number }>;
  categories: Array<{ code: string; name: string; reference_price: number; features: string[] }>;
  waves: string[];
  aggregates: AggregateRow[];
  forecasts: ForecastRow[];
  features: Array<{ market: string; category: string; feature: string; share: number }>;
  price_curves: Array<{ market: string; category: string; price_index: number; acceptance: number }>;
  source_register: Array<{ name: string; role: string; url: string }>;
};

type ModelCoefficient = {
  name: string;
  source: string;
  group: string;
  kind: string;
  reference: string | null;
  coefficient: number;
  ci_low: number;
  ci_high: number;
  odds_ratio: number;
  impact_pp: number;
  importance: number;
  level?: string;
  mean?: number;
  std?: number;
  components?: string[];
};

type PropensityModel = {
  market: string;
  category: string;
  target: string;
  train_waves: string;
  test_waves: string;
  train_n: number;
  test_n: number;
  effective_train_n: number;
  effective_test_n: number;
  event_rate: number;
  intercept: number;
  baseline_probability: number;
  weighting: string;
  weight_range: [number, number];
  profile_options: Record<string, string[]>;
  default_profile: Record<string, string | number>;
  metrics: { train_auc: number; test_auc: number; accuracy: number; brier: number };
  reference_levels: Record<string, string>;
  coefficients: ModelCoefficient[];
  calibration: Array<{ predicted: number; observed: number; ideal: number; n: number }>;
};

type PropensityData = {
  meta: { model: string; target: string; validation: string; model_count: number; data_status: string; coefficient_note: string; weighting_note: string; interaction_note: string };
  models: PropensityModel[];
};

type ProjectMetric = { value: number; base: number | null; vs_last_wave: number | null } | null;
type LenovoPcEvidence = {
  meta: {
    study: string;
    latest_wave: string;
    market: string;
    unit: string;
    source_role: string;
  };
  audiences: Array<{
    code: string;
    name: string;
    ai_pc: {
      wave: string;
      unaided: ProjectMetric;
      aided: ProjectMetric;
      reputation: ProjectMetric;
      recognition_gap: number | null;
    };
    ai_pc_trend: Array<{ wave: string; unaided: number | null; aided: number | null; reputation: number | null }>;
    notebook: Array<{
      brand: string;
      wave: string;
      brand_awareness: ProjectMetric;
      first_awareness: ProjectMetric;
      unaided: ProjectMetric;
      aided: ProjectMetric;
      reputation: ProjectMetric;
    }>;
  }>;
  enterprise_selection_factors: {
    wave: string;
    base: number;
    factors: Array<{ indicator: string; value: number; base: number | null }>;
  };
};

type ExternalCalibrationRegister = {
  as_of: string;
  sources: Array<{
    id: string;
    publisher: string;
    title: string;
    published: string;
    geography: string;
    metric_family: string;
    refresh: string;
    url: string;
    allowed_use: string[];
    not_allowed: string[];
    headline_evidence: Array<{ metric: string; value: number; unit: string; period?: string }>;
  }>;
};

type LenovoMetricDictionary = {
  meta: {
    metric_count: number;
    verified_value_count: number;
    computed_aggregate_count: number;
    decision_chain: string[];
    historical_question_series_added: number;
    audiences: string[];
    readiness_counts: Record<string, number>;
    evidence_boundary: string;
  };
  dimensions: Array<{ dimension: string; audiences: string[]; status: string; use: string }>;
  metric_layers: Array<{ layer: string; roles: string[]; purpose: string }>;
  model_routes: Array<{ question: string; primary: string; inputs: string[]; outputs: string[] }>;
  metrics: Array<{
    metric_key: string;
    name: string;
    domain: string;
    definition: string;
    numerator: string;
    denominator: string;
    unit: string;
    roles: string[];
    decisions: string[];
    cross_tabs: string[];
    source_tables: string[];
    status: string;
    question?: string;
    source_project?: string;
    wave?: string;
    value?: number;
    base_unweighted?: number;
    audience?: string;
    official_question_text?: string;
    waves?: string[];
    wave_count?: number;
    base_range?: { min: number; max: number };
    model_readiness?: string;
    model_readiness_note?: string;
    blocked_uses?: string[];
  }>;
};

type AipcAggregateData = {
  meta: { metric_count: number; subgroup_dimensions: string[]; minimum_reporting_base: number };
  metrics: Array<{
    metric_key: string;
    name: string;
    question_fields: string[];
    analysis_unit: string;
    base_unweighted: number;
    options: Array<{ code: string; label: string; count: number; percent: number }>;
    subgroups: Array<{
      dimension: string;
      dimension_code: string;
      dimension_value: string;
      base: number;
      options: Array<{ code: string; label: string; count: number; percent: number }>;
    }>;
  }>;
};

type PcQ14DriftDiagnosis = {
  meta: { model_id: string; target: string; outcome_boundary: string; model_family: string; deployment_status: string };
  series: Array<{ wave: string; base: number; value: number }>;
  backtest: { model_mae_points: number; prior_wave_mae_points: number; tuning_rmse_points: number; evidence_role: string };
  later_wave_validation: {
    wave: string;
    base: number;
    value: number;
    positive_n: number;
    historical_model_prediction: number;
    reported_gap_from_historical_prediction: number;
    validation_result: string;
    comparability_note: string;
    sample_design: string;
  };
  historical_frozen_forecast: { prediction: number; interval_low: number; interval_high: number };
  decision: { recommended_use: string; next_validation: string; client_answer: string };
};

type AipcDecisionOutputs = {
  meta: { project: string; wave: string; output_count: number; outcome_boundary: string };
  outputs: Array<{
    decision_id: string;
    question: string;
    conclusion: string;
    why: string;
    action: string;
    evidence: Array<{ question: string; metric: string; item: string; value: number; unit: string; base_unweighted: number; analysis_unit: string }>;
    model_evidence: null | Record<string, unknown>;
    next_validation: string;
  }>;
};

type PcDataRelease = {
  meta: { current_version: string; market: string; category: string };
  release: { version: string; datasets: number; metric_definitions: number; aipc_aggregate_observations: number; decision_outputs: number; research_answers: string; changes: string[] };
  datasets: Array<{ dataset_id: string; official_name: string; wave: string; sample_n: number; coverage: string; status: string; comparability: string; model_status: string; allowed_use: string[]; blocked_use: string[] }>;
  quality_gates: Array<{ gate: string; status: string; evidence: string; effect: string }>;
  next_release_requirements: Array<{ priority: string; requirement: string; unlock: string }>;
  operating_cycle: Array<{ stage: string; output: string }>;
};

type LenovoHistoricalEvidence = {
  series: {
    notebook_brand_awareness: Array<Record<string, string | number>>;
    parent_brand_reputation: Array<Record<string, string | number>>;
    notebook_purchase_intent_12m: Array<{ wave: string; base: number; value: number }>;
    notebook_purchase_budget: Array<{ wave: string; base: number; distribution: Array<{ category: string; count: number; percent: number | null }> }>;
  };
  claims: Array<{
    claim_id: string;
    claim: string;
    value: number;
    unit: string;
    base: number;
    source: string;
    wave: string;
    evidence_level: string;
    allowed_use: string[];
    not_allowed?: string[];
  }>;
};

type LenovoRealIntentModel = {
  meta: { study: string; outcome_boundary: string };
  sample: { total_n: number; train_n: number; test_n: number; waves: string[]; wave_n: Record<string, number> };
  comparison: Array<{
    model_id: string;
    name: string;
    features: string;
    metrics: { auc: number; brier: number; accuracy: number; observed_rate: number; predicted_rate: number };
  }>;
  selected_model: {
    target: string;
    training_waves: string[];
    holdout_wave: string;
    metrics_test: { auc: number; brier: number; accuracy: number; observed_rate: number; predicted_rate: number };
    coefficients: Array<{ source: string; name: string; group: string; reference: string; coefficient: number; ci_low: number; ci_high: number; odds_ratio: number; significant_95: boolean }>;
    calibration: Array<{ predicted: number; observed: number; n: number }>;
    subgroups: Array<{ dimension: string; segment: string; n: number; observed: number; predicted: number }>;
  };
  decision: { selected_model_id: string; auc_gain_vs_prior_wave: number; brier_improvement_vs_prior_wave: number; recommended_use: string; next_validation: string };
};

type LenovoSchemaProfile = {
  meta: { waves: string[]; audiences: string[] };
  archives: Array<{ wave: string; audience: string; respondent_rows: number; field_count: number; safe_candidate_count: number; pc_relevant_table_count: number }>;
  overlap: Record<string, { wave_count: number; stable_safe_field_count: number; safe_field_union_count: number; stable_pc_tables: string[] }>;
};

type LenovoDatabaseManifest = {
  database: string;
  loaded_at: string;
  table_counts: Record<string, number>;
};

type LenovoMultisourceSignals = {
  meta: { market: string; category: string; time_grain: string; alignment_keys: string[]; causal_boundary: string };
  source_status: Array<{ source: string; status: string; coverage: string; answers: string }>;
  aligned_quarters: Array<{ wave: string; field_period: string; ai_pc_aided_awareness: number; ai_pc_unaided_awareness: number; base: number; campaign_count: number; exposure_10k: number | null; search_10k: number | null; browse_10k: number | null; favorite_people: number | null; cart_people: number | null; social_status: string }>;
  campaigns: Array<{ wave: string; product: string; media: string; period: string; exposure_10k: number; search_rate: number; search_10k: number; browse_rate: number | null; browse_10k: number | null; favorite_rate: number | null; favorite_people: number | null; cart_rate: number | null; cart_people: number | null }>;
  social_schema: Array<{ metric: string; grain: string; use: string }>;
  ai_upgrade_layers: Array<{ layer: string; current_assets: string; structured_fields: string[]; ai_models: string[]; quality_gate: string; client_output: string; status: string }>;
  semantic_event_schema: { grain: string; identity_fields: string[]; entity_fields: string[]; meaning_fields: string[]; attitude_fields: string[]; quality_fields: string[]; evidence_fields: string[] };
  claims: Array<{ claim_id: string; claim: string; evidence: string[]; allowed_use: string[]; not_allowed: string[] }>;
};

type ResearchAgentRegistry = {
  meta: {
    name: string;
    principle: string;
    research_advantage: string[];
    routing_rule: string;
  };
  capabilities: Array<{
    code: string;
    official_name: string;
    name: string;
    answers: string;
    inputs: string[];
    methods: string[];
    outputs: string[];
    quality_gate: string;
    official_url: string;
  }>;
  routes: Array<{
    route_id: string;
    decision: string;
    business_question: string;
    primary_capability: string;
    supporting_capabilities: string[];
    research_design: string[];
    primary_models: string[];
    supporting_models: string[];
    client_outputs: string[];
    selection_logic: string[];
    workflow: Array<{ stage: string; question: string; deliverable: string }>;
    current_evidence: string[];
    evidence_gaps: string[];
    next_action: string;
  }>;
  official_sources: Array<{ name: string; url: string }>;
};

type PlatformPcIndex = {
  meta: {
    counts: { observations: number; audiences: number; product_spaces: number; sheets: number; waves: number; brands: number; indicator_groups: number };
    evidence_boundary: string;
  };
  sources: Array<{ audience: string; file: string; sheet_count: number; observation_count: number }>;
  facets: { audiences: string[]; product_spaces: string[]; sheets: string[]; waves: string[]; indicator_groups: string[]; brands: string[] };
  insights: Array<{
    insight_id: string;
    decision: string;
    audience: string;
    claim: string;
    evidence: Array<{ wave?: string; item?: string; value: number; base: number | null; source_sheet: string }>;
    implication: string;
    boundary: string;
  }>;
  sheet_catalog: Array<{ audience: string; product_space: string; sheet: string }>;
  filter_catalog: Array<{ audience: string; product_space: string; sheet: string; indicator_groups: string[]; brands: string[]; waves: string[] }>;
  default_query: { audience: string; product_space: string; sheet: string; indicator_group: string; brand: string; wave: string };
};

type PlatformPcQueryResult = {
  summary: { matched: number; series: number; waves: number; base_min: number | null; base_max: number | null; latest_wave: string | null };
  trend: Array<{ observation_id: string; wave: string; wave_order: number; brand: string | null; analysis_item: string; indicator_group: string | null; value: number; base_unweighted: number | null; vs_last_wave: number | null; sheet: string }>;
  latest: Array<{ observation_id: string; wave: string; brand: string | null; analysis_item: string; indicator_group: string | null; value: number; base_unweighted: number | null; vs_last_wave: number | null; rank: number | null; sheet: string }>;
  boundary: string;
};

type PopulationProjectionGate = {
  meta: {
    status: string;
    decision: string;
    gate_summary: { passed: number; pending: number; blocked: number; total: number };
  };
  target_population: { age: string; geography: string; role: string; pc_status: string; sample_n: number; note: string };
  quota_margins: Array<{ dimension: string; categories: Array<{ category: string; sample_share?: number; sample_n: number }> }>;
  official_benchmarks: Array<{
    benchmark_id: string;
    dimension: string;
    reference_date: string;
    values: Array<{ category: string; value: number; unit: string }>;
    alignment: string;
    status: string;
    source: string;
    url: string;
  }>;
  quality_gates: Array<{ gate_id: string; name: string; status: "passed" | "pending" | "blocked"; evidence: string; effect: string; next_required: string }>;
  weighting_method: {
    required_dimensions: string[];
    audit_dimensions: string[];
    steps: string[];
    formulas: Array<{ name: string; formula: string }>;
    release_thresholds: string[];
  };
  gender_calibration_demo: {
    label: string;
    weight_factors: Array<{ category: string; weight: number }>;
    effective_n: number;
    design_effect: number;
    maximum_moe_95_points: number;
    boundary: string;
  };
  output_policy: { publish_now: string[]; publish_after_full_weighting: string[]; blocked: string[] };
};

const data = dashboardJson as DashboardData;
const propensityData = propensityJson as PropensityData;
const lenovoPcData = lenovoPcJson as LenovoPcEvidence;
const lenovoEvidence = lenovoEvidenceJson as LenovoHistoricalEvidence;
const lenovoMetricDictionary = pcMetricSystemJson as LenovoMetricDictionary;
const aipcW2Aggregates = aipcW2AggregatesJson as AipcAggregateData;
const lenovoRealModel = lenovoRealModelJson as LenovoRealIntentModel;
const pcQ14Drift = pcQ14DriftJson as PcQ14DriftDiagnosis;
const aipcDecisionOutputs = aipcDecisionOutputsJson as AipcDecisionOutputs;
const pcDataRelease = pcDataReleaseJson as PcDataRelease;
const lenovoSchema = lenovoSchemaJson as LenovoSchemaProfile;
const lenovoDatabaseManifest = databaseManifestJson as LenovoDatabaseManifest;
const lenovoMultisourceSignals = multisourceSignalsJson as LenovoMultisourceSignals;
const researchAgentRegistry = researchAgentRegistryJson as ResearchAgentRegistry;
const platformPcIndex = platformPcIndexJson as PlatformPcIndex;
const populationProjection = populationProjectionJson as PopulationProjectionGate;
const externalCalibration = externalCalibrationJson as ExternalCalibrationRegister;
const dimensions = ["全部人群", "年龄", "性别", "收入", "地区"];
const tabs = ["行业总览", "研究设计Agent", "产品与价格", "人群细分", "指标与研究问答", "BHT + Social + 行为", "模型与样本", "产品验证"] as const;
type Tab = (typeof tabs)[number];
type ModelView = "决策输出" | "全部模型" | "市场预测" | "产品选择与定价" | "人群驱动";
type ComparisonScope = "全部市场" | "中国" | "海外";
type ModelProfile = Record<string, string | number>;

const factorLabels: Record<string, string> = {
  owns_device: "是否拥有该品类设备",
  replacement_urgency: "换机紧迫度",
  ai_interest: "品类AI兴趣",
  acceptable_price: "可接受价格",
  price_sensitivity: "价格敏感度",
  ai_attitude: "总体AI态度",
  innovation_orientation: "创新倾向",
  privacy_concern: "隐私顾虑",
  wave_id: "期次趋势",
  gender: "性别",
  age_group: "年龄",
  income_group: "收入",
  region_group: "地区",
  feature_priority: "首选产品特性",
  purchase_channel: "购买渠道",
  ai_interest__x__replacement_urgency: "AI兴趣 × 换机紧迫度",
  ai_interest__x__innovation_orientation: "AI兴趣 × 创新倾向",
  owns_device__x__replacement_urgency: "设备拥有 × 换机紧迫度",
  price_sensitivity__x__ai_attitude: "价格敏感 × AI态度",
};

const initialPropensityModel = propensityData.models.find((item) => item.market === "CN" && item.category === "pc")!;

function sigmoidScore(logit: number) {
  return 100 / (1 + Math.exp(-Math.max(-30, Math.min(30, logit))));
}

function coefficientContribution(item: ModelCoefficient, profile: ModelProfile) {
  if (item.kind === "numeric") {
    const value = Number(profile[item.source] ?? item.mean ?? 0);
    return item.coefficient * ((value - (item.mean ?? 0)) / (item.std || 1));
  }
  if (item.kind === "interaction") {
    const raw = (item.components ?? []).reduce((product, source) => product * Number(profile[source] ?? 0), 1);
    return item.coefficient * ((raw - (item.mean ?? 0)) / (item.std || 1));
  }
  if (item.kind === "categorical") return String(profile[item.source]) === item.level ? item.coefficient : 0;
  return 0;
}

function scoreModel(model: PropensityModel, profile: ModelProfile, activeSources: Set<string>) {
  const contributions = model.coefficients
    .filter((item) => activeSources.has(item.source))
    .map((item) => ({ item, value: coefficientContribution(item, profile) }));
  const logit = model.intercept + contributions.reduce((sum, item) => sum + item.value, 0);
  return { probability: sigmoidScore(logit), logit, contributions };
}

const marketCurrency: Record<string, string> = {
  CN: "¥", US: "$", UK: "£", DE: "€", JP: "¥", ID: "Rp", SA: "SAR ", BR: "R$",
};

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function compactPrice(value: number, market: string) {
  return `${marketCurrency[market] ?? ""}${Math.round(value).toLocaleString("en-US")}`;
}

function DashboardHeader() {
  return (
    <>
      <header className="ce-topbar">
        <div className="ce-brandline"><PlatformBrand compact /><span /><div><b>TMT</b><strong>数码3C行业消费者数据库</strong></div></div>
        <nav><Link href="/tmt">返回 TMT 平台</Link></nav>
      </header>
      <section className="ce-hero">
        <div><p>CONSUMER ELECTRONICS INTELLIGENCE</p><h1>数码3C行业大盘</h1><span>从一手消费者数据直接回答：进入哪个市场、做什么产品、如何定价、卖给谁。</span></div>
        <aside><b>PC / AI PC</b><strong>{lenovoSchema.archives.reduce((sum, item) => sum + item.respondent_rows, 0).toLocaleString()}</strong><span>联想历史实际样本记录 · 6期3类人群</span></aside>
      </section>
    </>
  );
}

function MetricCard({ label, value, delta, note, accent = "blue" }: { label: string; value: string; delta?: string; note: string; accent?: "blue" | "teal" | "amber" | "ink" }) {
  return <article className={`ce-metric ${accent}`}><span>{label}</span><div><strong>{value}</strong>{delta && <em className={delta.startsWith("-") ? "down" : "up"}>{delta}</em>}</div><p>{note}</p></article>;
}

export default function ConsumerElectronicsIndustryDashboard() {
  const [category, setCategory] = useState("pc");
  const [scope, setScope] = useState<"中国" | "海外">("中国");
  const [market, setMarket] = useState("CN");
  const [wave, setWave] = useState(data.meta.latest_complete_wave);
  const [dimension, setDimension] = useState("全部人群");
  const [dimensionValue, setDimensionValue] = useState("全部人群");
  const [tab, setTab] = useState<Tab>("行业总览");
  const [priceIndex, setPriceIndex] = useState(100);
  const [featureFit, setFeatureFit] = useState(70);
  const [modelView, setModelView] = useState<ModelView>("决策输出");
  const [comparisonScope, setComparisonScope] = useState<ComparisonScope>("全部市场");
  const [coefficientGroup, setCoefficientGroup] = useState("全部变量");
  const [modelProfile, setModelProfile] = useState<ModelProfile>({ ...initialPropensityModel.default_profile, wave_id: 8 });
  const [activeSources, setActiveSources] = useState<string[]>(Array.from(new Set(initialPropensityModel.coefficients.map((item) => item.source))));
  const [crossXAxis, setCrossXAxis] = useState("income_group");
  const [crossYAxis, setCrossYAxis] = useState("ai_interest");
  const [metricDomain, setMetricDomain] = useState("全部指标");
  const [decisionQuestion, setDecisionQuestion] = useState("市场机会");
  const [metricAudience, setMetricAudience] = useState("全部受众");
  const [metricLayer, setMetricLayer] = useState("全部层级");
  const [metricReadiness, setMetricReadiness] = useState("全部状态");
  const [metricRouteIndex, setMetricRouteIndex] = useState(0);
  const [aipcMetricKey, setAipcMetricKey] = useState("aipc_core_purchase_factor");
  const [aipcCutDimension, setAipcCutDimension] = useState("用户类型");
  const [aipcCutValue, setAipcCutValue] = useState("潜在用户");
  const [aipcDecisionId, setAipcDecisionId] = useState("aipc_product_story");
  const [researchQuery, setResearchQuery] = useState("联想笔记本认知度和未来12个月购买意向如何变化？");
  const [researchAnswer, setResearchAnswer] = useState<null | { title: string; answer: string; points: string[]; sources: string[]; boundary?: string; evidence?: Array<{ label: string; value: string; source: string }> }>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [realCrossDimension, setRealCrossDimension] = useState("收入");
  const [agentRouteId, setAgentRouteId] = useState("pc_industry_opportunity");
  const [agentStageIndex, setAgentStageIndex] = useState(0);
  const [platformAudience, setPlatformAudience] = useState(platformPcIndex.default_query.audience);
  const [platformProductSpace, setPlatformProductSpace] = useState(platformPcIndex.default_query.product_space);
  const [platformSheet, setPlatformSheet] = useState(platformPcIndex.default_query.sheet);
  const [platformIndicator, setPlatformIndicator] = useState(platformPcIndex.default_query.indicator_group);
  const [platformBrand, setPlatformBrand] = useState(platformPcIndex.default_query.brand);
  const [platformWave, setPlatformWave] = useState(platformPcIndex.default_query.wave);
  const [platformResult, setPlatformResult] = useState<PlatformPcQueryResult | null>(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformError, setPlatformError] = useState("");

  const dimensionValues = useMemo(() => {
    const values = data.aggregates
      .filter((row) => row.market === market && row.category === category && row.wave === wave && row.dimension === dimension)
      .map((row) => row.dimension_value);
    return Array.from(new Set(values));
  }, [market, category, wave, dimension]);

  const resolvedDimensionValue = dimensionValues.includes(dimensionValue) ? dimensionValue : (dimensionValues[0] ?? "全部人群");

  const current = data.aggregates.find((row) => row.market === market && row.category === category && row.wave === wave && row.dimension === dimension && row.dimension_value === resolvedDimensionValue)
    ?? data.aggregates.find((row) => row.market === market && row.category === category && row.wave === wave && row.dimension === "全部人群");
  const waveIndex = data.waves.indexOf(wave);
  const previousWave = data.waves[Math.max(0, waveIndex - 1)];
  const previous = data.aggregates.find((row) => row.market === market && row.category === category && row.wave === previousWave && row.dimension === dimension && row.dimension_value === resolvedDimensionValue)
    ?? data.aggregates.find((row) => row.market === market && row.category === category && row.wave === previousWave && row.dimension === "全部人群");
  const forecast = data.forecasts.find((row) => row.market === market && row.category === category && row.dimension === dimension && row.dimension_value === resolvedDimensionValue)
    ?? data.forecasts.find((row) => row.market === market && row.category === category && row.dimension === "全部人群");
  const categoryMeta = data.categories.find((item) => item.code === category)!;
  const marketMeta = data.markets.find((item) => item.code === market)!;
  const propensityModel = propensityData.models.find((item) => item.market === market && item.category === category)!;
  const marketOptions = data.markets.filter((item) => scope === "中国" ? item.code === "CN" : item.code !== "CN");

  const trendData = data.waves.map((item) => {
    const row = data.aggregates.find((candidate) => candidate.market === market && candidate.category === category && candidate.wave === item && candidate.dimension === dimension && candidate.dimension_value === resolvedDimensionValue)
      ?? data.aggregates.find((candidate) => candidate.market === market && candidate.category === category && candidate.wave === item && candidate.dimension === "全部人群");
    return { wave: item.replace("20", "’"), intent: row?.purchase_intent ?? null, ai: row?.ai_interest ?? null, forecast: null as number | null };
  });
  if (forecast) trendData.push({ wave: "’26 Q3F", intent: null, ai: null, forecast: forecast.prediction });
  if (forecast && trendData.length >= 2) trendData[trendData.length - 2].forecast = trendData[trendData.length - 2].intent;

  const featureData = data.features.filter((row) => row.market === market && row.category === category).slice(0, 6);
  const priceCurve = data.price_curves.filter((row) => row.market === market && row.category === category).map((row) => ({ ...row, label: `${row.price_index}%` }));
  const priceAcceptance = priceCurve.reduce((best, row) => Math.abs(row.price_index - priceIndex) < Math.abs(best.price_index - priceIndex) ? row : best, priceCurve[0])?.acceptance ?? 50;
  const scenarioProbability = Math.max(3, Math.min(82, (current?.purchase_intent ?? 20) * (0.55 + priceAcceptance / 100 * 0.45) + (featureFit - 50) * 0.12 + ((current?.ai_interest ?? 50) - 50) * 0.06));

  const scenarioAt = (targetPrice: number, targetFit: number) => {
    const acceptance = priceCurve.reduce((best, row) => Math.abs(row.price_index - targetPrice) < Math.abs(best.price_index - targetPrice) ? row : best, priceCurve[0])?.acceptance ?? 50;
    return Math.max(3, Math.min(82, (current?.purchase_intent ?? 20) * (0.55 + acceptance / 100 * 0.45) + (targetFit - 50) * 0.12 + ((current?.ai_interest ?? 50) - 50) * 0.06));
  };
  const choiceOptions = [
    { name: "基础办公", price: 85, fit: 58, probability: scenarioAt(85, 58) },
    { name: "均衡生产力", price: 100, fit: 76, probability: scenarioAt(100, 76) },
    { name: "AI创作增强", price: 115, fit: 92, probability: scenarioAt(115, 92) },
  ];
  const choiceDenominator = choiceOptions.reduce((sum, item) => sum + Math.exp(item.probability / 12), 0);
  const choiceShares = choiceOptions.map((item) => ({ ...item, share: Math.exp(item.probability / 12) * 100 / choiceDenominator }));
  const topChoice = [...choiceShares].sort((a, b) => b.share - a.share)[0];
  const priceAt = (index: number) => priceCurve.find((row) => row.price_index === index)?.acceptance ?? 0;
  const actualTrend = trendData.filter((item) => item.intent !== null).map((item) => Number(item.intent));
  const backtestErrors = actualTrend.slice(3).map((actual, index) => {
    const base = actualTrend.slice(index, index + 3);
    const predicted = base[2] + ((base[2] - base[1]) + (base[1] - base[0])) / 2;
    return Math.abs(actual - predicted);
  });
  const forecastMae = backtestErrors.length ? backtestErrors.reduce((sum, item) => sum + item, 0) / backtestErrors.length : 0;

  const marketComparison = data.markets.map((item) => {
    const row = data.aggregates.find((candidate) => candidate.market === item.code && candidate.category === category && candidate.wave === data.meta.latest_complete_wave && candidate.dimension === "全部人群");
    const next = data.forecasts.find((candidate) => candidate.market === item.code && candidate.category === category && candidate.dimension === "全部人群");
    return { ...item, row, next };
  });

  const marketModelLandscape = marketComparison
    .filter((item) => comparisonScope === "全部市场" || (comparisonScope === "中国" ? item.code === "CN" : item.code !== "CN"))
    .map((item) => ({
      market: item.name,
      code: item.code,
      aiInterest: item.row?.ai_interest ?? 0,
      forecast: item.next?.prediction ?? 0,
      currentIntent: item.row?.purchase_intent ?? 0,
      demandScore: item.row?.demand_score ?? 0,
      sample: item.n,
      low: item.next?.low ?? 0,
      high: item.next?.high ?? 0,
    }));
  const averageAiInterest = marketModelLandscape.reduce((sum, item) => sum + item.aiInterest, 0) / Math.max(1, marketModelLandscape.length);
  const averageForecast = marketModelLandscape.reduce((sum, item) => sum + item.forecast, 0) / Math.max(1, marketModelLandscape.length);
  const responsePrices = [70, 85, 100, 115, 130];
  const responseFits = [100, 85, 70, 55, 40];
  const responseSurface = responseFits.map((fit) => responsePrices.map((price) => ({ price, fit, probability: scenarioAt(price, fit) })));
  const choicePlotData = choiceShares.map((item) => ({ ...item, bubble: item.share * 13 }));

  const subgroupRows = data.aggregates.filter((row) => row.market === market && row.category === category && row.wave === wave && row.dimension === dimension && row.dimension_value !== "全部人群").sort((a, b) => b.demand_score - a.demand_score);
  const allSegmentRows = data.aggregates.filter((row) => row.market === market && row.category === category && row.wave === wave && row.dimension !== "全部人群");
  const bestSegments = ["年龄", "性别", "收入", "地区"].map((name) => allSegmentRows.filter((row) => row.dimension === name).sort((a, b) => b.demand_score - a.demand_score)[0]).filter(Boolean);
  const modelSegmentRows = allSegmentRows
    .filter((row) => dimension === "全部人群" || row.dimension === dimension)
    .sort((a, b) => b.demand_score - a.demand_score)
    .slice(0, 12);
  const driverColumns = [
    { key: "purchase_intent", label: "购买意向" },
    { key: "ai_interest", label: "AI兴趣" },
    { key: "ai_premium", label: "AI加价接受" },
    { key: "price_sensitivity", label: "价格敏感" },
    { key: "demand_score", label: "需求得分" },
  ] as const;
  const intervalPosition = (value: number) => Math.max(0, Math.min(100, ((value - 50) / 45) * 100));
  const coefficientGroups = ["全部变量", ...Array.from(new Set(propensityModel.coefficients.map((item) => item.group)))];
  const visibleCoefficients = propensityModel.coefficients
    .filter((item) => coefficientGroup === "全部变量" || item.group === coefficientGroup)
    .slice(0, coefficientGroup === "全部变量" ? 16 : 24);
  const coefficientDomain = Math.max(0.25, ...visibleCoefficients.flatMap((item) => [Math.abs(item.ci_low), Math.abs(item.ci_high)])) * 1.12;
  const coefficientPosition = (value: number) => Math.max(0, Math.min(100, ((value + coefficientDomain) / (coefficientDomain * 2)) * 100));
  const activeSourceSet = new Set(activeSources);
  const activeScore = scoreModel(propensityModel, modelProfile, activeSourceSet);
  const allSourceSet = new Set(propensityModel.coefficients.map((item) => item.source));
  const referenceScore = scoreModel(propensityModel, propensityModel.default_profile, allSourceSet);
  const contributionRows = activeScore.contributions
    .filter((row) => Math.abs(row.value) >= 0.002)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 12);
  const contributionDomain = Math.max(0.18, ...contributionRows.map((row) => Math.abs(row.value))) * 1.12;
  const factorCatalog = Array.from(new Set(propensityModel.coefficients.map((item) => item.source))).map((source) => {
    const rows = propensityModel.coefficients.filter((item) => item.source === source);
    return {
      source,
      label: factorLabels[source] ?? rows[0]?.name ?? source,
      group: rows[0]?.group ?? "其他",
      importance: rows.reduce((sum, item) => sum + item.importance, 0),
      significant: rows.some((item) => item.ci_low > 0 || item.ci_high < 0),
    };
  }).sort((a, b) => b.importance - a.importance);
  const factorGroups = Array.from(new Set(factorCatalog.map((item) => item.group)));
  const updateProfile = (source: string, value: string | number) => setModelProfile((currentProfile) => ({ ...currentProfile, [source]: value }));
  const toggleSource = (source: string) => setActiveSources((currentSources) => currentSources.includes(source) ? currentSources.filter((item) => item !== source) : [...currentSources, source]);
  const setGroupSources = (group: string, enabled: boolean) => {
    const sources = factorCatalog.filter((item) => item.group === group).map((item) => item.source);
    setActiveSources((currentSources) => enabled
      ? Array.from(new Set([...currentSources, ...sources]))
      : currentSources.filter((item) => !sources.includes(item)));
  };

  const crossDimensions = [
    { key: "age_group", label: "年龄", values: propensityModel.profile_options.age_group ?? [] },
    { key: "income_group", label: "收入", values: propensityModel.profile_options.income_group ?? [] },
    { key: "region_group", label: "地区", values: propensityModel.profile_options.region_group ?? [] },
    { key: "gender", label: "性别", values: propensityModel.profile_options.gender ?? [] },
    { key: "ai_interest", label: "品类AI兴趣", values: [1, 2, 3, 4, 5] },
    { key: "replacement_urgency", label: "换机紧迫度", values: [1, 2, 3, 4, 5] },
    { key: "price_sensitivity", label: "价格敏感度", values: [25, 40, 55, 70, 85] },
  ];
  const xDimension = crossDimensions.find((item) => item.key === crossXAxis)!;
  const yDimension = crossDimensions.find((item) => item.key === crossYAxis)!;
  const crossMatrix = yDimension.values.map((yValue) => ({
    yValue,
    cells: xDimension.values.map((xValue) => {
      const profile = { ...modelProfile, [crossXAxis]: xValue, [crossYAxis]: yValue };
      return { xValue, probability: scoreModel(propensityModel, profile, activeSourceSet).probability };
    }),
  }));

  const segmentProfileScores = (propensityModel.profile_options.age_group ?? []).flatMap((age) =>
    (propensityModel.profile_options.income_group ?? []).flatMap((income) =>
      (propensityModel.profile_options.region_group ?? []).flatMap((region) =>
        (propensityModel.profile_options.gender ?? []).map((gender) => {
          const profile = { ...modelProfile, age_group: age, income_group: income, region_group: region, gender };
          return { age, income, region, gender, probability: scoreModel(propensityModel, profile, activeSourceSet).probability };
        }),
      ),
    ),
  );
  const highPotentialProfile = [...segmentProfileScores].sort((a, b) => b.probability - a.probability)[0];
  const modelUseLevel = propensityModel.metrics.test_auc >= 0.75
    ? "可用于精细优先级排序"
    : propensityModel.metrics.test_auc >= 0.65
      ? "可用于方向性分群与情景比较"
      : "仅用于探索性判断";
  const priceAcceptanceAtReference = priceAt(100);
  const priceAcceptanceAtPremium = priceAt(115);
  const premiumAcceptanceLoss = priceAcceptanceAtReference - priceAcceptanceAtPremium;

  const scenarioLevers = [
    {
      source: "replacement_urgency",
      label: "换机窗口",
      condition: `换机紧迫度 ${Number(modelProfile.replacement_urgency).toFixed(1)} → ${Math.min(5, Number(modelProfile.replacement_urgency) + 1).toFixed(1)}`,
      target: Math.min(5, Number(modelProfile.replacement_urgency) + 1),
      action: "优先识别临近换机的人群与企业",
    },
    {
      source: "ai_interest",
      label: "AI需求强度",
      condition: `AI兴趣 ${Number(modelProfile.ai_interest).toFixed(1)} → ${Math.min(5, Number(modelProfile.ai_interest) + 1).toFixed(1)}`,
      target: Math.min(5, Number(modelProfile.ai_interest) + 1),
      action: "对高AI兴趣人群突出可感知任务收益",
    },
    {
      source: "price_sensitivity",
      label: "价格耐受",
      condition: `价格敏感度 ${Number(modelProfile.price_sensitivity).toFixed(0)} → ${Math.max(18, Number(modelProfile.price_sensitivity) - 15).toFixed(0)}`,
      target: Math.max(18, Number(modelProfile.price_sensitivity) - 15),
      action: "分层配置与价格带，避免用单一均价覆盖全部人群",
    },
    {
      source: "privacy_concern",
      label: "隐私顾虑",
      condition: `隐私顾虑 ${Number(modelProfile.privacy_concern).toFixed(1)} → ${Math.max(1, Number(modelProfile.privacy_concern) - 1).toFixed(1)}`,
      target: Math.max(1, Number(modelProfile.privacy_concern) - 1),
      action: "验证本地处理、权限与安全信息能否降低顾虑",
    },
    {
      source: "feature_priority",
      label: "核心功能",
      condition: "首选特性 → AI办公与创作",
      target: "AI办公与创作",
      action: "把产品卖点对齐到高频工作与创作任务",
    },
  ].map((lever) => {
    const probability = scoreModel(propensityModel, { ...modelProfile, [lever.source]: lever.target }, activeSourceSet).probability;
    return { ...lever, probability, delta: probability - activeScore.probability };
  }).sort((a, b) => b.delta - a.delta);
  const strongestScenario = scenarioLevers[0];

  const opportunityComponents = [
    { key: "demand", label: "下一期需求", score: forecast?.prediction ?? 0, weight: 25, evidence: `${forecast?.prediction.toFixed(1) ?? "—"}%` },
    { key: "ai", label: "AI需求准备度", score: current?.ai_interest ?? 0, weight: 15, evidence: `${current?.ai_interest.toFixed(1) ?? "—"}%` },
    { key: "price", label: "参考价可行性", score: priceAcceptanceAtReference, weight: 20, evidence: `${priceAcceptanceAtReference.toFixed(1)}%` },
    { key: "momentum", label: "跨期动能", score: Math.max(0, Math.min(100, 50 + (forecast?.trend_pp ?? 0) * 10)), weight: 10, evidence: `${forecast ? signed(forecast.trend_pp) : "—"} pts` },
    { key: "segment", label: "高潜人群强度", score: highPotentialProfile.probability, weight: 15, evidence: `${highPotentialProfile.probability.toFixed(1)}%` },
    { key: "quality", label: "模型判别力", score: Math.max(0, Math.min(100, (propensityModel.metrics.test_auc - 0.5) / 0.3 * 100)), weight: 15, evidence: `AUC ${propensityModel.metrics.test_auc.toFixed(3)}` },
  ].map((item) => ({ ...item, contribution: item.score * item.weight / 100 }));
  const opportunityScore = opportunityComponents.reduce((sum, item) => sum + item.contribution, 0);
  const demandGatePassed = (forecast?.prediction ?? 0) >= 70;
  const priceGatePassed = priceAcceptanceAtReference >= 45;
  const evidenceGatePassed = propensityModel.metrics.test_auc >= 0.70;
  const realModelDecisionGatePassed = lenovoRealModel.selected_model.metrics_test.auc >= 0.70
    && lenovoRealModel.decision.brier_improvement_vs_prior_wave > 0;
  const marketDecision = opportunityScore >= 72 && demandGatePassed && priceGatePassed && evidenceGatePassed
    ? "高优先级：可推进规模验证"
    : opportunityScore >= 58 && demandGatePassed
      ? "选择性推进：先做产品—价格联合验证"
      : "维持观察：先补足需求与证据";
  const failedGates = [
    !demandGatePassed ? "需求门槛" : null,
    !priceGatePassed ? "价格门槛" : null,
    !evidenceGatePassed ? "模型证据门槛" : null,
  ].filter(Boolean) as string[];

  const consumerEvidence = lenovoPcData.audiences.find((item) => item.code === "consumer")!;
  const smbEvidence = lenovoPcData.audiences.find((item) => item.code === "smb")!;
  const enterpriseEvidence = lenovoPcData.audiences.find((item) => item.code === "enterprise")!;
  const consumerNotebook = consumerEvidence.notebook.find((item) => item.brand === "联想")!;
  const lenovoAiPcTrend = consumerEvidence.ai_pc_trend.map((row) => ({
    wave: row.wave,
    consumer: row.aided,
    smb: smbEvidence.ai_pc_trend.find((item) => item.wave === row.wave)?.aided ?? null,
    enterprise: enterpriseEvidence.ai_pc_trend.find((item) => item.wave === row.wave)?.aided ?? null,
  }));
  const enterpriseSelectionFactors = lenovoPcData.enterprise_selection_factors.factors.slice(0, 8);
  const omdiaChinaPc = externalCalibration.sources.find((item) => item.id === "omdia_china_pc_2025_2026")!;
  const nbsIncome = externalCalibration.sources.find((item) => item.id === "nbs_income_2025")!;
  const cnnicDigital = externalCalibration.sources.find((item) => item.id === "cnnic_57")!;
  const gartnerGlobalPc = externalCalibration.sources.find((item) => item.id === "gartner_global_pc_2025")!;
  const externalChecks = [
    {
      question: "市场短期方向是否一致？",
      internal: `下一期购买意向 ${forecast?.prediction.toFixed(1) ?? "—"}%，较本期 ${forecast ? signed(forecast.trend_pp) : "—"} pts`,
      external: `Omdia：2026Q1出货890万台、同比-2%；全年预计3,600万台、-14%`,
      verdict: (forecast?.trend_pp ?? 0) < 0 ? "方向一致" : "方向存在差异",
      role: "校准市场方向，不替代问卷购买意向",
      source: omdiaChinaPc,
    },
    {
      question: "价格负担背景是否合理？",
      internal: `当前可接受价格中位水平 ${current ? compactPrice(current.acceptable_price, market) : "—"}`,
      external: `国家统计局：2025全国可支配收入中位数36,231元；城镇51,115元`,
      verdict: market === "CN" ? "可计算价格/收入比" : "需替换为当地收入基准",
      role: "校准价格负担背景，不替代价格实验",
      source: nbsIncome,
    },
    {
      question: "总体投影的可触达基数是什么？",
      internal: "真实样本N与加权比例保留，不机械扩样",
      external: "CNNIC：截至2025年12月网民11.25亿，互联网普及率80.1%",
      verdict: market === "CN" ? "可作为数字可触达总体上界" : "需替换为当地数字人口基准",
      role: "限定总体边界，不等同于PC拥有者",
      source: cnnicDigital,
    },
    {
      question: "品牌量级是否有外部参照？",
      internal: category === "pc" ? "品牌心智由BHT认知与美誉指标衡量" : "当前品类待接品牌追踪",
      external: "Gartner：2025全球PC出货2.702亿台；联想份额27.2%",
      verdict: category === "pc" ? "可作全球品牌量级参照" : "不适用于当前品类",
      role: "出货份额与品牌认知分开解释",
      source: gartnerGlobalPc,
    },
  ];
  const metricDomains = ["全部指标", ...Array.from(new Set(lenovoMetricDictionary.metrics.map((item) => item.domain)))];
  const metricAudiences = ["全部受众", ...Array.from(new Set(lenovoMetricDictionary.metrics.map((item) => item.audience ?? "跨项目/未限定")))];
  const readinessLabels: Record<string, string> = {
    legacy_definition: "现有指标定义",
    feature_ready: "可作为模型特征",
    target_ready: "可作为问卷目标",
    tracking_model_ready: "可用于跨期模型",
    proxy_target_only: "仅作代理指标",
  };
  const metricReadinessOptions = ["全部状态", ...Object.keys(lenovoMetricDictionary.meta.readiness_counts)];
  const activeMetricLayerRoles = lenovoMetricDictionary.metric_layers.find((item) => item.layer === metricLayer)?.roles ?? [];
  const visibleMetricDefinitions = lenovoMetricDictionary.metrics.filter((item) =>
    (metricDomain === "全部指标" || item.domain === metricDomain)
    && item.decisions.includes(decisionQuestion)
    && (metricAudience === "全部受众" || (item.audience ?? "跨项目/未限定") === metricAudience)
    && (metricLayer === "全部层级" || item.roles.some((role) => activeMetricLayerRoles.includes(role)))
    && (metricReadiness === "全部状态" || item.model_readiness === metricReadiness),
  );
  const activeMetricRoute = lenovoMetricDictionary.model_routes[metricRouteIndex];
  const activeAipcAggregate = aipcW2Aggregates.metrics.find((item) => item.metric_key === aipcMetricKey) ?? aipcW2Aggregates.metrics[0];
  const aipcCutValues = useMemo(
    () => Array.from(new Set(activeAipcAggregate.subgroups.filter((item) => item.dimension === aipcCutDimension).map((item) => item.dimension_value))),
    [activeAipcAggregate, aipcCutDimension],
  );
  const resolvedAipcCutValue = aipcCutValues.includes(aipcCutValue) ? aipcCutValue : (aipcCutValues[0] ?? "");
  const activeAipcCut = activeAipcAggregate.subgroups.find((item) => item.dimension === aipcCutDimension && item.dimension_value === resolvedAipcCutValue)
    ?? activeAipcAggregate.subgroups.find((item) => item.dimension === aipcCutDimension);
  const aipcCrossRows = activeAipcAggregate.options.slice(0, 8).map((option) => ({
    option: option.label,
    总体: option.percent,
    当前人群: activeAipcCut?.options.find((item) => item.code === option.code)?.percent ?? 0,
    difference: (activeAipcCut?.options.find((item) => item.code === option.code)?.percent ?? 0) - option.percent,
  }));
  const largestAipcGap = [...aipcCrossRows].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))[0];
  const q14DriftSeries = [
    ...pcQ14Drift.series.map((item) => ({ wave: item.wave, historical: item.value, later: null as number | null, base: item.base })),
    { wave: pcQ14Drift.later_wave_validation.wave, historical: null as number | null, later: pcQ14Drift.later_wave_validation.value, base: pcQ14Drift.later_wave_validation.base },
  ];
  const activeAipcDecision = aipcDecisionOutputs.outputs.find((item) => item.decision_id === aipcDecisionId) ?? aipcDecisionOutputs.outputs[0];

  const realIntentSeries = lenovoEvidence.series.notebook_purchase_intent_12m;
  const realAwarenessSeries = lenovoEvidence.series.notebook_brand_awareness.map((item) => ({
    wave: String(item.wave),
    联想: Number(item["联想"] ?? 0),
    华为: Number(item["华为"] ?? 0),
    戴尔: Number(item["戴尔"] ?? 0),
  }));
  const realModelCoefficients = lenovoRealModel.selected_model.coefficients
    .filter((item) => item.significant_95)
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, 10);
  const realCoefficientDomain = Math.max(0.2, ...realModelCoefficients.flatMap((item) => [Math.abs(item.ci_low), Math.abs(item.ci_high)])) * 1.1;
  const realCoefficientPosition = (value: number) => Math.max(0, Math.min(100, ((value + realCoefficientDomain) / (realCoefficientDomain * 2)) * 100));
  const totalHistoricalRespondents = lenovoSchema.archives.reduce((sum, item) => sum + item.respondent_rows, 0);
  const activeAgentRoute = researchAgentRegistry.routes.find((item) => item.route_id === agentRouteId) ?? researchAgentRegistry.routes[0];
  const activePrimaryCapability = researchAgentRegistry.capabilities.find((item) => item.code === activeAgentRoute.primary_capability)!;
  const activeSupportingCapabilities = activeAgentRoute.supporting_capabilities
    .map((code) => researchAgentRegistry.capabilities.find((item) => item.code === code))
    .filter(Boolean) as ResearchAgentRegistry["capabilities"];
  const activeAgentStage = activeAgentRoute.workflow[agentStageIndex] ?? activeAgentRoute.workflow[0];
  const realCrossDimensions = Array.from(new Set(lenovoRealModel.selected_model.subgroups.map((item) => item.dimension)));
  const realCrossRows = lenovoRealModel.selected_model.subgroups
    .filter((item) => item.dimension === realCrossDimension)
    .map((item) => ({ ...item, gap: item.predicted - item.observed }))
    .sort((a, b) => b.observed - a.observed);
  const platformSheetOptions = useMemo(() => Array.from(new Set(platformPcIndex.sheet_catalog
    .filter((item) => item.audience === platformAudience && item.product_space === platformProductSpace)
    .map((item) => item.sheet))), [platformAudience, platformProductSpace]);
  const resolvedPlatformSheet = platformAudience === "全部受众" || platformProductSpace === "全部产品域" || platformSheetOptions.includes(platformSheet)
    ? platformSheet
    : (platformSheetOptions[0] ?? "全部指标表");
  const activePlatformFilter = platformPcIndex.filter_catalog.find((item) => item.audience === platformAudience && item.product_space === platformProductSpace && item.sheet === resolvedPlatformSheet);
  const platformIndicatorOptions = activePlatformFilter?.indicator_groups ?? [];
  const platformBrandOptions = activePlatformFilter?.brands ?? [];
  const platformWaveOptions = activePlatformFilter?.waves ?? platformPcIndex.facets.waves;
  const resolvedPlatformIndicator = platformIndicator === "全部指标" || platformIndicatorOptions.includes(platformIndicator) ? platformIndicator : (platformIndicatorOptions[0] ?? "全部指标");
  const resolvedPlatformBrand = platformBrand === "全部品牌/指标项" || platformBrandOptions.includes(platformBrand) ? platformBrand : (platformBrandOptions[0] ?? "全部品牌/指标项");
  const resolvedPlatformWave = platformWave === "全部期次" || platformWaveOptions.includes(platformWave) ? platformWave : "全部期次";
  const platformTrendRows = (platformResult?.trend ?? []).map((item) => ({
    ...item,
    series: item.brand || item.analysis_item,
  }));
  const platformSeries = Array.from(new Set(platformTrendRows.map((item) => item.series))).slice(0, 6);
  const platformTrendChartData = Array.from(new Set(platformTrendRows.map((item) => item.wave)))
    .map((waveValue) => ({
      wave: waveValue,
      waveOrder: platformTrendRows.find((item) => item.wave === waveValue)?.wave_order ?? 0,
      ...Object.fromEntries(platformSeries.map((series) => [series, platformTrendRows.find((item) => item.wave === waveValue && item.series === series)?.value ?? null])),
    }))
    .sort((a, b) => a.waveOrder - b.waveOrder);

  const queryResearchEvidence = async () => {
    const query = researchQuery.trim();
    if (!query || researchLoading) return;
    setResearchLoading(true);
    setResearchError("");
    try {
      const response = await fetch("/api/research-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const payload = await response.json() as { answer?: typeof researchAnswer; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "证据检索失败");
      setResearchAnswer(payload.answer);
    } catch (error) {
      setResearchAnswer(null);
      setResearchError(error instanceof Error ? error.message : "证据检索失败");
    } finally {
      setResearchLoading(false);
    }
  };
  const queryPlatformPc = async () => {
    if (platformLoading) return;
    setPlatformLoading(true);
    setPlatformError("");
    try {
      const response = await fetch("/api/pc-platform-query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audience: platformAudience, productSpace: platformProductSpace, sheet: resolvedPlatformSheet, indicatorGroup: resolvedPlatformIndicator, brand: resolvedPlatformBrand, wave: resolvedPlatformWave }),
      });
      const payload = await response.json() as PlatformPcQueryResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "PC聚合证据查询失败");
      setPlatformResult(payload);
    } catch (error) {
      setPlatformResult(null);
      setPlatformError(error instanceof Error ? error.message : "PC聚合证据查询失败");
    } finally {
      setPlatformLoading(false);
    }
  };
  const validationStages = [
    {
      code: "01",
      name: "需求成立",
      status: demandGatePassed ? "通过" : "待加强",
      tone: demandGatePassed ? "pass" : "warning",
      result: `${data.meta.forecast_wave}购买意向 ${forecast?.prediction.toFixed(1) ?? "—"}%`,
      evidence: `多期追踪预测区间 ${forecast?.low.toFixed(1) ?? "—"}%–${forecast?.high.toFixed(1) ?? "—"}%`,
    },
    {
      code: "02",
      name: "目标人群可识别",
      status: highPotentialProfile.probability > referenceScore.probability ? "通过" : "待加强",
      tone: highPotentialProfile.probability > referenceScore.probability ? "pass" : "warning",
      result: `${highPotentialProfile.age}、${highPotentialProfile.income}`,
      evidence: `预测 ${highPotentialProfile.probability.toFixed(1)}%，较参考画像 ${signed(highPotentialProfile.probability - referenceScore.probability)} pts`,
    },
    {
      code: "03",
      name: "产品—价格组合",
      status: priceGatePassed ? "通过" : "进入实测",
      tone: priceGatePassed ? "pass" : "warning",
      result: `${topChoice.name} · 参考价接受 ${priceAcceptanceAtReference.toFixed(1)}%`,
      evidence: "下一轮接入真实选择实验，以Holdout选择题验证份额与价格效用",
    },
    {
      code: "04",
      name: "外部市场方向",
      status: "已对照",
      tone: "pass",
      result: "行业出货、总体与收入分别对照",
      evidence: "Omdia / Gartner / CNNIC / 国家统计局；不同口径不相互替代",
    },
    {
      code: "05",
      name: "样本外预测",
      status: evidenceGatePassed ? "通过" : "方向性使用",
      tone: evidenceGatePassed ? "pass" : "warning",
      result: `时间留出 AUC ${propensityModel.metrics.test_auc.toFixed(3)}`,
      evidence: `Brier ${propensityModel.metrics.brier.toFixed(3)}；达到AUC 0.70后进入稳定排序`,
    },
    {
      code: "06",
      name: "真实商业结果",
      status: "待接入",
      tone: "pending",
      result: "销量 / 转化 / 退货 / 使用",
      evidence: "接入SKU×市场×时间结果后，才能校准销量、成功概率与真实增量",
    },
  ];
  const serviceValidationStages = [
    { name: "客户问题复用", status: "进入访谈", tone: "warning", evidence: "用10–15家数码3C SMB验证市场进入、目标人群、配置、价格与竞争是否为重复任务", pass: "至少3类任务在多家客户重复出现" },
    { name: "一手数据增量", status: "已有基础", tone: "pass", evidence: "联想PC/AI PC项目已经提供品牌、AI认知与企业选型事实层", pass: "能回答公开报告无法回答的人群×任务×价格问题" },
    { name: "跨期更新价值", status: "进入回放", tone: "warning", evidence: "用已有Tracking回放判断季度变化是否会改变人群、产品或价格决策", pass: "更新结果至少改变一项实际优先级" },
    { name: "模型预测增量", status: realModelDecisionGatePassed ? "通过首关" : "尚未通过", tone: realModelDecisionGatePassed ? "pass" : "warning", evidence: `联想真实Raw时间留出AUC ${lenovoRealModel.selected_model.metrics_test.auc.toFixed(4)}；较沿用上期值Brier改善 ${lenovoRealModel.decision.brier_improvement_vs_prior_wave.toFixed(4)}`, pass: "连续两期在AUC、Brier或区间覆盖上稳定优于基线，且AUC达到0.70" },
    { name: "总体代表性与投影", status: "待建立权重", tone: "warning", evidence: `当前可报告真实原始样本N=${totalHistoricalRespondents.toLocaleString()}；尚未用年龄、性别、地区和收入的权威总体边际完成校准`, pass: "完成配额—总体映射、加权有效样本量检查与加权/未加权差异审计后，才允许人数投影" },
    { name: "价格与产品选择", status: "需新增实验", tone: "warning", evidence: "历史Q84支持购买预算分布，但没有价格变动下的选择任务，不能估计价格弹性、最优售价或配置份额", pass: "完成离散选择或价格实验，并在留出选择题中验证份额与价格效用" },
    { name: "决策任务可用", status: "进入任务测试", tone: "warning", evidence: "让客户用平台完成市场、人群、配置、价格与竞争五类任务，记录用时和结论", pass: "任务成功、结论可追溯，并实际形成下一步动作" },
    { name: "证据可信", status: "已建规则", tone: "pass", evidence: "每个指标保存题号、Base、权重、波次、来源和刷新时间；外部数据只做同口径校验", pass: "Raw / Table复算一致，来源与允许用途可下钻" },
    { name: "复用与续用", status: "待真实验证", tone: "pending", evidence: "记录保存分析、导出、重复登录、下一期继续使用和付费意向", pass: "客户在第二期继续使用，并愿意为持续更新付费" },
  ];
  const productBenchmarkRows = [
    { capability: "指标交叉与目标人群", benchmark: "Statista：行/列交叉、目标人群、国家与时间切换、Index与样本N提示", current: "已支持真实Q14单维度细分、实际/预测对照和N提示", gap: "增加多条件目标人群、Index、显著性与可保存分析", source: "https://www.statista.com/getting-started/consumer-insights-tool-features" },
    { capability: "连续人群数据", benchmark: "YouGov Profiles：组合人口、态度、行为与媒体变量，数据集按周更新", current: "联想PC已有6期大众消费者、SMB和政企历史资产", gap: "统一跨项目题号后，再形成固定季度核心问卷与可回访样本", source: "https://business.yougov.com/product/profiles" },
    { capability: "总体权重与人数投影", benchmark: "Statista：配额覆盖年龄、性别、地区；Absolute建立在总体权重上", current: "保留真实原始N和外部人口/收入边界，尚未生成正式权重", gap: "建立年龄×性别×地区权重、有效样本量审计和PC目标总体", source: "https://www.statista.com/getting-started/consumer-insights-faqs" },
    { capability: "研究问答与来源", benchmark: "Statista：Consumer Insights可在Research AI中被检索并与来源内容共同返回", current: "服务端证据检索已返回题号、期次、Base、来源及不可回答边界", gap: "先接入客户权限隔离；生成模型后置并只使用召回证据", source: "https://www.statista.com/getting-started/consumer-insights-how-to-access" },
    { capability: "问卷与外部信号联合", benchmark: "Ipsos Synthesio：问卷、社媒和行为信号并列分析，并提供受众、主题和信号发现", current: "问卷/Raw/Table与外部市场口径已分层，Social尚未接入", gap: "下一阶段接入BHT+Social同品牌、同市场、同时间口径验证", source: "https://www.ipsos.com/en-sg/ai-enabled-consumer-intelligence-platform" },
  ];

  return (
    <main className="ce-dashboard">
      <DashboardHeader />
      <section className="ce-workspace">
        {tab === "研究设计Agent" || tab === "指标与研究问答" || tab === "BHT + Social + 行为" || tab === "产品验证" ? <div className="ce-evidence-scopebar">
          <div><span>数据集</span><strong>联想PC历史研究资产</strong></div>
          <div><span>市场</span><strong>中国</strong></div>
          <div><span>历史期次</span><strong>2023Q1–2024Q2 · FY26 26 Jun</strong></div>
          <div><span>研究对象</span><strong>大众消费者 / SMB / 政企大客户</strong></div>
          <div><span>实际样本</span><strong>N={totalHistoricalRespondents.toLocaleString()}</strong></div>
        </div> : <div className="ce-filterbar">
          <label><span>产品品类</span><select value={category} onChange={(event) => { const nextCategory = event.target.value; const nextModel = propensityData.models.find((item) => item.market === market && item.category === nextCategory)!; setCategory(nextCategory); setDimensionValue("全部人群"); setModelProfile({ ...nextModel.default_profile, wave_id: data.waves.indexOf(wave) + 1 }); setActiveSources(Array.from(new Set(nextModel.coefficients.map((item) => item.source)))); }}>{data.categories.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
          <label><span>区域</span><select value={scope} onChange={(event) => { const next = event.target.value as "中国" | "海外"; const nextMarket = next === "中国" ? "CN" : market === "CN" ? "US" : market; const nextModel = propensityData.models.find((item) => item.market === nextMarket && item.category === category)!; setScope(next); setMarket(nextMarket); setDimensionValue("全部人群"); setModelProfile({ ...nextModel.default_profile, wave_id: data.waves.indexOf(wave) + 1 }); setActiveSources(Array.from(new Set(nextModel.coefficients.map((item) => item.source)))); }}><option>中国</option><option>海外</option></select></label>
          <label><span>{scope === "中国" ? "市场" : "海外国家"}</span><select value={market} onChange={(event) => { const nextMarket = event.target.value; const nextModel = propensityData.models.find((item) => item.market === nextMarket && item.category === category)!; setMarket(nextMarket); setDimensionValue("全部人群"); setModelProfile({ ...nextModel.default_profile, wave_id: data.waves.indexOf(wave) + 1 }); setActiveSources(Array.from(new Set(nextModel.coefficients.map((item) => item.source)))); }}>{marketOptions.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
          <label><span>期次</span><select value={wave} onChange={(event) => { const nextWave = event.target.value; setWave(nextWave); setDimensionValue("全部人群"); setModelProfile({ ...propensityModel.default_profile, wave_id: data.waves.indexOf(nextWave) + 1 }); }}>{data.waves.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>人群维度</span><select value={dimension} onChange={(event) => { const nextDimension = event.target.value; const nextValue = data.aggregates.find((row) => row.market === market && row.category === category && row.wave === wave && row.dimension === nextDimension)?.dimension_value ?? "全部人群"; setDimension(nextDimension); setDimensionValue(nextValue); }}>{dimensions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>具体人群</span><select value={resolvedDimensionValue} onChange={(event) => setDimensionValue(event.target.value)}>{dimensionValues.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div><span>行业方案样本</span><strong>N={current?.n.toLocaleString() ?? "—"}</strong></div>
        </div>}

        <nav className="ce-tabs" aria-label="数码3C数据视图">{tabs.map((item) => <button type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav>

        {tab === "行业总览" && <>
          <section className="ce-question"><span>当前决策</span><strong>{marketMeta.name}市场的{categoryMeta.name}，未来12个月需求是否值得进入，主要机会来自哪里？</strong></section>
          <section className="ce-metric-grid">
            <MetricCard label="设备拥有率" value={`${current?.ownership.toFixed(1) ?? "—"}%`} delta={current && previous ? `${signed(current.ownership - previous.ownership)} pts` : undefined} note={`${dimensionValue} · ${wave}`} />
            <MetricCard label="未来12个月购买意向" value={`${current?.purchase_intent.toFixed(1) ?? "—"}%`} delta={current && previous ? `${signed(current.purchase_intent - previous.purchase_intent)} pts` : undefined} note={`Top-2-Box · ${previousWave}对比`} accent="teal" />
            <MetricCard label={`${data.meta.forecast_wave}购买意向预测`} value={`${forecast?.prediction.toFixed(1) ?? "—"}%`} delta={forecast ? `${signed(forecast.trend_pp)} pts` : undefined} note={forecast ? `预测区间 ${forecast.low.toFixed(1)}%–${forecast.high.toFixed(1)}%` : "—"} accent="ink" />
            <MetricCard label="AI功能加价接受" value={`${current?.ai_premium.toFixed(1) ?? "—"}%`} note="愿意为明确AI功能支付额外价格" accent="amber" />
            <MetricCard label="可接受价格中位水平" value={current ? compactPrice(current.acceptable_price, market) : "—"} note="基于受访者可接受价格分布" />
          </section>

          <section className="ce-overview-grid">
            <article className="ce-panel ce-trend-panel"><header><div><span>DEMAND TRACKING</span><h2>购买意向与AI兴趣跨期变化</h2></div><strong>行业方案数据 · 虚线为下一期预测</strong></header><div className="ce-chart">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 12, right: 18, bottom: 2, left: -18 }}><CartesianGrid stroke="#e5e9ef" vertical={false} /><XAxis dataKey="wave" tickLine={false} axisLine={{ stroke: "#cfd6e1" }} tick={{ fontSize: 9 }} /><YAxis domain={[0, 80]} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} unit="%" /><Tooltip /><Line type="monotone" dataKey="intent" name="购买意向" stroke="#2639a5" strokeWidth={3} dot={{ r: 3 }} connectNulls /><Line type="monotone" dataKey="ai" name="AI兴趣" stroke="#0fa39b" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="forecast" name="预测" stroke="#d9932f" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls /></LineChart></ResponsiveContainer>
            </div></article>
            <article className="ce-panel ce-decision-panel"><span>本期可执行结论</span><h2>{bestSegments[0]?.dimension_value ?? dimensionValue}是当前需求得分最高的人群；“{featureData[0]?.feature ?? categoryMeta.features[0]}”是首要产品要求。</h2><dl><div><dt>产品</dt><dd>首要特性占比 {featureData[0]?.share.toFixed(1) ?? "—"}%</dd></div><div><dt>价格</dt><dd>参考价格水平的接受率 {priceCurve.find((row) => row.price_index === 100)?.acceptance.toFixed(1) ?? "—"}%</dd></div><div><dt>风险</dt><dd>价格敏感度 {current?.price_sensitivity.toFixed(1) ?? "—"}/100</dd></div></dl></article>
          </section>

          <section className="ce-panel ce-market-table"><header><div><span>MARKET COMPARISON</span><h2>中国与海外市场分层对比</h2></div><strong>{categoryMeta.name} · {data.meta.latest_complete_wave}</strong></header><div className="ce-table-scroll"><table><thead><tr><th>市场</th><th>每期样本</th><th>拥有率</th><th>购买意向</th><th>AI兴趣</th><th>可接受价格</th><th>{data.meta.forecast_wave}预测</th><th>机会得分</th></tr></thead><tbody><tr className="market-group"><td colSpan={8}>中国市场</td></tr>{marketComparison.filter((item) => item.code === "CN").map((item) => <tr className={item.code === market ? "active" : ""} key={item.code} onClick={() => { setScope("中国"); setMarket(item.code); }}><td><b>{item.name}</b><small>{item.code}</small></td><td>N={item.n.toLocaleString()}</td><td>{item.row?.ownership.toFixed(1)}%</td><td>{item.row?.purchase_intent.toFixed(1)}%</td><td>{item.row?.ai_interest.toFixed(1)}%</td><td>{item.row ? compactPrice(item.row.acceptable_price, item.code) : "—"}</td><td><strong>{item.next?.prediction.toFixed(1)}%</strong><small>{item.next ? `${item.next.low.toFixed(1)}–${item.next.high.toFixed(1)}` : "—"}</small></td><td><em>{item.row?.demand_score.toFixed(1)}</em></td></tr>)}<tr className="market-group"><td colSpan={8}>海外市场 · 按国家查看</td></tr>{marketComparison.filter((item) => item.code !== "CN").map((item) => <tr className={item.code === market ? "active" : ""} key={item.code} onClick={() => { setScope("海外"); setMarket(item.code); }}><td><b>{item.name}</b><small>{item.code}</small></td><td>N={item.n.toLocaleString()}</td><td>{item.row?.ownership.toFixed(1)}%</td><td>{item.row?.purchase_intent.toFixed(1)}%</td><td>{item.row?.ai_interest.toFixed(1)}%</td><td>{item.row ? compactPrice(item.row.acceptable_price, item.code) : "—"}</td><td><strong>{item.next?.prediction.toFixed(1)}%</strong><small>{item.next ? `${item.next.low.toFixed(1)}–${item.next.high.toFixed(1)}` : "—"}</small></td><td><em>{item.row?.demand_score.toFixed(1)}</em></td></tr>)}</tbody></table></div></section>
        </>}

        {tab === "研究设计Agent" && <>
          <section className="ce-question"><span>项目入口</span><strong>先明确客户要做的决策，再选择研究能力、数据和模型；模型不是预设清单，问卷也不是孤立交付物。</strong></section>
          <article className="ce-agent-router">
            <header><div><span>IPSOS RESEARCH DESIGN AGENT</span><h2>从业务问题路由到可验证的研究方案</h2><p>{researchAgentRegistry.meta.principle}</p></div><strong>{activePrimaryCapability.code} 主研究能力</strong></header>
            <section>
              <aside>
                <label><span>客户当前要解决的问题</span><select value={agentRouteId} onChange={(event) => { setAgentRouteId(event.target.value); setAgentStageIndex(0); }}>{researchAgentRegistry.routes.map((item) => <option value={item.route_id} key={item.route_id}>{item.decision}</option>)}</select></label>
                <div><span>业务问题</span><strong>{activeAgentRoute.business_question}</strong></div>
                <footer>{researchAgentRegistry.meta.research_advantage.map((item) => <em key={item}>{item}</em>)}</footer>
              </aside>
              <main>
                <span>本次推荐</span>
                <h3>{activePrimaryCapability.name}为主；{activeSupportingCapabilities.map((item) => item.name).join("、")}提供辅助证据。</h3>
                <div className="ce-agent-reasons">{activeAgentRoute.selection_logic.map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}</div>
                <dl><div><dt>主模型</dt><dd>{activeAgentRoute.primary_models.join(" · ")}</dd></div><div><dt>辅助模型</dt><dd>{activeAgentRoute.supporting_models.join(" · ")}</dd></div></dl>
              </main>
            </section>
          </article>

          <article className="ce-agent-pipeline-panel">
            <header><div><span>RESEARCH PRODUCTION FLOW</span><h3>{activeAgentRoute.decision}：从客户需求到真实结果回流</h3></div><strong>{activeAgentRoute.workflow.length}个可执行阶段</strong></header>
            <div className="ce-agent-stage-tabs">{activeAgentRoute.workflow.map((item, index) => <button type="button" className={agentStageIndex === index ? "active" : ""} onClick={() => setAgentStageIndex(index)} key={item.stage}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.stage}</span></button>)}</div>
            <div className="ce-agent-stage-detail">
              <section><span>本阶段回答</span><h3>{activeAgentStage.question}</h3><p>{researchAgentRegistry.meta.routing_rule}</p></section>
              <section><span>本阶段产出</span><strong>{activeAgentStage.deliverable}</strong></section>
              <aside><span>项目完成后的客户成果</span>{activeAgentRoute.client_outputs.map((item) => <b key={item}>{item}</b>)}</aside>
            </div>
            <footer><span>下一步</span><strong>{activeAgentRoute.next_action}</strong></footer>
          </article>

          <section className="ce-agent-evidence-grid">
            <article>
              <header><span>CURRENT EVIDENCE</span><h3>当前可直接使用的研究数据</h3></header>
              <div>{activeAgentRoute.current_evidence.map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></p>)}</div>
            </article>
            <article className="gap">
              <header><span>DATA TO COLLECT</span><h3>下一轮需要采集的数据</h3></header>
              <div>{activeAgentRoute.evidence_gaps.map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></p>)}</div>
            </article>
          </section>

          <article className="ce-capability-registry">
            <header><div><span>RESEARCH CAPABILITY REGISTRY</span><h3>五项Ipsos研究能力：回答什么、如何建模、以什么质量门槛交付</h3></div><strong>可组合，不堆叠</strong></header>
            <div>{researchAgentRegistry.capabilities.map((item) => <section className={item.code === activePrimaryCapability.code ? "active" : activeAgentRoute.supporting_capabilities.includes(item.code) ? "supporting" : ""} key={item.code}><header><b>{item.code}</b><div><span>{item.official_name}</span><strong>{item.name}</strong></div></header><p>{item.answers}</p><dl><div><dt>可用方法</dt><dd>{item.methods.join(" · ")}</dd></div><div><dt>客户产出</dt><dd>{item.outputs.join(" · ")}</dd></div><div><dt>质量门槛</dt><dd>{item.quality_gate}</dd></div></dl><a href={item.official_url} target="_blank" rel="noreferrer">Ipsos官方能力说明 ↗</a></section>)}</div>
          </article>

        </>}

        {tab === "产品与价格" && <>
          <section className="ce-question"><span>当前决策</span><strong>{categoryMeta.name}应优先配置哪些特性，参考价格变化会如何影响购买概率？</strong></section>
          <section className="ce-product-grid">
            <article className="ce-panel"><header><div><span>FEATURE PRIORITY</span><h2>消费者首选产品特性</h2></div><strong>{marketMeta.name} · {wave}</strong></header><div className="ce-feature-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={featureData} layout="vertical" margin={{ top: 8, right: 28, bottom: 8, left: 30 }}><CartesianGrid stroke="#e7eaf0" horizontal={false} /><XAxis type="number" domain={[0, 30]} hide /><YAxis type="category" dataKey="feature" width={105} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Bar dataKey="share" radius={[0, 3, 3, 0]}>{featureData.map((_, index) => <Cell fill={index === 0 ? "#0fa39b" : "#2639a5"} key={index} />)}</Bar></BarChart></ResponsiveContainer></div></article>
            <article className="ce-panel"><header><div><span>PRICE ACCEPTANCE</span><h2>相对参考价格接受曲线</h2></div><strong>100%=当前品类参考价格</strong></header><div className="ce-feature-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={priceCurve} margin={{ top: 14, right: 24, bottom: 8, left: -6 }}><CartesianGrid stroke="#e7eaf0" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#ccd3df" }} tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} unit="%" /><Tooltip /><Line type="monotone" dataKey="acceptance" name="价格接受率" stroke="#d9932f" strokeWidth={3} dot={{ r: 4, fill: "#d9932f" }} /></LineChart></ResponsiveContainer></div></article>
          </section>
          <section className="ce-simulator">
            <div><span>CHOICE + PRICE SIMULATOR</span><h2>产品方案模拟</h2><p>把当前品类的人群基础意向、价格接受曲线、AI兴趣与特性匹配度联动，直接查看方案变化。</p></div>
            <label><span>价格指数 <b>{priceIndex}%</b></span><input type="range" min="70" max="130" step="5" value={priceIndex} onChange={(event) => setPriceIndex(Number(event.target.value))} /><small>{compactPrice(categoryMeta.reference_price * marketMeta.price * priceIndex / 100, market)}</small></label>
            <label><span>特性匹配度 <b>{featureFit}/100</b></span><input type="range" min="30" max="100" step="5" value={featureFit} onChange={(event) => setFeatureFit(Number(event.target.value))} /><small>与首选产品特性的匹配程度</small></label>
            <article><span>模型预测购买概率</span><strong>{scenarioProbability.toFixed(1)}%</strong><em className={scenarioProbability >= (current?.purchase_intent ?? 0) ? "up" : "down"}>{signed(scenarioProbability - (current?.purchase_intent ?? 0))} pts</em><p>相对当前基础方案</p></article>
          </section>
        </>}

        {tab === "人群细分" && <>
          <section className="ce-question"><span>当前决策</span><strong>哪些年龄、性别、收入与地区人群同时具备需求、支付与AI兴趣？</strong></section>
          <section className="ce-segment-top">{bestSegments.map((row) => <article key={row.dimension}><span>{row.dimension}</span><strong>{row.dimension_value}</strong><div><b>{row.demand_score.toFixed(1)}</b><small>需求得分</small></div><p>购买意向 {row.purchase_intent.toFixed(1)}% · AI兴趣 {row.ai_interest.toFixed(1)}%</p></article>)}</section>
          <section className="ce-panel ce-segment-table"><header><div><span>SUBGROUP DETAIL</span><h2>{dimension === "全部人群" ? "选择年龄、性别、收入或地区查看细分" : `${dimension}细分表现`}</h2></div><label><span>切换维度</span><select value={dimension} onChange={(event) => setDimension(event.target.value)}>{dimensions.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label></header>{dimension !== "全部人群" && <div className="ce-segment-rows"><div className="head"><span>人群</span><span>样本</span><span>拥有率</span><span>购买意向</span><span>AI兴趣</span><span>AI加价接受</span><span>价格敏感</span><span>需求得分</span></div>{subgroupRows.map((row) => <div key={row.dimension_value}><strong>{row.dimension_value}</strong><span>N={row.n}</span><span>{row.ownership.toFixed(1)}%</span><span>{row.purchase_intent.toFixed(1)}%</span><span>{row.ai_interest.toFixed(1)}%</span><span>{row.ai_premium.toFixed(1)}%</span><span>{row.price_sensitivity.toFixed(1)}</span><b>{row.demand_score.toFixed(1)}</b></div>)}</div>}</section>
        </>}

        {tab === "指标与研究问答" && <>
          <section className="ce-question"><span>数据产品核心</span><strong>先选择要回答的决策，再查看可用指标、交叉维度、真实证据与模型边界。</strong></section>
          <section className="ce-foundation-summary">
            <article><span>历史实际样本</span><strong>{totalHistoricalRespondents.toLocaleString()}</strong><p>6期 · 大众消费者 / SMB / 政企大客户</p></article>
            <article><span>稳定候选字段</span><strong>{lenovoSchema.overlap["大众消费者"].stable_safe_field_count.toLocaleString()}</strong><p>大众消费者跨6期交集</p></article>
            <article><span>PC稳定Table</span><strong>{lenovoSchema.overlap["大众消费者"].stable_pc_tables.length}</strong><p>保持原始Table名称与口径</p></article>
            <article><span>完整指标定义</span><strong>{lenovoMetricDictionary.meta.metric_count}</strong><p>新增{lenovoMetricDictionary.meta.historical_question_series_added}条历史题目序列 · 4类研究受众</p></article>
            <article><span>AIPC聚合观测</span><strong>{lenovoDatabaseManifest.table_counts.research_project_metric_aggregates.toLocaleString()}</strong><p>总体、选项与五类人群切分均保留Base和来源</p></article>
          </section>
          <section className="ce-metric-route-panel">
            <nav>{lenovoMetricDictionary.model_routes.map((item, index) => <button type="button" className={metricRouteIndex === index ? "active" : ""} onClick={() => setMetricRouteIndex(index)} key={item.question}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.question}</span></button>)}</nav>
            <article><span>推荐主模型</span><h2>{activeMetricRoute.primary}</h2><div><section><b>所需输入</b><p>{activeMetricRoute.inputs.join(" · ")}</p></section><section><b>客户产出</b><p>{activeMetricRoute.outputs.join(" · ")}</p></section></div></article>
          </section>
          <section className="ce-metric-workbench">
            <header><div><span>PC METRIC SYSTEM</span><h2>PC / AI PC 指标体系</h2><p>从实际问卷与历史Table登记指标；筛选后直接看到题号、受众、期次、Base、可交叉维度与模型用途。</p></div><strong>{visibleMetricDefinitions.length} / {lenovoMetricDictionary.meta.metric_count}项</strong></header>
            <div className="ce-metric-filters">
              <label><span>决策问题</span><select value={decisionQuestion} onChange={(event) => setDecisionQuestion(event.target.value)}>{lenovoMetricDictionary.meta.decision_chain.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>研究受众</span><select value={metricAudience} onChange={(event) => setMetricAudience(event.target.value)}>{metricAudiences.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>指标层级</span><select value={metricLayer} onChange={(event) => setMetricLayer(event.target.value)}><option>全部层级</option>{lenovoMetricDictionary.metric_layers.map((item) => <option key={item.layer}>{item.layer}</option>)}</select></label>
              <label><span>模型可用性</span><select value={metricReadiness} onChange={(event) => setMetricReadiness(event.target.value)}>{metricReadinessOptions.map((item) => <option value={item} key={item}>{item === "全部状态" ? item : readinessLabels[item]}</option>)}</select></label>
              <label><span>指标域</span><select value={metricDomain} onChange={(event) => setMetricDomain(event.target.value)}>{metricDomains.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="ce-metric-definition-table"><div className="head"><span>指标与研究受众</span><span>正式定义、题号、期次与Base</span><span>可交叉维度</span><span>模型用途</span></div>{visibleMetricDefinitions.slice(0, 60).map((item) => <article key={item.metric_key}><div><b>{item.name}</b>{item.value != null && <strong>{item.value.toFixed(1)}%</strong>}<small>{item.audience ?? "跨项目/未限定"} · {item.domain} · {item.unit}</small></div><p>{item.official_question_text ?? item.definition}<small>题号：{item.question ?? "历史指标映射"}　·　覆盖：{item.wave_count ? `${item.wave_count}期` : item.wave ?? "按来源期次"}　·　Base：{item.base_unweighted ? `N=${item.base_unweighted}` : item.base_range ? `N=${item.base_range.min.toLocaleString()}–${item.base_range.max.toLocaleString()}` : item.denominator}</small><small>来源：{item.source_project ?? "联想历史定量项目资产"}</small></p><div className="tags">{item.cross_tabs.map((value) => <i key={value}>{value}</i>)}</div><em className={item.model_readiness === "tracking_model_ready" || item.model_readiness === "target_ready" ? "verified" : item.model_readiness === "proxy_target_only" ? "required" : "candidate"}>{readinessLabels[item.model_readiness ?? "legacy_definition"] ?? "现有指标定义"}</em></article>)}{visibleMetricDefinitions.length > 60 && <div className="empty">当前筛选共有{visibleMetricDefinitions.length}项，已显示前60项；可继续按受众、指标域或模型可用性缩小范围。</div>}{visibleMetricDefinitions.length === 0 && <div className="empty">当前组合没有已登记指标，请切换受众、指标域或模型可用性。</div>}</div>
          </section>
          <section className="ce-dimension-registry"><header><div><span>CROSS-DIMENSION REGISTRY</span><h2>可交叉维度与当前数据状态</h2></div><strong>{lenovoMetricDictionary.dimensions.length}个维度</strong></header><div>{lenovoMetricDictionary.dimensions.map((item) => <article key={item.dimension}><b>{item.dimension}</b><p>{item.use}</p><small>{item.audiences.join(" · ")}</small><em className={item.status === "verified" ? "verified" : "pending"}>{item.status === "verified" ? "已有数据" : item.status === "partially_verified" ? "部分已有数据" : item.status.includes("verified_for_aipc") ? "AIPC已有 · BHT待映射" : "待完成Raw字段映射"}</em></article>)}</div><footer>{lenovoMetricDictionary.meta.evidence_boundary}</footer></section>
          <article className="ce-platform-data-workbench">
            <header><div><span>DELIVERED PLATFORM DATA · COMPLETE PC LAYER</span><h2>PC聚合数据查询与多维比较</h2><p>直接查询最新累计平台数据表，不再只显示少量摘要。受众、产品域、指标表、指标、品牌和期次共同决定当前证据切片。</p></div><div><strong>{platformPcIndex.meta.counts.observations.toLocaleString()}</strong><span>条交付聚合观测</span></div></header>
            <section className="controls">
              <label><span>研究受众</span><select value={platformAudience} onChange={(event) => { setPlatformAudience(event.target.value); setPlatformResult(null); }}><option>全部受众</option>{platformPcIndex.facets.audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>PC产品域</span><select value={platformProductSpace} onChange={(event) => { setPlatformProductSpace(event.target.value); setPlatformResult(null); }}><option>全部产品域</option>{platformPcIndex.facets.product_spaces.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>平台指标表</span><select value={resolvedPlatformSheet} onChange={(event) => { setPlatformSheet(event.target.value); setPlatformIndicator("全部指标"); setPlatformBrand("全部品牌/指标项"); setPlatformWave("全部期次"); setPlatformResult(null); }}><option>全部指标表</option>{platformSheetOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>指标</span><select value={resolvedPlatformIndicator} onChange={(event) => { setPlatformIndicator(event.target.value); setPlatformResult(null); }}><option>全部指标</option>{platformIndicatorOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>品牌</span><select value={resolvedPlatformBrand} onChange={(event) => { setPlatformBrand(event.target.value); setPlatformResult(null); }}><option>全部品牌/指标项</option>{platformBrandOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>期次</span><select value={resolvedPlatformWave} onChange={(event) => { setPlatformWave(event.target.value); setPlatformResult(null); }}><option>全部期次</option>{platformWaveOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button type="button" onClick={() => { void queryPlatformPc(); }} disabled={platformLoading}>{platformLoading ? "正在查询…" : "生成证据视图"}</button>
            </section>
            {platformError && <div className="error">{platformError}</div>}
            {platformResult ? <>
              <section className="summary"><article><span>匹配观测</span><strong>{platformResult.summary.matched.toLocaleString()}</strong></article><article><span>独立序列</span><strong>{platformResult.summary.series.toLocaleString()}</strong></article><article><span>覆盖期次</span><strong>{platformResult.summary.waves}</strong></article><article><span>Base范围</span><strong>{platformResult.summary.base_min == null ? "—" : `${platformResult.summary.base_min.toLocaleString()}–${platformResult.summary.base_max?.toLocaleString()}`}</strong></article></section>
              <section className="output"><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={platformTrendChartData} margin={{ top: 20, right: 24, bottom: 18, left: -5 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="wave" tick={{ fontSize: 9 }} /><YAxis unit="%" tick={{ fontSize: 9 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Legend />{platformSeries.map((series, index) => <Line key={series} dataKey={series} name={series} stroke={["#2639a5", "#0d9f98", "#d58d2b", "#7357b8", "#3c6b8e", "#a54d55"][index]} strokeWidth={index === 0 ? 3 : 2} dot={{ r: 3 }} connectNulls={false} />)}</LineChart></ResponsiveContainer></div><div className="latest"><div className="head"><span>最新期次</span><span>品牌 / 指标项</span><span>指标</span><span>数值</span><span>Base</span></div>{platformResult.latest.slice(0, 16).map((item) => <div key={item.observation_id}><b>{item.wave}</b><span>{item.brand || item.analysis_item}</span><span>{item.indicator_group || item.analysis_item}</span><strong>{item.value.toFixed(1)}%</strong><em>{item.base_unweighted == null ? "—" : `N=${item.base_unweighted.toLocaleString()}`}</em></div>)}</div></section>
              <footer>{platformResult.boundary}</footer>
            </> : <section className="empty-state"><strong>选择条件后生成证据视图</strong><p>默认可从“大众消费者 × AI PC × 提示后总认知 × 联想 × 全部期次”开始，查看完整趋势、Base和最新指标。</p></section>}
          </article>
          <section className="ce-platform-insights"><header><div><span>EVIDENCE-BACKED OUTPUTS</span><h2>由平台数据直接支持的结论</h2></div><strong>{platformPcIndex.insights.length}条已登记结论</strong></header><div>{platformPcIndex.insights.map((item) => <article key={item.insight_id}><span>{item.audience} · {item.decision}</span><h3>{item.claim}</h3><p>{item.implication}</p><div>{item.evidence.slice(0, 5).map((evidence, index) => <section key={`${item.insight_id}-${index}`}><b>{evidence.wave || evidence.item}</b><strong>{evidence.value.toFixed(1)}%</strong><small>N={evidence.base?.toLocaleString() ?? "—"} · {evidence.source_sheet}</small></section>)}</div><footer>{item.boundary}</footer></article>)}</div></section>
          <article className="ce-aipc-cross-workbench">
            <header><div><span>W2 RAW · CROSS ANALYSIS</span><h2>AIPC指标交叉分析</h2><p>同一图比较总体与当前人群；显示实际Base，Base&lt;{aipcW2Aggregates.meta.minimum_reporting_base}不做差异解释。</p></div><strong>{aipcW2Aggregates.meta.metric_count}组实际聚合指标</strong></header>
            <section className="controls">
              <label><span>指标</span><select value={aipcMetricKey} onChange={(event) => setAipcMetricKey(event.target.value)}>{aipcW2Aggregates.metrics.map((item) => <option key={item.metric_key} value={item.metric_key}>{item.name}</option>)}</select></label>
              <label><span>人群维度</span><select value={aipcCutDimension} onChange={(event) => setAipcCutDimension(event.target.value)}>{aipcW2Aggregates.meta.subgroup_dimensions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>具体人群</span><select value={activeAipcCut?.dimension_value ?? ""} onChange={(event) => setAipcCutValue(event.target.value)}>{aipcCutValues.map((item) => <option key={item}>{item}</option>)}</select></label>
              <article><span>当前Base</span><strong>{activeAipcCut?.base ?? 0}</strong><p>{activeAipcCut && activeAipcCut.base >= aipcW2Aggregates.meta.minimum_reporting_base ? "达到展示门槛" : "样本不足，不解释差异"}</p></article>
            </section>
            <section className="output"><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={aipcCrossRows} layout="vertical" margin={{ top: 8, right: 30, bottom: 12, left: 170 }}><CartesianGrid stroke="#e3e7ed" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="option" width={160} tick={{ fontSize: 9 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Legend /><Bar dataKey="总体" fill="#2439a7" radius={[0, 3, 3, 0]} /><Bar dataKey="当前人群" fill="#17a39b" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div><aside><span>当前读数</span><h3>{activeAipcAggregate.name}</h3><p>总体 Base={activeAipcAggregate.base_unweighted.toLocaleString()} · {activeAipcCut?.dimension_value ?? "—"} Base={activeAipcCut?.base ?? 0}</p>{largestAipcGap && <article><span>差异最大的选项</span><strong>{largestAipcGap.option}</strong><em>{signed(largestAipcGap.difference)} pts</em></article>}<dl><div><dt>题目字段</dt><dd>{activeAipcAggregate.question_fields.join(" + ")}</dd></div><div><dt>分析单位</dt><dd>{activeAipcAggregate.analysis_unit}</dd></div></dl></aside></section>
          </article>
          <article className="ce-aipc-decision-workbench">
            <header><div><span>W2 DECISION OUTPUTS</span><h2>从问卷与模型证据，直接输出客户可用结论</h2><p>先选业务问题，再查看论点、证据、行动与下一期验证；每个数字保留题号、未加权Base和分析单位。</p></div><strong>{aipcDecisionOutputs.meta.wave} · {aipcDecisionOutputs.meta.output_count}个决策问题</strong></header>
            <nav>{aipcDecisionOutputs.outputs.map((item, index) => <button type="button" className={item.decision_id === activeAipcDecision.decision_id ? "active" : ""} onClick={() => setAipcDecisionId(item.decision_id)} key={item.decision_id}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.question}</span></button>)}</nav>
            <section className="answer"><div><span>模型支持的论点</span><h3>{activeAipcDecision.conclusion}</h3><p>{activeAipcDecision.why}</p><article><span>建议动作</span><strong>{activeAipcDecision.action}</strong></article></div><aside><span>下一期如何验证</span><p>{activeAipcDecision.next_validation}</p><small>{aipcDecisionOutputs.meta.outcome_boundary}</small></aside></section>
            <section className="evidence"><div className="head"><span>题号 / 指标</span><span>证据项</span><span>实际值</span><span>未加权Base</span></div>{activeAipcDecision.evidence.map((item) => <div key={`${item.question}-${item.item}`}><b>{item.question}<small>{item.metric}</small></b><span>{item.item}</span><strong>{item.value.toFixed(1)}%</strong><em>N={item.base_unweighted.toLocaleString()}</em></div>)}</section>
            <footer><span>证据层：W2 Raw聚合 + 多变量模型</span><span>论点层：只解释已登记指标与验证边界</span><span>不把关联情景写成因果增量</span></footer>
          </article>
          <section className="ce-real-evidence-grid">
            <article className="ce-panel"><header><div><span>REAL BHT TREND</span><h2>笔记本品牌认知度</h2></div><strong>交付Topline</strong></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={realAwarenessSeries} margin={{ top: 16, right: 24, bottom: 10, left: -8 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="wave" tick={{ fontSize: 9 }} /><YAxis domain={[30, 90]} unit="%" tick={{ fontSize: 9 }} /><Tooltip /><Legend /><Line dataKey="联想" stroke="#2639a5" strokeWidth={3} /><Line dataKey="华为" stroke="#0fa39b" strokeWidth={2} /><Line dataKey="戴尔" stroke="#d9932f" strokeWidth={2} /></LineChart></ResponsiveContainer></div><footer>2024Q2：联想 76% · 华为 65% · 戴尔 51% · Base N=1,197</footer></article>
            <article className="ce-panel"><header><div><span>REAL DEMAND TREND</span><h2>未来12个月笔记本购买意向</h2></div><strong>Q14</strong></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={realIntentSeries} margin={{ top: 16, right: 24, bottom: 10, left: -8 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="wave" tick={{ fontSize: 9 }} /><YAxis domain={[50, 75]} unit="%" tick={{ fontSize: 9 }} /><Tooltip /><Line dataKey="value" name="笔记本购买意向" stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div><footer>69% → 59%；这是购买意向，不是实际购买或销量。</footer></article>
          </section>
          <article className="ce-real-cross-panel">
            <header><div><span>REAL SUBGROUP CROSS ANALYSIS · Q14</span><h2>真实细分：实际购买意向与模型预测</h2><p>{lenovoRealModel.selected_model.holdout_wave}时间留出样本；同一人群同时展示实际值、预测值、偏差与原始样本N。</p></div><label><span>交叉维度</span><select value={realCrossDimension} onChange={(event) => setRealCrossDimension(event.target.value)}>{realCrossDimensions.map((item) => <option key={item}>{item}</option>)}</select></label></header>
            <section><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={realCrossRows} margin={{ top: 18, right: 18, bottom: 18, left: 0 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="segment" tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 9 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Legend /><Bar dataKey="observed" name="实际购买意向" fill="#2639a5" radius={[3, 3, 0, 0]} /><Bar dataKey="predicted" name="模型预测" fill="#19a79f" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="rows"><div className="head"><span>细分</span><span>实际</span><span>预测</span><span>预测偏差</span><span>原始样本</span><span>使用判断</span></div>{realCrossRows.map((item) => <div key={item.segment}><b>{item.segment}</b><strong>{item.observed.toFixed(1)}%</strong><span>{item.predicted.toFixed(1)}%</span><em className={Math.abs(item.gap) <= 5 ? "close" : "wide"}>{signed(item.gap)} pts</em><span>N={item.n.toLocaleString()}</span><i>{item.n < 100 ? "样本不足" : Math.abs(item.gap) > 10 ? "模型偏差较大" : "可用于方向判断"}</i></div>)}</div></section>
            <footer><span>N&lt;100不进入细分排序</span><span>偏差=模型预测−实际意向</span><span>用于定位需补样或需校准的人群，不解释为因果效应</span></footer>
          </article>
          <section className="ce-research-ai">
            <div className="ce-research-ai-intro"><span>RESEARCH AI</span><h2>用自然语言查询已验证证据</h2><p>回答来自指标字典、联想跨期证据和模型登记；关键数字返回题号、研究受众、期次、Base与来源。</p><div>{["大众消费者Q713的AI PC无提示认知趋势？", "SMB Q237的AI PC品牌认知是多少？", "政企Q251的AI PC品牌认知趋势？", "FY25 Q4的Q14为什么不能直接说需求下降？", "目前可以估计PC价格弹性吗？"].map((question) => <button type="button" key={question} onClick={() => setResearchQuery(question)}>{question}</button>)}</div></div>
            <form onSubmit={(event) => { event.preventDefault(); void queryResearchEvidence(); }}><label><span>研究问题</span><textarea value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} rows={4} /></label><button type="submit" disabled={researchLoading}>{researchLoading ? "正在检索证据…" : "检索并回答"}</button><small>回答由本地证据索引检索生成；只使用已登记的题号、Base、聚合值、模型验证和结论边界。</small>{researchError && <em>{researchError}</em>}</form>
            <article className={researchAnswer ? "answered" : ""}>{researchAnswer ? <><span>回答</span><h3>{researchAnswer.title}</h3><p>{researchAnswer.answer}</p>{researchAnswer.evidence && researchAnswer.evidence.length > 0 && <div className="evidence-cards">{researchAnswer.evidence.map((item) => <section key={`${item.label}-${item.source}`}><span>{item.label}</span><strong>{item.value}</strong><small>{item.source}</small></section>)}</div>}<ul>{researchAnswer.points.map((item) => <li key={item}>{item}</li>)}</ul>{researchAnswer.boundary && <blockquote>{researchAnswer.boundary}</blockquote>}<footer>{researchAnswer.sources.map((source) => <i key={source}>{source}</i>)}</footer></> : <><span>等待问题</span><h3>系统会区分事实、模型结果与不能回答的边界。</h3><p>不会把预算题写成价格弹性，也不会把购买意向写成实际销量。</p></>}</article>
          </section>
        </>}

        {tab === "BHT + Social + 行为" && <>
          <section className="ce-question"><span>多源验证目标</span><strong>同一季度的问卷心智、媒体/行为漏斗与Social讨论是否相互印证；若背离，优先识别是触达、议题、产品线还是人群造成的差异。</strong></section>
          <section className="ce-multisource-hero">
            <div><span>BHT + SOCIAL + BEHAVIOR</span><h2>AI PC认知持续上升，但现有媒体行为信号不足以解释全部变化</h2><p>{lenovoMultisourceSignals.claims[0].claim}</p></div>
            <aside><span>当前接入</span><strong>2 / 4 类信号</strong><em>BHT问卷 · 已接</em><em>媒体/行为 · 已接</em><em>Synthesio Social · 待接真实导出</em><em>销售/转化 · 待接客户结果</em></aside>
          </section>
          <section className="ce-signal-source-strip">{lenovoMultisourceSignals.source_status.map((item) => <article className={item.status === "connected" ? "connected" : "pending"} key={item.source}><header><span>{item.source}</span><em>{item.status === "connected" ? "已接入" : "待接入"}</em></header><strong>{item.coverage}</strong><p>{item.answers}</p></article>)}</section>
          <article className="ce-multisource-trend-panel">
            <header><div><span>QUARTERLY SIGNAL ALIGNMENT</span><h3>BHT心智与Campaign行为按季度对齐</h3><p>左轴为AI PC认知，右轴为已监测PC Campaign搜索量；Q4没有PC Campaign记录，按缺失处理。</p></div><strong>中国 · FY25/26 Q1–Q4</strong></header>
            <section><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={lenovoMultisourceSignals.aligned_quarters} margin={{ top: 22, right: 42, bottom: 20, left: 0 }}><CartesianGrid stroke="#e2e6ec" vertical={false} /><XAxis dataKey="wave" tick={{ fontSize: 9 }} /><YAxis yAxisId="mind" domain={[0, 45]} unit="%" tick={{ fontSize: 9 }} /><YAxis yAxisId="behavior" orientation="right" domain={[0, 90]} unit="万" tick={{ fontSize: 9 }} /><Tooltip /><Legend /><Line yAxisId="mind" dataKey="ai_pc_aided_awareness" name="AI PC提示后认知" stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} /><Line yAxisId="mind" dataKey="ai_pc_unaided_awareness" name="AI PC无提示认知" stroke="#13a39b" strokeWidth={2.5} dot={{ r: 4 }} /><Line yAxisId="behavior" dataKey="search_10k" name="Campaign搜索量（万人）" stroke="#d9932f" strokeWidth={2.5} strokeDasharray="6 4" connectNulls={false} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div><div className="quarter-table"><div className="head"><span>季度</span><span>提示后认知</span><span>无提示认知</span><span>Campaign</span><span>搜索量</span><span>Social</span></div>{lenovoMultisourceSignals.aligned_quarters.map((item) => <div key={item.wave}><b>{item.wave}</b><strong>{item.ai_pc_aided_awareness}%</strong><span>{item.ai_pc_unaided_awareness}%</span><span>{item.campaign_count ? `${item.campaign_count}个` : "未监测PC记录"}</span><em>{item.search_10k == null ? "—" : `${item.search_10k.toFixed(2)}万`}</em><i>待接入</i></div>)}</div></section>
            <footer>{lenovoMultisourceSignals.meta.causal_boundary}</footer>
          </article>
          <section className="ce-campaign-signal-grid">
            <article className="ce-campaign-table"><header><div><span>BEHAVIOR FUNNEL</span><h3>已监测PC Campaign行为漏斗</h3></div><strong>真实交付数据</strong></header><div><div className="head"><span>季度 / 产品</span><span>媒介</span><span>曝光</span><span>搜曝转化</span><span>浏览/搜索</span><span>收藏/浏览</span><span>加购/浏览</span></div>{lenovoMultisourceSignals.campaigns.map((item) => <div key={`${item.wave}-${item.product}-${item.media}`}><b>{item.wave}<small>{item.product}</small></b><span>{item.media}</span><strong>{item.exposure_10k.toFixed(2)}万</strong><em>{item.search_rate.toFixed(2)}%</em><span>{item.browse_rate == null ? "—" : `${item.browse_rate.toFixed(2)}%`}</span><span>{item.favorite_rate == null ? "—" : `${item.favorite_rate.toFixed(2)}%`}</span><span>{item.cart_rate == null ? "—" : `${item.cart_rate.toFixed(2)}%`}</span></div>)}</div></article>
            <article className="ce-synthesio-schema"><header><span>SYNTHESIO SOCIAL</span><h3>接入后进入联合判断的指标</h3><p>以下是需要从真实Synthesio查询与导出中取得的字段，不显示模拟数值。</p></header><div>{lenovoMultisourceSignals.social_schema.map((item) => <section key={item.metric}><b>{item.metric}</b><span>{item.grain}</span><p>{item.use}</p></section>)}</div><footer><a href="https://www.ipsos.com/en-sg/ai-enabled-consumer-intelligence-platform" target="_blank" rel="noreferrer">Ipsos Synthesio官方能力说明 ↗</a></footer></article>
          </section>
          <article className="ce-signal-logic-panel">
            <header><div><span>CROSS-SOURCE DECISION LOGIC</span><h3>四种联合信号对应四种动作</h3></div><strong>不以单一来源代替另一来源</strong></header>
            <div><section><b>问卷↑ · Social↑ · 行为↑</b><strong>需求与市场讨论共同增强</strong><p>优先进入产品、价格和人群验证；接销售结果确认商业转化。</p></section><section><b>问卷↑ · Social↑ · 行为弱</b><strong>有兴趣但行动链路受阻</strong><p>检查搜索词、落地页、渠道、价格与产品可得性。</p></section><section><b>问卷平 · Social↑ · 行为↑</b><strong>新议题正在先于Tracking变化</strong><p>把上升主题写入下一期问卷，并增设相关目标人群。</p></section><section><b>问卷↑ · Social缺失 · 行为波动</b><strong>当前PC模块的真实状态</strong><p>不能把认知上升归因于单一Campaign；优先接Synthesio主题、情绪和受众数据。</p></section></div>
          </article>
          <article className="ce-synthesio-upgrade-panel">
            <header><div><span>SYNTHESIO AI UPGRADE</span><h3>从Social Listening资产升级为AI结构化消费者信号</h3><p>保留Synthesio现有采集、清洗、Topic Modeling、Signals、Audience与API能力，把输出统一写入证据库，并与BHT、行为和商业结果共同验证。</p></div><strong>5层升级架构</strong></header>
            <div className="ce-synthesio-upgrade-flow">{lenovoMultisourceSignals.ai_upgrade_layers.map((item) => <section key={item.layer}><span>{item.layer}</span><h4>{item.client_output}</h4><dl><div><dt>现有资产</dt><dd>{item.current_assets}</dd></div><div><dt>AI处理</dt><dd>{item.ai_models.join(" · ")}</dd></div><div><dt>结构化字段</dt><dd>{item.structured_fields.join(" · ")}</dd></div><div><dt>质量门槛</dt><dd>{item.quality_gate}</dd></div></dl><footer>{item.status}</footer></section>)}</div>
          </article>
          <article className="ce-semantic-event-panel">
            <header><div><span>SEMANTIC EVENT SCHEMA</span><h3>每条Social内容转为一个可与问卷联动的语义事件</h3><p>粒度：{lenovoMultisourceSignals.semantic_event_schema.grain}</p></div><strong>不是只保存关键词和情绪</strong></header>
            <div><section><span>来源与时间</span><p>{lenovoMultisourceSignals.semantic_event_schema.identity_fields.join(" · ")}</p></section><section><span>品牌与产品实体</span><p>{lenovoMultisourceSignals.semantic_event_schema.entity_fields.join(" · ")}</p></section><section><span>需求、障碍与场景</span><p>{lenovoMultisourceSignals.semantic_event_schema.meaning_fields.join(" · ")}</p></section><section><span>态度与意图</span><p>{lenovoMultisourceSignals.semantic_event_schema.attitude_fields.join(" · ")}</p></section><section><span>模型质量与人工复核</span><p>{lenovoMultisourceSignals.semantic_event_schema.quality_fields.join(" · ")}</p></section><section><span>证据追溯</span><p>{lenovoMultisourceSignals.semantic_event_schema.evidence_fields.join(" · ")}</p></section></div>
          </article>
        </>}

        {tab === "模型与样本" && <>
          <section className="ce-question"><span>模型输出</span><strong>先回答是否值得投入、优先覆盖谁、产品与价格如何取舍、下一期可能怎样变化；系数、区间与验证结果作为每条结论的证据。</strong></section>
          <section className="ce-model-output-head"><div><span>MODEL DECISION CENTER</span><h2>{categoryMeta.name}决策输出与模型证据</h2><p>当前筛选同步作用于市场预测、人群评分、产品方案与价格情景。默认展示结论，模型结构和诊断可继续下钻。</p></div><strong>{marketMeta.name} · {resolvedDimensionValue} · {wave}</strong></section>
          <section className="ce-model-controls">
            <label><span>结果视图</span><select value={modelView} onChange={(event) => setModelView(event.target.value as ModelView)}><option>决策输出</option><option>全部模型</option><option>市场预测</option><option>产品选择与定价</option><option>人群驱动</option></select></label>
            <label><span>市场对比范围</span><select value={comparisonScope} onChange={(event) => setComparisonScope(event.target.value as ComparisonScope)}><option>全部市场</option><option>中国</option><option>海外</option></select></label>
            <article><span>因变量</span><strong>Top-2-Box</strong><small>未来12个月购买意向</small></article>
            <article><span>当前启用变量</span><strong>{activeSources.length}</strong><small>共 {factorCatalog.length} 个主效应与交互项</small></article>
            <article><span>当前画像预测</span><strong>{activeScore.probability.toFixed(1)}%</strong><small>参考画像 {referenceScore.probability.toFixed(1)}%</small></article>
          </section>
          {category === "pc" && market === "CN" && <article className="ce-projection-readiness">
            <header>
              <div><span>POPULATION WEIGHTING + ABSOLUTE PROJECTION</span><h2>样本能回答到哪一步，大盘人数何时才能发布</h2><p>{populationProjection.meta.decision}</p></div>
              <aside><span>发布门槛</span><strong>{populationProjection.meta.gate_summary.passed} / {populationProjection.meta.gate_summary.total}</strong><em>已通过 · {populationProjection.meta.gate_summary.blocked}项总体口径待补</em></aside>
            </header>
            <section className="ce-projection-target">
              <div><span>本期真实样本</span><strong>N={populationProjection.target_population.sample_n.toLocaleString()}</strong><p>{populationProjection.target_population.age} · {populationProjection.target_population.geography}</p></div>
              <div><span>购买角色</span><strong>{populationProjection.target_population.role}</strong><p>{populationProjection.target_population.pc_status}</p></div>
              <div className="blocked"><span>当前可发布总体人数</span><strong>暂不发布</strong><p>配额构成不等于中国城市人口自然构成，不能使用N×倍数。</p></div>
            </section>
            <section className="ce-projection-gates">
              <div className="head"><span>校准维度</span><span>当前证据</span><span>对结论的影响</span><span>下一步</span><span>状态</span></div>
              {populationProjection.quality_gates.map((item) => <div className={item.status} key={item.gate_id}><b>{item.name}</b><p>{item.evidence}</p><p>{item.effect}</p><p>{item.next_required}</p><strong>{item.status === "passed" ? "已通过" : item.status === "pending" ? "待计算" : "待补总体"}</strong></div>)}
            </section>
            <section className="ce-weighting-method">
              <article><header><span>WEIGHT CALCULATION</span><h3>综合权重如何从Raw生成</h3></header><ol>{populationProjection.weighting_method.steps.map((item) => <li key={item}>{item}</li>)}</ol></article>
              <article><header><span>FORMULAS</span><h3>权重与人数投影不是样本放大</h3></header><div>{populationProjection.weighting_method.formulas.map((item) => <section key={item.name}><span>{item.name}</span><strong>{item.formula}</strong></section>)}</div></article>
              <article><header><span>ONE-MARGIN CHECK</span><h3>性别边际计算路径</h3></header><div className="ce-weight-demo"><section><span>男</span><strong>{populationProjection.gender_calibration_demo.weight_factors[0].weight.toFixed(4)}</strong></section><section><span>女</span><strong>{populationProjection.gender_calibration_demo.weight_factors[1].weight.toFixed(4)}</strong></section><section><span>有效N</span><strong>{populationProjection.gender_calibration_demo.effective_n.toFixed(2)}</strong></section><section><span>95%最大误差</span><strong>±{populationProjection.gender_calibration_demo.maximum_moe_95_points.toFixed(2)} pts</strong></section></div><p>{populationProjection.gender_calibration_demo.boundary}</p></article>
            </section>
            <section className="ce-projection-benchmarks">
              <header><div><span>EXTERNAL CALIBRATION</span><h3>外部权威数据只承担对应的校准角色</h3></div><strong>人口 · 数字可触达 · PC市场单位分开</strong></header>
              <div>{populationProjection.official_benchmarks.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.benchmark_id}><span>{item.dimension} · {item.reference_date}</span><strong>{item.values.map((value) => `${value.category} ${value.value.toLocaleString()}${value.unit === "%" ? "%" : value.unit === "million people" ? "百万人" : value.unit === "million units" ? "百万台" : ""}`).join(" · ")}</strong><p>{item.alignment}</p><em>{item.source} ↗</em></a>)}</div>
            </section>
            <section className="ce-projection-policy"><article><span>现在可以发布</span>{populationProjection.output_policy.publish_now.map((item) => <p key={item}>{item}</p>)}</article><article><span>完整加权后可以发布</span>{populationProjection.output_policy.publish_after_full_weighting.map((item) => <p key={item}>{item}</p>)}</article><article className="blocked"><span>不允许发布</span>{populationProjection.output_policy.blocked.map((item) => <p key={item}>{item}</p>)}</article></section>
          </article>}
          {category === "pc" && market === "CN" && <article className="ce-real-model-panel">
            <header><div><span>REAL RESPONDENT MODEL · Q14</span><h2>联想历史Raw：未来12个月笔记本购买意向模型</h2><p>{lenovoRealModel.meta.outcome_boundary}。前5期训练，{lenovoRealModel.selected_model.holdout_wave} N={lenovoRealModel.sample.test_n.toLocaleString()} 时间留出验证。</p></div><strong>AUC {lenovoRealModel.selected_model.metrics_test.auc.toFixed(4)}</strong></header>
            <section className="ce-real-model-comparison">{lenovoRealModel.comparison.map((item) => <article className={item.model_id === lenovoRealModel.decision.selected_model_id ? "selected" : ""} key={item.model_id}><span>{item.name}</span><strong>{item.metrics.auc.toFixed(4)}</strong><small>AUC</small><dl><div><dt>Brier</dt><dd>{item.metrics.brier.toFixed(4)}</dd></div><div><dt>预测率</dt><dd>{item.metrics.predicted_rate.toFixed(1)}%</dd></div><div><dt>实际率</dt><dd>{item.metrics.observed_rate.toFixed(1)}%</dd></div></dl></article>)}</section>
            <section className="ce-real-model-detail"><div className="ce-real-coefficients"><div className="head"><span>样本外稳定的主要因素</span><b>β与95%区间</b><strong>OR</strong></div>{realModelCoefficients.map((item) => <div className="row" key={`${item.source}-${item.name}`}><span><b>{item.name}</b><small>相对：{item.reference}</small></span><i><u /><em style={{ left: `${realCoefficientPosition(item.ci_low)}%`, width: `${Math.max(1, realCoefficientPosition(item.ci_high) - realCoefficientPosition(item.ci_low))}%` }} /><b style={{ left: `${realCoefficientPosition(item.coefficient)}%` }} /></i><strong>{item.odds_ratio.toFixed(2)}</strong></div>)}</div><div className="ce-real-calibration"><ResponsiveContainer width="100%" height="100%"><LineChart data={lenovoRealModel.selected_model.calibration} margin={{ top: 20, right: 22, bottom: 26, left: 2 }}><CartesianGrid stroke="#e3e7ed" /><XAxis dataKey="predicted" type="number" domain={[40, 85]} unit="%" tick={{ fontSize: 9 }} /><YAxis domain={[40, 85]} unit="%" tick={{ fontSize: 9 }} /><Tooltip /><Line dataKey="predicted" name="理想线" stroke="#7b8495" strokeDasharray="5 5" dot={false} /><Line dataKey="observed" name="实际发生率" stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></section>
            <footer><b>{lenovoRealModel.decision.recommended_use}</b><span>相较沿用上一期，Brier改善 {lenovoRealModel.decision.brier_improvement_vs_prior_wave.toFixed(4)}</span><span>{lenovoRealModel.decision.next_validation}</span></footer>
          </article>}
          {category === "pc" && market === "CN" && <article className="ce-drift-diagnostic">
            <header><div><span>CROSS-PERIOD COMPARABILITY GATE · Q14</span><h2>跨期模型先判断“数据能否比较”，再判断“需求是否变化”</h2><p>{pcQ14Drift.meta.outcome_boundary}。历史滚动表现属于参数调优证据；FY25 Q4必须先通过样本框、配额与权重可比性检查。</p></div><strong>暂不部署预测</strong></header>
            <section className="body">
              <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={q14DriftSeries} margin={{ top: 28, right: 30, bottom: 26, left: 0 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="wave" tick={{ fontSize: 9 }} /><YAxis domain={[45, 75]} unit="%" tick={{ fontSize: 9 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Legend /><ReferenceLine y={pcQ14Drift.historical_frozen_forecast.prediction} stroke="#d9932f" strokeDasharray="5 5" label={{ value: `历史冻结预测 ${pcQ14Drift.historical_frozen_forecast.prediction.toFixed(1)}%`, fill: "#985f14", fontSize: 9 }} /><Line type="monotone" dataKey="historical" name="历史可比Q14" stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} /><Line dataKey="later" name="后一期样本读数" stroke="#d04444" strokeWidth={0} dot={{ r: 6, fill: "#fff", strokeWidth: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer></div>
              <aside><article><span>历史方法表现</span><strong>MAE {pcQ14Drift.backtest.model_mae_points.toFixed(2)} pts</strong><p>上一期直接延用基线为 {pcQ14Drift.backtest.prior_wave_mae_points.toFixed(2)} pts；这里只能说明旧期内部调优表现。</p></article><article className="warning"><span>可比性门槛</span><strong>FY25 Q4 = {pcQ14Drift.later_wave_validation.value.toFixed(1)}%</strong><p>潜在用户配额 N=500，Q14笔记本潜在购买者同样 N={pcQ14Drift.later_wave_validation.positive_n}；不能把 {pcQ14Drift.later_wave_validation.reported_gap_from_historical_prediction.toFixed(1)} pts 直接解释为需求下滑。</p></article></aside>
            </section>
            <section className="decision"><div><span>模型给出的论点</span><strong>{pcQ14Drift.decision.client_answer}</strong></div><div><span>下一步数据处理</span><p>{pcQ14Drift.decision.next_validation}</p></div></section>
            <footer><span>证据：正式问卷样本配额 + FY25 Q4 Raw Q14</span><span>状态：样本框统一前，Q14模型仅用于漂移诊断</span><span>不是销量或实际购买预测</span></footer>
          </article>}
          {(modelView === "决策输出" || modelView === "全部模型") && <section className="ce-decision-output">
            <article className="ce-decision-hero">
              <header><span>当前决策建议</span><strong>{marketDecision}</strong></header>
              <div>
                <h3>{marketMeta.name}{categoryMeta.name}综合机会得分 {opportunityScore.toFixed(1)}/100：需求信号较强，但{failedGates.length ? `${failedGates.join("、")}尚未通过` : "关键门槛均已通过"}；高潜组合是{highPotentialProfile.age}、{highPotentialProfile.income}、{highPotentialProfile.region}。</h3>
                <p>综合判断同时考虑下一期需求、AI准备度、价格可行性、跨期动能、高潜人群强度与模型判别力；单一高预测值不直接转化为投入结论。</p>
              </div>
              <aside><span>综合机会得分</span><strong>{opportunityScore.toFixed(1)}</strong><em>满分 100 · 6项加权</em></aside>
            </article>

            <section className="ce-decision-cards">
              <article><span>01 · 进入与投入</span><h3>{marketDecision}</h3><strong>{opportunityScore.toFixed(1)}/100</strong><p>下一期需求 {forecast?.prediction.toFixed(1) ?? "—"}%；{failedGates.length ? `${failedGates.join("、")}未通过` : "全部门槛通过"}。</p><button type="button" onClick={() => setModelView("市场预测")}>查看市场证据</button></article>
              <article><span>02 · 优先人群</span><h3>{highPotentialProfile.age} · {highPotentialProfile.income}</h3><strong>{highPotentialProfile.probability.toFixed(1)}%</strong><p>{highPotentialProfile.region} · {highPotentialProfile.gender}，较参考画像 {signed(highPotentialProfile.probability - referenceScore.probability)} pts。</p><button type="button" onClick={() => setModelView("人群驱动")}>查看人群证据</button></article>
              <article><span>03 · 产品方案</span><h3>{topChoice.name}</h3><strong>{topChoice.share.toFixed(1)}%</strong><p>三方案中的预测选择份额；当前首要产品特性为“{featureData[0]?.feature ?? categoryMeta.features[0]}”。</p><button type="button" onClick={() => setModelView("产品选择与定价")}>查看方案证据</button></article>
              <article><span>04 · 价格承压</span><h3>参考价上浮15%后</h3><strong>-{premiumAcceptanceLoss.toFixed(1)} pts</strong><p>价格接受率由 {priceAcceptanceAtReference.toFixed(1)}% 降至 {priceAcceptanceAtPremium.toFixed(1)}%，需要分层价格带。</p><button type="button" onClick={() => setModelView("产品选择与定价")}>查看价格证据</button></article>
            </section>

            <article className="ce-opportunity-score-panel">
              <header><div><span>MULTI-INDICATOR OPPORTUNITY SCORE</span><h3>多指标机会判定</h3><p>六项指标共同形成市场优先级；每项均显示标准化得分、权重和加权贡献，避免由单一折线或单一概率做结论。</p></div><strong>{opportunityScore.toFixed(1)} / 100</strong></header>
              <div className="ce-opportunity-components"><div className="head"><span>判断维度</span><span>本期证据</span><span>标准化得分</span><span>权重</span><span>加权贡献</span></div>{opportunityComponents.map((item) => <div key={item.key}><b>{item.label}</b><span>{item.evidence}</span><i><em style={{ width: `${item.score}%` }} /></i><small>{item.weight}%</small><strong>{item.contribution.toFixed(1)}</strong></div>)}</div>
              <footer><span className={demandGatePassed ? "pass" : "fail"}>需求门槛 {demandGatePassed ? "通过" : "未通过"}</span><span className={priceGatePassed ? "pass" : "fail"}>价格门槛 {priceGatePassed ? "通过" : "未通过"}</span><span className={evidenceGatePassed ? "pass" : "fail"}>模型证据门槛 {evidenceGatePassed ? "通过" : "未通过"}</span><p>投入建议须同时参考综合得分与门槛，不以总分替代业务判断。</p></footer>
            </article>

            <article className="ce-decision-table-panel">
              <header><div><span>DECISION ANSWER MATRIX</span><h3>模型本次实际回答的问题</h3></div><strong>{marketMeta.name} · {categoryMeta.name}</strong></header>
              <div className="ce-decision-table">
                <div className="head"><span>业务问题</span><span>模型产出</span><span>数据证据</span><span>可采取的动作</span></div>
                <div><b>未来需求是否值得投入？</b><strong>{marketDecision}</strong><span>综合 {opportunityScore.toFixed(1)}/100；{data.meta.forecast_wave} {forecast?.prediction.toFixed(1) ?? "—"}%；{failedGates.length ? `${failedGates.join("、")}未过` : "关键门槛已过"}</span><p>先解决未通过门槛，再按下一期真实结果校准投入级别。</p></div>
                <div><b>优先覆盖哪类人群？</b><strong>{highPotentialProfile.age}、{highPotentialProfile.income}</strong><span>条件购买概率 {highPotentialProfile.probability.toFixed(1)}%；较参考画像 {signed(highPotentialProfile.probability - referenceScore.probability)} pts</span><p>把样本招募、渠道触达与信息测试优先放在高潜组合。</p></div>
                <div><b>产品方案应突出什么？</b><strong>{featureData[0]?.feature ?? categoryMeta.features[0]}</strong><span>首选特性 {featureData[0]?.share.toFixed(1) ?? "—"}%；{topChoice.name}份额 {topChoice.share.toFixed(1)}%</span><p>围绕首要任务组织功能组合，再用选择实验验证份额变化。</p></div>
                <div><b>价格上移的风险多大？</b><strong>上浮15%损失 {premiumAcceptanceLoss.toFixed(1)} pts 接受率</strong><span>参考价 {priceAcceptanceAtReference.toFixed(1)}% → 115%价格 {priceAcceptanceAtPremium.toFixed(1)}%</span><p>保留主力价格带，并针对低敏感人群测试高配方案。</p></div>
                <div><b>哪个条件最值得优先验证？</b><strong>{strongestScenario.label}</strong><span>{strongestScenario.condition}：预测 {strongestScenario.probability.toFixed(1)}%，变化 {signed(strongestScenario.delta)} pts</span><p>{strongestScenario.action}。</p></div>
                <div><b>结果应如何使用？</b><strong>{modelUseLevel}</strong><span>样本外 AUC {propensityModel.metrics.test_auc.toFixed(3)}；回测 MAE {forecastMae.toFixed(1)} pts</span><p>用于市场、人群与方案优先级；下一期真实结果回流后继续校准。</p></div>
              </div>
            </article>

            <article className="ce-scenario-output-panel">
              <header><div><span>CONDITIONAL SCENARIOS</span><h3>当前画像的条件情景输出</h3><p>每一行只改变一个条件，其余变量保持不变。用于筛选研究假设与目标人群，不解释为单一因素的因果增量。</p></div><strong>基准 {activeScore.probability.toFixed(1)}%</strong></header>
              <div className="ce-scenario-output-table"><div className="head"><span>情景</span><span>条件变化</span><span>预测结果</span><span>相对基准</span><span>业务用法</span></div>{scenarioLevers.map((item) => <div key={item.source}><b>{item.label}</b><span>{item.condition}</span><strong>{item.probability.toFixed(1)}%</strong><em className={item.delta >= 0 ? "positive" : "negative"}>{signed(item.delta)} pts</em><p>{item.action}</p></div>)}</div>
            </article>

            {category === "pc" && market === "CN" && <article className="ce-project-evidence-panel">
              <header><div><span>LENOVO PROJECT EVIDENCE</span><h3>中国 PC / AI PC 项目实证</h3><p>把联想项目平台数据作为市场事实层，与行业预测和购买倾向模型分开呈现、共同支撑判断。</p></div><strong>{lenovoPcData.meta.latest_wave}</strong></header>
              <div className="ce-project-evidence-summary">
                {[consumerEvidence, smbEvidence, enterpriseEvidence].map((audience) => <section key={audience.code}><span>{audience.name}</span><div><strong>{audience.ai_pc.unaided?.value ?? "—"}%</strong><small>AI PC 无提示认知</small></div><div><strong>{audience.ai_pc.aided?.value ?? "—"}%</strong><small>提示后认知</small></div><p>N={audience.ai_pc.aided?.base?.toLocaleString() ?? "—"} · 认知差 {audience.ai_pc.recognition_gap ?? "—"} pts</p></section>)}
                <section className="notebook-equity"><span>联想笔记本品牌基础</span><div><strong>{consumerNotebook.brand_awareness?.value ?? "—"}%</strong><small>品牌认知度</small></div><div><strong>{consumerNotebook.reputation?.value ?? "—"}%</strong><small>品牌美誉度</small></div><p>大众笔记本用户 N={consumerNotebook.brand_awareness?.base?.toLocaleString() ?? "—"}</p></section>
              </div>
              <div className="ce-project-evidence-charts">
                <section><div className="chart-head"><span>AI PC 提示后认知跨期变化</span><b>大众 / SMB / 政企</b></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={lenovoAiPcTrend} margin={{ top: 18, right: 18, bottom: 8, left: -8 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="wave" tickLine={false} tick={{ fontSize: 8 }} /><YAxis domain={[0, 50]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} /><Tooltip /><Legend /><Line type="monotone" dataKey="consumer" name="大众消费者" stroke="#2639a5" strokeWidth={2.4} dot={false} /><Line type="monotone" dataKey="smb" name="SMB" stroke="#0f9f98" strokeWidth={2.4} dot={false} /><Line type="monotone" dataKey="enterprise" name="政企大客户" stroke="#d9932f" strokeWidth={2.4} dot={false} /></LineChart></ResponsiveContainer></div></section>
                <section><div className="chart-head"><span>政企商用笔记本选型考虑因素</span><b>N={lenovoPcData.enterprise_selection_factors.base.toLocaleString()}</b></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={enterpriseSelectionFactors} layout="vertical" margin={{ top: 6, right: 24, bottom: 4, left: 44 }}><CartesianGrid stroke="#e3e7ed" horizontal={false} /><XAxis type="number" domain={[0, 70]} hide /><YAxis type="category" dataKey="indicator" width={135} tickLine={false} axisLine={false} tick={{ fontSize: 8 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} /><Bar dataKey="value" name="选择比例" fill="#2639a5" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></section>
              </div>
              <div className="ce-project-evidence-conclusion"><span>项目数据支持的论点</span><strong>联想在传统笔记本上的品牌基础很强，但 AI PC 的自发认知仍明显低于提示后认知；企业产品表达应首先证明品质稳定性、配置参数与业务适配，而不是只强调“AI”。</strong><p>证据：联想笔记本品牌认知 97%、品牌美誉 45%；AI PC 无提示/提示后认知为大众 23%/36%、SMB 22%/40%、政企 28%/42%；政企前三项产品因素为品质稳定性 63%、配置参数 54%、品牌知名度 45%。</p></div>
              <footer><span>来源：{lenovoPcData.meta.study}平台数据表</span><span>{lenovoPcData.meta.latest_wave} · 中国</span><span>项目事实、行业预测与情景推演分别标注</span></footer>
            </article>}

            {category === "pc" && market === "CN" && <article className="ce-external-check-panel">
              <header><div><span>EXTERNAL BENCHMARK CHECK</span><h3>外部权威信息校验</h3><p>只有地区、时期、总体、单位和定义可对齐时才做数值校准；其余信息只用于解释背景或限定总体边界。</p></div><strong>更新至 {externalCalibration.as_of}</strong></header>
              <div className="ce-external-check-table"><div className="head"><span>校验问题</span><span>一手数据 / 模型</span><span>外部权威参照</span><span>校验结论</span><span>允许用途</span></div>{externalChecks.map((item) => <div key={item.question}><b>{item.question}</b><span>{item.internal}</span><span>{item.external}<a href={item.source.url} target="_blank" rel="noreferrer">{item.source.publisher} ↗</a></span><strong>{item.verdict}</strong><p>{item.role}</p></div>)}</div>
            </article>}

            <article className="ce-validation-gates-panel">
              <header><div><span>END-TO-END VALIDATION GATES</span><h3>产品机会验证关卡</h3><p>把市场研究、模型和真实结果放在一条验证链上。当前结论不是“模型分数高就上市”，而是明确下一步该验证什么。</p></div><strong>{marketDecision}</strong></header>
              <div className="ce-validation-gates">{validationStages.map((stage) => <section className={stage.tone} key={stage.code}><div><span>{stage.code}</span><em>{stage.status}</em></div><h4>{stage.name}</h4><strong>{stage.result}</strong><p>{stage.evidence}</p></section>)}</div>
              <footer><span>当前可执行动作</span><strong>{failedGates.length ? `先补足${failedGates.join("、")}，并完成真实选择实验；通过后再进入规模验证。` : "关键研究门槛已通过；接入真实商业结果，校准销量与成功概率。"}</strong></footer>
            </article>
          </section>}

          {modelView !== "决策输出" && <section className="ce-model-kpi-strip">
            <article><span>样本外 AUC</span><strong>{propensityModel.metrics.test_auc.toFixed(3)}</strong><small>按后2期时间留出验证</small></article>
            <article><span>有效训练样本</span><strong>N={propensityModel.effective_train_n.toLocaleString()}</strong><small>原始 N={propensityModel.train_n.toLocaleString()} · 权重 {propensityModel.weight_range[0]}–{propensityModel.weight_range[1]}</small></article>
            <article><span>模型相对参考画像</span><strong>{signed(activeScore.probability - referenceScore.probability)} pts</strong><small>所有未启用变量固定在均值或参考组</small></article>
            <article><span>下一期市场预测</span><strong>{forecast?.prediction.toFixed(1) ?? "—"}%</strong><small>{forecast?.low.toFixed(1)}%–{forecast?.high.toFixed(1)}% · MAE {forecastMae.toFixed(1)} pts</small></article>
          </section>}
          <section className="ce-advanced-model-grid">
            {(modelView === "全部模型" || modelView === "人群驱动") && <article className="ce-model-studio ce-advanced-panel wide">
              <header><div><span>01 · MODEL SPECIFICATION + LIVE SCORING</span><h3>变量选择与多条件画像预测</h3><p>勾选决定哪些因素进入评分；右侧同时设置人口属性、设备状态、态度和偏好。预测值直接由当前市场与品类的拟合截距和系数计算。</p></div><strong>{propensityData.meta.model}</strong></header>
              <div className="ce-model-studio-layout">
                <aside className="ce-factor-selector">
                  <div className="title"><span>模型变量</span><b>{activeSources.length}/{factorCatalog.length} 已启用</b></div>
                  {factorGroups.map((group) => { const groupSources = factorCatalog.filter((item) => item.group === group); const checked = groupSources.every((item) => activeSourceSet.has(item.source)); return <section key={group}><div><label><input type="checkbox" checked={checked} onChange={(event) => setGroupSources(group, event.target.checked)} /><b>{group}</b></label><span>{groupSources.reduce((sum, item) => sum + item.importance, 0).toFixed(1)}% 影响权重</span></div>{groupSources.map((factor) => <label className={activeSourceSet.has(factor.source) ? "active" : ""} key={factor.source}><input type="checkbox" checked={activeSourceSet.has(factor.source)} onChange={() => toggleSource(factor.source)} /><span><b>{factor.label}</b><small>{factor.significant ? "区间不跨0" : "区间跨0"}</small></span><em>{factor.importance.toFixed(1)}%</em></label>)}</section>; })}
                </aside>
                <div className="ce-profile-builder">
                  <div className="ce-profile-head"><div><span>当前消费者画像</span><b>{marketMeta.name} · {categoryMeta.name}</b></div><button type="button" onClick={() => setModelProfile({ ...propensityModel.default_profile, wave_id: data.waves.indexOf(wave) + 1 })}>恢复样本基准</button></div>
                  <div className="ce-profile-fields">
                    {[
                      ["age_group", "年龄"], ["gender", "性别"], ["income_group", "收入"], ["region_group", "地区"], ["feature_priority", "首选产品特性"], ["purchase_channel", "购买渠道"],
                    ].map(([source, label]) => <label key={source}><span>{label}</span><select value={String(modelProfile[source])} onChange={(event) => updateProfile(source, event.target.value)}>{(propensityModel.profile_options[source] ?? []).map((option) => <option key={option}>{option}</option>)}</select></label>)}
                    <label><span>设备状态</span><select value={Number(modelProfile.owns_device)} onChange={(event) => updateProfile("owns_device", Number(event.target.value))}><option value={1}>已拥有</option><option value={0}>未拥有</option></select></label>
                    <label><span>可接受价格</span><input type="number" step={100} value={Math.round(Number(modelProfile.acceptable_price))} onChange={(event) => updateProfile("acceptable_price", Number(event.target.value))} /></label>
                  </div>
                  <div className="ce-profile-sliders">
                    {[
                      ["replacement_urgency", "换机紧迫度", 1, 5, 1],
                      ["ai_interest", "品类AI兴趣", 1, 5, 1],
                      ["ai_attitude", "总体AI态度", 1, 5, 1],
                      ["innovation_orientation", "创新倾向", 1, 5, 1],
                      ["privacy_concern", "隐私顾虑", 1, 5, 1],
                      ["price_sensitivity", "价格敏感度", 18, 92, 1],
                    ].map(([source, label, min, max, step]) => <label key={String(source)}><span>{label}<b>{Number(modelProfile[String(source)]).toFixed(0)}</b></span><input type="range" min={Number(min)} max={Number(max)} step={Number(step)} value={Number(modelProfile[String(source)])} onChange={(event) => updateProfile(String(source), Number(event.target.value))} /></label>)}
                  </div>
                  <div className="ce-live-score"><div><span>模型预测购买概率</span><strong>{activeScore.probability.toFixed(1)}%</strong><em className={activeScore.probability >= referenceScore.probability ? "up" : "down"}>{signed(activeScore.probability - referenceScore.probability)} pts</em></div><p>截距 β₀={propensityModel.intercept.toFixed(2)}；当前启用变量的线性贡献合计为 {(activeScore.logit - propensityModel.intercept).toFixed(2)}。这是购买倾向模型的条件概率，不等同于市场销量。</p></div>
                </div>
              </div>
              <footer><span>{propensityModel.weighting}</span><span>有效样本 N={propensityModel.effective_train_n.toLocaleString()}</span><span>交互项可以单独纳入或排除</span></footer>
            </article>}

            {(modelView === "全部模型" || modelView === "人群驱动") && <article className="ce-advanced-panel wide">
              <header><div><span>02 · CONDITIONAL EFFECTS</span><h3>当前画像的因素贡献与二维交叉预测</h3><p>左侧解释当前预测由哪些变量推高或压低；右侧让两个维度同时变化，其他变量保持当前选择，从而识别人群组合而不是单一标签。</p></div><strong>预测 {activeScore.probability.toFixed(1)}%</strong></header>
              <div className="ce-conditional-layout">
                <div className="ce-contribution-chart"><div className="head"><span>当前取值产生的贡献</span><b>降低购买概率</b><i>提高购买概率</i></div>{contributionRows.map((row) => { const ratio = Math.abs(row.value) / contributionDomain * 50; const positive = row.value >= 0; return <div className="row" key={`${row.item.source}-${row.item.name}`}><span><b>{row.item.name}</b><small>{factorLabels[row.item.source] ?? row.item.group}</small></span><i><u /><em className={positive ? "positive" : "negative"} style={{ left: `${positive ? 50 : 50 - ratio}%`, width: `${ratio}%` }} /></i><strong className={positive ? "positive" : "negative"}>{row.value > 0 ? "+" : ""}{row.value.toFixed(2)} β</strong></div>; })}</div>
                <div className="ce-cross-predictor"><div className="controls"><label><span>横轴</span><select value={crossXAxis} onChange={(event) => setCrossXAxis(event.target.value)}>{crossDimensions.filter((item) => item.key !== crossYAxis).map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label><label><span>纵轴</span><select value={crossYAxis} onChange={(event) => setCrossYAxis(event.target.value)}>{crossDimensions.filter((item) => item.key !== crossXAxis).map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label></div><div className="ce-cross-grid" style={{ gridTemplateColumns: `92px repeat(${xDimension.values.length}, minmax(64px, 1fr))` }}><span /><div className="axis-title" style={{ gridColumn: `2 / span ${xDimension.values.length}` }}>{xDimension.label}</div><span /><>{xDimension.values.map((value) => <b key={String(value)}>{String(value)}</b>)}</>{crossMatrix.map((row) => <div className="matrix-row" key={String(row.yValue)}><strong>{String(row.yValue)}</strong>{row.cells.map((cell) => { const opacity = 0.12 + cell.probability / 100 * 0.82; return <button type="button" key={String(cell.xValue)} title={`${yDimension.label} ${row.yValue} × ${xDimension.label} ${cell.xValue}`} style={{ backgroundColor: `rgba(31,55,158,${opacity})`, color: opacity > .58 ? "#fff" : "#172052" }} onClick={() => setModelProfile((profile) => ({ ...profile, [crossXAxis]: cell.xValue, [crossYAxis]: row.yValue }))}><b>{cell.probability.toFixed(1)}%</b></button>; })}</div>)}</div><p>每个单元格均重新计算全部已启用主效应和交互项；点击单元格可将组合回填到消费者画像。</p></div>
              </div>
              <footer><span>贡献单位为 log-odds 系数 β</span><span>深色代表更高的条件购买概率</span><span>未选变量固定在训练样本均值或参考组</span></footer>
            </article>}

            {(modelView === "全部模型" || modelView === "市场预测") && <article className="ce-advanced-panel wide">
              <header><div><span>03 · HIERARCHICAL BAYESIAN FORECAST</span><h3>各市场 AI 兴趣 × 下一期购买预测</h3><p>横轴为 AI 兴趣，纵轴为下一期购买意向，气泡大小代表每期样本量；虚线为当前对比范围均值。</p></div><strong>{comparisonScope} · {categoryMeta.name}</strong></header>
              <div className="ce-market-model-layout">
                <div className="ce-scatter-chart"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 28, right: 32, bottom: 28, left: 4 }}><CartesianGrid stroke="#e3e7ed" /><XAxis type="number" dataKey="aiInterest" name="AI兴趣" unit="%" domain={[60, 95]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="forecast" name="下一期购买预测" unit="%" domain={[60, 90]} tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="sample" range={[160, 620]} /><ReferenceLine x={averageAiInterest} stroke="#7b8495" strokeDasharray="4 4" /><ReferenceLine y={averageForecast} stroke="#7b8495" strokeDasharray="4 4" /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter name="市场" data={marketModelLandscape} fill="#2639a5" label={{ dataKey: "market", position: "top", fill: "#172052", fontSize: 10 }}>{marketModelLandscape.map((item) => <Cell key={item.code} fill={item.code === market ? "#d9932f" : "#2639a5"} />)}</Scatter></ScatterChart></ResponsiveContainer></div>
                <div className="ce-market-intervals"><div className="scale"><span>50%</span><span>72.5%</span><span>95%</span></div>{marketModelLandscape.map((item) => <button type="button" className={item.code === market ? "active" : ""} key={item.code} onClick={() => { setScope(item.code === "CN" ? "中国" : "海外"); setMarket(item.code); }}><span><b>{item.market}</b><small>N={item.sample.toLocaleString()}</small></span><i><em style={{ left: `${intervalPosition(item.low)}%`, width: `${Math.max(1, intervalPosition(item.high) - intervalPosition(item.low))}%` }} /><u style={{ left: `${intervalPosition(item.currentIntent)}%` }} /><strong style={{ left: `${intervalPosition(item.forecast)}%` }} /></i><span><b>{item.forecast.toFixed(1)}%</b><small>{item.low.toFixed(1)}–{item.high.toFixed(1)}</small></span></button>)}</div>
              </div>
              <footer><span>当前选择：{marketMeta.name}</span><span>橙色点为当前市场</span><span>区间图中方块=预测，细线=本期</span></footer>
            </article>}

            {(modelView === "全部模型" || modelView === "产品选择与定价") && <article className="ce-advanced-panel wide">
              <header><div><span>04 · CHOICE + PRICE RESPONSE</span><h3>价格 × 特性匹配度响应面与方案选择空间</h3><p>点击左侧任一组合可更新当前方案；右侧同时展示三种方案在价格、特性和预测份额上的位置。</p></div><strong>当前方案 {scenarioProbability.toFixed(1)}%</strong></header>
              <div className="ce-choice-model-layout">
                <div className="ce-response-surface"><div className="ce-surface-title"><span>特性匹配度 ↓</span><b>价格指数 →</b></div><div className="ce-surface-grid"><span />{responsePrices.map((item) => <strong key={item}>{item}%</strong>)}{responseSurface.map((row) => <div className="ce-surface-row" key={row[0].fit}><strong>{row[0].fit}</strong>{row.map((cell) => { const active = cell.price === priceIndex && cell.fit === featureFit; const opacity = 0.12 + (cell.probability / 100) * 0.78; return <button type="button" aria-label={`价格${cell.price}%，特性${cell.fit}，预测购买概率${cell.probability.toFixed(1)}%`} className={active ? "active" : ""} style={{ backgroundColor: `rgba(38,57,165,${opacity})`, color: opacity > .55 ? "#fff" : "#172052" }} key={cell.price} onClick={() => { setPriceIndex(cell.price); setFeatureFit(cell.fit); }}><b>{cell.probability.toFixed(1)}%</b></button>; })}</div>)}</div><p>单元格为预测购买概率；边框标记当前组合。参考价格接受率 {priceAcceptance.toFixed(1)}%。</p></div>
                <div className="ce-choice-scatter"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 32, right: 34, bottom: 28, left: 4 }}><CartesianGrid stroke="#e3e7ed" /><XAxis type="number" dataKey="price" name="价格指数" unit="%" domain={[65, 135]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="fit" name="特性匹配度" domain={[30, 105]} tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="bubble" range={[220, 780]} /><ReferenceLine x={100} stroke="#7b8495" strokeDasharray="4 4" /><ReferenceLine y={70} stroke="#7b8495" strokeDasharray="4 4" /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Legend verticalAlign="top" /><Scatter name="三种PC方案" data={choicePlotData} fill="#2639a5" label={{ dataKey: "name", position: "top", fill: "#172052", fontSize: 10 }} /><Scatter name="当前模拟方案" data={[{ name: "当前", price: priceIndex, fit: featureFit, bubble: scenarioProbability * 10 }]} fill="#d9932f" /></ScatterChart></ResponsiveContainer></div>
              </div>
              <footer><span>气泡大小=预测选择份额</span><span>基准线=100%价格 / 70特性</span><span>当前可接受价格 {current ? compactPrice(current.acceptable_price, market) : "—"}</span></footer>
            </article>}

            {(modelView === "全部模型" || modelView === "人群驱动") && <article className="ce-advanced-panel wide">
              <header><div><span>05 · FITTED PROPENSITY MODEL</span><h3>购买倾向模型系数与样本外验证</h3><p>目标变量为未来12个月购买意向 Top-2-Box；前6期训练、后2期时间留出验证。系数区间与边际影响来自当前国家和品类的实际拟合结果。</p></div><label><span>变量组</span><select value={coefficientGroup} onChange={(event) => setCoefficientGroup(event.target.value)}>{coefficientGroups.map((item) => <option key={item}>{item}</option>)}</select></label></header>
              <div className="ce-coefficient-layout">
                <div className="ce-coefficient-forest"><div className="head"><span>变量 / 对比口径</span><b>标准化系数与95%区间</b><strong>边际影响</strong></div>{visibleCoefficients.map((item) => <div className="row" key={`${item.source}-${item.name}`}><span><b>{item.name}</b><small>{item.reference ? `相对：${item.reference}` : item.kind === "numeric" ? "每增加1个标准差" : item.group}</small></span><i><u /><em style={{ left: `${coefficientPosition(item.ci_low)}%`, width: `${Math.max(1, coefficientPosition(item.ci_high) - coefficientPosition(item.ci_low))}%` }} /><b style={{ left: `${coefficientPosition(item.coefficient)}%` }} /></i><strong className={item.impact_pp >= 0 ? "positive" : "negative"}>{signed(item.impact_pp)} pts<small>β {item.coefficient > 0 ? "+" : ""}{item.coefficient.toFixed(2)} · OR {item.odds_ratio.toFixed(2)}</small></strong></div>)}</div>
                <div className="ce-model-validation"><div className="metrics"><article><span>样本外 AUC</span><strong>{propensityModel.metrics.test_auc.toFixed(3)}</strong><small>训练 AUC {propensityModel.metrics.train_auc.toFixed(3)}</small></article><article><span>Brier Score</span><strong>{propensityModel.metrics.brier.toFixed(3)}</strong><small>越低越好</small></article><article><span>准确率</span><strong>{(propensityModel.metrics.accuracy * 100).toFixed(1)}%</strong><small>测试期事件率 {propensityModel.event_rate.toFixed(1)}%</small></article></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={propensityModel.calibration} margin={{ top: 14, right: 18, bottom: 24, left: -2 }}><CartesianGrid stroke="#e3e7ed" /><XAxis type="number" dataKey="predicted" name="预测概率" unit="%" domain={[0, 100]} tick={{ fontSize: 9 }} /><YAxis type="number" name="实际发生率" unit="%" domain={[0, 100]} tick={{ fontSize: 9 }} /><Tooltip /><Line type="linear" dataKey="ideal" name="理想校准线" stroke="#7b8495" strokeDasharray="5 5" dot={false} /><Line type="monotone" dataKey="observed" name="实际发生率" stroke="#2639a5" strokeWidth={3} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div><p>校准图：横轴为模型预测概率，纵轴为测试期实际发生率；越接近虚线，概率预测越可信。</p></div>
              </div>
              <footer><span>{propensityData.meta.model}</span><span>训练 N={propensityModel.train_n.toLocaleString()} · 验证 N={propensityModel.test_n.toLocaleString()}</span><span>{propensityData.meta.coefficient_note}</span></footer>
            </article>}

            {(modelView === "全部模型" || modelView === "人群驱动") && <article className="ce-advanced-panel wide">
              <header><div><span>06 · CONSUMER PROPENSITY MATRIX</span><h3>人群变量影响矩阵</h3><p>同一人群同时比较购买意向、AI兴趣、AI加价接受、价格敏感度和综合需求得分；点击人群名称可回填全局筛选。</p></div><strong>{dimension === "全部人群" ? "全部人群维度" : dimension} · Top {modelSegmentRows.length}</strong></header>
              <div className="ce-driver-matrix"><div className="head"><span>人群</span>{driverColumns.map((column) => <b key={column.key}>{column.label}</b>)}</div>{modelSegmentRows.map((row) => <div className={row.dimension === dimension && row.dimension_value === dimensionValue ? "active" : ""} key={`${row.dimension}-${row.dimension_value}`}><button type="button" onClick={() => { setDimension(row.dimension); setDimensionValue(row.dimension_value); }}><b>{row.dimension_value}</b><small>{row.dimension} · N={row.n}</small></button>{driverColumns.map((column) => { const value = row[column.key]; const opacity = 0.10 + (value / 100) * 0.78; return <span title={`${row.dimension_value} · ${column.label} ${value.toFixed(1)}`} style={{ backgroundColor: `rgba(15,139,132,${opacity})`, color: opacity > .55 ? "#fff" : "#172052" }} key={column.key}>{value.toFixed(1)}</span>; })}</div>)}</div>
              <footer><span>颜色深浅代表指标高低</span><span>同一行均为同一人群与同一期次</span><span>筛选后预测、价格与选择模型同步更新</span></footer>
            </article>}
          </section>
          <section className="ce-sample-plan">
            <article className="primary"><span>通过首轮验证后的目标方案</span><strong>N=10,000</strong><h2>连续24个月，共8期</h2><p>目标样本结构：中国 N=4,000；美国与巴西各 N=1,000；英国、德国、日本、印度尼西亚、沙特各 N=800。实际扩样以首轮模型误差和客户使用结果为准。</p></article>
            <article><b>第1期</b><h3>行业大盘与人群基线</h3><p>可交付品类拥有、购买意向、AI态度、价格接受与人群细分。</p></article>
            <article><b>第3期</b><h3>首次跨期预测</h3><p>形成季度变化率、简单留出回测与下一期方向预测。</p></article>
            <article><b>第6期起</b><h3>分层动态模型</h3><p>国家、品类与人群共享信息，输出预测区间与持续误差验证。</p></article>
          </section>
          <section className="ce-model-grid">
            <article><span>01 · 市场进入</span><h3>分层贝叶斯追踪与预测</h3><dl><div><dt>输入</dt><dd>国家 × 品类 × 人群 × 季度 KPI</dd></div><div><dt>输出</dt><dd>下一期购买意向、区间、机会与风险市场</dd></div></dl></article>
            <article><span>02 · 产品配置</span><h3>离散选择 / Conjoint</h3><dl><div><dt>输入</dt><dd>价格、特性组合、品牌与选择任务</dd></div><div><dt>输出</dt><dd>特性效用、方案份额与配置取舍</dd></div></dl></article>
            <article><span>03 · 定价</span><h3>价格接受与弹性模型</h3><dl><div><dt>输入</dt><dd>可接受价格、购买选择与收入分层</dd></div><div><dt>输出</dt><dd>价格区间、接受曲线与人群差异</dd></div></dl></article>
            <article><span>04 · 目标人群</span><h3>消费者购买倾向模型</h3><dl><div><dt>输入</dt><dd>年龄、性别、地区、收入、设备与态度</dd></div><div><dt>输出</dt><dd>高潜人群、购买概率与关键驱动</dd></div></dl></article>
          </section>
          <section className="ce-source-panel"><header><div><span>EXTERNAL CALIBRATION</span><h2>外部权威数据只用于口径校准与双重核对</h2></div><strong>一手问卷仍是消费者态度与选择模型的主数据</strong></header><div>{data.source_register.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.name}><b>{source.name}</b><span>{source.role}</span><em>查看来源 →</em></a>)}</div></section>
        </>}

        {tab === "产品验证" && <>
          <section className="ce-question"><span>验证对象</span><strong>这套持续投入样本、连接历史项目和模型的数码3C数据服务，是否能比公开报告更快、更细地支持SMB做市场、人群、配置与价格决策？</strong></section>
          <section className="ce-product-validation-hero">
            <div><span>当前阶段结论</span><h2>先用 PC / AI PC 跑通单品类验证，不立即扩展到全部数码3C与固定 N=10,000。</h2><p>现有联想项目足以证明一手研究资产可以形成事实层，原型也已能联动市场、人群、功能、价格和模型；但数据产品是否可售，仍需由真实SMB任务、跨期结果回放和第二期续用共同验证。</p></div>
            <aside><span>首轮范围</span><strong>1个深度品类</strong><em>中国 + 1–2个海外市场</em><em>10–15家SMB问题访谈</em><em>3–5个真实决策任务</em></aside>
          </section>
          <article className="ce-service-validation-panel">
            <header><div><span>DATA PRODUCT VALIDATION</span><h3>数据产品九项验证</h3><p>每一项都定义已有证据、当前状态和通过标准；通过后才决定扩国家、扩品类或增加季度样本。</p></div><strong>PC / AI PC 先行</strong></header>
            <div className="ce-service-validation-table"><div className="head"><span>验证项</span><span>当前状态</span><span>已有证据 / 下一步实测</span><span>通过标准</span></div>{serviceValidationStages.map((stage) => <div key={stage.name}><b>{stage.name}</b><em className={stage.tone}>{stage.status}</em><p>{stage.evidence}</p><strong>{stage.pass}</strong></div>)}</div>
          </article>
          <article className="ce-product-benchmark-panel">
            <header><div><span>OFFICIAL PRODUCT BENCHMARK</span><h3>成熟消费者数据产品对照</h3><p>对照只用于确定必须具备的分析机制与验证动作，不把外部公司的覆盖规模写成本产品现有能力。</p></div><strong>官方产品资料</strong></header>
            <div><div className="head"><span>能力</span><span>成熟产品做法</span><span>当前真实进度</span><span>下一验证动作</span></div>{productBenchmarkRows.map((item) => <div key={item.capability}><b>{item.capability}</b><p>{item.benchmark}<a href={item.source} target="_blank" rel="noreferrer">官方来源 ↗</a></p><strong>{item.current}</strong><span>{item.gap}</span></div>)}</div>
          </article>
          <article className="ce-release-center">
            <header><div><span>DATA RELEASE & VERSION</span><h3>PC / AI PC 数据版本与更新中心</h3><p>每次发布明确显示新增数据、样本与模型变化；只有通过相应质量门槛的结果才能进入客户结论与预测。</p></div><strong>{pcDataRelease.release.version}</strong></header>
            <section className="summary"><article><span>真实数据集</span><strong>{pcDataRelease.release.datasets}</strong></article><article><span>指标定义</span><strong>{pcDataRelease.release.metric_definitions}</strong></article><article><span>AIPC聚合观测</span><strong>{pcDataRelease.release.aipc_aggregate_observations.toLocaleString()}</strong></article><article><span>决策输出</span><strong>{pcDataRelease.release.decision_outputs}</strong></article></section>
            <section className="datasets"><div className="head"><span>数据集 / 期次</span><span>样本与覆盖</span><span>跨期可比性</span><span>模型使用状态</span></div>{pcDataRelease.datasets.map((item) => <div key={item.dataset_id}><b>{item.official_name}<small>{item.wave} · N={item.sample_n.toLocaleString()} · {item.status}</small></b><p>{item.coverage}</p><span>{item.comparability}</span><strong>{item.model_status}</strong></div>)}</section>
            <section className="gates"><header><span>当前版本质量门槛</span><strong>{pcDataRelease.quality_gates.filter((item) => item.status === "通过").length}/{pcDataRelease.quality_gates.length}完全通过</strong></header><div>{pcDataRelease.quality_gates.map((item) => <article className={item.status === "通过" ? "pass" : item.status.includes("阻断") || item.status === "未接入" ? "blocked" : "limited"} key={item.gate}><span>{item.status}</span><h4>{item.gate}</h4><p>{item.evidence}</p><strong>{item.effect}</strong></article>)}</div></section>
            <section className="next"><header><span>下一版本必须补齐</span><strong>先P0，后扩国家与品类</strong></header><div>{pcDataRelease.next_release_requirements.map((item) => <article key={item.requirement}><b>{item.priority}</b><strong>{item.requirement}</strong><p>{item.unlock}</p></article>)}</div></section>
            <footer>{pcDataRelease.release.changes.map((item) => <span key={item}>{item}</span>)}</footer>
          </article>
          <section className="ce-pilot-design">
            <header><span>FIRST COMMERCIAL PILOT</span><h3>首轮验证设计</h3></header>
            <article><span>01 · 历史回放 · 不新增样本</span><h4>先用 N=25,951 验证数据链路</h4><p>统一问卷题号、Raw字段、Table指标、Base、期次和模型版本；复算关键KPI，并用2024Q2时间留出检查预测和人群偏差。</p></article>
            <article><span>02 · 中国PC验证波 · N=2,000</span><h4>补齐核心追踪与权重</h4><p>总体比例最保守误差约±2.2 pts；关键细分尽量保证N≥300。配额覆盖年龄、性别、地区，收入用于分析与加权审计。</p></article>
            <article><span>03 · 独立选择实验</span><h4>实测配置与价格，而非模拟弹性</h4><p>围绕真实PC方案设置品牌、处理器/算力、AI功能、续航、重量、服务与价格选择任务；样本量在设计确定后按水平数和任务数计算。</p></article>
            <article><span>04 · 6个月决策门槛</span><h4>两期通过后再扩市场</h4><p>连续两期模型优于基线、加权结果稳定、至少3类SMB任务可复用且出现续用信号，再扩美国/英国等海外市场与其他3C品类。</p></article>
          </section>
        </>}
      </section>
    </main>
  );
}
