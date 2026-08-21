export const bhtSocialPeriods = [
  { period: "FY24/25 Q1", health: 68.2, awareness: 90.0, consideration: 63.0, preference: 41.0, innovation: 38.0, social: 51.0 },
  { period: "FY24/25 Q2", health: 68.9, awareness: 90.0, consideration: 64.0, preference: 42.0, innovation: 39.0, social: 55.0 },
  { period: "FY24/25 Q3", health: 69.5, awareness: 90.5, consideration: 64.0, preference: 42.0, innovation: 41.0, social: 53.0 },
  { period: "FY24/25 Q4", health: 69.8, awareness: 91.0, consideration: 65.0, preference: 43.0, innovation: 42.0, social: 59.0 },
  { period: "FY25/26 Q1", health: 70.6, awareness: 91.0, consideration: 65.0, preference: 43.0, innovation: 42.0, social: 62.0 },
  { period: "FY25/26 Q2", health: 71.1, awareness: 91.0, consideration: 66.0, preference: 44.0, innovation: 43.0, social: 67.0 },
  { period: "FY25/26 Q3", health: 72.4, awareness: 91.0, consideration: 67.0, preference: 45.0, innovation: 45.0, social: 74.0 },
  { period: "FY25/26 Q4F", health: 73.6, awareness: 91.4, consideration: 68.2, preference: 45.8, innovation: 46.2, social: 72.0, forecast: true },
] as const;

export const segmentAdjustments = {
  consumer: { label: "消费市场", health: 0, awareness: 0, consideration: 0, preference: 0, innovation: 0, social: 0 },
  smb: { label: "中小企业", health: 1.4, awareness: -1, consideration: 3, preference: 2, innovation: 2, social: -3 },
  enterprise: { label: "政企客户", health: 2.2, awareness: -40, consideration: 6, preference: 5, innovation: 2, social: -8 },
} as const;

export const subgroupOptions = {
  consumer: [
    { id: "all", label: "整体", health: 0, awareness: 0, consideration: 0, preference: 0, innovation: 0, social: 0, momentum: 1.2, driver: "创新形象" },
    { id: "ai_high", label: "AI PC 高兴趣人群", health: 6.2, awareness: 2, consideration: 11, preference: 9, innovation: 13, social: 8, momentum: 2.1, driver: "AI 功能实用价值" },
    { id: "lenovo_user", label: "联想当前用户", health: 7.7, awareness: 6, consideration: 14, preference: 16, innovation: 5, social: 3, momentum: 1.5, driver: "信赖与使用体验" },
    { id: "competitor_user", label: "竞品当前用户", health: -6.5, awareness: -2, consideration: -13, preference: -14, innovation: -3, social: 1, momentum: .6, driver: "品牌切换理由" },
    { id: "young", label: "18–29 岁", health: 1.4, awareness: -1, consideration: 3, preference: 2, innovation: 7, social: 9, momentum: 1.8, driver: "设计与创作场景" },
  ],
  smb: [
    { id: "all", label: "整体", health: 0, awareness: 0, consideration: 0, preference: 0, innovation: 0, social: 0, momentum: 1.1, driver: "信赖与服务能力" },
    { id: "micro", label: "1–49 人企业", health: -4.4, awareness: -2, consideration: -6, preference: -5, innovation: -2, social: 2, momentum: .5, driver: "价格与服务可得性" },
    { id: "mid", label: "50–499 人企业", health: 1.8, awareness: 1, consideration: 4, preference: 3, innovation: 3, social: -1, momentum: 1.4, driver: "方案与部署效率" },
    { id: "itdm", label: "IT 决策者", health: 5.4, awareness: 2, consideration: 8, preference: 7, innovation: 6, social: 0, momentum: 1.9, driver: "安全与全栈能力" },
    { id: "ai_adopter", label: "已部署 AI 的企业", health: 7.7, awareness: 3, consideration: 11, preference: 10, innovation: 12, social: 4, momentum: 2.3, driver: "AI 方案实际成效" },
  ],
  enterprise: [
    { id: "all", label: "整体", health: 0, awareness: 0, consideration: 0, preference: 0, innovation: 0, social: 0, momentum: 1.0, driver: "行业领导力" },
    { id: "government", label: "政府机构", health: .7, awareness: 1, consideration: 2, preference: 2, innovation: -1, social: -2, momentum: .8, driver: "安全与国产化" },
    { id: "large_enterprise", label: "大型企业", health: -.6, awareness: -1, consideration: 1, preference: 0, innovation: 2, social: 1, momentum: 1.1, driver: "全栈 AI 与服务" },
    { id: "itdm", label: "IT 决策者", health: 5.6, awareness: 2, consideration: 8, preference: 7, innovation: 6, social: 0, momentum: 1.7, driver: "数据安全与部署能力" },
    { id: "ai_deployed", label: "已规模部署 AI", health: 7.5, awareness: 3, consideration: 10, preference: 9, innovation: 11, social: 3, momentum: 2.0, driver: "AI 业务结果" },
  ],
} as const;

export const brandFunnel = [
  { metric: "无提示认知", current: 91.0, previous: 91.0, forecast: 91.4, low: 90.5, high: 92.3 },
  { metric: "品牌熟悉度", current: 82.0, previous: 81.0, forecast: 82.8, low: 81.1, high: 84.5 },
  { metric: "品牌考虑", current: 67.0, previous: 66.0, forecast: 68.2, low: 66.1, high: 70.3 },
  { metric: "品牌偏好", current: 45.0, previous: 44.0, forecast: 45.8, low: 43.7, high: 47.9 },
  { metric: "购买意向", current: 39.0, previous: 38.0, forecast: 40.1, low: 37.8, high: 42.4 },
] as const;

export const bhtDrivers = [
  { driver: "创新的", performance: 45, importance: 100, change: 2.0, priority: "优先放大", link: "Social: AI PC / 产品创新" },
  { driver: "值得信赖的", performance: 55, importance: 86, change: 1.0, priority: "持续巩固", link: "Social: 产品可靠性" },
  { driver: "提供卓越用户体验", performance: 58, importance: 78, change: 0.0, priority: "修复停滞", link: "Social: 使用体验 / 服务" },
  { driver: "高端的", performance: 40, importance: 69, change: 1.0, priority: "重点提升", link: "Social: 设计 / 旗舰产品" },
  { driver: "生态的", performance: 25, importance: 62, change: 2.0, priority: "培育认知", link: "Social: AI 生态 / 跨设备" },
] as const;

export const socialTopics = [
  { topic: "AI PC 与个人智能", share: 38, sentiment: 76, change: 8.6, impact: 100 },
  { topic: "产品创新与性能", share: 24, sentiment: 72, change: 3.1, impact: 78 },
  { topic: "服务与使用体验", share: 16, sentiment: 54, change: -2.8, impact: 70 },
  { topic: "产品可靠性", share: 12, sentiment: 66, change: 0.7, impact: 55 },
  { topic: "可持续发展", share: 10, sentiment: 81, change: 1.4, impact: 34 },
] as const;

export const socialChannels = [
  { channel: "抖音", share: 31, sentiment: 62, velocity: 18, decision: "扩大场景化内容，同时控制服务负面扩散" },
  { channel: "微博", share: 24, sentiment: 65, velocity: 7, decision: "承接发布事件与品牌信息" },
  { channel: "小红书", share: 16, sentiment: 74, velocity: 14, decision: "放大真实使用体验与设计表达" },
  { channel: "哔哩哔哩", share: 15, sentiment: 71, velocity: 11, decision: "强化 AI PC 功能解释与长内容评测" },
  { channel: "新闻与论坛", share: 14, sentiment: 60, velocity: -3, decision: "监测服务、质量与企业议题" },
] as const;

export const brandShareOfVoice = [
  { brand: "Lenovo", value: 31.8 },
  { brand: "Huawei", value: 28.4 },
  { brand: "Apple", value: 22.1 },
  { brand: "Dell", value: 9.4 },
  { brand: "HP", value: 8.3 },
] as const;

export const modelRegistry = [
  { name: "动态品牌健康预测", target: "下一期品牌健康指数与漏斗 KPI", input: "多期 BHT + 市场事件", validation: "滚动时间窗 · MAPE · 区间覆盖率" },
  { name: "BHT 关键驱动模型", target: "品牌考虑 / 偏好 / 购买意向", input: "受访者级问卷与品牌形象题", validation: "时间留出 · AUC · Brier · 系数稳定性" },
  { name: "Social 语义与异常检测", target: "话题、情绪、风险事件", input: "帖子、评论、互动与渠道", validation: "人工标注集 · F1 · 事件召回率" },
  { name: "跨源领先指标模型", target: "Social 信号对下一期 BHT 的领先关系", input: "周度 Social + 季度 BHT", validation: "分布滞后回归 · 滚动回测" },
] as const;

export const demoSourceNote = "页面当前使用结构演示数据；接入真实 BHT、Social 与市场事件数据后，全部指标、预测和洞察按相同字段自动刷新。";
