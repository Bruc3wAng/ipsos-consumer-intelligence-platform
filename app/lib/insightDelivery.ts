import type { ProductionCell, ProductionMetricDefinition, RawProductionResult } from "./rawDataProduction";

type DeliveryLocale = "zh" | "en";

export type InsightNeedGap = {
  key: string;
  labelZh: string;
  labelEn: string;
  importance: number | null;
  satisfaction: number | null;
  gap: number | null;
};

export type InsightPricePoint = {
  key: string;
  price: number;
  acceptance: number | null;
};

export type InsightDecision = {
  code: string;
  claimZh: string;
  claimEn: string;
  evidenceZh: string;
  evidenceEn: string;
  modelZh: string;
  modelEn: string;
  actionZh: string;
  actionEn: string;
  validationZh: string;
  validationEn: string;
};

export type InsightDecisionSummary = {
  penetration: number | null;
  monthlyFrequency: number | null;
  conceptTrial: number | null;
  leadingAge: {
    label: string;
    letter: string | null;
    baseN: number;
    percent: number | null;
    differenceFromTotal: number | null;
    sigHigherThan: string[];
  } | null;
  needGaps: InsightNeedGap[];
  topNeedGap: InsightNeedGap | null;
  priceCurve: InsightPricePoint[];
  priceTransition: {
    fromPrice: number;
    toPrice: number;
    fromAcceptance: number;
    toAcceptance: number;
    drop: number;
  } | null;
  weakestConcept: {
    key: string;
    labelZh: string;
    labelEn: string;
    mean: number | null;
    t2b: number | null;
  } | null;
  model: {
    target: string;
    auc: number | null;
    brier: number | null;
    trainN: number;
    testN: number;
    leadingVariable: string | null;
    leadingBeta: number | null;
    boundary: string;
  };
  decisions: InsightDecision[];
};

export type NextWaveDesignAction = {
  code: string;
  layer: "通用核心" | "项目专项";
  artifacts: Array<"questionnaire" | "quota" | "dp_spec">;
  questionIds: string[];
  titleZh: string;
  titleEn: string;
  evidenceZh: string;
  evidenceEn: string;
  designZh: string;
  designEn: string;
  validationZh: string;
  validationEn: string;
};

export type NextWaveResearchDesign = {
  version: string;
  source: {
    fileName: string;
    sampleN: number;
    processedAt: string;
  };
  stableCore: {
    questionIds: string[];
    ruleZh: string;
    ruleEn: string;
  };
  samplePlan: {
    prioritySegment: string;
    currentBaseN: number;
    minimumIndependentBaseN: number;
    requiresBoost: boolean;
    recommendationZh: string;
    recommendationEn: string;
  };
  actions: NextWaveDesignAction[];
  analysisPlan: {
    retainedBanners: string[];
    addedBanners: string[];
    retainedOutputs: string[];
    futureOutcomeLabels: string[];
  };
  governance: {
    commonZh: string;
    commonEn: string;
    projectZh: string;
    projectEn: string;
    promotionGateZh: string;
    promotionGateEn: string;
  };
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pct(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function metricCell(result: RawProductionResult, key: string, rowKey = "total") {
  return result.table.rows.find((row) => row.key === rowKey)?.metrics[key];
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function signed(value: number | null, digits = 1) {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}

const NEED_PAIRS = [
  { key: "taste", labelZh: "口味", labelEn: "Taste" },
  { key: "crispness", labelZh: "酥脆口感", labelEn: "Crispness" },
  { key: "health", labelZh: "健康属性", labelEn: "Health" },
  { key: "price", labelZh: "价格", labelEn: "Price" },
  { key: "pack", labelZh: "包装", labelEn: "Pack" },
  { key: "novelty", labelZh: "新奇感", labelEn: "Novelty" },
] as const;

const PRICE_CURVE_KEYS = [
  { key: "price_accept_6_9", price: 6.9 },
  { key: "price_accept_reference", price: 8.9 },
  { key: "price_accept_9_9", price: 9.9 },
  { key: "price_accept_10_9", price: 10.9 },
  { key: "price_accept_12_9", price: 12.9 },
  { key: "price_accept_15_9", price: 15.9 },
] as const;

const CONCEPT_ITEMS = [
  { key: "concept_relevance", labelZh: "概念相关性", labelEn: "Concept relevance" },
  { key: "concept_uniqueness", labelZh: "概念差异化", labelEn: "Concept uniqueness" },
  { key: "concept_credibility", labelZh: "概念可信度", labelEn: "Concept credibility" },
] as const;

export function buildInsightDecisionSummary(result: RawProductionResult): InsightDecisionSummary {
  const total = result.table.rows.find((row) => row.key === "total") ?? result.table.rows[0];
  const penetration = total?.metrics.penetration_3m?.percent ?? null;
  const monthlyFrequency = total?.metrics.monthly_frequency_mean?.mean ?? null;
  const conceptTrial = total?.metrics.concept_trial_t2b?.percent ?? null;
  const ageGroup = result.table.bannerGroups.find((group) => group.key === "age");
  const leadingAgeRow = [...(ageGroup?.rows.slice(1) ?? [])].sort((left, right) => (right.metrics.penetration_3m?.percent ?? -1) - (left.metrics.penetration_3m?.percent ?? -1))[0];
  const leadingAgeCell = leadingAgeRow?.metrics.penetration_3m;
  const leadingAge = leadingAgeRow ? {
    label: leadingAgeRow.label,
    letter: leadingAgeRow.letter,
    baseN: leadingAgeRow.baseN,
    percent: leadingAgeCell?.percent ?? null,
    differenceFromTotal: leadingAgeCell?.percent == null || penetration == null ? null : round(leadingAgeCell.percent - penetration),
    sigHigherThan: leadingAgeCell?.sigHigherThan ?? [],
  } : null;
  const needGaps = NEED_PAIRS.map((item) => {
    const importance = total?.metrics[`importance_${item.key}_t2b`]?.percent ?? null;
    const satisfaction = total?.metrics[`satisfaction_${item.key}_t2b`]?.percent ?? null;
    return {
      ...item,
      importance,
      satisfaction,
      gap: importance == null || satisfaction == null ? null : round(importance - satisfaction),
    };
  }).sort((left, right) => (right.gap ?? -Infinity) - (left.gap ?? -Infinity));
  const topNeedGap = needGaps.find((item) => item.gap != null) ?? null;
  const priceCurve = PRICE_CURVE_KEYS.map((item) => ({ ...item, acceptance: total?.metrics[item.key]?.percent ?? null }));
  const priceTransitions = priceCurve.slice(0, -1).flatMap((point, index) => {
    const next = priceCurve[index + 1];
    if (point.acceptance == null || next.acceptance == null) return [];
    return [{ fromPrice: point.price, toPrice: next.price, fromAcceptance: point.acceptance, toAcceptance: next.acceptance, drop: round(point.acceptance - next.acceptance) }];
  });
  const priceTransition = [...priceTransitions].sort((left, right) => right.drop - left.drop)[0] ?? null;
  const conceptDiagnostics = CONCEPT_ITEMS.map((item) => ({
    ...item,
    mean: total?.metrics[`${item.key}_mean`]?.mean ?? null,
    t2b: total?.metrics[`${item.key}_t2b`]?.percent ?? null,
  }));
  const weakestConcept = [...conceptDiagnostics].sort((left, right) => (left.t2b ?? Infinity) - (right.t2b ?? Infinity))[0] ?? null;
  const modelCoefficients = result.model.status === "fitted" ? [...result.model.coefficients].sort((left, right) => Math.abs(right.standardizedBeta) - Math.abs(left.standardizedBeta)) : [];
  const leadingCoefficient = modelCoefficients[0] ?? null;
  const healthCoefficient = modelCoefficients.find((item) => item.sourceColumn === "importance_health");
  const wtpCoefficient = modelCoefficients.find((item) => item.sourceColumn === "wtp_70g_cny" || item.sourceColumn === "wtp_80g_cny" || item.sourceColumn === "wtp_cny");
  const decisions: InsightDecision[] = [
    {
      code: "01",
      claimZh: `${leadingAge?.label ?? "重点年龄组"}是当前优先深入验证的人群`,
      claimEn: `${leadingAge?.label ?? "Priority age group"} is the first segment for deeper validation`,
      evidenceZh: `Q1过去3个月购买率${pct(leadingAge?.percent)}，较总体${signed(leadingAge?.differenceFromTotal ?? null)}pp；${leadingAge?.sigHigherThan.length ? `${leadingAge.letter}列显著高于${leadingAge.sigHigherThan.join("")}列` : "当前分组差异未达显著"}。`,
      evidenceEn: `Q1 3-month purchase is ${pct(leadingAge?.percent)}, ${signed(leadingAge?.differenceFromTotal ?? null)}pp versus total; ${leadingAge?.sigHigherThan.length ? `${leadingAge.letter} is significantly above ${leadingAge.sigHigherThan.join("")}` : "the current subgroup difference is not significant"}.`,
      modelZh: "人群优先级以Banner显著性为依据；项目模型回答概念意向的联合关联，不替代人群差异检验。",
      modelEn: "Segment priority is based on banner significance; the project model explains joint association with concept intent and does not replace subgroup testing.",
      actionZh: `优先对${leadingAge?.label ?? "该人群"}展开概念、价格和产品组合细分，同时保留其他年龄组作为对照。`,
      actionEn: `Prioritize concept, price and configuration cuts for ${leadingAge?.label ?? "this segment"} while retaining other ages as controls.`,
      validationZh: "下一轮实物测试保留独立Base，验证概念意向是否转化为试购与复购。",
      validationEn: "Retain an independent base in the next product test and verify whether intent converts to trial and repeat.",
    },
    {
      code: "02",
      claimZh: `${topNeedGap?.labelZh ?? "需求缺口"}是当前产品优化的第一优先级`,
      claimEn: `${topNeedGap?.labelEn ?? "Need gap"} is the first product-improvement priority`,
      evidenceZh: `${topNeedGap?.labelZh ?? "该指标"}重要性T2B ${pct(topNeedGap?.importance)}，满足度T2B ${pct(topNeedGap?.satisfaction)}，缺口${topNeedGap?.gap == null ? "—" : `${topNeedGap.gap.toFixed(1)}pp`}，为六项需求中最高。`,
      evidenceEn: `${topNeedGap?.labelEn ?? "The metric"} importance T2B is ${pct(topNeedGap?.importance)} and satisfaction T2B is ${pct(topNeedGap?.satisfaction)}, a ${topNeedGap?.gap == null ? "—" : `${topNeedGap.gap.toFixed(1)}pp`} gap, the largest of six needs.`,
      modelZh: healthCoefficient ? `联合模型中健康属性重要性与概念意向呈${healthCoefficient.standardizedBeta >= 0 ? "正" : "负"}向关联（${signed(healthCoefficient.standardizedBeta, 3)}β）。` : "当前模型未纳入可用的对应变量，该判断以Q7×Q8缺口排序为主。",
      modelEn: healthCoefficient ? `Health importance has a ${healthCoefficient.standardizedBeta >= 0 ? "positive" : "negative"} association with concept intent (${signed(healthCoefficient.standardizedBeta, 3)}β).` : "No matching model variable is available; this decision is based on the Q7×Q8 gap ranking.",
      actionZh: "保留核心口味，制作两个健康属性或表达原型，比较其对口感、可信度和购买意向的影响。",
      actionEn: "Keep the core taste and compare two health-attribute or claim prototypes on sensory fit, credibility and purchase intent.",
      validationZh: "通过盲测、成分信息分组和相同价格条件检验缺口能否被实际缩小。",
      validationEn: "Use blind testing, ingredient-information cells and constant price to verify whether the gap actually narrows.",
    },
    {
      code: "03",
      claimZh: priceTransition ? `¥${priceTransition.fromPrice}到¥${priceTransition.toPrice}是当前价格接受下降最快的区间` : "当前价格曲线尚不足以定位敏感区间",
      claimEn: priceTransition ? `¥${priceTransition.fromPrice} to ¥${priceTransition.toPrice} is the steepest current acceptance decline` : "The current price curve is insufficient to locate a sensitivity interval",
      evidenceZh: priceTransition ? `接受率从${pct(priceTransition.fromAcceptance)}降至${pct(priceTransition.toAcceptance)}，下降${priceTransition.drop.toFixed(1)}pp；这是六个价格点中最大的相邻降幅。` : "当前缺少连续可比的价格点。",
      evidenceEn: priceTransition ? `Acceptance falls from ${pct(priceTransition.fromAcceptance)} to ${pct(priceTransition.toAcceptance)}, a ${priceTransition.drop.toFixed(1)}pp decline, the largest adjacent drop across six price points.` : "Comparable consecutive price points are missing.",
      modelZh: wtpCoefficient ? `支付意愿与概念意向呈${wtpCoefficient.standardizedBeta >= 0 ? "正" : "负"}向关联（${signed(wtpCoefficient.standardizedBeta, 3)}β）；曲线用于界定实验范围，不直接输出上市价。` : "价格曲线用于界定实验范围，不直接输出上市价。",
      modelEn: wtpCoefficient ? `Willingness to pay has a ${wtpCoefficient.standardizedBeta >= 0 ? "positive" : "negative"} association with concept intent (${signed(wtpCoefficient.standardizedBeta, 3)}β); the curve defines a test range, not a launch price.` : "The curve defines a test range, not a launch price.",
      actionZh: priceTransition ? `将¥${priceTransition.fromPrice - 1}、¥${priceTransition.fromPrice}和¥${priceTransition.toPrice}作为下一轮相邻测试点，固定规格、口味、包装和促销。` : "补充连续价格点并固定产品组合后再实施价格实验。",
      actionEn: priceTransition ? `Use ¥${priceTransition.fromPrice - 1}, ¥${priceTransition.fromPrice} and ¥${priceTransition.toPrice} as adjacent test points while holding pack, taste, format and promotion constant.` : "Add consecutive price points and hold the product configuration constant.",
      validationZh: "用DCE或价格敏感度任务复核价格效应，并与后续试购转化对照。",
      validationEn: "Validate the price effect with DCE or price-sensitivity tasks and compare it with later trial conversion.",
    },
    {
      code: "04",
      claimZh: `${weakestConcept?.labelZh ?? "概念表现"}是当前概念的主要表达短板`,
      claimEn: `${weakestConcept?.labelEn ?? "Concept performance"} is the main current communication weakness`,
      evidenceZh: `${weakestConcept?.labelZh ?? "该指标"}T2B ${pct(weakestConcept?.t2b)}，均值${weakestConcept?.mean == null ? "—" : weakestConcept.mean.toFixed(2)}；概念购买意向T2B ${pct(conceptTrial)}。`,
      evidenceEn: `${weakestConcept?.labelEn ?? "The metric"} T2B is ${pct(weakestConcept?.t2b)} with a mean of ${weakestConcept?.mean == null ? "—" : weakestConcept.mean.toFixed(2)}; concept trial T2B is ${pct(conceptTrial)}.`,
      modelZh: result.model.status === "fitted" ? `留出集AUC ${result.model.testAuc?.toFixed(3) ?? "—"}，Brier ${result.model.testBrier?.toFixed(3) ?? "—"}；最强联合关联变量为${leadingCoefficient?.variable ?? "—"}（${leadingCoefficient ? `${signed(leadingCoefficient.standardizedBeta, 3)}β` : "—"}）。` : "项目模型未通过运行门槛。",
      modelEn: result.model.status === "fitted" ? `Holdout AUC is ${result.model.testAuc?.toFixed(3) ?? "—"}, Brier ${result.model.testBrier?.toFixed(3) ?? "—"}; the leading joint association is ${leadingCoefficient?.variable ?? "—"} (${leadingCoefficient ? `${signed(leadingCoefficient.standardizedBeta, 3)}β` : "—"}).` : "The project model did not pass its run gate.",
      actionZh: "优先重写概念的差异化理由与产品证据，在不改变核心产品配置的条件下比较两版表达。",
      actionEn: "Rewrite the differentiation reason and product proof, then compare two executions without changing the core product configuration.",
      validationZh: "设定项目成功阈值，并在下一轮追踪差异化、购买意向、试购和复购。",
      validationEn: "Set the project success threshold and track differentiation, intent, trial and repeat in the next wave.",
    },
  ];
  return {
    penetration,
    monthlyFrequency,
    conceptTrial,
    leadingAge,
    needGaps,
    topNeedGap,
    priceCurve,
    priceTransition,
    weakestConcept,
    model: {
      target: result.model.target,
      auc: result.model.testAuc,
      brier: result.model.testBrier,
      trainN: result.model.trainN,
      testN: result.model.testN,
      leadingVariable: leadingCoefficient?.variable ?? null,
      leadingBeta: leadingCoefficient?.standardizedBeta ?? null,
      boundary: result.model.boundary,
    },
    decisions,
  };
}

export function buildNextWaveResearchDesign(result: RawProductionResult): NextWaveResearchDesign {
  const summary = buildInsightDecisionSummary(result);
  const prioritySegment = summary.leadingAge?.label ?? "重点年龄组";
  const currentBaseN = summary.leadingAge?.baseN ?? 0;
  const minimumIndependentBaseN = 300;
  const requiresBoost = currentBaseN < minimumIndependentBaseN;
  const pricePoints = summary.priceTransition
    ? [round(Math.max(0, summary.priceTransition.fromPrice - 1), 1), summary.priceTransition.fromPrice, summary.priceTransition.toPrice]
    : [];
  const pricePointText = pricePoints.length ? pricePoints.map((value) => `¥${value.toFixed(1)}`).join(" / ") : "待补充连续价格点";
  const stableQuestionIds = ["Q1", "Q2", "Q7", "Q8", "Q9", "Q10"];
  const actions: NextWaveDesignAction[] = [
    {
      code: "R01",
      layer: "通用核心",
      artifacts: ["questionnaire", "dp_spec"],
      questionIds: stableQuestionIds,
      titleZh: "保留可跨期比较的核心题组",
      titleEn: "Retain the comparable core question set",
      evidenceZh: `当前结论直接依赖Q1人群差异、Q7×Q8需求缺口、Q9价格曲线和Q10概念诊断；Q2保留购买频次基线。`,
      evidenceEn: "The current decisions depend on Q1 segment differences, the Q7×Q8 need gap, the Q9 price curve and Q10 concept diagnostics; Q2 retains the purchase-frequency baseline.",
      designZh: "题号、选项Code、Base、时间窗和计算口径全部保持不变，只允许调整页面展示顺序。",
      designEn: "Keep IDs, option codes, bases, time windows and formulas unchanged; only display order may change.",
      validationZh: "下一期通过同口径Table和显著性检验验证变化。",
      validationEn: "Validate change through same-definition tables and significance tests in the next wave.",
    },
    {
      code: "P01",
      layer: "项目专项",
      artifacts: ["questionnaire", "quota", "dp_spec"],
      questionIds: ["PJT_HEALTH_01", "PJT_HEALTH_02"],
      titleZh: "增加健康属性方案对比",
      titleEn: "Add a health-attribute variant comparison",
      evidenceZh: `${summary.topNeedGap?.labelZh ?? "健康属性"}的重要性与满足度缺口为${summary.topNeedGap?.gap == null ? "—" : `${summary.topNeedGap.gap.toFixed(1)}pp`}，为当前六项需求中最高。`,
      evidenceEn: `The ${summary.topNeedGap?.labelEn ?? "health"} importance−satisfaction gap is ${summary.topNeedGap?.gap == null ? "—" : `${summary.topNeedGap.gap.toFixed(1)}pp`}, the largest of the six current needs.`,
      designZh: "在相同价格、规格和基础口味下，随机呈现现有方案与健康属性强化方案；比较口感适配、可信度和购买意向。",
      designEn: "Randomize the current and health-enhanced variants while holding price, size and core taste constant; compare sensory fit, credibility and intent.",
      validationZh: "项目变量默认保留在项目层，不自动进入行业通用模型。",
      validationEn: "Keep the variables in the project layer by default; do not feed them automatically into the shared model.",
    },
    {
      code: "P02",
      layer: "项目专项",
      artifacts: ["questionnaire", "quota", "dp_spec"],
      questionIds: ["PJT_PRICE_01", "PJT_PRICE_02"],
      titleZh: "在敏感区间增加随机价格实验",
      titleEn: "Add a randomized price experiment in the sensitivity range",
      evidenceZh: summary.priceTransition ? `Q9价格接受率在¥${summary.priceTransition.fromPrice}到¥${summary.priceTransition.toPrice}之间下降${summary.priceTransition.drop.toFixed(1)}pp，为最大相邻降幅。` : "当前价格点不足以定位敏感区间。",
      evidenceEn: summary.priceTransition ? `Q9 acceptance falls ${summary.priceTransition.drop.toFixed(1)}pp between ¥${summary.priceTransition.fromPrice} and ¥${summary.priceTransition.toPrice}, the largest adjacent decline.` : "The current price points are insufficient to locate a sensitivity range.",
      designZh: `随机分配${pricePointText}三个单体价格组，固定产品规格、包装、口味和促销；Q9仍保留作为跨期价格曲线。`,
      designEn: `Randomize three monadic price cells (${pricePointText}) while holding size, pack, taste and promotion constant; retain Q9 for the comparable price curve.`,
      validationZh: "先检验价格组的意向差异，真实试购接入后再校准价格效应。",
      validationEn: "Test intent differences first, then calibrate the price effect when observed trial is available.",
    },
    {
      code: "P03",
      layer: "项目专项",
      artifacts: ["questionnaire", "quota", "dp_spec"],
      questionIds: ["PJT_CONCEPT_01", "PJT_CONCEPT_02"],
      titleZh: "将概念差异化表达拆成可比较版本",
      titleEn: "Split the differentiation claim into comparable executions",
      evidenceZh: `${summary.weakestConcept?.labelZh ?? "概念差异化"}T2B为${pct(summary.weakestConcept?.t2b)}，是当前概念诊断中最弱的维度。`,
      evidenceEn: `${summary.weakestConcept?.labelEn ?? "Concept uniqueness"} T2B is ${pct(summary.weakestConcept?.t2b)}, the weakest current concept diagnostic.`,
      designZh: "固定产品配置，只替换差异化理由与产品证据；设置版本A/B和随机呈现顺序。",
      designEn: "Hold the product configuration constant and vary only the differentiation reason and product proof; randomize execution A/B and order.",
      validationZh: "下一期同时检验差异化、可信度和概念购买意向，不用单项评分决定上市。",
      validationEn: "Test uniqueness, credibility and concept intent together; do not make a launch decision from one rating alone.",
    },
  ];
  return {
    version: "NEXT-WAVE-V1",
    source: {
      fileName: result.meta.fileName,
      sampleN: result.meta.eligibleRowCount,
      processedAt: result.meta.processedAt,
    },
    stableCore: {
      questionIds: stableQuestionIds,
      ruleZh: "通用核心题号和Code保持稳定；下一期项目仅调整展示顺序与项目专项模块。",
      ruleEn: "Keep shared-core IDs and codes stable; the next wave changes only display order and project-specific modules.",
    },
    samplePlan: {
      prioritySegment,
      currentBaseN,
      minimumIndependentBaseN,
      requiresBoost,
      recommendationZh: requiresBoost
        ? `当前${prioritySegment}Base N=${currentBaseN}，低于独立分析参考N=${minimumIndependentBaseN}；建议使用重点人群增样。`
        : `当前${prioritySegment}Base N=${currentBaseN}，已高于独立分析参考N=${minimumIndependentBaseN}；保持核心交叉配额，不需为放大结论机械增样。`,
      recommendationEn: requiresBoost
        ? `The current ${prioritySegment} base is N=${currentBaseN}, below the N=${minimumIndependentBaseN} independent-analysis reference; use a priority-segment boost.`
        : `The current ${prioritySegment} base is N=${currentBaseN}, above the N=${minimumIndependentBaseN} independent-analysis reference; retain the core cross quota without mechanical oversampling.`,
    },
    actions,
    analysisPlan: {
      retainedBanners: ["Total", "Gender", "Age", "Region", "Grid101"],
      addedBanners: ["PJT_HEALTH_01", "PJT_PRICE_01", "PJT_CONCEPT_01"],
      retainedOutputs: ["Count", "No sig", "Sig", "Mean", "Median", "T2B", "B2B"],
      futureOutcomeLabels: ["实际试购", "复购", "销量/周转", "铺货/缺货"],
    },
    governance: {
      commonZh: "通用核心只保留定义、题号、Code、Base、时间窗和统计口径一致的指标。",
      commonEn: "The shared core contains only metrics with stable definitions, IDs, codes, bases, time windows and statistical rules.",
      projectZh: "PJT_*变量默认只进入当前项目Table与项目专项模型，不与其他客户项目混用。",
      projectEn: "PJT_* variables feed only the current project tables and models by default and are not mixed across clients.",
      promotionGateZh: "只有经过至少两期可比验证、定义标准化并获得授权的专项指标，才能进入通用指标候选。",
      promotionGateEn: "A project metric becomes a shared-metric candidate only after at least two comparable waves, standardized definition and authorization.",
    },
  };
}

export function buildNextWaveResearchDesignDocument(result: RawProductionResult, locale: DeliveryLocale = "zh") {
  const design = buildNextWaveResearchDesign(result);
  const zh = locale === "zh";
  const artifactLabel = (artifact: NextWaveDesignAction["artifacts"][number]) => artifact === "questionnaire" ? (zh ? "问卷" : "Questionnaire") : artifact === "quota" ? (zh ? "配额" : "Quota") : "DP Spec";
  const body = `
    <section class="meta"><div><span>${zh ? "来源数据" : "Source data"}</span><strong>${escapeHtml(design.source.fileName)}</strong></div><div><span>${zh ? "样本" : "Sample"}</span><strong>N=${design.source.sampleN.toLocaleString()}</strong></div><div><span>${zh ? "设计版本" : "Design version"}</span><strong>${design.version}</strong></div><div><span>${zh ? "优先人群" : "Priority segment"}</span><strong>${escapeHtml(design.samplePlan.prioritySegment)}</strong></div></section>
    <section class="section"><header><small>CORE REGISTRY</small><h2>${zh ? "跨期核心题保留" : "Comparable core retention"}</h2></header><div class="note"><strong>${design.stableCore.questionIds.join(" · ")}</strong><br>${escapeHtml(zh ? design.stableCore.ruleZh : design.stableCore.ruleEn)}</div></section>
    <section class="section"><header><small>DESIGN CHANGES</small><h2>${zh ? "下一期设计变更" : "Next-wave design changes"}</h2></header>${design.actions.map((item) => `<article class="decision"><b>${item.code}</b><div><h3>${escapeHtml(zh ? item.titleZh : item.titleEn)}</h3><p><strong>${zh ? "证据" : "Evidence"}</strong><br>${escapeHtml(zh ? item.evidenceZh : item.evidenceEn)}</p><p><strong>${zh ? "设计" : "Design"}</strong><br>${escapeHtml(zh ? item.designZh : item.designEn)}</p></div><aside><span>${zh ? "层级" : "Layer"}</span><strong>${escapeHtml(item.layer)}</strong><span>${zh ? "影响产物" : "Affected artifacts"}</span><strong>${item.artifacts.map(artifactLabel).join(" · ")}</strong><span>${zh ? "题号" : "IDs"}</span><strong>${item.questionIds.join(" · ")}</strong><span>${zh ? "验证" : "Validation"}</span><strong>${escapeHtml(zh ? item.validationZh : item.validationEn)}</strong></aside></article>`).join("")}</section>
    <section class="section"><header><small>SAMPLE DESIGN</small><h2>${zh ? "样本与配额建议" : "Sample and quota recommendation"}</h2></header><div class="note">${escapeHtml(zh ? design.samplePlan.recommendationZh : design.samplePlan.recommendationEn)}</div></section>
    <section class="section"><header><small>ANALYSIS CONTRACT</small><h2>${zh ? "分析口径更新" : "Analysis-contract update"}</h2></header><table class="table"><tbody><tr><th>${zh ? "保留Banner" : "Retained banners"}</th><td>${design.analysisPlan.retainedBanners.join(" · ")}</td></tr><tr><th>${zh ? "新增实验分组" : "Added experiment cuts"}</th><td>${design.analysisPlan.addedBanners.join(" · ")}</td></tr><tr><th>${zh ? "保留输出" : "Retained outputs"}</th><td>${design.analysisPlan.retainedOutputs.join(" · ")}</td></tr><tr><th>${zh ? "后续结果标签" : "Future outcomes"}</th><td>${design.analysisPlan.futureOutcomeLabels.join(" · ")}</td></tr></tbody></table></section>
    <footer class="footer"><strong>${zh ? "指标层级规则" : "Metric-layer rule"}</strong><br>${escapeHtml(zh ? design.governance.commonZh : design.governance.commonEn)}<br>${escapeHtml(zh ? design.governance.projectZh : design.governance.projectEn)}<br>${escapeHtml(zh ? design.governance.promotionGateZh : design.governance.promotionGateEn)}</footer>`;
  return pageShell(
    zh ? "中国薄脆饼干新品研究·下一期研究设计" : "China cracker study · next-wave research design",
    zh ? "由当前Table、KPI、显著性与模型验证生成；通用题号保持稳定，项目变量单独管理。" : "Generated from the current tables, KPIs, significance and model validation; shared IDs stay stable and project variables remain separate.",
    body,
  );
}

function pageShell(title: string, subtitle: string, body: string) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
  :root{--navy:#17245e;--blue:#263aa5;--teal:#0aa59e;--ink:#1a285d;--muted:#687187;--line:#d8deea;--paper:#fff;--bg:#eef2f6}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Microsoft YaHei",Arial,sans-serif}.top{padding:30px 6vw;color:#fff;background:linear-gradient(125deg,#17245e,#2b42ac);border-top:5px solid #32c6be}.top small{color:#61d7d0;font:700 10px Arial,sans-serif;letter-spacing:.13em}.top h1{max-width:980px;margin:12px 0 7px;font-size:34px;font-weight:500}.top p{margin:0;color:#c6cee3}.page{max-width:1220px;margin:24px auto;padding:0 24px 50px}.meta,.kpis,.grid{display:grid;background:#fff;border:1px solid var(--line)}.meta{grid-template-columns:2fr repeat(3,1fr)}.meta div,.kpis article{padding:18px;border-right:1px solid var(--line)}.meta div:last-child,.kpis article:last-child{border-right:0}.meta span,.kpis span{display:block;color:var(--muted);font-size:11px}.meta strong,.kpis strong{display:block;margin-top:8px;color:var(--blue);font:700 20px Arial,"Microsoft YaHei",sans-serif}.section{margin-top:18px;background:#fff;border:1px solid var(--line);border-top:3px solid var(--blue)}.section>header{padding:18px 20px;border-bottom:1px solid var(--line)}.section>header small{color:var(--teal);font:700 9px Arial,sans-serif;letter-spacing:.12em}.section h2{margin:7px 0 0;font-size:21px;font-weight:500}.kpis{grid-template-columns:repeat(4,1fr);border:0}.kpis article{min-height:120px}.decision{display:grid;grid-template-columns:44px 1.3fr 1fr;gap:18px;padding:19px 20px;border-bottom:1px solid var(--line)}.decision:last-child{border:0}.decision b{color:var(--teal);font:700 10px Arial,sans-serif}.decision h3{margin:0 0 8px;font-size:15px}.decision p{margin:0 0 7px;color:var(--muted);font-size:11px;line-height:1.7}.decision p strong{color:var(--ink);font-family:"Microsoft YaHei",Arial,sans-serif}.decision aside{padding-left:16px;border-left:3px solid #dfe5ef}.decision aside span{display:block;margin-top:13px;color:var(--teal);font-size:9px;font-weight:700}.decision aside span:first-child{margin-top:0}.decision aside strong{display:block;margin-top:7px;font-size:11px;line-height:1.6}.table{width:100%;border-collapse:collapse;font-size:11px}.table th,.table td{padding:12px 15px;border-bottom:1px solid var(--line);text-align:right}.table th{color:var(--muted);background:#f3f6fa}.table th:first-child,.table td:first-child{text-align:left}.table td{font-family:Arial,"Microsoft YaHei",sans-serif}.note{padding:16px 20px;color:var(--muted);background:#f7f9fb;font-size:10px;line-height:1.65}.model-meta{display:grid;grid-template-columns:repeat(4,1fr)}.model-meta div{padding:18px;border-right:1px solid var(--line)}.model-meta div:last-child{border:0}.model-meta span{display:block;color:var(--muted);font-size:10px}.model-meta strong{display:block;margin-top:8px;color:var(--blue);font:700 18px Arial,"Microsoft YaHei",sans-serif}.footer{margin-top:18px;padding:18px 20px;color:#c6cee3;background:var(--navy);font-size:10px;line-height:1.7}@media(max-width:760px){.meta,.kpis,.model-meta{grid-template-columns:1fr}.meta div,.kpis article,.model-meta div{border-right:0;border-bottom:1px solid var(--line)}.decision{grid-template-columns:30px 1fr}.decision aside{grid-column:2}.top h1{font-size:27px}}
  </style></head><body><header class="top"><small>IPSOS CONSUMER INTELLIGENCE</small><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></header><main class="page">${body}</main></body></html>`;
}

function displayMetric(cell: ProductionCell | undefined, metric: ProductionMetricDefinition) {
  if (!cell) return "—";
  const value = metric.statistic === "mean"
    ? cell.mean == null ? "—" : cell.mean.toFixed(metric.decimalPlaces)
    : metric.statistic === "median"
      ? cell.median == null ? "—" : cell.median.toFixed(metric.decimalPlaces)
      : pct(cell.percent);
  return `${value}${metric.statistic !== "median" && cell.sigHigherThan.length ? `<sup>${escapeHtml(cell.sigHigherThan.join(""))}</sup>` : ""}`;
}

export function buildInsightReportDocument(result: RawProductionResult, locale: DeliveryLocale = "zh") {
  const t = <T,>(zh: T, en: T) => locale === "zh" ? zh : en;
  const summary = buildInsightDecisionSummary(result);
  const summaryKeys = result.table.metricGroups.find((group) => group.key === "summary")?.metricKeys ?? [];
  const selectedKeys = new Set(summaryKeys);
  const metricHeaders = result.table.metricDefinitions.filter((metric) => selectedKeys.has(metric.key));
  const ageRows = result.table.bannerGroups.find((group) => group.key === "age")?.rows ?? result.table.rows;
  const tableRows = ageRows.map((row) => `<tr><td>${escapeHtml(row.letter ? `${row.letter} · ${row.label}` : row.label)}</td><td>${row.baseN.toLocaleString()}</td>${metricHeaders.map((metric) => `<td>${displayMetric(row.metrics[metric.key], metric)}</td>`).join("")}</tr>`).join("");
  const decisionRows = summary.decisions.map((item) => `<article class="decision"><b>${item.code}</b><div><h3>${escapeHtml(t(item.claimZh, item.claimEn))}</h3><p>${escapeHtml(t(item.evidenceZh, item.evidenceEn))}</p><p><strong>${t("模型证据", "Model evidence")}：</strong>${escapeHtml(t(item.modelZh, item.modelEn))}</p></div><aside><span>${t("建议动作", "ACTION")}</span><strong>${escapeHtml(t(item.actionZh, item.actionEn))}</strong><span>${t("下一次验证", "NEXT VALIDATION")}</span><strong>${escapeHtml(t(item.validationZh, item.validationEn))}</strong></aside></article>`).join("");
  const gapRows = summary.needGaps.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(t(item.labelZh, item.labelEn))}</td><td>${pct(item.importance)}</td><td>${pct(item.satisfaction)}</td><td>${item.gap == null ? "—" : `${item.gap.toFixed(1)}pp`}</td></tr>`).join("");
  const priceHeaders = summary.priceCurve.map((item) => `<th>¥${item.price}</th>`).join("");
  const priceValues = summary.priceCurve.map((item) => `<td>${pct(item.acceptance)}</td>`).join("");
  const resultVersion = result.binding ? `${result.binding.designVersion} · ${result.binding.runId}` : "—";
  const storedAt = result.binding ? new Date(result.binding.storedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB") : new Date(result.meta.processedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-GB");
  const body = `<section class="meta"><div><span>${t("生产数据版本", "Production dataset")}</span><strong>${escapeHtml(result.meta.fileName)}</strong></div><div><span>${t("有效样本", "Eligible sample")}</span><strong>N=${result.meta.eligibleRowCount.toLocaleString()}</strong></div><div><span>${t("设计 / 运行版本", "Design / run version")}</span><strong>${escapeHtml(resultVersion)}</strong></div><div><span>${t("结果生成时间", "Result generated")}</span><strong>${escapeHtml(storedAt)}</strong></div></section>
  <section class="section"><header><small>KEY RESULTS</small><h2>${t("本期核心结果", "Current results")}</h2></header><div class="kpis"><article><span>Q1 · ${t("过去3个月购买率", "3-month purchase rate")}</span><strong>${pct(summary.penetration)}</strong></article><article><span>Q2 · ${t("月度购买频次", "Monthly purchase frequency")}</span><strong>${summary.monthlyFrequency == null ? "—" : summary.monthlyFrequency.toFixed(2)}</strong></article><article><span>Q7×Q8 · ${t("最大需求缺口", "Largest need gap")}</span><strong>${summary.topNeedGap?.gap == null ? "—" : `${summary.topNeedGap.gap.toFixed(1)}pp`}</strong></article><article><span>Q10 · ${t("概念购买意向T2B", "Concept trial T2B")}</span><strong>${pct(summary.conceptTrial)}</strong></article></div></section>
  <section class="section"><header><small>DECISIONS</small><h2>${t("数据支持的判断与下一步", "Evidence-backed decisions and next steps")}</h2></header>${decisionRows}</section>
  <section class="section"><header><small>NEED GAP</small><h2>${t("需求重要性与满足度缺口", "Importance versus satisfaction gaps")}</h2></header><table class="table"><thead><tr><th>#</th><th>${t("需求", "Need")}</th><th>${t("重要性T2B", "Importance T2B")}</th><th>${t("满足度T2B", "Satisfaction T2B")}</th><th>${t("缺口", "Gap")}</th></tr></thead><tbody>${gapRows}</tbody></table><div class="note">${t("缺口=重要性T2B−满足度T2B，用于本项目产品改进优先级排序，不是行业基准或因果效应。", "Gap = importance T2B minus satisfaction T2B. It ranks improvement priorities within this project and is not an industry benchmark or causal effect.")}</div></section>
  <section class="section"><header><small>PRICE CURVE</small><h2>${t("价格接受曲线与相邻降幅", "Price acceptance and adjacent declines")}</h2></header><table class="table"><thead><tr><th>${t("指标", "Metric")}</th>${priceHeaders}</tr></thead><tbody><tr><td>${t("接受率", "Acceptance")}</td>${priceValues}</tr></tbody></table><div class="note">${summary.priceTransition ? t(`最大相邻降幅位于¥${summary.priceTransition.fromPrice}–¥${summary.priceTransition.toPrice}：${summary.priceTransition.fromAcceptance.toFixed(1)}%降至${summary.priceTransition.toAcceptance.toFixed(1)}%，下降${summary.priceTransition.drop.toFixed(1)}pp。该结果用于界定价格实验区间，不直接定义上市价。`, `The largest adjacent decline is ¥${summary.priceTransition.fromPrice}–¥${summary.priceTransition.toPrice}: ${summary.priceTransition.fromAcceptance.toFixed(1)}% to ${summary.priceTransition.toAcceptance.toFixed(1)}, down ${summary.priceTransition.drop.toFixed(1)}pp. This defines the next experiment range, not a launch price.`) : t("当前价格点不足以计算相邻降幅。", "The current price points are insufficient to calculate adjacent declines.")}</div></section>
  <section class="section"><header><small>TABLE</small><h2>${t("年龄分组结果", "Results by age")}</h2></header><table class="table"><thead><tr><th>${t("年龄", "Age")}</th><th>Base</th>${metricHeaders.map((metric) => `<th>${escapeHtml(metric.questionId)} ${escapeHtml(locale === "zh" ? metric.labelZh : metric.labelEn)}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table><div class="note">${t("显著性字母表示该行比例显著高于对应年龄列；双侧95%，使用加权比例与Kish有效样本量。", "Letters mark a proportion significantly above the referenced age row; two-sided 95% using weighted shares and Kish effective bases.")}</div></section>
  <section class="section"><header><small>MODEL EVIDENCE</small><h2>${t("项目模型验证", "Project model validation")}</h2></header><div class="model-meta"><div><span>${t("目标", "Target")}</span><strong>${escapeHtml(summary.model.target)}</strong></div><div><span>AUC</span><strong>${summary.model.auc ?? "—"}</strong></div><div><span>Brier</span><strong>${summary.model.brier ?? "—"}</strong></div><div><span>${t("最强联合关联变量", "Leading joint association")}</span><strong>${summary.model.leadingVariable ? `${escapeHtml(summary.model.leadingVariable)} ${summary.model.leadingBeta == null ? "" : `${signed(summary.model.leadingBeta, 3)}β`}` : "—"}</strong></div></div><div class="note">${escapeHtml(summary.model.boundary)}</div></section>
  <footer class="footer">${t("本报告由当前最终Raw Data重新计算。结论强度受样本设计、题目口径、模型验证和真实结果标签共同约束。", "This report is rebuilt from the current final Raw Data. Conclusion strength depends on sample design, question definitions, model validation and real outcome labels.")}</footer>`;
  return pageShell(t("中国薄脆饼干新品概念与定价研究", "China cracker concept and pricing study"), t("洞察报告 · 数据、Table与模型证据", "Insight report · data, table and model evidence"), body);
}

export function buildModelAppendixDocument(result: RawProductionResult, locale: DeliveryLocale = "zh") {
  const t = <T,>(zh: T, en: T) => locale === "zh" ? zh : en;
  const coefficients = result.model.coefficients.map((item) => `<tr><td>${escapeHtml(item.variable)}</td><td>${escapeHtml(item.sourceColumn)}</td><td>${item.standardizedBeta > 0 ? "+" : ""}${item.standardizedBeta}</td><td>${item.oddsRatio}</td><td>${item.direction === "positive" ? t("正向", "Positive") : t("负向", "Negative")}</td></tr>`).join("");
  const definitions = result.table.metricDefinitions.map((item) => `<tr><td>${escapeHtml(item.questionId)}</td><td>${escapeHtml(locale === "zh" ? item.labelZh : item.labelEn)}</td><td>${escapeHtml(item.sourceColumn)}</td><td>${escapeHtml(item.positiveRule)}</td></tr>`).join("");
  const resultVersion = result.binding ? `${result.binding.designVersion} · ${result.binding.runId}` : "—";
  const body = `<section class="meta"><div><span>${t("生产数据版本", "Production dataset")}</span><strong>${escapeHtml(result.meta.fileName)}</strong></div><div><span>${t("设计 / 运行版本", "Design / run version")}</span><strong>${escapeHtml(resultVersion)}</strong></div><div><span>${t("训练样本", "Training sample")}</span><strong>${result.model.trainN.toLocaleString()}</strong></div><div><span>${t("留出样本", "Holdout sample")}</span><strong>${result.model.testN.toLocaleString()}</strong></div></section>
  <section class="section"><header><small>VALIDATION</small><h2>${t("模型目标与样本外验证", "Model target and holdout validation")}</h2></header><div class="model-meta"><div><span>${t("预测对象", "Target")}</span><strong>${escapeHtml(result.model.target)}</strong></div><div><span>${t("目标规则", "Target rule")}</span><strong>${escapeHtml(result.model.targetRule)}</strong></div><div><span>AUC</span><strong>${result.model.testAuc ?? "—"}</strong></div><div><span>Brier</span><strong>${result.model.testBrier ?? "—"}</strong></div></div><div class="note">${escapeHtml(result.model.boundary)}</div></section>
  <section class="section"><header><small>COEFFICIENTS</small><h2>${t("标准化系数与方向", "Standardized coefficients and direction")}</h2></header><table class="table"><thead><tr><th>${t("变量", "Variable")}</th><th>${t("Raw字段", "Raw field")}</th><th>β</th><th>Odds ratio</th><th>${t("方向", "Direction")}</th></tr></thead><tbody>${coefficients || `<tr><td colspan="5">${escapeHtml(result.model.blockers.join("；") || t("无可用系数", "No coefficients available"))}</td></tr>`}</tbody></table></section>
  <section class="section"><header><small>METRIC CONTRACT</small><h2>${t("指标定义与Raw字段映射", "Metric definitions and Raw mapping")}</h2></header><table class="table"><thead><tr><th>${t("题号", "Question")}</th><th>${t("指标", "Metric")}</th><th>${t("Raw字段", "Raw field")}</th><th>${t("正例规则", "Positive rule")}</th></tr></thead><tbody>${definitions}</tbody></table><div class="note">${t(`共读取${result.meta.rowCount.toLocaleString()}行，进入生产${result.meta.eligibleRowCount.toLocaleString()}行；映射${result.schema.mappedColumnCount}/${result.meta.columnCount}个字段。`, `${result.meta.rowCount.toLocaleString()} rows read, ${result.meta.eligibleRowCount.toLocaleString()} entered production; ${result.schema.mappedColumnCount}/${result.meta.columnCount} fields mapped.`)}</div></section>
  <footer class="footer">${t("本附录用于解释模型目标、变量、验证结果和适用边界；系数不解释为因果效应。", "This appendix explains model targets, variables, validation and use boundaries; coefficients are not interpreted as causal effects.")}</footer>`;
  return pageShell(t("中国薄脆饼干新品概念与定价研究", "China cracker concept and pricing study"), t("模型解析附录", "Model interpretation appendix"), body);
}
