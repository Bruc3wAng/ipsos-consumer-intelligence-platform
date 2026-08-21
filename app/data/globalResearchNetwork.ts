export type ResearchMarket = {
  id: string;
  country: string;
  english: string;
  lat: number;
  lng: number;
  waves: number;
  series: string[];
  external: string;
  benchmark: string;
};

export type EnergyMarket = {
  id: string;
  country: string;
  english: string;
  lat: number;
  lng: number;
  metric: string;
  detail: string;
  source: string;
};

export const researchMarkets: ResearchMarket[] = [
  {
    id: "US",
    country: "美国",
    english: "United States",
    lat: 38,
    lng: -98,
    waves: 5,
    series: ["TT及外部竞品生态满意度调研（W3–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "Pew Research Center · 2025",
    benchmark: "美国成年人 YouTube 使用率 84%，TikTok 使用率 37%",
  },
  {
    id: "UK",
    country: "英国",
    english: "United Kingdom",
    lat: 54.5,
    lng: -2.5,
    waves: 5,
    series: ["TT及外部竞品生态满意度调研（W3–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "Ofcom Online Nation · 2025",
    benchmark: "英国成年人 YouTube 覆盖率 94%，日均在线 4.5 小时",
  },
  {
    id: "DE",
    country: "德国",
    english: "Germany",
    lat: 51.2,
    lng: 10.4,
    waves: 4,
    series: ["TT及外部竞品生态满意度调研（W4–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "Eurostat · 2025",
    benchmark: "德国 16–29 岁社交网络使用率 84.2%",
  },
  {
    id: "JP",
    country: "日本",
    english: "Japan",
    lat: 36.2,
    lng: 138.3,
    waves: 5,
    series: ["TT及外部竞品生态满意度调研（W3–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "日本总务省 · 2024 年度调查",
    benchmark: "YouTube 使用率 80.8%，TikTok 使用率 33.2%",
  },
  {
    id: "ID",
    country: "印度尼西亚",
    english: "Indonesia",
    lat: -2.2,
    lng: 117.3,
    waves: 5,
    series: ["TT及外部竞品生态满意度调研（W3–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "BPS Statistics Indonesia · 2024",
    benchmark: "互联网使用人口占比 72.78%，高于 2023 年的 69.21%",
  },
  {
    id: "SA",
    country: "沙特阿拉伯",
    english: "Saudi Arabia",
    lat: 24,
    lng: 45,
    waves: 5,
    series: ["TT及外部竞品生态满意度调研（W3–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "Saudi CST · 2025",
    benchmark: "互联网渗透率 99.6%，AI 工具使用率 45.2%",
  },
  {
    id: "BR",
    country: "巴西",
    english: "Brazil",
    lat: -10,
    lng: -52,
    waves: 4,
    series: ["TT及外部竞品生态满意度调研（W4–W5）", "TikTok Search Awareness Tracking（W2 / W4）"],
    external: "Cetic.br TIC Domicílios · 2024",
    benchmark: "官方结果表、问卷与微观数据已纳入外部验证源",
  },
  {
    id: "KR",
    country: "韩国",
    english: "South Korea",
    lat: 36.4,
    lng: 127.9,
    waves: 2,
    series: ["TikTok Search Awareness Tracking（W2 / W4）"],
    external: "内部 Tracking 资产",
    benchmark: "跨期问卷、Raw Data 与 Table 已进入统一研究口径",
  },
  {
    id: "CN",
    country: "中国",
    english: "China",
    lat: 35.9,
    lng: 104.2,
    waves: 2,
    series: ["联想世界杯 Campaign 后测", "联想 AI PC 消费者模型"],
    external: "项目研究资产",
    benchmark: "广告效果、AI PC 渗透率与消费者选择模型入口",
  },
];

export const energyMarkets: EnergyMarket[] = [
  {
    id: "US",
    country: "美国",
    english: "United States",
    lat: 38,
    lng: -98,
    metric: "540 → 1,200+ kWh",
    detail: "人均数据中心用电量：2024 年约 540 kWh，2030 年预计超过 1,200 kWh。",
    source: "IEA Energy and AI · 2025",
  },
  {
    id: "CN",
    country: "中国",
    english: "China",
    lat: 35.9,
    lng: 104.2,
    metric: "+175 TWh",
    detail: "IEA 基准情景预计，2024–2030 年数据中心用电增加约 175 TWh。",
    source: "IEA Energy and AI · 2025",
  },
  {
    id: "EU",
    country: "欧洲",
    english: "Europe",
    lat: 50,
    lng: 14,
    metric: "+45 TWh",
    detail: "IEA 基准情景预计，2024–2030 年数据中心用电增加超过 45 TWh。",
    source: "IEA Energy and AI · 2025",
  },
  {
    id: "JP",
    country: "日本",
    english: "Japan",
    lat: 36.2,
    lng: 138.3,
    metric: "+80%",
    detail: "IEA 基准情景预计，日本数据中心用电到 2030 年较 2024 年增长约 80%。",
    source: "IEA Energy and AI · 2025",
  },
  {
    id: "SEA",
    country: "东南亚",
    english: "Southeast Asia",
    lat: 5,
    lng: 108,
    metric: ">2×",
    detail: "受新加坡和马来西亚南部枢纽带动，数据中心用电到 2030 年预计超过翻倍。",
    source: "IEA Energy and AI · 2025",
  },
];

export const energyGlobalBenchmark = {
  metric: "485 → 950 TWh",
  detail: "全球数据中心用电量预计从 2025 年约 485 TWh 增至 2030 年约 950 TWh；AI 专用数据中心用电同期预计增长至约 3 倍。",
  source: "IEA Key Questions on Energy and AI · 2026 update",
};
