export const campaignScorecard = [
  {
    key: "campaignRecognition",
    label: "Campaign 认知",
    value: 48,
    benchmark: 35,
    base: 2000,
    note: "看过问卷中的 Campaign 素材后表示近 1–2 个月接触过",
    source: "Campaign!A284:B293 · 报告 P12",
  },
  {
    key: "effectiveBrandRecognition",
    label: "联想有效品牌认知",
    value: 33,
    benchmark: 22,
    base: 2000,
    note: "Campaign 认知 × 被认知者中的联想品牌联结 68%",
    source: "Campaign!A374:B409 · 报告 P12",
  },
  {
    key: "lenovoAiRecognition",
    label: "联想 AI 标签认知",
    value: 26,
    benchmark: 22,
    base: 2000,
    note: "总样本口径；被认知者中联想 AI 识别为 54%",
    source: "Campaign!A414:B441 · 报告 P13",
  },
  {
    key: "partnerRecognition",
    label: "官方技术伙伴认知",
    value: 44,
    benchmark: 38,
    base: 2000,
    note: "正确选择 Lenovo 为 FIFA 世界杯官方技术合作伙伴",
    source: "Campaign!A464:B476 · 报告 P14",
  },
];

export const campaignPerformanceIndex = {
  score: 130,
  benchmark: 100,
  method: "Campaign 认知、有效品牌认知、联想 AI 标签认知、官方技术伙伴认知四项相对行业 Norm 指数等权合成",
  dimensions: [
    { name: "Campaign 认知", index: 137, value: 48, benchmark: 35 },
    { name: "有效品牌认知", index: 150, value: 33, benchmark: 22 },
    { name: "联想 AI 标签认知", index: 118, value: 26, benchmark: 22 },
    { name: "官方技术伙伴认知", index: 116, value: 44, benchmark: 38 },
  ],
};

export const campaignModelInsights = [
  {
    title: "品牌联结是本次 Campaign 的核心优势",
    finding: "Campaign 认知达到 48%，其中 68% 能正确联想到联想，形成 33% 的有效品牌认知，高于行业 Norm 11pts。",
    action: "继续固定联想品牌在赛事素材中的首屏位置和视觉资产，优先放大已建立的品牌记忆。",
  },
  {
    title: "世界杯兴趣显著影响广告记忆",
    finding: "中期 raw 的驱动模型显示，世界杯关注者认知 60.9%，非关注者 36.5%，相差 24.4pts；5 折 AUC 为 0.717。",
    action: "球迷人群强化赛事与 AI 技术伙伴身份；非球迷人群前置日常 AI PC 使用价值，减少对赛事兴趣的依赖。",
  },
  {
    title: "AI 标签已经形成，但信息需要收束",
    finding: "联想 AI 与天禧 AI 认知分别达到 26% 和 24%；品牌 AI 资产已进入消费者记忆。",
    action: "以“联想 AI”为总入口，再用天禧 AI 承接具体体验，避免多个标签在同一素材中平行竞争。",
  },
];

export const campaignChannels = [
  { channel: "电视广告", value: 46 },
  { channel: "网络广告", value: 33 },
  { channel: "线下渠道", value: 31 },
  { channel: "品牌官方渠道", value: 30 },
  { channel: "电商平台", value: 22 },
  { channel: "社媒平台", value: 21 },
  { channel: "PR", value: 14 },
  { channel: "楼宇广告", value: 13 },
  { channel: "机场广告", value: 11 },
];

export const campaignFunnel = [
  { stage: "世界杯关注", value: 43, base: 2000 },
  { stage: "Campaign 认知", value: 48, base: 2000 },
  { stage: "有效品牌认知", value: 33, base: 2000 },
  { stage: "联想 AI 认知", value: 26, base: 2000 },
  { stage: "天禧 AI 认知", value: 24, base: 2000 },
];

export const trackingSignals = [
  { metric: "联想无提示总认知", before: 92, after: 94, change: 2 },
  { metric: "联想美誉度", before: 29, after: 30, change: 1 },
  { metric: "联想购买意愿", before: 35, after: 37, change: 2 },
  { metric: "联想 AI 无提示认知", before: 8, after: 13, change: 5 },
  { metric: "联想 AI 提示后认知", before: 28, after: 34, change: 6 },
  { metric: "天禧 AI 无提示认知", before: 23, after: 27, change: 4 },
];

export const evidenceClaims = [
  {
    claim: "本次 Campaign 的被动认知与品牌联结表现较强",
    status: "可支持",
    tone: "supported",
    evidence: "Campaign 认知 48%，有效品牌认知 33%，分别高于报告引用的 35% / 22% 行业 Norm。",
    decision: "可确认素材已经形成可见度与联想品牌记忆。",
  },
  {
    claim: "联想 AI 与天禧 AI 在 Campaign 中形成了标签记忆",
    status: "可支持",
    tone: "supported",
    evidence: "总样本口径的联想 AI / 天禧 AI 认知分别为 26% / 24%。",
    decision: "可继续强化‘联想 AI’总标签，同时减少多子品牌信息竞争。",
  },
  {
    claim: "品牌指标在 Campaign 期间出现上升",
    status: "趋势证据",
    tone: "directional",
    evidence: "W0–W1 无提示认知 +2pts、美誉度 +1pt、购买意愿 +2pts。",
    decision: "与 Campaign 后测结果形成一致方向，可持续纳入跨期追踪。",
  },
  {
    claim: "官方合作伙伴身份形成积极购买态度",
    status: "态度证据",
    tone: "directional",
    evidence: "B15 为带前置信息的 1–10 分自陈题，T2B 55%、均值 8.4。",
    decision: "可作为购买预测模型的态度输入，并在后续接入真实购买结果校准。",
  },
  {
    claim: "传播表现可进一步连接到销量增量与 ROI",
    status: "数据扩展",
    tone: "gap",
    evidence: "当前后测已经提供认知、品牌联结、AI 标签和购买态度；下一阶段接入投放、销量与 CRM 结果。",
    decision: "在现有传播模型上增加 uplift、MMM 与购买结果回测。",
  },
];

export const questionnaireAudit = [
  {
    item: "目标样本与配额",
    rating: "适合目标人群诊断",
    tone: "supported",
    finding: "N=2,000；18–45 岁；购买决策者/近期购机者与未来购机者；年龄、性别、城市级别设配额。",
    implication: "结论适用于目标购机人群，不代表全体人口。",
  },
  {
    item: "Campaign 认知",
    rating: "可靠的提示后认知",
    tone: "directional",
    finding: "B2 在展示完整 Campaign 素材拼图后询问是否接触过。",
    implication: "可作为 aided recognition，不应表述为自然记忆或净触达。",
  },
  {
    item: "归因设计",
    rating: "可扩展到因果模型",
    tone: "gap",
    finding: "当前包含单次后测与历史 W0 对比；下一波可增加同期未曝光或未投放对照。",
    implication: "保留现有问卷结构，并增加曝光、Holdout 与结果回流字段即可进入 uplift 模型。",
  },
  {
    item: "购买影响题",
    rating: "可作为态度预测输入",
    tone: "directional",
    finding: "B15 先告知联想是官方伙伴，再询问‘因此’购买意愿。",
    implication: "与后续购买结果连接后，可校准态度到真实购买的转化关系。",
  },
  {
    item: "开放题与定性证据",
    rating: "解释力高，需编码治理",
    tone: "supported",
    finding: "B6 / C9 / C11 可解释记忆点、体验与未来期待。",
    implication: "需要保留 codebook、双人编码一致性和引用样本来源。",
  },
  {
    item: "嘉年华体验",
    rating: "小样本方向性",
    tone: "directional",
    finding: "体验满意度 T2B 70%，但仅基于 67 名参与者。",
    implication: "简单随机近似下 95% 误差约 ±11pts，不宜过度细分。",
  },
];

export const sourceQualityChecks = [
  {
    severity: "高",
    title: "B9 汇总不闭合",
    detail: "最终汇总中‘是’11% + ‘否’59% = 70%，但 Total 显示 100%。7 月 21 日的 N=1,000 raw 在 B2 路由内没有缺答，问题更可能出在最终汇总口径或表格生成。",
    source: "Campaign!A450:B457",
  },
  {
    severity: "中",
    title: "B5 产品品牌标签疑似错位",
    detail: "若干行同时出现两个产品标签，需在引用 YOGA / moto / ThinkBook 细项前核对代码与标签映射。",
    source: "Campaign!A377:B392",
  },
  {
    severity: "中",
    title: "行业 Norm 缺少可比性元数据",
    detail: "报告说明来自 2023–2025 消费电子 20+ 案例，但未随附案例、样本、加权与口径清单。",
    source: "报告 P12–P14",
  },
];

export const forecastPreview = [
  { year: "2026", mean: 24, low: 24, high: 24 },
  { year: "2027", mean: 31, low: 24, high: 39 },
  { year: "2028", mean: 39, low: 27, high: 52 },
  { year: "2029", mean: 46, low: 29, high: 64 },
];

export const modelCards = [
  {
    name: "Campaign Recognition Propensity v0.1",
    family: "正则化 Logistic",
    target: "提示后 Campaign 认知（B2=1）",
    status: "样本外回测",
    needs: "中期 raw N=1,000 · 受访者特征与 Campaign 认知标签",
    validation: "5 折样本外 AUC 0.717（N=1,000）",
  },
  {
    name: "Bayesian Market Forecast",
    family: "分层扩散 + 动态贝叶斯",
    target: "未来 3 年 AI PC 渗透率",
    status: "贝叶斯情景模型",
    needs: "季度市场渗透、销量/装机、价格、渠道与宏观驱动",
    validation: "滚动时间窗回测；覆盖率与 MAPE",
  },
  {
    name: "Brand Choice Model",
    family: "Hierarchical Bayes MNL",
    target: "Lenovo / Dell / Apple 选择概率与价格弹性",
    status: "品牌选择模拟器",
    needs: "受访者级选择任务、价格/配置属性、真实购买校准",
    validation: "留出 choice task 命中率；份额校准",
  },
  {
    name: "Consumer Digital Twin",
    family: "校准分类器 + 需求排序",
    target: "是否购买、功能偏好、价格接受",
    status: "消费者画像预测器",
    needs: "受访者画像、后续购买标签、CRM/电商结果回流",
    validation: "时间外样本 AUC / Brier；分群校准曲线",
  },
];

export const dataLayers = [
  { layer: "研究数据", state: "已接入汇总", detail: "问卷、汇总表、报告、定性文本", cadence: "项目/波次" },
  { layer: "受访者级建模表", state: "中期样本已接入", detail: "N=1,000 · 1,153 变量 · 7/16–7/20", cadence: "每次 fieldwork" },
  { layer: "媒体与曝光", state: "待接入", detail: "渠道、素材、频次、城市/人群曝光", cadence: "日/周" },
  { layer: "商业结果", state: "待接入", detail: "SKU 销售、转化、CRM、渠道与价格", cadence: "周/月" },
  { layer: "模型与证据", state: "已设计", detail: "版本、特征、验证、区间、结论账本", cadence: "每次运行" },
];

export const rawDataSnapshot = {
  respondents: 1000,
  variables: 1153,
  fieldwork: "2026-07-16 — 2026-07-20",
  finalReportBase: 2000,
  medianMinutes: 12,
  underTenMinutes: 282,
  duplicateSerials: 0,
  routeChecksPassed: 12,
  note: "这是一份 7 月 21 日中期 raw，仅覆盖最终报告样本的一半；可用于结构、路由与初步关联建模，不能替代 N=2,000 最终 raw 的复算。",
};

export const preliminaryRecognitionModel = {
  name: "Campaign Recognition Propensity v0.1",
  auc: 0.717,
  folds: [0.67, 0.691, 0.72, 0.75, 0.752],
  sample: 1000,
  target: "B2 提示后 Campaign 认知",
  validation: "5-fold out-of-sample",
  strongestSignal: "世界杯关注者的 Campaign 认知为 60.9%，非关注者为 36.5%，差 24.4pts。",
  limit: "这是认知倾向模型，不是广告增量效果模型，也不能预测真实购买。",
};

export const worldCupRecognition = [
  { group: "关注世界杯", recognition: 60.9, n: 430 },
  { group: "不关注世界杯", recognition: 36.5, n: 570 },
];

export const simulatedCampaignModel = {
  sample: 30000,
  design: "65% randomized campaign treatment / 35% holdout",
  calibration: "以 N=1,000 中期 raw 的人口与世界杯关注联合分布为校准锚点",
  treatedPurchase: 9.61,
  controlPurchase: 5.78,
  absoluteUplift: 3.83,
  relativeLift: 66.3,
  ci95: [3.22, 4.44],
  incrementalPer10000: 383,
  purchaseAuc: 0.701,
  seed: 20260810,
  dataset: "lenovo_campaign_simulation_30000.csv",
  limit: "合成结果含人为注入的 treatment effect，仅用于验证数据链路、模型与交互产品，不是联想真实业务结果。",
};

export const simulatedUpliftSegments = [
  { segment: "球迷 × AI 高兴趣", n: 6676, treated: 18.28, control: 10.77, uplift: 7.51 },
  { segment: "AI 高兴趣", n: 4533, treated: 9.68, control: 5.38, uplift: 4.29 },
  { segment: "大众潜力人群", n: 11594, treated: 7.73, control: 5.14, uplift: 2.59 },
  { segment: "高价格敏感", n: 7197, treated: 4.56, control: 2.43, uplift: 2.13 },
];
