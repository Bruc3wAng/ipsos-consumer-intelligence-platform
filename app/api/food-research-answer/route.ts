import foodJson from "../../../output/packaged-food-beverage/dashboard-data.json";
import chinaOpenFoodJson from "../../../output/packaged-food-beverage/open-food-facts-china-snacks-sample.json";
import publicRetailJson from "../../../output/packaged-food-beverage/public-retail-observations.json";

type Evidence = { label: string; value: string; source: string };
type FoodAnswer = {
  title: string;
  answer: string;
  points: string[];
  sources: string[];
  boundary: string;
  evidence: Evidence[];
  matchedBy: string;
  dataLabel: string;
};

const categoryNames = Object.fromEntries(foodJson.categories.map((item) => [item.code, item.name]));
const channelNames = Object.fromEntries(foodJson.channels.map((item) => [item.code, item.name]));

function categoryFrom(query: string, fallback?: string) {
  return foodJson.categories.find((item) => query.includes(item.name))?.code ?? fallback ?? "puffed";
}

function channelFrom(query: string, fallback?: string) {
  const profile = foodJson.channel_profiles.find((item) => query.includes(item.name));
  if (profile) return profile.channel;
  return foodJson.channels.find((item) => query.includes(item.name))?.code ?? fallback ?? "snack_chain";
}

function priceAnswer(query: string, fallbackCategory?: string, fallbackChannel?: string): FoodAnswer {
  const category = categoryFrom(query, fallbackCategory);
  const channel = channelFrom(query, fallbackChannel);
  const rows = foodJson.skus.filter((item) => item.category === category && item.channel === channel).sort((a, b) => a.price_per_100g - b.price_per_100g);
  const quantile = (ratio: number) => rows[Math.min(rows.length - 1, Math.floor(rows.length * ratio))]?.price_per_100g ?? 0;
  const q1 = quantile(.25);
  const median = quantile(.5);
  const q3 = quantile(.75);
  const promoted = rows.filter((item) => item.promo_depth > 0).length;
  return {
    title: `${channelNames[channel]} · ${categoryNames[category]}标准化价格带`,
    answer: `当前模拟商品池共${rows.length}个SKU，每100g价格中间50%为¥${q1}–¥${q3}，中位数¥${median}。`,
    points: [`${promoted}个SKU存在模拟促销深度。`, "建议同时按规格、品牌层级和目标人群查看价格，不用单一均值定价。", "正式版需用连续观察或授权成交数据估计真实价格响应。"],
    sources: [`模拟SKU池 · ${channelNames[channel]} · ${categoryNames[category]}`],
    boundary: foodJson.meta.prohibited_interpretation,
    evidence: [{ label: "SKU数", value: String(rows.length), source: "模拟SKU" }, { label: "中间50%价格带", value: `¥${q1}–¥${q3}/100g`, source: "模拟SKU" }, { label: "价格中位数", value: `¥${median}/100g`, source: "模拟SKU" }],
    matchedBy: "sku_price_distribution",
    dataLabel: "模拟数据",
  };
}

function assortmentAnswer(query: string, fallbackCategory?: string, fallbackChannel?: string): FoodAnswer {
  const category = categoryFrom(query, fallbackCategory);
  const channel = channelFrom(query, fallbackChannel);
  const rows = foodJson.skus.filter((item) => item.category === category && item.channel === channel).sort((a, b) => b.assortment_score - a.assortment_score);
  const top = rows[0];
  const candidates = rows.filter((item) => item.assortment_action === "优先引入");
  return {
    title: `${channelNames[channel]} · ${categoryNames[category]}候选商品组合`,
    answer: `当前模拟池中有${candidates.length}个“优先引入”候选；组合分最高的是${top.product_name}，${top.assortment_score}分。`,
    points: [`最高候选增量触达指数${top.incremental_reach_index}，替代风险指数${top.substitution_risk_index}。`, "推荐排序同时考虑周转、毛利、复购、可见度、可得性和新颖性。", "真实引入/淘汰决策必须接入完整候选池、货架容量和门店-SKU结果。"],
    sources: [`模拟SKU池 · ${channelNames[channel]} · ${categoryNames[category]}`],
    boundary: "组合分不是销量排名；增量触达与替代风险均为模拟指标，不能承诺上架或销售增量。",
    evidence: rows.slice(0, 5).map((item) => ({ label: item.product_name, value: `${item.assortment_score}分`, source: `${item.assortment_action} · ${item.data_label}` })),
    matchedBy: "sku_assortment_shortlist",
    dataLabel: "模拟数据",
  };
}

function modelAnswer(): FoodAnswer {
  const factors = foodJson.model.coefficients.filter((item) => item.source !== "model").sort((a, b) => Math.abs(b.impact_pp) - Math.abs(a.impact_pp));
  return {
    title: "购买选择模型当前识别的关键变量",
    answer: `模拟第4期时间留出AUC=${foodJson.model.test_auc.toFixed(3)}、Brier=${foodJson.model.test_brier.toFixed(3)}；影响幅度最大的三个变量为${factors.slice(0, 3).map((item) => item.label).join("、")}。`,
    points: factors.slice(0, 5).map((item) => `${item.label}：系数${item.coefficient > 0 ? "+" : ""}${item.coefficient.toFixed(3)}，95%区间${item.ci_low.toFixed(3)}–${item.ci_high.toFixed(3)}，单变量情景影响${item.impact_pp > 0 ? "+" : ""}${item.impact_pp.toFixed(1)} pts。`),
    sources: [`${foodJson.model.name} · ${foodJson.model.train_waves}训练N=${foodJson.model.train_n.toLocaleString()} · ${foodJson.model.test_wave}验证N=${foodJson.model.test_n.toLocaleString()}`],
    boundary: foodJson.model.blocked_use,
    evidence: factors.slice(0, 5).map((item) => ({ label: item.label, value: `${item.impact_pp > 0 ? "+" : ""}${item.impact_pp.toFixed(1)} pts`, source: `系数${item.coefficient.toFixed(3)} · 模拟选择任务` })),
    matchedBy: "model_validation_and_coefficients",
    dataLabel: foodJson.model.data_label,
  };
}

function benchmarkAnswer(): FoodAnswer {
  return {
    title: "已登记的外部权威基准",
    answer: `当前接入${foodJson.external_benchmarks.length}项公开基准，用于校验食品消费、线上吃类、饮料和即时零售的方向。`,
    points: foodJson.external_benchmarks.map((item) => `${item.metric}：${item.value}（${item.period}）— ${item.context}`),
    sources: Array.from(new Set(foodJson.external_benchmarks.map((item) => item.source))),
    boundary: "宏观大类口径不能替代零食专项销售额、品牌份额、单一渠道表现或消费者选择数据。",
    evidence: foodJson.external_benchmarks.map((item) => ({ label: item.metric, value: item.value, source: `${item.source} · ${item.period}` })),
    matchedBy: "external_benchmark_register",
    dataLabel: "真实公开数据",
  };
}

function publicObservationAnswer(query: string): FoodAnswer {
  const priceQuestion = /价格|价位|定价|每100/.test(query);
  const requestedCategory = ["膨化食品", "坚果炒货", "干果蜜饯"].find((item) => query.includes(item));
  const observedRows = publicRetailJson.observations.filter((item) => !requestedCategory || item.category === requestedCategory);
  const priceGate = publicRetailJson.quality_gates.find((item) => item.gate_id === "G05");
  const pricedRows = observedRows.filter((item) => item.price_cny != null);
  const exactUnitPrices = pricedRows.map((item) => item.unit_price_per_100g_cny).filter((value): value is number => value != null).sort((a, b) => a - b);
  const quantile = (ratio: number) => exactUnitPrices[Math.min(exactUnitPrices.length - 1, Math.floor(exactUnitPrices.length * ratio))] ?? 0;
  const topBrands = Object.entries(observedRows.reduce<Record<string, number>>((profile, item) => {
    profile[item.brand] = (profile[item.brand] ?? 0) + 1;
    return profile;
  }, {})).map(([name, observed_items]) => ({ name, observed_items })).sort((a, b) => b.observed_items - a.observed_items).slice(0, 6);
  const categoryTitle = requestedCategory ?? "三类零食";
  if (priceQuestion) {
    return {
      title: `${categoryTitle}公开详情页价格样本`,
      answer: `现有${observedRows.length}条公开商品观察中，已取得${pricedRows.length}条当前规格详情价；${exactUnitPrices.length}条可精确标准化，每100g价格中间50%为¥${quantile(.25).toFixed(2)}–¥${quantile(.75).toFixed(2)}，中位数¥${quantile(.5).toFixed(2)}。`,
      points: ["每条价格均绑定SKU、当前规格、采集时间与详情页URL。", `价格覆盖质量门为${priceGate?.value ?? "0%"}，适合描述已采集样本，不外推全市场价格带。`, "会员价、券后价、地区差异和历史价格需增加连续采集字段后再比较。"],
      sources: publicRetailJson.source_registry.filter((item) => item.source_type.includes("公开零售")).map((item) => `${item.publisher} · ${item.retrieved_at}`),
      boundary: priceGate?.implication ?? "仅描述已采集详情页样本，不外推全市场。",
      evidence: [{ label: "详情价格", value: `${pricedRows.length}条`, source: "京东公开详情页" }, { label: "每100g中位数", value: `¥${quantile(.5).toFixed(2)}`, source: `${exactUnitPrices.length}条精确规格` }, { label: "价格覆盖", value: priceGate?.value ?? "0%", source: "食品数据质量门" }],
      matchedBy: "public_observation_price_quality_gate",
      dataLabel: "公开页面观察",
    };
  }
  return {
    title: `${categoryTitle}公开商品观察样本`,
    answer: `当前筛选${observedRows.length}条公开页面商品观察、${new Set(observedRows.map((item) => item.brand)).size}个品牌，其中${pricedRows.length}条已取得当前规格详情价。`,
    points: [
      `${requestedCategory ? publicRetailJson.meta.category_page_totals.find((item) => item.category === requestedCategory)?.label : publicRetailJson.meta.category_page_totals.map((item) => item.label).join("；")}；这些数字只描述各页面当时的类目结果，不作为全市场SKU规模，类目间不得相加。`,
      `观察样本中商品数较多的品牌为${topBrands.map((item) => `${item.name}（${item.observed_items}条）`).join("、")}；这是样本构成，不是销量或份额排名。`,
      `目前可回答商品、规格、包装、评价量级和已采集价格；销售表现、市场份额与上架增量仍需交易或POS结果。`,
    ],
    sources: publicRetailJson.source_registry.filter((item) => item.source_type.includes("公开零售")).map((item) => `${item.publisher} · ${item.retrieved_at}`),
    boundary: "公开页面观察只描述抓取时看得见的商品，不等同于实时在售、全渠道覆盖、销量、销售额或市场份额。",
    evidence: topBrands.map((item) => ({ label: item.name, value: `${item.observed_items}条观察`, source: "公开页面观察样本" })),
    matchedBy: "public_retail_observation_registry",
    dataLabel: "公开页面观察",
  };
}

function openFoodAttributeAnswer(): FoodAnswer {
  const eligible = chinaOpenFoodJson.products.filter((item) => ["eligible_attribute_analysis", "eligible_nutrition_chart_with_gaps"].includes(item.quality_status));
  const chartReady = eligible.filter((item) => item.nutrition_per_100g.energy_kcal != null && item.nutrition_per_100g.sodium_g != null && item.nutrition_per_100g.fat_g != null);
  const average = (key: "energy_kcal" | "sodium_g" | "fat_g" | "sugars_g") => {
    const values = eligible.map((item) => item.nutrition_per_100g[key]).filter((value): value is number => value != null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  const coverage = chinaOpenFoodJson.meta.field_coverage_counts;
  return {
    title: "中国相关开放零食属性样本",
    answer: `开放库在该检索条件下报告${chinaOpenFoodJson.meta.result_count_reported_by_api}条，本次取得前${chinaOpenFoodJson.meta.sample_count}条；其中${coverage.nutrition_chart_eligible}条通过营养质量规则，${chartReady.length}条具备能量、钠和脂肪三项绘图字段，${coverage.invalid_nutrition_excluded}条异常营养记录已排除聚合。`,
    points: [
      `商品名覆盖${coverage.product_name}/${chinaOpenFoodJson.meta.sample_count}，品牌覆盖${coverage.brand}/${chinaOpenFoodJson.meta.sample_count}，规格覆盖${coverage.quantity}/${chinaOpenFoodJson.meta.sample_count}，配料覆盖${coverage.ingredients}/${chinaOpenFoodJson.meta.sample_count}。`,
      `质量合格样本的描述均值为能量${average("energy_kcal").toFixed(0)}kcal/100g、钠${(average("sodium_g") * 1000).toFixed(0)}mg/100g、脂肪${average("fat_g").toFixed(1)}g/100g、糖${average("sugars_g").toFixed(1)}g/100g。`,
      "这些数值用于验证字段结构、异常规则和多变量比较界面，不用于推断中国零食市场整体营养水平。",
    ],
    sources: [`Open Food Facts API · ${chinaOpenFoodJson.meta.retrieved_at} · ${chinaOpenFoodJson.meta.query_scope}`],
    boundary: chinaOpenFoodJson.meta.blocked_use,
    evidence: [
      { label: "公开样本", value: `${chinaOpenFoodJson.meta.sample_count}条`, source: "Open Food Facts API" },
      { label: "营养图准入", value: `${coverage.nutrition_chart_eligible}条`, source: "食品属性质量规则" },
      { label: "图中记录", value: `${chartReady.length}条`, source: "能量+钠+脂肪字段完整" },
      { label: "异常排除", value: `${coverage.invalid_nutrition_excluded}条`, source: "每100g字段范围检查" },
      { label: "配料覆盖", value: `${(coverage.ingredients / chinaOpenFoodJson.meta.sample_count * 100).toFixed(1)}%`, source: `数量${coverage.ingredients}/${chinaOpenFoodJson.meta.sample_count}` },
    ],
    matchedBy: "china_open_food_attribute_quality",
    dataLabel: "公开开放数据样本",
  };
}

function boundaryAnswer(): FoodAnswer {
  return {
    title: "当前原型不能回答真实销量、市场份额或上架增量",
    answer: "现有食品原型包含真实公开宏观基准，以及明确标注的模拟SKU和模拟消费者选择任务；没有渠道POS或品牌成交数据。",
    points: ["真实市场份额需要覆盖明确的POS/交易总体与投影方法。", "真实价格弹性需要价格变化对应的成交量或随机化选择/价格实验。", "真实上架增量需要门店×SKU×周结果、对照门店和促销/缺货/排面信息。"],
    sources: ["包装食品与饮料数据发布边界"],
    boundary: foodJson.meta.prohibited_interpretation,
    evidence: [],
    matchedBy: "unsupported_real_outcome",
    dataLabel: "证据边界",
  };
}

function answer(query: string, category?: string, channel?: string): FoodAnswer {
  if (/真实销量|市场份额|卖了多少|销售额|真实增量|承诺/.test(query)) return boundaryAnswer();
  if (/营养|配料|能量|热量|钠|脂肪|糖|条码|属性/.test(query)) return openFoodAttributeAnswer();
  if (/公开|页面|观察|京东|真实商品|商品规格/.test(query)) return publicObservationAnswer(query);
  if (/国家统计局|外部|权威|基准|宏观/.test(query)) return benchmarkAnswer();
  if (/模型|系数|AUC|Brier|驱动|因素|变量/.test(query)) return modelAnswer();
  if (/货架|组合|引入|保留|移除|淘汰|TOP\s?100|候选/.test(query)) return assortmentAnswer(query, category, channel);
  if (/价格|价位|定价|促销|每100/.test(query)) return priceAnswer(query, category, channel);
  return {
    title: "请把问题落到当前已登记的数据或模型",
    answer: "当前可查询价格带、渠道候选商品、货架组合、模型变量、外部基准与不能回答的真实结果边界。",
    points: foodJson.subscription_workspaces.map((item) => `${item.name}：${item.answers}`),
    sources: ["包装食品与饮料指标字典", "食品行业SQLite证据库"],
    boundary: "没有检索到已登记证据时不补写数字或结论。",
    evidence: [],
    matchedBy: "supported_question_menu",
    dataLabel: "证据导航",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: unknown; category?: unknown; channel?: unknown };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
    if (!query) return Response.json({ error: "请输入食品行业研究问题" }, { status: 400 });
    return Response.json({ mode: "local-food-evidence-retrieval", query, answer: answer(query, typeof body.category === "string" ? body.category : undefined, typeof body.channel === "string" ? body.channel : undefined) });
  } catch {
    return Response.json({ error: "请求内容不是有效JSON" }, { status: 400 });
  }
}
