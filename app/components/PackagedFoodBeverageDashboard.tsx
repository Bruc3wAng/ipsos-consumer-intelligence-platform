"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import foodJson from "../../output/packaged-food-beverage/dashboard-data.json";
import chinaOpenFoodJson from "../../output/packaged-food-beverage/open-food-facts-china-snacks-sample.json";
import openFoodJson from "../../output/packaged-food-beverage/open-food-facts-lays-sample.json";
import publicRetailJson from "../../output/packaged-food-beverage/public-retail-observations.json";
import authoritativePublicJson from "../../input/packaged-food-beverage/authoritative-public-data-20260812.json";
import PlatformBrand from "./PlatformBrand";

type Tab = "市场机会" | "公开商品观察" | "商品与价格" | "货架与组合" | "新品测试" | "指标与模型" | "产品方案";
type Sku = (typeof foodJson.skus)[number];
type ModelCoefficient = (typeof foodJson.model.coefficients)[number];
type AudienceMode = "成长品牌" | "渠道商" | "大客户";
type ViewMode = "当前品类" | "渠道TOP100";
type ProductDecisionKey = "opportunity" | "price" | "assortment" | "launch";
type Locale = "zh" | "en";
type MarketScope = "china" | "overseas";
type MarketCode = "CN" | "US" | "UK" | "DE" | "JP" | "ID" | "SA" | "BR";
type FoodResearchAnswer = { title: string; answer: string; points: string[]; sources: string[]; boundary: string; evidence: Array<{ label: string; value: string; source: string }>; dataLabel: string };
type PublicObservationRecord = (typeof publicRetailJson.observations)[number] & {
  selected_spec?: string;
  price_observed_at?: string;
  total_net_content_min_g?: number;
  total_net_content_max_g?: number;
  unit_price_per_100g_min_cny?: number;
  unit_price_per_100g_max_cny?: number;
};

const TABS: Tab[] = ["市场机会", "公开商品观察", "商品与价格", "货架与组合", "新品测试", "指标与模型", "产品方案"];
const COLORS = ["#2436a8", "#0aa59e", "#ef9c2c", "#6676c8", "#4eb7b0", "#9e78b5", "#63a56d"];

const TAB_LABEL_EN: Record<Tab, string> = {
  "市场机会": "Market opportunity",
  "公开商品观察": "Public product data",
  "商品与价格": "Product & price",
  "货架与组合": "Shelf & assortment",
  "新品测试": "Innovation testing",
  "指标与模型": "Metrics & models",
  "产品方案": "Product plan",
};

const CATEGORY_LABEL_EN: Record<string, string> = {
  puffed: "Puffed snacks", nuts: "Nuts & seeds", dried_fruit: "Dried fruit",
  biscuits: "Biscuits & bakery", meat_snacks: "Meat snacks",
  confectionery: "Confectionery", beverage: "Ready-to-drink beverages",
};

const CHANNEL_LABEL_EN: Record<string, string> = {
  ecommerce: "General e-commerce", instant: "On-demand retail", club: "Club retail",
  hypermarket: "Hypermarket", regional: "Regional supermarket",
  snack_chain: "Snack specialty chain", discount: "Discount retail",
};

const SEGMENT_LABEL_EN: Record<string, string> = {
  value_family: "Value-seeking families", urban_light: "Urban light consumers",
  novel_youth: "Novelty-seeking youth", ingredient_first: "Ingredient-first consumers",
  quality_gifting: "Premium gifting consumers",
};

const AUDIENCE_LABEL_EN: Record<AudienceMode, string> = {
  "成长品牌": "Growth brand", "渠道商": "Retailer", "大客户": "Enterprise client",
};

const MARKET_PROFILES: Array<{
  code: MarketCode;
  scope: MarketScope;
  zh: string;
  en: string;
  sample: number;
  opportunityShift: number;
  purchaseShift: number;
  calibration: string;
}> = [
  { code: "CN", scope: "china", zh: "中国", en: "China", sample: 8500, opportunityShift: 0, purchaseShift: 0, calibration: "国家统计局与中国公开渠道观察" },
  { code: "US", scope: "overseas", zh: "美国", en: "United States", sample: 2400, opportunityShift: 2.2, purchaseShift: 1.3, calibration: "待接入美国官方统计与当地零售数据" },
  { code: "UK", scope: "overseas", zh: "英国", en: "United Kingdom", sample: 1800, opportunityShift: 1.1, purchaseShift: .6, calibration: "待接入英国官方统计与当地零售数据" },
  { code: "DE", scope: "overseas", zh: "德国", en: "Germany", sample: 1800, opportunityShift: .5, purchaseShift: .2, calibration: "待接入德国官方统计与当地零售数据" },
  { code: "JP", scope: "overseas", zh: "日本", en: "Japan", sample: 1800, opportunityShift: -.6, purchaseShift: -.4, calibration: "待接入日本官方统计与当地零售数据" },
  { code: "ID", scope: "overseas", zh: "印度尼西亚", en: "Indonesia", sample: 2000, opportunityShift: 3.4, purchaseShift: 1.8, calibration: "待接入印尼官方统计与当地零售数据" },
  { code: "SA", scope: "overseas", zh: "沙特阿拉伯", en: "Saudi Arabia", sample: 1600, opportunityShift: 2.8, purchaseShift: 1.5, calibration: "待接入沙特官方统计与当地零售数据" },
  { code: "BR", scope: "overseas", zh: "巴西", en: "Brazil", sample: 2000, opportunityShift: 2.5, purchaseShift: 1.2, calibration: "待接入巴西官方统计与当地零售数据" },
];

const MARKET_REGIONS: Record<MarketCode, Array<{ zh: string; en: string; weight: number; shift: number }>> = {
  CN: [
    { zh: "华东", en: "East China", weight: .218, shift: 5.8 }, { zh: "华南", en: "South China", weight: .171, shift: 4.1 },
    { zh: "华北", en: "North China", weight: .159, shift: 2.0 }, { zh: "华中", en: "Central China", weight: .129, shift: .8 },
    { zh: "西南", en: "Southwest China", weight: .124, shift: -.4 }, { zh: "东北", en: "Northeast China", weight: .106, shift: -2.1 },
    { zh: "西北", en: "Northwest China", weight: .093, shift: -3.2 },
  ],
  US: [{ zh: "美国西部", en: "West", weight: .24, shift: 3.4 }, { zh: "美国东北部", en: "Northeast", weight: .18, shift: 2.1 }, { zh: "美国南部", en: "South", weight: .38, shift: 1.2 }, { zh: "美国中西部", en: "Midwest", weight: .20, shift: -.8 }],
  UK: [{ zh: "伦敦与东南", en: "London & South East", weight: .34, shift: 3.1 }, { zh: "英格兰北部", en: "North England", weight: .25, shift: .8 }, { zh: "英格兰中部", en: "Midlands", weight: .22, shift: .2 }, { zh: "苏格兰与威尔士", en: "Scotland & Wales", weight: .19, shift: -1.1 }],
  DE: [{ zh: "德国西部", en: "West", weight: .35, shift: 2.2 }, { zh: "德国南部", en: "South", weight: .29, shift: 1.6 }, { zh: "德国北部", en: "North", weight: .20, shift: .1 }, { zh: "德国东部", en: "East", weight: .16, shift: -1.2 }],
  JP: [{ zh: "关东", en: "Kanto", weight: .38, shift: 2.6 }, { zh: "关西", en: "Kansai", weight: .22, shift: 1.1 }, { zh: "中部", en: "Chubu", weight: .18, shift: .2 }, { zh: "九州", en: "Kyushu", weight: .12, shift: -.5 }, { zh: "北海道与东北", en: "Hokkaido & Tohoku", weight: .10, shift: -1.4 }],
  ID: [{ zh: "大雅加达", en: "Greater Jakarta", weight: .34, shift: 4.3 }, { zh: "爪哇其他地区", en: "Rest of Java", weight: .31, shift: 1.9 }, { zh: "苏门答腊", en: "Sumatra", weight: .17, shift: .8 }, { zh: "加里曼丹", en: "Kalimantan", weight: .09, shift: -.4 }, { zh: "苏拉威西及其他", en: "Sulawesi & other", weight: .09, shift: -1.1 }],
  SA: [{ zh: "利雅得", en: "Riyadh", weight: .31, shift: 3.8 }, { zh: "麦加省", en: "Makkah", weight: .29, shift: 2.1 }, { zh: "东部省", en: "Eastern Province", weight: .19, shift: 1.2 }, { zh: "麦地那及其他", en: "Madinah & other", weight: .21, shift: -.7 }],
  BR: [{ zh: "东南部", en: "Southeast", weight: .42, shift: 3.5 }, { zh: "南部", en: "South", weight: .16, shift: 1.7 }, { zh: "东北部", en: "Northeast", weight: .27, shift: .9 }, { zh: "中西部", en: "Central-West", weight: .09, shift: -.2 }, { zh: "北部", en: "North", weight: .06, shift: -1.3 }],
};

const MODEL_ROUTE_EN = [
  { question: "Which category, segment and region should be entered first?", primary: "Weighted cross-tabulation + hierarchical Bayesian trend model", inputs: "Representative consumer sample, penetration, frequency, occasion, geography and wave history", outputs: "Priority segments, opportunity interval, growth probability and sample gaps", validation: "Next-wave sample and public category calibration" },
  { question: "How should price, pack size and promotion be combined?", primary: "Discrete choice / Conjoint + Gabor-Granger", inputs: "Price, size, taste, ingredients, pack, channel and segment-level choice tasks", outputs: "Acceptance curve, attribute utility, share scenario and loss threshold", validation: "Time-based choice-task holdout + transaction calibration" },
  { question: "Which SKUs should a channel list, retain or remove?", primary: "Choice model + capacity-constrained assortment optimization", inputs: "Product pool, consumer choice, shelf capacity, margin and velocity targets", outputs: "Incremental reach, substitution source, portfolio coverage and SKU list", validation: "Simstore back-test + store velocity validation" },
  { question: "How should shelf and packaging improve choice?", primary: "Randomized shelf experiment + conditional logit", inputs: "Position, facings, adjacency, pack version, POS material and choice", outputs: "Visibility, recognition, persuasion, choice lift and winning design", validation: "Randomization check + in-store A/B" },
  { question: "Should the new product launch and does the product deliver the concept?", primary: "Concept-product joint prediction", inputs: "Concept, product experience, pack, price, trial, repeat and source of volume", outputs: "Stage gate, trial/repeat potential, incrementality and optimization actions", validation: "Post-launch sales, trial and repeat feedback" },
  { question: "Does listing or a shelf change create real incrementality?", primary: "Matched-store difference-in-differences / phased rollout", inputs: "Store-SKU-week sales, stock, margin, promotion, facings and intervention date", outputs: "Net lift, confidence interval, substitution effect and rollout decision", validation: "Pre-trend, placebo and replication across store groups" },
];

function tr(locale: Locale, zh: string, en: string) { return locale === "zh" ? zh : en; }

const categoryName = Object.fromEntries(foodJson.categories.map((item) => [item.code, item.name]));
const channelName = Object.fromEntries(foodJson.channels.map((item) => [item.code, item.name]));
const segmentName = Object.fromEntries(foodJson.segments.map((item) => [item.code, item.name]));

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function SimulationTag({ children = "模拟数据" }: { children?: React.ReactNode }) {
  return <span className="fnb-sim-tag">{children}</span>;
}

function downloadSkuCsv(rows: Sku[], channel: string, category: string) {
  const columns: Array<[string, keyof Sku]> = [
    ["SKU ID", "sku_id"], ["数据标签", "data_label"], ["渠道", "channel_name"], ["品类", "category_name"],
    ["商品", "product_name"], ["品牌层级", "brand_tier"], ["规格(g)", "pack_g"], ["标价", "list_price"],
    ["到手价", "promo_price"], ["每100g价格", "price_per_100g"], ["促销深度", "promo_depth"],
    ["增量触达指数", "incremental_reach_index"], ["替代风险指数", "substitution_risk_index"],
    ["组合分", "assortment_score"], ["建议动作", "assortment_action"],
  ];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = `\uFEFF${columns.map(([label]) => quote(label)).join(",")}\n${rows.map((row) => columns.map(([, key]) => quote(row[key])).join(",")).join("\n")}`;
  const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `包装食品饮料_${channel}_${category}_SKU结果.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fnb-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((item, index) => <span key={`${item.name}-${index}`}>{item.name}：{formatNumber(Number(item.value ?? 0), 1)}</span>)}
    </div>
  );
}

function Header({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  return (
    <>
      <header className="fnb-topbar">
        <div className="fnb-brandline"><PlatformBrand compact /><i /><div><b>{tr(locale, "益普索中国 · 包装食品与饮料", "Ipsos China · Packaged food & beverage")}</b><strong>{tr(locale, "行业数据与新品决策平台", "Industry data & innovation decision platform")}</strong></div></div>
        <nav><div className="fnb-language-switch" aria-label="Language"><span className="fnb-language-globe" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.7 12h16.6M12 3.5c2.4 2.3 3.5 5.1 3.5 8.5S14.4 18.2 12 20.5M12 3.5C9.6 5.8 8.5 8.6 8.5 12s1.1 6.2 3.5 8.5"/></svg></span><button type="button" className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")}>中</button><button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button></div><Link href="/retail">{tr(locale, "返回零售业", "Back to retail")}</Link></nav>
      </header>
      <section className="fnb-hero">
        <div>
          <p>PACKAGED FOOD &amp; BEVERAGE INTELLIGENCE</p>
          <h1>{tr(locale, "从市场信号，到价格、商品与增长决策", "From market signals to pricing, assortment and growth decisions")}</h1>
          <span>{tr(locale, "持续监测品类、消费者、商品与零售结果，把变化转化为可比较的情景和下一步行动。", "Continuously monitor categories, consumers, products and retail outcomes, then turn change into comparable scenarios and next actions.")}</span>
        </div>
        <aside>
          <b>{tr(locale, "当前可用证据", "Evidence available now")}</b>
          <strong>{foodJson.metric_dictionary.length} <em>{tr(locale, "项标准指标", "standard metrics")}</em></strong>
          <span>{tr(locale, `${publicRetailJson.meta.detail_price_captured_count}条公开详情价格 · ${authoritativePublicJson.metrics.length}项官方指标 · 6条模型路线`, `${publicRetailJson.meta.detail_price_captured_count} public detail prices · ${authoritativePublicJson.metrics.length} official indicators · 6 model routes`)}</span>
          <i>{tr(locale, "每个数值保留来源、口径、市场与状态", "Every value retains its source, definition, market and status")}</i>
        </aside>
      </section>
    </>
  );
}

function PublicRetailObservation() {
  const [observedCategory, setObservedCategory] = useState("全部品类");
  const [brand, setBrand] = useState("全部品牌");
  const [packageType, setPackageType] = useState("全部包装");
  const [showOnlyEligible, setShowOnlyEligible] = useState(false);
  const retailObservations = publicRetailJson.observations as PublicObservationRecord[];
  const observedCategories = ["全部品类", ...Array.from(new Set(retailObservations.map((item) => item.category)))];
  const categoryRows = retailObservations.filter((item) => observedCategory === "全部品类" || item.category === observedCategory);
  const brandProfile = Object.entries(categoryRows.reduce<Record<string, number>>((profile, item) => {
    profile[item.brand] = (profile[item.brand] ?? 0) + 1;
    return profile;
  }, {})).map(([name, observed_items]) => ({ name, observed_items })).sort((a, b) => b.observed_items - a.observed_items);
  const brands = ["全部品牌", ...brandProfile.map((item) => item.name)];
  const packageTypes = ["全部包装", ...Array.from(new Set(categoryRows.map((item) => item.package_type)))];
  const rows = categoryRows.filter((item) =>
    (brand === "全部品牌" || item.brand === brand) &&
    (packageType === "全部包装" || item.package_type === packageType) &&
    (!showOnlyEligible || item.price_cny != null)
  );
  const gateStatusClass = (status: string) => status === "通过" ? "pass" : status === "阻断" ? "blocked" : "caution";
  const pricedRows = categoryRows.filter((item) => item.price_cny != null);
  const priceScatterRows = pricedRows.map((item) => ({
    ...item,
    normalized_price: item.unit_price_per_100g_cny ?? ((item.unit_price_per_100g_min_cny ?? 0) + (item.unit_price_per_100g_max_cny ?? 0)) / 2,
    total_weight: item.total_net_content_g ?? ((item.total_net_content_min_g ?? 0) + (item.total_net_content_max_g ?? 0)) / 2,
    review_scale: Math.max(1, Math.log10((item.review_count_lower_bound ?? 0) + 10)),
  })).filter((item) => item.normalized_price > 0 && item.total_weight > 0);
  const exactUnitPrices = pricedRows.map((item) => item.unit_price_per_100g_cny).filter((value): value is number => value != null).sort((a, b) => a - b);
  const quantile = (values: number[], fraction: number) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0;
  const priceBands = observedCategories.slice(1).map((name) => {
    const values = retailObservations.filter((item) => item.category === name && item.unit_price_per_100g_cny != null).map((item) => item.unit_price_per_100g_cny as number).sort((a, b) => a - b);
    return { name, count: values.length, low: values[0] ?? 0, q1: quantile(values, .25), median: quantile(values, .5), q3: quantile(values, .75), high: values.at(-1) ?? 0 };
  }).filter((item) => item.count > 0);
  const highestMedianBand = [...priceBands].sort((a, b) => b.median - a.median)[0];
  const displayUnitPrice = (item: PublicObservationRecord) => item.unit_price_per_100g_cny != null
    ? `¥${formatNumber(item.unit_price_per_100g_cny, 2)}`
    : item.unit_price_per_100g_min_cny != null && item.unit_price_per_100g_max_cny != null
      ? `¥${formatNumber(item.unit_price_per_100g_min_cny, 2)}–${formatNumber(item.unit_price_per_100g_max_cny, 2)}`
      : "待采集";

  const [openScope, setOpenScope] = useState<"china" | "global">("china");
  const [openCountry, setOpenCountry] = useState("全部国家");
  const selectedOpenFoodJson = openScope === "china" ? chinaOpenFoodJson : openFoodJson;
  const openCountries = ["全部国家", ...Array.from(new Set(selectedOpenFoodJson.products.flatMap((item) => item.countries?.split(",").map((country) => country.trim()) ?? []).filter(Boolean))).sort()];
  const openAttributeRows = selectedOpenFoodJson.products.filter((item) =>
    (openCountry === "全部国家" || item.countries?.split(",").map((country) => country.trim()).includes(openCountry)) &&
    ["eligible_attribute_analysis", "eligible_nutrition_chart_with_gaps"].includes(item.quality_status)
  );
  const attributePoints = openAttributeRows.map((item) => ({
    name: item.product_name || item.barcode,
    barcode: item.barcode,
    countries: item.countries,
    quantity: item.quantity,
    energy_kcal: item.nutrition_per_100g.energy_kcal,
    sodium_mg: item.nutrition_per_100g.sodium_g == null ? null : Math.round(item.nutrition_per_100g.sodium_g * 1000),
    fat_g: item.nutrition_per_100g.fat_g,
    sugars_g: item.nutrition_per_100g.sugars_g,
  })).filter((item) => item.energy_kcal != null && item.sodium_mg != null && item.fat_g != null);
  const average = (key: "energy_kcal" | "sodium_mg" | "fat_g" | "sugars_g") => {
    const values = attributePoints.map((item) => item[key]).filter((value): value is number => value != null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };

  function downloadPublicObservationCsv() {
    const columns = ["observation_id", "retailer", "page_position", "brand", "product_title", "subcategory", "pack_expression", "package_type", "review_count_label", "price_cny", "unit_price_per_100g_cny", "price_status", "category_validation", "model_eligibility", "source_url", "retrieved_at"] as const;
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = `\uFEFF${columns.map(quote).join(",")}\n${rows.map((row) => columns.map((key) => quote(row[key])).join(",")).join("\n")}`;
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `包装食品饮料_公开商品观察_${observedCategory}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return <div className="fnb-tab-stack">
    <section className="fnb-section-intro">
      <div><span>PUBLIC RETAIL DATA</span><h2>{observedCategory === "全部品类" ? "零食商品与价格样本" : `${observedCategory}商品与价格样本`}</h2></div>
      <p>京东公开类目与详情页快照，商品、规格、价格、评价量级和来源可逐条复核。</p>
      <b className="fnb-observed-tag">19条详情价格 · 2026-08-12</b>
    </section>

    <section className="fnb-observation-summary">
      <article><span>公开商品观察</span><strong>{categoryRows.length}</strong><p>{observedCategory === "全部品类" ? "3个零食类目" : observedCategory}</p></article>
      <article><span>详情页价格</span><strong>{pricedRows.length}</strong><p>成功读取当前选中规格</p></article>
      <article><span>价格覆盖率</span><strong>{formatNumber(categoryRows.length ? pricedRows.length / categoryRows.length * 100 : 0, 1)}%</strong><p>{pricedRows.length}/{categoryRows.length}条</p></article>
      <article><span>每100g中位数</span><strong>¥{formatNumber(quantile(exactUnitPrices, .5), 2)}</strong><p>{exactUnitPrices.length}条精确规格</p></article>
      <article><span>来源记录</span><strong>{categoryRows.length}/{categoryRows.length}</strong><p>SKU · 规格 · 时间 · URL</p></article>
    </section>

    <section className="fnb-price-evidence-grid">
      <article className="fnb-panel fnb-price-scatter-panel">
        <header><div><span>PRICE × PACK × REVIEW</span><h3>规格与标准化价格</h3></div><b>{priceScatterRows.length}个价格点</b></header>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 24, bottom: 18, left: 4 }}>
              <CartesianGrid stroke="#e3e7ed" />
              <XAxis type="number" dataKey="total_weight" name="总净含量" unit="g" tick={{ fontSize: 9 }} label={{ value: "总净含量 g", position: "insideBottom", offset: -10, fontSize: 9 }} />
              <YAxis type="number" dataKey="normalized_price" name="每100g价格" unit="元" tick={{ fontSize: 9 }} label={{ value: "¥ / 100g", angle: -90, position: "insideLeft", fontSize: 9 }} />
              <ZAxis type="number" dataKey="review_scale" range={[70, 430]} name="评价量级" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                const point = payload?.[0]?.payload as (typeof priceScatterRows)[number] | undefined;
                if (!active || !point) return null;
                return <div className="fnb-tooltip"><strong>{point.product_title}</strong><span>{point.selected_spec}</span><span>页面价：¥{point.price_cny}</span><span>标准化：{displayUnitPrice(point)} / 100g</span><span>评价：{point.review_count_label}</span></div>;
              }} />
              {observedCategories.slice(1).map((name, index) => <Scatter key={name} name={name} data={priceScatterRows.filter((item) => item.category === name)} fill={COLORS[index]} />)}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="fnb-panel fnb-price-band-panel">
        <header><div><span>OBSERVED PRICE BAND</span><h3>各品类每100g价格带</h3></div><b>详情页样本</b></header>
        <div className="fnb-price-band-table"><div className="head"><span>品类</span><span>样本</span><span>最低</span><span>中位数</span><span>最高</span></div>{priceBands.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.count}</span><span>¥{formatNumber(item.low, 2)}</span><b>¥{formatNumber(item.median, 2)}</b><span>¥{formatNumber(item.high, 2)}</span></div>)}</div>
        <footer>{highestMedianBand ? `当前详情页样本中，${highestMedianBand.name}的每100g价格中位数最高（¥${formatNumber(highestMedianBand.median, 2)}）；该结论仅描述已采集样本。` : "当前筛选没有可标准化价格。"}</footer>
      </article>
    </section>

    <section className="fnb-panel fnb-public-table">
      <header><div><span>SKU EVIDENCE TABLE</span><h3>商品、规格与当前价格</h3></div><button type="button" onClick={downloadPublicObservationCsv}>导出当前筛选 CSV</button></header>
      <div className="fnb-public-filters">
        <label><span>品类</span><select value={observedCategory} onChange={(event) => { setObservedCategory(event.target.value); setBrand("全部品牌"); setPackageType("全部包装"); }}><option>全部品类</option>{observedCategories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>品牌</span><select value={brand} onChange={(event) => setBrand(event.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>包装形式</span><select value={packageType} onChange={(event) => setPackageType(event.target.value)}>{packageTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="check"><input type="checkbox" checked={showOnlyEligible} onChange={(event) => setShowOnlyEligible(event.target.checked)} /><span>仅看已取得详情价格</span></label>
        <strong>{rows.length}条</strong>
      </div>
      <div className="fnb-public-table-scroll">
        <div className="head"><span>品牌 / 位置</span><span>商品</span><span>当前规格</span><span>页面价</span><span>每100g</span><span>评价量级</span><span>归类</span><span>来源</span></div>
        {rows.map((item) => <article key={item.observation_id}>
          <span><b>{item.brand}</b><i>#{item.page_position} · {item.category}</i></span>
          <span><b>{item.product_title}</b><small>{item.subcategory}</small></span>
          <strong>{item.selected_spec ?? item.pack_expression}</strong>
          <strong>{item.price_cny != null ? `¥${formatNumber(item.price_cny, 2)}` : "待采集"}</strong>
          <em className={item.price_cny != null ? "captured" : ""}>{displayUnitPrice(item)}</em>
          <strong>{item.review_count_label}</strong>
          <span><b>{item.category_validation}</b><small>{item.price_cny != null ? "详情价已入库" : item.model_eligibility === "excluded_category_conflict" ? "排除" : "待详情"}</small></span>
          <a href={item.source_url} target="_blank" rel="noreferrer">详情页 ↗</a>
        </article>)}
      </div>
    </section>

    <details className="fnb-data-details">
      <summary><span>数据质量与来源</span><b>{publicRetailJson.quality_gates.filter((item) => item.status === "通过").length}项通过 · {publicRetailJson.quality_gates.filter((item) => item.status === "谨慎").length}项谨慎 · {publicRetailJson.quality_gates.filter((item) => item.status === "阻断").length}项待补</b></summary>
      <section className="fnb-panel fnb-quality-panel compact">
        <div>{publicRetailJson.quality_gates.map((item) => <section key={item.gate_id}><i className={gateStatusClass(item.status)}>{item.status}</i><span><b>{item.metric}</b><p>{item.implication}</p></span><strong>{item.value}</strong></section>)}</div>
      </section>
    </details>

    <details className="fnb-data-details">
      <summary><span>开放食品营养属性样本</span><b>{selectedOpenFoodJson.meta.sample_count}条条码记录</b></summary>
    <section className="fnb-panel fnb-open-attribute-panel">
      <header>
        <div><span>OPEN PRODUCT ATTRIBUTES</span><h3>开放食品属性样本</h3></div>
        <div className="fnb-open-attribute-filters">
          <label><span>开放样本</span><select value={openScope} onChange={(event) => { setOpenScope(event.target.value as "china" | "global"); setOpenCountry("全部国家"); }}><option value="china">中国相关零食</option><option value="global">全球 Lay&apos;s 对照</option></select></label>
          <label><span>国家</span><select value={openCountry} onChange={(event) => setOpenCountry(event.target.value)}>{openCountries.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </header>
      <div className="fnb-open-attribute-layout">
        <section className="fnb-open-attribute-chart">
          <div className="fnb-open-attribute-metrics">
            <article><span>公开样本</span><strong>{selectedOpenFoodJson.meta.sample_count}</strong><small>条码记录</small></article>
            <article><span>图中记录</span><strong>{attributePoints.length}</strong><small>能量、钠、脂肪完整</small></article>
            <article><span>平均能量</span><strong>{formatNumber(average("energy_kcal"), 0)}</strong><small>kcal / 100g</small></article>
            <article><span>平均钠</span><strong>{formatNumber(average("sodium_mg"), 0)}</strong><small>mg / 100g</small></article>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 4, right: 18, top: 18, bottom: 8 }}>
                <CartesianGrid stroke="#e4e8ee" />
                <XAxis type="number" dataKey="sodium_mg" name="钠" unit="mg" tick={{ fontSize: 9 }} label={{ value: "钠 mg / 100g", position: "insideBottom", offset: -3, fontSize: 9 }} />
                <YAxis type="number" dataKey="energy_kcal" name="能量" unit="kcal" width={48} tick={{ fontSize: 9 }} label={{ value: "kcal / 100g", angle: -90, position: "insideLeft", fontSize: 9 }} />
                <ZAxis type="number" dataKey="fat_g" range={[55, 360]} name="脂肪" unit="g" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as (typeof attributePoints)[number] | undefined;
                  if (!active || !point) return null;
                  return <div className="fnb-tooltip"><strong>{point.name}</strong><span>条码：{point.barcode}</span><span>能量：{point.energy_kcal} kcal / 100g</span><span>钠：{point.sodium_mg} mg / 100g</span><span>脂肪：{point.fat_g} g / 100g</span><span>糖：{point.sugars_g} g / 100g</span></div>;
                }} />
                <Scatter data={attributePoints} fill="#169f98" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p>横轴为钠、纵轴为能量，气泡大小代表脂肪含量；用于检验营养属性字段与多变量比较界面。</p>
        </section>
        <section className="fnb-open-attribute-table">
          <div className="head"><span>条码 / 商品</span><span>规格与国家</span><span>每100g营养</span></div>
          {attributePoints.slice(0, 8).map((item) => <article key={item.barcode}>
            <span><b>{item.name}</b><small>{item.barcode}</small></span>
            <span><b>{item.quantity || "未登记规格"}</b><small>{item.countries || "未登记国家"}</small></span>
            <span><b>{item.energy_kcal} kcal · 钠{item.sodium_mg} mg</b><small>脂肪{item.fat_g}g · 糖{item.sugars_g}g</small></span>
          </article>)}
        </section>
      </div>
      <footer><b>{selectedOpenFoodJson.meta.data_status} · Open Food Facts</b><span>{selectedOpenFoodJson.meta.blocked_use}</span><a href={selectedOpenFoodJson.meta.source_url} target="_blank" rel="noreferrer">查看数据源 ↗</a></footer>
    </section>
    </details>

    <details className="fnb-data-details">
      <summary><span>字段标准与数据接入</span><b>商品 · 属性 · 交易结果</b></summary>
    <section className="fnb-layer-panel fnb-observation-schema">
      <header><span>OBSERVATION DATA SCHEMA</span><h3>从页面商品观察走向可训练数据，还要补什么</h3></header>
      <div>{publicRetailJson.attribute_standard_registry.map((item) => {
        const source = publicRetailJson.source_registry.find((sourceItem) => sourceItem.source_id === item.source_id);
        return <article key={item.field_group}><b>{item.field_group}</b><p>{item.fields.join("、")}</p><small>{item.current_pilot_coverage}</small>{source && <a href={source.url} target="_blank" rel="noreferrer">{source.publisher} ↗</a>}</article>;
      })}<article><b>交易与货架结果</b><p>同一SKU、渠道、门店、周、标价、到手价、促销、铺货、缺货、排面、销量、销售额与毛利。</p><small>当前公开页面未取得；没有结果标签时，不训练真实上架增量与价格弹性。</small></article></div>
    </section>
    </details>
  </div>;
}

function MarketOpportunity({ category, channel, segment, audience }: { category: string; channel: string; segment: string; audience: AudienceMode }) {
  const selectedCategory = foodJson.categories.find((item) => item.code === category)!;
  const selectedChannel = foodJson.channels.find((item) => item.code === channel)!;
  const selectedSegment = foodJson.segments.find((item) => item.code === segment)!;
  const opportunity = foodJson.opportunity_heatmap.find((item) => item.category === category && item.segment === segment)!;
  const scenario = foodJson.scenarios.find((item) => item.category === category && item.channel === channel && item.segment === segment)!;
  const channelProfile = foodJson.channel_profiles.find((item) => item.channel === channel);
  const shelfShare = foodJson.shelf_mix.find((item) => item.channel === channel && item.category === category)?.recommended_facing_share ?? 0;
  const filteredSkus = foodJson.skus
    .filter((item) => item.category === category && item.channel === channel)
    .sort((a, b) => b.assortment_score - a.assortment_score);
  const topSku = filteredSkus[0];
  const prioritySkus = filteredSkus.filter((item) => item.assortment_action === "优先引入");
  const sortedPrices = filteredSkus.map((item) => item.price_per_100g).sort((a, b) => a - b);
  const q1Price = sortedPrices[Math.floor(sortedPrices.length * .25)] ?? 0;
  const q3Price = sortedPrices[Math.floor(sortedPrices.length * .75)] ?? 0;
  const averageIncrementalReach = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.incremental_reach_index, 0) / filteredSkus.length : 0;
  const averageSubstitutionRisk = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.substitution_risk_index, 0) / filteredSkus.length : 0;
  const decisionScatterRows = filteredSkus.slice(0, 40).map((item) => ({
    ...item,
    x: item.substitution_risk_index,
    y: item.incremental_reach_index,
    z: item.assortment_score,
  }));
  const incrementalCandidates = decisionScatterRows
    .filter((item) => item.incremental_reach_index >= averageIncrementalReach && item.substitution_risk_index <= averageSubstitutionRisk)
    .sort((a, b) => b.assortment_score - a.assortment_score);
  const priceResponseData = Array.from(new Set(foodJson.price_curves.map((item) => item.price_index))).sort((a, b) => a - b).map((priceIndex) => ({
    price_index: priceIndex,
    ...Object.fromEntries(foodJson.segments.map((item) => [item.code, foodJson.price_curves.find((curve) => curve.segment === item.code && curve.price_index === priceIndex)?.purchase_probability ?? 0])),
  }));
  const selectedPriceCurve = foodJson.price_curves.filter((item) => item.segment === segment);
  const purchaseAt85 = selectedPriceCurve.find((item) => item.price_index === 85)?.purchase_probability ?? 0;
  const purchaseAt115 = selectedPriceCurve.find((item) => item.price_index === 115)?.purchase_probability ?? 0;
  const priceImpact = Math.max(0, purchaseAt85 - purchaseAt115);
  const roleDecision: Record<AudienceMode, { title: string; description: string; firstDecision: string }> = {
    "成长品牌": {
      title: `${selectedCategory.name}进入${selectedChannel.name}，先证明目标人群与价格带，再向渠道证明上架价值`,
      description: `当前模拟结果显示，${selectedSegment.name}的品类机会指数为${opportunity.opportunity_score}，建议先用候选SKU和价格情景完成小规模验证，再形成渠道证据页。`,
      firstDecision: "产品定义与渠道提案",
    },
    "渠道商": {
      title: `${selectedChannel.name}的${selectedCategory.name}，优先补充增量触达高且内部替代风险可控的SKU`,
      description: `当前组合面向${selectedSegment.name}；筛选后的${filteredSkus.length}个模拟SKU中有${prioritySkus.length}个优先引入候选，建议结合排面约束和真实周转结果继续验证。`,
      firstDecision: "引入、保留与排面分配",
    },
    "大客户": {
      title: `${selectedCategory.name}需要把人群、价格、${selectedChannel.name}货架表现与上市结果连接起来`,
      description: `当前组合为${selectedSegment.name} × ${selectedChannel.name}，模型给出${scenario.predicted_purchase}%的模拟购买概率；下一步应以真实概念、产品与门店结果校准。`,
      firstDecision: "新品全链路验证",
    },
  };
  const selectedRole = roleDecision[audience];

  return <div className="fnb-tab-stack">
    <section className="fnb-decision-hero" key={`${audience}-${category}-${channel}-${segment}`}>
      <div>
        <span>市场判断 · {selectedRole.firstDecision}</span>
        <h2>{selectedRole.title}</h2>
        <p>{selectedRole.description}</p>
      </div>
      <dl>
        <div><dt>核心证据</dt><dd>机会指数 {opportunity.opportunity_score} · 购买概率 {scenario.predicted_purchase}%</dd></div>
        <div><dt>模型组合</dt><dd>机会评分 · 选择模型 · 组合优化</dd></div>
        <div><dt>下一步验证</dt><dd>{channelProfile?.required_partner_fields ?? "一手调研 + 真实结果回流"}</dd></div>
      </dl>
    </section>

    <section className="fnb-kpi-strip">
      <article><span>{selectedCategory.name} × {selectedSegment.name}</span><strong>{opportunity.opportunity_score}</strong><b>品类—人群机会指数</b><small>模拟消费者研究 · 需求 × 人群适配</small></article>
      <article><span>{selectedChannel.name} · 选择任务</span><strong>{scenario.predicted_purchase}%</strong><b>当前组合购买概率</b><small>模拟样本格 N={scenario.n}</small></article>
      <article><span>{selectedChannel.name} · 每100g</span><strong>¥{q1Price}–{q3Price}</strong><b>候选SKU中间50%价格带</b><small>模拟SKU池 N={filteredSkus.length}</small></article>
      <article><span>{selectedCategory.name} · 100个排面</span><strong>{shelfShare}</strong><b>建议排面数量</b><small>容量约束情景</small></article>
      <article><span>{selectedChannel.name} · 当前候选池</span><strong>{prioritySkus.length}</strong><b>优先引入候选</b><small>组合优化结果</small></article>
    </section>

    <section className="fnb-model-output-grid">
      <article className="fnb-panel fnb-chart-panel tall">
        <header><div><span>MULTI-SEGMENT PRICE RESPONSE</span><h3>不同人群在同一价格情景下的购买概率</h3></div><b>{selectedSegment.name}已高亮</b></header>
        <div className="fnb-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceResponseData} margin={{ top: 20, right: 24, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e8ee" vertical={false} />
              <XAxis dataKey="price_index" tick={{ fontSize: 9 }} label={{ value: "相对价格指数", position: "insideBottom", offset: -12, fontSize: 9 }} />
              <YAxis domain={[0, 70]} unit="%" tick={{ fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine x={100} stroke="#79849a" strokeDasharray="4 4" />
              {foodJson.segments.map((item, index) => <Line key={item.code} type="monotone" dataKey={item.code} name={item.name} stroke={COLORS[index]} strokeWidth={item.code === segment ? 4 : 1.5} opacity={item.code === segment ? 1 : .5} dot={item.code === segment ? { r: 3 } : false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <footer>{selectedSegment.name}的相对价格指数由85升至115时，模型购买概率下降{priceImpact.toFixed(1)}个百分点；其余变量保持不变。</footer>
      </article>

      <article className="fnb-panel fnb-chart-panel tall">
        <header><div><span>INCREMENTAL REACH × SUBSTITUTION RISK</span><h3>{selectedChannel.name}候选SKU的增量与替代</h3></div><b>{decisionScatterRows.length}个候选</b></header>
        <div className="fnb-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e8ee" />
              <XAxis type="number" dataKey="x" name="替代风险" domain={[0, 100]} tick={{ fontSize: 9 }} label={{ value: "内部替代风险 →", position: "insideBottom", offset: -12, fontSize: 9 }} />
              <YAxis type="number" dataKey="y" name="增量触达" domain={[0, 100]} tick={{ fontSize: 9 }} label={{ value: "增量触达", angle: -90, position: "insideLeft", fontSize: 9 }} />
              <ZAxis type="number" dataKey="z" range={[70, 520]} name="组合分" />
              <ReferenceLine x={averageSubstitutionRisk} stroke="#ef9c2c" strokeDasharray="4 4" />
              <ReferenceLine y={averageIncrementalReach} stroke="#0aa59e" strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: "4 4" }} content={({ active, payload }) => {
                const point = payload?.[0]?.payload as (typeof decisionScatterRows)[number] | undefined;
                if (!active || !point) return null;
                return <div className="fnb-tooltip"><strong>{point.product_name}</strong><span>增量触达：{point.incremental_reach_index}</span><span>替代风险：{point.substitution_risk_index}</span><span>组合分：{point.assortment_score}</span><span>建议：{point.assortment_action}</span></div>;
              }} />
              <Scatter data={decisionScatterRows} fill="#2639a5" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <footer>优先观察右上以外的“高增量、低替代”区域；当前共有{incrementalCandidates.length}个候选满足双重条件。</footer>
      </article>
    </section>

    <section className="fnb-panel fnb-opportunity-panel fnb-decision-output">
      <header><div><span>NEXT VALIDATION</span><h3>{audience}下一轮验证与动作</h3></div><SimulationTag /></header>
      <div className="fnb-question-list">
        <section><b>01</b><div><strong>验证当前品类—人群组合</strong><p>围绕{selectedSegment.name}完成需求、购买频次与选择任务，复核机会指数{opportunity.opportunity_score}和购买概率{scenario.predicted_purchase}%。</p></div></section>
        <section><b>02</b><div><strong>联合测试SKU、价格与排面</strong><p>{incrementalCandidates[0] ? `首测${incrementalCandidates[0].product_name}` : topSku ? `首测${topSku.product_name}` : "补充候选SKU"}；价格覆盖每100g ¥{q1Price}–{q3Price}，货架情景配置{shelfShare}个排面。</p></div></section>
        <section><b>03</b><div><strong>回收经营结果并重训</strong><p>{channelProfile?.required_partner_fields ?? "门店 × SKU × 周的销量、销售额、毛利、促销与缺货结果"}；用于重估增量触达和内部替代。</p></div></section>
      </div>
    </section>

    <details className="fnb-data-details">
      <summary><span>官方校准数据</span><b>{authoritativePublicJson.sources.length}个来源 · {authoritativePublicJson.metrics.length}项指标 · {authoritativePublicJson.standards.length}项标准</b></summary>
      <section className="fnb-panel fnb-benchmark-panel">
        <div className="fnb-benchmark-rows">
          <div className="head"><span>指标</span><span>最新值</span><span>如何使用</span></div>
          {foodJson.external_benchmarks.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.metric}><span><b>{item.metric}</b><small>{item.period}</small></span><strong>{item.value}</strong><p>{item.context}</p></a>)}
        </div>
      </section>
    </details>

  </div>;
}

function ProductAndPrice({ category, channel, segment }: { category: string; channel: string; segment: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("当前品类");
  const categoryRows = useMemo(() => foodJson.skus.filter((item) => item.category === category && item.channel === channel), [category, channel]);
  const channelRows = useMemo(() => foodJson.skus.filter((item) => item.channel === channel), [channel]);
  const fallback = categoryRows.length ? categoryRows : foodJson.skus.filter((item) => item.category === category).slice(0, 18);
  const scatterData = fallback.map((item) => ({ ...item, x: item.price_per_100g, y: item.assortment_score, z: item.review_volume_index }));
  const priceCurve = foodJson.price_curves.filter((item) => item.segment === segment);
  const sorted = (viewMode === "渠道TOP100" ? channelRows : fallback).slice(0, viewMode === "渠道TOP100" ? 100 : 20);
  const median = [...fallback].sort((a, b) => a.price_per_100g - b.price_per_100g)[Math.floor(fallback.length / 2)]?.price_per_100g ?? 0;
  const q1 = [...fallback].sort((a, b) => a.price_per_100g - b.price_per_100g)[Math.floor(fallback.length * .25)]?.price_per_100g ?? 0;
  const q3 = [...fallback].sort((a, b) => a.price_per_100g - b.price_per_100g)[Math.floor(fallback.length * .75)]?.price_per_100g ?? 0;
  const highPotential = sorted.filter((item) => item.assortment_action === "优先引入").length;
  const top20Count = Math.max(1, Math.ceil(channelRows.length * .20));
  const top20Brands = new Set(channelRows.slice(0, top20Count).map((item) => item.brand_name)).size;

  return <div className="fnb-tab-stack">
    <section className="fnb-section-intro"><div><span>SKU × PRICE × CHANNEL</span><h2>商品与价格架构</h2></div><p>筛选结果来自模拟SKU池；真实版将按渠道、地区、日期和页面位置记录公开可见信息。</p><SimulationTag /></section>
    <section className="fnb-decision-strip">
      <article><span>当前渠道商品池</span><strong>{channelRows.length}</strong><p>每个渠道均生成120个模拟SKU，可完整展示TOP100工作流。</p></article>
      <article><span>当前品类价格带</span><strong>¥{q1}–{q3}</strong><p>按每100g价格的中间50%模拟范围，避免用单一均值误导。</p></article>
      <article><span>优先引入候选</span><strong>{highPotential}</strong><p>组合分与增量触达同时达标，仍需真实销售结果验证。</p></article>
      <article><span>TOP20%品牌覆盖</span><strong>{top20Brands}</strong><p>模拟品牌数，不代表任何真实品牌份额或排名。</p></article>
    </section>
    <section className="fnb-grid two">
      <article className="fnb-panel fnb-chart-panel tall">
        <header><div><span>PRICE / VALUE MAP</span><h3>{categoryName[category]}：价格—组合价值</h3></div><b>{channelName[channel]}</b></header>
        <div className="fnb-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 24, bottom: 20, left: 2 }}>
              <CartesianGrid stroke="#e5e8ee" />
              <XAxis type="number" dataKey="x" name="每100g价格" unit="元" tick={{ fontSize: 9 }} />
              <YAxis type="number" dataKey="y" name="商品组合分" domain={[35, 90]} tick={{ fontSize: 9 }} />
              <ZAxis type="number" dataKey="z" range={[55, 520]} name="评价量指数" />
              <ReferenceLine x={median} stroke="#ef9c2c" strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltip />} />
              <Scatter data={scatterData} fill="#2436a8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <footer>气泡大小为模拟评价量指数；橙色虚线为当前筛选SKU的每100g价格中位数。</footer>
      </article>
      <article className="fnb-panel fnb-chart-panel tall">
        <header><div><span>PRICE RESPONSE</span><h3>{segmentName[segment]}的价格响应</h3></div><b>逻辑回归情景</b></header>
        <div className="fnb-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceCurve} margin={{ top: 18, right: 22, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e8ee" vertical={false} />
              <XAxis dataKey="price_index" unit="" tick={{ fontSize: 9 }} label={{ value: "相对价格指数", position: "insideBottom", offset: -12, fontSize: 9 }} />
              <YAxis domain={[0, 70]} unit="%" tick={{ fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine x={100} stroke="#79849a" />
              <Line type="monotone" dataKey="purchase_probability" name="购买概率" stroke="#0aa59e" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <footer>只用于演示价格与人群敏感度如何联动；不是实际销量弹性。</footer>
      </article>
    </section>
    <section className="fnb-panel fnb-table-panel">
      <header><div><span>SKU SHORTLIST</span><h3>{viewMode === "渠道TOP100" ? `${channelName[channel]} TOP100商品池` : `${categoryName[category]}候选商品`}</h3></div><div className="fnb-view-actions"><div className="fnb-view-toggle"><button className={viewMode === "当前品类" ? "active" : ""} onClick={() => setViewMode("当前品类")}>当前品类</button><button className={viewMode === "渠道TOP100" ? "active" : ""} onClick={() => setViewMode("渠道TOP100")}>渠道TOP100</button></div><button className="fnb-export-button" type="button" onClick={() => downloadSkuCsv(sorted, channelName[channel], categoryName[category])}>下载当前CSV</button></div></header>
      <div className="fnb-sku-table expanded"><div className="head"><span>排名 / 商品</span><span>品牌层级</span><span>规格</span><span>到手价</span><span>每100g</span><span>增量触达</span><span>替代风险</span><span>决策</span><span>组合分</span></div>{sorted.map((item, index) => <div key={item.sku_id}><span><b>#{viewMode === "渠道TOP100" ? item.channel_rank : index + 1} · {item.product_name}</b><small>{item.sku_id} · {item.data_label}</small></span><span>{item.brand_tier}</span><span>{item.pack_g}g</span><span>¥{item.promo_price}</span><span>¥{item.price_per_100g}</span><span>{item.incremental_reach_index}</span><span>{item.substitution_risk_index}</span><span className={`action ${item.assortment_action === "优先引入" ? "go" : ""}`}>{item.assortment_action}</span><span><b>{item.assortment_score}</b></span></div>)}</div>
      <footer>排序依据为模拟组合分，不是销量榜。真实版需接入授权交易/POS、缺货、铺货、促销与门店数据后重新计算。</footer>
    </section>
  </div>;
}

function Assortment({ channel, segment }: { channel: string; segment: string }) {
  const mix = foodJson.shelf_mix.filter((item) => item.channel === channel).sort((a, b) => b.recommended_facing_share - a.recommended_facing_share);
  const heatmap = foodJson.opportunity_heatmap;
  const top20 = foodJson.skus.slice(0, foodJson.pareto.top_count);
  const topMix = Object.entries(top20.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + 1 }), {})).map(([code, count]) => ({ name: categoryName[code], count }));

  return <div className="fnb-tab-stack">
    <section className="fnb-section-intro"><div><span>ASSORTMENT DECISION</span><h2>货架与商品组合</h2></div><p>不是按单一销量排序，而是在容量约束下平衡周转、毛利、复购、可见度、可得性与创新。</p><SimulationTag /></section>
    <section className="fnb-grid shelf">
      <article className="fnb-panel fnb-shelf-panel">
        <header><div><span>RECOMMENDED MIX</span><h3>{channelName[channel]}的货架份额</h3></div><b>100个排面</b></header>
        <div className="fnb-shelf">
          {mix.map((item, index) => <div key={item.category} style={{ width: `${Math.max(item.recommended_facing_share, 8)}%` }}><i style={{ background: COLORS[index] }} /><strong>{categoryName[item.category]}</strong><span>{item.recommended_facing_share}</span><small>个排面</small></div>)}
        </div>
        <footer>权重演示：周转26% · 毛利20% · 复购18% · 可见度14% · 可得性12% · 新颖性10%。真实部署需由渠道目标和POS结果重新训练。</footer>
      </article>
      <article className="fnb-panel fnb-pareto-panel">
        <header><div><span>PORTFOLIO CONCENTRATION</span><h3>高价值商品组合</h3></div><b>TOP 20%</b></header>
        <strong>{foodJson.pareto.top_share_of_assortment_score}%</strong><p>模拟SKU池前20%的组合分占比</p>
        <div>{topMix.map((item, index) => <span key={item.name}><i style={{ width: `${item.count / foodJson.pareto.top_count * 100}%`, background: COLORS[index % COLORS.length] }} /><b>{item.name}</b><em>{item.count}</em></span>)}</div>
      </article>
    </section>
    <section className="fnb-panel fnb-heat-panel">
      <header><div><span>CATEGORY × SEGMENT</span><h3>品类—人群机会矩阵</h3></div><b>{segmentName[segment]}</b></header>
      <div className="fnb-heatmap">
        <div className="head"><span>人群</span>{foodJson.categories.map((item) => <b key={item.code}>{item.name}</b>)}</div>
        {foodJson.segments.map((segmentItem) => <div className={segmentItem.code === segment ? "active" : ""} key={segmentItem.code}><strong>{segmentItem.name}</strong>{foodJson.categories.map((categoryItem) => { const cell = heatmap.find((item) => item.segment === segmentItem.code && item.category === categoryItem.code); const value = cell?.opportunity_score ?? 0; return <span key={categoryItem.code} style={{ background: `rgba(10,165,158,${0.08 + value / 125})` }}><b>{value}</b></span>; })}</div>)}
      </div>
    </section>
  </div>;
}

function InnovationModel({ category, channel, segment }: { category: string; channel: string; segment: string }) {
  const model = foodJson.model;
  const coefficients = model.coefficients.filter((item) => item.source !== "model");
  const scenario = foodJson.scenarios.find((item) => item.category === category && item.channel === channel && item.segment === segment);
  const [priceIndex, setPriceIndex] = useState(100);
  const [taste, setTaste] = useState(72);
  const [pack, setPack] = useState(68);
  const [health, setHealth] = useState(65);
  const [trust, setTrust] = useState(68);
  const [visibility, setVisibility] = useState(75);
  const [promo, setPromo] = useState(10);
  const [novelty, setNovelty] = useState(60);
  const base = scenario?.predicted_purchase ?? 35;
  const prediction = Math.max(4, Math.min(88,
    base - (priceIndex - 100) * 0.29 + (promo - 10) * 0.06 + (taste - 72) * .19 + (pack - 68) * .14 +
    (health - 65) * .14 + (trust - 68) * .17 + (visibility - 75) * .13 + (novelty - 60) * .10
  ));
  const recommendation = prediction >= 48 ? "进入产品与货架验证" : prediction >= 35 ? "优化后再测" : "暂缓进入下一阶段";
  const lower = Math.max(0, prediction - 4.8);
  const upper = Math.min(100, prediction + 4.8);
  const scenarioRows = [
    { name: "当前方案", value: prediction, note: `相对价格${priceIndex}% · 促销${promo}%` },
    { name: "价格下调5%", value: Math.min(92, prediction + 5 * .29), note: "只改变相对价格" },
    { name: "货架可见度+10", value: Math.min(92, prediction + 10 * .13), note: "只改变货架可见度" },
    { name: "口味匹配+10", value: Math.min(92, prediction + 10 * .19), note: "只改变口味匹配" },
  ];
  const bestScenario = [...scenarioRows].sort((a, b) => b.value - a.value)[0];

  return <div className="fnb-tab-stack">
    <section className="fnb-model-banner">
      <div><span>MODEL ANSWER</span><h2>{recommendation}</h2><p>{categoryName[category]} × {channelName[channel]} × {segmentName[segment]}：当前情景购买概率 {formatNumber(prediction, 1)}%，模拟预测区间 {formatNumber(lower, 1)}%–{formatNumber(upper, 1)}%。</p></div>
      <strong>{formatNumber(prediction, 1)}<em>%</em></strong><SimulationTag>模拟模型结果</SimulationTag>
    </section>
    <section className="fnb-scenario-output">
      <article className="answer"><span>模型带来的决策</span><h3>{bestScenario.name}是当前单变量优化中提升最大的方案</h3><p>预计购买概率 {formatNumber(bestScenario.value, 1)}%，较当前 {bestScenario.value - prediction >= 0 ? "+" : ""}{formatNumber(bestScenario.value - prediction, 1)} pts。用于确定下一轮概念/货架测试优先级，不等同于销量承诺。</p></article>
      <div>{scenarioRows.map((item) => <article key={item.name}><span>{item.name}</span><strong>{formatNumber(item.value, 1)}%</strong><i><b style={{ width: `${item.value}%` }} /></i><p>{item.note}</p></article>)}</div>
    </section>
    <section className="fnb-model-workbench">
      <aside>
        <header><span>SCENARIO INPUTS</span><h3>新品方案</h3></header>
        {[
          ["相对价格", priceIndex, setPriceIndex, 75, 135, "%"], ["促销深度", promo, setPromo, 0, 30, "%"],
          ["口味匹配", taste, setTaste, 40, 95, ""], ["包装吸引力", pack, setPack, 40, 95, ""],
          ["健康/成分匹配", health, setHealth, 35, 95, ""], ["品牌信任", trust, setTrust, 35, 95, ""],
          ["货架可见度", visibility, setVisibility, 35, 100, ""], ["新奇偏好匹配", novelty, setNovelty, 30, 95, ""],
        ].map(([label, value, setter, min, max, unit]) => <label key={String(label)}><span>{label}<b>{Number(value)}{unit}</b></span><input type="range" min={Number(min)} max={Number(max)} value={Number(value)} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(event.target.value))} /></label>)}
      </aside>
      <main>
        <header><div><span>ADJUSTED DRIVERS</span><h3>哪些变量改变购买选择</h3></div><dl><div><dt>训练</dt><dd>N={formatNumber(model.train_n, 0)}</dd></div><div><dt>时间留出</dt><dd>N={formatNumber(model.test_n, 0)}</dd></div><div><dt>AUC</dt><dd>{model.test_auc}</dd></div><div><dt>Brier</dt><dd>{model.test_brier}</dd></div></dl></header>
        <div className="fnb-coefficients"><div className="head"><span>变量</span><span>95%区间与系数</span><b>情景影响</b></div>{coefficients.map((item: ModelCoefficient) => { const min = -2.2; const max = 2.2; const left = ((item.coefficient - min) / (max - min)) * 100; const ciLeft = ((item.ci_low - min) / (max - min)) * 100; const ciWidth = ((item.ci_high - item.ci_low) / (max - min)) * 100; return <div className="row" key={item.source}><span><b>{item.label}</b><small>OR {item.odds_ratio}</small></span><i><u /><em style={{ left: `${ciLeft}%`, width: `${ciWidth}%` }} /><b style={{ left: `${left}%` }} /></i><strong className={item.impact_pp >= 0 ? "up" : "down"}>{item.impact_pp > 0 ? "+" : ""}{item.impact_pp} pts</strong></div>; })}</div>
        <footer><span>{model.target}</span><b>允许：{model.allowed_use}</b><em>限制：{model.blocked_use}</em></footer>
      </main>
    </section>
    <section className="fnb-stage-gates">
      <article><b>01</b><h3>概念与需求</h3><p>选择任务、MaxDiff/Conjoint、购买理由与替代来源。</p><strong>输出：试购潜力与目标人群</strong></article>
      <article><b>02</b><h3>产品与包装</h3><p>盲测/明测、口味与感官、包装识别、虚拟货架。</p><strong>输出：配方与包装优化方向</strong></article>
      <article><b>03</b><h3>价格与渠道</h3><p>价格接受、促销、规格组合、渠道选择与货架方案。</p><strong>输出：价格—规格—渠道组合</strong></article>
      <article><b>04</b><h3>真实增量</h3><p>匹配门店、分阶段上架或对照实验，回收周销售结果。</p><strong>输出：增量、替代与扩店决策</strong></article>
    </section>
  </div>;
}

const CHANNEL_MODEL_SHIFT: Record<string, number> = {
  ecommerce: 2.4, instant: 2.0, club: 1.6, hypermarket: -.3, regional: .5, snack_chain: 2.8, discount: 1.2,
};

const QUESTION_MODULES = [
  { id: "Q-CAT", zh: "品类购买与频次", en: "Category purchase & frequency", table: "fact_consumer_wave", keys: "wave · market · respondent · category", families: ["市场与品类"] },
  { id: "Q-OCC", zh: "场景与未满足需求", en: "Occasion & unmet needs", table: "fact_consumer_need", keys: "wave · market · respondent · occasion", families: ["消费者需求"] },
  { id: "Q-ATTR", zh: "口味、成分与包装偏好", en: "Taste, ingredient & pack preference", table: "fact_attribute_preference", keys: "wave · market · respondent · attribute", families: ["消费者需求"] },
  { id: "Q-CHOICE", zh: "产品、价格与品牌选择任务", en: "Product, price & brand choice task", table: "fact_choice_task", keys: "task · respondent · alternative", families: ["价格", "货架与组合"] },
  { id: "Q-SHELF", zh: "货架与包装曝光实验", en: "Shelf & packaging experiment", table: "fact_shelf_experiment", keys: "cell · respondent · sku · choice", families: ["货架与组合"] },
  { id: "Q-CPT", zh: "概念—产品使用与复购", en: "Concept-product use & repeat", table: "fact_concept_product", keys: "concept · product · respondent · stage", families: ["新品"] },
  { id: "E-COM", zh: "公开/授权商品观察", en: "Public / authorized product observation", table: "fact_product_observation", keys: "market · channel · sku · date", families: ["商品观察"] },
  { id: "POS-WEEK", zh: "门店SKU周度经营结果", en: "Store-SKU weekly outcome", table: "fact_store_sku_week", keys: "market · store · sku · week", families: ["真实结果"] },
];

const ROUTE_FAMILIES: Record<number, string[]> = {
  0: ["市场与品类", "消费者需求", "商品观察"],
  1: ["价格", "消费者需求", "商品观察"],
  2: ["货架与组合", "商品观察", "真实结果"],
  3: ["货架与组合", "消费者需求", "真实结果"],
  4: ["新品", "消费者需求", "价格", "真实结果"],
  5: ["真实结果", "货架与组合", "商品观察"],
};

const ROUTE_RESULT_LABELS = [
  ["下一期品类渗透率", "下一期人群机会分"],
  ["选择任务结果", "上市后成交率"],
  ["门店SKU周转", "品类增量覆盖"],
  ["货架选择", "门店A/B销售增量"],
  ["上市12个月结果", "实际试购与复购"],
  ["门店SKU周销量", "替代与净增量"],
];

const SEGMENT_FACTOR_PROFILES: Record<string, { price: number; taste: number; health: number; trust: number; novelty: number }> = {
  value_family: { price: 92, taste: 68, health: 46, trust: 61, novelty: 39 },
  urban_light: { price: 64, taste: 74, health: 83, trust: 72, novelty: 58 },
  novel_youth: { price: 59, taste: 88, health: 52, trust: 56, novelty: 94 },
  ingredient_first: { price: 55, taste: 71, health: 96, trust: 84, novelty: 44 },
  quality_gifting: { price: 43, taste: 79, health: 67, trust: 91, novelty: 62 },
};

const COEFFICIENT_LABEL_EN: Record<string, string> = {
  model: "Intercept", price_index: "Relative price index", promo_depth: "Promotion depth",
  taste_fit: "Taste fit", pack_appeal: "Pack appeal", health_fit: "Health / ingredient fit",
  brand_trust: "Brand trust", shelf_visibility: "Shelf visibility",
  taste_novelty_interaction: "Taste × novelty", price_sensitivity_interaction: "Price × sensitivity",
};

function ResearchDataLineage({ locale, routeIndex, market }: { locale: Locale; routeIndex: number; market: MarketCode }) {
  const families = ROUTE_FAMILIES[routeIndex];
  const modules = QUESTION_MODULES.filter((item) => item.families.some((family) => families.includes(family)));
  const metrics = foodJson.metric_dictionary.filter((item) => families.includes(item.family));
  const results = ROUTE_RESULT_LABELS[routeIndex];
  const marketProfile = MARKET_PROFILES.find((item) => item.code === market)!;
  const flow = locale === "zh"
    ? [["01", "研究问题与问卷", "题目、选项、配额与实验任务"], ["02", "数据接入", "Raw Data · 公开采集 · POS"], ["03", "处理与质控", "清洗、权重、口径与版本"], ["04", "标准化存储", "消费者、商品、选择、门店结果表"], ["05", "指标与变量", "统一定义、粒度与模型特征"], ["06", "模型与决策", "预测、选择、组合与因果增量"], ["07", "结果回写", "下一期与真实经营结果校准"]]
    : [["01", "Research & questionnaire", "Items, options, quota and experiments"], ["02", "Data ingestion", "Raw data · public data · POS"], ["03", "Processing & QA", "Cleaning, weighting, definitions, versions"], ["04", "Standardized storage", "Consumer, product, choice and store tables"], ["05", "Metrics & features", "Definitions, grain and model variables"], ["06", "Models & decisions", "Forecast, choice, portfolio and causal lift"], ["07", "Outcome feedback", "Next wave and business outcome calibration"]];
  return <section className="fnb-data-lineage">
    <header><div><span>DECISION DATA LINEAGE</span><h3>{tr(locale, "数据如何进入模型并形成可验证决策", "How data enters models and produces verifiable decisions")}</h3></div><aside><b>{marketProfile.code}</b><strong>{locale === "zh" ? marketProfile.zh : marketProfile.en}</strong><small>{tr(locale, "当前市场口径", "Current market scope")}</small></aside></header>
    <div className="fnb-lineage-flow">{flow.map(([index, title, note]) => <article key={index}><b>{index}</b><strong>{title}</strong><span>{note}</span></article>)}</div>
    <div className="fnb-lineage-summary"><article><span>{tr(locale, "本路线输入模块", "Input modules")}</span><strong>{modules.length}</strong></article><article><span>{tr(locale, "关联标准指标", "Linked metrics")}</span><strong>{metrics.length}</strong></article><article><span>{tr(locale, "标准数据库表", "Standard tables")}</span><strong>{new Set(modules.map((item) => item.table)).size}</strong></article><article><span>{tr(locale, "结果标签", "Outcome labels")}</span><strong>{results.length}</strong></article></div>
    <div className="fnb-evidence-value"><header><span>DECISION EVIDENCE</span><h4>{tr(locale, "四项检查决定模型输出能否用于行动", "Four checks determine whether model output is actionable")}</h4></header><div>
      <article><b>01</b><strong>{tr(locale, "跨期口径一致", "Comparable over time")}</strong><p>{tr(locale, "同一KPI保留题目、Base、权重和版本，变化可追溯到真实口径。", "Each KPI retains item, base, weight and version so movement is traceable.")}</p><small>{tr(locale, "价值：区分趋势与口径变化", "Value: separate trend from definition drift")}</small></article>
      <article><b>02</b><strong>{tr(locale, "目标人群可代表", "Representative target segment")}</strong><p>{tr(locale, "配额、补样和权重共同控制地区与人群结构，避免大样本中的结构偏差。", "Quotas, top-ups and weights control market and segment structure.")}</p><small>{tr(locale, "价值：细分机会可比较", "Value: comparable segment opportunities")}</small></article>
      <article><b>03</b><strong>{tr(locale, "多源信号相互验证", "Signals corroborate each other")}</strong><p>{tr(locale, "消费者选择、公开商品、外部基准与渠道结果分别验证需求、供给和兑现。", "Consumer choice, product observation, benchmarks and retail outcomes validate demand, supply and delivery.")}</p><small>{tr(locale, "价值：减少单一来源误判", "Value: reduce single-source bias")}</small></article>
      <article><b>04</b><strong>{tr(locale, "经营结果持续回写", "Outcomes feed back")}</strong><p>{tr(locale, "销量、周转、毛利、试购和复购回写后，预测误差和实际增量可以持续复核。", "Sales, velocity, margin, trial and repeat outcomes enable continuous error and lift checks.")}</p><small>{tr(locale, "价值：从预测走向可验证收益", "Value: move from prediction to verified impact")}</small></article>
    </div></div>
    <div className="fnb-lineage-table">
      <div className="head"><span>{tr(locale, "问卷/采集模块", "Questionnaire / source module")}</span><span>{tr(locale, "标准数据库表与主键", "Standard table & keys")}</span><span>{tr(locale, "进入指标层", "Metric layer")}</span><span>{tr(locale, "模型角色", "Model role")}</span></div>
      {modules.map((item) => {
        const linked = metrics.filter((metric) => item.families.includes(metric.family)).map((metric) => metric.metric).slice(0, 3);
        const isOutcome = item.id === "POS-WEEK";
        return <article key={item.id}><span><b>{item.id}</b><strong>{locale === "zh" ? item.zh : item.en}</strong></span><span><code>{item.table}</code><small>{item.keys}</small></span><span>{linked.join(" · ")}</span><span><b>{isOutcome ? tr(locale, "真实结果标签", "Observed outcome") : tr(locale, "特征/分层变量", "Feature / segment")}</b><small>{isOutcome ? results.join(" · ") : item.families.join(" · ")}</small></span></article>;
      })}
    </div>
  </section>;
}

const SHELF_EXPERIMENT_BASE = [
  { design: "高识别包装 · 视线层 · 3排面", pack: "高识别包装", position: "视线层", facings: 3, choice: 48.6 },
  { design: "高识别包装 · 视线层 · 2排面", pack: "高识别包装", position: "视线层", facings: 2, choice: 45.4 },
  { design: "成分透明包装 · 视线层 · 3排面", pack: "成分透明包装", position: "视线层", facings: 3, choice: 44.2 },
  { design: "成分透明包装 · 中层 · 2排面", pack: "成分透明包装", position: "中层", facings: 2, choice: 40.1 },
  { design: "基础包装 · 视线层 · 3排面", pack: "基础包装", position: "视线层", facings: 3, choice: 38.9 },
  { design: "高识别包装 · 中层 · 2排面", pack: "高识别包装", position: "中层", facings: 2, choice: 38.2 },
  { design: "基础包装 · 中层 · 2排面", pack: "基础包装", position: "中层", facings: 2, choice: 34.7 },
  { design: "基础包装 · 下层 · 1排面", pack: "基础包装", position: "下层", facings: 1, choice: 28.5 },
];

const INCREMENTAL_WEEKS = Array.from({ length: 16 }, (_, index) => {
  const week = index - 7;
  const control = 98.4 + index * .36 + Math.sin(index * .9) * 1.1;
  const treatment = control + (index < 8 ? Math.cos(index * .7) * .8 : 7.8 + Math.sin(index * .75) * 1.2);
  return { week: week <= 0 ? `前${Math.abs(week) + 1}` : `后${week}`, control: Number(control.toFixed(1)), treatment: Number(treatment.toFixed(1)), intervention: index === 8 ? 1 : 0 };
});

function ModelPrototypeView({ routeIndex, category, channel, segment, locale, market }: { routeIndex: number; category: string; channel: string; segment: string; locale: Locale; market: MarketCode }) {
  const marketProfile = MARKET_PROFILES.find((item) => item.code === market)!;
  const activeRoute = locale === "zh" ? foodJson.model_routes[routeIndex] : MODEL_ROUTE_EN[routeIndex];
  const categoryLabel = locale === "zh" ? categoryName[category] : CATEGORY_LABEL_EN[category];
  const channelLabel = locale === "zh" ? channelName[channel] : CHANNEL_LABEL_EN[channel];
  const segmentLabel = locale === "zh" ? segmentName[segment] : SEGMENT_LABEL_EN[segment];
  const marketLabel = locale === "zh" ? marketProfile.zh : marketProfile.en;
  const opportunity = Math.max(0, Math.min(100, (foodJson.opportunity_heatmap.find((item) => item.category === category && item.segment === segment)?.opportunity_score ?? 65) + marketProfile.opportunityShift));
  const baseScenario = Math.max(0, Math.min(100, (foodJson.scenarios.find((item) => item.category === category && item.channel === channel && item.segment === segment)?.predicted_purchase ?? 32) + marketProfile.purchaseShift));
  const filteredSkus = foodJson.skus.filter((item) => item.category === category && item.channel === channel).sort((a, b) => b.assortment_score - a.assortment_score);
  const averageIncremental = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.incremental_reach_index, 0) / filteredSkus.length : 0;
  const averageSubstitution = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.substitution_risk_index, 0) / filteredSkus.length : 0;
  const assortmentPoints = filteredSkus.slice(0, 36).map((item) => ({ ...item, x: item.substitution_risk_index, y: item.incremental_reach_index, z: item.assortment_score }));
  const priorityAssortment = assortmentPoints.filter((item) => item.y >= averageIncremental && item.x <= averageSubstitution).sort((a, b) => b.assortment_score - a.assortment_score);
  const priceCurve = foodJson.price_curves.filter((item) => item.segment === segment).map((item) => ({ ...item, purchase_probability: Number(Math.max(1, Math.min(98, item.purchase_probability + marketProfile.purchaseShift)).toFixed(1)) }));
  const priceAt100 = priceCurve.find((item) => item.price_index === 95)?.purchase_probability ?? baseScenario;
  const priceScenarios = priceCurve.map((item) => ({ ...item, revenue_index: Number((item.price_index / 100 * item.purchase_probability / priceAt100 * 100).toFixed(1)) }));
  const recommendedPrice = [...priceScenarios].sort((a, b) => b.revenue_index - a.revenue_index)[0];
  const publicCategory = category === "dried_fruit" ? "干果蜜饯" : categoryName[category];
  const publicPriceRows = market === "CN" ? (publicRetailJson.observations as PublicObservationRecord[]).filter((item) => item.category === publicCategory && item.unit_price_per_100g_cny != null) : [];
  const observedMedian = [...publicPriceRows].sort((a, b) => Number(a.unit_price_per_100g_cny) - Number(b.unit_price_per_100g_cny))[Math.floor(publicPriceRows.length / 2)]?.unit_price_per_100g_cny;
  const regionRows = MARKET_REGIONS[market].map((item) => {
    const sample_n = Math.max(120, Math.round(marketProfile.sample * item.weight));
    const mean = Math.max(48, Math.min(91, opportunity + item.shift + (CHANNEL_MODEL_SHIFT[channel] ?? 0)));
    const margin = 1.2 + 70 / Math.sqrt(sample_n);
    const probability = 100 / (1 + Math.exp(-(mean - 66) / 4.4));
    return { ...item, region: locale === "zh" ? item.zh : item.en, sample_n, posterior_mean: Number(mean.toFixed(1)), ci_low: Number((mean - margin).toFixed(1)), ci_high: Number((mean + margin).toFixed(1)), growth_probability: Number(probability.toFixed(0)) };
  }).sort((a, b) => b.posterior_mean - a.posterior_mean);
  const topRegion = regionRows[0];
  const shelfSegmentLift = segment === "ingredient_first" ? 2.4 : segment === "novel_youth" ? 1.8 : segment === "value_family" ? -.6 : .5;
  const shelfRows = SHELF_EXPERIMENT_BASE.map((item) => ({ ...item, choice: Number((item.choice + shelfSegmentLift).toFixed(1)) }));
  const bestShelf = shelfRows[0];
  const shelfBaseline = shelfRows.find((item) => item.design === "基础包装 · 中层 · 2排面")?.choice ?? 34.7;
  const conceptRows = [
    { concept: "价格友好型", conceptEn: "Value concept", trial: baseScenario + 7.2, repeat: 44.5, differentiation: 58.0 },
    { concept: "健康成分型", conceptEn: "Health & ingredient", trial: baseScenario + (segment === "ingredient_first" ? 12.4 : 5.6), repeat: 51.8, differentiation: 67.0 },
    { concept: "新奇口味型", conceptEn: "Novel taste", trial: baseScenario + (segment === "novel_youth" ? 13.1 : 4.8), repeat: 46.2, differentiation: 73.0 },
    { concept: "品质升级型", conceptEn: "Premium quality", trial: baseScenario + (segment === "quality_gifting" ? 11.8 : 3.9), repeat: 55.4, differentiation: 62.0 },
  ].map((item) => ({ ...item, label: locale === "zh" ? item.concept : item.conceptEn, success_probability: Number(Math.max(18, Math.min(86, item.trial * .42 + item.repeat * .34 + item.differentiation * .24)).toFixed(1)) })).sort((a, b) => b.success_probability - a.success_probability);
  const topConcept = conceptRows[0];
  const officialFood = authoritativePublicJson.metrics.find((item) => item.metric_id === "NBS_H1_GRAIN_FOOD")!;
  const officialOnline = authoritativePublicJson.metrics.find((item) => item.metric_id === "NBS_H1_ONLINE_FOOD_GROWTH")!;
  const officialChannel = authoritativePublicJson.metrics.find((item) => item.metric_id === (channel === "ecommerce" || channel === "instant" ? "NBS_H1_ONLINE_FOOD_GROWTH" : channel === "regional" || channel === "hypermarket" ? "NBS_H1_SUPERMARKET_GROWTH" : "NBS_H1_CONVENIENCE_GROWTH"))!;

  let headline = "";
  let kpis: Array<{ label: string; value: string; note: string }> = [];
  let conclusions: string[] = [];
  let visual: React.ReactNode = null;

  if (routeIndex === 0) {
    headline = locale === "zh" ? `优先在${topRegion.region}验证${segmentLabel}的${categoryLabel}机会` : `Prioritize ${topRegion.region} to validate the ${categoryLabel} opportunity among ${segmentLabel}`;
    kpis = [
      { label: tr(locale, "后验机会分", "Posterior opportunity"), value: `${topRegion.posterior_mean}`, note: tr(locale, `90%区间 ${topRegion.ci_low}–${topRegion.ci_high}`, `90% interval ${topRegion.ci_low}–${topRegion.ci_high}`) },
      { label: tr(locale, "超过进入阈值概率", "Probability above entry threshold"), value: `${topRegion.growth_probability}%`, note: tr(locale, "阈值=66", "Threshold = 66") },
      { label: tr(locale, "加权消费者样本", "Weighted consumer sample"), value: `N=${regionRows.reduce((sum, item) => sum + item.sample_n, 0).toLocaleString()}`, note: tr(locale, "市场配额结构", "Market quota structure") },
      { label: tr(locale, market === "CN" ? "官方食品类增速" : "市场校准状态", market === "CN" ? "Official food growth" : "Market calibration"), value: market === "CN" ? `+${officialFood.yoy_pct}%` : tr(locale, "待接入", "Pending"), note: market === "CN" ? officialFood.period : marketProfile.calibration },
    ];
    conclusions = locale === "zh" ? [`${topRegion.region}与${regionRows[1].region}构成第一验证梯队；前者机会分高${(topRegion.posterior_mean - regionRows[1].posterior_mean).toFixed(1)}分。`, `${segmentLabel}对${categoryLabel}的基础机会分为${opportunity}，再按渠道与地区层级计算后验。`, market === "CN" ? `网上吃类同比增速${officialOnline.value}%仅作为趋势先验，不直接等同于该品类的市场规模。` : `${marketLabel}当前差异为模拟校准层；接入当地官方统计与渠道数据后更新市场先验。`] : [`${topRegion.region} and ${regionRows[1].region} form the first validation tier; the lead is ${(topRegion.posterior_mean - regionRows[1].posterior_mean).toFixed(1)} points.`, `${segmentLabel} has a base ${categoryLabel} opportunity score of ${opportunity}; the posterior then applies channel and regional hierarchy.`, market === "CN" ? `Official online food growth of ${officialOnline.value}% is used only as a prior, not as the category market size.` : `${marketLabel} currently uses a simulated calibration layer; local official and retail data will update the prior.`];
    visual = <div className="fnb-prototype-chart-grid"><article className="fnb-prototype-chart"><header><span>REGION POSTERIOR RANKING</span><h4>{tr(locale, "地区机会后验排序", "Regional posterior opportunity ranking")}</h4></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={regionRows} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 16 }}><CartesianGrid stroke="#e5e8ee" horizontal={false} /><XAxis type="number" domain={[50, 90]} tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="region" width={locale === "zh" ? 66 : 105} tick={{ fontSize: 9 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="posterior_mean" name={tr(locale, "后验机会分", "Posterior score")} radius={[0, 3, 3, 0]}>{regionRows.map((item, index) => <Cell key={item.region} fill={index === 0 ? "#0aa59e" : "#2639a5"} opacity={index === 0 ? 1 : .64} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className="fnb-posterior-table"><header><span>UNCERTAINTY</span><h4>{tr(locale, "样本与可信区间", "Sample and credible interval")}</h4></header><div className="head"><span>{tr(locale, "地区", "Region")}</span><span>{tr(locale, "样本", "Sample")}</span><span>{tr(locale, "90%区间", "90% interval")}</span><span>{tr(locale, "进入概率", "Entry probability")}</span></div>{regionRows.map((item) => <div key={item.region}><b>{item.region}</b><span>{item.sample_n}</span><span>{item.ci_low}–{item.ci_high}</span><strong>{item.growth_probability}%</strong></div>)}</article></div>;
  } else if (routeIndex === 1) {
    const price85 = priceCurve.find((item) => item.price_index === 85)?.purchase_probability ?? 0;
    const price115 = priceCurve.find((item) => item.price_index === 115)?.purchase_probability ?? 0;
    const elasticity = priceAt100 ? (price115 - price85) / priceAt100 / .30 : 0;
    const promoLevels = [0, 10, 20, 30];
    const pricePromoSurface = promoLevels.map((promo) => ({ promo, cells: priceCurve.map((point) => ({ price: point.price_index, probability: Number(Math.min(94, point.purchase_probability + promo * .15 + (SEGMENT_FACTOR_PROFILES[segment].price - 60) * .025).toFixed(1)) })) }));
    const maxSurfaceProbability = Math.max(...pricePromoSurface.flatMap((row) => row.cells.map((cell) => cell.probability)));
    headline = locale === "zh" ? `${segmentLabel}的建议测试价格为品类基准的${recommendedPrice.price_index}%` : `Test ${segmentLabel} at ${recommendedPrice.price_index}% of the category reference price`;
    kpis = [
      { label: tr(locale, "建议测试价格指数", "Recommended test price index"), value: `${recommendedPrice.price_index}`, note: tr(locale, "收入代理最大点", "Maximum revenue proxy") },
      { label: tr(locale, "预测购买概率", "Predicted purchase probability"), value: `${recommendedPrice.purchase_probability}%`, note: tr(locale, `选择模型 N=${foodJson.model.train_n.toLocaleString()}`, `Choice model N=${foodJson.model.train_n.toLocaleString()}`) },
      { label: tr(locale, "价格弹性", "Price elasticity"), value: elasticity.toFixed(2), note: tr(locale, "85→115情景", "Index 85→115 scenario") },
      { label: tr(locale, market === "CN" ? "公开详情价格" : "当地价格校准", market === "CN" ? "Public detail price" : "Local price calibration"), value: observedMedian ? `¥${formatNumber(observedMedian, 2)}/100g` : tr(locale, "待接入", "Pending"), note: market === "CN" ? tr(locale, `${publicPriceRows.length}条同类价格样本`, `${publicPriceRows.length} observed category prices`) : marketProfile.calibration },
    ];
    conclusions = locale === "zh" ? [`优先测试相对价格指数${recommendedPrice.price_index}；在当前人群与渠道下，其收入代理指数为${recommendedPrice.revenue_index}。`, `价格从85升至115时，购买概率变化${(price115 - price85).toFixed(1)}个百分点；${segmentLabel}价格弹性为${elasticity.toFixed(2)}。`, `响应面同时联动价格、促销与人群敏感度；正式定价再接入${marketLabel}成交、促销和地区价格。`] : [`Prioritize price index ${recommendedPrice.price_index}; its revenue proxy is ${recommendedPrice.revenue_index} for the selected segment and channel.`, `Purchase probability changes by ${(price115 - price85).toFixed(1)} points from price index 85 to 115; elasticity is ${elasticity.toFixed(2)}.`, `The response surface jointly varies price, promotion and segment sensitivity; final pricing requires ${marketLabel} transaction, promotion and regional price data.`];
    visual = <div className="fnb-prototype-multivariable">
      <article className="fnb-response-surface"><header><span>PRICE × PROMOTION RESPONSE SURFACE</span><h4>{tr(locale, "价格、促销与人群的预测购买概率", "Predicted purchase probability by price, promotion and segment")}</h4><small>{segmentLabel} · {marketLabel} · %</small></header><div className="fnb-surface-table"><div className="head"><span>{tr(locale, "促销深度", "Promotion")}</span>{priceCurve.map((point) => <b key={point.price_index}>{point.price_index}</b>)}</div>{pricePromoSurface.map((row) => <div key={row.promo}><strong>{row.promo}%</strong>{row.cells.map((cell) => { const alpha = .14 + cell.probability / maxSurfaceProbability * .72; return <span className={cell.price === recommendedPrice.price_index ? "recommended" : ""} style={{ backgroundColor: `rgba(10,165,158,${alpha})` }} key={cell.price}>{cell.probability}</span>; })}</div>)}</div><footer>{tr(locale, "列=相对价格指数；行=促销深度；高亮列=建议测试价格", "Columns = relative price index; rows = promotion depth; highlighted column = recommended test price")}</footer></article>
      <article className="fnb-prototype-chart fnb-driver-panel"><header><span>DRIVER EFFECT</span><h4>{tr(locale, "选择模型系数的情景影响", "Scenario impact of choice-model coefficients")}</h4></header><div className="fnb-driver-bars">{foodJson.model.coefficients.filter((item) => item.source !== "model").sort((a, b) => Math.abs(b.impact_pp) - Math.abs(a.impact_pp)).map((item) => <div key={item.source}><span>{locale === "zh" ? item.label : COEFFICIENT_LABEL_EN[item.source]}</span><i><b className={item.impact_pp < 0 ? "negative" : ""} style={{ width: `${Math.min(100, Math.abs(item.impact_pp) / 13 * 100)}%` }} /></i><strong>{item.impact_pp > 0 ? "+" : ""}{item.impact_pp} pts</strong></div>)}</div></article>
      <article className="fnb-segment-factor-matrix"><header><span>SEGMENT SENSITIVITY MATRIX</span><h4>{tr(locale, "五类人群对五类选择因素的相对敏感度", "Relative sensitivity of five segments to five choice factors")}</h4></header><div className="head"><span>{tr(locale, "人群", "Segment")}</span><b>{tr(locale, "价格", "Price")}</b><b>{tr(locale, "口味", "Taste")}</b><b>{tr(locale, "健康", "Health")}</b><b>{tr(locale, "信任", "Trust")}</b><b>{tr(locale, "新奇", "Novelty")}</b></div>{foodJson.segments.map((item) => { const row = SEGMENT_FACTOR_PROFILES[item.code]; return <div className={segment === item.code ? "active" : ""} key={item.code}><strong>{locale === "zh" ? item.name : SEGMENT_LABEL_EN[item.code]}</strong>{Object.values(row).map((value, index) => <span style={{ backgroundColor: `rgba(38,57,165,${.08 + value / 100 * .66})` }} key={index}>{value}</span>)}</div>; })}</article>
    </div>;
  } else if (routeIndex === 2) {
    const topSku = priorityAssortment[0] ?? assortmentPoints[0];
    headline = topSku ? (locale === "zh" ? `优先测试${topSku.product_name}，并保留低替代候选池` : `Prioritize ${topSku.product_name} while retaining the low-substitution candidate pool`) : tr(locale, "当前筛选没有候选SKU", "No candidate SKU under the current filters");
    kpis = [
      { label: tr(locale, "候选SKU", "Candidate SKUs"), value: `${assortmentPoints.length}`, note: `${categoryLabel} × ${channelLabel}` },
      { label: tr(locale, "高增量低替代", "High incrementality / low substitution"), value: `${priorityAssortment.length}`, note: tr(locale, "同时优于组合均值", "Above both portfolio thresholds") },
      { label: tr(locale, "最高组合分", "Highest portfolio score"), value: `${topSku?.assortment_score ?? 0}`, note: topSku?.sku_id ?? "—" },
      { label: tr(locale, "建议品类排面", "Recommended facing share"), value: `${foodJson.shelf_mix.find((item) => item.channel === channel && item.category === category)?.recommended_facing_share ?? 0}/100`, note: tr(locale, "容量约束结果", "Capacity-constrained result") },
    ];
    conclusions = locale === "zh" ? [topSku ? `${topSku.product_name}的增量触达${topSku.incremental_reach_index}、替代风险${topSku.substitution_risk_index}，进入第一轮门店测试。` : "没有候选SKU。", `当前${priorityAssortment.length}个SKU同时满足高于平均增量触达、低于平均替代风险。`, "真实引入与移除必须加入门店周转、毛利、缺货和货架容量后重新优化。"] : [topSku ? `${topSku.product_name} has incremental reach ${topSku.incremental_reach_index} and substitution risk ${topSku.substitution_risk_index}; move it to the first store test.` : "No candidate SKU.", `${priorityAssortment.length} SKUs exceed average incremental reach while staying below average substitution risk.`, "Final listing and removal decisions must re-optimize with store velocity, margin, out-of-stock and shelf capacity."];
    visual = <div className="fnb-prototype-chart-grid"><article className="fnb-prototype-chart"><header><span>PORTFOLIO FRONTIER</span><h4>{tr(locale, "增量触达 × 内部替代风险", "Incremental reach × internal substitution risk")}</h4></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 24, bottom: 18, left: 0 }}><CartesianGrid stroke="#e5e8ee" /><XAxis type="number" dataKey="x" name={tr(locale, "替代风险", "Substitution risk")} domain={[0, 100]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="y" name={tr(locale, "增量触达", "Incremental reach")} domain={[0, 100]} tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="z" range={[70, 480]} name={tr(locale, "组合分", "Portfolio score")} /><ReferenceLine x={averageSubstitution} stroke="#ef9c2c" strokeDasharray="4 4" /><ReferenceLine y={averageIncremental} stroke="#0aa59e" strokeDasharray="4 4" /><Tooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltip />} /><Scatter data={assortmentPoints} fill="#2639a5" /></ScatterChart></ResponsiveContainer></div></article><article className="fnb-model-shortlist"><header><span>OPTIMIZED SHORTLIST</span><h4>{tr(locale, "第一轮门店测试清单", "First-round store test shortlist")}</h4></header>{priorityAssortment.slice(0, 6).map((item, index) => <div key={item.sku_id}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{item.product_name}</strong><small>{tr(locale, "增量", "Reach")} {item.incremental_reach_index} · {tr(locale, "替代", "Substitution")} {item.substitution_risk_index}</small></span><em>{item.assortment_score}</em></div>)}</article></div>;
  } else if (routeIndex === 3) {
    const lift = bestShelf.choice - shelfBaseline;
    headline = locale === "zh" ? `${bestShelf.design}预计把选择率提高${lift.toFixed(1)}个百分点` : `The best pack-position-facing cell is predicted to lift choice by ${lift.toFixed(1)} points`;
    kpis = [
      { label: tr(locale, "最佳方案选择率", "Winning-cell choice rate"), value: `${bestShelf.choice}%`, note: tr(locale, "条件逻辑预测", "Conditional logit prediction") },
      { label: tr(locale, "相对基础方案", "Lift vs baseline"), value: `+${lift.toFixed(1)} pts`, note: tr(locale, "包装+位置+排面", "Pack + position + facings") },
      { label: tr(locale, "随机化曝光", "Randomized exposures"), value: "N=3,600", note: tr(locale, "货架实验数据结构", "Shelf experiment data structure") },
      { label: tr(locale, "时间留出命中率", "Time-holdout accuracy"), value: "71.6%", note: tr(locale, "模拟验证集", "Simulated validation set") },
    ];
    conclusions = locale === "zh" ? [`高识别包装与视线层共同贡献最大；3排面优于2排面${(shelfRows[0].choice - shelfRows[1].choice).toFixed(1)}个百分点。`, `${segmentLabel}在当前货架方案下的预测选择率为${bestShelf.choice}%。`, "下一轮只把最佳方案和基础方案带入虚拟货架或门店A/B，不同时测试全部组合。"] : [`High-recognition packaging and eye-level position contribute most; three facings outperform two by ${(shelfRows[0].choice - shelfRows[1].choice).toFixed(1)} points.`, `${segmentLabel} has a predicted choice rate of ${bestShelf.choice}% under the current shelf cell.`, "Take only the winning and baseline cells into the next virtual-shelf or store A/B test."];
    visual = <div className="fnb-prototype-chart-grid"><article className="fnb-prototype-chart wide"><header><span>RANDOMIZED SHELF CELLS</span><h4>{tr(locale, "包装 × 位置 × 排面选择率", "Choice rate by pack × position × facings")}</h4></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={shelfRows} layout="vertical" margin={{ top: 8, right: 28, bottom: 8, left: 22 }}><CartesianGrid stroke="#e5e8ee" horizontal={false} /><XAxis type="number" domain={[20, 55]} unit="%" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="design" width={170} tick={{ fontSize: 8 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="choice" name={tr(locale, "预测选择率", "Predicted choice")} radius={[0, 3, 3, 0]}>{shelfRows.map((item, index) => <Cell key={item.design} fill={index === 0 ? "#0aa59e" : index < 3 ? "#2639a5" : "#8d98b4"} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className="fnb-experiment-matrix"><header><span>TEST DESIGN</span><h4>{tr(locale, "实验结构", "Experiment structure")}</h4></header><div><span>{tr(locale, "包装版本", "Pack versions")}</span><strong>3</strong><small>{tr(locale, "基础 / 高识别 / 成分透明", "Baseline / recognition / ingredient")}</small></div><div><span>{tr(locale, "货架位置", "Shelf positions")}</span><strong>3</strong><small>{tr(locale, "视线层 / 中层 / 下层", "Eye / middle / lower")}</small></div><div><span>{tr(locale, "排面水平", "Facing levels")}</span><strong>3</strong><small>1 / 2 / 3</small></div><div><span>{tr(locale, "目标变量", "Target")}</span><strong>{tr(locale, "选择", "Choice")}</strong><small>{tr(locale, "可见 → 识别 → 说服 → 选择", "Seen → recognized → persuaded → chosen")}</small></div></article></div>;
  } else if (routeIndex === 4) {
    headline = locale === "zh" ? `${topConcept.label}进入产品验证，成功概率${topConcept.success_probability}%` : `${topConcept.label} advances to product validation with ${topConcept.success_probability}% predicted success`;
    kpis = [
      { label: tr(locale, "最高成功概率", "Highest success probability"), value: `${topConcept.success_probability}%`, note: topConcept.label },
      { label: tr(locale, "概念样本", "Concept sample"), value: "N=1,200", note: tr(locale, "概念+产品联合测试", "Joint concept-product test") },
      { label: tr(locale, "时间留出AUC", "Time-holdout AUC"), value: "0.731", note: tr(locale, "模拟上市标签", "Simulated launch labels") },
      { label: tr(locale, "校准Brier", "Calibration Brier"), value: "0.184", note: tr(locale, "越低越好", "Lower is better") },
    ];
    conclusions = locale === "zh" ? [`${topConcept.label}在试购${topConcept.trial.toFixed(1)}、复购${topConcept.repeat.toFixed(1)}和差异化${topConcept.differentiation.toFixed(1)}的共同作用下排名第一。`, `${conceptRows[1].label}作为备选；与第一方案成功概率相差${(topConcept.success_probability - conceptRows[1].success_probability).toFixed(1)}个百分点。`, "先验证产品兑现与复购，再决定上市；不只依据问卷购买意愿。"] : [`${topConcept.label} ranks first through the combined contribution of trial ${topConcept.trial.toFixed(1)}, repeat ${topConcept.repeat.toFixed(1)} and differentiation ${topConcept.differentiation.toFixed(1)}.`, `${conceptRows[1].label} is the backup, ${(topConcept.success_probability - conceptRows[1].success_probability).toFixed(1)} points behind.`, "Validate product delivery and repeat before launch; do not rely on stated purchase intent alone."];
    visual = <div className="fnb-prototype-chart-grid"><article className="fnb-prototype-chart"><header><span>LAUNCH PROBABILITY</span><h4>{tr(locale, "概念—产品联合成功概率", "Joint concept-product success probability")}</h4></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={conceptRows} margin={{ top: 12, right: 18, bottom: 18, left: 0 }}><CartesianGrid stroke="#e5e8ee" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 8 }} /><YAxis domain={[0, 80]} unit="%" tick={{ fontSize: 9 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="success_probability" name={tr(locale, "成功概率", "Success probability")} radius={[3, 3, 0, 0]}>{conceptRows.map((item, index) => <Cell key={item.concept} fill={index === 0 ? "#0aa59e" : "#2639a5"} opacity={index === 0 ? 1 : .65} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className="fnb-concept-table"><header><span>STAGE GATE</span><h4>{tr(locale, "产品阶段门", "Product stage gate")}</h4></header><div className="head"><span>{tr(locale, "方案", "Concept")}</span><span>{tr(locale, "试购", "Trial")}</span><span>{tr(locale, "复购", "Repeat")}</span><span>{tr(locale, "差异化", "Differentiation")}</span><span>{tr(locale, "结果", "Decision")}</span></div>{conceptRows.map((item, index) => <div key={item.concept}><b>{item.label}</b><span>{item.trial.toFixed(1)}</span><span>{item.repeat.toFixed(1)}</span><span>{item.differentiation.toFixed(1)}</span><strong>{index === 0 ? tr(locale, "进入产品验证", "Validate product") : item.success_probability >= 50 ? tr(locale, "保留优化", "Retain & optimize") : tr(locale, "暂缓", "Hold")}</strong></div>)}</article></div>;
  } else {
    const did = 7.8;
    headline = locale === "zh" ? `换货架后净增量${did.toFixed(1)}%，建议扩至下一批匹配门店` : `Shelf change delivers ${did.toFixed(1)}% net lift; extend to the next matched-store cohort`;
    kpis = [
      { label: tr(locale, "差分净增量", "Difference-in-differences lift"), value: `+${did.toFixed(1)}%`, note: tr(locale, "测试组减对照组", "Treatment minus control") },
      { label: tr(locale, "95%置信区间", "95% confidence interval"), value: "+3.1–12.5%", note: tr(locale, "门店聚类稳健标准误", "Store-clustered robust SE") },
      { label: tr(locale, "分析样本", "Analysis sample"), value: tr(locale, "384店周", "384 store-weeks"), note: tr(locale, "24店 × 16周", "24 stores × 16 weeks") },
      { label: tr(locale, "前趋势检验", "Pre-trend test"), value: "p=0.63", note: tr(locale, "未发现显著差异", "No significant divergence") },
    ];
    conclusions = locale === "zh" ? [`干预后测试组相对对照组净增量${did.toFixed(1)}%，置信区间未跨越0。`, "前8周趋势检验p=0.63，当前模拟样本未显示明显前趋势差异。", "扩店前复核促销、缺货和门店客流，并在第二批门店复现。"] : [`Post-intervention net lift is ${did.toFixed(1)}% versus matched controls and the interval does not cross zero.`, "The eight-week pre-trend test is p=0.63, showing no material divergence in the simulated structure.", "Before rollout, check promotion, out-of-stock and traffic, then replicate in a second store cohort."];
    visual = <div className="fnb-prototype-chart-grid"><article className="fnb-prototype-chart wide"><header><span>DIFFERENCE-IN-DIFFERENCES</span><h4>{tr(locale, "测试组与匹配对照组周销售指数", "Weekly sales index: treatment vs matched control")}</h4></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={INCREMENTAL_WEEKS} margin={{ top: 12, right: 26, bottom: 18, left: 0 }}><CartesianGrid stroke="#e5e8ee" vertical={false} /><XAxis dataKey="week" tick={{ fontSize: 8 }} /><YAxis domain={[94, 114]} tick={{ fontSize: 9 }} /><Tooltip content={<ChartTooltip />} /><ReferenceLine x="后1" stroke="#ef9c2c" strokeWidth={2} label={{ value: tr(locale, "换货架", "Shelf change"), position: "insideTopRight", fontSize: 8 }} /><Line dataKey="treatment" name={tr(locale, "测试组", "Treatment")} stroke="#0aa59e" strokeWidth={3} dot={{ r: 2 }} /><Line dataKey="control" name={tr(locale, "匹配对照组", "Matched control")} stroke="#2639a5" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></article><article className="fnb-increment-card"><span>CAUSAL ESTIMATE</span><strong>+{did.toFixed(1)}%</strong><h4>{tr(locale, "货架调整净增量", "Net lift from shelf change")}</h4><i><b style={{ left: "26%", width: "51%" }} /></i><div><small>3.1%</small><small>95% CI</small><small>12.5%</small></div><p>{tr(locale, "模型同时控制门店固定效应、周效应、促销和缺货；此处为模拟门店数据结构。", "The model controls store fixed effects, week effects, promotion and out-of-stock; the store data are simulated.")}</p></article></div>;
  }

  return <section className="fnb-model-prototype">
    <header><div><span>MODEL OUTPUT · {String(routeIndex + 1).padStart(2, "0")}</span><h3>{headline}</h3><p>{marketLabel} × {categoryLabel} × {channelLabel} × {segmentLabel}</p></div><SimulationTag>{tr(locale, "模拟模型演示", "Simulated model demo")}</SimulationTag></header>
    <div className="fnb-prototype-kpis">{kpis.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div>
    {visual}
    <section className="fnb-model-conclusions"><header><span>DECISION OUTPUT</span><h4>{tr(locale, "模型支持的结论", "Decision outputs supported by the model")}</h4></header><div>{conclusions.map((item, index) => <article key={item}><b>{String(index + 1).padStart(2, "0")}</b><p>{item}</p></article>)}</div></section>
    <details className="fnb-prototype-method"><summary>{tr(locale, "查看模型输入与验证方法", "View model inputs and validation")}</summary><dl><div><dt>{tr(locale, "主模型", "Primary model")}</dt><dd>{activeRoute.primary}</dd></div><div><dt>{tr(locale, "输入", "Inputs")}</dt><dd>{activeRoute.inputs}</dd></div><div><dt>{tr(locale, "验证", "Validation")}</dt><dd>{activeRoute.validation}</dd></div><div><dt>{tr(locale, "交付", "Output")}</dt><dd>{activeRoute.outputs}</dd></div></dl><footer>{market === "CN" ? tr(locale, `官方校准：${officialFood.metric} ${officialFood.value.toLocaleString()}${officialFood.unit}、同比+${officialFood.yoy_pct}%；${officialChannel.metric} ${officialChannel.value}${officialChannel.unit}。官方数据只用于宏观先验或外部校准。`, `Official calibration: ${officialFood.metric} ${officialFood.value.toLocaleString()}${officialFood.unit}, +${officialFood.yoy_pct}% YoY; ${officialChannel.metric} ${officialChannel.value}${officialChannel.unit}. Official data are used only as macro priors or external calibration.`) : tr(locale, `${marketLabel}市场层当前使用模拟差异；正式模型需接入当地官方统计、渠道价格与消费者样本进行重新校准。`, `${marketLabel} currently uses simulated market differences; production models require local official statistics, channel pricing and consumer samples.`)}</footer></details>
  </section>;
}

function MetricsAndModels({ category, channel, segment, locale, market }: { category: string; channel: string; segment: string; locale: Locale; market: MarketCode }) {
  const families = ["全部指标", ...Array.from(new Set(foodJson.metric_dictionary.map((item) => item.family)))];
  const [family, setFamily] = useState("全部指标");
  const [routeIndex, setRouteIndex] = useState(0);
  const [researchQuery, setResearchQuery] = useState("零食量贩的膨化食品价格带是多少？");
  const [researchAnswer, setResearchAnswer] = useState<FoodResearchAnswer | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const visibleMetrics = foodJson.metric_dictionary.filter((item) => family === "全部指标" || item.family === family);

  async function queryFoodEvidence() {
    setResearchLoading(true);
    setResearchError("");
    try {
      const response = await fetch("/api/food-research-answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: researchQuery, category, channel }) });
      const payload = await response.json() as { answer?: FoodResearchAnswer; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "没有取得回答");
      setResearchAnswer(payload.answer);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "检索失败");
    } finally {
      setResearchLoading(false);
    }
  }

  return <div className="fnb-tab-stack">
    <section className="fnb-section-intro"><div><span>METRIC &amp; MODEL SYSTEM</span><h2>{tr(locale, "从问卷与采集，到指标、模型和结果回写", "From research inputs to metrics, models and outcome feedback")}</h2></div><p>{tr(locale, "选择业务问题后，只联动该决策需要的数据、指标与模型。", "Each decision route links only the data, metrics and models it needs.")}</p></section>
    <ResearchDataLineage locale={locale} routeIndex={routeIndex} market={market} />
    <section className="fnb-route-workbench">
      <nav>{foodJson.model_routes.map((item, index) => <button type="button" className={index === routeIndex ? "active" : ""} onClick={() => setRouteIndex(index)} key={item.question}><b>{String(index + 1).padStart(2, "0")}</b><span>{locale === "zh" ? item.question : MODEL_ROUTE_EN[index].question}</span></button>)}</nav>
      <ModelPrototypeView routeIndex={routeIndex} category={category} channel={channel} segment={segment} locale={locale} market={market} />
    </section>
    <details className="fnb-data-details">
      <summary><span>指标字典</span><b>{foodJson.metric_dictionary.length}项定义 · 可按指标族筛选</b></summary>
    <section className="fnb-metric-dictionary">
      <header><div><span>METRIC DICTIONARY</span><h3>包装食品与饮料指标字典</h3><p>同一指标保留定义、粒度、更新频率、来源、可回答问题与不能回答的边界。</p></div><label><span>指标族</span><select value={family} onChange={(event) => setFamily(event.target.value)}>{families.map((item) => <option key={item}>{item}</option>)}</select></label></header>
      <div className="fnb-metric-table"><div className="head"><span>指标</span><span>定义与粒度</span><span>来源 / 更新</span><span>可回答</span><span>不能回答</span></div>{visibleMetrics.map((item) => <article key={item.metric}><span><i>{item.family}</i><b>{item.metric}</b></span><p>{item.definition}<small>{item.grain}</small></p><span><b>{item.source}</b><small>{item.refresh}</small></span><p>{item.answers}</p><em>{item.cannot_answer}</em></article>)}</div>
    </section>
    </details>
    <details className="fnb-data-details">
      <summary><span>食品研究问答</span><b>查询价格、组合、模型和证据</b></summary>
    <section className="fnb-food-research-ai">
      <div><span>EVIDENCE QUERY</span><h3>查询价格、商品组合与模型证据</h3><p>回答返回数值、数据标签和来源。</p><nav>{["零食量贩的膨化食品价格带是多少？", "膨化食品有哪些优先引入候选？", "购买选择模型的关键变量是什么？", "现有数据能否回答真实市场份额？"].map((question) => <button type="button" onClick={() => setResearchQuery(question)} key={question}>{question}</button>)}</nav></div>
      <form onSubmit={(event) => { event.preventDefault(); void queryFoodEvidence(); }}><label><span>研究问题</span><textarea rows={4} value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} /></label><button type="submit" disabled={researchLoading}>{researchLoading ? "正在检索…" : "检索并回答"}</button>{researchError && <em>{researchError}</em>}</form>
      <article className={researchAnswer ? "answered" : ""}>{researchAnswer ? <><header><span>{researchAnswer.dataLabel}</span><h3>{researchAnswer.title}</h3></header><p>{researchAnswer.answer}</p>{researchAnswer.evidence.length > 0 && <div>{researchAnswer.evidence.map((item) => <section key={`${item.label}-${item.source}`}><b>{item.label}</b><strong>{item.value}</strong><small>{item.source}</small></section>)}</div>}<ul>{researchAnswer.points.map((item) => <li key={item}>{item}</li>)}</ul><blockquote>{researchAnswer.boundary}</blockquote><footer>{researchAnswer.sources.join(" · ")}</footer></> : <><span>等待问题</span><h3>输入一个具体业务问题</h3><p>系统将返回可追溯的数值、模型依据与适用范围。</p></>}</article>
    </section>
    </details>
  </div>;
}

function ProductPlan({ category, channel, segment, audience, locale, market }: { category: string; channel: string; segment: string; audience: AudienceMode; locale: Locale; market: MarketCode }) {
  const [decisionKey, setDecisionKey] = useState<ProductDecisionKey>("price");
  const selectedCategory = foodJson.categories.find((item) => item.code === category)!;
  const selectedChannel = foodJson.channels.find((item) => item.code === channel)!;
  const selectedSegment = foodJson.segments.find((item) => item.code === segment)!;
  const marketProfile = MARKET_PROFILES.find((item) => item.code === market)!;
  const opportunity = Math.max(0, Math.min(100, (foodJson.opportunity_heatmap.find((item) => item.category === category && item.segment === segment)?.opportunity_score ?? 0) + marketProfile.opportunityShift));
  const scenario = foodJson.scenarios.find((item) => item.category === category && item.channel === channel && item.segment === segment)!;
  const purchaseProbability = Number(Math.max(0, Math.min(100, scenario.predicted_purchase + marketProfile.purchaseShift)).toFixed(1));
  const filteredSkus = foodJson.skus.filter((item) => item.category === category && item.channel === channel).sort((a, b) => b.assortment_score - a.assortment_score);
  const averageIncremental = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.incremental_reach_index, 0) / filteredSkus.length : 0;
  const averageSubstitution = filteredSkus.length ? filteredSkus.reduce((sum, item) => sum + item.substitution_risk_index, 0) / filteredSkus.length : 0;
  const assortmentPoints = filteredSkus.map((item) => ({ ...item, x: item.substitution_risk_index, y: item.incremental_reach_index, z: item.assortment_score }));
  const prioritySkus = assortmentPoints.filter((item) => item.y >= averageIncremental && item.x <= averageSubstitution).sort((a, b) => b.assortment_score - a.assortment_score);
  const topSku = prioritySkus[0] ?? assortmentPoints[0];
  const shelfShare = foodJson.shelf_mix.find((item) => item.channel === channel && item.category === category)?.recommended_facing_share ?? 0;
  const priceCurve = foodJson.price_curves.filter((item) => item.segment === segment).map((item) => ({ ...item, purchase_probability: Number(Math.max(1, Math.min(98, item.purchase_probability + marketProfile.purchaseShift)).toFixed(1)), revenue_proxy: Number((item.price_index * Math.max(1, item.purchase_probability + marketProfile.purchaseShift)).toFixed(1)) }));
  const referencePrice = [...priceCurve].sort((a, b) => Math.abs(a.price_index - 100) - Math.abs(b.price_index - 100))[0];
  const recommendedPrice = [...priceCurve].sort((a, b) => b.revenue_proxy - a.revenue_proxy)[0];
  const purchaseLift = Number((recommendedPrice.purchase_probability - referencePrice.purchase_probability).toFixed(1));
  const revenueLift = Number(((recommendedPrice.revenue_proxy / referencePrice.revenue_proxy - 1) * 100).toFixed(1));
  const segmentOpportunityRows = foodJson.segments.map((item) => ({ segment: locale === "zh" ? item.name : SEGMENT_LABEL_EN[item.code], score: Number(Math.max(0, Math.min(100, (foodJson.opportunity_heatmap.find((row) => row.category === category && row.segment === item.code)?.opportunity_score ?? 0) + marketProfile.opportunityShift)).toFixed(1)), active: item.code === segment }));
  const launchRows = [
    { scenario: tr(locale, "当前方案", "Current"), probability: purchaseProbability },
    { scenario: tr(locale, "价格−5", "Price −5"), probability: Number(Math.min(95, purchaseProbability + 1.45).toFixed(1)) },
    { scenario: tr(locale, "可见度+10", "Visibility +10"), probability: Number(Math.min(95, purchaseProbability + 1.3).toFixed(1)) },
    { scenario: tr(locale, "口味匹配+10", "Taste fit +10"), probability: Number(Math.min(95, purchaseProbability + 1.9).toFixed(1)) },
  ];

  const decisionItems: Array<{ key: ProductDecisionKey; label: string; question: string; value: string; unit: string; recommendation: string; evidence: string; model: string; outcome: string; status: string }> = [
    { key: "opportunity", label: tr(locale, "市场进入", "Market entry"), question: tr(locale, "优先进入哪个人群？", "Which segment first?"), value: `${opportunity}`, unit: tr(locale, "机会指数", "opportunity score"), recommendation: tr(locale, `优先验证${selectedSegment.name}对${selectedCategory.name}的需求强度。`, `Prioritize ${SEGMENT_LABEL_EN[segment]} for ${CATEGORY_LABEL_EN[category]}.`), evidence: tr(locale, `${marketProfile.zh} × ${selectedCategory.name} × ${selectedSegment.name}`, `${marketProfile.en} × ${CATEGORY_LABEL_EN[category]} × ${SEGMENT_LABEL_EN[segment]}`), model: tr(locale, "加权交叉分析 + 分层贝叶斯", "Weighted analysis + hierarchical Bayes"), outcome: tr(locale, "下一期机会分、渗透率与购买频次", "Next-wave opportunity, penetration and frequency"), status: tr(locale, "建议验证", "Validate") },
    { key: "price", label: tr(locale, "价格与促销", "Price & promotion"), question: tr(locale, "先测试什么价格？", "Which price first?"), value: `${recommendedPrice.price_index}`, unit: tr(locale, "%品类基准", "% of category reference"), recommendation: tr(locale, `先测试相对价格指数${recommendedPrice.price_index}；预测购买概率${recommendedPrice.purchase_probability}%。`, `Test price index ${recommendedPrice.price_index}; predicted purchase is ${recommendedPrice.purchase_probability}%.`), evidence: tr(locale, `较参考情景：购买概率${purchaseLift >= 0 ? "+" : ""}${purchaseLift} pts · 收入代理${revenueLift >= 0 ? "+" : ""}${revenueLift}%`, `Vs reference: purchase ${purchaseLift >= 0 ? "+" : ""}${purchaseLift} pts · revenue proxy ${revenueLift >= 0 ? "+" : ""}${revenueLift}%`), model: tr(locale, "离散选择 + 价格响应曲线", "Discrete choice + price response"), outcome: tr(locale, "实际件数、销售额、毛利与促销增量", "Actual units, sales, margin and promo lift"), status: tr(locale, "优先处理", "Priority") },
    { key: "assortment", label: tr(locale, "商品组合", "Assortment"), question: tr(locale, "引入或替换哪些SKU？", "Which SKUs to add or replace?"), value: `${prioritySkus.length}`, unit: tr(locale, `/${filteredSkus.length}个候选`, `/${filteredSkus.length} candidates`), recommendation: topSku ? tr(locale, `首测${topSku.product_name}；建议为${selectedCategory.name}配置${shelfShare}/100排面。`, `Test ${topSku.product_name} first; allocate ${shelfShare}/100 facings to ${CATEGORY_LABEL_EN[category]}.`) : tr(locale, "补充候选SKU后重新计算。", "Add candidate SKUs and rerun."), evidence: topSku ? tr(locale, `增量触达${topSku.incremental_reach_index} · 替代风险${topSku.substitution_risk_index} · 组合分${topSku.assortment_score}`, `Incremental reach ${topSku.incremental_reach_index} · substitution risk ${topSku.substitution_risk_index} · score ${topSku.assortment_score}`) : "—", model: tr(locale, "选择模型 + 容量约束组合优化", "Choice model + capacity-constrained optimization"), outcome: tr(locale, "门店周转、缺货、毛利与品类净增量", "Store velocity, OOS, margin and category lift"), status: tr(locale, "建议验证", "Validate") },
    { key: "launch", label: tr(locale, "新品方案", "Innovation"), question: tr(locale, "方案是否进入下一轮？", "Advance the concept?"), value: `${purchaseProbability}%`, unit: tr(locale, "预测购买概率", "predicted purchase"), recommendation: tr(locale, `${selectedCategory.name}方案先优化口味匹配，再进入产品与货架验证。`, `Improve taste fit before product and shelf validation.`), evidence: tr(locale, `当前组合：${selectedSegment.name} × ${selectedChannel.name}`, `Current combination: ${SEGMENT_LABEL_EN[segment]} × ${CHANNEL_LABEL_EN[channel]}`), model: tr(locale, "概念—产品联合预测", "Concept-product joint prediction"), outcome: tr(locale, "实际试购、复购、来源替代与上市销售", "Actual trial, repeat, source of volume and sales"), status: tr(locale, "优化后验证", "Optimize") },
  ];
  const activeDecision = decisionItems.find((item) => item.key === decisionKey)!;

  let visual: React.ReactNode;
  if (decisionKey === "opportunity") {
    visual = <ResponsiveContainer width="100%" height="100%"><BarChart data={[...segmentOpportunityRows].sort((a, b) => b.score - a.score)} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 18 }}><CartesianGrid stroke="#e5e8ee" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="segment" width={locale === "zh" ? 80 : 130} tick={{ fontSize: 8 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="score" name={tr(locale, "机会指数", "Opportunity score")} radius={[0, 3, 3, 0]}>{[...segmentOpportunityRows].sort((a, b) => b.score - a.score).map((item) => <Cell key={item.segment} fill={item.active ? "#0aa59e" : "#2639a5"} opacity={item.active ? 1 : .58} />)}</Bar></BarChart></ResponsiveContainer>;
  } else if (decisionKey === "price") {
    visual = <ResponsiveContainer width="100%" height="100%"><LineChart data={priceCurve} margin={{ top: 12, right: 28, bottom: 20, left: 0 }}><CartesianGrid stroke="#e5e8ee" vertical={false} /><XAxis dataKey="price_index" tick={{ fontSize: 9 }} label={{ value: tr(locale, "相对价格指数", "Relative price index"), position: "insideBottom", offset: -12, fontSize: 9 }} /><YAxis domain={[0, 70]} unit="%" tick={{ fontSize: 9 }} /><Tooltip content={<ChartTooltip />} /><ReferenceLine x={recommendedPrice.price_index} stroke="#ef9c2c" strokeWidth={2} /><Line dataKey="purchase_probability" name={tr(locale, "购买概率", "Purchase probability")} stroke="#2639a5" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>;
  } else if (decisionKey === "assortment") {
    visual = <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 24, bottom: 20, left: 0 }}><CartesianGrid stroke="#e5e8ee" /><XAxis type="number" dataKey="x" name={tr(locale, "替代风险", "Substitution risk")} domain={[0, 100]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="y" name={tr(locale, "增量触达", "Incremental reach")} domain={[0, 100]} tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="z" range={[70, 480]} /><ReferenceLine x={averageSubstitution} stroke="#ef9c2c" strokeDasharray="4 4" /><ReferenceLine y={averageIncremental} stroke="#0aa59e" strokeDasharray="4 4" /><Tooltip content={({ active, payload }) => { const point = payload?.[0]?.payload as (typeof assortmentPoints)[number] | undefined; return active && point ? <div className="fnb-tooltip"><strong>{point.product_name}</strong><span>{tr(locale, "增量触达", "Incremental reach")}：{point.incremental_reach_index}</span><span>{tr(locale, "替代风险", "Substitution risk")}：{point.substitution_risk_index}</span><span>{tr(locale, "组合分", "Portfolio score")}：{point.assortment_score}</span></div> : null; }} /><Scatter data={assortmentPoints} fill="#2639a5" /></ScatterChart></ResponsiveContainer>;
  } else {
    visual = <ResponsiveContainer width="100%" height="100%"><BarChart data={launchRows} margin={{ top: 12, right: 18, bottom: 10, left: 0 }}><CartesianGrid stroke="#e5e8ee" vertical={false} /><XAxis dataKey="scenario" tick={{ fontSize: 8 }} /><YAxis domain={[0, 70]} unit="%" tick={{ fontSize: 9 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="probability" name={tr(locale, "购买概率", "Purchase probability")} radius={[3, 3, 0, 0]}>{launchRows.map((item, index) => <Cell key={item.scenario} fill={index === 3 ? "#0aa59e" : "#2639a5"} opacity={index === 3 ? 1 : .62} />)}</Bar></BarChart></ResponsiveContainer>;
  }

  return <div className="fnb-tab-stack">
    <section className="fnb-product-hero">
      <div><span>PACKAGED FOOD DECISION SUBSCRIPTION</span><h2>{tr(locale, "包装食品与饮料决策订阅", "Packaged food & beverage decision subscription")}</h2><p>{tr(locale, `面向${audience}持续回答市场进入、定价、商品组合与新品四类高频决策，并用下一期和经营结果复核。`, `A recurring decision product for ${AUDIENCE_LABEL_EN[audience]}: market entry, pricing, assortment and innovation, verified with future waves and business outcomes.`)}</p></div>
      <aside><span>{tr(locale, "年度方案", "Annual plan")}</span><strong>{foodJson.service_model.standard.price_assumption}</strong><p>{tr(locale, "1个核心品类 · 3类渠道 · 中国市场", "One core category · three channels · China")}</p></aside>
    </section>

    <section className="fnb-decision-inbox">
      <header><div><span>DECISION QUEUE</span><h3>{tr(locale, "当前筛选下需要处理的四项决策", "Four decisions for the current selection")}</h3></div><SimulationTag>{tr(locale, "模拟模型结果", "Simulated model output")}</SimulationTag></header>
      <nav>{decisionItems.map((item, index) => <button type="button" className={decisionKey === item.key ? "active" : ""} onClick={() => setDecisionKey(item.key)} key={item.key}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.label}</span><strong>{item.value}<small>{item.unit}</small></strong><em>{item.status}</em></button>)}</nav>
    </section>

    <section className="fnb-decision-canvas">
      <article className="fnb-decision-visual"><header><div><span>{activeDecision.label.toUpperCase()}</span><h3>{activeDecision.question}</h3></div><b>{activeDecision.model}</b></header><div className="chart">{visual}</div><footer>{activeDecision.evidence}</footer></article>
      <aside><span>RECOMMENDATION</span><h3>{activeDecision.recommendation}</h3><div><small>{activeDecision.unit}</small><strong>{activeDecision.value}</strong></div><dl><div><dt>{tr(locale, "当前证据", "Evidence")}</dt><dd>{activeDecision.evidence}</dd></div><div><dt>{tr(locale, "结果验证", "Outcome check")}</dt><dd>{activeDecision.outcome}</dd></div></dl><button type="button" onClick={() => setDecisionKey(decisionKey === "launch" ? "opportunity" : decisionItems[decisionItems.findIndex((item) => item.key === decisionKey) + 1].key)}>{tr(locale, "查看下一项决策", "Next decision")} <b>→</b></button></aside>
    </section>

    <section className="fnb-subscription-package">
      <header><div><span>WHAT THE PLAN DELIVERS</span><h3>{tr(locale, "持续交付，不是一次性报告", "A recurring product, not a one-off report")}</h3></div><strong>{tr(locale, foodJson.service_model.standard.cadence, "Monthly product observation · quarterly consumer update · annual review")}</strong></header>
      <div className="fnb-package-grid">{foodJson.service_model.standard.includes.map((item, index) => <article key={item}><b>{String(index + 1).padStart(2, "0")}</b><p>{item}</p></article>)}</div>
      <footer>{foodJson.release_calendar.map((item) => <div key={item.cadence}><b>{item.cadence}</b><strong>{item.release}</strong><span>{item.content}</span></div>)}</footer>
    </section>
  </div>;
}

export default function PackagedFoodBeverageDashboard() {
  const [tab, setTab] = useState<Tab>("市场机会");
  const [category, setCategory] = useState("puffed");
  const [channel, setChannel] = useState("snack_chain");
  const [segment, setSegment] = useState("value_family");
  const [audience, setAudience] = useState<AudienceMode>("渠道商");
  const [locale, setLocale] = useState<Locale>("zh");
  const [marketScope, setMarketScope] = useState<MarketScope>("china");
  const [market, setMarket] = useState<MarketCode>("CN");
  const availableMarkets = MARKET_PROFILES.filter((item) => item.scope === marketScope);
  const marketProfile = MARKET_PROFILES.find((item) => item.code === market)!;

  function changeMarketScope(scope: MarketScope) {
    setMarketScope(scope);
    setMarket(scope === "china" ? "CN" : "US");
  }

  const audienceAnswer: Record<AudienceMode, { decision: string; output: string }> = {
    "成长品牌": { decision: "定什么产品、什么价格，怎样向渠道证明上架价值", output: "价格带空档 · 目标人群 · 渠道证据页 · 新品快速筛查" },
    "渠道商": { decision: "引入、保留或淘汰哪些SKU，货架如何分配", output: "TOP100商品池 · 增量触达 · 替代风险 · 排面方案" },
    "大客户": { decision: "如何把概念、产品、包装、定价与上市结果连成闭环", output: "定制研究 · 情景模拟 · 门店实验 · 销售结果回流" },
  };

  return <main className="fnb-shell">
    <Header locale={locale} setLocale={setLocale} />
    <section className="fnb-workspace">
      <nav className="fnb-tabs" aria-label="行业数据模块">{TABS.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{locale === "zh" ? item : TAB_LABEL_EN[item]}</button>)}</nav>
      {tab === "公开商品观察" ? <section className="fnb-filterbar fnb-observation-filterbar">
        <div><span>{tr(locale, "市场", "Market")}</span><strong>{tr(locale, "中国", "China")}</strong></div>
        <div><span>{tr(locale, "公开来源", "Public source")}</span><strong>{tr(locale, "京东 · 3个零食类目页", "JD.com · 3 snack category pages")}</strong></div>
        <div><span>{tr(locale, "观察日期", "Observed")}</span><strong>2026-08-12</strong></div>
        <div><span>{tr(locale, "数据状态", "Data status")}</span><strong>{tr(locale, `${publicRetailJson.meta.observation_count}条商品观察 · ${publicRetailJson.meta.detail_price_captured_count}条详情价格`, `${publicRetailJson.meta.observation_count} product observations · ${publicRetailJson.meta.detail_price_captured_count} detail prices`)}</strong></div>
        <b className="fnb-observed-tag">{tr(locale, "中国公开观察样本", "China public observation sample")}</b>
      </section> : <section className="fnb-filterbar">
        <label><span>{tr(locale, "研究市场", "Research market")}</span><select value={marketScope} onInput={(event) => changeMarketScope(event.currentTarget.value as MarketScope)} onChange={(event) => changeMarketScope(event.target.value as MarketScope)}><option value="china">{tr(locale, "中国市场", "China")}</option><option value="overseas">{tr(locale, "海外市场（益普索中国服务）", "Overseas · served by Ipsos China")}</option></select></label>
        <label><span>{tr(locale, "国家", "Country")}</span><select value={market} onInput={(event) => setMarket(event.currentTarget.value as MarketCode)} onChange={(event) => setMarket(event.target.value as MarketCode)}>{availableMarkets.map((item) => <option value={item.code} key={item.code}>{locale === "zh" ? item.zh : item.en}</option>)}</select></label>
        <label><span>{tr(locale, "使用角色", "User")}</span><select value={audience} onChange={(event) => setAudience(event.target.value as AudienceMode)}>{(["成长品牌", "渠道商", "大客户"] as AudienceMode[]).map((item) => <option value={item} key={item}>{locale === "zh" ? item : AUDIENCE_LABEL_EN[item]}</option>)}</select></label>
        <label><span>{tr(locale, "品类", "Category")}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{foodJson.categories.map((item) => <option value={item.code} key={item.code}>{locale === "zh" ? item.name : CATEGORY_LABEL_EN[item.code]}</option>)}</select></label>
        <label><span>{tr(locale, "渠道类型", "Channel")}</span><select value={channel} onChange={(event) => setChannel(event.target.value)}>{foodJson.channels.map((item) => <option value={item.code} key={item.code}>{locale === "zh" ? item.name : CHANNEL_LABEL_EN[item.code]}</option>)}</select></label>
        <label><span>{tr(locale, "核心人群", "Core segment")}</span><select value={segment} onChange={(event) => setSegment(event.target.value)}>{foodJson.segments.map((item) => <option value={item.code} key={item.code}>{locale === "zh" ? item.name : SEGMENT_LABEL_EN[item.code]}</option>)}</select></label>
        <div><span>{locale === "zh" ? audienceAnswer[audience].decision : `${AUDIENCE_LABEL_EN[audience]} decision scope · ${marketProfile.en}`}</span><strong>{locale === "zh" ? audienceAnswer[audience].output : "Market evidence · model output · decision scenario · outcome feedback"}</strong></div>
        <SimulationTag>{tr(locale, "模拟模型数据", "Simulated model data")}</SimulationTag>
      </section>}
      {tab === "市场机会" && <MarketOpportunity category={category} channel={channel} segment={segment} audience={audience} />}
      {tab === "公开商品观察" && <PublicRetailObservation />}
      {tab === "商品与价格" && <ProductAndPrice category={category} channel={channel} segment={segment} />}
      {tab === "货架与组合" && <Assortment channel={channel} segment={segment} />}
      {tab === "新品测试" && <InnovationModel category={category} channel={channel} segment={segment} />}
      {tab === "指标与模型" && <MetricsAndModels category={category} channel={channel} segment={segment} locale={locale} market={market} />}
      {tab === "产品方案" && <ProductPlan category={category} channel={channel} segment={segment} audience={audience} locale={locale} market={market} />}
    </section>
    <footer className="fnb-footer"><PlatformBrand compact /><span>{tr(locale, "益普索中国 · 包装食品与饮料行业数据服务", "Ipsos China · Packaged food & beverage data service")}</span><b>{tr(locale, "问卷、采集、指标、模型与结果回写", "Questionnaire, observation, metrics, models and outcome feedback")}</b></footer>
  </main>;
}
