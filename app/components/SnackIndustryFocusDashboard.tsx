"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer as RechartsResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import authoritativePublicJson from "../../input/packaged-food-beverage/authoritative-public-data-20260812.json";
import chinaQuestionnaireJson from "../../output/packaged-food-beverage/china-snack-questionnaire-template.json";
import completeQuestionnaireJson from "../../output/packaged-food-beverage/complete-snack-questionnaire-template.json";
import questionnaireTranslationsJson from "../../output/packaged-food-beverage/snack-questionnaire-translations.json";
import questionnaireProgrammingJson from "../../output/packaged-food-beverage/snack-questionnaire-programming-model.json";
import chinaSurveyJson from "../../output/packaged-food-beverage/china-snack-kpi-system.json";
import foodJson from "../../output/packaged-food-beverage/dashboard-data.json";
import globalMarketJson from "../../output/packaged-food-beverage/global-snack-market-atlas.json";
import globalProductPilotJson from "../../output/packaged-food-beverage/global-product-attribute-pilot.json";
import publicRetailJson from "../../output/packaged-food-beverage/public-retail-observations.json";
import researchKnowledgeJson from "../../output/packaged-food-beverage/research-knowledge-index.json";
import researchProjectSystemJson from "../../output/packaged-food-beverage/research-project-system.json";
import researchRegistryJson from "../../output/packaged-food-beverage/research-registry.json";
import nextWaveV2ManifestJson from "../../output/packaged-food-beverage/next-wave-v2-manifest.json";
import { knowledgeTokens, routeResearchBrief } from "../lib/researchRouting";
import { buildResearchProjectPlan, PROJECT_STAGE_LABELS, type ResearchProjectSystem } from "../lib/researchProjectPlan";
import { assessQuestionForMetricSystem } from "../lib/questionnaireGovernance";
import { summarizeQuestionnaireImpact, type QuestionImpact, type ResearchQuestion } from "../lib/questionnaireDesign";
import { downloadResearchWorkbook } from "../lib/researchWorkbookExport";
import { buildRawProductionResult, type ProductionCell, type ProductionMetricDefinition, type RawProductionResult } from "../lib/rawDataProduction";
import { buildInsightDecisionSummary, buildInsightReportDocument, buildModelAppendixDocument, buildNextWaveResearchDesign, buildNextWaveResearchDesignDocument } from "../lib/insightDelivery";
import { buildGridCsv, buildTableCsv, gridCsvFileName, tableCsvFileName, valueForFamily, type TableFamily } from "../lib/tableDelivery";
import type { LockedProjectDesign, NextWaveExperimentKey, ProjectDesignLockInput, ProjectRunRecord, QuotaMode } from "../lib/projectRunContract";
import { adjustPriceAcceptanceCurve, buildSegmentEstimate, type SegmentDimension, type SegmentKpiRow } from "../lib/segmentEstimate";
import { EXTERNAL_RESEARCH_RESOURCES } from "../data/externalResearchResources";
import { IS_STATIC_DEMO, publicAssetPath } from "../lib/publicRuntime";
import CrackerConceptCase from "./CrackerConceptCase";
import PlatformBrand from "./PlatformBrand";

type Locale = "zh" | "en";
type Tab = "全球市场" | "决策概览" | "新品案例" | "项目工作台" | "消费者洞察" | "产品与价格" | "渠道与货架" | "新品决策" | "数据中心";
type Workspace = "intelligence" | "custom" | "case";
type ConsumerSystemView = "project" | "kpi" | "questionnaire" | "model";
type CustomWorkspaceView = "brief" | "design" | "execution" | "analysis" | "delivery";
type DesignArtifact = "questionnaire" | "quota" | "dp_spec";
type QuestionnaireWorkbenchMode = "edit" | "preview";
type FinalQuestionnaire = {
  version: string;
  finalizedAt: string;
  questions: ResearchQuestion[];
  impacts: QuestionImpact[];
  retainedKpis: string[];
  reviewKpis: string[];
  removedKpis: string[];
  blockedModelRoles: string[];
};
type DataCenterView = "models" | "assets" | "governance";
type IntelligenceContentTab = Exclude<Tab, "全球市场" | "新品案例" | "项目工作台">;
type MarketScope = "CN" | "OVERSEAS";
type CategoryCode = "puffed" | "nuts" | "dried_fruit";
type ChannelCode = "snack_chain" | "ecommerce" | "hypermarket" | "instant";
type AgeCode = "18-24" | "25-34" | "35-44" | "45-54";
type IncomeCode = "6000以下" | "6000-12000" | "12000-20000" | "20000以上";
type RegionCode = "华东" | "华南" | "华北" | "华中" | "西南";
type ResearchObjective = "tracking" | "concept" | "pricing" | "channel";
type MarketPlanScope = "china" | "china_overseas" | "overseas";
type NextWaveV2ManifestVariant = {
  key: string;
  experimentKeys: string[];
  experimentQuestionIds: string[];
  files: {
    questionnaire: string;
    dpSpec: string;
    quota: Record<QuotaMode, string>;
  };
};
type QuestionnaireRequest = {
  clientName: string;
  projectName: string;
  category: string;
  businessQuestion: string;
  objective: ResearchObjective;
  sampleN: number;
  cadence: string;
};
type KnowledgeItem = {
  knowledge_id: string;
  kind: string;
  title: string;
  text: string;
  objectives: string[];
  provenance: string;
  evidence_level: string;
};
type PublicObservation = (typeof publicRetailJson.observations)[number] & {
  price_cny?: number | null;
  unit_price_per_100g_cny?: number | null;
  total_net_content_g?: number | null;
};
type GlobalMarket = (typeof globalMarketJson.markets)[number];
type ProductPilotSummary = (typeof globalProductPilotJson.market_summaries)[number];
type VerifiedMacroMetric = {
  value?: number | null;
  period?: string | null;
  source?: string | null;
  source_url?: string | null;
  analysis_value?: number | null;
  analysis_period?: string | null;
  analysis_source?: string | null;
  analysis_source_url?: string | null;
  verification_status?: "single_source_official" | "boundary_value_review_required" | "official_source_conflict" | string;
  source_conflict?: boolean;
};

const INTELLIGENCE_TABS: Tab[] = ["决策概览", "消费者洞察", "产品与价格", "渠道与货架", "新品决策", "全球市场", "数据中心"];
const CUSTOM_VIEWS: Array<{ id: CustomWorkspaceView; zh: string; en: string }> = [
  { id: "brief", zh: "01 项目启动", en: "01 Project setup" },
  { id: "design", zh: "02 问卷与样本设计", en: "02 Questionnaire & sample design" },
  { id: "execution", zh: "03 执行与进度", en: "03 Fieldwork & progress" },
  { id: "analysis", zh: "04 数据、Table与模型", en: "04 Data, tables & models" },
  { id: "delivery", zh: "05 洞察与交付", en: "05 Insights & delivery" },
];
const QUOTA_OPTIONS: Array<{
  id: QuotaMode;
  zh: string;
  en: string;
  fitZh: string;
  fitEn: string;
  structureZh: string;
  structureEn: string;
  recommended?: boolean;
  file: string;
}> = [
  {
    id: "independent",
    zh: "独立配额",
    en: "Independent quotas",
    fitZh: "适合总体市场基线和年龄、性别、地区、城市级别的独立比较",
    fitEn: "Best for a market baseline and separate age, gender, region and city-tier cuts",
    structureZh: "四个维度分别控制，不锁定多维交叉格",
    structureEn: "Control four dimensions separately without fixing multi-way cells",
    file: "/downloads/零食消费者研究_独立配额表-20260817.xlsx",
  },
  {
    id: "age_gender",
    zh: "核心交叉配额",
    en: "Core cross quota",
    fitZh: "适合本次新品与定价研究，保证年龄内性别比较，同时控制地区结构",
    fitEn: "Recommended for this concept and pricing study, protecting age-by-gender comparisons and regional structure",
    structureZh: "年龄×性别硬控；地区独立硬控；城市级别软监测",
    structureEn: "Hard age × gender and region controls; soft city-tier monitoring",
    recommended: true,
    file: "/downloads/零食消费者研究_核心交叉配额表-20260817.xlsx",
  },
  {
    id: "priority_boost",
    zh: "重点人群增样",
    en: "Priority-segment boost",
    fitZh: "适合需要深挖购买者、价格模块或新品概念评估者的项目",
    fitEn: "Best when buyers, pricing participants or concept evaluators need deeper bases",
    structureZh: "人口结构监测；关键购买与实验人群设置最低Base",
    structureEn: "Monitor demographics and set minimum bases for buyer and experiment audiences",
    file: "/downloads/零食消费者研究_重点人群增样配额表-20260817.xlsx",
  },
];
const QUESTION_TYPE_OPTIONS = ["单选", "多选", "5点量表", "数值", "开放题"] as const;
const PROJECT_LANGUAGE_OPTIONS = questionnaireTranslationsJson.meta.supported_language_selection;
const NEXT_WAVE_EXPERIMENTS: Array<{ key: NextWaveExperimentKey; primaryQuestionId: string; zh: string; en: string }> = [
  { key: "health", primaryQuestionId: "PJT_HEALTH_01", zh: "健康属性实验", en: "Health-claim experiment" },
  { key: "price", primaryQuestionId: "PJT_PRICE_01", zh: "随机价格实验", en: "Randomized price experiment" },
  { key: "concept", primaryQuestionId: "PJT_CONCEPT_01", zh: "概念表达实验", en: "Concept-execution experiment" },
];
const NEXT_WAVE_V2_VARIANTS = nextWaveV2ManifestJson.variants as NextWaveV2ManifestVariant[];
const PROJECT_DESIGN_STORAGE_KEY = "ipsos.snack.project-design.current";
const PROJECT_DESIGN_HISTORY_STORAGE_KEY = "ipsos.snack.project-design.history";
const PROJECT_RUN_STORAGE_KEY = "ipsos.snack.project-run.current";
const PROJECT_RUN_HISTORY_STORAGE_KEY = "ipsos.snack.project-run.history";
const PROJECT_RESULT_STORAGE_PREFIX = "ipsos.snack.project-result.";
const QUESTION_TRANSLATIONS = questionnaireTranslationsJson.questions as Record<string, { text_en: string; options_en: string[] }>;
const QUESTION_PROGRAMMING = Object.fromEntries(questionnaireProgrammingJson.questions.map((item) => [item.question_id, item])) as Record<string, (typeof questionnaireProgrammingJson.questions)[number]>;
const CHART_SSR_DIMENSION = { width: 800, height: 320 };
const GLOBAL_REGION_ORDER = ["中国", "东北亚", "东南亚", "北美", "欧洲", "拉丁美洲", "中东", "大洋洲"];

function ResponsiveContainer(props: ComponentProps<typeof RechartsResponsiveContainer>) {
  return <RechartsResponsiveContainer initialDimension={CHART_SSR_DIMENSION} {...props} />;
}

const RESEARCH_OBJECTIVES: Record<ResearchObjective, {
  zh: string;
  en: string;
  modules: string[];
  primaryModel: string;
  supportingModel: string;
  output: string;
  minutes: number;
}> = {
  tracking: {
    zh: "消费者与品类季度追踪",
    en: "Consumer and category tracking",
    modules: ["配额与分层", "品类基线", "渠道", "场景与需求", "价格", "未来行为", "开放题"],
    primaryModel: "分层贝叶斯趋势模型",
    supportingModel: "购买倾向模型",
    output: "跨期KPI、变化概率、人群差异与下一期预测",
    minutes: 12,
  },
  concept: {
    zh: "新品概念与产品组合测试",
    en: "Concept and product configuration test",
    modules: ["配额与分层", "品类基线", "渠道", "场景与需求", "价格", "新品概念", "未来行为", "离散选择实验", "开放题"],
    primaryModel: "离散选择模型",
    supportingModel: "概念购买倾向模型",
    output: "概念门槛、属性效用、固定方案相对选择份额与目标人群",
    minutes: 15,
  },
  pricing: {
    zh: "定价与产品属性取舍",
    en: "Pricing and attribute trade-off",
    modules: ["配额与分层", "品类基线", "场景与需求", "价格", "未来行为", "离散选择实验"],
    primaryModel: "离散选择模型",
    supportingModel: "Gabor-Granger价格接受曲线",
    output: "价格接受拐点、价格系数、属性效用与配置比较",
    minutes: 13,
  },
  channel: {
    zh: "渠道、场景与货架机会",
    en: "Channel, occasion and shelf opportunity",
    modules: ["配额与分层", "品类基线", "渠道", "场景与需求", "未来行为", "开放题"],
    primaryModel: "渠道触达与重叠模型",
    supportingModel: "人群购买倾向模型",
    output: "渠道触达、场景需求、重点人群与首轮验证渠道",
    minutes: 11,
  },
};

const TAB_EN: Record<Tab, string> = {
  "全球市场": "Global markets",
  "决策概览": "Decision overview",
  "新品案例": "Concept case",
  "项目工作台": "Project workbench",
  "消费者洞察": "Consumer insight",
  "产品与价格": "Product & pricing",
  "渠道与货架": "Channel & shelf",
  "新品决策": "Launch decision",
  "数据中心": "Data center",
};

const CATEGORY_CONFIG: Record<CategoryCode, {
  zh: string;
  en: string;
  publicName: string;
  stage: "重点研究" | "市场观察";
  baseOpportunity: number;
  baseFrequency: number;
  taste: string;
  pack: string;
}> = {
  puffed: { zh: "膨化食品", en: "Puffed snacks", publicName: "膨化食品", stage: "重点研究", baseOpportunity: 74, baseFrequency: 3.6, taste: "咸香微辣", pack: "70g可重复封口袋" },
  nuts: { zh: "坚果炒货", en: "Nuts & seeds", publicName: "坚果炒货", stage: "市场观察", baseOpportunity: 68, baseFrequency: 2.8, taste: "原味轻盐", pack: "25g×7日装" },
  dried_fruit: { zh: "干果蜜饯", en: "Dried fruit", publicName: "干果蜜饯", stage: "市场观察", baseOpportunity: 64, baseFrequency: 2.4, taste: "低糖果味", pack: "独立小袋组合" },
};

const CHANNEL_CONFIG: Record<ChannelCode, { zh: string; en: string; shift: number; reason: string }> = {
  snack_chain: { zh: "零食量贩", en: "Snack specialty chain", shift: 5.2, reason: "新品密度与价格比较场景强" },
  ecommerce: { zh: "综合电商", en: "General e-commerce", shift: 3.8, reason: "规格、价格与评价信息更完整" },
  hypermarket: { zh: "商超", en: "Hypermarket", shift: 1.5, reason: "家庭装与计划性购买更突出" },
  instant: { zh: "即时零售", en: "On-demand retail", shift: 2.6, reason: "即时解馋与场景购买更集中" },
};

const AGE_SHIFT: Record<AgeCode, number> = { "18-24": 4.6, "25-34": 6.2, "35-44": 1.8, "45-54": -2.4 };
const INCOME_SHIFT: Record<IncomeCode, number> = { "6000以下": -2.4, "6000-12000": 1.2, "12000-20000": 3.9, "20000以上": 4.8 };
const REGION_SHIFT: Record<RegionCode, number> = { "华东": 4.1, "华南": 3.2, "华北": 1.6, "华中": 0.4, "西南": -0.8 };

const SEGMENTS = [
  { code: "novel_youth", zh: "新奇尝鲜青年", en: "Novelty-seeking youth", penetration: 72, frequency: 4.1, priceTolerance: 108, opportunity: 82, sample: 388 },
  { code: "value_family", zh: "性价比家庭", en: "Value-seeking families", penetration: 78, frequency: 3.8, priceTolerance: 91, opportunity: 79, sample: 462 },
  { code: "urban_light", zh: "都市轻负担", en: "Urban light consumers", penetration: 64, frequency: 3.0, priceTolerance: 112, opportunity: 76, sample: 421 },
  { code: "ingredient_first", zh: "成分优先人群", en: "Ingredient-first consumers", penetration: 59, frequency: 2.7, priceTolerance: 119, opportunity: 71, sample: 369 },
  { code: "quality_gifting", zh: "品质分享人群", en: "Premium sharing consumers", penetration: 52, frequency: 2.2, priceTolerance: 126, opportunity: 66, sample: 360 },
];

const QUESTION_METRICS = chinaQuestionnaireJson.questions.filter((item) => item.kpi_ids.length > 0).map((item) => ({
  question: item.question_id,
  input: item.question_text,
  metric: item.kpi_ids.map((metricId) => chinaSurveyJson.metric_definitions.find((metric) => metric.metric_id === metricId)?.name ?? metricId).join("、"),
  model: item.model_roles.join("、"),
  cadence: item.cadence,
  status: item.question_id.startsWith("DCE") ? "深度模型" : "首期必测",
}));

const SAMPLE_STAGES = [
  { stage: "基础研究", n: 2000, moe: "约±2.2pp", purpose: "全国基线、三类核心人群、首轮价格与选择实验", gate: "覆盖主要消费人群" },
  { stage: "分层基线", n: 5000, moe: "约±1.4pp", purpose: "主要年龄、收入、地区和渠道稳定比较", gate: "支持稳定分层比较" },
  { stage: "规模追踪", n: 10000, moe: "约±1.0pp", purpose: "多地区、多品类和更细人群的季度追踪", gate: "跨期及经营结果持续回流" },
];

const DATA_COUNTS = {
  globalMarkets: globalMarketJson.meta.market_count,
  globalIndicators: globalMarketJson.markets.reduce((sum, market) => sum + Object.keys(market.macro).length, 0),
  globalTradeRecords: globalMarketJson.meta.trade_record_count,
  globalProductRecords: globalProductPilotJson.meta.record_count,
  consumerRecords: chinaSurveyJson.meta.respondent_count,
  scenarioSkus: foodJson.skus.length,
  publicProducts: publicRetailJson.observations.length,
  comparablePrices: (publicRetailJson.observations as PublicObservation[]).filter((item) => item.unit_price_per_100g_cny != null).length,
  metricDefinitions: chinaSurveyJson.metric_definitions.length,
  officialIndicators: authoritativePublicJson.metrics.length,
  researchKnowledgeItems: researchKnowledgeJson.meta.knowledge_item_count,
};

const RESEARCH_ROUTE_QUERIES = Object.fromEntries((Object.keys(RESEARCH_OBJECTIVES) as ResearchObjective[]).map((objective) => [objective, [researchKnowledgeJson.recommendation_profiles[objective].retrieval_query, ...(researchKnowledgeJson.knowledge_items as KnowledgeItem[]).filter((item) => item.objectives.includes(objective)).map((item) => item.text)].join(" ")])) as Record<ResearchObjective, string>;

function tr(locale: Locale, zh: string, en: string) {
  return locale === "zh" ? zh : en;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function format(value: number, digits = 1) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function retrieveResearchEvidence(objective: ResearchObjective, query: string) {
  const candidates = (researchKnowledgeJson.knowledge_items as KnowledgeItem[]).filter((item) => item.objectives.includes(objective));
  const queryTokens = knowledgeTokens(query);
  const ranked = candidates.map((item) => {
    const itemTokens = knowledgeTokens(item.text);
    const matchedTerms = [...queryTokens].filter((token) => itemTokens.has(token));
    const score = matchedTerms.length / Math.sqrt(Math.max(1, queryTokens.size * itemTokens.size));
    return { item, matchedTerms, score };
  }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score);
  const selected = ["model_method", "research_capability", "metric_definition", "question_template"].map((kind) => ranked.find((row) => row.item.kind === kind)).filter((row): row is NonNullable<typeof row> => Boolean(row));
  return selected.map(({ item, matchedTerms, score }) => ({
    knowledge_id: item.knowledge_id,
    kind: item.kind,
    title: item.title,
    score: Number(score.toFixed(3)),
    matched_terms: matchedTerms.slice(0, 6),
    provenance: item.provenance,
    evidence_level: item.evidence_level,
    influence: {
      questionnaire: ["question_template", "metric_definition", "research_capability"].includes(item.kind),
      metric_system: ["metric_definition", "model_method", "research_capability"].includes(item.kind),
      model_route: ["model_method", "research_capability"].includes(item.kind),
    },
  }));
}

function DataTag({ tone, children }: { tone: "simulation" | "public" | "official" | "gap"; children: React.ReactNode }) {
  return <span className={`snack-data-tag ${tone}`}>{children}</span>;
}

function ResearchTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="snack-tooltip">{label && <strong>{label}</strong>}{payload.map((item, index) => <span key={`${item.name}-${index}`}>{item.name}：{format(Number(item.value ?? 0), 1)}</span>)}</div>;
}

function SectionTitle({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return <header className="snack-section-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{note && <p>{note}</p>}</header>;
}

function formatPopulation(value?: number | null) {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `${format(value / 1_000_000_000, 2)}B`;
  if (value >= 1_000_000) return `${format(value / 1_000_000, 1)}M`;
  return format(value, 0);
}

function formatUsdCompact(value?: number | null) {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `$${format(value / 1_000_000_000, 1)}B`;
  if (value >= 1_000_000) return `$${format(value / 1_000_000, 1)}M`;
  return `$${format(value, 0)}`;
}

function globalRegionLabel(locale: Locale, region: string) {
  if (region === "ALL") return tr(locale, "全部海外", "All overseas");
  if (region === "中国") return tr(locale, "中国", "China");
  const market = (globalMarketJson.markets as GlobalMarket[]).find((item) => item.region === region);
  return locale === "zh" ? region : (market?.region_en ?? region);
}

function householdConsumptionMetric(market: GlobalMarket): VerifiedMacroMetric {
  return market.macro.household_consumption_pc_2015_usd as VerifiedMacroMetric;
}

function householdConsumptionValue(market: GlobalMarket): number | null {
  const value = householdConsumptionMetric(market)?.value;
  return value == null ? null : Number(value);
}

function householdConsumptionDisplay(market: GlobalMarket): string {
  const value = householdConsumptionValue(market);
  return value == null ? "—" : `$${format(value, 0)}`;
}

function GlobalMarketAtlas({ locale, marketScope, selectedRegion, selectedMarket, onSelectMarket }: { locale: Locale; marketScope: MarketScope; selectedRegion: string; selectedMarket: string; onSelectMarket: (code: string) => void }) {
  const allMarkets = globalMarketJson.markets as GlobalMarket[];
  const overseasMarkets = allMarkets.filter((market) => market.code !== "CN");
  const comparisonMarkets = marketScope === "CN"
    ? allMarkets
    : overseasMarkets.filter((market) => selectedRegion === "ALL" || market.region === selectedRegion);
  const scopeMarkets = marketScope === "CN" ? allMarkets.filter((market) => market.code === "CN") : comparisonMarkets;
  const activeMarket = allMarkets.find((market) => market.code === (marketScope === "CN" ? "CN" : selectedMarket));
  const populations = scopeMarkets.map((market) => Number(market.macro.population?.value ?? 0)).filter(Boolean);
  const gdpValues = scopeMarkets.map((market) => Number(market.macro.gdp_per_capita_usd?.value ?? 0)).filter(Boolean).sort((a, b) => a - b);
  const consumptionValues = scopeMarkets.map(householdConsumptionValue).filter((value): value is number => value != null).sort((a, b) => a - b);
  const median = (values: number[]) => values.length ? values[Math.floor(values.length / 2)] : 0;
  const populationCoverage = populations.reduce((sum, value) => sum + value, 0);
  const chartRows = comparisonMarkets.flatMap((market) => {
    const consumptionValue = householdConsumptionValue(market);
    if (consumptionValue == null) return [];
    return [{
      code: market.code,
      name: locale === "zh" ? market.zh : market.en,
      region: locale === "zh" ? market.region : market.region_en,
      x: Number((Number(market.macro.gdp_per_capita_usd?.value ?? 0) / 1000).toFixed(1)),
      y: Number((consumptionValue / 1000).toFixed(1)),
      consumptionPeriod: String(householdConsumptionMetric(market).period ?? "—"),
      population: Number(market.macro.population?.value ?? 0),
    }];
  });
  const tradeRows = comparisonMarkets
    .filter((market) => market.trade_proxy.status === "available")
    .map((market) => ({
      code: market.code,
      name: locale === "zh" ? market.zh : market.en,
      value: Number((Number(market.trade_proxy.combined_primary_value_usd ?? 0) / 1_000_000_000).toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
  const comparisonCodes = new Set(comparisonMarkets.map((market) => market.code));
  const productPilotRows = (globalProductPilotJson.market_summaries as ProductPilotSummary[])
    .filter((summary) => comparisonCodes.has(summary.market_code))
    .map((summary) => ({
      ...summary,
      market: locale === "zh" ? summary.market_zh : summary.market_en,
      packCoverage: Number((summary.field_coverage_counts.quantity / summary.sample_count * 100).toFixed(1)),
      ingredientCoverage: Number((summary.field_coverage_counts.ingredients / summary.sample_count * 100).toFixed(1)),
      nutritionEligibility: Number((summary.eligible_nutrition_count / summary.sample_count * 100).toFixed(1)),
    }));
  const activeProductSummary = (globalProductPilotJson.market_summaries as ProductPilotSummary[]).find((summary) => summary.market_code === activeMarket?.code);
  const layerRows = [
    { name: tr(locale, "国家基础指标", "Country context"), count: scopeMarkets.length, total: scopeMarkets.length, tone: "official" as const, note: tr(locale, "人口、人均GDP、人均家庭消费支出", "population, GDP per capita, household consumption per capita") },
    { name: tr(locale, "食品贸易背景", "Food trade context"), count: scopeMarkets.filter((market) => market.data_layers.broad_trade_context === "available").length, total: scopeMarkets.length, tone: "official" as const, note: tr(locale, "2024年四个宽口径HS进口值；非零食市场规模", "2024 imports across four broad HS codes; not snack market size") },
    { name: tr(locale, "消费者问卷", "Consumer survey"), count: scopeMarkets.filter((market) => market.data_layers.consumer_survey !== "not_fielded").length, total: scopeMarkets.length, tone: "simulation" as const, note: tr(locale, "中国已有案例基线；海外尚未执行", "China has a case baseline; overseas not fielded") },
    { name: tr(locale, "公开商品属性", "Public product attributes"), count: scopeMarkets.filter((market) => market.data_layers.public_product_attributes !== "source_registered_not_collected").length, total: scopeMarkets.length, tone: "public" as const, note: tr(locale, "六个市场已有有界样本；其余市场待采集", "Six markets have bounded samples; others await collection") },
    { name: tr(locale, "零售价格", "Retail price"), count: scopeMarkets.filter((market) => market.data_layers.retail_price !== "not_collected").length, total: scopeMarkets.length, tone: "public" as const, note: tr(locale, "必须绑定商品、规格、渠道、日期与货币", "must bind SKU, pack, channel, date and currency") },
    { name: tr(locale, "经营结果", "Business outcomes"), count: scopeMarkets.filter((market) => market.data_layers.business_outcomes !== "not_connected").length, total: scopeMarkets.length, tone: "gap" as const, note: tr(locale, "试购、复购、销售与铺货尚未接入", "trial, repeat, sales and distribution not connected") },
  ];
  const selectedName = activeMarket ? (locale === "zh" ? activeMarket.zh : activeMarket.en) : tr(locale, "海外整体", "Overseas overall");
  const tableRows = [...comparisonMarkets].sort((a, b) => {
    const regionDelta = GLOBAL_REGION_ORDER.indexOf(a.region) - GLOBAL_REGION_ORDER.indexOf(b.region);
    return regionDelta || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);
  });

  return <div className="snack-stack global-market-atlas">
    <section className="global-market-hero">
      <div><span>GLOBAL SNACK MARKET DATA</span><h2>{tr(locale, "全球零食市场数据库", "Global snack market database")}</h2><p>{tr(locale, "按国家统一组织人口、收入、居民消费、商品、价格、渠道与调研结果，支持中国与海外市场比较。", "Country-level population, income, household consumption, product, price, channel and research outcomes support China and overseas market comparison.")}</p></div>
      <aside><strong>{globalMarketJson.meta.market_count}</strong><span>{tr(locale, "优先市场", "priority markets")}</span><b>{globalMarketJson.meta.region_count} {tr(locale, "个海外区域", "overseas regions")}</b></aside>
    </section>
    <section className="global-market-summary">
      <article><span>{tr(locale, "当前范围", "Current scope")}</span><strong>{selectedName}</strong><small>{marketScope === "CN" ? tr(locale, "中国深度研究入口", "China deep-research entry") : selectedRegion === "ALL" ? tr(locale, "全部海外市场", "All overseas markets") : globalRegionLabel(locale, selectedRegion)}</small></article>
      <article><span>{tr(locale, "纳入国家", "Markets covered")}</span><strong>{scopeMarkets.length}</strong><small>{tr(locale, "当前选择范围", "current selected scope")}</small></article>
      <article><span>{tr(locale, "覆盖人口背景", "Population context")}</span><strong>{formatPopulation(populationCoverage)}</strong><small>{tr(locale, "纳入国家人口之和，非消费者规模", "sum of covered-country population, not consumers")}</small></article>
      <article><span>{tr(locale, "人均GDP中位数", "Median GDP per capita")}</span><strong>${format(median(gdpValues), 0)}</strong><small>{tr(locale, "各国最新非空年份", "latest non-empty year by country")}</small></article>
      <article><span>{tr(locale, "人均家庭消费支出中位数", "Median household consumption")}</span><strong>{consumptionValues.length ? `$${format(median(consumptionValues), 0)}` : "—"}</strong><small>{tr(locale, "2015年不变价美元/人", "constant 2015 US$ per person")}</small></article>
      <article><span>{tr(locale, "世界银行更新", "World Bank update")}</span><strong>{globalMarketJson.meta.world_bank_last_updated}</strong><small>World Development Indicators</small></article>
    </section>
    <section className="snack-grid global-market-main">
      <article className="snack-panel global-market-chart">
        <header><div><span>COUNTRY COMPARISON</span><h3>{tr(locale, "收入 × 居民消费能力 × 人口规模", "Income × household spending capacity × population")}</h3></div><DataTag tone="official">World Bank</DataTag></header>
        <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 18, right: 28, bottom: 26, left: 8 }}><CartesianGrid stroke="#e3e7ee" /><XAxis type="number" dataKey="x" name={tr(locale, "人均GDP", "GDP per capita")} unit="k USD" tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="y" name={tr(locale, "人均家庭消费支出", "Household consumption per capita")} unit="k USD" tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="population" range={[70, 720]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => { const row = payload?.[0]?.payload as (typeof chartRows)[number] | undefined; return active && row ? <div className="snack-tooltip"><strong>{row.name}</strong><span>{tr(locale, "人均GDP", "GDP per capita")}：${format(row.x, 1)}k</span><span>{tr(locale, "人均家庭消费支出", "Household consumption per capita")}：${format(row.y, 1)}k · {row.consumptionPeriod}</span><span>{tr(locale, "人口", "Population")}：{formatPopulation(row.population)}</span></div> : null; }} /><Scatter data={chartRows} onClick={(row) => onSelectMarket((row as unknown as { code: string }).code)}>{chartRows.map((row) => <Cell key={row.code} fill={row.code === activeMarket?.code ? "#09a39b" : "#2639a5"} opacity={row.code === activeMarket?.code ? 1 : .58} />)}</Scatter></ScatterChart></ResponsiveContainer></div>
        <p className="snack-note">{tr(locale, "纵轴为世界银行人均家庭最终消费支出（2015年不变价美元）；用于市场经济背景比较。", "The y-axis is World Bank household final consumption expenditure per capita in constant 2015 US dollars, used for market-economic context.")}</p>
      </article>
      <article className="global-market-profile">
        <header><span>SELECTED MARKET</span><DataTag tone="official">{selectedName}</DataTag></header>
        {activeMarket ? <>
          <h3>{locale === "zh" ? activeMarket.zh : activeMarket.en}<small>{activeMarket.code} · {locale === "zh" ? activeMarket.region : activeMarket.region_en}</small></h3>
          <div className="global-market-profile-kpis"><div><span>{tr(locale, "人口", "Population")}</span><strong>{formatPopulation(activeMarket.macro.population?.value)}</strong><small>{activeMarket.macro.population?.period}</small></div><div><span>{tr(locale, "人均GDP", "GDP per capita")}</span><strong>${format(Number(activeMarket.macro.gdp_per_capita_usd?.value ?? 0), 0)}</strong><small>{activeMarket.macro.gdp_per_capita_usd?.period}</small></div><div><span>{tr(locale, "人均家庭消费支出", "Household consumption")}</span><strong>{householdConsumptionDisplay(activeMarket)}</strong><small>{householdConsumptionMetric(activeMarket)?.period ?? "—"}</small></div></div>
          <div className="global-market-trade"><span>{tr(locale, "宽口径食品进口背景", "Broad food import context")}</span><strong>{formatUsdCompact(activeMarket.trade_proxy.combined_primary_value_usd)}</strong><small>{activeMarket.trade_proxy.status === "available" ? tr(locale, "2024 · 四个HS编码合计 · 非零食市场规模", "2024 · four HS codes combined · not snack market size") : tr(locale, "UN Comtrade公开预览接口未返回记录", "No record returned by the UN Comtrade public preview API")}</small></div>
          <dl><div><dt>{tr(locale, "研究语言", "Research language")}</dt><dd>{activeMarket.language}</dd></div><div><dt>{tr(locale, "货币", "Currency")}</dt><dd>{activeMarket.currency}</dd></div><div><dt>{tr(locale, "食品监管入口", "Food regulation")}</dt><dd><a href={activeMarket.regulator_url} target="_blank" rel="noreferrer">{activeMarket.regulator} ↗</a></dd></div></dl>
          <footer><b>{tr(locale, "下一步数据", "Next data")}</b><p>{activeMarket.code === "CN" ? tr(locale, "按季度更新消费者样本，并接入试购、复购与销售结果。", "Refresh consumer samples quarterly and connect trial, repeat and sales outcomes.") : tr(locale, "执行本地消费者基线，采集渠道商品、规格、价格与促销，再训练本地模型。", "Field a local consumer baseline, collect channel products, pack, price and promotion, then train a local model.")}</p></footer>
        </> : <><h3>{tr(locale, "海外整体", "Overseas overall")}<small>{comparisonMarkets.length} {tr(locale, "个优先市场", "priority markets")}</small></h3><p className="global-overall-note">{tr(locale, "先比较国家背景和数据覆盖，再按区域启动统一核心问卷与本地化价格、渠道采集。", "Compare country context and data coverage first, then launch a common core survey and localized price and channel collection by region.")}</p><footer><b>{tr(locale, "下一步数据", "Next data")}</b><p>{tr(locale, "东北亚、东南亚、欧美、中东和拉美使用同一核心指标；语言、渠道、价格与法规模块本地化。", "Northeast Asia, Southeast Asia, Europe, the Americas and the Middle East share core metrics while language, channel, price and regulation modules localize.")}</p></footer></>}
      </article>
    </section>
    <section className="global-trade-context">
      <article className="snack-panel global-trade-chart">
        <header><div><span>TRADE CONTEXT</span><h3>{tr(locale, "2024宽口径食品进口背景", "2024 broad food import context")}</h3></div><DataTag tone="official">UN Comtrade</DataTag></header>
        <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={tradeRows} layout="vertical" margin={{ top: 10, right: 28, bottom: 8, left: 12 }}><CartesianGrid stroke="#e3e7ee" horizontal={false} /><XAxis type="number" unit="B" tick={{ fontSize: 8 }} /><YAxis type="category" dataKey="name" width={locale === "zh" ? 60 : 88} tick={{ fontSize: 8 }} /><Tooltip content={({ active, payload }) => { const row = payload?.[0]?.payload as (typeof tradeRows)[number] | undefined; return active && row ? <div className="snack-tooltip"><strong>{row.name}</strong><span>{tr(locale, "四类HS进口值合计", "combined imports across four HS codes")}：${format(row.value, 2)}B</span></div> : null; }} /><Bar dataKey="value" onClick={(row) => onSelectMarket((row as unknown as { code: string }).code)}>{tradeRows.map((row) => <Cell key={row.code} fill={row.code === activeMarket?.code ? "#08a39b" : "#2d3fa8"} />)}</Bar></BarChart></ResponsiveContainer></div>
        <p className="snack-note">{tr(locale, `当前覆盖${globalMarketJson.meta.trade_market_count}/25个市场、${globalMarketJson.meta.trade_record_count}条记录；法国、瑞士、越南、阿联酋接口未返回记录。进口值只用于贸易背景比较。`, `Current coverage: ${globalMarketJson.meta.trade_market_count}/25 markets and ${globalMarketJson.meta.trade_record_count} records. France, Switzerland, Vietnam and the UAE returned no record. Import values are trade context only.`)}</p>
      </article>
      <article className="global-trade-dictionary">
        <header><span>HS SCOPE</span><h3>{tr(locale, "这组数据具体包含什么", "What this dataset contains")}</h3></header>
        <div>{globalMarketJson.trade_proxy_dictionary.map((item) => <section key={item.hs_code}><b>{item.hs_code}</b><span>{locale === "zh" ? item.name_zh : item.name_en}</span><p>{locale === "zh" ? item.boundary_zh : "Broad customs category; use as trade context only."}</p></section>)}</div>
        <footer>{tr(locale, "用途：比较国家间食品品类贸易流动，并为出海问卷、渠道与商品采集确定优先级。不能回答当地消费者为什么买、零售价格是多少或新品能卖多少。", "Use: compare cross-market food trade flows and prioritize surveys, channels and SKU collection. It cannot explain local consumer choice, retail prices or launch sales.")}</footer>
      </article>
    </section>
    <section className="global-product-pilot">
      <header><div><span>PRODUCT ATTRIBUTE PILOT</span><h3>{tr(locale, "多国公开商品属性试点", "Multi-market public product-attribute pilot")}</h3></div><p>{tr(locale, "先验证各国商品字段能否稳定入库，再补零售价格、渠道在售与消费者选择数据。", "Validate country-level product fields first, then add retail price, channel availability and consumer choice data.")}</p></header>
      <div className="global-product-kpis"><article><span>{tr(locale, "已入库市场", "Markets loaded")}</span><strong>{globalProductPilotJson.meta.market_count}</strong><small>CN · US · UK · JP · KR · BR</small></article><article><span>{tr(locale, "开放商品记录", "Open product records")}</span><strong>{globalProductPilotJson.meta.record_count}</strong><small>{tr(locale, "条码 × 国家", "barcode × market")}</small></article><article><span>{tr(locale, "营养比较候选", "Nutrition-comparison eligible")}</span><strong>{globalProductPilotJson.quality_profile.eligible_nutrition_records}</strong><small>{format(globalProductPilotJson.quality_profile.eligible_nutrition_records / globalProductPilotJson.meta.record_count * 100)}%</small></article><article><span>{tr(locale, "复合键重复", "Duplicate composite keys")}</span><strong>{globalProductPilotJson.quality_profile.duplicate_composite_keys.length}</strong><small>{tr(locale, "market_code × barcode", "market_code × barcode")}</small></article></div>
      <div className="global-product-body">
        <article className="snack-panel global-product-chart">
          <header><div><span>FIELD COVERAGE</span><h3>{tr(locale, "规格、配料与营养字段覆盖", "Pack, ingredient and nutrition-field coverage")}</h3></div><DataTag tone="public">Open Food Facts</DataTag></header>
          <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={productPilotRows} margin={{ top: 18, right: 20, bottom: 12, left: 0 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="market" tick={{ fontSize: 8 }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 8 }} /><Tooltip content={<ResearchTooltip />} /><Bar dataKey="packCoverage" name={tr(locale, "规格完整率", "Pack coverage")} fill="#273ba5" /><Bar dataKey="ingredientCoverage" name={tr(locale, "配料完整率", "Ingredient coverage")} fill="#08a39b" /><Bar dataKey="nutritionEligibility" name={tr(locale, "营养比较候选率", "Nutrition eligible")} fill="#e69a2b" /></BarChart></ResponsiveContainer></div>
          <p className="snack-note">{tr(locale, "中国为前期广义样本，只用于字段覆盖；美国、英国、日本、韩国与巴西采用相同筛选条件，可比较采集完整率，但仍不是在售商品大盘。", "China uses an earlier broad sample for field coverage only. The US, UK, Japan, South Korea and Brazil use the same bounded query and can be compared for collection completeness, not market assortment.")}</p>
        </article>
        <article className="global-product-selected">
          <header><span>SELECTED MARKET</span><DataTag tone={activeProductSummary ? "public" : "gap"}>{activeMarket ? (locale === "zh" ? activeMarket.zh : activeMarket.en) : tr(locale, "海外整体", "Overseas overall")}</DataTag></header>
          {activeProductSummary ? <>
            <h3>{tr(locale, "当前有界样本", "Current bounded sample")}<strong>{activeProductSummary.sample_count}</strong></h3>
            <dl><div><dt>{tr(locale, "商品名", "Product name")}</dt><dd>{activeProductSummary.field_coverage_counts.product_name}/{activeProductSummary.sample_count}</dd></div><div><dt>{tr(locale, "品牌", "Brand")}</dt><dd>{activeProductSummary.field_coverage_counts.brand}/{activeProductSummary.sample_count}</dd></div><div><dt>{tr(locale, "规格", "Pack")}</dt><dd>{activeProductSummary.field_coverage_counts.quantity}/{activeProductSummary.sample_count}</dd></div><div><dt>{tr(locale, "配料", "Ingredients")}</dt><dd>{activeProductSummary.field_coverage_counts.ingredients}/{activeProductSummary.sample_count}</dd></div><div><dt>{tr(locale, "营养比较候选", "Nutrition eligible")}</dt><dd>{activeProductSummary.eligible_nutrition_count}/{activeProductSummary.sample_count}</dd></div><div><dt>{tr(locale, "异常营养值", "Invalid nutrition")}</dt><dd>{activeProductSummary.invalid_nutrition_count}</dd></div></dl>
            <section><b>{tr(locale, "样本中出现较多的品牌", "More frequent brands in this sample")}</b>{activeProductSummary.top_observed_brands.length ? activeProductSummary.top_observed_brands.map((brand) => <span key={brand.brand}>{brand.brand}<em>{brand.records}</em></span>) : <p>{tr(locale, "品牌字段不足", "Insufficient brand fields")}</p>}</section>
            <footer>{activeProductSummary.query_mode === "legacy_broad_country_sample" ? tr(locale, "仅作字段覆盖，不与五个海外市场直接比较。", "Field coverage only; not directly comparable with the five overseas markets.") : tr(locale, "可用于商品字段、规格和营养属性原型；价格、渠道在售与销量仍需独立采集。", "Usable for product-field, pack and nutrition prototypes; price, channel availability and sales require separate collection.")}</footer>
          </> : <><h3>{tr(locale, "该市场尚未入库", "Market not yet loaded")}</h3><div className="global-product-empty"><strong>{tr(locale, "下一步采集", "Next collection")}</strong><p>{tr(locale, "按统一国家 × 零食品类 × 营养字段完整条件重试公开商品接口；成功后再进入价格和渠道采集。", "Retry the public-product source with the standard market × snack × nutrition-complete query, then proceed to price and channel collection.")}</p></div><footer>{tr(locale, "未入库不等于当地没有商品，只表示当前数据源尚未成功采集。", "Not loaded does not mean no local products; it means the current source has not been collected successfully.")}</footer></>}
        </article>
      </div>
    </section>
    <section className="global-data-coverage">
      <header><div><span>DATA COVERAGE</span><h3>{tr(locale, "当前数据能覆盖到哪一层", "Current data coverage by layer")}</h3></div><p>{tr(locale, "覆盖量表示数据是否已接入，不是市场评分。", "Coverage shows connection status, not market attractiveness.")}</p></header>
      <div>{layerRows.map((layer) => <article key={layer.name}><DataTag tone={layer.tone}>{layer.name}</DataTag><strong>{layer.count}/{layer.total}</strong><i><b style={{ width: `${layer.total ? layer.count / layer.total * 100 : 0}%` }} /></i><p>{layer.note}</p></article>)}</div>
    </section>
    <section className="global-model-federation">
      <header><div><span>GLOBAL + LOCAL MODEL SYSTEM</span><h3>{tr(locale, "全球共享结构，本地独立校准", "Global shared structure, local calibration")}</h3></div><p>{tr(locale, "模型只在相应国家数据达到条件后运行；不把中国参数直接复制到海外。", "A model runs only after its market meets the data gate; China parameters are never copied directly overseas.")}</p></header>
      <div><article><b>01</b><span>{tr(locale, "统一核心问卷", "Common core survey")}</span><p>{tr(locale, "各国保留品类购买、频次、渠道、场景和价格接受，用同一指标定义比较。", "Markets retain category purchase, frequency, channel, occasion and price acceptance under shared definitions.")}</p><strong>{tr(locale, "输出：跨国可比KPI", "Output: comparable KPIs")}</strong></article><i>→</i><article><b>02</b><span>{tr(locale, "分层贝叶斯跨国模型", "Hierarchical cross-market model")}</span><p>{tr(locale, "共享稳定模式，同时为国家、人群和期次保留本地参数与不确定区间。", "Shares stable patterns while retaining local market, segment and wave parameters with uncertainty.")}</p><strong>{tr(locale, "输出：国家变化概率与区间", "Output: market movement and intervals")}</strong></article><i>→</i><article><b>03</b><span>{tr(locale, "本地选择与定价模型", "Local choice and pricing model")}</span><p>{tr(locale, "使用当地货币、商品、渠道和消费者选择任务估计价格、口味、规格与包装取舍。", "Uses local currency, products, channels and consumer choices to estimate price, taste, size and pack trade-offs.")}</p><strong>{tr(locale, "输出：本地产品与价格情景", "Output: local product-price scenarios")}</strong></article><i>→</i><article><b>04</b><span>{tr(locale, "真实结果持续回流", "Continuous outcome feedback")}</span><p>{tr(locale, "用试购、复购、销量、铺货和下架结果校准预测，并监控国家间模型漂移。", "Calibrates predictions with trial, repeat, sales, distribution and delisting while monitoring market drift.")}</p><strong>{tr(locale, "输出：经验证的进入与上市建议", "Output: validated entry and launch decisions")}</strong></article></div>
    </section>
    <section className="global-market-table">
      <header><span>{tr(locale, "区域 / 国家", "Region / country")}</span><span>{tr(locale, "人口", "Population")}</span><span>{tr(locale, "人均GDP", "GDP per capita")}</span><span>{tr(locale, "人均家庭消费支出", "Household consumption")}</span><span>{tr(locale, "食品贸易背景", "Food trade context")}</span><span>{tr(locale, "消费者问卷", "Consumer survey")}</span><span>{tr(locale, "零售价格", "Retail price")}</span></header>
      {tableRows.map((market) => <button key={market.code} className={market.code === activeMarket?.code ? "active" : ""} onClick={() => onSelectMarket(market.code)}><span><small>{locale === "zh" ? market.region : market.region_en}</small><b>{locale === "zh" ? market.zh : market.en}</b><em>{market.code}</em></span><strong>{formatPopulation(market.macro.population?.value)}<small>{market.macro.population?.period}</small></strong><strong>${format(Number(market.macro.gdp_per_capita_usd?.value ?? 0), 0)}<small>{market.macro.gdp_per_capita_usd?.period}</small></strong><strong>{householdConsumptionDisplay(market)}<small>{householdConsumptionMetric(market)?.period ?? "—"} · 2015 USD</small></strong><strong>{formatUsdCompact(market.trade_proxy.combined_primary_value_usd)}<small>{market.trade_proxy.status === "available" ? tr(locale, "2024 · 4个HS", "2024 · 4 HS") : tr(locale, "未返回记录", "no record")}</small></strong><span className={market.data_layers.consumer_survey === "not_fielded" ? "pending" : "available"}>{market.data_layers.consumer_survey === "not_fielded" ? tr(locale, "待首期", "Not fielded") : tr(locale, "案例基线", "Case baseline")}</span><span className={market.data_layers.retail_price === "not_collected" ? "pending" : "available"}>{market.data_layers.retail_price === "not_collected" ? tr(locale, "待采集", "Not collected") : tr(locale, "中国试点", "China pilot")}</span></button>)}
    </section>
  </div>;
}

function OverseasMarketWorkspace({ locale, tab, selectedRegion, selectedMarket }: { locale: Locale; tab: IntelligenceContentTab; selectedRegion: string; selectedMarket: string }) {
  const overseasMarkets = (globalMarketJson.markets as GlobalMarket[]).filter((market) => market.code !== "CN" && (selectedRegion === "ALL" || market.region === selectedRegion));
  const activeMarket = overseasMarkets.find((market) => market.code === selectedMarket);
  const label = activeMarket ? (locale === "zh" ? activeMarket.zh : activeMarket.en) : selectedRegion === "ALL" ? tr(locale, "海外整体", "Overseas overall") : globalRegionLabel(locale, selectedRegion);
  const requirements: Record<IntelligenceContentTab, Array<{ name: string; data: string; output: string }>> = {
    "决策概览": [
      { name: tr(locale, "市场进入", "Market entry"), data: tr(locale, "国家背景 + 品类渗透 + 购买频次", "country context + category penetration + frequency"), output: tr(locale, "国家与人群优先顺序", "market and segment priority") },
      { name: tr(locale, "产品定位", "Product positioning"), data: tr(locale, "需求场景 + 现有商品 + 未满足需求", "occasions + current products + unmet needs"), output: tr(locale, "口味、规格、成分与包装方向", "taste, pack, ingredient and packaging direction") },
      { name: tr(locale, "进入方式", "Route to market"), data: tr(locale, "渠道购买 + 零售商品 + 价格促销", "channel purchase + retail products + price and promotion"), output: tr(locale, "首发渠道与测试范围", "launch channel and test scope") },
    ],
    "消费者洞察": [
      { name: tr(locale, "核心基线", "Core baseline"), data: tr(locale, "品类购买、频次、渠道、场景", "category purchase, frequency, channel, occasion"), output: tr(locale, "渗透、频次与消费者结构", "penetration, frequency and consumer structure") },
      { name: tr(locale, "需求分层", "Need segmentation"), data: tr(locale, "口味、健康、便利、分享与价值态度", "taste, health, convenience, sharing and value attitudes"), output: tr(locale, "跨国可比需求人群", "cross-market comparable need segments") },
      { name: tr(locale, "跨期变化", "Movement over time"), data: tr(locale, "固定核心题 + 当期轮换模块", "fixed core + rotating module"), output: tr(locale, "国家、人群与指标变化区间", "market, segment and metric movement intervals") },
    ],
    "产品与价格": [
      { name: tr(locale, "商品大盘", "Product universe"), data: tr(locale, "条码、品牌、口味、规格、包装、成分", "barcode, brand, taste, size, pack and ingredients"), output: tr(locale, "当地商品结构与空白位置", "local product structure and white spaces") },
      { name: tr(locale, "价格体系", "Price system"), data: tr(locale, "商品、规格、渠道、日期、货币、促销", "SKU, pack, channel, date, currency and promotion"), output: tr(locale, "标准化单位价格与价格带", "normalized unit prices and price bands") },
      { name: tr(locale, "选择实验", "Choice experiment"), data: tr(locale, "价格 × 口味 × 规格 × 包装 × 成分", "price × taste × size × pack × ingredient"), output: tr(locale, "属性效用、价格接受和情景份额", "attribute utility, price acceptance and scenario share") },
    ],
    "渠道与货架": [
      { name: tr(locale, "渠道地图", "Channel map"), data: tr(locale, "当地商超、电商、便利店、零食专营与即时零售", "local grocery, e-commerce, convenience, specialty and quick commerce"), output: tr(locale, "渠道角色与购买重叠", "channel role and purchase overlap") },
      { name: tr(locale, "上架商品", "Listed products"), data: tr(locale, "渠道 × 商品 × 可得性 × 促销 × 日期", "channel × SKU × availability × promotion × date"), output: tr(locale, "商品密度、价格与上新变化", "product density, price and launch movement") },
      { name: tr(locale, "货架验证", "Shelf validation"), data: tr(locale, "位置、排面、邻近商品、包装与消费者选择", "position, facings, adjacency, pack and consumer choice"), output: tr(locale, "货架方案与增量选择", "shelf option and incremental choice") },
    ],
    "新品决策": [
      { name: tr(locale, "概念筛选", "Concept screen"), data: tr(locale, "相关性、差异化、可信度、购买意向", "relevance, differentiation, credibility and intent"), output: tr(locale, "进入产品测试的概念", "concepts advancing to product test") },
      { name: tr(locale, "产品验证", "Product validation"), data: tr(locale, "盲测、品牌测试、价格与选择任务", "blind test, branded test, price and choice tasks"), output: tr(locale, "产品优化与本地参考情景", "product optimization and local reference scenario") },
      { name: tr(locale, "上市校准", "Launch calibration"), data: tr(locale, "试购、复购、销售、铺货、缺货与替代来源", "trial, repeat, sales, distribution, OOS and source of volume"), output: tr(locale, "经真实结果校准的上市预测", "launch prediction calibrated to observed outcomes") },
    ],
    "数据中心": [
      { name: tr(locale, "统一国家字典", "Country dictionary"), data: tr(locale, "国家、区域、语言、货币、时间与监管来源", "country, region, language, currency, time and regulation"), output: tr(locale, "跨国筛选和统一口径", "cross-market filtering and shared definitions") },
      { name: tr(locale, "独立数据域", "Governed data domains"), data: tr(locale, "消费者、商品价格、渠道、指标、外部校准与结果", "consumer, product-price, channel, metrics, calibration and outcomes"), output: tr(locale, "来源、粒度、Base和更新时间可追溯", "traceable source, grain, base and freshness") },
      { name: tr(locale, "跨国模型版本", "Market model versions"), data: tr(locale, "国家样本、参数、验证表现与适用范围", "market sample, parameters, validation and use boundary"), output: tr(locale, "全球共享结构、本地独立校准", "global shared structure with local calibration") },
    ],
  };
  const tabCopy: Record<IntelligenceContentTab, { eyebrow: string; title: string }> = {
    "决策概览": { eyebrow: "MARKET ENTRY", title: tr(locale, `${label}市场进入决策`, `${label} market-entry decision`) },
    "消费者洞察": { eyebrow: "CONSUMER", title: tr(locale, `${label}消费者指标体系`, `${label} consumer metric system`) },
    "产品与价格": { eyebrow: "PRODUCT & PRICE", title: tr(locale, `${label}商品与价格数据`, `${label} product and price data`) },
    "渠道与货架": { eyebrow: "CHANNEL & SHELF", title: tr(locale, `${label}渠道与货架数据`, `${label} channel and shelf data`) },
    "新品决策": { eyebrow: "LAUNCH", title: tr(locale, `${label}新品决策模型`, `${label} launch decision model`) },
    "数据中心": { eyebrow: "DATA CENTER", title: tr(locale, `${label}数据域`, `${label} data domains`) },
  };
  const contextRows = activeMarket ? [
    { label: tr(locale, "人口", "Population"), value: formatPopulation(activeMarket.macro.population?.value), period: activeMarket.macro.population?.period },
    { label: tr(locale, "人均GDP", "GDP per capita"), value: `$${format(Number(activeMarket.macro.gdp_per_capita_usd?.value ?? 0), 0)}`, period: activeMarket.macro.gdp_per_capita_usd?.period },
    { label: tr(locale, "人均家庭消费支出", "Household consumption per capita"), value: householdConsumptionDisplay(activeMarket), period: `${householdConsumptionMetric(activeMarket)?.period ?? "—"} · 2015 USD` },
  ] : [
    { label: tr(locale, "国家覆盖", "Markets covered"), value: String(overseasMarkets.length), period: selectedRegion === "ALL" ? tr(locale, "全部海外", "All overseas") : globalRegionLabel(locale, selectedRegion) },
    { label: tr(locale, "国家基础数据", "Country context"), value: `${overseasMarkets.length}/${overseasMarkets.length}`, period: "World Bank" },
    { label: tr(locale, "本地消费者问卷", "Local consumer survey"), value: `0/${overseasMarkets.length}`, period: tr(locale, "待执行", "Not fielded") },
  ];

  return <div className="snack-stack overseas-workspace">
    <SectionTitle eyebrow={tabCopy[tab].eyebrow} title={tabCopy[tab].title} note={tr(locale, "全球共用指标与数据结构，本地问卷、商品、价格、渠道和模型独立采集与校准。", "Markets share metrics and data structures; local surveys, products, prices, channels and models are collected and calibrated independently.")} />
    <section className="overseas-context-strip">{contextRows.map((row) => <article key={row.label}><span>{row.label}</span><strong>{row.value}</strong><small>{row.period}</small></article>)}<article className="status"><span>{tr(locale, "当前可用", "Available now")}</span><strong>{tr(locale, "国家基础数据", "Country context")}</strong><small>{tr(locale, "消费者与零售数据待本地采集", "consumer and retail data pending")}</small></article></section>
    <section className="overseas-requirement-grid">{requirements[tab].map((item, index) => <article key={item.name}><b>{String(index + 1).padStart(2, "0")}</b><h3>{item.name}</h3><dl><div><dt>{tr(locale, "所需数据", "Required data")}</dt><dd>{item.data}</dd></div><div><dt>{tr(locale, "形成产出", "Output")}</dt><dd>{item.output}</dd></div></dl></article>)}</section>
    <section className="overseas-gate"><div><span>{tr(locale, "当前状态", "Current state")}</span><h3>{tr(locale, "国家基础指标已接入；本地消费者、商品价格与经营结果尚未形成可训练样本。", "Country context is connected; local consumer, product-price and business outcomes are not yet trainable.")}</h3></div><aside><DataTag tone="official">World Bank</DataTag><DataTag tone="gap">{tr(locale, "本地数据待接入", "Local data pending")}</DataTag></aside></section>
  </div>;
}

function ObservationOnly({ locale, category }: { locale: Locale; category: Exclude<CategoryCode, "puffed"> }) {
  const config = CATEGORY_CONFIG[category];
  const rows = (publicRetailJson.observations as PublicObservation[]).filter((item) => item.category === config.publicName);
  const priced = rows.filter((item) => item.unit_price_per_100g_cny != null);
  const brandCount = new Set(rows.map((item) => item.brand).filter(Boolean)).size;
  const priceValues = priced.map((item) => Number(item.unit_price_per_100g_cny));
  const priceRange = priceValues.length ? `¥${format(Math.min(...priceValues), 2)}–¥${format(Math.max(...priceValues), 2)}/100g` : "—";

  return <div className="snack-stack">
    <section className="snack-observation-hero">
      <div><span>MARKET OBSERVATION</span><h2>{tr(locale, `${config.zh}市场观察`, `${config.en} market observation`)}</h2><p>{tr(locale, "当前提供公开商品、规格和价格样本；消费者洞察与新品决策模型将在专项样本及真实结果接入后开放。", "Public product, pack and price observations are available now; consumer insight and launch-decision models open after dedicated research and outcome data are connected.")}</p></div>
      <DataTag tone="public">{tr(locale, "公开市场数据", "Public market data")}</DataTag>
    </section>
    <section className="snack-observation-metrics">
      <article><span>{tr(locale, "公开商品观察", "Public observations")}</span><strong>{rows.length}</strong><small>SKU</small></article>
      <article><span>{tr(locale, "观察品牌", "Observed brands")}</span><strong>{brandCount}</strong><small>{tr(locale, "非市场品牌覆盖率", "not market coverage")}</small></article>
      <article><span>{tr(locale, "可比单位价格", "Comparable unit prices")}</span><strong>{priced.length}</strong><small>{tr(locale, "公开详情页", "public detail pages")}</small></article>
      <article><span>{tr(locale, "公开样本价格范围", "Observed price range")}</span><strong>{priceRange}</strong><small>{tr(locale, "不可外推市场价格带", "not a market price band")}</small></article>
    </section>
    <section className="snack-grid wide-left">
      <article className="snack-public-price-table">
        <header><span>{tr(locale, "品牌 / 商品", "Brand / product")}</span><span>{tr(locale, "售价", "Price")}</span><span>{tr(locale, "每100g", "Per 100g")}</span><span>{tr(locale, "来源", "Source")}</span></header>
        {rows.slice(0, 8).map((item, index) => <div key={`${item.brand}-${item.product_title}-${index}`}><span><b>{item.brand}</b><small>{item.product_title}</small></span><strong>{item.price_cny != null ? `¥${format(Number(item.price_cny), 2)}` : "—"}</strong><strong>{item.unit_price_per_100g_cny != null ? `¥${format(Number(item.unit_price_per_100g_cny), 2)}` : "—"}</strong><a href={item.source_url} target="_blank" rel="noreferrer">{item.retailer} ↗</a></div>)}
      </article>
      <article className="snack-observation-gates">
        <header><span>{tr(locale, "数据扩展路径", "Data expansion path")}</span></header>
        <div><b>01</b><strong>{tr(locale, "明确决策问题", "Define the decision")}</strong><p>{tr(locale, "确认产品、价格、渠道或新品决策及所需指标。", "Define the product, price, channel or launch decision and required metrics.")}</p></div>
        <div><b>02</b><strong>{tr(locale, "补充消费者研究", "Add consumer research")}</strong><p>{tr(locale, "完成配额、问卷、价格测试和选择实验。", "Field quota, questionnaire, price and choice tasks.")}</p></div>
        <div><b>03</b><strong>{tr(locale, "连接经营结果", "Connect outcomes")}</strong><p>{tr(locale, "接入试购、复购、销售或上架结果，持续校准预测。", "Connect trial, repeat, sales or listing outcomes for continuous calibration.")}</p></div>
      </article>
    </section>
  </div>;
}

function SnackHeader({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  return <>
    <header className="snack-topbar">
      <div className="snack-brand"><PlatformBrand compact /><i /><div><b>{tr(locale, "益普索中国 · 零食消费与市场洞察", "Ipsos China · Snack Consumer Intelligence")}</b><span>{tr(locale, "消费者数据与决策模型", "Consumer data and decision models")}</span></div></div>
      <nav><div className="snack-locale"><button className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")}>中</button><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button></div><Link href="/retail">{tr(locale, "返回零售业", "Back to retail")}</Link></nav>
    </header>
    <section className="snack-hero">
      <div>
        <span>SNACK CONSUMER & MARKET INTELLIGENCE</span>
        <h1>{tr(locale, "全球零食消费者与品类决策平台", "Global Snack Consumer & Category Intelligence")}</h1>
        <p>{tr(locale, "以中国为深度研究市场，连接海外国家基础、消费者、商品价格、渠道货架与新品结果，为本地增长和产品出海提供可持续更新的决策依据。", "Use China as the first deep-research market while connecting overseas country context, consumers, product-price, channels and launch outcomes for local growth and international expansion.")}</p>
      </div>
      <aside>
        <span>{tr(locale, "数据范围", "Data coverage")}</span>
        <strong>{tr(locale, "中国 + 24个海外市场", "China + 24 overseas markets")}</strong>
        <div><b>{tr(locale, "中国深度研究", "China deep research")}</b><em>{tr(locale, "消费者 · 商品 · 价格 · 渠道", "Consumer · product · price · channel")}</em></div>
        <div><b>{tr(locale, "海外市场", "Overseas markets")}</b><em>{tr(locale, "7大区域 · 国家独立校准", "7 regions · local calibration")}</em></div>
      </aside>
    </section>
  </>;
}

function DataFoundationStrip({ locale }: { locale: Locale }) {
  const inventory = [
    { value: DATA_COUNTS.consumerRecords.toLocaleString(), label: tr(locale, "消费者建模记录", "Consumer model records"), detail: tr(locale, "跨期问卷与选择任务", "Multi-wave survey and choice tasks"), tone: "simulation" },
    { value: DATA_COUNTS.scenarioSkus.toLocaleString(), label: tr(locale, "商品情景记录", "Product scenario records"), detail: tr(locale, "价格 × 属性 × 渠道情景", "Price × attribute × channel scenarios"), tone: "simulation" },
    { value: DATA_COUNTS.publicProducts.toLocaleString(), label: tr(locale, "公开商品观察", "Public product observations"), detail: tr(locale, "公开页面 · 可追溯来源", "Public pages · traceable sources"), tone: "public" },
    { value: DATA_COUNTS.comparablePrices.toLocaleString(), label: tr(locale, "可比单位价格", "Comparable unit prices"), detail: tr(locale, "元/100g · 已复核", "CNY/100g · reviewed"), tone: "public" },
    { value: DATA_COUNTS.metricDefinitions.toLocaleString(), label: tr(locale, "标准指标定义", "Standard metric definitions"), detail: tr(locale, "题目、Base、权重、频率", "Question, base, weight, cadence"), tone: "official" },
    { value: DATA_COUNTS.officialIndicators.toLocaleString(), label: tr(locale, "外部校准指标", "External calibration indicators"), detail: tr(locale, "国家统计局等权威来源", "Authoritative public sources"), tone: "official" },
  ];
  return <section className="snack-data-foundation">
    <div className="snack-data-foundation-copy">
      <span>DATA FOUNDATION</span>
      <h2>{tr(locale, "零食行业数据底座", "Snack industry data foundation")}</h2>
      <p>{tr(locale, "消费者、商品价格、渠道货架、指标口径与经营结果按独立粒度持续入库，统一关联后再进入模型。", "Consumer, product-price, channel-shelf, metric and outcome data retain their own grain and are linked before modeling.")}</p>
      <div className="snack-database-mark" aria-hidden="true"><i /><i /><i /><b /></div>
    </div>
    <div className="snack-data-inventory">{inventory.map((item) => <article key={item.label} className={item.tone}><strong>{item.value}</strong><span>{item.label}</span><small>{item.detail}</small></article>)}</div>
  </section>;
}

function DecisionOverview({ locale, category, channel, age, income, region }: { locale: Locale; category: CategoryCode; channel: ChannelCode; age: AgeCode; income: IncomeCode; region: RegionCode }) {
  const categoryConfig = CATEGORY_CONFIG[category];
  const publicRows = (publicRetailJson.observations as PublicObservation[]).filter((item) => item.category === categoryConfig.publicName);
  const pricedRows = publicRows.filter((item) => item.unit_price_per_100g_cny != null);
  const publicAveragePrice = pricedRows.length ? pricedRows.reduce((sum, item) => sum + Number(item.unit_price_per_100g_cny), 0) / pricedRows.length : 0;
  const segmentEstimate = buildSegmentEstimate({ overall: chinaSurveyJson.overall_kpis, subgroupRows: chinaSurveyJson.subgroup_kpis as SegmentKpiRow[], age, income, region, channelShift: CHANNEL_CONFIG[channel].shift });
  const segmentIntentLift = segmentEstimate.kpis.purchase_intent_t2b - chinaSurveyJson.overall_kpis.purchase_intent_t2b;
  const suggestedPriceIndex = income === "6000以下" ? 90 : income === "20000以上" ? 105 : 95;
  const scenarioPrice = publicAveragePrice ? publicAveragePrice * suggestedPriceIndex / 100 : 0;
  const channelFit = clamp(68 + CHANNEL_CONFIG[channel].shift * 2 + REGION_SHIFT[region] * .4);
  const segmentRows = SEGMENTS.map((item) => ({
    name: locale === "zh" ? item.zh : item.en,
    opportunity: clamp(item.opportunity + AGE_SHIFT[age] * .22 + INCOME_SHIFT[income] * .14 + REGION_SHIFT[region] * .12 + segmentIntentLift * .32),
  })).sort((a, b) => b.opportunity - a.opportunity);
  const topSegment = segmentRows[0];

  const decisions = [
    { index: "01", label: tr(locale, "优先人群", "Priority segment"), value: topSegment.name, metric: `${format(topSegment.opportunity)} ${tr(locale, "机会分", "score")}`, answer: tr(locale, `${age}岁、${income}、${region}是当前筛选条件下的优先人群`, `${age}, ${income}, ${region} is the priority segment under the current filters`) },
    { index: "02", label: tr(locale, "建议测试价格", "Test price"), value: scenarioPrice ? `¥${format(scenarioPrice, 2)}/100g` : tr(locale, "待采集", "Pending"), metric: `${suggestedPriceIndex}% ${tr(locale, "公开样本均价", "of observed mean")}`, answer: tr(locale, "这是实验起点，不是市场成交价结论", "An experiment anchor, not a market transaction conclusion") },
    { index: "03", label: tr(locale, "产品组合", "Product configuration"), value: categoryConfig.taste, metric: categoryConfig.pack, answer: tr(locale, "口味、规格、包装将进入离散选择任务共同估计", "Taste, size and pack enter one discrete-choice experiment") },
    { index: "04", label: tr(locale, "渠道适配", "Channel fit"), value: `${format(channelFit)} / 100`, metric: CHANNEL_CONFIG[channel].zh, answer: CHANNEL_CONFIG[channel].reason },
  ];

  return <div className="snack-stack">
    <DataFoundationStrip locale={locale} />
    <section className="snack-decision-hero">
      <div><span>{tr(locale, "当前机会判断", "Current opportunity")}</span><h2>{tr(locale, `${region}${categoryConfig.zh}优先关注${topSegment.name}，建议先测试价格与产品组合，再评估渠道扩展。`, `Prioritize ${topSegment.name} for ${categoryConfig.en} in ${region}; test price and product configuration before channel expansion.`)}</h2></div>
      <aside><span>{tr(locale, "当前人群估计", "Active-segment estimate")}</span><strong>{format(segmentEstimate.kpis.purchase_intent_t2b)}%</strong><small>{tr(locale, `未来意向 · 建模N=${segmentEstimate.modelBaseN.toLocaleString()} · 交叉Base≈${segmentEstimate.approximateCellBaseN}`, `forward intent · model N=${segmentEstimate.modelBaseN.toLocaleString()} · cross-cell base≈${segmentEstimate.approximateCellBaseN}`)}</small></aside>
    </section>

    <section className="snack-decision-grid">{decisions.map((item) => <article key={item.index}><span>{item.index} · {item.label}</span><strong>{item.value}</strong><b>{item.metric}</b><p>{item.answer}</p></article>)}</section>

    <section className="snack-grid two">
      <article className="snack-panel">
        <header><div><span>SEGMENT PRIORITY</span><h3>{tr(locale, "人群机会排序", "Segment opportunity ranking")}</h3></div></header>
        <div className="snack-chart medium"><ResponsiveContainer width="100%" height="100%"><BarChart data={segmentRows} layout="vertical" margin={{ top: 6, right: 28, bottom: 8, left: 18 }}><CartesianGrid stroke="#e3e7ee" horizontal={false} /><XAxis type="number" domain={[50, 90]} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={locale === "zh" ? 92 : 150} tick={{ fontSize: 9 }} /><Tooltip content={<ResearchTooltip />} /><Bar dataKey="opportunity" name={tr(locale, "机会分", "Opportunity")} radius={[0, 3, 3, 0]}>{segmentRows.map((item, index) => <Cell key={item.name} fill={index === 0 ? "#0aa59e" : "#2639a5"} opacity={index === 0 ? 1 : .58} />)}</Bar></BarChart></ResponsiveContainer></div>
        <p className="snack-note">{tr(locale, "机会分用于排序进一步研究与产品测试优先级，不等于销量、份额或市场规模。", "Opportunity scores prioritize further research and product tests; they are not sales, share or market size.")}</p>
      </article>
      <article className="snack-panel evidence-panel">
        <header><div><span>EVIDENCE LAYERS</span><h3>{tr(locale, "当前证据能回答到哪一层", "What the current evidence can answer")}</h3></div></header>
        <div className="snack-evidence-row"><DataTag tone="official">{tr(locale, "官方", "Official")}</DataTag><strong>{authoritativePublicJson.metrics.find((item) => item.metric_id === "NBS_H1_ONLINE_FOOD_GROWTH")?.value}%</strong><p>{tr(locale, "网上商品零售额中吃类商品同比增速，只用于线上趋势先验。", "Online edible-goods growth, used only as a macro channel prior.")}</p></div>
        <div className="snack-evidence-row"><DataTag tone="public">{tr(locale, "公开观察", "Public observation")}</DataTag><strong>{publicRows.length} SKU</strong><p>{tr(locale, `${pricedRows.length}条可计算每100g价格；数据保留原始页面与采集日期。`, `${pricedRows.length} unit-price records with source pages and capture dates retained.`)}</p></div>
        <div className="snack-evidence-row"><DataTag tone="simulation">{tr(locale, "消费者研究", "Consumer research")}</DataTag><strong>N={chinaSurveyJson.meta.respondent_count.toLocaleString()}</strong><p>{tr(locale, "当前案例包含问卷Raw、配额、KPI与选择任务，用于验证人群、价格和产品情景分析。", "The current case includes survey Raw, quotas, KPIs and choice tasks for segment, price and product-scenario analysis.")}</p></div>
        <div className="snack-evidence-row"><DataTag tone="gap">{tr(locale, "经营结果", "Business outcomes")}</DataTag><strong>{tr(locale, "待接入", "Pending")}</strong><p>{tr(locale, "真实销量、复购、铺货、下架与新品表现接入后用于持续校准。", "Sales, repeat, distribution, delisting and launch results will continuously calibrate the models.")}</p></div>
      </article>
    </section>

    <section className="snack-focus-loop">
      <article><span>01</span><b>{tr(locale, "消费者需求", "Consumer demand")}</b><p>{tr(locale, "识别人群、场景、价格态度与未满足需求。", "Identify segments, occasions, price attitudes and unmet needs.")}</p></article>
      <article className="active"><span>02</span><b>{tr(locale, "产品与价格", "Product and price")}</b><p>{tr(locale, "量化口味、规格、包装、价格与促销取舍。", "Quantify trade-offs across taste, size, pack, price and promotion.")}</p></article>
      <article><span>03</span><b>{tr(locale, "渠道与增长", "Channel and growth")}</b><p>{tr(locale, "连接上架、试购、复购与销售表现，更新下一轮决策。", "Connect listing, trial, repeat and sales performance to the next decision cycle.")}</p></article>
    </section>
  </div>;
}

function ConsumerDemand({ locale, category, channel, age, income, region, activeSegmentDimension = "age_group", viewMode, production, lockedProjectDesign, onProjectDesignLocked }: { locale: Locale; category: CategoryCode; channel: ChannelCode; age: AgeCode; income: IncomeCode; region: RegionCode; activeSegmentDimension?: SegmentDimension; viewMode?: ConsumerSystemView; production?: RawProductionResult | null; lockedProjectDesign?: LockedProjectDesign | null; onProjectDesignLocked?: (input: ProjectDesignLockInput) => void }) {
  const [internalView, setInternalView] = useState<ConsumerSystemView>("project");
  const view = viewMode ?? internalView;
  const [cutDimension, setCutDimension] = useState<"age_group" | "gender" | "region" | "city_tier" | "income">("age_group");
  const initialRequest: QuestionnaireRequest = {
    clientName: "待填写客户",
    projectName: `中国${CATEGORY_CONFIG[category].zh}消费者研究`,
    category: CATEGORY_CONFIG[category].zh,
    businessQuestion: "了解中国城市消费者的品类购买、价格接受与新品机会，并建立可持续更新的核心KPI。",
    objective: "concept",
    sampleN: 5000,
    cadence: "季度核心追踪；价格与DCE半年轮换",
  };
  const [requestForm, setRequestForm] = useState<QuestionnaireRequest>(initialRequest);
  const [generatedRequest, setGeneratedRequest] = useState<QuestionnaireRequest>(initialRequest);
  const [objectiveMode, setObjectiveMode] = useState<ResearchObjective | "auto">("auto");
  const [generatedObjectiveMode, setGeneratedObjectiveMode] = useState<ResearchObjective | "auto">("auto");
  const [marketPlanScope, setMarketPlanScope] = useState<MarketPlanScope>("china");
  const [priorityMarkets, setPriorityMarkets] = useState("美国、日本、韩国、英国、德国、印尼、泰国、越南、巴西、沙特阿拉伯");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["zh-CN"]);
  const [generatedLanguages, setGeneratedLanguages] = useState<string[]>(["zh-CN"]);
  const [quotaMode, setQuotaMode] = useState<QuotaMode>("age_gender");
  const [designArtifact, setDesignArtifact] = useState<DesignArtifact>("questionnaire");
  const [selectedNextWaveExperiments, setSelectedNextWaveExperiments] = useState<NextWaveExperimentKey[]>(["health", "price", "concept"]);
  const [restoredDesignVersion, setRestoredDesignVersion] = useState<string | null>(null);
  const [availableEvidence, setAvailableEvidence] = useState<string[]>([]);
  const [deliveryStage, setDeliveryStage] = useState<"all" | "design" | "fieldwork" | "analysis" | "validation" | "outcome">("all");
  const [draftRevision, setDraftRevision] = useState(1);
  const [clientQuestionDraft, setClientQuestionDraft] = useState("");
  const [clientQuestionModule, setClientQuestionModule] = useState("项目补充");
  const [clientQuestionType, setClientQuestionType] = useState("单选");
  const [clientQuestionOptions, setClientQuestionOptions] = useState("非常不愿意\n比较不愿意\n一般\n比较愿意\n非常愿意");
  const [clientQuestions, setClientQuestions] = useState<ResearchQuestion[]>([]);
  const [questionEdits, setQuestionEdits] = useState<Record<string, ResearchQuestion>>({});
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [selectedQuestionModule, setSelectedQuestionModule] = useState("全部");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionnaireWorkbenchMode, setQuestionnaireWorkbenchMode] = useState<QuestionnaireWorkbenchMode>("edit");
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [finalQuestionnaire, setFinalQuestionnaire] = useState<FinalQuestionnaire | null>(null);
  const [finalRevision, setFinalRevision] = useState(0);
  const overall = chinaSurveyJson.overall_kpis;
  const segmentEstimate = useMemo(() => buildSegmentEstimate({
    overall,
    subgroupRows: chinaSurveyJson.subgroup_kpis as SegmentKpiRow[],
    age,
    income,
    region,
    channelShift: CHANNEL_CONFIG[channel].shift,
  }), [age, channel, income, overall, region]);
  const currentKpis = segmentEstimate.kpis;
  const segmentPriceCurve = useMemo(() => adjustPriceAcceptanceCurve(
    chinaSurveyJson.price_curve,
    overall.price_accept_7_9,
    currentKpis.price_accept_7_9,
  ), [currentKpis.price_accept_7_9, overall.price_accept_7_9]);
  const subgroupRows = chinaSurveyJson.subgroup_kpis.filter((item) => item.dimension === cutDimension);
  const dimensionLabels = {
    age_group: tr(locale, "年龄", "Age"), gender: tr(locale, "性别", "Gender"), region: tr(locale, "地区", "Region"), city_tier: tr(locale, "城市级别", "City tier"), income: tr(locale, "月收入", "Income"),
  };
  const selectedCutValue = cutDimension === "age_group" ? age : cutDimension === "income" ? income : cutDimension === "region" ? region : "";
  const highlightedGroup = subgroupRows.find((item) => item.value === selectedCutValue);
  useEffect(() => setCutDimension(activeSegmentDimension), [activeSegmentDimension]);
  useEffect(() => setPreviewQuestionIndex(0), [selectedQuestionModule, questionnaireWorkbenchMode]);
  const heroMetrics = [
    { label: tr(locale, "过去3个月购买率", "3-month penetration"), value: `${format(currentKpis.penetration_3m)}%`, question: "Q1", role: tr(locale, "主KPI", "Primary KPI") },
    { label: tr(locale, "月度活跃购买者", "Monthly active buyers"), value: `${format(currentKpis.monthly_buyer_rate)}%`, question: "Q2", role: tr(locale, "主KPI", "Primary KPI") },
    { label: tr(locale, "未来1个月购买意向T2B", "Next-month intent T2B"), value: `${format(currentKpis.purchase_intent_t2b)}%`, question: "Q11", role: tr(locale, "主KPI", "Primary KPI") },
    { label: tr(locale, "70g/¥7.9价格接受", "70g/¥7.9 acceptance"), value: `${format(currentKpis.price_accept_7_9)}%`, question: "Q9", role: tr(locale, "驱动", "Driver") },
    { label: tr(locale, "新品概念购买意向T2B", "Concept trial T2B"), value: `${format(currentKpis.concept_trial_t2b)}%`, question: "Q10", role: tr(locale, "驱动", "Driver") },
    { label: tr(locale, "健康负担满足度T2B", "Health-fit T2B"), value: `${format(currentKpis.health_fit_t2b)}%`, question: "Q8", role: tr(locale, "护栏", "Guardrail") },
  ];
  const propensity = chinaSurveyJson.models.purchase_propensity;
  const propensityDrivers = propensity.coefficients.filter((item) => item.variable !== "截距").sort((a, b) => Math.abs(b.impact_pp_q25_q75) - Math.abs(a.impact_pp_q25_q75)).slice(0, 7);
  const choice = chinaSurveyJson.models.discrete_choice;
  const choiceDrivers = choice.coefficients.filter((item) => item.attribute !== "截距").sort((a, b) => Math.abs(b.utility) - Math.abs(a.utility));
  const choiceScenarios = choice.scenario_shares;
  const choiceMax = Math.max(...choiceDrivers.map((item) => Math.abs(item.utility)));
  const formRoute = useMemo(() => routeResearchBrief(`${requestForm.category} ${requestForm.businessQuestion}`, RESEARCH_ROUTE_QUERIES), [requestForm.category, requestForm.businessQuestion]);
  const generatedRoute = useMemo(() => routeResearchBrief(`${generatedRequest.category} ${generatedRequest.businessQuestion}`, RESEARCH_ROUTE_QUERIES), [generatedRequest.category, generatedRequest.businessQuestion]);
  const objective = RESEARCH_OBJECTIVES[generatedRequest.objective];
  const knowledgeProfile = researchKnowledgeJson.recommendation_profiles[generatedRequest.objective];
  const knowledgeCounts = researchKnowledgeJson.meta.by_kind;
  const knowledgeEvidence = useMemo(() => retrieveResearchEvidence(generatedRequest.objective, `${knowledgeProfile.retrieval_query} ${generatedRequest.category} ${generatedRequest.businessQuestion}`), [generatedRequest.objective, generatedRequest.category, generatedRequest.businessQuestion, knowledgeProfile.retrieval_query]);
  const selectedRouteScore = generatedRoute.ranked.find((item) => item.objective === generatedRequest.objective)?.score ?? 0;
  const objectiveModules = completeQuestionnaireJson.objective_modules[generatedRequest.objective];
  const baselineQuestions = completeQuestionnaireJson.questions.filter((item) => objectiveModules.includes(item.module)) as ResearchQuestion[];
  const baselineById = Object.fromEntries(baselineQuestions.map((item) => [item.question_id, item]));
  const generatedQuestions = [
    ...baselineQuestions.map((item) => questionEdits[item.question_id] ?? item),
    ...clientQuestions,
  ];
  const questionnaireImpact = summarizeQuestionnaireImpact(generatedQuestions, baselineById, deletedQuestionIds);
  const impactByQuestionId = Object.fromEntries(questionnaireImpact.impacts.map((item) => [item.questionId, item]));
  const activeDraftQuestions = generatedQuestions.filter((item) => !deletedQuestionIds.includes(item.question_id));
  const generatedMetricIds = new Set(activeDraftQuestions.flatMap((item) => item.kpi_ids));
  const generatedMetrics = chinaSurveyJson.metric_definitions.filter((item) => generatedMetricIds.has(item.metric_id));
  const projectPlan = useMemo(() => buildResearchProjectPlan({ objective: generatedRequest.objective, sampleN: generatedRequest.sampleN, marketScope: marketPlanScope, markets: priorityMarkets, availableEvidence }, generatedMetrics, researchProjectSystemJson as unknown as ResearchProjectSystem), [generatedRequest.objective, generatedRequest.sampleN, marketPlanScope, priorityMarkets, availableEvidence, generatedMetrics]);
  const visibleDeliverables = projectPlan.deliverables.filter((item) => deliveryStage === "all" || item.phase === deliveryStage);
  const evidenceName = Object.fromEntries(researchProjectSystemJson.evidence_requirements.map((item) => [item.evidence_id, tr(locale, item.name, item.name_en)]));
  const toggleEvidence = (evidenceId: string) => setAvailableEvidence((current) => current.includes(evidenceId) ? current.filter((item) => item !== evidenceId) : [...current, evidenceId]);
  const modules = Array.from(new Set([...objectiveModules, ...clientQuestions.map((item) => item.module)])).map((module) => ({ module, count: activeDraftQuestions.filter((item) => item.module === module).length })).filter((item) => item.count > 0);
  const visibleQuestions = generatedQuestions.filter((item) => selectedQuestionModule === "全部" || item.module === selectedQuestionModule);
  const previewQuestions = activeDraftQuestions.filter((item) => selectedQuestionModule === "全部" || item.module === selectedQuestionModule);
  const previewQuestion = previewQuestions[Math.min(previewQuestionIndex, Math.max(0, previewQuestions.length - 1))];
  const optionRoute = (item: ResearchQuestion, option: string, optionIndex: number) => {
    if (item.module !== "甄别与配额") return "";
    if (/以上均无|以上皆无/.test(option)) return tr(locale, "继续", "Continue");
    const routeKey = option.split(/[（(]/)[0].trim();
    if (item.question_id === "S9" && optionIndex < item.options.length - 1 && /任一相关行业|1-4中任一项/.test(item.logic)) return tr(locale, "终止", "Disqualify");
    const optionMentioned = item.logic.includes(`‘${option}’`) || item.logic.includes(`“${option}”`) || item.logic.includes(option) || (routeKey.length >= 4 && item.logic.includes(routeKey));
    if (optionMentioned && /取决于|或保留|补充样本/.test(item.logic)) return tr(locale, "条件路由", "Conditional route");
    if (optionMentioned && /结束访问|终止/.test(item.logic)) return tr(locale, "终止", "Disqualify");
    return tr(locale, "继续", "Continue");
  };
  const selectedQuota = QUOTA_OPTIONS.find((item) => item.id === quotaMode)!;
  const dpSpecSheets = [
    ["General", tr(locale, "项目、市场、版本、权重与通用输出规则", "Project, market, version, weight and shared output rules"), tr(locale, "锁定项目级分析口径", "Locks project-level analysis definitions")],
    ["Spec", tr(locale, "逐题定义Base、输出类型、Net、均值与小数位", "Question-level bases, outputs, nets, means and decimals"), tr(locale, "把问卷字段转换为Table规则", "Translates questionnaire fields into table rules")],
    ["Banner", tr(locale, "Total、年龄、性别、地区、城市、收入、购买活跃度与渠道", "Total, age, gender, region, city, income, purchase activity and channel"), tr(locale, "定义独立与重叠分析列", "Defines mutually exclusive and overlapping cuts")],
    ["Grid", tr(locale, "题目 × Banner × Base × 显著性路线", "Question × banner × base × significance route"), tr(locale, "控制Count、No sig与Sig的生产范围", "Controls Count, No sig and Sig production")],
  ];
  const quotaPreview = quotaMode === "independent"
    ? [
        [tr(locale, "年龄", "Age"), "S1", tr(locale, "独立硬配额", "Independent hard quota"), "18% / 30% / 29% / 23%"],
        [tr(locale, "性别", "Gender"), "S2", tr(locale, "独立硬配额", "Independent hard quota"), "50% / 50%"],
        [tr(locale, "地区", "Region"), "S3", tr(locale, "独立硬配额", "Independent hard quota"), tr(locale, "六大区域", "Six regions")],
        [tr(locale, "城市级别", "City tier"), "S4", tr(locale, "独立硬配额", "Independent hard quota"), tr(locale, "四级城市", "Four tiers")],
      ]
    : quotaMode === "age_gender"
      ? [
          [tr(locale, "年龄 × 性别", "Age × gender"), "S1 × S2", tr(locale, "交叉硬配额", "Cross hard quota"), tr(locale, "8个互斥单元", "8 exclusive cells")],
          [tr(locale, "地区", "Region"), "S3", tr(locale, "独立硬配额", "Independent hard quota"), tr(locale, "六大区域", "Six regions")],
          [tr(locale, "城市级别", "City tier"), "S4", tr(locale, "软监测", "Soft monitor"), tr(locale, "四级城市", "Four tiers")],
        ]
      : [
          [tr(locale, "人口结构", "Demographic structure"), "S1 / S3", tr(locale, "软监测", "Soft monitor"), tr(locale, "年龄与地区", "Age and region")],
          [tr(locale, "购买决策者", "Purchase decision makers"), "S7=1/2", tr(locale, "最低Base", "Minimum base"), "N≥3,000"],
          [tr(locale, "品类购买者", "Category buyers"), "Q1=1", tr(locale, "最低Base", "Minimum base"), "N≥2,500"],
          [tr(locale, "价格 / 概念模块", "Pricing / concept modules"), "Q9 / Q10", tr(locale, "最低Base", "Minimum base"), "N≥2,200"],
        ];
  const downloadQuotaWorkbook = () => {
    if (!finalQuestionnaire) return;
    downloadResearchWorkbook([
      { name: "配额表", rows: [["配额方式", "控制对象", "问卷字段", "控制方法", "目标结构", "目标N", "问卷版本"], ...quotaPreview.map((row) => [tr(locale, selectedQuota.zh, selectedQuota.en), ...row, generatedRequest.sampleN, finalQuestionnaire.version])] },
      { name: "版本信息", rows: [["项目", "问卷版本", "配额方式", "总样本", "锁定时间"], [generatedRequest.projectName, finalQuestionnaire.version, tr(locale, selectedQuota.zh, selectedQuota.en), generatedRequest.sampleN, new Date().toISOString()]] },
    ], `${generatedRequest.projectName}_${finalQuestionnaire.version}_${selectedQuota.zh}_配额表.xlsx`);
  };
  const dpSpecWorkbookSheets = () => {
    if (!finalQuestionnaire) return [];
    const bannerRows = quotaPreview.map((row, index) => [`B${String(index + 1).padStart(2, "0")}`, ...row]);
    return [
      { name: "General", rows: [["字段", "定义"], ["项目", generatedRequest.projectName], ["问卷版本", finalQuestionnaire.version], ["市场", marketPlanScope === "china" ? "中国" : priorityMarkets], ["目标样本", generatedRequest.sampleN], ["配额方式", selectedQuota.zh], ["语言", generatedLanguages.join(" · ")], ["Table输出", "Count / No sig / Sig"], ["显著性水平", "95%"]] },
      { name: "Spec", rows: [["题号", "模块", "题型", "Base", "输出", "Net/均值", "小数位", "KPI映射", "模型角色", "程序逻辑"], ...finalQuestionnaire.questions.map((item) => [item.question_id, item.module, item.response_type, item.base, item.response_type === "数值" ? "Mean / Median / Distribution" : "Count / %", item.response_type === "数值" || item.response_type.includes("量表") ? "Mean" : "按选项", item.response_type === "数值" ? 1 : 0, item.kpi_ids.join(" · ") || "—", item.model_roles.join(" · ") || "—", item.logic])] },
      { name: "Banner", rows: [["Banner ID", "控制对象", "问卷字段", "类型", "定义"], ["B00", "Total", "全部有效被访者", "互斥", "Total"], ...bannerRows] },
      { name: "Grid", rows: [["题号", "模块", "Banner", "Base", "Count", "No sig", "Sig", "显著性路线"], ...finalQuestionnaire.questions.map((item) => [item.question_id, item.module, "B00 + 全部已锁定Banner", item.base, "Y", "Y", item.response_type.includes("开放") ? "N" : "Y", item.response_type === "数值" ? "独立样本均值检验 / 95%" : "独立样本列比例检验 / 95%"])] },
    ];
  };
  const downloadDpSpecWorkbook = () => {
    if (!finalQuestionnaire) return;
    downloadResearchWorkbook(dpSpecWorkbookSheets(), `${generatedRequest.projectName}_${finalQuestionnaire.version}_DP_Spec.xlsx`);
  };
  const confirmResearchDesign = () => {
    if (!finalQuestionnaire || !onProjectDesignLocked) return;
    onProjectDesignLocked({
      projectId: "SNACK-CN-CRACKER-001",
      artifactVersion: "V2",
      confirmationKey: `${finalQuestionnaire.version}|${quotaMode}|${generatedRequest.sampleN}|${finalQuestionnaire.finalizedAt}`,
      sampleN: generatedRequest.sampleN,
      quotaMode,
      experimentKeys: [...selectedNextWaveExperiments],
      experimentQuestionIds: finalQuestionnaire.questions.filter((item) => item.question_id.startsWith("PJT_") || item.question_id.startsWith("DCE")).map((item) => item.question_id),
      sourceProductionFile: "SNACK-CASE-BASELINE.csv",
      sourceProductionProcessedAt: finalQuestionnaire.finalizedAt,
      files: { questionnaire: "/downloads/零食消费者研究_问卷确认稿-20260817.xlsx", quota: selectedQuota.file, dpSpec: "/downloads/零食消费者研究_DP_Spec-20260817.xlsx" },
      finalQuestionnaire: {
        version: finalQuestionnaire.version,
        finalizedAt: finalQuestionnaire.finalizedAt,
        questions: finalQuestionnaire.questions.map((item) => ({ module: item.module, questionId: item.question_id, questionText: item.question_text, responseType: item.response_type, options: [...item.options], base: item.base, logic: item.logic, kpiIds: [...item.kpi_ids], modelRoles: [...item.model_roles], indicatorLayer: item.indicator_layer })),
        retainedKpis: [...finalQuestionnaire.retainedKpis],
        reviewKpis: [...finalQuestionnaire.reviewKpis],
        removedKpis: [...finalQuestionnaire.removedKpis],
        blockedModelRoles: [...finalQuestionnaire.blockedModelRoles],
      },
      quotaRows: quotaPreview.map((row) => [...row]),
    });
  };
  const generateQuestionnaire = () => {
    setGeneratedRequest({ ...requestForm, objective: objectiveMode === "auto" ? formRoute.primary : objectiveMode });
    setGeneratedObjectiveMode(objectiveMode);
    setGeneratedLanguages(selectedLanguages);
    setClientQuestions([]);
    setQuestionEdits({});
    setDeletedQuestionIds([]);
    setSelectedQuestionModule("全部");
    setEditingQuestionId(null);
    setQuestionnaireWorkbenchMode("edit");
    setFinalQuestionnaire(null);
    setFinalRevision(0);
    setDraftRevision((current) => current + 1);
  };
  const changeMarketPlanScope = (scope: MarketPlanScope) => {
    setMarketPlanScope(scope);
    if (scope !== "china") setSelectedLanguages((current) => current.includes("en") ? current : [...current, "en"]);
  };
  const toggleProjectLanguage = (code: string) => {
    if (code === "zh-CN") return;
    setSelectedLanguages((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  };
  const clientQuestionAssessment = useMemo(() => assessQuestionForMetricSystem(clientQuestionDraft), [clientQuestionDraft]);
  const invalidateFinalQuestionnaire = () => setFinalQuestionnaire(null);
  const addClientQuestion = () => {
    const question = clientQuestionDraft.trim();
    if (!question) return;
    const index = clientQuestions.length + 1;
    setClientQuestions((current) => [...current, {
      module: clientQuestionModule,
      question_id: `PJT_${String(index).padStart(2, "0")}`,
      question_text: question,
      response_type: clientQuestionType,
      options: /开放|数值|说明/.test(clientQuestionType) ? [] : clientQuestionOptions.split("\n").map((item) => item.trim()).filter(Boolean),
      base: "全部有效被访者",
      logic: "按Base条件显示；不满足Base则跳过",
      required: false,
      kpi_ids: [],
      metric_contribution: clientQuestionAssessment.contributionZh,
      model_roles: ["项目解释变量候选"],
      indicator_layer: clientQuestionAssessment.recommendation === "candidate_for_common" ? "通用指标候选" : "项目专项",
      inclusion_recommendation: clientQuestionAssessment.labelZh,
      client_editable: true,
      cadence: "按项目",
    }]);
    invalidateFinalQuestionnaire();
    setClientQuestionDraft("");
  };
  const updateQuestion = (questionId: string, patch: Partial<ResearchQuestion>) => {
    const added = clientQuestions.find((item) => item.question_id === questionId);
    if (added) setClientQuestions((current) => current.map((item) => item.question_id === questionId ? { ...item, ...patch } : item));
    else {
      const baseline = baselineById[questionId];
      if (!baseline) return;
      setQuestionEdits((current) => ({ ...current, [questionId]: { ...(current[questionId] ?? baseline), ...patch } }));
    }
    invalidateFinalQuestionnaire();
  };
  const toggleQuestionDeleted = (questionId: string) => {
    setDeletedQuestionIds((current) => current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId]);
    invalidateFinalQuestionnaire();
  };
  const restoreStandardQuestion = (questionId: string) => {
    setQuestionEdits((current) => { const next = { ...current }; delete next[questionId]; return next; });
    setDeletedQuestionIds((current) => current.filter((item) => item !== questionId));
    invalidateFinalQuestionnaire();
  };
  const finalizeQuestionnaire = () => {
    if (!questionnaireImpact.summary.readyToFinalize) return;
    const nextRevision = finalRevision + 1;
    setFinalRevision(nextRevision);
    setFinalQuestionnaire({
      version: `FINAL-R${nextRevision}`,
      finalizedAt: new Date().toISOString(),
      questions: activeDraftQuestions.map((item) => ({ ...item, options: [...item.options], kpi_ids: [...item.kpi_ids], model_roles: [...item.model_roles] })),
      impacts: questionnaireImpact.impacts.filter((item) => item.changeState !== "deleted"),
      retainedKpis: questionnaireImpact.summary.retainedKpis,
      reviewKpis: questionnaireImpact.summary.reviewKpis,
      removedKpis: questionnaireImpact.summary.removedKpis,
      blockedModelRoles: questionnaireImpact.summary.blockedModelRoles,
    });
  };
  const questionnaireWorkbookRows = (snapshot: FinalQuestionnaire | null = finalQuestionnaire) => {
    const questions = snapshot?.questions ?? activeDraftQuestions;
    const impacts = snapshot?.impacts ?? questionnaireImpact.impacts.filter((item) => item.changeState !== "deleted");
    return [
      ["模块", "题号", "题型", "题目", "选项与Code", "Base", "程序员逻辑", "指标层级", "KPI映射", "模型角色", "版本状态"],
      ...questions.map((item) => {
        const impact = impacts.find((candidate) => candidate.questionId === item.question_id) ?? impactByQuestionId[item.question_id];
        return [item.module, item.question_id, item.response_type, item.question_text, item.options.map((option, index) => `${index + 1} ${option}`).join("\n"), item.base, item.logic, item.indicator_layer, impact?.kpiIds.join(" · ") || "项目专项变量", impact?.modelRoles.join(" · ") || "项目解释变量", impact?.labelZh ?? "待确认"];
      }),
    ];
  };
  const downloadFinalQuestionnaire = () => {
    const snapshot = finalQuestionnaire;
    if (!snapshot) return;
    downloadResearchWorkbook([
      { name: "问卷", rows: questionnaireWorkbookRows(snapshot) },
      { name: "指标与模型影响", rows: [["题号", "变更状态", "适配判断", "影响KPI", "影响模型", "判断依据", "处理建议"], ...snapshot.impacts.map((item) => [item.questionId, item.changeState, item.labelZh, item.kpiIds.join(" · ") || "—", item.modelRoles.join(" · ") || "—", item.reasonZh, item.recommendationZh])] },
      { name: "版本信息", rows: [["项目", "问卷版本", "确认时间", "有效题数", "保留KPI", "待复核KPI", "停止供数KPI"], [generatedRequest.projectName, snapshot.version, snapshot.finalizedAt, snapshot.questions.length, snapshot.retainedKpis.join(" · "), snapshot.reviewKpis.join(" · "), snapshot.removedKpis.join(" · ")]] },
    ], `${generatedRequest.projectName}_${snapshot.version}_问卷.xlsx`);
  };
  const metricValue = (metricId: string) => {
    const values: Record<string, string> = {
      KPI_PENETRATION_3M: `${format(currentKpis.penetration_3m)}%`, KPI_MONTHLY_BUYER: `${format(currentKpis.monthly_buyer_rate)}%`, KPI_PURCHASE_INTENT_T2B: `${format(currentKpis.purchase_intent_t2b)}%`, KPI_FREQUENCY_BUYER: `${format(currentKpis.frequency_buyer, 2)} ${tr(locale, "次/月", "times/month")}`,
      KPI_MONTHLY_SPEND_BUYER: `¥${format(currentKpis.monthly_spend_buyer)}`, KPI_CHANNEL_REACH: tr(locale, "5类渠道分布", "5-channel distribution"), KPI_MAIN_CHANNEL: tr(locale, "5类渠道构成", "5-channel composition"), KPI_OCCASION_REACH: tr(locale, "5类场景分布", "5-occasion distribution"), KPI_NEED_IMPORTANCE: tr(locale, "6项因素均值", "6-factor means"),
      KPI_PRICE_ACCEPT_7_9: `${format(currentKpis.price_accept_7_9)}%`, KPI_PRICE_CURVE: tr(locale, "4个价格点", "4 price points"), KPI_CONCEPT_RELEVANCE_T2B: `${format(currentKpis.concept_relevance_t2b)}%`, KPI_CONCEPT_TRIAL_T2B: `${format(currentKpis.concept_trial_t2b)}%`, KPI_HEALTH_FIT_T2B: `${format(currentKpis.health_fit_t2b)}%`, KPI_UNMET_NEED: format(currentKpis.unmet_need_index), KPI_DCE_UTILITIES: tr(locale, "9项属性系数", "9 attribute coefficients"), KPI_SCENARIO_SHARE: tr(locale, "3个固定方案", "3 fixed scenarios"),
    };
    return values[metricId] ?? "—";
  };

  const viewHeading = view === "project"
    ? tr(locale, "从客户问题生成研究方案", "Turn a client question into a research plan")
    : view === "questionnaire"
      ? tr(locale, "问卷、配额与DP Spec分别设计", "Design the questionnaire, quota and DP Spec separately")
      : view === "kpi"
        ? tr(locale, "通用KPI与重点人群诊断", "Common KPIs and priority-segment diagnostics")
        : tr(locale, "模型结果、驱动因素与产品情景", "Model outputs, drivers and product scenarios");
  const viewNote = view === "questionnaire"
    ? tr(locale, "三类产物分别确认和锁定版本；问卷与配额确定后再锁定分析口径。", "Review and version each artifact separately; lock analysis definitions after the questionnaire and quota.")
    : view === "kpi"
      ? tr(locale, "总体KPI、边际分组与多变量人群估计使用同一指标定义。", "Overall KPIs, marginal cuts and multivariable segment estimates use the same metric definitions.")
      : view === "model"
        ? tr(locale, "模型输出与问卷指标、样本Base和验证结果保持对应。", "Model outputs remain linked to questionnaire metrics, sample bases and validation results.")
        : tr(locale, "从业务问题确定研究任务、样本、模型与交付结果。", "Translate the business question into the research task, sample, model and deliverables.");
  const nextWaveDesign = useMemo(() => production?.meta.status === "ready" ? buildNextWaveResearchDesign(production) : null, [production]);
  const nextWaveVariantKey = NEXT_WAVE_EXPERIMENTS.filter((item) => selectedNextWaveExperiments.includes(item.key)).map((item) => item.key).join("-");
  const nextWaveManifestEntry = NEXT_WAVE_V2_VARIANTS.find((item) => item.key === nextWaveVariantKey) ?? null;
  const nextWaveConfirmationKey = production && nextWaveVariantKey ? `${production.meta.fileName}|${production.meta.processedAt}|${nextWaveVariantKey}|${quotaMode}` : "";
  const nextWaveArtifactsReady = Boolean(nextWaveManifestEntry && lockedProjectDesign?.confirmationKey === nextWaveConfirmationKey);
  const activeDesignVersion = finalQuestionnaire?.version ?? lockedProjectDesign?.finalQuestionnaire?.version ?? "DRAFT";

  useEffect(() => {
    if (!lockedProjectDesign || restoredDesignVersion === lockedProjectDesign.designVersion) return;
    setSelectedNextWaveExperiments(lockedProjectDesign.experimentKeys);
    setQuotaMode(lockedProjectDesign.quotaMode);
    if (lockedProjectDesign.finalQuestionnaire) {
      const snapshot = lockedProjectDesign.finalQuestionnaire;
      const restoredQuestions = snapshot.questions.map((item) => ({
        ...(baselineById[item.questionId] ?? {
          required: false,
          metric_contribution: "用于项目专项分析。",
          inclusion_recommendation: "保留为项目专项题",
          client_editable: true,
          cadence: "按项目",
        }),
        module: item.module,
        question_id: item.questionId,
        question_text: item.questionText,
        response_type: item.responseType,
        options: [...item.options],
        base: item.base,
        logic: item.logic,
        kpi_ids: [...item.kpiIds],
        model_roles: [...item.modelRoles],
        indicator_layer: item.indicatorLayer,
      })) as ResearchQuestion[];
      const restoredIds = new Set(restoredQuestions.map((item) => item.question_id));
      const restoredDeletedIds = baselineQuestions.filter((item) => !restoredIds.has(item.question_id)).map((item) => item.question_id);
      const restoredImpact = summarizeQuestionnaireImpact(restoredQuestions, baselineById, restoredDeletedIds);
      setClientQuestions(restoredQuestions.filter((item) => !baselineById[item.question_id]));
      setQuestionEdits(Object.fromEntries(restoredQuestions.filter((item) => baselineById[item.question_id]).map((item) => [item.question_id, item])));
      setDeletedQuestionIds(restoredDeletedIds);
      setFinalQuestionnaire({
        version: snapshot.version,
        finalizedAt: snapshot.finalizedAt,
        questions: restoredQuestions,
        impacts: restoredImpact.impacts.filter((item) => item.changeState !== "deleted"),
        retainedKpis: [...snapshot.retainedKpis],
        reviewKpis: [...snapshot.reviewKpis],
        removedKpis: [...snapshot.removedKpis],
        blockedModelRoles: [...snapshot.blockedModelRoles],
      });
      setFinalRevision(Number(snapshot.version.match(/R(\d+)$/)?.[1] ?? 1));
    }
    setRestoredDesignVersion(lockedProjectDesign.designVersion);
  }, [lockedProjectDesign, restoredDesignVersion]);

  function toggleNextWaveExperiment(key: NextWaveExperimentKey) {
    setSelectedNextWaveExperiments((current) => current.includes(key) ? current.filter((item) => item !== key) : NEXT_WAVE_EXPERIMENTS.filter((item) => current.includes(item.key) || item.key === key).map((item) => item.key));
  }

  return <div className="snack-stack china-consumer-system">
    <SectionTitle eyebrow={view === "project" || view === "questionnaire" ? "CUSTOM RESEARCH" : "CONSUMER INTELLIGENCE"} title={viewHeading} note={viewNote} />
    {!viewMode && <section className="snack-consumer-modebar"><div>{(["project", "kpi", "questionnaire", "model"] as const).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setInternalView(item)}>{item === "project" ? tr(locale, "项目启动", "Project setup") : item === "kpi" ? tr(locale, "KPI总览", "KPI overview") : item === "questionnaire" ? tr(locale, "问卷与指标", "Questionnaire & metrics") : tr(locale, "模型输出", "Model outputs")}</button>)}</div><span>N={chinaSurveyJson.meta.respondent_count.toLocaleString()}</span></section>}

    {view === "kpi" && <>
      <section className="snack-segment-scope">
        <div><span>{tr(locale, "当前联动人群", "Active linked segment")}</span><strong>{age} · {income} · {region} · {tr(locale, CHANNEL_CONFIG[channel].zh, CHANNEL_CONFIG[channel].en)}</strong><small>{tr(locale, "KPI、结论、价格曲线与后续情景共用同一筛选上下文", "KPIs, readout, price curve and downstream scenarios share one filter context")}</small></div>
        <dl><div><dt>{tr(locale, "估计方法", "Estimate")}</dt><dd>{tr(locale, "多变量分层估计", "Multivariable partial pooling")}</dd></div><div><dt>{tr(locale, "建模样本", "Model base")}</dt><dd>N={segmentEstimate.modelBaseN.toLocaleString()}</dd></div><div><dt>{tr(locale, "近似交叉Base", "Approx. cross-cell base")}</dt><dd>N≈{segmentEstimate.approximateCellBaseN.toLocaleString()}</dd></div><div><dt>{tr(locale, "90%区间", "90% interval")}</dt><dd>±{format(segmentEstimate.interval90Pp)} pp</dd></div></dl>
      </section>
      <section className="snack-kpi-hero">{heroMetrics.map((item, index) => <article key={item.label} className={index < 3 ? "primary" : index === 5 ? "guardrail" : "driver"}><header><span>{item.role}</span><b>{item.question}</b></header><strong>{item.value}</strong><p>{item.label}</p></article>)}</section>
      <section className="snack-kpi-decision"><div><span>KPI READOUT</span><h3>{tr(locale, `当前人群三个月购买率${format(currentKpis.penetration_3m)}%，月度活跃购买者${format(currentKpis.monthly_buyer_rate)}%，未来一个月购买意向${format(currentKpis.purchase_intent_t2b)}%。`, `For the active segment, three-month penetration is ${format(currentKpis.penetration_3m)}%, monthly active buyers ${format(currentKpis.monthly_buyer_rate)}%, and next-month intent ${format(currentKpis.purchase_intent_t2b)}%.`)}</h3><p>{tr(locale, `健康负担满足度为${format(currentKpis.health_fit_t2b)}%；该值与上方筛选同步，由边际分组观测经部分汇聚得到，不解释为直接交叉表结果。`, `Health-fit is ${format(currentKpis.health_fit_t2b)}%. The synchronized estimate uses partial pooling across observed marginal cuts and is not a direct cross-tab result.`)}</p></div><aside><b>{tr(locale, "结果口径", "Result basis")}</b><strong>{tr(locale, "当前人群估计", "Active-segment estimate")}</strong><small>{tr(locale, "总体与边际分组共同建模", "Overall and marginal cuts modeled together")}</small></aside></section>
      <section className="snack-cut-controls"><label><span>{tr(locale, "人群切分", "Subgroup cut")}</span><select value={cutDimension} onChange={(event) => setCutDimension(event.target.value as typeof cutDimension)}>{Object.entries(dimensionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><p>{highlightedGroup ? tr(locale, `顶部筛选中的${selectedCutValue}在图中高亮，Base N=${highlightedGroup.base_n}。`, `${selectedCutValue} from the top filter is highlighted; base N=${highlightedGroup.base_n}.`) : tr(locale, "选择维度查看独立分组；不把多个筛选机械相乘成低Base结论。", "View one controlled cut at a time; filters are not mechanically multiplied into low-base claims.")}</p></section>
      <section className="snack-grid two snack-kpi-chart-grid">
        <article className="snack-panel"><header><div><span>SUBGROUP KPI</span><h3>{dimensionLabels[cutDimension]}：{tr(locale, "边际观测与当前选择", "marginal observations and active selection")}</h3></div></header><div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={subgroupRows} margin={{ top: 18, right: 20, bottom: 16, left: 0 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="value" tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" /><Tooltip content={<ResearchTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="penetration_3m" name={tr(locale, "3个月购买率", "3m penetration")} fill="#2639a5">{subgroupRows.map((item) => <Cell key={`penetration-${item.value}`} opacity={!highlightedGroup || item.value === selectedCutValue ? 1 : .28} />)}</Bar><Bar dataKey="monthly_buyer_rate" name={tr(locale, "月度活跃", "Monthly active")} fill="#0aa59e">{subgroupRows.map((item) => <Cell key={`monthly-${item.value}`} opacity={!highlightedGroup || item.value === selectedCutValue ? 1 : .28} />)}</Bar><Bar dataKey="purchase_intent_t2b" name={tr(locale, "未来意向", "Forward intent")} fill="#ef9c2c">{subgroupRows.map((item) => <Cell key={`intent-${item.value}`} opacity={!highlightedGroup || item.value === selectedCutValue ? 1 : .28} />)}</Bar></BarChart></ResponsiveContainer></div></article>
        <article className="snack-panel"><header><div><span>GABOR-GRANGER</span><h3>{tr(locale, "当前人群70g袋装价格接受曲线", "Active-segment 70g price-acceptance curve")}</h3></div><DataTag tone="simulation">{tr(locale, "分层估计", "Pooled estimate")} · N≈{segmentEstimate.approximateCellBaseN}</DataTag></header><div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={segmentPriceCurve} margin={{ top: 18, right: 24, bottom: 20, left: 0 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="price_cny" tick={{ fontSize: 10 }} unit="元" /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" /><Tooltip content={<ResearchTooltip />} /><ReferenceLine x={7.9} stroke="#ef9c2c" strokeDasharray="4 4" /><Line type="monotone" dataKey="acceptance_rate" name={tr(locale, "考虑购买", "Would consider")} stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div><p className="snack-note">{tr(locale, "曲线随当前年龄、收入、地区与渠道情景更新；公开价格仍保持市场观察口径。", "The curve updates with age, income, region and channel context; observed public prices remain market-level evidence.")}</p></article>
      </section>
      <section className="snack-kpi-definition-table"><header><span>{tr(locale, "指标", "Metric")}</span><span>{tr(locale, "当前值", "Current value")}</span><span>{tr(locale, "题号", "Question")}</span><span>Base</span><span>{tr(locale, "用于决策", "Decision use")}</span></header>{chinaSurveyJson.metric_definitions.map((item) => <div key={item.metric_id}><span><b>{item.name}</b><small>{item.role}</small></span><strong>{metricValue(item.metric_id)}</strong><span>{item.question}</span><span>{item.denominator}</span><p>{item.decision}</p></div>)}</section>
    </>}

    {view === "project" && <>
      <section className="snack-questionnaire-studio">
        <header><div><span>RESEARCH BRIEF → PROJECT DESIGN</span><h3>{tr(locale, "输入业务问题，生成研究方案与交付清单", "Turn a business question into a research and delivery plan")}</h3></div><p>{tr(locale, "系统连接研究任务、问卷、指标、样本、质量控制、模型与结果回流；专业复核设置在会改变结论的关键节点。", "The system connects the task, questionnaire, metrics, sample, quality controls, models and outcomes, with expert review at decision-critical points.")}</p></header>
        <div className="snack-questionnaire-workspace">
          <form onSubmit={(event) => { event.preventDefault(); generateQuestionnaire(); }}>
            <label><span>{tr(locale, "客户名称", "Client")}</span><input value={requestForm.clientName} onChange={(event) => setRequestForm((current) => ({ ...current, clientName: event.target.value }))} /></label>
            <label><span>{tr(locale, "项目名称", "Project")}</span><input value={requestForm.projectName} onChange={(event) => setRequestForm((current) => ({ ...current, projectName: event.target.value }))} /></label>
            <label><span>{tr(locale, "市场范围", "Market scope")}</span><select value={marketPlanScope} onChange={(event) => changeMarketPlanScope(event.target.value as MarketPlanScope)}><option value="china">{tr(locale, "中国", "China")}</option><option value="china_overseas">{tr(locale, "中国 + 海外重点市场", "China + priority overseas markets")}</option><option value="overseas">{tr(locale, "海外重点市场", "Priority overseas markets")}</option></select></label>
            <label><span>{tr(locale, "重点品类", "Category")}</span><select value={requestForm.category} onChange={(event) => setRequestForm((current) => ({ ...current, category: event.target.value }))}><option>膨化食品</option><option>坚果炒货</option><option>干果蜜饯</option></select></label>
            <label><span>{tr(locale, "研究任务", "Research task")}</span><select value={objectiveMode} onChange={(event) => { const value = event.target.value as ResearchObjective | "auto"; setObjectiveMode(value); if (value !== "auto") setRequestForm((current) => ({ ...current, objective: value })); }}><option value="auto">{tr(locale, `AI推荐：${RESEARCH_OBJECTIVES[formRoute.primary].zh}`, `AI route: ${RESEARCH_OBJECTIVES[formRoute.primary].en}`)}</option>{(Object.keys(RESEARCH_OBJECTIVES) as ResearchObjective[]).map((key) => <option key={key} value={key}>{tr(locale, RESEARCH_OBJECTIVES[key].zh, RESEARCH_OBJECTIVES[key].en)}</option>)}</select></label>
            <label><span>{tr(locale, "建议样本量", "Sample")}</span><select value={requestForm.sampleN} onChange={(event) => setRequestForm((current) => ({ ...current, sampleN: Number(event.target.value) }))}><option value={2000}>N=2,000</option><option value={5000}>N=5,000</option><option value={10000}>N=10,000</option></select></label>
            <label className="wide"><span>{tr(locale, "核心业务问题", "Business question")}</span><textarea rows={3} value={requestForm.businessQuestion} onChange={(event) => setRequestForm((current) => ({ ...current, businessQuestion: event.target.value }))} /></label>
            {marketPlanScope !== "china" && <label className="wide"><span>{tr(locale, "海外重点国家", "Priority overseas markets")}</span><input value={priorityMarkets} onChange={(event) => setPriorityMarkets(event.target.value)} /></label>}
            <fieldset className="snack-language-picker wide"><legend>{tr(locale, "问卷语言", "Questionnaire languages")}</legend><div>{PROJECT_LANGUAGE_OPTIONS.map((item) => <label key={item.code} className={selectedLanguages.includes(item.code) ? "selected" : ""}><input type="checkbox" checked={selectedLanguages.includes(item.code)} disabled={item.code === "zh-CN"} onChange={() => toggleProjectLanguage(item.code)} /><span><b>{tr(locale, item.name_zh, item.name_en)}</b><small>{item.status === "master" ? tr(locale, "中文母版", "Master") : item.status === "ready" ? tr(locale, "英文底稿已就绪", "English ready") : tr(locale, "生成本地化工作表并进入语言复核", "Generate localization sheet for linguistic review")}</small></span></label>)}</div><p>{selectedLanguages.some((code) => code !== "zh-CN") ? tr(locale, "已启用中文与英文程序逻辑列；各语言版本共用题号、Code、Base和跳转。", "Chinese and English programmer-logic columns are enabled; all languages share IDs, codes, bases and routing.") : tr(locale, "仅中文问卷：只输出中文程序逻辑列。", "Chinese-only questionnaire: one Chinese programmer-logic column.")}</p></fieldset>
            <label className="wide"><span>{tr(locale, "研究频率", "Cadence")}</span><select value={requestForm.cadence} onChange={(event) => setRequestForm((current) => ({ ...current, cadence: event.target.value }))}><option>单次专项研究</option><option>季度核心追踪；价格与DCE半年轮换</option><option>半年追踪</option></select></label>
            <button type="submit">{tr(locale, "生成研究方案", "Generate research plan")}</button>
          </form>
          <aside>
            <span>{tr(locale, "当前生成结果", "Generated draft")} · V{draftRevision}</span>
            <h4>{generatedRequest.projectName}</h4>
            <p>{generatedRequest.businessQuestion}</p>
            <dl><div><dt>{tr(locale, "问卷", "Questions")}</dt><dd>{generatedQuestions.length} {tr(locale, "项", "items")}</dd></div><div><dt>{tr(locale, "指标", "Metrics")}</dt><dd>{generatedMetrics.length}</dd></div><div><dt>{tr(locale, "语言", "Languages")}</dt><dd>{generatedLanguages.length}</dd></div><div><dt>{tr(locale, "样本", "Sample")}</dt><dd>N={generatedRequest.sampleN.toLocaleString()}</dd></div></dl>
            <div className="snack-questionnaire-model-route"><small>{tr(locale, "推荐主模型", "Primary model")}</small><strong>{tr(locale, knowledgeProfile.primary_model, knowledgeProfile.primary_model_en)}</strong><small>{tr(locale, "辅助模型", "Supporting model")}</small><strong>{tr(locale, knowledgeProfile.supporting_model, knowledgeProfile.supporting_model_en)}</strong><p>{tr(locale, knowledgeProfile.output, knowledgeProfile.output_en)}</p></div>
          </aside>
        </div>
        <section className="snack-project-evidence-intake">
          <header><div><span>EVIDENCE INVENTORY</span><h4>{tr(locale, "登记已有研究资料，决定哪些分析现在可做", "Register available evidence to determine what can be done now")}</h4></div><strong>{availableEvidence.length} / {researchProjectSystemJson.evidence_requirements.length}</strong></header>
          <div>{researchProjectSystemJson.evidence_requirements.map((item) => { const stageLabel = PROJECT_STAGE_LABELS[item.phase as keyof typeof PROJECT_STAGE_LABELS]; const phaseName = stageLabel ? tr(locale, stageLabel.zh, stageLabel.en) : item.phase === "calibration" ? tr(locale, "外部校验", "External validation") : item.phase; return <label key={item.evidence_id} className={availableEvidence.includes(item.evidence_id) ? "selected" : ""}><input type="checkbox" checked={availableEvidence.includes(item.evidence_id)} onChange={() => toggleEvidence(item.evidence_id)} /><span><b>{tr(locale, item.name, item.name_en)}</b><small>{tr(locale, item.enables, item.enables_en)}</small></span><em>{phaseName}</em></label>; })}</div>
          <p>{tr(locale, "登记往期问卷、Raw Data、Table、产品方案和结果回流，用于复用口径并判断本次可执行的分析。", "Register prior questionnaires, Raw Data, tables, product proposals and outcome feedback to reuse definitions and determine the analyses available now.")}</p>
        </section>
        <section className="snack-ai-route-panel">
          <header><div><span>AI RESEARCH ROUTING</span><h4>{tr(locale, "从业务问题确定研究任务、模型与可交付结果", "Route the business question to a research task, model and deliverables")}</h4></div><DataTag tone={generatedRoute.needsReview ? "gap" : "official"}>{generatedRoute.needsReview ? tr(locale, "建议人工确认", "Review suggested") : tr(locale, "推荐清晰", "Clear route")}</DataTag></header>
          <div className="snack-ai-route-body">
            <article className="snack-ai-route-decision"><span>{generatedObjectiveMode === "auto" ? tr(locale, "AI推荐并采用", "AI recommended and selected") : tr(locale, "人工选择路线", "Manually selected route")}</span><strong>{tr(locale, objective.zh, objective.en)}</strong><b>{selectedRouteScore} / 100 {tr(locale, "路由匹配度", "route fit")}</b><p>{tr(locale, knowledgeProfile.decision_question, knowledgeProfile.decision_question_en)}</p><small>{tr(locale, "模型路线", "Model route")}：{tr(locale, knowledgeProfile.primary_model, knowledgeProfile.primary_model_en)} + {tr(locale, knowledgeProfile.supporting_model, knowledgeProfile.supporting_model_en)}</small></article>
            <div className="snack-route-ranking"><b>{tr(locale, "候选任务排序", "Task ranking")}</b>{generatedRoute.ranked.map((item) => <div key={item.objective} className={item.objective === generatedRequest.objective ? "selected" : ""}><span>{tr(locale, RESEARCH_OBJECTIVES[item.objective].zh, RESEARCH_OBJECTIVES[item.objective].en)}</span><i><em style={{ width: `${item.score}%` }} /></i><strong>{item.score}</strong><small>{item.matchedTerms.slice(0, 3).join(" · ") || tr(locale, "弱匹配", "weak match")}</small></div>)}</div>
            <div className="snack-delivery-gates"><b>{tr(locale, "分阶段可以产出什么", "Outputs by evidence stage")}</b>{knowledgeProfile.delivery_gates.map((item) => <article key={item.stage}><span className={item.status}>{tr(locale, item.stage, item.stage_en)}</span><p>{tr(locale, item.output, item.output_en)}</p></article>)}</div>
          </div>
        </section>
        <section className="snack-project-plan">
          <header><div><span>PROJECT OPERATING PLAN</span><h4>{tr(locale, "从研究设计到真实结果回流", "From research design to outcome calibration")}</h4></div><DataTag tone={projectPlan.missingPriorityEvidence.length ? "gap" : "official"}>{projectPlan.missingPriorityEvidence.length ? tr(locale, "部分依据待补", "Evidence pending") : tr(locale, "关键依据已登记", "Priority evidence registered")}</DataTag></header>
          <div className="snack-project-plan-metrics">
            <article><span>{tr(locale, "总体抽样误差参考", "Overall precision reference")}</span><strong>±{projectPlan.precision95Pp} pp</strong><small>95% · p=50% · SRS {tr(locale, "参考", "reference")}</small></article>
            <article><span>{tr(locale, "互斥分组容量参考", "Mutually exclusive cut capacity")}</span><strong>{projectPlan.stableMutuallyExclusiveGroups}</strong><small>{tr(locale, "组 × Base≥400；不用于多维交叉", "groups × Base≥400; not multi-way crosses")}</small></article>
            <article><span>{tr(locale, "研究市场", "Research markets")}</span><strong>{projectPlan.marketCount}</strong><small>{marketPlanScope === "china" ? tr(locale, "中国", "China") : priorityMarkets}</small></article>
            <article><span>{tr(locale, "指标结构", "Metric architecture")}</span><strong>{generatedMetrics.length}</strong><small>{projectPlan.metricRoles.primary ?? 0} {tr(locale, "主KPI", "primary")} · {projectPlan.metricRoles.driver ?? 0} {tr(locale, "驱动", "drivers")} · {projectPlan.metricRoles.guardrail ?? 0} {tr(locale, "护栏", "guardrails")}</small></article>
          </div>
          <div className="snack-project-stage-chain">{projectPlan.byStage.map((item, index) => <article key={item.stage} className={item.status}><b>{String(index + 1).padStart(2, "0")}</b><span>{tr(locale, PROJECT_STAGE_LABELS[item.stage].zh, PROJECT_STAGE_LABELS[item.stage].en)}</span><strong>{item.ready}/{item.total}</strong><small>{item.status === "ready" ? tr(locale, "当前可交付", "Ready now") : item.status === "planned" ? tr(locale, "方案已建立", "Plan established") : tr(locale, "等待对应数据", "Waiting for evidence")}</small></article>)}</div>
          <div className="snack-research-quality-layer">
            <header><span>RESEARCH QUALITY LAYER</span><h5>{tr(locale, "关键复核覆盖业务口径、问卷、样本与洞察", "Decision, questionnaire, sample and insight review")}</h5></header>
            <div>{researchProjectSystemJson.research_checkpoints.map((item) => <article key={item.checkpoint_id}><b>{item.checkpoint_id}</b><strong>{tr(locale, item.name, item.name_en)}</strong><span>{tr(locale, item.role, item.role_en)}</span><p>{tr(locale, item.value, item.value_en)}</p></article>)}</div>
          </div>
          <div className="snack-delivery-manifest">
            <header><div><span>DELIVERY MANIFEST</span><h5>{tr(locale, "当前能交付什么，还缺什么证据", "What is deliverable now and what evidence is still missing")}</h5></div><nav><button className={deliveryStage === "all" ? "active" : ""} onClick={() => setDeliveryStage("all")}>{tr(locale, "全部", "All")}</button>{(Object.keys(PROJECT_STAGE_LABELS) as Array<keyof typeof PROJECT_STAGE_LABELS>).map((stage) => <button key={stage} className={deliveryStage === stage ? "active" : ""} onClick={() => setDeliveryStage(stage)}>{tr(locale, PROJECT_STAGE_LABELS[stage].zh, PROJECT_STAGE_LABELS[stage].en)}</button>)}</nav></header>
            <div className="snack-delivery-table"><header><span>{tr(locale, "阶段 / 交付物", "Stage / deliverable")}</span><span>{tr(locale, "负责人", "Owner")}</span><span>{tr(locale, "验收标准", "Acceptance")}</span><span>{tr(locale, "状态 / 缺少证据", "Status / missing evidence")}</span></header>{visibleDeliverables.map((item) => <article key={item.deliverable_id}><div><small>{tr(locale, PROJECT_STAGE_LABELS[item.phase].zh, PROJECT_STAGE_LABELS[item.phase].en)} · {item.deliverable_id}</small><strong>{tr(locale, item.name, item.name_en)}</strong></div><span>{tr(locale, item.owner, item.owner_en)}</span><p>{tr(locale, item.acceptance, item.acceptance_en)}</p><div className={item.status}><b>{item.status === "ready" ? tr(locale, "可生成 / 可交付", "Ready") : item.status === "planned" ? tr(locale, "方案已建立", "Planned") : tr(locale, "等待数据", "Waiting")}</b><small>{item.missingEvidence.map((key) => evidenceName[key]).join(" · ") || tr(locale, "无新增证据要求", "No additional evidence required")}</small></div></article>)}</div>
          </div>
        </section>
        <section className="snack-questionnaire-evidence">
          <header><div><span>RETRIEVAL EVIDENCE</span><h4>{tr(locale, "本次问卷与模型路线的生成依据", "Evidence behind this questionnaire and model route")}</h4></div><strong>{DATA_COUNTS.researchKnowledgeItems} {tr(locale, "条知识", "knowledge items")}</strong></header>
          <div className="snack-knowledge-counts">
            <article><strong>{knowledgeCounts.question_template}</strong><span>{tr(locale, "问卷题组", "question templates")}</span></article>
            <article><strong>{knowledgeCounts.metric_definition}</strong><span>{tr(locale, "指标定义", "metric definitions")}</span></article>
            <article><strong>{knowledgeCounts.model_method}</strong><span>{tr(locale, "模型方法", "model methods")}</span></article>
            <article><strong>{knowledgeCounts.historical_project_structure}</strong><span>{tr(locale, "历史项目结构", "historical project structures")}</span></article>
          </div>
          <div className="snack-knowledge-evidence-list">{knowledgeEvidence.map((item, index) => {
            const kindLabel = item.kind === "model_method" ? tr(locale, "模型方法", "Model method") : item.kind === "research_capability" ? tr(locale, "研究方法", "Research method") : item.kind === "metric_definition" ? tr(locale, "指标口径", "Metric definition") : tr(locale, "问卷题组", "Question block");
            const influences = [item.influence.questionnaire && tr(locale, "问卷", "Questionnaire"), item.influence.metric_system && tr(locale, "指标", "Metrics"), item.influence.model_route && tr(locale, "模型", "Model")].filter(Boolean);
            return <article key={item.knowledge_id}><b>{String(index + 1).padStart(2, "0")} · {kindLabel}</b><strong>{item.title}</strong><p>{tr(locale, "关联词", "Matched terms")}：{item.matched_terms.join(" · ") || "—"}</p><small>{tr(locale, "影响", "Influences")}：{influences.join(" / ")}</small></article>;
          })}</div>
          <footer><div><b>{tr(locale, "模型训练门槛", "Model training gate")}</b><p>{tr(locale, knowledgeProfile.training_gate, knowledgeProfile.training_gate_en)}</p></div><div><b>{tr(locale, "当前学习状态", "Current learning state")}</b><p>{tr(locale, "已完成研究内容检索与推荐排序；真实结果接入后进行预测模型训练和样本外验证。", "Research retrieval and recommendation ranking are active; predictive training and holdout validation begin after real outcomes are connected.")}</p></div></footer>
        </section>
        <footer><div><strong>{tr(locale, "项目范围已生成", "Project scope generated")}</strong><span>{tr(locale, "进入第02步后，分别完成问卷、配额表和DP Spec的设计与确认。", "Continue to step 02 to design and review the questionnaire, quota table and DP Spec independently.")}</span></div></footer>
      </section>
    </>}

    {view === "questionnaire" && <>
      {nextWaveDesign && production ? <section className="next-wave-design-bridge">
        <header><div><span>RESULT → NEXT DESIGN</span><h3>{tr(locale, "将当前证据转成下一期研究设计", "Turn current evidence into the next-wave research design")}</h3><p>{production.meta.fileName} · N={production.meta.eligibleRowCount.toLocaleString()} · {tr(locale, "不改写稳定通用题号", "stable shared IDs remain unchanged")}</p></div><button type="button" onClick={() => downloadHtmlDocument(buildNextWaveResearchDesignDocument(production, locale), tr(locale, "中国薄脆饼干新品研究_下一期研究设计.html", "China_cracker_next_wave_research_design.html"))}>{tr(locale, "下载下一期研究设计", "Download next-wave design")}</button></header>
        <div className="next-wave-design-overview"><article><span>{tr(locale, "稳定通用题", "Stable shared questions")}</span><strong>{nextWaveDesign.stableCore.questionIds.join(" · ")}</strong><small>{tr(locale, "题号、Code、Base、时间窗和统计口径保持不变", "IDs, codes, bases, time windows and statistics remain fixed")}</small></article><article><span>{tr(locale, "当前配额", "Current quota")}</span><strong>{tr(locale, selectedQuota.zh, selectedQuota.en)}</strong><small>{nextWaveDesign.samplePlan.requiresBoost ? tr(locale, "重点人群Base不足，建议增样", "Priority-segment boost recommended") : tr(locale, "Base充足，不机械增样", "Base is sufficient; no mechanical oversampling")}</small></article><article><span>{tr(locale, "优先人群Base", "Priority-segment base")}</span><strong>{nextWaveDesign.samplePlan.prioritySegment} · N={nextWaveDesign.samplePlan.currentBaseN.toLocaleString()}</strong><small>{tr(locale, `独立分析参考N=${nextWaveDesign.samplePlan.minimumIndependentBaseN}`, `Independent-analysis reference N=${nextWaveDesign.samplePlan.minimumIndependentBaseN}`)}</small></article></div>
        <div className="next-wave-design-actions">{nextWaveDesign.actions.filter((item) => item.layer === "项目专项").map((item) => {
          const experiment = NEXT_WAVE_EXPERIMENTS.find((candidate) => item.questionIds.includes(candidate.primaryQuestionId));
          if (!experiment) return null;
          const selected = selectedNextWaveExperiments.includes(experiment.key);
          return <label className={`project ${selected ? "selected" : ""}`} key={item.code}><input type="checkbox" checked={selected} onChange={() => toggleNextWaveExperiment(experiment.key)} /><header><b>{item.code}</b><span>{tr(locale, "项目专项", "Project-specific")}</span></header><h4>{tr(locale, item.titleZh, item.titleEn)}</h4><p>{tr(locale, item.evidenceZh, item.evidenceEn)}</p><strong>{tr(locale, item.designZh, item.designEn)}</strong><footer><span>{item.questionIds.join(" · ")}</span><span>{selected ? tr(locale, "已选入V2", "Included in V2") : tr(locale, "本期不纳入", "Excluded this wave")}</span></footer></label>;
        })}</div>
        <section className="next-wave-confirmation"><div><span>V2 DESIGN LOCK</span><h4>{tr(locale, "确认本期专项实验与配额后生成三个独立文件", "Confirm experiments and quota, then generate three separate files")}</h4><p>{tr(locale, `${selectedNextWaveExperiments.length}个专项实验 · ${selectedNextWaveExperiments.flatMap((key) => NEXT_WAVE_EXPERIMENTS.find((item) => item.key === key)?.primaryQuestionId ?? []).length}组实验变量 · ${selectedQuota.zh}`, `${selectedNextWaveExperiments.length} project experiments · ${selectedQuota.en}`)}</p></div><button type="button" disabled={!nextWaveManifestEntry || !production || nextWaveArtifactsReady} onClick={() => { if (!nextWaveManifestEntry || !production || !onProjectDesignLocked) return; onProjectDesignLocked({ projectId: "SNACK-CN-CRACKER-001", artifactVersion: "V2", confirmationKey: nextWaveConfirmationKey, sampleN: generatedRequest.sampleN, quotaMode, experimentKeys: [...selectedNextWaveExperiments], experimentQuestionIds: [...nextWaveManifestEntry.experimentQuestionIds], sourceProductionFile: production.meta.fileName, sourceProductionProcessedAt: production.meta.processedAt, files: { questionnaire: nextWaveManifestEntry.files.questionnaire, quota: nextWaveManifestEntry.files.quota[quotaMode], dpSpec: nextWaveManifestEntry.files.dpSpec } }); }}>{nextWaveArtifactsReady ? tr(locale, "V2已锁定", "V2 locked") : tr(locale, "确认并生成V2", "Confirm and generate V2")}</button></section>
        {nextWaveArtifactsReady && nextWaveManifestEntry ? <section className="next-wave-v2-downloads"><a href={publicAssetPath(nextWaveManifestEntry.files.questionnaire)} download><span>01</span><strong>{tr(locale, "问卷 V2", "Questionnaire V2")}</strong><small>{tr(locale, "题目 · 选项 · Base · 程序逻辑 · 指标映射", "Items · options · bases · logic · metric mapping")}</small></a><a href={publicAssetPath(nextWaveManifestEntry.files.quota[quotaMode])} download><span>02</span><strong>{tr(locale, "配额表 V2", "Quota table V2")}</strong><small>{tr(locale, `${selectedQuota.zh} · 实验组随机分配监测`, `${selectedQuota.en} · experiment-cell monitoring`)}</small></a><a href={publicAssetPath(nextWaveManifestEntry.files.dpSpec)} download><span>03</span><strong>DP Spec V2</strong><small>General · Spec · Banner · Grid</small></a></section> : null}
        <footer><p>{tr(locale, "通用核心保持可比；PJT_*只进入本项目Table与专项模型。", "The shared core remains comparable; PJT_* feeds only this project's tables and models.")}</p><p>{tr(locale, "改变专项实验或配额后需要重新确认，已锁定的V1文件不会被覆盖。", "Changing experiments or quota requires reconfirmation; locked V1 files are never overwritten.")}</p></footer>
      </section> : null}
      <section className="research-design-hub">
        <header><div><span>RESEARCH DESIGN</span><h3>{tr(locale, "选择当前要设计和确认的产物", "Select the artifact to design and review")}</h3></div><p>{tr(locale, "每类产物保持独立版本与下载入口。", "Each artifact keeps its own version and download.")}</p></header>
        <nav className="research-design-tabs">
          <button type="button" className={designArtifact === "questionnaire" ? "active" : ""} onClick={() => setDesignArtifact("questionnaire")}><b>01</b><span>{tr(locale, "问卷设计", "Questionnaire design")}</span><small>{tr(locale, "题目、选项、Base、逻辑与指标映射", "Items, options, bases, logic and KPI mapping")}</small></button>
          <button type="button" className={designArtifact === "quota" ? "active" : ""} onClick={() => setDesignArtifact("quota")}><b>02</b><span>{tr(locale, "配额设计", "Quota design")}</span><small>{tr(locale, "选择配额方式并锁定目标样本结构", "Select one approach and lock target sample cells")}</small></button>
          <button type="button" className={designArtifact === "dp_spec" ? "active" : ""} onClick={() => setDesignArtifact("dp_spec")}><b>03</b><span>DP Spec</span><small>General · Spec · Banner · Grid</small></button>
        </nav>
      </section>

      {designArtifact === "questionnaire" && <section className="design-artifact-panel questionnaire-artifact">
        <header className="design-artifact-header"><div><span>QUESTIONNAIRE · {activeDesignVersion}</span><h3>{tr(locale, "问卷编辑、指标校验与Final版本", "Question editing, metric validation and Final version")}</h3><p>{tr(locale, "先编辑甄别与主问卷；每次修改即时重算KPI和模型影响，确认后生成Final问卷。", "Edit the screener and main questionnaire first; each change recalculates KPI and model impact before Finalization.")}</p></div><div className="questionnaire-header-actions"><button type="button" className="secondary" disabled={!finalQuestionnaire} onClick={downloadFinalQuestionnaire}>{tr(locale, "下载Final问卷", "Download Final questionnaire")}</button><button type="button" disabled={!questionnaireImpact.summary.readyToFinalize} onClick={finalizeQuestionnaire}>{finalQuestionnaire ? tr(locale, "重新确认Final", "Finalize revision") : tr(locale, "确认Final问卷", "Finalize questionnaire")}</button></div></header>
        <section className="questionnaire-editor-status"><article><span>{tr(locale, "当前草稿", "Current draft")}</span><strong>{activeDraftQuestions.length}</strong><small>{modules.length} {tr(locale, "个模块", "modules")} · {objective.minutes} {tr(locale, "分钟", "min")}</small></article><article><span>{tr(locale, "本次变更", "Changes")}</span><strong>{questionnaireImpact.summary.modifiedQuestions + questionnaireImpact.summary.addedQuestions + questionnaireImpact.summary.deletedQuestions}</strong><small>{questionnaireImpact.summary.modifiedQuestions} {tr(locale, "修改", "edited")} · {questionnaireImpact.summary.addedQuestions} {tr(locale, "新增", "added")} · {questionnaireImpact.summary.deletedQuestions} {tr(locale, "删除", "removed")}</small></article><article><span>{tr(locale, "指标状态", "Metric status")}</span><strong>{questionnaireImpact.summary.retainedKpis.length}</strong><small>{questionnaireImpact.summary.reviewKpis.length} {tr(locale, "待复核", "review")} · {questionnaireImpact.summary.removedKpis.length} {tr(locale, "停止供数", "removed")}</small></article><article><span>{tr(locale, "Final版本", "Final version")}</span><strong>{finalQuestionnaire?.version ?? "—"}</strong><small>{finalQuestionnaire ? new Date(finalQuestionnaire.finalizedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB") : tr(locale, "修改完成后确认", "Finalize after editing")}</small></article></section>

        <section className="questionnaire-view-toolbar">
          <div><span>{tr(locale, "工作方式", "Workspace mode")}</span><strong>{questionnaireWorkbenchMode === "edit" ? tr(locale, "编辑问卷", "Edit questionnaire") : tr(locale, "受访者预览", "Respondent preview")}</strong></div>
          <nav><button type="button" className={questionnaireWorkbenchMode === "edit" ? "active" : ""} onClick={() => setQuestionnaireWorkbenchMode("edit")}>{tr(locale, "编辑", "Edit")}</button><button type="button" className={questionnaireWorkbenchMode === "preview" ? "active" : ""} onClick={() => setQuestionnaireWorkbenchMode("preview")}>{tr(locale, "预览", "Preview")}</button></nav>
          <p>{tr(locale, `预计${objective.minutes}分钟 · ${activeDraftQuestions.length}题 · ${modules.length}个模块 · ${QUESTION_TYPE_OPTIONS.length}类题型`, `Estimated ${objective.minutes} min · ${activeDraftQuestions.length} questions · ${modules.length} sections · ${QUESTION_TYPE_OPTIONS.length} item types`)}</p>
        </section>

        <section className={`questionnaire-workbench ${questionnaireWorkbenchMode === "preview" ? "preview-active" : ""}`}>
          <section className="questionnaire-respondent-preview">
            <header><div><span>{previewQuestion?.module ?? tr(locale, "问卷预览", "Questionnaire preview")}</span><strong>{previewQuestion ? `${previewQuestion.question_id} · ${previewQuestionIndex + 1}/${previewQuestions.length}` : "—"}</strong></div><i><b style={{ width: `${previewQuestions.length ? ((previewQuestionIndex + 1) / previewQuestions.length) * 100 : 0}%` }} /></i></header>
            {previewQuestion ? <div className="respondent-question-card"><small>{previewQuestion.response_type} · Base: {previewQuestion.base}</small><h4>{locale === "en" ? QUESTION_TRANSLATIONS[previewQuestion.question_id]?.text_en ?? previewQuestion.question_text : previewQuestion.question_text}</h4>{previewQuestion.options.length ? <div className="respondent-option-list">{previewQuestion.options.map((option, index) => { const route = optionRoute(previewQuestion, option, index); return <label key={`${previewQuestion.question_id}-${index}`}><input type={previewQuestion.response_type === "多选" ? "checkbox" : "radio"} name={`preview-${previewQuestion.question_id}`} /><span><b>{index + 1}</b>{option}</span>{route && <em className={route === tr(locale, "终止", "Disqualify") ? "terminate" : route === tr(locale, "条件路由", "Conditional route") ? "conditional" : "continue"}>{route}</em>}</label>; })}</div> : <textarea aria-label={tr(locale, "回答预览", "Response preview")} placeholder={previewQuestion.response_type === "说明文本" ? tr(locale, "说明文本不要求作答", "No response is required") : tr(locale, "请在此输入回答", "Enter response here")} disabled={previewQuestion.response_type === "说明文本"} />}</div> : <div className="respondent-preview-empty">{tr(locale, "当前模块没有有效题目。", "No active questions in this section.")}</div>}
            <footer><button type="button" disabled={previewQuestionIndex === 0} onClick={() => setPreviewQuestionIndex((current) => Math.max(0, current - 1))}>{tr(locale, "上一题", "Previous")}</button><span>{previewQuestion?.logic ?? "—"}</span><button type="button" disabled={!previewQuestions.length || previewQuestionIndex >= previewQuestions.length - 1} onClick={() => setPreviewQuestionIndex((current) => Math.min(previewQuestions.length - 1, current + 1))}>{tr(locale, "下一题", "Next")}</button></footer>
          </section>
          <aside className="questionnaire-outline"><header><span>STRUCTURE</span><strong>{tr(locale, "问卷目录", "Questionnaire outline")}</strong></header><button type="button" className={selectedQuestionModule === "全部" ? "active" : ""} onClick={() => setSelectedQuestionModule("全部")}><span>{tr(locale, "全部题目", "All questions")}</span><b>{generatedQuestions.length}</b></button><div><small>SCREENER</small>{modules.filter((item) => item.module === "甄别与配额").map((item) => <button type="button" key={item.module} className={selectedQuestionModule === item.module ? "active" : ""} onClick={() => setSelectedQuestionModule(item.module)}><span>{item.module}</span><b>{item.count}</b></button>)}</div><div><small>MAIN QUESTIONNAIRE</small>{modules.filter((item) => item.module !== "甄别与配额").map((item) => <button type="button" key={item.module} className={selectedQuestionModule === item.module ? "active" : ""} onClick={() => setSelectedQuestionModule(item.module)}><span>{item.module}</span><b>{item.count}</b></button>)}</div></aside>
          <div className="questionnaire-editor-list"><header><div><span>{selectedQuestionModule === "全部" ? tr(locale, "全部题目", "All questions") : selectedQuestionModule}</span><strong>{visibleQuestions.length} {tr(locale, "项", "items")}</strong></div><p>{tr(locale, "Screener选项可定义继续或终止；主问卷题目保持题号、Base与Raw字段映射。", "Screener options can route or terminate; main questions retain IDs, bases and Raw field mappings.")}</p></header>{visibleQuestions.map((item) => { const impact = impactByQuestionId[item.question_id]; const deleted = deletedQuestionIds.includes(item.question_id); const editing = editingQuestionId === item.question_id; return <article key={item.question_id} className={`question-editor-card ${deleted ? "deleted" : ""} ${editing ? "editing" : ""}`} data-question-id={item.question_id}><header><div><b>{item.question_id}</b><span>{item.module}</span><em className={impact.fit}>{impact.labelZh}</em></div><nav><button type="button" onClick={() => setEditingQuestionId(editing ? null : item.question_id)} disabled={deleted}>{editing ? tr(locale, "收起", "Close") : tr(locale, "编辑", "Edit")}</button><button type="button" onClick={() => toggleQuestionDeleted(item.question_id)}>{deleted ? tr(locale, "恢复", "Restore") : tr(locale, "删除", "Remove")}</button>{impact.changeState === "modified" && <button type="button" onClick={() => restoreStandardQuestion(item.question_id)}>{tr(locale, "恢复标准题", "Reset")}</button>}</nav></header>{editing ? <div className="question-edit-form"><label className="wide"><span>{tr(locale, "题目", "Question")}</span><textarea value={item.question_text} onChange={(event) => updateQuestion(item.question_id, { question_text: event.target.value })} /></label><label><span>{tr(locale, "模块", "Module")}</span><select value={item.module} onChange={(event) => updateQuestion(item.question_id, { module: event.target.value })}>{Array.from(new Set([...objectiveModules, "项目补充"])).map((module) => <option key={module}>{module}</option>)}</select></label><label><span>{tr(locale, "题型", "Question type")}</span><select value={item.response_type} onChange={(event) => updateQuestion(item.question_id, { response_type: event.target.value })}><option>单选</option><option>多选</option><option>5点量表</option><option>数值</option><option>开放题</option></select></label><label className="wide"><span>{tr(locale, "选项（每行一个，顺序即Code）", "Options (one per line; order sets code)")}</span><textarea value={item.options.join("\n")} onChange={(event) => updateQuestion(item.question_id, { options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) })} /></label><label><span>Base</span><input value={item.base} onChange={(event) => updateQuestion(item.question_id, { base: event.target.value })} /></label><label><span>{tr(locale, "程序员逻辑", "Programmer logic")}</span><input value={item.logic} onChange={(event) => updateQuestion(item.question_id, { logic: event.target.value })} /></label></div> : <div className="question-card-body"><div><strong>{locale === "en" ? QUESTION_TRANSLATIONS[item.question_id]?.text_en ?? item.question_text : item.question_text}</strong><p>{item.response_type} · {item.options.map((option, index) => `${index + 1} ${option}`).join(" / ") || tr(locale, "开放回答", "Open response")}</p></div><dl><div><dt>Base</dt><dd>{item.base}</dd></div><div><dt>{tr(locale, "程序逻辑", "Routing")}</dt><dd>{locale === "en" ? QUESTION_PROGRAMMING[item.question_id]?.programmer_logic_en ?? item.logic : QUESTION_PROGRAMMING[item.question_id]?.programmer_logic ?? item.logic}</dd></div></dl></div>}<footer><div><span>KPI</span><strong>{impact.kpiIds.join(" · ") || tr(locale, "项目专项变量", "Project variable")}</strong></div><div><span>{tr(locale, "模型", "Models")}</span><strong>{impact.modelRoles.join(" · ") || tr(locale, "项目解释变量", "Project explanatory variable")}</strong></div><p>{impact.reasonZh}<small>{impact.recommendationZh}</small></p></footer></article>; })}</div>
        </section>

        <section className="question-add-composer"><header><div><span>ADD CONTENT</span><h4>{tr(locale, "新增项目问题", "Add a project question")}</h4></div><aside className={clientQuestionAssessment.recommendation}><strong>{clientQuestionAssessment.labelZh}</strong><p>{clientQuestionAssessment.contributionZh}</p></aside></header><div><label><span>{tr(locale, "模块", "Section")}</span><select value={clientQuestionModule} onChange={(event) => setClientQuestionModule(event.target.value)}>{Array.from(new Set([...objectiveModules, "项目补充"])).map((module) => <option key={module}>{module}</option>)}</select></label><label><span>{tr(locale, "题型", "Question type")}</span><select value={clientQuestionType} onChange={(event) => setClientQuestionType(event.target.value)}><option>单选</option><option>多选</option><option>5点量表</option><option>数值</option><option>开放题</option></select></label><label className="wide"><span>{tr(locale, "题目", "Question")}</span><textarea value={clientQuestionDraft} onChange={(event) => setClientQuestionDraft(event.target.value)} placeholder={tr(locale, "例如：过去3个月，您购买零食时最常使用哪个渠道？", "Example: Which channel did you use most often to buy snacks in the past three months?")} /></label>{!clientQuestionType.includes("开放") && clientQuestionType !== "数值" && <label className="wide"><span>{tr(locale, "选项（每行一个）", "Options (one per line)")}</span><textarea value={clientQuestionOptions} onChange={(event) => setClientQuestionOptions(event.target.value)} /></label>}<button type="button" onClick={addClientQuestion} disabled={!clientQuestionDraft.trim()}>{tr(locale, "加入问卷并分析指标影响", "Add and analyze metric impact")}</button></div></section>

        <section className="questionnaire-impact-ledger"><header><div><span>QUALITY CHECK</span><h4>{tr(locale, "KPI与模型影响", "KPI and model impact")}</h4></div><strong>{questionnaireImpact.summary.retainedKpis.length} {tr(locale, "项KPI保持供数", "KPIs retained")}</strong></header><div><article className="retained"><span>{tr(locale, "保持可比", "Retained")}</span><strong>{questionnaireImpact.summary.retainedKpis.length}</strong><p>{questionnaireImpact.summary.retainedKpis.join(" · ") || "—"}</p></article><article className="review"><span>{tr(locale, "待口径复核", "Review")}</span><strong>{questionnaireImpact.summary.reviewKpis.length}</strong><p>{questionnaireImpact.summary.reviewKpis.join(" · ") || "—"}</p></article><article className="incompatible"><span>{tr(locale, "停止向模型供数", "No longer feeds model")}</span><strong>{questionnaireImpact.summary.removedKpis.length}</strong><p>{questionnaireImpact.summary.removedKpis.join(" · ") || "—"}</p></article><article><span>{tr(locale, "受阻模型变量", "Blocked model roles")}</span><strong>{questionnaireImpact.summary.blockedModelRoles.length}</strong><p>{questionnaireImpact.summary.blockedModelRoles.join(" · ") || "—"}</p></article></div><footer><p>{finalQuestionnaire ? tr(locale, `${finalQuestionnaire.version}已生成；继续修改会回到草稿状态。`, `${finalQuestionnaire.version} is ready; further edits return the workbench to draft.`) : tr(locale, "确认Final后，配额设计与DP Spec才会读取这一版问卷。", "Quota design and the DP Spec read this questionnaire only after Finalization.")}</p><button type="button" disabled={!questionnaireImpact.summary.readyToFinalize} onClick={finalizeQuestionnaire}>{tr(locale, "确认Final问卷", "Finalize questionnaire")}</button></footer></section>
      </section>}

      {designArtifact === "quota" && <section className="design-artifact-panel quota-artifact">
        <header className="design-artifact-header"><div><span>QUOTA TABLE · {activeDesignVersion}</span><h3>{tr(locale, "基于Final问卷设计配额", "Design quotas from the Final questionnaire")}</h3><p>{finalQuestionnaire ? tr(locale, `${finalQuestionnaire.version}已锁定${finalQuestionnaire.questions.length}个题目；配额字段只读取该版本。`, `${finalQuestionnaire.version} contains ${finalQuestionnaire.questions.length} locked questions; quota fields read only this version.`) : tr(locale, "请先在问卷设计中确认Final版本。", "Finalize the questionnaire before designing quotas.")}</p></div><button type="button" disabled={!finalQuestionnaire} onClick={downloadQuotaWorkbook}>{tr(locale, "下载配额表", "Download quota table")}</button></header>
        {!finalQuestionnaire ? <section className="design-dependency-gate"><b>01</b><div><strong>{tr(locale, "等待Final问卷", "Waiting for Final questionnaire")}</strong><p>{tr(locale, "配额需读取甄别题号、目标人群定义与项目样本量。", "Quota design requires screener IDs, target-population definitions and sample size.")}</p></div><button type="button" onClick={() => setDesignArtifact("questionnaire")}>{tr(locale, "返回问卷设计", "Return to questionnaire")}</button></section> : <section className="quota-choice-workspace"><aside>{QUOTA_OPTIONS.map((item) => <button type="button" key={item.id} className={quotaMode === item.id ? "selected" : ""} onClick={() => setQuotaMode(item.id)}><span>{item.recommended ? tr(locale, "本项目推荐", "Recommended") : tr(locale, "可选", "Option")}</span><strong>{tr(locale, item.zh, item.en)}</strong><p>{tr(locale, item.fitZh, item.fitEn)}</p><small>{tr(locale, item.structureZh, item.structureEn)}</small></button>)}</aside><div><header><span>{tr(locale, "当前配额", "Selected quota")}</span><strong>{tr(locale, selectedQuota.zh, selectedQuota.en)} · N={generatedRequest.sampleN.toLocaleString()}</strong></header><div className="quota-preview-table"><header><span>{tr(locale, "控制对象", "Control")}</span><span>{tr(locale, "问卷字段", "Question field")}</span><span>{tr(locale, "方式", "Method")}</span><span>{tr(locale, "目标结构", "Target structure")}</span></header>{quotaPreview.map((row) => <div key={`${row[0]}-${row[1]}`}><strong>{row[0]}</strong><code>{row[1]}</code><span>{row[2]}</span><span>{row[3]}</span></div>)}</div><p>{tr(locale, "选择后，目标单元与最低分析Base会写入配额表和DP Spec Banner。", "The selected cells and minimum analysis bases feed the quota table and DP Spec Banner.")}</p></div></section>}
      </section>}

      {designArtifact === "dp_spec" && <section className="design-artifact-panel dp-spec-artifact">
        <header className="design-artifact-header"><div><span>DP SPEC · {activeDesignVersion}</span><h3>{tr(locale, "由Final问卷与配额生成Table生产规则", "Generate table-production rules from the Final questionnaire and quota")}</h3><p>{finalQuestionnaire ? tr(locale, `Spec读取${finalQuestionnaire.questions.length}个有效题目，Banner读取${quotaPreview.length}组配额控制。`, `Spec reads ${finalQuestionnaire.questions.length} active questions and Banner reads ${quotaPreview.length} quota controls.`) : tr(locale, "Final问卷尚未确认，当前不能生成生产版DP Spec。", "The production DP Spec cannot be generated before questionnaire Finalization.")}</p></div><button type="button" disabled={!finalQuestionnaire} onClick={downloadDpSpecWorkbook}>{tr(locale, "下载DP Spec", "Download DP Spec")}</button></header>
        {!finalQuestionnaire ? <section className="design-dependency-gate"><b>01</b><div><strong>{tr(locale, "等待Final问卷与配额", "Waiting for questionnaire and quota")}</strong><p>{tr(locale, "DP Spec的Spec、Banner与Grid必须引用同一版本。", "Spec, Banner and Grid must reference the same version.")}</p></div><button type="button" onClick={() => setDesignArtifact("questionnaire")}>{tr(locale, "返回问卷设计", "Return to questionnaire")}</button></section> : <><section className="dp-spec-prerequisites"><article><b>01</b><span>{tr(locale, "问卷版本", "Questionnaire version")}</span><strong>{finalQuestionnaire.version} · {tr(locale, "已确认", "Final")}</strong></article><article><b>02</b><span>{tr(locale, "配额方式", "Quota approach")}</span><strong>{tr(locale, selectedQuota.zh, selectedQuota.en)}</strong></article><article><b>03</b><span>{tr(locale, "目标样本", "Target sample")}</span><strong>N={generatedRequest.sampleN.toLocaleString()}</strong></article></section><section className="dp-spec-sheet-grid">{dpSpecSheets.map((item, index) => <article key={item[0]}><b>{String(index + 1).padStart(2, "0")}</b><span>{item[0]}</span><strong>{item[1]}</strong><p>{item[2]}</p></article>)}</section><footer className="design-lock-footer"><div><span>DESIGN READY</span><strong>{finalQuestionnaire.version} · {selectedQuota.zh} · N={generatedRequest.sampleN.toLocaleString()}</strong><p>{tr(locale, "确认后，第03步执行、第04步Raw/Table/模型和第05步洞察均引用同一设计版本。", "After confirmation, fieldwork, Raw/tables/models and insights all reference the same design version.")}</p></div><button type="button" onClick={confirmResearchDesign}>{lockedProjectDesign?.finalQuestionnaire?.version === finalQuestionnaire.version && lockedProjectDesign.quotaMode === quotaMode ? tr(locale, "设计已进入执行", "Design ready for fieldwork") : tr(locale, "确认设计并进入执行", "Confirm design for fieldwork")}</button></footer></>}
      </section>}
    </>}

    {view === "model" && <>
      <section className="snack-model-summary"><article><span>{tr(locale, "购买倾向模型", "Propensity model")}</span><strong>AUC {format(propensity.test_auc, 3)}</strong><small>Train {propensity.train_n.toLocaleString()} / Test {propensity.test_n.toLocaleString()}</small></article><article><span>Brier</span><strong>{format(propensity.test_brier, 3)}</strong><small>{propensity.validation}</small></article><article><span>{tr(locale, "离散选择任务", "Choice tasks")}</span><strong>{choice.task_n.toLocaleString()}</strong><small>{choice.respondent_n.toLocaleString()} × 8</small></article><article><span>{tr(locale, "均不选择", "None share")}</span><strong>{format(choice.none_share)}%</strong><small>{tr(locale, "保留真实放弃选项", "Outside option retained")}</small></article></section>
      <section className="snack-grid two snack-model-output-grid">
        <article className="snack-panel"><header><div><span>PURCHASE PROPENSITY</span><h3>{tr(locale, "未来购买意向的相对驱动", "Relative drivers of forward intent")}</h3></div><DataTag tone="simulation">Q11 T2B</DataTag></header><div className="snack-driver-list model-driver-list">{propensityDrivers.map((item) => <div key={item.variable}><span>{item.variable}</span><i><b className={item.impact_pp_q25_q75 < 0 ? "negative" : ""} style={{ width: `${Math.min(100, Math.abs(item.impact_pp_q25_q75) / 18 * 100)}%` }} /></i><strong>{item.impact_pp_q25_q75 > 0 ? "+" : ""}{format(item.impact_pp_q25_q75)} pp</strong></div>)}</div><p className="snack-note">{tr(locale, "边际影响为变量从样本P25变到P75时的平均预测概率变化，其他变量保持不变。", "Marginal impact is the average predicted-probability change from P25 to P75, holding other variables fixed.")}</p></article>
        <article className="snack-panel"><header><div><span>DISCRETE CHOICE</span><h3>{tr(locale, "产品属性效用系数", "Product-attribute utility coefficients")}</h3></div><strong>DCE1–DCE8</strong></header><div className="snack-driver-list model-driver-list">{choiceDrivers.map((item) => <div key={item.attribute}><span>{item.attribute}</span><i><b className={item.utility < 0 ? "negative" : ""} style={{ width: `${Math.abs(item.utility) / choiceMax * 100}%` }} /></i><strong>{item.utility > 0 ? "+" : ""}{format(item.utility, 3)}</strong></div>)}</div><p className="snack-note">{tr(locale, "系数表示当前选择任务内的相对偏好；下一期样本用于检验方向与效应稳定性。", "Coefficients represent relative preference within the current choice task; the next wave tests direction and effect stability.")}</p></article>
      </section>
      <section className="snack-scenario-share"><header><div><span>FIXED CONFIGURATION COMPARISON</span><h3>{tr(locale, "三个固定产品方案的相对选择份额", "Relative choice shares for three fixed configurations")}</h3></div><p>{tr(locale, "同一模型、同一比较集；用于显示配置取舍，不是市场份额。", "Same model and comparison set; this shows configuration trade-offs, not market share.")}</p></header><div>{choiceScenarios.map((item) => <article key={item.scenario}><span>{item.scenario}</span><strong>{format(item.relative_choice_share)}%</strong><i><b style={{ width: `${item.relative_choice_share}%` }} /></i><p>¥{format(item.price, 1)} · {item.pack_g}g · {item.flavor}</p><small>{item.resealable ? tr(locale, "可重复封口", "resealable") : tr(locale, "普通封口", "standard seal")} · {item.health_claim} · {item.brand_tier}</small></article>)}</div></section>
      <section className="snack-quality-grid model-validation-strip"><article><span>{tr(locale, "留出集区分度", "Holdout discrimination")}</span><strong>AUC {format(propensity.test_auc, 3)}</strong></article><article><span>{tr(locale, "概率校准误差", "Probability calibration error")}</span><strong>{format(propensity.test_brier, 3)}</strong></article><article><span>{tr(locale, "训练 / 留出样本", "Train / holdout sample")}</span><strong>{propensity.train_n.toLocaleString()} / {propensity.test_n.toLocaleString()}</strong></article><article><span>{tr(locale, "选择任务记录", "Choice-task records")}</span><strong>{choice.task_n.toLocaleString()}</strong></article><article><span>{tr(locale, "模型验证方式", "Validation route")}</span><strong>{tr(locale, "样本外验证", "Holdout validation")}</strong></article></section>
    </>}
  </div>;
}

function ProductPricing({ locale, category, channel, age, income, region }: { locale: Locale; category: CategoryCode; channel: ChannelCode; age: AgeCode; income: IncomeCode; region: RegionCode }) {
  const categoryConfig = CATEGORY_CONFIG[category];
  const publicRows = (publicRetailJson.observations as PublicObservation[]).filter((item) => item.category === categoryConfig.publicName);
  const pricedRows = publicRows.filter((item) => item.unit_price_per_100g_cny != null).sort((a, b) => Number(a.unit_price_per_100g_cny) - Number(b.unit_price_per_100g_cny));
  const averagePrice = pricedRows.length ? pricedRows.reduce((sum, item) => sum + Number(item.unit_price_per_100g_cny), 0) / pricedRows.length : 0;
  const segmentEstimate = buildSegmentEstimate({ overall: chinaSurveyJson.overall_kpis, subgroupRows: chinaSurveyJson.subgroup_kpis as SegmentKpiRow[], age, income, region, channelShift: CHANNEL_CONFIG[channel].shift });
  const priceCurve = adjustPriceAcceptanceCurve(chinaSurveyJson.price_curve, chinaSurveyJson.overall_kpis.price_accept_7_9, segmentEstimate.kpis.price_accept_7_9).map((item) => ({ ...item, revenue_proxy: Number((item.price_cny * item.acceptance_rate).toFixed(1)) }));
  const bestPrice = [...priceCurve].sort((a, b) => b.revenue_proxy - a.revenue_proxy)[0];
  const choiceUtilities = chinaSurveyJson.models.discrete_choice.coefficients.filter((item) => item.attribute !== "截距").sort((a, b) => Math.abs(b.utility) - Math.abs(a.utility));
  const utilityMax = Math.max(...choiceUtilities.map((item) => Math.abs(item.utility)));

  return <div className="snack-stack">
    <SectionTitle eyebrow="PRICE & CONFIGURATION" title={tr(locale, "公开价格保持市场口径，消费者曲线随当前人群联动", "Keep public prices at market level while consumer curves follow the active segment")} note={`${age} · ${income} · ${region} · ${tr(locale, CHANNEL_CONFIG[channel].zh, CHANNEL_CONFIG[channel].en)}`} />
    <section className="snack-price-summary">
      <article><span>{tr(locale, "公开商品观察", "Public observations")}</span><strong>{publicRows.length}</strong><small>{categoryConfig.zh} · 京东公开页面</small></article>
      <article><span>{tr(locale, "可比每100g价格", "Comparable unit prices")}</span><strong>{pricedRows.length}</strong><small>{tr(locale, "已统一规格换算", "standardized to a common pack unit")}</small></article>
      <article><span>{tr(locale, "公开样本均价", "Observed mean")}</span><strong>{averagePrice ? `¥${format(averagePrice, 2)}` : "—"}</strong><small>{tr(locale, "/100g · 当前公开样本", "/100g · current public sample")}</small></article>
      <article><span>{tr(locale, "当前人群测试点", "Active-segment test point")}</span><strong>¥{format(bestPrice.price_cny, 1)}</strong><small>70g · {tr(locale, "分层估计", "pooled estimate")} N≈{segmentEstimate.approximateCellBaseN.toLocaleString()}</small></article>
    </section>
    <section className="snack-grid two">
      <article className="snack-panel">
        <header><div><span>PRICE RESPONSE</span><h3>{tr(locale, "Q9当前人群价格—接受率曲线", "Q9 active-segment price-acceptance curve")}</h3></div><strong>{tr(locale, "多变量分层估计", "Multivariable partial pooling")} · N≈{segmentEstimate.approximateCellBaseN.toLocaleString()}</strong></header>
        <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={priceCurve} margin={{ top: 18, right: 26, bottom: 24, left: 4 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="price_cny" tick={{ fontSize: 10 }} unit="元" label={{ value: tr(locale, "70g测试价格", "70g test price"), position: "insideBottom", offset: -16, fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" /><Tooltip content={<ResearchTooltip />} /><ReferenceLine x={bestPrice.price_cny} stroke="#ef9c2c" strokeWidth={2} /><Line type="monotone" dataKey="acceptance_rate" name={tr(locale, "考虑购买", "Would consider")} stroke="#2639a5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
        <p className="snack-note">{tr(locale, "首轮实验点按价格×接受率代理排序，仅用于设计下一轮测试，不等于收入、销量或最终定价。", "The first test point ranks price × acceptance as an experiment proxy; it is not revenue, sales or final pricing.")}</p>
      </article>
      <article className="snack-panel">
        <header><div><span>CHOICE DRIVERS</span><h3>{tr(locale, "进入离散选择模型的主要变量", "Variables entering the discrete-choice model")}</h3></div></header>
        <div className="snack-driver-list">{choiceUtilities.map((item) => <div key={item.attribute}><span>{item.attribute}</span><i><b className={item.utility < 0 ? "negative" : ""} style={{ width: `${Math.abs(item.utility) / utilityMax * 100}%` }} /></i><strong>{item.utility > 0 ? "+" : ""}{format(item.utility, 3)}</strong></div>)}</div>
        <div className="snack-winning-config"><span>{tr(locale, "建议进入首轮实验", "First experiment cell")}</span><strong>{tr(locale, "可重复封口 × 轻油表达", "Resealable × light-oil claim")}</strong><p>70g · ¥{format(bestPrice.price_cny, 1)} · {tr(locale, "成熟/成长品牌分层测试", "mature/growth brand-tier test")}</p></div>
      </article>
    </section>
    <section className="snack-public-price-table"><header><span>{tr(locale, "品牌 / 商品", "Brand / product")}</span><span>{tr(locale, "售价", "Price")}</span><span>{tr(locale, "每100g", "Per 100g")}</span><span>{tr(locale, "来源", "Source")}</span></header>{pricedRows.slice(0, 8).map((item, index) => <div key={`${item.brand}-${item.product_title}-${index}`}><span><b>{item.brand}</b><small>{item.product_title}</small></span><strong>¥{format(Number(item.price_cny), 2)}</strong><strong>¥{format(Number(item.unit_price_per_100g_cny), 2)}</strong><a href={item.source_url} target="_blank" rel="noreferrer">{item.retailer} ↗</a></div>)}</section>
  </div>;
}

function ChannelShelf({ locale, category, channel, age, income, region }: { locale: Locale; category: CategoryCode; channel: ChannelCode; age: AgeCode; income: IncomeCode; region: RegionCode }) {
  const categoryConfig = CATEGORY_CONFIG[category];
  const segmentEstimate = buildSegmentEstimate({ overall: chinaSurveyJson.overall_kpis, subgroupRows: chinaSurveyJson.subgroup_kpis as SegmentKpiRow[], age, income, region, channelShift: CHANNEL_CONFIG[channel].shift });
  const segmentLift = segmentEstimate.kpis.purchase_intent_t2b - chinaSurveyJson.overall_kpis.purchase_intent_t2b;
  const candidates = foodJson.skus.filter((item) => item.category === category && item.channel === channel).slice(0, 40).map((item) => {
    const incrementalReach = Number(clamp(item.incremental_reach_index + segmentLift * .72).toFixed(1));
    const assortmentScore = Number(clamp(item.assortment_score + segmentLift * .42).toFixed(1));
    return { ...item, incremental_reach_index: incrementalReach, assortment_score: assortmentScore, x: item.substitution_risk_index, y: incrementalReach, z: assortmentScore * 3 };
  });
  const averageReach = candidates.length ? candidates.reduce((sum, item) => sum + item.y, 0) / candidates.length : 50;
  const averageSubstitution = candidates.length ? candidates.reduce((sum, item) => sum + item.x, 0) / candidates.length : 50;
  const priority = candidates.filter((item) => item.y >= averageReach && item.x <= averageSubstitution).sort((a, b) => b.assortment_score - a.assortment_score);
  const channelRows = (Object.keys(CHANNEL_CONFIG) as ChannelCode[]).map((code) => ({ channel: locale === "zh" ? CHANNEL_CONFIG[code].zh : CHANNEL_CONFIG[code].en, score: clamp(67 + CHANNEL_CONFIG[code].shift * 2 + (code === channel ? 3 : 0)) })).sort((a, b) => b.score - a.score);

  return <div className="snack-stack">
    <SectionTitle eyebrow="CHANNEL & ASSORTMENT" title={tr(locale, "当前人群在不同渠道下对应不同的商品组合", "The active segment maps to a different assortment by channel")} note={tr(locale, `${age} · ${income} · ${region} · ${CHANNEL_CONFIG[channel].zh}：${CHANNEL_CONFIG[channel].reason}`, `${age} · ${income} · ${region} · ${CHANNEL_CONFIG[channel].en}: ${CHANNEL_CONFIG[channel].reason}`)} />
    <section className="snack-grid wide-left">
      <article className="snack-panel">
        <header><div><span>ASSORTMENT FRONTIER</span><h3>{tr(locale, "当前人群增量触达 × 内部替代风险", "Active-segment reach × internal substitution risk")}</h3></div><strong>{tr(locale, "情景SKU", "Scenario SKUs")} N={candidates.length} · {tr(locale, "人群Base", "segment base")} N≈{segmentEstimate.approximateCellBaseN}</strong></header>
        <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 18, right: 28, bottom: 24, left: 4 }}><CartesianGrid stroke="#e3e7ee" /><XAxis type="number" dataKey="x" domain={[0, 100]} name={tr(locale, "替代风险", "Substitution risk")} tick={{ fontSize: 10 }} /><YAxis type="number" dataKey="y" domain={[0, 100]} name={tr(locale, "增量触达", "Incremental reach")} tick={{ fontSize: 10 }} /><ZAxis type="number" dataKey="z" range={[80, 520]} /><ReferenceLine x={averageSubstitution} stroke="#ef9c2c" strokeDasharray="4 4" /><ReferenceLine y={averageReach} stroke="#0aa59e" strokeDasharray="4 4" /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => { const row = payload?.[0]?.payload as (typeof candidates)[number] | undefined; return active && row ? <div className="snack-tooltip"><strong>{row.product_name}</strong><span>{tr(locale, "增量触达", "Incremental reach")}：{row.y}</span><span>{tr(locale, "替代风险", "Substitution risk")}：{row.x}</span><span>{tr(locale, "组合分", "Portfolio score")}：{row.assortment_score}</span></div> : null; }} /><Scatter data={candidates} fill="#2639a5" /></ScatterChart></ResponsiveContainer></div>
        <p className="snack-note">{tr(locale, "左上象限进入第一轮候选；真实上架还需门店周转、毛利、缺货和货架容量。", "The upper-left quadrant enters the first shortlist; final listing requires velocity, margin, OOS and capacity.")}</p>
      </article>
      <article className="snack-panel">
        <header><div><span>CHANNEL FIT</span><h3>{tr(locale, `${categoryConfig.zh}渠道适配`, `${categoryConfig.en} channel fit`)}</h3></div></header>
        <div className="snack-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={channelRows} layout="vertical" margin={{ top: 18, right: 24, bottom: 10, left: 12 }}><CartesianGrid stroke="#e3e7ee" horizontal={false} /><XAxis type="number" domain={[55, 90]} tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="channel" width={locale === "zh" ? 72 : 128} tick={{ fontSize: 9 }} /><Tooltip content={<ResearchTooltip />} /><Bar dataKey="score" name={tr(locale, "渠道适配分", "Channel fit")} radius={[0, 3, 3, 0]}>{channelRows.map((item) => <Cell key={item.channel} fill={item.channel === (locale === "zh" ? CHANNEL_CONFIG[channel].zh : CHANNEL_CONFIG[channel].en) ? "#0aa59e" : "#2639a5"} opacity={item.channel === (locale === "zh" ? CHANNEL_CONFIG[channel].zh : CHANNEL_CONFIG[channel].en) ? 1 : .58} />)}</Bar></BarChart></ResponsiveContainer></div>
      </article>
    </section>
    <section className="snack-shortlist"><header><div><span>FIRST TEST SHORTLIST</span><h3>{tr(locale, "第一轮商品组合候选", "First assortment shortlist")}</h3></div><strong>{priority.length} / {candidates.length}</strong></header>{priority.slice(0, 6).map((item, index) => <article key={item.sku_id}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{item.product_name}</strong><small>{item.pack_g}g · ¥{format(item.promo_price, 1)} · {item.data_label}</small></span><dl><div><dt>{tr(locale, "增量", "Reach")}</dt><dd>{item.incremental_reach_index}</dd></div><div><dt>{tr(locale, "替代", "Substitution")}</dt><dd>{item.substitution_risk_index}</dd></div><div><dt>{tr(locale, "组合分", "Score")}</dt><dd>{item.assortment_score}</dd></div></dl></article>)}</section>
  </div>;
}

function LaunchDecisionStudio({ locale, category, channel, age, income, region }: { locale: Locale; category: CategoryCode; channel: ChannelCode; age: AgeCode; income: IncomeCode; region: RegionCode }) {
  const [priceIndex, setPriceIndex] = useState(95);
  const [tasteFit, setTasteFit] = useState(74);
  const [packFit, setPackFit] = useState(68);
  const [healthFit, setHealthFit] = useState(64);
  const [brandTrust, setBrandTrust] = useState(66);
  const [visibility, setVisibility] = useState(62);
  const [promotion, setPromotion] = useState(10);
  const reference = { priceIndex: 100, tasteFit: 65, packFit: 65, healthFit: 60, brandTrust: 60, visibility: 55, promotion: 5 };
  const demographicShift = AGE_SHIFT[age] * .25 + INCOME_SHIFT[income] * .22 + REGION_SHIFT[region] * .18 + CHANNEL_CONFIG[channel].shift * .3;
  const probabilityFor = (scenario: typeof reference) => {
    const score = -1.12 - (scenario.priceIndex - 95) * .028 + (scenario.tasteFit - 50) * .034 + (scenario.packFit - 50) * .018 + (scenario.healthFit - 50) * .019 + (scenario.brandTrust - 50) * .022 + (scenario.visibility - 50) * .016 + scenario.promotion * .012 + demographicShift * .03;
    return 100 / (1 + Math.exp(-score));
  };
  const currentScenario = { priceIndex, tasteFit, packFit, healthFit, brandTrust, visibility, promotion };
  const choiceProbability = probabilityFor(currentScenario);
  const referenceProbability = probabilityFor(reference);
  const probabilityDelta = choiceProbability - referenceProbability;
  const screeningStatus = choiceProbability >= 60 && probabilityDelta >= 0
    ? tr(locale, "进入下一轮实物测试", "Advance to product test")
    : choiceProbability >= 48
      ? tr(locale, "优化后复测", "Revise and retest")
      : tr(locale, "暂缓进入下一阶段", "Hold before next stage");
  const priceCurve = [75, 85, 95, 105, 115, 125].map((price) => ({
    price,
    current: Number(probabilityFor({ ...currentScenario, priceIndex: price }).toFixed(1)),
    reference: Number(probabilityFor({ ...reference, priceIndex: price }).toFixed(1)),
  }));
  const controls = [
    { label: tr(locale, "相对价格指数", "Relative price index"), value: priceIndex, min: 75, max: 125, setter: setPriceIndex },
    { label: tr(locale, "口味匹配", "Taste fit"), value: tasteFit, min: 40, max: 90, setter: setTasteFit },
    { label: tr(locale, "包装吸引力", "Pack appeal"), value: packFit, min: 40, max: 90, setter: setPackFit },
    { label: tr(locale, "健康/成分匹配", "Health / ingredient fit"), value: healthFit, min: 40, max: 90, setter: setHealthFit },
    { label: tr(locale, "品牌信任", "Brand trust"), value: brandTrust, min: 40, max: 90, setter: setBrandTrust },
    { label: tr(locale, "货架可见度", "Shelf visibility"), value: visibility, min: 30, max: 90, setter: setVisibility },
    { label: tr(locale, "促销深度", "Promotion depth"), value: promotion, min: 0, max: 30, setter: setPromotion },
  ];
  const gaps = [
    { label: tr(locale, "价格", "Price"), delta: priceIndex - reference.priceIndex, direction: "lower" },
    { label: tr(locale, "口味", "Taste"), delta: tasteFit - reference.tasteFit, direction: "higher" },
    { label: tr(locale, "包装", "Pack"), delta: packFit - reference.packFit, direction: "higher" },
    { label: tr(locale, "健康/成分", "Health / ingredient"), delta: healthFit - reference.healthFit, direction: "higher" },
    { label: tr(locale, "品牌信任", "Brand trust"), delta: brandTrust - reference.brandTrust, direction: "higher" },
    { label: tr(locale, "货架可见", "Shelf visibility"), delta: visibility - reference.visibility, direction: "higher" },
  ];
  const weakest = [...gaps].sort((a, b) => {
    const aRisk = a.direction === "lower" ? a.delta : -a.delta;
    const bRisk = b.direction === "lower" ? b.delta : -b.delta;
    return bRisk - aRisk;
  })[0];
  const priorityAction = weakest.direction === "lower" && weakest.delta > 0
    ? tr(locale, `优先验证价格：当前高于参考情景${format(weakest.delta)}点。`, `Test price first: current index is ${format(weakest.delta)} points above reference.`)
    : weakest.direction === "higher" && weakest.delta < 0
      ? tr(locale, `优先优化${weakest.label}：当前低于参考情景${format(Math.abs(weakest.delta))}点。`, `Improve ${weakest.label} first: ${format(Math.abs(weakest.delta))} points below reference.`)
      : tr(locale, "当前关键属性均未低于参考情景，下一步验证实物体验与渠道执行。", "No key attribute is below reference; validate product experience and channel execution next.");
  const modelCoefficients = foodJson.model.coefficients.filter((item) => item.source !== "model").slice(0, 7);

  return <div className="snack-stack">
    <SectionTitle eyebrow="LAUNCH DECISION STUDIO" title={tr(locale, "新品上架与渠道进入决策", "New-product listing and channel-entry decision")} note={tr(locale, `${CATEGORY_CONFIG[category].zh} × ${CHANNEL_CONFIG[channel].zh} × ${age} × ${income} × ${region}`, `${CATEGORY_CONFIG[category].en} × ${CHANNEL_CONFIG[channel].en} × ${age} × ${income} × ${region}`)} />
    <section className="snack-launch-verdict">
      <div><span>{tr(locale, "当前筛选建议", "Current screening result")}</span><h2>{screeningStatus}</h2><p>{tr(locale, "规则：问卷选择概率达到60%且不低于参考情景时，进入下一轮实物测试；这不是上市或销量结论。", "Rule: advance to product testing when survey choice probability reaches 60% and does not trail the reference. This is not a sales or launch forecast.")}</p></div>
      <article><span>{tr(locale, "问卷选择概率", "Survey choice probability")}</span><strong>{format(choiceProbability)}%</strong><small>{tr(locale, "问卷选择任务", "survey choice task")}</small></article>
      <article><span>{tr(locale, "相对参考情景", "Versus reference")}</span><strong className={probabilityDelta < 0 ? "negative" : ""}>{probabilityDelta > 0 ? "+" : ""}{format(probabilityDelta)} pp</strong><small>{tr(locale, `参考情景 ${format(referenceProbability)}%`, `reference ${format(referenceProbability)}%`)}</small></article>
      <article><span>{tr(locale, "上市判断", "Launch decision")}</span><strong className="pending">{tr(locale, "暂不可给出", "Not available")}</strong><small>{tr(locale, "缺少真实试购、复购与销售结果", "trial, repeat and sales outcomes missing")}</small></article>
    </section>
    <section className="snack-model-workbench snack-launch-workbench">
      <aside><header><span>SCENARIO INPUTS</span><h3>{tr(locale, "调整一个完整产品情景", "Adjust a complete product scenario")}</h3><p>{tr(locale, "全部变量共同进入同一选择模型。", "All variables enter one choice model together.")}</p></header>{controls.map((item) => <label key={item.label}><span>{item.label}<b>{item.value}</b></span><input type="range" min={item.min} max={item.max} value={item.value} onChange={(event) => item.setter(Number(event.target.value))} /></label>)}</aside>
      <main>
        <header><div><span>PRICE RESPONSE</span><h3>{tr(locale, "当前产品情景与参考情景", "Current versus reference scenario")}</h3></div></header>
        <div className="snack-chart launch-curve"><ResponsiveContainer width="100%" height="100%"><LineChart data={priceCurve} margin={{ top: 22, right: 28, bottom: 18, left: 2 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="price" tick={{ fontSize: 9 }} label={{ value: tr(locale, "相对价格指数", "Relative price index"), position: "insideBottom", offset: -8, fontSize: 9 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" /><Tooltip content={<ResearchTooltip />} /><ReferenceLine y={60} stroke="#ef9c2c" strokeDasharray="4 4" /><Line type="monotone" dataKey="reference" name={tr(locale, "参考情景", "Reference")} stroke="#9ba4b7" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="current" name={tr(locale, "当前情景", "Current")} stroke="#0aa59e" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        <div className="snack-launch-actions"><article><b>01</b><span>{tr(locale, "优先动作", "Priority action")}</span><p>{priorityAction}</p></article><article><b>02</b><span>{tr(locale, "目标人群", "Target segment")}</span><p>{age} · {income} · {region}</p></article><article><b>03</b><span>{tr(locale, "渠道验证", "Channel validation")}</span><p>{tr(locale, `${CHANNEL_CONFIG[channel].zh}小规模上架或货架实验`, `${CHANNEL_CONFIG[channel].en} limited listing or shelf test`)}</p></article><article><b>04</b><span>{tr(locale, "必须回收", "Required outcome")}</span><p>{tr(locale, "试购、复购、周转、缺货与替代来源", "trial, repeat, velocity, OOS and source of volume")}</p></article></div>
      </main>
    </section>
    <section className="snack-launch-evidence">
      <header><div><span>MODEL EVIDENCE</span><h3>{tr(locale, "模型验证与变量证据", "Model validation and variable evidence")}</h3></div></header>
      <div className="snack-model-diagnostics"><article><span>Train / test</span><strong>{foodJson.model.train_n.toLocaleString()} / {foodJson.model.test_n.toLocaleString()}</strong></article><article><span>Test AUC</span><strong>{format(foodJson.model.test_auc, 3)}</strong></article><article><span>Test Brier</span><strong>{format(foodJson.model.test_brier, 3)}</strong></article><article><span>{tr(locale, "结果标签", "Outcome label")}</span><strong>{tr(locale, "问卷选择", "Survey choice")}</strong></article></div>
      <div className="snack-coefficient-table"><header><span>{tr(locale, "变量", "Variable")}</span><span>{tr(locale, "系数", "Coefficient")}</span><span>95% CI</span><span>{tr(locale, "边际影响", "Marginal effect")}</span></header>{modelCoefficients.map((item) => <div key={item.source}><b>{item.label}</b><strong>{format(item.coefficient, 3)}</strong><span>{format(item.ci_low, 3)} — {format(item.ci_high, 3)}</span><em className={item.impact_pp < 0 ? "negative" : ""}>{item.impact_pp > 0 ? "+" : ""}{format(item.impact_pp)} pp</em></div>)}</div>
    </section>
  </div>;
}

function DataCenter({ locale }: { locale: Locale }) {
  const [centerView, setCenterView] = useState<DataCenterView>("models");
  const contributionMetrics = researchRegistryJson.metric_contribution_summary;
  const [selectedMetricKey, setSelectedMetricKey] = useState(
    contributionMetrics.find((item) => item.metric_key === "SNACK.CORE.FREQ_BUYER")?.metric_key
      ?? contributionMetrics[0].metric_key,
  );
  const selectedMetric = researchRegistryJson.metric_registry.find((item) => item.metric_key === selectedMetricKey)!;
  const selectedContribution = contributionMetrics.find((item) => item.metric_key === selectedMetricKey)!;
  const selectedLedger = researchRegistryJson.sample_contribution_ledger.filter((item) => item.metric_key === selectedMetricKey);
  const linkedQuestions = researchRegistryJson.question_metric_map
    .filter((item) => item.metric_key === selectedMetricKey)
    .map((item) => researchRegistryJson.question_registry.find((question) => question.question_key === item.question_key))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const comparableShare = selectedContribution.gross_n
    ? selectedContribution.comparable_n / selectedContribution.gross_n * 100
    : 0;
  const effectiveShare = selectedContribution.comparable_n
    ? selectedContribution.effective_n / selectedContribution.comparable_n * 100
    : 0;
  const domains = [
    { code: "01", name: tr(locale, "全球市场、贸易与商品库", "Global market, trade and product"), volume: `${DATA_COUNTS.globalMarkets} ${tr(locale, "市场", "markets")} · ${DATA_COUNTS.globalIndicators} + ${DATA_COUNTS.globalTradeRecords} + ${DATA_COUNTS.globalProductRecords}`, grain: tr(locale, "国家 × 指标/HS编码/条码 × 时间", "market × indicator/HS code/barcode × time"), dimensions: tr(locale, "区域、人口、收入、居民消费、贸易流、商品属性", "region, population, income, household consumption, trade flow, product attributes"), cadence: tr(locale, "随权威与开放来源更新", "Source cadence"), status: tr(locale, "权威+开放", "Authoritative + open") },
    { code: "02", name: tr(locale, "消费者研究库", "Consumer research"), volume: `${DATA_COUNTS.consumerRecords.toLocaleString()} ${tr(locale, "条", "rows")}`, grain: tr(locale, "受访者 × 期次 × 选择任务", "respondent × wave × choice task"), dimensions: tr(locale, "人群、场景、态度、需求、价格", "segment, occasion, attitude, need, price"), cadence: tr(locale, "季度", "Quarterly"), status: tr(locale, "案例数据", "Case data") },
    { code: "03", name: tr(locale, "商品与价格库", "Product and price"), volume: `${DATA_COUNTS.publicProducts} + ${DATA_COUNTS.scenarioSkus}`, grain: tr(locale, "商品 × 规格 × 渠道 × 日期", "SKU × pack × channel × date"), dimensions: tr(locale, "品牌、口味、包装、售价、单位价", "brand, taste, pack, price, unit price"), cadence: tr(locale, "月度", "Monthly"), status: tr(locale, "公开+案例", "Public + case") },
    { code: "04", name: tr(locale, "渠道与货架库", "Channel and shelf"), volume: `4 ${tr(locale, "类渠道", "channel types")}`, grain: tr(locale, "渠道 × 商品 × 货架情景", "channel × SKU × shelf scenario"), dimensions: tr(locale, "触达、可见度、替代、组合、促销", "reach, visibility, substitution, mix, promo"), cadence: tr(locale, "季度/月度", "Quarterly/monthly"), status: tr(locale, "案例数据", "Case data") },
    { code: "05", name: tr(locale, "指标与口径库", "Metric dictionary"), volume: `${DATA_COUNTS.metricDefinitions} ${tr(locale, "项", "metrics")}`, grain: tr(locale, "指标 × 市场 × 期次 × 人群", "metric × market × wave × segment"), dimensions: tr(locale, "定义、Base、单位、权重、来源", "definition, base, unit, weight, source"), cadence: tr(locale, "版本更新", "Versioned"), status: tr(locale, "已定义", "Defined") },
    { code: "06", name: tr(locale, "外部校准库", "External calibration"), volume: `${DATA_COUNTS.officialIndicators} ${tr(locale, "项", "indicators")}`, grain: tr(locale, "指标 × 时间 × 来源", "indicator × time × source"), dimensions: tr(locale, "宏观消费、渠道、线上趋势", "macro demand, channel, online trend"), cadence: tr(locale, "随来源更新", "Source cadence"), status: tr(locale, "权威公开", "Authoritative public") },
    { code: "07", name: tr(locale, "经营结果库", "Business outcomes"), volume: tr(locale, "待客户数据接入", "Pending client data"), grain: tr(locale, "SKU × 门店/渠道 × 周期", "SKU × store/channel × period"), dimensions: tr(locale, "试购、复购、销量、铺货、下架", "trial, repeat, sales, distribution, delisting"), cadence: tr(locale, "周度/月度", "Weekly/monthly"), status: tr(locale, "接口已定义", "Schema defined") },
  ];
  const trackingModules = [
    { code: "01", name: tr(locale, "固定核心指标", "Fixed core metrics"), coverage: tr(locale, "品类购买、频次、渠道、场景、价格接受", "category purchase, frequency, channel, occasion, price acceptance"), cadence: tr(locale, "每季度可比", "Comparable every quarter"), use: tr(locale, "更新需求基线、人群变化与下一期先验", "Refresh demand baselines, segment movement and next-wave priors"), status: tr(locale, "每期保留", "Every wave") },
    { code: "02", name: tr(locale, "轮换决策模块", "Rotating decision modules"), coverage: tr(locale, "概念、口味、包装、成分、价格与货架实验", "concept, taste, pack, ingredient, price and shelf experiments"), cadence: tr(locale, "随决策问题启用", "Activated by decision"), use: tr(locale, "形成可比较的产品、价格与渠道情景", "Create comparable product, price and channel scenarios"), status: tr(locale, "按项目启用", "On demand") },
    { code: "03", name: tr(locale, "重点人群增样", "Priority-segment boost"), coverage: tr(locale, "重点地区、渠道、人群与新品目标用户", "priority region, channel, segment and launch audience"), cadence: tr(locale, "按所需分析精度", "Based on required precision"), use: tr(locale, "保证关键分组有足够Base与稳定区间", "Secure sufficient base and stable intervals for key cuts"), status: tr(locale, "按精度启用", "Precision based") },
    { code: "04", name: tr(locale, "真实结果回流", "Business outcome feedback"), coverage: tr(locale, "试购、复购、周转、缺货、铺货与下架", "trial, repeat, velocity, OOS, distribution and delisting"), cadence: tr(locale, "周度或月度", "Weekly or monthly"), use: tr(locale, "校准问卷行为与真实经营结果之间的偏差", "Calibrate gaps between survey behavior and business outcomes"), status: tr(locale, "待客户接入", "Pending connection") },
  ];
  const updateRegister = [
    { source: tr(locale, "消费者研究", "Consumer research"), latest: tr(locale, "零食品类案例基线", "Snack category case baseline"), scope: `N=${DATA_COUNTS.consumerRecords.toLocaleString()}`, next: tr(locale, "新一期问卷入库后更新", "Refresh after the next survey wave"), tone: "simulation" as const },
    { source: tr(locale, "公开商品观察", "Public product observation"), latest: `${tr(locale, "国内", "CN")} ${publicRetailJson.meta.retrieved_at} · ${tr(locale, "多国", "Global")} ${globalProductPilotJson.meta.retrieved_at}`, scope: `${DATA_COUNTS.publicProducts} SKU / ${DATA_COUNTS.comparablePrices} ${tr(locale, "条单位价格", "unit prices")} · ${DATA_COUNTS.globalProductRecords} ${tr(locale, "条多国商品属性", "global product attributes")}`, next: tr(locale, "补充海外渠道、价格、日期与币种后再做价格比较", "Add overseas channel, price, date and currency before price comparison"), tone: "public" as const },
    { source: tr(locale, "外部权威校准", "Authoritative calibration"), latest: `${tr(locale, "全球指标", "Global indicators")} ${globalMarketJson.meta.world_bank_last_updated}`, scope: `${DATA_COUNTS.officialIndicators} ${tr(locale, "项中国指标", "China indicators")} · ${DATA_COUNTS.globalMarkets} ${tr(locale, "市场", "markets")} / ${DATA_COUNTS.globalIndicators} ${tr(locale, "项指标", "indicators")} / ${DATA_COUNTS.globalTradeRecords} ${tr(locale, "条贸易代理数据", "trade proxy rows")}`, next: tr(locale, "随官方来源更新，并继续补齐缺失市场", "Refresh with official releases and fill missing markets"), tone: "official" as const },
    { source: tr(locale, "经营结果", "Business outcomes"), latest: tr(locale, "尚未接入", "Not connected"), scope: tr(locale, "字段结构已定义", "Schema defined"), next: tr(locale, "接入客户试购、复购与销售数据", "Connect client trial, repeat and sales data"), tone: "gap" as const },
  ];
  const globalMarkets = globalMarketJson.markets as GlobalMarket[];
  const externalCoverage = [
    { name: tr(locale, "人口", "Population"), count: globalMarkets.filter((market) => market.macro.population?.value != null).length, unit: tr(locale, "国家", "markets"), definition: "SP.POP.TOTL" },
    { name: tr(locale, "人均GDP", "GDP per capita"), count: globalMarkets.filter((market) => market.macro.gdp_per_capita_usd?.value != null).length, unit: tr(locale, "国家", "markets"), definition: "NY.GDP.PCAP.CD" },
    { name: tr(locale, "人均家庭消费支出", "Household consumption per capita"), count: globalMarkets.filter((market) => householdConsumptionValue(market) != null).length, unit: tr(locale, "国家", "markets"), definition: "NE.CON.PRVT.PC.KD" },
    { name: tr(locale, "食品贸易背景", "Food trade context"), count: globalMarkets.filter((market) => market.trade_proxy.status === "available").length, unit: tr(locale, "国家", "markets"), definition: tr(locale, "4个宽口径HS编码", "4 broad HS codes") },
  ];
  return <div className="snack-stack">
    <section className="research-registry-hero">
      <div>
        <span>RESEARCH REGISTRY</span>
        <h2>{tr(locale, "把累计样本变成可查询、可比较、可训练的数据体系", "Turn accumulated samples into queryable, comparable and trainable data")}</h2>
        <p>{tr(locale, "稳定指标、稳定题号、选项Code、Raw字段、样本贡献与模型运行由同一注册中心关联；项目专项数据默认留在项目层。", "Stable metrics, question IDs, option codes, Raw fields, sample contributions and model runs are linked in one registry; project-specific data stay local by default.")}</p>
      </div>
      <DataTag tone="simulation">{tr(locale, "案例演示数据", "Case demonstration data")}</DataTag>
    </section>
    <nav className="data-center-subnav" aria-label={tr(locale, "数据中心视图", "Data center views")}>
      <button type="button" className={centerView === "models" ? "active" : ""} onClick={() => setCenterView("models")}><span>01</span><strong>{tr(locale, "模型与指标", "Models & metrics")}</strong><small>{tr(locale, "样本贡献 · 题目映射 · 模型运行", "sample contribution · question mapping · model runs")}</small></button>
      <button type="button" className={centerView === "assets" ? "active" : ""} onClick={() => setCenterView("assets")}><span>02</span><strong>{tr(locale, "数据资产", "Data assets")}</strong><small>{tr(locale, "数据域 · 外部校准 · 更新状态", "data domains · calibration · freshness")}</small></button>
      <button type="button" className={centerView === "governance" ? "active" : ""} onClick={() => setCenterView("governance")}><span>03</span><strong>{tr(locale, "更新与治理", "Refresh & governance")}</strong><small>{tr(locale, "跨期设计 · 指标口径 · 样本方案", "tracking design · definitions · sample plan")}</small></button>
    </nav>
    {centerView === "models" ? <>
    <section className="registry-model-boundary" aria-label={tr(locale, "通用模型与项目专项模型", "Shared and project-specific models")}>
      <header>
        <div><span>MODEL LAYERS</span><h3>{tr(locale, "通用基准与项目决策分层运行", "Shared benchmarks and project decisions run in separate layers")}</h3></div>
        <strong>{tr(locale, "稳定指标键连接两层", "Stable metric keys connect both layers")}</strong>
      </header>
      <div>
        <article className="shared"><span>01</span><small>{tr(locale, "通用数据产品", "Shared data product")}</small><h4>{tr(locale, "品类基准与通用模型", "Category benchmarks and shared models")}</h4><p>{tr(locale, "市场、人群、需求、价格与渠道的稳定可比指标", "Stable comparable metrics for market, consumer, demand, price and channel")}</p><b>{tr(locale, "输出：市场位置与参考先验", "Output: market position and reference priors")}</b></article>
        <i>→</i>
        <article className="project"><span>02</span><small>{tr(locale, "项目专项工作台", "Project workspace")}</small><h4>{tr(locale, "品牌与产品专项模型", "Brand and product-specific models")}</h4><p>{tr(locale, "专属概念、产品、包装、定价、渠道与结果变量", "Project concept, product, pack, price, channel and outcome variables")}</p><b>{tr(locale, "输出：本项目的预测与行动方案", "Output: project forecast and action plan")}</b></article>
        <i>→</i>
        <article className="ledger"><span>03</span><small>{tr(locale, "指标贡献台账", "Metric contribution ledger")}</small><h4>{tr(locale, "只回流可比的通用指标", "Only comparable shared metrics contribute back")}</h4><p>{tr(locale, "口径、Base、市场、期次与授权状态逐条记录", "Definition, base, market, wave and permission are recorded row by row")}</p><b>{tr(locale, "项目专属变量留在项目层", "Project-private variables remain in the project layer")}</b></article>
      </div>
    </section>
    <section className="research-registry-kpis">
      <article><span>{tr(locale, "模型层级", "Model layers")}</span><strong>{researchRegistryJson.summary.layer_count}</strong><small>{tr(locale, "跨行业核心 → 项目专项", "Consumer core → project-specific")}</small></article>
      <article><span>{tr(locale, "稳定指标", "Registered metrics")}</span><strong>{researchRegistryJson.summary.metric_count}</strong><small>{tr(locale, "定义 · Base · 单位 · 版本", "definition · base · unit · version")}</small></article>
      <article><span>{tr(locale, "题目 / 选项Code", "Questions / option codes")}</span><strong>{researchRegistryJson.summary.question_count}<em>/ {researchRegistryJson.summary.option_count}</em></strong><small>{tr(locale, "展示顺序与稳定题号分离", "display order separated from stable IDs")}</small></article>
      <article><span>{tr(locale, "累计案例样本", "Accumulated case sample")}</span><strong>{researchRegistryJson.summary.gross_respondent_rows.toLocaleString()}</strong><small>{tr(locale, `${researchRegistryJson.summary.case_count}个案例，不直接等于任一指标Base`, `${researchRegistryJson.summary.case_count} cases; not automatically a metric base`)}</small></article>
    </section>
    <section className="research-registry-browser">
      <article className="registry-metric-control">
        <header><div><span>METRIC CONTRIBUTION</span><h3>{tr(locale, "一个指标到底能使用多少样本", "How much sample can this metric actually use")}</h3></div></header>
        <label><span>{tr(locale, "选择指标", "Select metric")}</span><select value={selectedMetricKey} onChange={(event) => setSelectedMetricKey(event.target.value)}>{contributionMetrics.map((item) => { const metric = researchRegistryJson.metric_registry.find((row) => row.metric_key === item.metric_key)!; return <option key={item.metric_key} value={item.metric_key}>{tr(locale, metric.name_zh, metric.name_en)}</option>; })}</select></label>
        <div className="registry-metric-definition"><b>{tr(locale, selectedMetric.name_zh, selectedMetric.name_en)}</b><p>{tr(locale, selectedMetric.definition, selectedMetric.definition_en)}</p><dl><div><dt>Base</dt><dd>{tr(locale, selectedMetric.denominator, selectedMetric.denominator_en)}</dd></div><div><dt>{tr(locale, "上级构念", "Parent construct")}</dt><dd>{selectedMetric.parent_construct}</dd></div><div><dt>{tr(locale, "当前层", "Current layer")}</dt><dd>{selectedMetric.layer_id}</dd></div></dl></div>
        <div className="registry-sample-funnel">
          <div><header><span>{tr(locale, "累计样本", "Accumulated")}</span><strong>{selectedContribution.gross_n.toLocaleString()}</strong></header><i style={{ width: "100%" }} /></div>
          <div><header><span>{tr(locale, "同口径可比Base", "Comparable base")}</span><strong>{selectedContribution.comparable_n.toLocaleString()}</strong></header><i style={{ width: `${Math.max(comparableShare, 3)}%` }} /></div>
          <div><header><span>{tr(locale, "当前有效Base", "Current effective base")}</span><strong>{Math.round(selectedContribution.effective_n).toLocaleString()}</strong></header><i style={{ width: `${Math.max(comparableShare * effectiveShare / 100, 3)}%` }} /></div>
        </div>
        <footer><b>{tr(locale, "为什么会不同", "Why counts differ")}</b><p>{tr(locale, selectedMetric.denominator, selectedMetric.denominator_en)}{tr(locale, "；", "; ")}{tr(locale, "正式项目还会继续扣除缺失、质量门槛、权重设计效应与不兼容市场。", "Live projects also account for missingness, quality gates, weighting design effects and incompatible markets.")}</p></footer>
      </article>
      <article className="registry-ledger">
        <header><div><span>CONTRIBUTION LEDGER</span><h3>{tr(locale, "哪些项目真正贡献了这个指标", "Which projects actually contribute to this metric")}</h3></div><strong>{selectedLedger.length} {tr(locale, "个案例", "cases")}</strong></header>
        <div className="registry-ledger-head"><span>{tr(locale, "案例 / 品类", "Case / category")}</span><span>{tr(locale, "累计N", "Gross N")}</span><span>{tr(locale, "可比Base", "Comparable")}</span><span>{tr(locale, "有效Base", "Effective")}</span></div>
        {selectedLedger.map((item) => <div className="registry-ledger-row" key={item.contribution_id}><span><b>{tr(locale, item.case_name, item.case_name_en)}</b><small>{tr(locale, item.category, item.category_en)} · {tr(locale, item.market, item.market_en)}</small></span><strong>{item.gross_n.toLocaleString()}</strong><strong>{item.comparable_n.toLocaleString()}</strong><strong>{Math.round(item.effective_n).toLocaleString()}</strong></div>)}
        <footer><span>{tr(locale, "向上贡献状态", "Upward contribution")}</span><b>{tr(locale, selectedMetric.upward_status, selectedMetric.upward_status_en)}</b></footer>
      </article>
    </section>
    <section className="registry-lineage-models">
      <article className="registry-lineage-card">
        <header><span>QUESTION → METRIC → MODEL</span><h3>{tr(locale, "从问卷题号追到模型输入", "Trace a survey item into the model")}</h3></header>
        <div className="registry-lineage-path">
          <section><small>{tr(locale, "稳定题号", "Stable question")}</small><strong>{linkedQuestions.length ? linkedQuestions.map((item) => item.stable_question_id).join(" / ") : tr(locale, "经营结果字段", "Outcome field")}</strong><p>{linkedQuestions.length ? tr(locale, linkedQuestions[0].wording_zh, linkedQuestions[0].wording_en) : tr(locale, selectedMetric.definition, selectedMetric.definition_en)}</p></section>
          <i>→</i>
          <section><small>{tr(locale, "指标主键", "Metric key")}</small><strong>{selectedMetric.metric_key}</strong><p>{tr(locale, selectedMetric.denominator, selectedMetric.denominator_en)} · {tr(locale, selectedMetric.unit, selectedMetric.unit_en)}</p></section>
          <i>→</i>
          <section><small>{tr(locale, "模型作用", "Model role")}</small><strong>{selectedMetric.role === "target" ? tr(locale, "预测目标", "Prediction target") : tr(locale, "通用模型输入", "Shared model input")}</strong><p>{tr(locale, selectedMetric.decision_use, selectedMetric.decision_use_en)}</p></section>
        </div>
      </article>
      <article className="registry-model-runs">
        <header><span>MODEL RUNS</span><h3>{tr(locale, "每次训练都保留样本切分与验证结果", "Every run retains sample splits and validation evidence")}</h3></header>
        {researchRegistryJson.model_runs.map((run) => { const model = researchRegistryJson.model_registry.find((item) => item.model_id === run.model_id)!; return <section key={run.run_id}><div><b>{tr(locale, model.name_zh, model.name_en)}</b><small>{tr(locale, model.family, model.family_en)} · v{model.version}</small></div><dl><div><dt>{tr(locale, "共享先验", "Shared prior")}</dt><dd>{run.comparable_prior_n ? run.comparable_prior_n.toLocaleString() : "—"}</dd></div><div><dt>{tr(locale, "训练 / 留出", "Train / holdout")}</dt><dd>{run.train_n.toLocaleString()} / {run.holdout_n ? run.holdout_n.toLocaleString() : "—"}</dd></div><div><dt>AUC / Brier</dt><dd>{run.auc ?? "—"} / {run.brier ?? "—"}</dd></div></dl><p>{tr(locale, model.decision_output, model.decision_output_en)}</p><small>{tr(locale, run.validation, run.validation_en)}</small></section>; })}
      </article>
    </section>
    </> : null}
    {centerView === "assets" ? <>
    <section className="snack-data-universe">
      <div className="snack-database-visual" aria-hidden="true"><i /><i /><i /><i /><b /></div>
      <div><span>DATA DOMAINS</span><h2>{tr(locale, "注册中心下的七类数据域", "Seven data domains beneath the registry")}</h2><p>{tr(locale, "来源、粒度、时间、Base和更新频率各自保留；注册中心只负责关联，不把不同数据混成一个总数。", "Source, grain, time, base and refresh cadence remain independent; the registry links them without collapsing unlike data into one total.")}</p></div>
      <aside><strong>7</strong><span>{tr(locale, "数据域", "data domains")}</span><b>{tr(locale, "统一关联 · 独立追溯", "Linked · independently traceable")}</b></aside>
    </section>
    <section className="snack-data-domain-grid">{domains.map((item) => <article key={item.code}><header><b>{item.code}</b><span>{item.status}</span></header><h3>{item.name}</h3><strong>{item.volume}</strong><dl><div><dt>{tr(locale, "数据粒度", "Grain")}</dt><dd>{item.grain}</dd></div><div><dt>{tr(locale, "主要维度", "Dimensions")}</dt><dd>{item.dimensions}</dd></div><div><dt>{tr(locale, "更新", "Refresh")}</dt><dd>{item.cadence}</dd></div></dl></article>)}</section>
    <section className="snack-external-resource-library">
      <header><div><span>EXTERNAL DATA RESERVE</span><h3>{tr(locale, "外部数据作为校准层，不替代消费者研究", "External data calibrates rather than replaces consumer research")}</h3></div><p>{tr(locale, "开放来源已按口径接入；商业平台只登记可用字段和接入价值，获得授权后再连接。", "Open sources are connected by definition; commercial platforms are registered by field and use, and connect only after authorization.")}</p></header>
      <div className="head"><span>{tr(locale, "数据资源", "Resource")}</span><span>{tr(locale, "可提供什么", "Coverage")}</span><span>{tr(locale, "进入哪一层", "Model use")}</span><span>{tr(locale, "接入状态", "Access")}</span><span>{tr(locale, "更新", "Refresh")}</span></div>
      {EXTERNAL_RESEARCH_RESOURCES.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><strong>{item.name}</strong><span>{tr(locale, item.scopeZh, item.scopeEn)}</span><span>{tr(locale, item.modelUseZh, item.modelUseEn)}</span><b className={item.access}>{item.access === "connected" ? tr(locale, "已接入", "Connected") : item.access === "licensed" ? tr(locale, "授权后连接", "License required") : tr(locale, "授权范围内接入", "Authorized access")}</b><small>{tr(locale, item.cadenceZh, item.cadenceEn)}</small></a>)}
      <footer>{tr(locale, "所有来源继续保留指标定义、市场、时期、单位、采集日期和原始URL；付费或登录资源不绕过访问限制。", "Every source retains definition, market, period, unit, capture date and original URL; paid or gated resources are never accessed outside their terms.")}</footer>
    </section>
    <section className="external-indicator-audit external-source-coverage">
      <header><div><span>EXTERNAL CALIBRATION COVERAGE</span><h3>{tr(locale, "外部校准数据覆盖", "External calibration coverage")}</h3></div><p>{tr(locale, "人口、人均GDP与居民消费支出用于研究市场筛选和消费环境比较，不替代零食品类调查。", "Population, GDP per capita and household consumption support market selection and context; they do not replace snack-category research.")}</p></header>
      <div className="external-indicator-audit-kpis">
        {externalCoverage.map((item) => <article key={item.definition}><span>{item.name}</span><strong>{item.count}/{globalMarkets.length}</strong><small>{item.definition} · {item.unit}</small></article>)}
      </div>
      <footer>{tr(locale, "边界值、冲突值和缺失值不会进入客户侧比较；通过复核的数值保留指标代码、年份、单位和来源。", "Boundary, conflicting and missing values are excluded from client comparisons; approved values retain code, year, unit and source.")}</footer>
    </section>
    <section className="snack-update-register"><header><div><span>DATA UPDATE REGISTER</span><h3>{tr(locale, "数据更新时间与下一步", "Data freshness and next update")}</h3></div></header>{updateRegister.map((item) => <article key={item.source}><DataTag tone={item.tone}>{item.source}</DataTag><strong>{item.latest}</strong><span>{item.scope}</span><p>{item.next}</p></article>)}</section>
    </> : null}
    {centerView === "governance" ? <>
    <section className="snack-tracking-program">
      <header><div><span>CONTINUOUS CONSUMER TRACKING</span><h3>{tr(locale, "每一期问卷都更新同一套指标与模型", "Each survey wave refreshes one metric and model system")}</h3></div><p>{tr(locale, "固定核心保证跨期可比，轮换模块回答当期决策，重点增样保证关键分组精度；经营结果回流后校准预测。", "A fixed core protects comparability, rotating modules answer current decisions, boosts secure subgroup precision, and business outcomes calibrate predictions.")}</p></header>
      <div>{trackingModules.map((item) => <article key={item.code}><header><b>{item.code}</b><span>{item.status}</span></header><h4>{item.name}</h4><p>{item.coverage}</p><dl><div><dt>{tr(locale, "更新", "Cadence")}</dt><dd>{item.cadence}</dd></div><div><dt>{tr(locale, "进入模型", "Model use")}</dt><dd>{item.use}</dd></div></dl></article>)}</div>
    </section>
    <SectionTitle eyebrow="DATA GOVERNANCE" title={tr(locale, "数据定义贯通问卷、商品、指标与经营结果", "Shared definitions connect research, products, metrics and outcomes")} note={tr(locale, "统一题号、Base、权重、单位和时间口径，保证筛选后的数字能够在看板、模型和报告之间复核。", "Question, base, weight, unit and time definitions reconcile across dashboards, models and reports.")} />
    <section className="snack-lineage"><article><span>01</span><b>{tr(locale, "业务决策", "Business decision")}</b><p>{tr(locale, "进入、目标人群、产品、价格、渠道、上市", "entry, segment, product, price, channel, launch")}</p></article><i>→</i><article><span>02</span><b>{tr(locale, "问卷与采集", "Research & observation")}</b><p>{tr(locale, "配额、核心题、DCE、概念、商品与公开数据", "quota, core questions, DCE, concept, product and public data")}</p></article><i>→</i><article><span>03</span><b>{tr(locale, "指标系统", "Metric system")}</b><p>{tr(locale, "口径、基数、权重、时间、市场与人群", "definition, base, weight, time, market and segment")}</p></article><i>→</i><article><span>04</span><b>{tr(locale, "模型与情景", "Models & scenarios")}</b><p>{tr(locale, "需求、选择、价格、新品与货架", "demand, choice, pricing, launch and shelf")}</p></article><i>→</i><article><span>05</span><b>{tr(locale, "结果回流", "Outcome feedback")}</b><p>{tr(locale, "动作、试购、复购、销量、铺货与下架", "action, trial, repeat, sales, distribution and delisting")}</p></article></section>
    <section className="snack-metric-table"><header><span>{tr(locale, "题目/来源", "Question/source")}</span><span>{tr(locale, "输入", "Input")}</span><span>{tr(locale, "指标", "Metric")}</span><span>{tr(locale, "模型角色", "Model role")}</span><span>{tr(locale, "频率", "Cadence")}</span><span>{tr(locale, "状态", "Status")}</span></header>{QUESTION_METRICS.map((item) => <div key={item.question}><b>{item.question}</b><span>{item.input}</span><span>{item.metric}</span><span>{item.model}</span><small>{item.cadence}</small><em className={item.status.includes("待") ? "gap" : item.status.includes("深度") ? "model" : "ready"}>{item.status}</em></div>)}</section>
    <section className="snack-sample-plan">
      <header><div><span>RESEARCH SAMPLE DESIGN</span><h3>{tr(locale, "样本量按分析粒度与更新频率配置", "Sample size follows analytical grain and refresh cadence")}</h3></div><p>{tr(locale, "误差为简单随机抽样、50%比例下的近似95%误差；加权、配额和设计效应会扩大误差。", "Approximate 95% margin of error at 50% under simple random sampling; weighting and design effects increase it.")}</p></header>
      <div className="snack-sample-bars"><ResponsiveContainer width="100%" height="100%"><BarChart data={SAMPLE_STAGES} margin={{ top: 18, right: 24, bottom: 18, left: 2 }}><CartesianGrid stroke="#e3e7ee" vertical={false} /><XAxis dataKey="stage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip content={<ResearchTooltip />} /><Bar dataKey="n" name={tr(locale, "样本量", "Sample size")} radius={[3, 3, 0, 0]}>{SAMPLE_STAGES.map((item, index) => <Cell key={item.stage} fill={index === 0 ? "#0aa59e" : index === 1 ? "#2639a5" : "#9da6b9"} />)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="snack-sample-cards">{SAMPLE_STAGES.map((item) => <article key={item.stage}><span>{item.stage}</span><strong>N={item.n.toLocaleString()}</strong><b>{item.moe}</b><p>{item.purpose}</p><small>{tr(locale, "适用条件", "Use when")}：{item.gate}</small></article>)}</div>
    </section>
    </> : null}
  </div>;
}

function ResearchProductionGate({ locale, design, run, onBackToExecution }: { locale: Locale; design: LockedProjectDesign | null; run: ProjectRunRecord | null; onBackToExecution: () => void }) {
  const reason = !design
    ? tr(locale, "尚未锁定第02步研究设计", "No step-02 design has been locked")
    : !run || run.designVersion !== design.designVersion
      ? tr(locale, "当前设计尚未建立同版本执行记录", "The current design has no matching execution record")
      : tr(locale, "当前执行记录尚未关闭回收", "The current run has not closed fieldwork");
  return <div className="snack-stack research-production-flow">
    <SectionTitle eyebrow="DATA → TABLE → MODEL" title={tr(locale, "从最终Raw Data到Table、指标与模型", "From final Raw Data to tables, metrics and models")} note={tr(locale, "第04步只接收已关闭回收且与当前研究设计一致的项目运行记录。", "Step 04 only accepts a closed project run that matches the current research design.")} />
    <section className="execution-design-gate production-step-gate"><span>PROJECT RUN REQUIRED</span><h3>{reason}</h3><p>{tr(locale, "先在第03步完成程序配置、小流量检查、正式回收和配额关闭，再上传唯一最终CSV。", "Complete programming, soft launch, fieldwork and quota closure in step 03 before uploading the single final CSV.")}</p><button type="button" onClick={onBackToExecution}>{tr(locale, "返回第03步", "Return to step 03")}</button></section>
  </div>;
}

function ResearchProductionFlow({ locale, design, run, initialProduction, onProduction, onFinalRawBound }: { locale: Locale; design: LockedProjectDesign; run: ProjectRunRecord; initialProduction: RawProductionResult | null; onProduction: (result: RawProductionResult) => void; onFinalRawBound: (result: RawProductionResult) => void }) {
  const [production, setProduction] = useState<RawProductionResult | null>(initialProduction);
  const [uploadState, setUploadState] = useState<"processing" | "ready" | "blocked" | "error">(initialProduction?.meta.status ?? "processing");
  const [uploadMessage, setUploadMessage] = useState(initialProduction
    ? tr(locale, "当前项目结果已载入", "Current project result loaded")
    : tr(locale, "等待最终CSV", "Waiting for the final CSV"));
  const [tableMode, setTableMode] = useState<"count" | "no_sig" | "sig">("no_sig");
  const [bannerKey, setBannerKey] = useState(initialProduction?.table.defaultBannerKey ?? "age");
  const [tableView, setTableView] = useState<"banner" | "grid">("banner");
  const [metricGroupKey, setMetricGroupKey] = useState(initialProduction?.table.metricGroups[0]?.key ?? "summary");
  const [showAllMappings, setShowAllMappings] = useState(false);

  const runProduction = useCallback(async (file: File) => {
    setUploadState("processing");
    setUploadMessage(tr(locale, "正在识别字段并生产Table与模型", "Mapping fields and producing tables and model"));
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) throw new Error(tr(locale, "请选择CSV文件", "Select a CSV file"));
      if (file.size > 15 * 1024 * 1024) throw new Error(tr(locale, "单个CSV文件不能超过15MB", "A CSV file cannot exceed 15 MB"));
      let payload: RawProductionResult & { error?: string };
      if (IS_STATIC_DEMO) {
        const resultKey = `${run.runId}__${design.designVersion}__${Date.now()}`;
        const storedAt = new Date().toISOString();
        payload = {
          ...buildRawProductionResult(await file.text(), file.name),
          binding: {
            runId: run.runId,
            designVersion: design.designVersion,
            designConfirmationKey: design.confirmationKey,
            resultKey,
            storedAt,
          },
        };
        window.localStorage.setItem(`${PROJECT_RESULT_STORAGE_PREFIX}${resultKey}`, JSON.stringify(payload));
      } else {
        const headers: Record<string, string> = {
          "x-raw-file-name": encodeURIComponent(file.name),
          "x-raw-uncompressed-size": String(file.size),
          "x-project-run-id": run.runId,
          "x-design-version": design.designVersion,
          "x-design-confirmation-key": encodeURIComponent(design.confirmationKey),
        };
        let body: BodyInit;
        if (typeof CompressionStream === "function") {
          const compressed = file.stream().pipeThrough(new CompressionStream("gzip"));
          body = await new Response(compressed).arrayBuffer();
          headers["content-type"] = "application/gzip";
        } else {
          body = file;
          headers["content-type"] = "text/csv;charset=utf-8";
        }
        const response = await fetch("/api/research-operations/raw-production", { method: "POST", headers, body });
        const responseText = await response.text();
        try {
          payload = JSON.parse(responseText) as RawProductionResult & { error?: string };
        } catch {
          throw new Error(response.ok ? tr(locale, "生产接口返回格式异常", "The production service returned an invalid response") : responseText || tr(locale, "数据生产失败", "Data production failed"));
        }
        if (!response.ok) throw new Error(payload.error || tr(locale, "数据生产失败", "Data production failed"));
      }
      if (payload.meta.status === "ready" && (payload.binding?.runId !== run.runId || payload.binding?.designVersion !== design.designVersion || payload.binding?.designConfirmationKey !== design.confirmationKey)) {
        throw new Error(tr(locale, "项目结果未正确绑定当前运行版本", "The result was not bound to the current project run"));
      }
      setProduction(payload);
      onProduction(payload);
      if (payload.meta.status === "ready") onFinalRawBound(payload);
      setBannerKey(payload.table.defaultBannerKey);
      setTableView("banner");
      setMetricGroupKey(payload.table.metricGroups[0]?.key ?? "summary");
      setShowAllMappings(false);
      setUploadState(payload.meta.status === "ready" ? "ready" : "blocked");
      setUploadMessage(payload.meta.status === "ready"
        ? tr(locale, "字段、Table与模型已按当前文件重新生产", "Fields, tables and model were rebuilt from this file")
        : tr(locale, "结构检查未通过，Table可预览但模型已阻断", "Structural checks failed; tables are previewable and model execution is blocked"));
    } catch (error) {
      setProduction(null);
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : tr(locale, "数据生产失败", "Data production failed"));
    }
  }, [design.confirmationKey, design.designVersion, locale, onFinalRawBound, onProduction, run.runId]);

  const activeBanner = production?.table.bannerGroups.find((item) => item.key === bannerKey) ?? production?.table.bannerGroups[0];
  const activeMetricGroup = production?.table.metricGroups.find((item) => item.key === metricGroupKey) ?? production?.table.metricGroups[0];
  const activeGrid = production?.table.grids[0];
  const metricDefinitions = useMemo(() => {
    if (!production) return [];
    const metricKeys = tableView === "grid" ? activeGrid?.metricKeys : activeMetricGroup?.metricKeys;
    const selected = metricKeys ? new Set(metricKeys) : null;
    return production.table.metricDefinitions.filter((metric) => !selected || selected.has(metric.key));
  }, [activeGrid?.metricKeys, activeMetricGroup?.metricKeys, production, tableView]);
  const previewColumns = tableView === "grid" ? activeGrid?.columns ?? [] : activeBanner?.rows ?? [];
  const productionMappings = production?.schema.mappings.filter((item) => item.role !== "model_feature") ?? [];
  const visibleMappings = showAllMappings ? productionMappings : productionMappings.slice(0, 8);
  const resultArtifacts = production?.binding?.artifacts ?? [];
  const model = production?.model;
  const maxCoefficient = Math.max(...(model?.coefficients.map((item) => Math.abs(item.standardizedBeta)) ?? [1]), .001);
  const statusLabel = uploadState === "processing"
    ? tr(locale, "生产中", "Processing")
    : uploadState === "ready"
      ? tr(locale, "生产完成", "Complete")
      : uploadState === "blocked"
        ? tr(locale, "已阻断", "Blocked")
        : tr(locale, "处理失败", "Failed");
  const renderCell = (cell: ProductionCell | undefined, metric: ProductionMetricDefinition) => valueForFamily(cell, metric, tableMode);
  const downloadTable = (family: TableFamily) => {
    if (!production) return;
    if (tableView === "grid" && activeGrid) {
      downloadTextDocument(buildGridCsv(production, activeGrid.key, family, locale), gridCsvFileName(family, locale), "text/csv;charset=utf-8");
      return;
    }
    if (!activeBanner) return;
    const groupLabel = activeMetricGroup ? locale === "zh" ? activeMetricGroup.labelZh : activeMetricGroup.labelEn : undefined;
    downloadTextDocument(buildTableCsv(production, activeBanner.key, family, locale, activeMetricGroup?.key), tableCsvFileName(activeBanner, family, locale, groupLabel), "text/csv;charset=utf-8");
  };
  return <div className="snack-stack research-production-flow">
    <SectionTitle eyebrow="DATA → TABLE → MODEL" title={tr(locale, "从最终Raw Data到Table、指标与模型", "From final Raw Data to tables, metrics and models")} note={tr(locale, "本页从已完成质检和清洗的最终数据开始，按已锁定的分析口径生产结果。", "This page starts from the final quality-checked dataset and produces results using locked analysis definitions.")} />
    <section className="production-output-chain data-production-chain"><article><span>01</span><b>{tr(locale, "上传最终Raw Data", "Upload final Raw Data")}</b><p>{tr(locale, "唯一生产版本", "Single production version")}</p></article><i>→</i><article><span>02</span><b>{tr(locale, "字段与版本对齐", "Align fields and version")}</b><p>{tr(locale, "题号、Code、Base、权重", "IDs, codes, bases and weights")}</p></article><i>→</i><article><span>03</span><b>Table</b><p>Count · No sig · Sig</p></article><i>→</i><article><span>04</span><b>KPI</b><p>{tr(locale, "通用与项目专项指标", "Common and project KPIs")}</p></article><i>→</i><article><span>05</span><b>{tr(locale, "模型运行与验证", "Model run and validation")}</b><p>{tr(locale, "驱动、选择与预测证据", "Driver, choice and forecast evidence")}</p></article></section>

    <section className="final-data-intake">
      <header><div><span>FINAL RAW DATA</span><h3>{tr(locale, "上传唯一生产数据版本", "Upload the single production dataset")}</h3><p>{tr(locale, "当前在线接口直接处理CSV，重新计算字段映射、Base、加权KPI、显著性与项目模型。", "The live interface processes CSV and rebuilds field mappings, bases, weighted KPIs, significance and the project model.")}</p></div><div className="final-data-actions"><label className="final-data-upload"><input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void runProduction(file); }} /><span>{tr(locale, "上传最终CSV", "Upload final CSV")}</span></label></div></header>
      <div className="final-data-status"><article><span>{tr(locale, "当前版本", "Current version")}</span><strong>{production?.meta.fileName ?? "—"}</strong><small>{production ? new Date(production.meta.processedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB") : tr(locale, "等待生产", "Waiting")}</small></article><article><span>{tr(locale, "进入生产样本", "Production sample")}</span><strong>{production ? `N=${production.meta.eligibleRowCount.toLocaleString()}` : "—"}</strong><small>{production ? `${production.meta.rowCount.toLocaleString()} ${tr(locale, "行已读取", "rows read")}` : tr(locale, "唯一进入Table与模型", "Only input to tables and models")}</small></article><article><span>{tr(locale, "字段映射", "Field mapping")}</span><strong>{production ? `${production.schema.mappedColumnCount}/${production.meta.columnCount}` : "—"}</strong><small>{production ? `${production.structuralChecks.metricCount} KPI · ${production.schema.unmappedColumns.length} ${tr(locale, "未映射", "unmapped")}` : tr(locale, "题号与Code对齐", "Align IDs and codes")}</small></article><article className={uploadState}><span>{tr(locale, "生产状态", "Production status")}</span><strong>{statusLabel}</strong><small>{uploadMessage}</small></article></div>
      {production ? <div className="field-mapping-panel"><header><div><span>{tr(locale, "字段契约", "Field contract")}</span><strong>{productionMappings.length} {tr(locale, "项已进入Table与指标生产", "mapped inputs feed tables and metrics")}</strong></div>{productionMappings.length > 8 ? <button type="button" onClick={() => setShowAllMappings((current) => !current)}>{showAllMappings ? tr(locale, "收起", "Collapse") : tr(locale, `查看全部${productionMappings.length}项`, `View all ${productionMappings.length}`)}</button> : null}</header><div className="field-mapping-strip">{visibleMappings.map((item) => <article key={item.canonical}><span>{item.questionId}</span><strong>{locale === "zh" ? item.labelZh : item.labelEn}</strong><code>{item.sourceColumn}</code></article>)}</div></div> : null}
      {production && (production.structuralChecks.blockers.length || production.structuralChecks.warnings.length) ? <div className={`production-gate-message ${production.meta.status}`}><strong>{production.meta.status === "ready" ? tr(locale, "结构提醒", "Structure notes") : tr(locale, "生产阻断", "Production blocked")}</strong><div>{[...production.structuralChecks.blockers, ...production.structuralChecks.warnings].map((item) => <span key={item}>{item}</span>)}</div></div> : null}
      {production ? <div className="raw-data-preview" style={{ "--raw-columns": production.preview.headers.length } as CSSProperties}><header>{production.preview.headers.map((header) => <span key={header}>{header}</span>)}</header>{production.preview.rows.map((row, rowIndex) => <div key={`${row[0]}-${rowIndex}`}>{row.map((value, index) => index === 0 ? <strong key={`${index}-${value}`}>{value}</strong> : <span key={`${index}-${value}`}>{value || "—"}</span>)}</div>)}</div> : null}
    </section>

    <section className="production-result-grid">
      <article className="table-result-preview">
        <header>
          <div><span>TABLE OUTPUT</span><h3>{tr(locale, "多指标结果矩阵", "Multi-metric result matrix")}</h3></div>
          <div className="table-view-switch" aria-label={tr(locale, "Table视图", "Table view")}>
            <button type="button" className={tableView === "banner" ? "active" : ""} onClick={() => setTableView("banner")}>{tr(locale, "Banner Table", "Banner table")}</button>
            <button type="button" className={tableView === "grid" ? "active" : ""} onClick={() => setTableView("grid")}>Grid101</button>
          </div>
        </header>
        <div className="table-result-toolbar">
          <div className="table-result-controls">
            <label><span>{tr(locale, "指标模块", "Metric module")}</span><select aria-label={tr(locale, "指标模块", "Metric module")} disabled={tableView === "grid"} value={activeMetricGroup?.key ?? ""} onChange={(event) => setMetricGroupKey(event.target.value)}>{production?.table.metricGroups.map((group) => <option key={group.key} value={group.key}>{locale === "zh" ? group.labelZh : group.labelEn} · {group.questionRange}</option>)}</select></label>
            <label><span>Banner</span><select aria-label={tr(locale, "分析Banner", "Analysis banner")} disabled={tableView === "grid"} value={activeBanner?.key ?? ""} onChange={(event) => setBannerKey(event.target.value)}>{production?.table.bannerGroups.map((banner) => <option key={banner.key} value={banner.key}>{locale === "zh" ? banner.labelZh : banner.labelEn}</option>)}</select></label>
          </div>
          <nav>{(["count", "no_sig", "sig"] as const).map((mode) => <button type="button" className={tableMode === mode ? "active" : ""} onClick={() => setTableMode(mode)} key={mode}>{mode === "count" ? "Count" : mode === "no_sig" ? "No sig" : "Sig"}</button>)}</nav>
        </div>
        {production && previewColumns.length ? <div className="table-matrix-scroll"><div className="table-matrix" style={{ "--table-columns": previewColumns.length } as CSSProperties}>
          <header><span>{tr(locale, "题号 / 指标", "Question / metric")}</span>{previewColumns.map((column) => <span key={column.key}>{column.letter ?? "A"}<small>{column.label}</small></span>)}</header>
          <div className="base-row"><strong>Base</strong>{previewColumns.map((column) => <span key={column.key}>{column.baseN.toLocaleString()}</span>)}</div>
          {metricDefinitions.map((metric) => <div key={metric.key}><strong><small>{metric.questionId}</small>{locale === "zh" ? metric.labelZh : metric.labelEn}</strong>{previewColumns.map((column) => <span key={column.key}>{renderCell(column.metrics[metric.key], metric)}</span>)}</div>)}
        </div></div> : <div className="production-empty-state">{tr(locale, "完成字段生产后显示Table", "The table appears after field production")}</div>}
        <footer>
          <div><span>{tr(locale, "当前分析口径", "Current analysis route")}</span><strong>{tableView === "grid" ? tr(locale, "Grid101 · 年龄与性别核心交叉", "Grid101 · core age and gender cuts") : activeBanner ? `${locale === "zh" ? activeBanner.labelZh : activeBanner.labelEn} · ${tr(locale, "互斥独立样本 · 双侧95%", "mutually exclusive independent samples · two-sided 95%")}` : "Total only"}</strong><p>{tr(locale, "比例与均值采用加权结果和Kish有效样本量进行检验；Median仅展示数值。Sig字母表示该列显著高于对应列。", "Weighted proportions and means use Kish effective bases; medians are shown without significance testing. Sig letters mark a column significantly above its comparison column.")}</p></div>
          <div className="table-download-actions"><button type="button" disabled={!previewColumns.length} onClick={() => downloadTable("count")}>Count CSV</button><button type="button" disabled={!previewColumns.length} onClick={() => downloadTable("no_sig")}>No sig CSV</button><button type="button" disabled={!previewColumns.length} onClick={() => downloadTable("sig")}>Sig CSV</button>{resultArtifacts.length && production?.binding ? <details className="result-artifact-archive"><summary>{tr(locale, `版本Table（${resultArtifacts.length}）`, `Version tables (${resultArtifacts.length})`)}</summary><div>{resultArtifacts.map((artifact) => <a key={artifact.key} href={`/api/research-operations/project-results?runId=${encodeURIComponent(production.binding!.runId)}&designVersion=${encodeURIComponent(production.binding!.designVersion)}&artifactKey=${encodeURIComponent(artifact.key)}`} download>{locale === "zh" ? artifact.labelZh : artifact.labelEn}</a>)}</div></details> : null}</div>
        </footer>
      </article>
      <article className="model-run-summary"><header><div><span>MODEL RUN</span><h3>{tr(locale, "模型结果与验证", "Model results and validation")}</h3></div><strong>{production ? `RUN-${production.meta.processedAt.slice(0, 10).replaceAll("-", "")}` : "—"}</strong></header>{model?.status === "fitted" ? <><div className="model-run-metrics"><section><span>{tr(locale, "项目目标", "Project target")}</span><strong>{tr(locale, model.target, "Concept trial T2B")}</strong><small>{model.targetRule}</small></section><section><span>{tr(locale, "留出集验证", "Holdout validation")}</span><strong>AUC {model.testAuc == null ? "—" : format(model.testAuc, 3)}</strong><small>Brier {model.testBrier == null ? "—" : format(model.testBrier, 3)}</small></section><section><span>{tr(locale, "训练 / 留出样本", "Train / holdout")}</span><strong>{model.trainN.toLocaleString()} / {model.testN.toLocaleString()}</strong><small>{tr(locale, "按样本ID固定划分", "Fixed by respondent ID")}</small></section></div><div className="model-run-drivers">{model.coefficients.slice(0, 6).map((item) => <div key={item.sourceColumn}><span>{item.variable}<small>{item.sourceColumn}</small></span><i><b className={item.direction === "negative" ? "negative" : ""} style={{ width: `${Math.abs(item.standardizedBeta) / maxCoefficient * 100}%` }} /></i><strong>{item.standardizedBeta > 0 ? "+" : ""}{format(item.standardizedBeta, 3)} β</strong></div>)}</div></> : <div className="model-blocked-state"><strong>{tr(locale, "模型尚未运行", "Model not run")}</strong>{(model?.blockers ?? [tr(locale, "等待生产数据", "Waiting for production data")]).map((item) => <span key={item}>{item}</span>)}</div>}<footer><span>{tr(locale, "适用边界", "Use boundary")}</span><p>{model?.boundary ?? tr(locale, "模型只在字段、目标和留出样本满足条件后运行。", "The model runs only after fields, target and holdout sample pass their gates.")}</p></footer></article>
    </section>
  </div>;
}

function ProjectExecutionHub({ locale, design, run, syncState, onBackToDesign, onRunChange }: { locale: Locale; design: LockedProjectDesign | null; run: ProjectRunRecord | null; syncState: "idle" | "saving" | "saved" | "error"; onBackToDesign: () => void; onRunChange: (run: ProjectRunRecord) => void }) {
  const [programId, setProgramId] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [softLaunchN, setSoftLaunchN] = useState("");
  const [softChecks, setSoftChecks] = useState({ routingPassed: false, randomizationPassed: false, fieldMapPassed: false, quotaCountPassed: false });
  const [completedN, setCompletedN] = useState("0");
  const [minimumQuotaCompletion, setMinimumQuotaCompletion] = useState("0");
  const activeRun = design && run?.designVersion === design.designVersion ? run : null;
  useEffect(() => {
    if (!activeRun) {
      setProgramId("");
      setAccessUrl("");
      setSoftLaunchN("");
      setSoftChecks({ routingPassed: false, randomizationPassed: false, fieldMapPassed: false, quotaCountPassed: false });
      setCompletedN("0");
      setMinimumQuotaCompletion("0");
      return;
    }
    setProgramId(activeRun.program?.programId ?? "");
    setAccessUrl(activeRun.program?.accessUrl ?? "");
    setSoftLaunchN(activeRun.softLaunch ? String(activeRun.softLaunch.completedN) : "");
    setSoftChecks(activeRun.softLaunch ? { routingPassed: activeRun.softLaunch.routingPassed, randomizationPassed: activeRun.softLaunch.randomizationPassed, fieldMapPassed: activeRun.softLaunch.fieldMapPassed, quotaCountPassed: activeRun.softLaunch.quotaCountPassed } : { routingPassed: false, randomizationPassed: false, fieldMapPassed: false, quotaCountPassed: false });
    setCompletedN(String(activeRun.fieldwork.completedN));
    setMinimumQuotaCompletion(String(activeRun.fieldwork.minimumQuotaCompletion));
  }, [activeRun?.runId, activeRun?.updatedAt]);
  if (!design) return <div className="snack-stack project-execution-hub client-progress-hub">
    <SectionTitle eyebrow="FIELDWORK" title={tr(locale, "问卷执行、样本回收与配额进度", "Survey execution, sample collection and quota progress")} note={tr(locale, "第03步只承接第02步已锁定的设计版本。", "Step 03 only accepts a design version locked in step 02.")} />
    <section className="execution-design-gate"><span>DESIGN VERSION REQUIRED</span><h3>{tr(locale, "等待第02步锁定研究设计", "Waiting for a locked research design")}</h3><p>{tr(locale, "问卷、配额表和DP Spec必须属于同一设计版本，确认后才能进入程序配置与样本执行。", "The questionnaire, quota and DP Spec must share one design version before programming and fieldwork can start.")}</p><button type="button" onClick={onBackToDesign}>{tr(locale, "返回第02步", "Return to step 02")}</button></section>
  </div>;
  const quota = QUOTA_OPTIONS.find((item) => item.id === design.quotaMode)!;
  const makeRun = () => {
    const now = new Date().toISOString();
    onRunChange({ runId: `${design.designVersion}-RUN-01`, projectId: design.projectId, designVersion: design.designVersion, designConfirmationKey: design.confirmationKey, designSnapshot: design, stage: "programming", createdAt: now, updatedAt: now, targetN: design.sampleN, fieldwork: { completedN: 0, minimumQuotaCompletion: 0, updatedAt: null } });
  };
  const saveProgramming = () => {
    if (!activeRun || !programId.trim() || !/^https?:\/\//i.test(accessUrl.trim())) return;
    const now = new Date().toISOString();
    onRunChange({ ...activeRun, stage: "soft_launch", updatedAt: now, program: { programId: programId.trim(), accessUrl: accessUrl.trim(), confirmedAt: now } });
  };
  const saveSoftLaunch = () => {
    const n = Number(softLaunchN);
    if (!activeRun || n < 30 || !Object.values(softChecks).every(Boolean)) return;
    const now = new Date().toISOString();
    onRunChange({ ...activeRun, stage: "fieldwork", updatedAt: now, softLaunch: { completedN: n, ...softChecks, confirmedAt: now } });
  };
  const saveFieldwork = (close = false) => {
    if (!activeRun) return;
    const complete = Math.max(0, Math.min(activeRun.targetN, Number(completedN) || 0));
    const quotaCompletion = Math.max(0, Math.min(100, Number(minimumQuotaCompletion) || 0));
    if (close && (complete < activeRun.targetN || quotaCompletion < 100)) return;
    const now = new Date().toISOString();
    onRunChange({ ...activeRun, stage: close ? "closed" : "fieldwork", updatedAt: now, closedAt: close ? now : activeRun.closedAt, fieldwork: { completedN: complete, minimumQuotaCompletion: quotaCompletion, updatedAt: now } });
  };
  const programDone = Boolean(activeRun?.program);
  const softDone = Boolean(activeRun?.softLaunch);
  const fieldworkDone = activeRun?.stage === "closed" || activeRun?.stage === "data_ready";
  const dataReady = activeRun?.stage === "data_ready";
  const stages = [
    { code: "01", zh: "程序配置", en: "Survey programming", done: programDone, active: activeRun?.stage === "programming", detailZh: "按锁定问卷配置题目、跳转、随机分组与数据字段", detailEn: "Program items, routing, randomization and data fields from the locked questionnaire" },
    { code: "02", zh: "小流量检查", en: "Soft launch", done: softDone, active: activeRun?.stage === "soft_launch", detailZh: "检查路由、随机组平衡、字段和配额计数", detailEn: "Check routing, random-cell balance, fields and quota counts" },
    { code: "03", zh: "正式回收", en: "Main fieldwork", done: fieldworkDone, active: activeRun?.stage === "fieldwork", detailZh: "通过小流量检查后按目标样本正式回收", detailEn: "Begin main collection after soft-launch checks pass" },
    { code: "04", zh: "配额监控", en: "Quota monitoring", done: fieldworkDone, active: activeRun?.stage === "fieldwork", detailZh: "按锁定配额单元监测总体与最低单元进度", detailEn: "Monitor total and minimum-cell progress against locked quotas" },
    { code: "05", zh: "回收结束", en: "Fieldwork close", done: fieldworkDone, active: false, detailZh: "总体和最低配额单元均达到100%后关闭回收", detailEn: "Close after total and minimum quota cells both reach 100%" },
  ];
  const stageLabel = !activeRun ? tr(locale, "未建立", "Not created") : activeRun.stage === "programming" ? tr(locale, "程序配置", "Programming") : activeRun.stage === "soft_launch" ? tr(locale, "小流量检查", "Soft launch") : activeRun.stage === "fieldwork" ? tr(locale, "正式回收", "Fieldwork") : activeRun.stage === "closed" ? tr(locale, "等待最终Raw", "Waiting for final Raw") : tr(locale, "最终Raw已绑定", "Final Raw bound");
  const downloadLockedQuestionnaire = () => {
    if (!design.finalQuestionnaire) return;
    downloadResearchWorkbook([{ name: "问卷", rows: [["模块", "题号", "题型", "题目", "选项与Code", "Base", "程序员逻辑", "指标层级", "KPI映射", "模型角色"], ...design.finalQuestionnaire.questions.map((item) => [item.module, item.questionId, item.responseType, item.questionText, item.options.map((option, index) => `${index + 1} ${option}`).join("\n"), item.base, item.logic, item.indicatorLayer, item.kpiIds.join(" · ") || "项目专项变量", item.modelRoles.join(" · ") || "项目解释变量"])] }], `中国薄脆饼干新品概念与定价研究_${design.finalQuestionnaire.version}_问卷.xlsx`);
  };
  const downloadLockedQuota = () => {
    if (!design.finalQuestionnaire || !design.quotaRows) return;
    downloadResearchWorkbook([{ name: "配额表", rows: [["配额方式", "控制对象", "问卷字段", "控制方法", "目标结构", "目标N", "问卷版本"], ...design.quotaRows.map((row) => [quota.zh, ...row, design.sampleN, design.finalQuestionnaire!.version])] }], `中国薄脆饼干新品概念与定价研究_${design.finalQuestionnaire.version}_${quota.zh}_配额表.xlsx`);
  };
  const downloadLockedDpSpec = () => {
    if (!design.finalQuestionnaire) return;
    downloadResearchWorkbook([
      { name: "General", rows: [["字段", "定义"], ["项目", "中国薄脆饼干新品概念与定价研究"], ["设计版本", design.designVersion], ["问卷版本", design.finalQuestionnaire.version], ["目标样本", design.sampleN], ["配额方式", quota.zh], ["Table输出", "Count / No sig / Sig"]] },
      { name: "Spec", rows: [["题号", "模块", "题型", "Base", "KPI映射", "模型角色", "程序逻辑"], ...design.finalQuestionnaire.questions.map((item) => [item.questionId, item.module, item.responseType, item.base, item.kpiIds.join(" · ") || "—", item.modelRoles.join(" · ") || "—", item.logic])] },
      { name: "Banner", rows: [["Banner ID", "控制对象", "问卷字段", "控制方法", "目标结构"], ["B00", "Total", "全部有效被访者", "互斥", "Total"], ...(design.quotaRows ?? []).map((row, index) => [`B${String(index + 1).padStart(2, "0")}`, ...row])] },
      { name: "Grid", rows: [["题号", "Banner", "Base", "Count", "No sig", "Sig"], ...design.finalQuestionnaire.questions.map((item) => [item.questionId, "B00 + 已锁定Banner", item.base, "Y", "Y", item.responseType.includes("开放") ? "N" : "Y"])] },
    ], `中国薄脆饼干新品概念与定价研究_${design.designVersion}_DP_Spec.xlsx`);
  };
  return <div className="snack-stack project-execution-hub client-progress-hub">
    <SectionTitle eyebrow="FIELDWORK" title={tr(locale, "锁定设计进入执行准备", "Move the locked design into execution")} note={tr(locale, "本页读取第02步确认的同一问卷、配额与DP Spec版本，不再使用固定示例进度。", "This page reads the same questionnaire, quota and DP Spec version locked in step 02 and does not use fixed example progress.")} />
    <section className="execution-locked-inputs"><article><span>{tr(locale, "设计版本", "Design version")}</span><strong>{design.designVersion}</strong><small>{new Date(design.lockedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB")}</small></article><article><span>{tr(locale, "Final问卷", "Final questionnaire")}</span><strong>{design.finalQuestionnaire?.version ?? design.artifactVersion}</strong><small>{design.finalQuestionnaire ? `${design.finalQuestionnaire.questions.length} ${tr(locale, "个有效题目", "active questions")}` : design.experimentQuestionIds.join(" · ")}</small></article><article><span>{tr(locale, "配额与样本", "Quota and sample")}</span><strong>{tr(locale, quota.zh, quota.en)} · N={design.sampleN.toLocaleString()}</strong><small>{design.finalQuestionnaire ? `${design.finalQuestionnaire.retainedKpis.length} ${tr(locale, "项KPI继续供数", "KPIs retained")}` : `${design.experimentKeys.length} ${tr(locale, "个专项实验", "project experiments")}`}</small></article></section>
    <section className="execution-project-header"><div><span>{tr(locale, "当前项目", "Current project")}</span><h3>{tr(locale, "中国薄脆饼干新品概念与定价研究", "China cracker concept and pricing study")}</h3><p>{activeRun ? `${activeRun.runId} · ${stageLabel}` : tr(locale, "设计已锁定，尚未建立执行记录", "Design locked; execution record not created")}{activeRun ? <em className={`run-sync-state ${syncState}`}>{syncState === "saving" ? tr(locale, "保存中", "Saving") : syncState === "error" ? tr(locale, "保存失败", "Save failed") : syncState === "saved" ? tr(locale, "已保存", "Saved") : ""}</em> : null}</p></div><dl><div><dt>{tr(locale, "执行状态", "Execution")}</dt><dd>{stageLabel}</dd></div><div><dt>{tr(locale, "完成样本", "Completes")}</dt><dd>{activeRun ? `${activeRun.fieldwork.completedN.toLocaleString()} / ${activeRun.targetN.toLocaleString()}` : "—"}</dd></div><div><dt>{tr(locale, "最低配额完成", "Minimum quota completion")}</dt><dd>{activeRun ? `${activeRun.fieldwork.minimumQuotaCompletion}%` : "—"}</dd></div><div><dt>{tr(locale, "最终Raw版本", "Final Raw version")}</dt><dd>{activeRun?.finalRaw?.fileName ?? "—"}</dd></div></dl></section>
    {!activeRun ? <section className="execution-run-create"><div><span>PROJECT RUN</span><h3>{tr(locale, "为当前设计建立执行记录", "Create an execution record for this design")}</h3><p>{tr(locale, "执行记录将程序、小流量、正式回收、配额进度和最终Raw绑定到同一设计版本。", "The run record binds programming, soft launch, fieldwork, quota progress and final Raw to one design version.")}</p></div><button type="button" onClick={makeRun}>{tr(locale, "建立执行记录", "Create run")}</button></section> : null}
    <section className="execution-stage-grid">{stages.map((item) => <article key={item.code} className={item.done ? "done" : item.active ? "active" : "pending"}><header><b>{item.code}</b><em>{item.done ? tr(locale, "已完成", "Complete") : item.active ? tr(locale, "当前阶段", "Current") : tr(locale, "未开始", "Not started")}</em></header><h3>{tr(locale, item.zh, item.en)}</h3><p>{tr(locale, item.detailZh, item.detailEn)}</p></article>)}</section>
    {activeRun ? <section className="execution-stage-control">
      {activeRun.stage === "programming" ? <><header><span>01 · PROGRAMMING</span><h3>{tr(locale, "登记程序版本与访问入口", "Register the survey program and access URL")}</h3></header><div className="execution-control-fields"><label><span>{tr(locale, "程序版本 / ID", "Program version / ID")}</span><input value={programId} onChange={(event) => setProgramId(event.target.value)} placeholder="PROGRAM-V2-R1" /></label><label><span>{tr(locale, "测试访问链接", "Test access URL")}</span><input value={accessUrl} onChange={(event) => setAccessUrl(event.target.value)} placeholder="https://..." /></label></div><footer><p>{tr(locale, "两项均登记后才能进入小流量检查。", "Both fields are required before soft launch.")}</p><button type="button" disabled={!programId.trim() || !/^https?:\/\//i.test(accessUrl.trim())} onClick={saveProgramming}>{tr(locale, "确认程序配置", "Confirm programming")}</button></footer></> : null}
      {activeRun.stage === "soft_launch" ? <><header><span>02 · SOFT LAUNCH</span><h3>{tr(locale, "记录小流量样本并完成四项门槛", "Record soft-launch completes and pass four gates")}</h3></header><div className="soft-launch-control"><label className="numeric"><span>{tr(locale, "有效完成样本", "Valid completes")}</span><input type="number" min="0" value={softLaunchN} onChange={(event) => setSoftLaunchN(event.target.value)} /><small>N≥30</small></label><div>{([{ key: "routingPassed", zh: "跳转与Base", en: "Routing and bases" }, { key: "randomizationPassed", zh: "随机分组平衡", en: "Random-cell balance" }, { key: "fieldMapPassed", zh: "Raw字段映射", en: "Raw field mapping" }, { key: "quotaCountPassed", zh: "配额计数", en: "Quota counts" }] as const).map((item) => <label key={item.key} className={softChecks[item.key] ? "checked" : ""}><input type="checkbox" checked={softChecks[item.key]} onChange={(event) => setSoftChecks((current) => ({ ...current, [item.key]: event.target.checked }))} /><span>{tr(locale, item.zh, item.en)}</span></label>)}</div></div><footer><p>{tr(locale, "N≥30且四项全部通过后才能开始正式回收。", "N≥30 and all four checks are required before main fieldwork.")}</p><button type="button" disabled={Number(softLaunchN) < 30 || !Object.values(softChecks).every(Boolean)} onClick={saveSoftLaunch}>{tr(locale, "通过小流量检查", "Pass soft launch")}</button></footer></> : null}
      {activeRun.stage === "fieldwork" ? <><header><span>03–04 · FIELDWORK</span><h3>{tr(locale, "更新总体样本与最低配额单元", "Update total completes and the minimum quota cell")}</h3></header><div className="execution-control-fields"><label><span>{tr(locale, "当前有效完成样本", "Current valid completes")}</span><input type="number" min="0" max={activeRun.targetN} value={completedN} onChange={(event) => setCompletedN(event.target.value)} /></label><label><span>{tr(locale, "最低配额单元完成率", "Minimum quota-cell completion")}</span><input type="number" min="0" max="100" value={minimumQuotaCompletion} onChange={(event) => setMinimumQuotaCompletion(event.target.value)} /></label></div><footer><p>{tr(locale, `关闭条件：有效完成N=${activeRun.targetN.toLocaleString()}且最低配额单元达到100%。`, `Close when valid completes reach N=${activeRun.targetN.toLocaleString()} and the minimum quota cell reaches 100%.`)}</p><div><button type="button" onClick={() => saveFieldwork(false)}>{tr(locale, "保存进度", "Save progress")}</button><button type="button" className="primary" disabled={Number(completedN) < activeRun.targetN || Number(minimumQuotaCompletion) < 100} onClick={() => saveFieldwork(true)}>{tr(locale, "关闭回收", "Close fieldwork")}</button></div></footer></> : null}
      {activeRun.stage === "closed" ? <div className="execution-ready-for-data"><span>05 · FIELDWORK CLOSED</span><h3>{tr(locale, "执行记录已关闭，可进入第04步上传最终Raw", "Run closed; upload the final Raw in step 04")}</h3><p>{tr(locale, "第04步会核对当前设计版本和执行记录，只接受CSV生产版本。", "Step 04 checks the current design and run record and accepts one production CSV.")}</p></div> : null}
      {dataReady && activeRun.finalRaw ? <div className="execution-ready-for-data complete"><span>FINAL RAW BOUND</span><h3>{activeRun.finalRaw.fileName}</h3><p>N={activeRun.finalRaw.eligibleRowCount.toLocaleString()} · {new Date(activeRun.finalRaw.processedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB")}</p></div> : null}
    </section> : null}
    <section className="execution-version-files">{design.finalQuestionnaire ? <><button type="button" onClick={downloadLockedQuestionnaire}><span>01</span><strong>{tr(locale, "锁定问卷", "Locked questionnaire")}</strong><small>{design.finalQuestionnaire.version}</small></button><button type="button" onClick={downloadLockedQuota}><span>02</span><strong>{tr(locale, "锁定配额表", "Locked quota")}</strong><small>{tr(locale, quota.zh, quota.en)}</small></button><button type="button" onClick={downloadLockedDpSpec}><span>03</span><strong>{tr(locale, "锁定DP Spec", "Locked DP Spec")}</strong><small>{design.designVersion}</small></button></> : <><a href={publicAssetPath(design.files.questionnaire)} download><span>01</span><strong>{tr(locale, "锁定问卷", "Locked questionnaire")}</strong><small>{design.artifactVersion}</small></a><a href={publicAssetPath(design.files.quota)} download><span>02</span><strong>{tr(locale, "锁定配额表", "Locked quota")}</strong><small>{tr(locale, quota.zh, quota.en)}</small></a><a href={publicAssetPath(design.files.dpSpec)} download><span>03</span><strong>{tr(locale, "锁定DP Spec", "Locked DP Spec")}</strong><small>{design.artifactVersion}</small></a></>}</section>
  </div>;
}

function downloadHtmlDocument(contents: string, fileName: string) {
  downloadTextDocument(contents, fileName, "text/html;charset=utf-8");
}

function downloadTextDocument(contents: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function InsightDeliveryHub({ locale, production, run, history, loadState, onSelectRun }: { locale: Locale; production: RawProductionResult | null; run: ProjectRunRecord | null; history: ProjectRunRecord[]; loadState: "idle" | "loading" | "ready" | "error"; onSelectRun: (resultKey: string) => void }) {
  const versionCandidates = [run, ...history].filter((item): item is ProjectRunRecord => Boolean(item?.stage === "data_ready" && item.finalRaw?.resultKey)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const seenResultKeys = new Set<string>();
  const resultVersions = versionCandidates.filter((item) => {
    const key = item.finalRaw!.resultKey;
    if (seenResultKeys.has(key)) return false;
    seenResultKeys.add(key);
    return true;
  });
  const activeResultKey = run?.finalRaw?.resultKey ?? "";
  const readyProduction = production?.meta.status === "ready" && (!activeResultKey || production.binding?.resultKey === activeResultKey) ? production : null;
  const summary = readyProduction ? buildInsightDecisionSummary(readyProduction) : null;
  const resultArtifacts = readyProduction?.binding?.artifacts ?? [];
  const priceChart = summary?.priceCurve.map((item) => ({ price: `¥${item.price}`, acceptance: item.acceptance })) ?? [];
  const versionBar = resultVersions.length ? <section className="insight-result-version"><div><span>RESULT VERSION</span><h3>{tr(locale, "项目成果版本", "Project result version")}</h3></div><label><span>{tr(locale, "查看版本", "View version")}</span><select value={activeResultKey} onChange={(event) => onSelectRun(event.target.value)}>{resultVersions.map((item) => <option key={item.finalRaw!.resultKey} value={item.finalRaw!.resultKey}>{item.designVersion} · {item.runId} · {new Date(item.finalRaw!.processedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-GB")}</option>)}</select></label><dl><div><dt>{tr(locale, "设计 / 运行", "Design / run")}</dt><dd>{run ? `${run.designVersion} · ${run.runId}` : "—"}</dd></div><div><dt>{tr(locale, "最终Raw", "Final Raw")}</dt><dd>{run?.finalRaw?.fileName ?? "—"}</dd></div><div><dt>{tr(locale, "有效样本", "Eligible sample")}</dt><dd>{run?.finalRaw ? `N=${run.finalRaw.eligibleRowCount.toLocaleString()}` : "—"}</dd></div><div><dt>{tr(locale, "结果状态", "Result status")}</dt><dd>{loadState === "loading" ? tr(locale, "读取中", "Loading") : loadState === "error" ? tr(locale, "读取失败", "Unavailable") : tr(locale, "已绑定", "Bound")}</dd></div></dl></section> : null;
  if (!readyProduction || !summary) return <div className="snack-stack insight-delivery-hub">
    <SectionTitle eyebrow="EVIDENCE → DECISION" title={tr(locale, "从Table与模型生成可执行判断", "Turn tables and models into executable decisions")} note={tr(locale, "完成第04步后，本页将读取当前项目的KPI、显著性、需求缺口、价格曲线与模型验证。", "After step 04, this page reads the current project KPIs, significance, need gaps, price curve and model validation.")} />
    {versionBar}
    <section className="insight-empty-state"><strong>{loadState === "loading" ? tr(locale, "正在读取项目结果", "Loading project result") : loadState === "error" ? tr(locale, "项目结果暂时无法读取", "Project result is unavailable") : tr(locale, "尚无当前项目结果", "No current project result")}</strong><p>{loadState === "error" ? tr(locale, "结果版本记录仍保留，可返回第04步重新绑定最终CSV。", "The result version record is retained; return to step 04 to bind the final CSV again.") : tr(locale, "请先在第04步运行最终Raw Data，本页不使用另一套静态数据替代当前项目。", "Run the final Raw Data in step 04 first; this page does not substitute another static dataset for the current project.")}</p></section>
  </div>;
  return <div className="snack-stack insight-delivery-hub">
    <SectionTitle eyebrow="EVIDENCE → DECISION" title={tr(locale, "当前数据支持的判断与下一步", "Current evidence-backed decisions and next steps")} note={tr(locale, "结论直接读取第04步的KPI、显著性、需求缺口、价格曲线和留出集验证。", "Conclusions read the step-04 KPIs, significance, need gaps, price curve and holdout validation directly.")} />
    {versionBar}
    <section className="insight-kpi-strip"><article><span>Q1 · {tr(locale, "过去3个月购买率", "3-month purchase")}</span><strong>{summary.penetration == null ? "—" : `${format(summary.penetration)}%`}</strong><small>{summary.leadingAge?.label} {summary.leadingAge?.percent == null ? "—" : `${format(summary.leadingAge.percent)}%`}</small></article><article><span>Q7×Q8 · {tr(locale, "最大需求缺口", "Largest need gap")}</span><strong>{summary.topNeedGap?.gap == null ? "—" : `${format(summary.topNeedGap.gap)}pp`}</strong><small>{tr(locale, summary.topNeedGap?.labelZh ?? "—", summary.topNeedGap?.labelEn ?? "—")}</small></article><article><span>Q9 · {tr(locale, "最大相邻降幅", "Largest adjacent drop")}</span><strong>{summary.priceTransition == null ? "—" : `${format(summary.priceTransition.drop)}pp`}</strong><small>{summary.priceTransition ? `¥${summary.priceTransition.fromPrice} → ¥${summary.priceTransition.toPrice}` : "—"}</small></article><article><span>Q10 · {tr(locale, "概念购买意向", "Concept trial intent")}</span><strong>{summary.conceptTrial == null ? "—" : `${format(summary.conceptTrial)}%`}</strong><small>{tr(locale, summary.weakestConcept?.labelZh ?? "—", summary.weakestConcept?.labelEn ?? "—")}</small></article></section>
    <section className="insight-decision-list">{summary.decisions.map((item) => <article key={item.code}><header><b>{item.code}</b><h3>{tr(locale, item.claimZh, item.claimEn)}</h3></header><div><span>KPI / TABLE</span><p>{tr(locale, item.evidenceZh, item.evidenceEn)}</p></div><div><span>MODEL</span><p>{tr(locale, item.modelZh, item.modelEn)}</p></div><footer><div><span>{tr(locale, "建议动作", "Action")}</span><strong>{tr(locale, item.actionZh, item.actionEn)}</strong></div><div><span>{tr(locale, "下一次验证", "Next validation")}</span><strong>{tr(locale, item.validationZh, item.validationEn)}</strong></div></footer></article>)}</section>
    <section className="insight-diagnostic-grid">
      <article className="insight-gap-analysis"><header><div><span>Q7 × Q8</span><h3>{tr(locale, "需求重要性−满足度缺口", "Importance−satisfaction gap")}</h3></div><small>{tr(locale, "按缺口从高到低排序", "Ranked by gap")}</small></header><div className="insight-gap-head"><span>{tr(locale, "需求", "Need")}</span><span>{tr(locale, "重要性", "Importance")}</span><span>{tr(locale, "满足度", "Satisfaction")}</span><span>{tr(locale, "缺口", "Gap")}</span></div>{summary.needGaps.map((item, index) => <div className="insight-gap-row" key={item.key}><strong><b>{String(index + 1).padStart(2, "0")}</b>{tr(locale, item.labelZh, item.labelEn)}</strong><span><i><b style={{ width: `${item.importance ?? 0}%` }} /></i>{item.importance == null ? "—" : `${format(item.importance)}%`}</span><span><i><b className="satisfaction" style={{ width: `${item.satisfaction ?? 0}%` }} /></i>{item.satisfaction == null ? "—" : `${format(item.satisfaction)}%`}</span><em>{item.gap == null ? "—" : `${format(item.gap)}pp`}</em></div>)}<footer>{tr(locale, "缺口用于本项目改进优先级排序，不解释为行业基准或因果效应。", "The gap ranks improvement priorities within this project; it is not an industry benchmark or causal effect.")}</footer></article>
      <article className="insight-price-analysis"><header><div><span>Q9</span><h3>{tr(locale, "价格接受曲线", "Price acceptance curve")}</h3></div><small>{tr(locale, "六个可比价格点", "Six comparable points")}</small></header><div className="insight-price-chart"><RechartsResponsiveContainer width="100%" height="100%"><LineChart data={priceChart} margin={{ top: 18, right: 20, bottom: 10, left: 0 }}><CartesianGrid stroke="#e2e6ed" vertical={false} /><XAxis dataKey="price" tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(value) => `${value}%`} /><Tooltip content={<ResearchTooltip />} /><Line dataKey="acceptance" name={tr(locale, "接受率", "Acceptance")} stroke="#263aa5" strokeWidth={3} dot={{ r: 4, fill: "#0aa59e", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></RechartsResponsiveContainer></div><footer><strong>{summary.priceTransition ? `¥${summary.priceTransition.fromPrice} → ¥${summary.priceTransition.toPrice}` : "—"}</strong><p>{summary.priceTransition ? tr(locale, `接受率从${format(summary.priceTransition.fromAcceptance)}%降至${format(summary.priceTransition.toAcceptance)}%，下降${format(summary.priceTransition.drop)}pp；用于界定下一轮价格实验范围。`, `Acceptance falls from ${format(summary.priceTransition.fromAcceptance)}% to ${format(summary.priceTransition.toAcceptance)}%, down ${format(summary.priceTransition.drop)}pp; use this to define the next price experiment range.`) : tr(locale, "当前价格点不足以计算降幅。", "The current points are insufficient to calculate a decline.")}</p></footer></article>
    </section>
    <section className="insight-model-validation"><header><div><span>MODEL VALIDATION</span><h3>{tr(locale, "概念购买意向模型", "Concept trial-intent model")}</h3></div><p>{summary.model.boundary}</p></header><div><article><span>{tr(locale, "预测对象", "Target")}</span><strong>{summary.model.target}</strong></article><article><span>AUC</span><strong>{summary.model.auc == null ? "—" : format(summary.model.auc, 3)}</strong></article><article><span>Brier</span><strong>{summary.model.brier == null ? "—" : format(summary.model.brier, 3)}</strong></article><article><span>{tr(locale, "训练 / 留出样本", "Train / holdout")}</span><strong>{summary.model.trainN.toLocaleString()} / {summary.model.testN.toLocaleString()}</strong></article><article><span>{tr(locale, "最强联合关联", "Leading association")}</span><strong>{summary.model.leadingVariable ?? "—"} {summary.model.leadingBeta == null ? "" : `${summary.model.leadingBeta > 0 ? "+" : ""}${format(summary.model.leadingBeta, 3)}β`}</strong></article></div></section>
    <section className={`insight-review-bar ${readyProduction ? "ready" : "pending"}`}><div><span>DELIVERY PACKAGE</span><h3>{readyProduction ? tr(locale, "当前结果已生成可下载交付文件", "Download files generated from the current result") : tr(locale, "完成第04步后生成当前项目交付", "Complete step 04 to generate current project files")}</h3></div><p>{readyProduction ? `${run?.designVersion ?? "—"} · ${run?.runId ?? "—"} · ${readyProduction.meta.fileName} · N=${readyProduction.meta.eligibleRowCount.toLocaleString()}` : tr(locale, "报告只读取第04步的最终Raw Data、Table、KPI和模型结果。", "The report reads only the final Raw Data, tables, KPIs and model result from step 04.")}</p><div className="insight-download-actions"><button type="button" disabled={!readyProduction} onClick={() => readyProduction && downloadHtmlDocument(buildInsightReportDocument(readyProduction, locale), tr(locale, `中国薄脆饼干新品概念与定价研究_${run?.designVersion ?? "RESULT"}_${run?.runId ?? "RUN"}_洞察报告.html`, `China_cracker_concept_pricing_${run?.designVersion ?? "RESULT"}_${run?.runId ?? "RUN"}_insight_report.html`))}>{tr(locale, "完整报告", "Full report")}</button><button type="button" disabled={!readyProduction} onClick={() => readyProduction && downloadHtmlDocument(buildModelAppendixDocument(readyProduction, locale), tr(locale, `中国薄脆饼干新品概念与定价研究_${run?.designVersion ?? "RESULT"}_${run?.runId ?? "RUN"}_模型解析附录.html`, `China_cracker_concept_pricing_${run?.designVersion ?? "RESULT"}_${run?.runId ?? "RUN"}_model_appendix.html`))}>{tr(locale, "模型解析附录", "Model appendix")}</button>{resultArtifacts.length && readyProduction?.binding ? <details className="result-artifact-archive"><summary>{tr(locale, `Table文件（${resultArtifacts.length}）`, `Table files (${resultArtifacts.length})`)}</summary><div>{resultArtifacts.map((artifact) => <a key={artifact.key} href={`/api/research-operations/project-results?runId=${encodeURIComponent(readyProduction.binding!.runId)}&designVersion=${encodeURIComponent(readyProduction.binding!.designVersion)}&artifactKey=${encodeURIComponent(artifact.key)}`} download>{locale === "zh" ? artifact.labelZh : artifact.labelEn}</a>)}</div></details> : null}</div></section>
  </div>;
}

export default function SnackIndustryFocusDashboard() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [workspace, setWorkspace] = useState<Workspace>("intelligence");
  const [tab, setTab] = useState<Tab>("决策概览");
  const [customView, setCustomView] = useState<CustomWorkspaceView>("brief");
  const [latestProduction, setLatestProduction] = useState<RawProductionResult | null>(null);
  const [deliveryProduction, setDeliveryProduction] = useState<RawProductionResult | null>(null);
  const [lockedProjectDesign, setLockedProjectDesign] = useState<LockedProjectDesign | null>(null);
  const [projectRun, setProjectRun] = useState<ProjectRunRecord | null>(null);
  const [projectRunHistory, setProjectRunHistory] = useState<ProjectRunRecord[]>([]);
  const [runSyncState, setRunSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deliveryRun, setDeliveryRun] = useState<ProjectRunRecord | null>(null);
  const [resultLoadState, setResultLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [marketScope, setMarketScope] = useState<MarketScope>("CN");
  const [worldRegion, setWorldRegion] = useState("ALL");
  const [selectedMarket, setSelectedMarket] = useState("CN");
  const [category, setCategory] = useState<CategoryCode>("puffed");
  const [channel, setChannel] = useState<ChannelCode>("snack_chain");
  const [age, setAge] = useState<AgeCode>("25-34");
  const [income, setIncome] = useState<IncomeCode>("6000-12000");
  const [region, setRegion] = useState<RegionCode>("华东");
  const [activeSegmentDimension, setActiveSegmentDimension] = useState<SegmentDimension>("age_group");
  const categoryConfig = CATEGORY_CONFIG[category];
  const publicRows = useMemo(() => (publicRetailJson.observations as PublicObservation[]).filter((item) => item.category === categoryConfig.publicName), [categoryConfig.publicName]);
  const overseasMarkets = useMemo(() => (globalMarketJson.markets as GlobalMarket[]).filter((market) => market.code !== "CN"), []);
  const worldRegions = useMemo(() => Array.from(new Set(overseasMarkets.map((market) => market.region))), [overseasMarkets]);
  const regionMarkets = useMemo(() => overseasMarkets.filter((market) => worldRegion === "ALL" || market.region === worldRegion), [overseasMarkets, worldRegion]);
  const activeGlobalMarket = (globalMarketJson.markets as GlobalMarket[]).find((market) => market.code === selectedMarket);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PROJECT_DESIGN_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as LockedProjectDesign;
      if (parsed.projectId === "SNACK-CN-CRACKER-001" && parsed.artifactVersion === "V2" && parsed.files?.questionnaire && parsed.files?.quota && parsed.files?.dpSpec) setLockedProjectDesign(parsed);
    } catch {
      window.localStorage.removeItem(PROJECT_DESIGN_STORAGE_KEY);
    }
  }, []);
  useEffect(() => {
    if (IS_STATIC_DEMO) {
      setRunSyncState("saved");
      return;
    }
    let cancelled = false;
    void fetch("/api/research-operations/project-runs", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { records?: ProjectRunRecord[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "项目运行记录读取失败");
        if (cancelled) return;
        const serverRecords = (payload.records ?? []).filter((item) => item.projectId === "SNACK-CN-CRACKER-001" && item.runId && item.designVersion && item.fieldwork);
        setProjectRunHistory((current) => {
          const merged = new Map<string, ProjectRunRecord>();
          for (const item of [...current, ...serverRecords]) merged.set(`${item.runId}|${item.designVersion}|${item.updatedAt}`, item);
          const history = Array.from(merged.values()).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).slice(-50);
          window.localStorage.setItem(PROJECT_RUN_HISTORY_STORAGE_KEY, JSON.stringify(history));
          return history;
        });
        const latest = serverRecords[0];
        if (latest) {
          setProjectRun((current) => {
            if (current && current.updatedAt >= latest.updatedAt) return current;
            window.localStorage.setItem(PROJECT_RUN_STORAGE_KEY, JSON.stringify(latest));
            return latest;
          });
          if (latest.designSnapshot) {
            setLockedProjectDesign((current) => {
              if (current) return current;
              window.localStorage.setItem(PROJECT_DESIGN_STORAGE_KEY, JSON.stringify(latest.designSnapshot));
              return latest.designSnapshot ?? null;
            });
          }
        }
        setRunSyncState("saved");
      })
      .catch(() => { if (!cancelled) setRunSyncState("error"); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PROJECT_RUN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProjectRunRecord;
        const validStage = ["programming", "soft_launch", "fieldwork", "closed", "data_ready"].includes(parsed.stage);
        if (parsed.projectId === "SNACK-CN-CRACKER-001" && parsed.runId && parsed.designVersion && parsed.designConfirmationKey && validStage && parsed.fieldwork && Number.isFinite(parsed.targetN)) setProjectRun(parsed);
        else window.localStorage.removeItem(PROJECT_RUN_STORAGE_KEY);
      }
      const history = JSON.parse(window.localStorage.getItem(PROJECT_RUN_HISTORY_STORAGE_KEY) ?? "[]") as ProjectRunRecord[];
      setProjectRunHistory(history.filter((item) => item.projectId === "SNACK-CN-CRACKER-001" && item.runId && item.designVersion && item.fieldwork).slice(-50));
    } catch {
      window.localStorage.removeItem(PROJECT_RUN_STORAGE_KEY);
      window.localStorage.removeItem(PROJECT_RUN_HISTORY_STORAGE_KEY);
    }
  }, []);
  const lockProjectDesign = useCallback((input: ProjectDesignLockInput) => {
    setLatestProduction(null);
    setDeliveryProduction(null);
    setDeliveryRun(null);
    setResultLoadState("idle");
    setLockedProjectDesign((current) => {
      const revision = (current?.revision ?? 0) + 1;
      const next: LockedProjectDesign = { ...input, revision, designVersion: `V2-R${revision}`, lockedAt: new Date().toISOString() };
      window.localStorage.setItem(PROJECT_DESIGN_STORAGE_KEY, JSON.stringify(next));
      try {
        const history = JSON.parse(window.localStorage.getItem(PROJECT_DESIGN_HISTORY_STORAGE_KEY) ?? "[]") as LockedProjectDesign[];
        window.localStorage.setItem(PROJECT_DESIGN_HISTORY_STORAGE_KEY, JSON.stringify([...history, next].slice(-20)));
      } catch {
        window.localStorage.setItem(PROJECT_DESIGN_HISTORY_STORAGE_KEY, JSON.stringify([next]));
      }
      return next;
    });
  }, []);
  const saveProjectRun = useCallback((next: ProjectRunRecord) => {
    setProjectRun(next);
    window.localStorage.setItem(PROJECT_RUN_STORAGE_KEY, JSON.stringify(next));
    setProjectRunHistory((current) => {
      const withoutCurrent = current.filter((item) => item.runId !== next.runId || item.updatedAt !== next.updatedAt);
      const history = [...withoutCurrent, next].slice(-50);
      window.localStorage.setItem(PROJECT_RUN_HISTORY_STORAGE_KEY, JSON.stringify(history));
      return history;
    });
    setRunSyncState("saving");
    if (IS_STATIC_DEMO) {
      setRunSyncState("saved");
      return;
    }
    void fetch("/api/research-operations/project-runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json() as { error?: string };
          throw new Error(payload.error || "项目运行记录保存失败");
        }
        setRunSyncState("saved");
      })
      .catch(() => setRunSyncState("error"));
  }, []);
  const bindFinalRaw = useCallback((result: RawProductionResult) => {
    if (!lockedProjectDesign || !projectRun || projectRun.designVersion !== lockedProjectDesign.designVersion || !["closed", "data_ready"].includes(projectRun.stage) || result.meta.status !== "ready" || result.binding?.runId !== projectRun.runId || result.binding?.designVersion !== lockedProjectDesign.designVersion) return;
    const now = new Date().toISOString();
    const next: ProjectRunRecord = {
      ...projectRun,
      stage: "data_ready",
      updatedAt: now,
      finalRaw: {
        fileName: result.meta.fileName,
        processedAt: result.meta.processedAt,
        rowCount: result.meta.rowCount,
        eligibleRowCount: result.meta.eligibleRowCount,
        designVersion: lockedProjectDesign.designVersion,
        resultKey: result.binding.resultKey,
        storedAt: result.binding.storedAt,
      },
    };
    saveProjectRun(next);
    setDeliveryProduction(result);
    setDeliveryRun(next);
    setResultLoadState("ready");
  }, [lockedProjectDesign, projectRun, saveProjectRun]);
  useEffect(() => {
    if (projectRun?.stage !== "data_ready" || !projectRun.finalRaw?.resultKey) return;
    if (latestProduction?.binding?.resultKey === projectRun.finalRaw.resultKey) {
      setDeliveryProduction((current) => current ?? latestProduction);
      setDeliveryRun((current) => current ?? projectRun);
      setResultLoadState("ready");
      return;
    }
    let cancelled = false;
    setResultLoadState("loading");
    if (IS_STATIC_DEMO) {
      try {
        const stored = window.localStorage.getItem(`${PROJECT_RESULT_STORAGE_PREFIX}${projectRun.finalRaw.resultKey}`);
        if (!stored) throw new Error("result not found");
        const payload = JSON.parse(stored) as RawProductionResult;
        if (payload.binding?.resultKey !== projectRun.finalRaw.resultKey) throw new Error("result mismatch");
        setLatestProduction(payload);
        setDeliveryProduction((current) => current ?? payload);
        setDeliveryRun((current) => current ?? projectRun);
        setResultLoadState("ready");
      } catch {
        setResultLoadState("error");
      }
      return;
    }
    void fetch(`/api/research-operations/project-results?runId=${encodeURIComponent(projectRun.runId)}&designVersion=${encodeURIComponent(projectRun.designVersion)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as RawProductionResult & { error?: string };
        if (!response.ok) throw new Error(payload.error || "项目结果读取失败");
        if (payload.binding?.resultKey !== projectRun.finalRaw?.resultKey) throw new Error("项目结果版本不一致");
        if (!cancelled) {
          setLatestProduction(payload);
          setDeliveryProduction((current) => current ?? payload);
          setDeliveryRun((current) => current ?? projectRun);
          setResultLoadState("ready");
        }
      })
      .catch(() => { if (!cancelled) setResultLoadState("error"); });
    return () => { cancelled = true; };
  }, [latestProduction?.binding?.resultKey, projectRun?.finalRaw?.resultKey, projectRun?.runId, projectRun?.stage, projectRun?.designVersion]);
  const selectDeliveryResult = useCallback((resultKey: string) => {
    const candidates = [projectRun, ...projectRunHistory].filter((item): item is ProjectRunRecord => Boolean(item?.finalRaw?.resultKey === resultKey && item.stage === "data_ready"));
    const selected = candidates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (!selected?.finalRaw) return;
    setDeliveryRun(selected);
    setDeliveryProduction(null);
    setResultLoadState("loading");
    if (IS_STATIC_DEMO) {
      try {
        const stored = window.localStorage.getItem(`${PROJECT_RESULT_STORAGE_PREFIX}${resultKey}`);
        if (!stored) throw new Error("result not found");
        const payload = JSON.parse(stored) as RawProductionResult;
        if (payload.binding?.resultKey !== resultKey) throw new Error("result mismatch");
        setDeliveryProduction(payload);
        setResultLoadState("ready");
      } catch {
        setResultLoadState("error");
      }
      return;
    }
    void fetch(`/api/research-operations/project-results?runId=${encodeURIComponent(selected.runId)}&designVersion=${encodeURIComponent(selected.designVersion)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as RawProductionResult & { error?: string };
        if (!response.ok) throw new Error(payload.error || "项目结果读取失败");
        if (payload.binding?.resultKey !== resultKey) throw new Error("项目结果版本不一致");
        setDeliveryProduction(payload);
        setResultLoadState("ready");
      })
      .catch(() => setResultLoadState("error"));
  }, [projectRun, projectRunHistory]);
  const selectScope = (scope: MarketScope) => {
    setMarketScope(scope);
    setWorldRegion("ALL");
    setSelectedMarket(scope === "CN" ? "CN" : "ALL");
    setTab("全球市场");
  };
  const selectGlobalMarket = (code: string) => {
    if (code === "CN") {
      setMarketScope("CN");
      setWorldRegion("ALL");
      setSelectedMarket("CN");
      return;
    }
    setMarketScope("OVERSEAS");
    setSelectedMarket(code);
  };
  const selectWorkspace = (next: Workspace) => {
    setWorkspace(next);
    if (next === "intelligence") setTab("决策概览");
    if (next === "custom" || next === "case") {
      setMarketScope("CN");
      setWorldRegion("ALL");
      setSelectedMarket("CN");
    }
  };

  return <main className="snack-shell" lang={locale === "zh" ? "zh-CN" : "en"}>
    <SnackHeader locale={locale} setLocale={setLocale} />
    <section className="snack-workspace">
      <section className="snack-product-journeys" aria-label={tr(locale, "核心产品入口", "Core product entry points")}>
        <button className={workspace === "intelligence" ? "active" : ""} onClick={() => selectWorkspace("intelligence")}><span>01</span><div><small>{tr(locale, "行业级持续数据", "Continuous industry data")}</small><strong>{tr(locale, "通用数据产品", "Shared data product")}</strong><p>{tr(locale, "市场基准 · 消费者 · 价格 · 渠道", "Market baseline · consumer · price · channel")}</p></div><b>→</b></button>
        <button className={workspace === "custom" ? "active" : ""} onClick={() => selectWorkspace("custom")}><span>02</span><div><small>{tr(locale, "品牌与产品决策", "Brand and product decisions")}</small><strong>{tr(locale, "项目专项工作台", "Project workspace")}</strong><p>{tr(locale, "需求 · 设计 · 执行 · 模型 · 交付", "Brief · design · fieldwork · models · delivery")}</p></div><b>→</b></button>
      </section>
      <button className={`snack-example-entry ${workspace === "case" ? "active" : ""}`} onClick={() => selectWorkspace("case")}><span>{tr(locale, "成果示例", "Example result")}</span><strong>{tr(locale, "膨化食品新品概念与定价", "Puffed snack concept & pricing")}</strong><small>{tr(locale, "查看数据、模型与决策输出", "View data, model and decision outputs")}</small><b>↗</b></button>

      {workspace === "intelligence" && <nav className="snack-tabs intelligence-tabs" aria-label={tr(locale, "通用数据产品模块", "Shared data product modules")}>{INTELLIGENCE_TABS.map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{locale === "zh" ? item : TAB_EN[item]}</button>)}</nav>}
      {workspace === "custom" && <>
        <section className="project-workspace-context">
          <div><span>PROJECT WORKSPACE</span><h2>{tr(locale, "中国膨化食品消费者研究", "China puffed-snack consumer study")}</h2></div>
          <dl><div><dt>{tr(locale, "行业基准", "Industry benchmark")}</dt><dd>{tr(locale, "零食 / 膨化食品", "Snacks / puffed snacks")}</dd></div><div><dt>{tr(locale, "项目决策", "Project decision")}</dt><dd>{tr(locale, "概念 · 产品 · 定价 · 渠道", "Concept · product · price · channel")}</dd></div><div><dt>{tr(locale, "预测目标", "Model target")}</dt><dd>{tr(locale, "概念试购意向", "Concept trial intent")}</dd></div></dl>
        </section>
        <nav className="snack-tabs custom-tabs" aria-label={tr(locale, "项目专项流程", "Project workflow")}>{CUSTOM_VIEWS.map((item) => <button className={customView === item.id ? "active" : ""} onClick={() => setCustomView(item.id)} key={item.id}>{tr(locale, item.zh, item.en)}</button>)}</nav>
      </>}

      {workspace === "intelligence" && <section className="snack-marketbar">
        <div className="snack-scope-switch"><span>{tr(locale, "市场范围", "Market scope")}</span><div><button className={marketScope === "CN" ? "active" : ""} onClick={() => selectScope("CN")}>{tr(locale, "中国", "China")}</button><button className={marketScope === "OVERSEAS" ? "active" : ""} onClick={() => selectScope("OVERSEAS")}>{tr(locale, "海外", "Overseas")}</button></div></div>
        <label><span>{tr(locale, "海外区域", "Overseas region")}</span><select value={marketScope === "CN" ? "CHINA" : worldRegion} disabled={marketScope === "CN"} onChange={(event) => { setWorldRegion(event.target.value); setSelectedMarket("ALL"); }}><option value="CHINA">{tr(locale, "中国", "China")}</option><option value="ALL">{tr(locale, "全部海外", "All overseas")}</option>{worldRegions.map((item) => <option key={item} value={item}>{globalRegionLabel(locale, item)}</option>)}</select></label>
        <label><span>{tr(locale, "国家 / 市场", "Country / market")}</span><select value={marketScope === "CN" ? "CN" : selectedMarket} onChange={(event) => setSelectedMarket(event.target.value)}><option value={marketScope === "CN" ? "CN" : "ALL"}>{marketScope === "CN" ? tr(locale, "中国", "China") : tr(locale, "海外整体", "Overseas overall")}</option>{marketScope === "OVERSEAS" && regionMarkets.map((market) => <option key={market.code} value={market.code}>{locale === "zh" ? market.zh : market.en}</option>)}</select></label>
        <aside><DataTag tone="official">World Bank</DataTag><strong>{marketScope === "CN" ? tr(locale, "中国深度研究", "China deep research") : selectedMarket === "ALL" ? `${regionMarkets.length} ${tr(locale, "个海外市场", "overseas markets")}` : `${locale === "zh" ? activeGlobalMarket?.zh : activeGlobalMarket?.en} · ${activeGlobalMarket?.currency}`}</strong><small>{tr(locale, `国家基础数据更新 ${globalMarketJson.meta.world_bank_last_updated}`, `Country context updated ${globalMarketJson.meta.world_bank_last_updated}`)}</small></aside>
      </section>}
      {workspace === "intelligence" && marketScope === "CN" && tab !== "全球市场" && tab !== "数据中心" && <section className="snack-filterbar china-research-filters">
        <div><span>{tr(locale, "市场", "Market")}</span><strong>{tr(locale, "中国", "China")}</strong></div>
        <label><span>{tr(locale, "品类层级", "Category")}</span><select value={category} onChange={(event) => setCategory(event.target.value as CategoryCode)}>{(Object.keys(CATEGORY_CONFIG) as CategoryCode[]).map((code) => <option value={code} key={code}>{locale === "zh" ? `${CATEGORY_CONFIG[code].zh} · ${CATEGORY_CONFIG[code].stage}` : `${CATEGORY_CONFIG[code].en} · ${CATEGORY_CONFIG[code].stage === "重点研究" ? "core research" : "market observation"}`}</option>)}</select></label>
        <label><span>{tr(locale, "渠道", "Channel")}</span><select value={channel} onChange={(event) => setChannel(event.target.value as ChannelCode)}>{(Object.keys(CHANNEL_CONFIG) as ChannelCode[]).map((code) => <option value={code} key={code}>{locale === "zh" ? CHANNEL_CONFIG[code].zh : CHANNEL_CONFIG[code].en}</option>)}</select></label>
        <label><span>{tr(locale, "年龄", "Age")}</span><select value={age} onChange={(event) => { setAge(event.target.value as AgeCode); setActiveSegmentDimension("age_group"); }}>{(Object.keys(AGE_SHIFT) as AgeCode[]).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>{tr(locale, "月收入", "Monthly income")}</span><select value={income} onChange={(event) => { setIncome(event.target.value as IncomeCode); setActiveSegmentDimension("income"); }}>{(Object.keys(INCOME_SHIFT) as IncomeCode[]).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>{tr(locale, "地区", "Region")}</span><select value={region} onChange={(event) => { setRegion(event.target.value as RegionCode); setActiveSegmentDimension("region"); }}>{(Object.keys(REGION_SHIFT) as RegionCode[]).map((item) => <option key={item}>{item}</option>)}</select></label>
        <aside><DataTag tone={categoryConfig.stage === "重点研究" ? "simulation" : "public"}>{categoryConfig.stage}</DataTag><strong>{publicRows.length} {tr(locale, "条公开商品观察", "public product observations")}</strong></aside>
      </section>}

      {workspace === "case" ? <CrackerConceptCase locale={locale} /> : workspace === "custom" ? customView === "brief" ? <ConsumerDemand locale={locale} category={category} channel={channel} age={age} income={income} region={region} activeSegmentDimension={activeSegmentDimension} viewMode="project" /> : customView === "design" ? <ConsumerDemand locale={locale} category={category} channel={channel} age={age} income={income} region={region} activeSegmentDimension={activeSegmentDimension} viewMode="questionnaire" production={latestProduction} lockedProjectDesign={lockedProjectDesign} onProjectDesignLocked={lockProjectDesign} /> : customView === "execution" ? <ProjectExecutionHub locale={locale} design={lockedProjectDesign} run={projectRun} syncState={runSyncState} onBackToDesign={() => setCustomView("design")} onRunChange={saveProjectRun} /> : customView === "analysis" ? lockedProjectDesign && projectRun && projectRun.designVersion === lockedProjectDesign.designVersion && ["closed", "data_ready"].includes(projectRun.stage) ? <ResearchProductionFlow locale={locale} design={lockedProjectDesign} run={projectRun} initialProduction={latestProduction} onProduction={setLatestProduction} onFinalRawBound={bindFinalRaw} /> : <ResearchProductionGate locale={locale} design={lockedProjectDesign} run={projectRun} onBackToExecution={() => setCustomView("execution")} /> : <InsightDeliveryHub locale={locale} production={deliveryProduction ?? latestProduction} run={deliveryRun ?? (projectRun?.stage === "data_ready" ? projectRun : null)} history={projectRunHistory} loadState={resultLoadState} onSelectRun={selectDeliveryResult} /> : tab === "全球市场" ? <GlobalMarketAtlas locale={locale} marketScope={marketScope} selectedRegion={worldRegion} selectedMarket={selectedMarket} onSelectMarket={selectGlobalMarket} /> : tab === "数据中心" ? <DataCenter locale={locale} /> : marketScope === "OVERSEAS" ? <OverseasMarketWorkspace locale={locale} tab={tab as IntelligenceContentTab} selectedRegion={worldRegion} selectedMarket={selectedMarket} /> : category !== "puffed" ? <ObservationOnly locale={locale} category={category} /> : <>
        {tab === "决策概览" && <DecisionOverview locale={locale} category={category} channel={channel} age={age} income={income} region={region} />}
        {tab === "消费者洞察" && <ConsumerDemand locale={locale} category={category} channel={channel} age={age} income={income} region={region} activeSegmentDimension={activeSegmentDimension} viewMode="kpi" />}
        {tab === "产品与价格" && <ProductPricing locale={locale} category={category} channel={channel} age={age} income={income} region={region} />}
        {tab === "渠道与货架" && <ChannelShelf locale={locale} category={category} channel={channel} age={age} income={income} region={region} />}
        {tab === "新品决策" && <LaunchDecisionStudio locale={locale} category={category} channel={channel} age={age} income={income} region={region} />}
      </>}
    </section>
    <footer className="snack-footer"><PlatformBrand compact /><span>{tr(locale, "益普索中国 · 零食消费与市场洞察", "Ipsos China · Snack Consumer Intelligence")}</span><b>{tr(locale, "消费者 · 商品 · 渠道 · 经营结果", "Consumer · product · channel · outcomes")}</b></footer>
  </main>;
}
