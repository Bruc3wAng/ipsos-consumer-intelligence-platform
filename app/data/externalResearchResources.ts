export type ExternalResearchResource = {
  id: string;
  name: string;
  scopeZh: string;
  scopeEn: string;
  modelUseZh: string;
  modelUseEn: string;
  access: "connected" | "open_candidate" | "licensed";
  cadenceZh: string;
  cadenceEn: string;
  url: string;
};

export const EXTERNAL_RESEARCH_RESOURCES: ExternalResearchResource[] = [
  {
    id: "world-bank",
    name: "World Bank Open Data",
    scopeZh: "人口、收入、互联网接入、城市化与宏观消费背景",
    scopeEn: "Population, income, internet access, urbanization and macro context",
    modelUseZh: "国家分层、市场背景与海外研究设计",
    modelUseEn: "Country segmentation, market context and overseas study design",
    access: "connected",
    cadenceZh: "随官方发布更新",
    cadenceEn: "Official release cadence",
    url: "https://data.worldbank.org/",
  },
  {
    id: "nbs-china",
    name: "国家统计局",
    scopeZh: "中国消费、零售、收入与价格指数",
    scopeEn: "China consumption, retail, income and price indicators",
    modelUseZh: "中国市场趋势校准与问卷背景变量",
    modelUseEn: "China trend calibration and questionnaire context",
    access: "connected",
    cadenceZh: "月度/季度/年度",
    cadenceEn: "Monthly/quarterly/annual",
    url: "https://www.stats.gov.cn/",
  },
  {
    id: "un-comtrade",
    name: "UN Comtrade",
    scopeZh: "按国家、伙伴和HS编码统计的商品贸易数据",
    scopeEn: "Trade flows by market, partner and HS code",
    modelUseZh: "海外供给与贸易背景，不代替零食市场规模",
    modelUseEn: "Overseas supply and trade context, not snack market size",
    access: "connected",
    cadenceZh: "年度/随来源更新",
    cadenceEn: "Annual/source cadence",
    url: "https://comtradeplus.un.org/",
  },
  {
    id: "open-food-facts",
    name: "Open Food Facts",
    scopeZh: "多国预包装食品条码、成分、营养和规格属性",
    scopeEn: "Packaged-food barcode, ingredient, nutrition and pack attributes",
    modelUseZh: "商品属性字典、概念设计与跨国字段标准化",
    modelUseEn: "Product taxonomy, concept design and cross-market standardization",
    access: "connected",
    cadenceZh: "开放数据持续更新",
    cadenceEn: "Continuous open-data updates",
    url: "https://world.openfoodfacts.org/",
  },
  {
    id: "statista",
    name: "Statista Market & Consumer Insights",
    scopeZh: "多行业市场、消费者行为、历史数据与预测",
    scopeEn: "Cross-industry markets, consumer behavior, history and forecasts",
    modelUseZh: "市场规模与消费者趋势的外部基准；需按授权口径使用",
    modelUseEn: "External market and consumer benchmarks under licensed use",
    access: "licensed",
    cadenceZh: "授权后按产品更新",
    cadenceEn: "Product cadence after licensing",
    url: "https://www.statista.com/getting-started/insights-market-insights",
  },
  {
    id: "sensor-tower",
    name: "Sensor Tower",
    scopeZh: "应用、网站、数字广告、受众和零售媒体信号",
    scopeEn: "App, web, digital advertising, audience and retail-media signals",
    modelUseZh: "数字触点、竞品传播与消费者旅程的外部校验；需授权接入",
    modelUseEn: "Digital touchpoint, competitor media and journey calibration under license",
    access: "licensed",
    cadenceZh: "日度/周度/月度，取决于授权产品",
    cadenceEn: "Daily/weekly/monthly by licensed product",
    url: "https://sensortower.com/",
  },
  {
    id: "retail-platforms",
    name: "电商与零售平台数据",
    scopeZh: "商品、价格、促销、评价、排名、货架与成交结果",
    scopeEn: "Products, prices, promotions, reviews, ranking, shelf and outcomes",
    modelUseZh: "产品价格、渠道效率和经营结果回流；仅在客户授权或公开许可范围内采集",
    modelUseEn: "Pricing, channel efficiency and outcome feedback under authorized access",
    access: "open_candidate",
    cadenceZh: "按授权与业务频率",
    cadenceEn: "Authorized business cadence",
    url: "https://www.jd.com/",
  },
];
