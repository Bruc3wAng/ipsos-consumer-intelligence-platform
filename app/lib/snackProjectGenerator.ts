export type SnackProjectObjective = "concept" | "pricing" | "channel" | "tracking";

export type SnackProjectConfig = {
  category: string;
  market: string;
  objective: SnackProjectObjective;
  sampleN: number;
  commonMetricCount: number;
  customVariables: string[];
  dceTasksPerPerson: number;
  primaryModel: string;
};

type QuestionRow = {
  id: string;
  layer: "通用核心" | "项目专属";
  question: string;
  kpi: string;
  modelRole: string;
};

const OBJECTIVE_OUTPUTS: Record<SnackProjectObjective, {
  headline: string;
  kpis: Array<{ name: string; value: string; definition: string }>;
  modelAnswer: string;
  nextAction: string;
}> = {
  concept: {
    headline: "识别值得进入实物测试的概念、价格与人群组合",
    kpis: [
      { name: "概念相关性", value: "71.8%", definition: "Top2Box；全体有效样本" },
      { name: "模拟试购倾向", value: "29.8%", definition: "固定产品情景下的选择概率" },
      { name: "价格接受", value: "73.4%", definition: "目标价格及以下可接受比例" },
      { name: "目标人群指数", value: "128", definition: "高潜人群相对总体，100为总体" },
    ],
    modelAnswer: "哪个概念与产品组合最可能进入下一轮实物测试，以及由哪些属性和人群驱动。",
    nextAction: "优先验证高潜组合，并以实物盲测替代问卷意向作为下一阶段结果标签。",
  },
  pricing: {
    headline: "给出价格带、规格与促销方式的可比较取舍",
    kpis: [
      { name: "可接受价格中位数", value: "¥12.9", definition: "标准规格；Van Westendorp模拟" },
      { name: "目标价选择概率", value: "42.6%", definition: "离散选择固定情景" },
      { name: "价格弹性", value: "-1.42", definition: "价格每变化1%的相对选择变化" },
      { name: "溢价人群占比", value: "24.7%", definition: "可接受价格高于基准15%" },
    ],
    modelAnswer: "在不同规格、价格和促销组合下，选择概率如何变化，哪些人群对价格最敏感。",
    nextAction: "将建议价格带带入下一轮产品组合实验，并用渠道成交或试购结果校准弹性。",
  },
  channel: {
    headline: "确定渠道进入顺序和货架组合的增量触达",
    kpis: [
      { name: "目标渠道触达", value: "62.1%", definition: "品类购买者Base" },
      { name: "增量购买者覆盖", value: "+11.6 pts", definition: "加入目标渠道后的净新增覆盖" },
      { name: "货架可见度", value: "68.9%", definition: "模拟货架任务识别率" },
      { name: "内部替代风险", value: "18.3%", definition: "新增SKU替代现有组合的比例" },
    ],
    modelAnswer: "进入哪个渠道、采用什么陈列和SKU组合，能够增加覆盖而不过度替代现有商品。",
    nextAction: "对优先渠道开展真实货架或门店A/B测试，并回流周转、缺货与替代结果。",
  },
  tracking: {
    headline: "持续识别品类、人群与品牌指标的变化概率",
    kpis: [
      { name: "品类渗透率", value: "59.3%", definition: "过去3个月购买；全体样本" },
      { name: "月均购买频次", value: "2.4", definition: "品类购买者Base" },
      { name: "季度变化概率", value: "76.2%", definition: "分层贝叶斯上升概率" },
      { name: "高潜人群迁入", value: "+4.8 pts", definition: "较上一期的模拟净迁移" },
    ],
    modelAnswer: "哪些KPI发生了可信变化，变化来自哪些人群、市场与需求因素，下一期区间是多少。",
    nextAction: "保持固定核心题和口径，下一期回收后用时间切分更新趋势与迁移模型。",
  },
};

const CORE_QUESTIONS: QuestionRow[] = [
  { id: "S1-S5", layer: "通用核心", question: "年龄、性别、地区、城市级别与收入", kpi: "加权与分组Base", modelRole: "分层变量" },
  { id: "Q1-Q3", layer: "通用核心", question: "品类购买、购买频次与花费", kpi: "渗透率、频次、买者花费", modelRole: "需求与价值基线" },
  { id: "Q4-Q5", layer: "通用核心", question: "购买渠道与主要渠道", kpi: "渠道触达、渠道重叠", modelRole: "渠道选择变量" },
  { id: "Q6-Q8", layer: "通用核心", question: "购买场景、需求重要性与满足度", kpi: "需求缺口、人群机会", modelRole: "驱动变量" },
  { id: "Q9", layer: "通用核心", question: "标准规格下的价格接受", kpi: "价格接受曲线", modelRole: "价格变量" },
  { id: "Q10-Q12", layer: "通用核心", question: "概念相关性、可信度与试购倾向", kpi: "概念门槛、试购倾向", modelRole: "倾向标签" },
];

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function buildSnackProjectPreview(config: SnackProjectConfig) {
  const output = OBJECTIVE_OUTPUTS[config.objective];
  const customQuestions: QuestionRow[] = config.customVariables.map((variable, index) => ({
    id: `C${String(index + 1).padStart(2, "0")}`,
    layer: "项目专属",
    question: `${config.category}：${variable}`,
    kpi: index < 3 ? `${variable}评价` : "情景比较",
    modelRole: index < 2 ? "核心解释变量" : "产品校准变量",
  }));
  if (config.dceTasksPerPerson > 0) {
    customQuestions.push({
      id: "DCE1-DCE8",
      layer: "项目专属",
      question: "产品属性、规格、价格与品牌组合选择任务",
      kpi: "属性效用、固定情景选择概率",
      modelRole: "离散选择模型",
    });
  }

  const buyerBase = Math.round(config.sampleN * 0.5932);
  const marginOfError = round(98 / Math.sqrt(config.sampleN), 1);
  const nearestAuc = config.sampleN >= 2400 ? 0.705 : config.sampleN >= 1200 ? 0.702 : config.sampleN >= 600 ? 0.700 : 0.694;

  return {
    dataStatus: "模拟产品原型",
    config,
    questionnaire: [...CORE_QUESTIONS, ...customQuestions],
    collection: {
      completedN: config.sampleN,
      buyerBase,
      dceChoiceRows: config.sampleN * config.dceTasksPerPerson,
      marginOfError95Pp: marginOfError,
      commonMetricCoverage: `${config.commonMetricCount}/16`,
    },
    kpis: output.kpis,
    model: {
      name: config.primaryModel,
      simulatedHoldoutAuc: nearestAuc,
      target: config.objective === "tracking" ? "下一期KPI区间与人群迁移" : "固定研究情景下的选择或行动概率",
      answer: output.modelAnswer,
      evidence: ["通用核心指标", `${config.category}专属变量`, "配额与人群分层", config.dceTasksPerPerson ? "选择实验任务" : "本期追踪与情景变量"],
    },
    decision: {
      headline: output.headline,
      nextAction: output.nextAction,
      boundary: "当前数值均为模拟，用于验证产品流程与展示结构；正式项目需用真实问卷、实验和后续结果重新估计。",
    },
  };
}
