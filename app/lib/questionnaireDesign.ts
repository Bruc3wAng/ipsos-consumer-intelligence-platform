export type ResearchQuestion = {
  module: string;
  question_id: string;
  question_text: string;
  response_type: string;
  options: string[];
  base: string;
  logic: string;
  required: boolean;
  kpi_ids: string[];
  metric_contribution: string;
  model_roles: string[];
  indicator_layer: string;
  inclusion_recommendation: string;
  client_editable: boolean;
  cadence: string;
};

export type QuestionChangeState = "unchanged" | "modified" | "added" | "deleted";
export type MappingFit = "retained" | "review" | "incompatible" | "candidate" | "project_only";

export type QuestionImpact = {
  questionId: string;
  changeState: QuestionChangeState;
  fit: MappingFit;
  kpiIds: string[];
  modelRoles: string[];
  labelZh: string;
  reasonZh: string;
  recommendationZh: string;
};

export type QuestionnaireImpactSummary = {
  activeQuestions: number;
  unchangedQuestions: number;
  modifiedQuestions: number;
  addedQuestions: number;
  deletedQuestions: number;
  retainedKpis: string[];
  reviewKpis: string[];
  removedKpis: string[];
  retainedModelRoles: string[];
  reviewModelRoles: string[];
  blockedModelRoles: string[];
  readyToFinalize: boolean;
};

const CONCEPT_TOKENS = [
  "年龄", "性别", "地区", "城市", "收入", "购买", "频次", "支出", "渠道", "场景", "价格",
  "考虑", "意向", "满意", "需求", "概念", "品牌", "包装", "规格", "健康", "口味", "传播", "触点",
];

function normalizedOptions(options: string[]) {
  return options.map((item) => item.trim()).filter(Boolean);
}

function sameStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function importantTokens(text: string) {
  return CONCEPT_TOKENS.filter((token) => text.includes(token));
}

export function questionChangeState(current: ResearchQuestion, baseline?: ResearchQuestion, deleted = false): QuestionChangeState {
  if (deleted) return "deleted";
  if (!baseline) return "added";
  const unchanged = current.module === baseline.module
    && current.question_text.trim() === baseline.question_text.trim()
    && current.response_type === baseline.response_type
    && sameStrings(normalizedOptions(current.options), normalizedOptions(baseline.options))
    && current.base.trim() === baseline.base.trim()
    && current.logic.trim() === baseline.logic.trim();
  return unchanged ? "unchanged" : "modified";
}

export function analyzeQuestionImpact(current: ResearchQuestion, baseline?: ResearchQuestion, deleted = false): QuestionImpact {
  const changeState = questionChangeState(current, baseline, deleted);
  const kpiIds = baseline?.kpi_ids ?? current.kpi_ids;
  const modelRoles = baseline?.model_roles ?? current.model_roles;

  if (deleted) {
    return {
      questionId: current.question_id,
      changeState,
      fit: kpiIds.length || modelRoles.length ? "incompatible" : "project_only",
      kpiIds,
      modelRoles,
      labelZh: kpiIds.length ? "指标映射已中断" : "题目已移出Final版本",
      reasonZh: kpiIds.length ? "该题不再产生原指标所需字段，相关KPI与模型变量无法计算。" : "该题不再进入程序、Raw Data与Table。",
      recommendationZh: "如仍需原指标，请恢复原题或新增一个具备同口径、同Base和同选项结构的替代题。",
    };
  }

  if (!baseline) {
    const reusable = /过去\d+(天|周|个月|年)|未来\d+(天|周|个月|年)/.test(current.question_text)
      && /购买|使用|选择|满意|推荐|价格|渠道|频次|复购/.test(current.question_text)
      && !/本次概念|本产品|这款|客户品牌/.test(current.question_text);
    return {
      questionId: current.question_id,
      changeState,
      fit: reusable ? "candidate" : "project_only",
      kpiIds: current.kpi_ids,
      modelRoles: current.model_roles,
      labelZh: reusable ? "可评估为通用指标候选" : "进入项目专项分析",
      reasonZh: reusable ? "具备时间窗和可重复测量对象，但尚无跨项目稳定性证据。" : "当前题目更适合解释本项目产品、概念或场景。",
      recommendationZh: reusable ? "先保留项目题号；经多项目复测稳定后再进入通用指标版本。" : "保留项目专属题号与字段，不反写通用模型。",
    };
  }

  if (changeState === "unchanged") {
    return {
      questionId: current.question_id,
      changeState,
      fit: "retained",
      kpiIds,
      modelRoles,
      labelZh: kpiIds.length ? "指标口径保持可比" : "基础字段保持可用",
      reasonZh: "题干、题型、选项、Base和程序逻辑与标准版本一致。",
      recommendationZh: "保留当前版本。",
    };
  }

  const baselineTokens = importantTokens(baseline.question_text);
  const retainedTokens = baselineTokens.filter((token) => current.question_text.includes(token));
  const tokenFit = baselineTokens.length === 0 || retainedTokens.length / baselineTokens.length >= 0.6;
  const typeFit = current.response_type === baseline.response_type;
  const currentOptions = normalizedOptions(current.options);
  const baselineOptions = normalizedOptions(baseline.options);
  const optionFit = baselineOptions.length === 0 || currentOptions.length >= Math.min(2, baselineOptions.length);
  const routeFit = Boolean(current.base.trim() && current.logic.trim());
  const compatible = tokenFit && typeFit && optionFit && routeFit;

  return {
    questionId: current.question_id,
    changeState,
    fit: compatible ? "review" : "incompatible",
    kpiIds,
    modelRoles,
    labelZh: compatible ? "指标映射待复核" : "当前修改不再适配原指标",
    reasonZh: compatible
      ? "核心测量对象仍保留，但题干或程序结构发生变化，需要确认跨期可比性。"
      : [!tokenFit && "核心测量对象发生变化", !typeFit && "题型发生变化", !optionFit && "选项结构不足", !routeFit && "Base或程序逻辑缺失"].filter(Boolean).join("；") + "。",
    recommendationZh: compatible
      ? "研究人员确认统计口径后可保留原指标；确认前标记为待复核。"
      : "恢复原口径，或将本题改为项目专项题并停止向原KPI和模型供数。",
  };
}

export function summarizeQuestionnaireImpact(
  questions: ResearchQuestion[],
  baselineById: Record<string, ResearchQuestion>,
  deletedIds: string[],
): { impacts: QuestionImpact[]; summary: QuestionnaireImpactSummary } {
  const deleted = new Set(deletedIds);
  const impacts = questions.map((question) => analyzeQuestionImpact(question, baselineById[question.question_id], deleted.has(question.question_id)));
  const allKpis = new Set(questions.flatMap((question) => baselineById[question.question_id]?.kpi_ids ?? question.kpi_ids));
  const retainedKpis = new Set<string>();
  const reviewKpis = new Set<string>();
  const removedKpis = new Set<string>();
  const retainedModelRoles = new Set<string>();
  const reviewModelRoles = new Set<string>();
  const blockedModelRoles = new Set<string>();

  for (const impact of impacts) {
    const kpiTarget = impact.fit === "retained" ? retainedKpis : impact.fit === "review" ? reviewKpis : impact.fit === "incompatible" ? removedKpis : null;
    impact.kpiIds.forEach((id) => kpiTarget?.add(id));
    const modelTarget = impact.fit === "retained" ? retainedModelRoles : impact.fit === "review" ? reviewModelRoles : impact.fit === "incompatible" ? blockedModelRoles : null;
    impact.modelRoles.forEach((role) => modelTarget?.add(role));
  }
  for (const id of allKpis) {
    if (!reviewKpis.has(id) && !removedKpis.has(id)) retainedKpis.add(id);
  }
  removedKpis.forEach((id) => retainedKpis.delete(id));
  reviewKpis.forEach((id) => retainedKpis.delete(id));
  blockedModelRoles.forEach((role) => retainedModelRoles.delete(role));
  reviewModelRoles.forEach((role) => retainedModelRoles.delete(role));

  const summary: QuestionnaireImpactSummary = {
    activeQuestions: impacts.filter((item) => item.changeState !== "deleted").length,
    unchangedQuestions: impacts.filter((item) => item.changeState === "unchanged").length,
    modifiedQuestions: impacts.filter((item) => item.changeState === "modified").length,
    addedQuestions: impacts.filter((item) => item.changeState === "added").length,
    deletedQuestions: impacts.filter((item) => item.changeState === "deleted").length,
    retainedKpis: [...retainedKpis].sort(),
    reviewKpis: [...reviewKpis].sort(),
    removedKpis: [...removedKpis].sort(),
    retainedModelRoles: [...retainedModelRoles].sort(),
    reviewModelRoles: [...reviewModelRoles].sort(),
    blockedModelRoles: [...blockedModelRoles].sort(),
    readyToFinalize: questions.some((item) => !deleted.has(item.question_id))
      && questions.filter((item) => !deleted.has(item.question_id)).every((item) => Boolean(item.question_text.trim()) && Boolean(item.base.trim()) && Boolean(item.logic.trim()) && (/开放|数值|说明/.test(item.response_type) || normalizedOptions(item.options).length > 0)),
  };
  return { impacts, summary };
}
