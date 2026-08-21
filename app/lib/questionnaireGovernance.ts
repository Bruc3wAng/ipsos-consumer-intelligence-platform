export type MetricInclusionAssessment = {
  recommendation: "project_only" | "candidate_for_common";
  labelZh: string;
  contributionZh: string;
  reasonsZh: string[];
};

const REUSABLE_ANCHORS = [
  "过去3个月", "购买频次", "购买渠道", "价格接受", "购买意向",
  "满意度", "推荐意向", "复购", "品牌考虑", "使用场景",
];

const PROJECT_SPECIFIC_ANCHORS = ["本次概念", "本产品", "这款", "广告文案", "包装方案", "客户品牌"];

export function assessQuestionForMetricSystem(question: string): MetricInclusionAssessment {
  const normalized = question.trim();
  const reusableMatches = REUSABLE_ANCHORS.filter((term) => normalized.includes(term));
  const projectMatches = PROJECT_SPECIFIC_ANCHORS.filter((term) => normalized.includes(term));
  const hasDefinedWindow = /过去\d+(天|周|个月|年)|未来\d+(天|周|个月|年)/.test(normalized);
  const hasObservableObject = /购买|使用|选择|满意|推荐|价格|渠道|频次|复购/.test(normalized);
  const candidate = reusableMatches.length > 0 && hasObservableObject && projectMatches.length === 0;

  if (candidate) {
    return {
      recommendation: "candidate_for_common",
      labelZh: "建议进入通用指标候选",
      contributionZh: "可形成跨项目稳定口径，需补充分母、时间窗、选项和验证频率后复核。",
      reasonsZh: [
        `命中可复用决策对象：${reusableMatches.join("、")}`,
        hasDefinedWindow ? "包含明确时间窗" : "建议补充明确时间窗",
        "最终纳入需由研究人员确认跨品类适用性和历史可比性",
      ],
    };
  }

  return {
    recommendation: "project_only",
    labelZh: "保留在项目专项层",
    contributionZh: "用于当前客户、产品或概念的解释与校准，不自动改变通用指标口径。",
    reasonsZh: [
      projectMatches.length ? `包含项目专属表达：${projectMatches.join("、")}` : "尚未形成可跨项目复用的稳定指标定义",
      "可进入本项目分析和模型变量",
      "若多项目反复出现且能稳定计算，再提交通用层复核",
    ],
  };
}
