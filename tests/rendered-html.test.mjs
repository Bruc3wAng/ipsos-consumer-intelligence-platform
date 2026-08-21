import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname.replaceAll("/", "-")}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function renderHtml(pathname) {
  const response = await render(pathname);
  assert.equal(response.status, 200, `${pathname} should render successfully`);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  return response.text();
}

async function researchAnswer(query) {
  const response = await render("/api/research-answer");
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("answer-test", `${process.pid}-${Date.now()}-${query.length}`);
  const { default: worker } = await import(workerUrl.href);
  const result = await worker.fetch(
    new Request("http://localhost/api/research-answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 405);
  assert.equal(result.status, 200);
  return result.json();
}

async function foodResearchAnswer(query, category = "puffed", channel = "snack_chain") {
  const response = await render("/api/food-research-answer");
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("food-answer-test", `${process.pid}-${Date.now()}-${query.length}`);
  const { default: worker } = await import(workerUrl.href);
  const result = await worker.fetch(
    new Request("http://localhost/api/food-research-answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, category, channel }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 405);
  assert.equal(result.status, 200);
  return result.json();
}

async function pcPlatformQuery(payload) {
  const response = await render("/api/pc-platform-query");
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("pc-platform-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const result = await worker.fetch(
    new Request("http://localhost/api/pc-platform-query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 405);
  assert.equal(result.status, 200);
  return result.json();
}

const blockedDisplayTerms = /合同|报价|预算|发票|付款|收款|结算|金额|供应商|审价|核销|invoice|contract|quotation|payment|budget|\bfee\b|\bPO\b/i;

test("renders the global Ipsos industry gateway", async () => {
  const html = await renderHtml("/");

  assert.match(html, /<title>Ipsos Consumer Intelligence<\/title>/i);
  assert.match(html, /全球消费者洞察与模型平台/);
  assert.match(html, /行业赛道/);
  assert.match(html, /科技 · 媒体 · 通信/);
  assert.match(html, /零售业/);
  assert.match(html, /href="\/tmt"/);
  assert.match(html, /href="\/retail"/);
  assert.doesNotMatch(html, /包装食品与饮料/);
  assert.doesNotMatch(html, /TMT 洞察与模型平台|研究型大模型|从行业模型，到客户决策/);
  assert.match(html, /全球研究网络交互式三维地球/);
  assert.match(html, /src="\/ipsos-logo\.png"/);
  assert.doesNotMatch(html, /System ready|结构已预留|领导审阅|未被证明|Intelligence Foundry/);
});

test("keeps the snack category intelligence product under the retail industry", async () => {
  const html = await renderHtml("/retail");

  assert.match(html, /零售业消费者洞察与模型平台/);
  assert.match(html, /品类数据产品/);
  assert.match(html, /零食消费与品类决策/);
  assert.match(html, /href="\/packaged-food-beverage"/);
  assert.match(html, /膨化食品/);
  assert.match(html, /坚果炒货/);
  assert.match(html, /干果蜜饯/);
});

test("keeps TMT at client-workspace selection level", async () => {
  const html = await renderHtml("/tmt");

  assert.match(html, /消费者洞察与模型平台/);
  assert.match(html, /先进入客户项目空间，再选择具体研究项目与模型/);
  assert.match(html, /选择客户项目空间/);
  assert.match(html, /根据研究设计选择模型/);
  assert.match(html, /数码3C行业消费者数据库与预测/);
  assert.match(html, /href="\/tmt\/consumer-electronics"/);
  assert.match(html, /href="\/clients\/lenovo"/);
  assert.match(html, /href="\/clients\/bytedance"/);
  assert.doesNotMatch(html, /href="\/clients\/bytedance\/ecosystem"/);
  assert.doesNotMatch(html, /href="\/clients\/bytedance\/search-awareness"/);
  assert.doesNotMatch(html, /TT及外部竞品生态满意度调研|TikTok Search Awareness Tracking/);
  assert.match(html, /src="\/ipsos-logo\.png"/);
  assert.match(html, /src="\/lenovo-logo\.svg"/);
  assert.match(html, /src="\/bytedance-logo\.svg"/);
  assert.doesNotMatch(
    html,
    /System ready|结构已预留|领导审阅|未被证明|Intelligence Foundry/,
  );
});

test("renders the brand-neutral consumer electronics industry dashboard", async () => {
  const html = await renderHtml("/tmt/consumer-electronics");

  assert.match(html, /数码3C行业大盘/);
  assert.match(html, /PC \/ AI PC/);
  assert.match(html, /数码相机 \/ 运动相机/);
  assert.match(html, /区域/);
  assert.match(html, /中国/);
  assert.match(html, /海外/);
  assert.match(html, /中国与海外市场分层对比/);
  assert.match(html, /未来12个月购买意向/);
  assert.match(html, /模型与样本/);
  assert.match(html, /研究设计Agent/);
});

test("registers the expanded Lenovo PC metric system and historical observations", () => {
  const metricPath = new URL("../output/lenovo-pc-intelligence/pc-metric-system-v2.json", import.meta.url);
  const observationPath = new URL("../output/lenovo-pc-intelligence/historical-metric-observations.json", import.meta.url);
  const metricSystem = JSON.parse(readFileSync(metricPath, "utf8"));
  const observations = JSON.parse(readFileSync(observationPath, "utf8"));
  const q713 = metricSystem.metrics.find((item) => item.metric_key === "bht_consumer_q713");
  const q713Lenovo = observations.observations.filter((item) => item.metric_key === "bht_consumer_q713" && /^联想\b|^联想\s/.test(item.segment_value));

  assert.equal(metricSystem.meta.metric_count, 119);
  assert.equal(metricSystem.meta.historical_question_series_added, 77);
  assert.equal(new Set(metricSystem.metrics.map((item) => item.metric_key)).size, 119);
  assert.deepEqual(metricSystem.meta.audiences, ["大众消费者", "SMB", "政企大客户", "AIPC进店用户"]);
  assert.equal(q713.audience, "大众消费者");
  assert.equal(q713.question, "Q713");
  assert.equal(q713.wave_count, 4);
  assert.deepEqual(q713.base_range, { min: 2400, max: 3531 });
  assert.equal(q713.model_readiness, "tracking_model_ready");
  assert.equal(observations.meta.observation_count, 5134);
  assert.equal(observations.meta.metric_series_count, 77);
  assert.deepEqual(q713Lenovo.map((item) => item.value), [52, 51, 62, 58]);
});

test("loads the complete delivered PC platform aggregate layer", () => {
  const indexPath = new URL("../output/lenovo-pc-intelligence/platform-pc-dashboard-index.json", import.meta.url);
  const manifestPath = new URL("../output/lenovo-pc-intelligence/database-manifest.json", import.meta.url);
  const catalogPath = new URL("../output/lenovo-pc-intelligence/asset-catalog.json", import.meta.url);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

  assert.equal(index.meta.counts.observations, 25608);
  assert.equal(index.meta.counts.audiences, 3);
  assert.equal(index.meta.counts.product_spaces, 8);
  assert.equal(index.meta.counts.sheets, 26);
  assert.equal(index.meta.counts.waves, 37);
  assert.equal(manifest.table_counts.research_platform_pc_observations, 25608);
  assert.equal(catalog.asset_count, 375);
  assert.equal(catalog.by_type.respondent_data, 55);
  assert.equal(catalog.by_type.platform_table, 18);
  assert.equal(catalog.excluded_by_reason.exclude_mixed_commercial_research, 2);
});

test("enforces the population-weighting and absolute-projection gate", () => {
  const gatePath = new URL("../output/lenovo-pc-intelligence/pc-population-projection-gate.json", import.meta.url);
  const manifestPath = new URL("../output/lenovo-pc-intelligence/database-manifest.json", import.meta.url);
  const componentPath = new URL("../app/components/ConsumerElectronicsIndustryDashboard.tsx", import.meta.url);
  const payload = JSON.parse(readFileSync(gatePath, "utf8"));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const gender = payload.quota_margins.find((item) => item.dimension === "性别");

  assert.deepEqual(payload.meta.gate_summary, { passed: 3, pending: 1, blocked: 4, total: 8 });
  assert.equal(payload.target_population.sample_n, 1000);
  assert.deepEqual(gender.categories.map((item) => [item.category, item.sample_share, item.sample_n]), [["男", 50, 500], ["女", 50, 500]]);
  assert.equal(payload.gender_calibration_demo.effective_n, 999.58);
  assert.ok(payload.output_policy.blocked.some((item) => item.includes("机械乘100")));
  assert.equal(manifest.table_counts.research_population_projection_gates, 8);
  assert.equal(manifest.table_counts.research_population_benchmarks, 4);
  assert.match(component, /样本能回答到哪一步，大盘人数何时才能发布/);
  assert.match(component, /当前可发布总体人数/);
});

test("queries delivered AI PC trends by audience, indicator and brand", async () => {
  const payload = await pcPlatformQuery({
    audience: "大众消费者",
    productSpace: "AI PC",
    sheet: "AI PC",
    indicatorGroup: "提示后总认知",
    brand: "联想",
    wave: "全部期次",
  });

  assert.equal(payload.summary.matched, 9);
  assert.equal(payload.summary.series, 1);
  assert.equal(payload.summary.latest_wave, "26 Jun");
  assert.equal(payload.latest[0].value, 36);
  assert.equal(payload.latest[0].base_unweighted, 2000);
  assert.match(payload.boundary, /不同研究受众的Base不相加/);
});

test("answers FY26 AI PC questions from the complete platform evidence layer", async () => {
  const payload = await researchAnswer("大众消费者联想AI PC提示后总认知趋势？");

  assert.equal(payload.answer.matchedBy, "platform_pc:longitudinal_aggregate");
  assert.match(payload.answer.answer, /26 Jun为 36\.0%/);
  assert.match(payload.answer.answer, /N=2,000/);
  assert.ok(payload.answer.evidence.length >= 5);
  assert.match(payload.answer.boundary, /Base不相加/);
});

test("renders the global snack intelligence product with market hierarchy and evidence labels", async () => {
  const html = await renderHtml("/packaged-food-beverage");

  assert.match(html, /全球零食消费者与品类决策平台/);
  assert.match(html, /以中国为深度研究市场/);
  assert.match(html, /益普索中国/);
  assert.match(html, /数据范围/);
  assert.match(html, /中国 \+ 24个海外市场/);
  assert.match(html, />中</);
  assert.match(html, />EN</);
  assert.match(html, /全球市场/);
  assert.match(html, /消费者洞察/);
  assert.match(html, /产品与价格/);
  assert.match(html, /渠道与货架/);
  assert.match(html, /新品决策/);
  assert.match(html, /数据中心/);
  assert.match(html, /通用数据产品/);
  assert.match(html, /项目专项工作台/);
  assert.match(html, /成果示例/);
  assert.match(html, /行业级持续数据/);
  assert.match(html, /品牌与产品决策/);
  assert.match(html, /市场范围/);
  assert.match(html, /海外区域/);
  assert.match(html, /国家 \/ 市场/);
  assert.match(html, /当前机会判断/);
  assert.match(html, /World Bank/);
  assert.doesNotMatch(html, /互联网使用率|沙特CST/);
  assert.doesNotMatch(html, /用零食行业验证|攻坚样板|当前验证场|零食行业产品验证/);
  assert.doesNotMatch(html, /真实销量榜|真实市场份额排名/);
});

test("builds a 25-market global snack data registry without inventing market demand", () => {
  const atlasPath = new URL("../output/packaged-food-beverage/global-snack-market-atlas.json", import.meta.url);
  const payload = JSON.parse(readFileSync(atlasPath, "utf8"));

  assert.equal(payload.markets.length, 25);
  assert.equal(payload.meta.region_count, 7);
  assert.equal(payload.meta.trade_market_count, 21);
  assert.equal(payload.meta.trade_record_count, 84);
  assert.equal(payload.meta.product_attribute_market_count, 6);
  assert.equal(payload.meta.product_attribute_record_count, 260);
  assert.deepEqual(payload.meta.trade_missing_markets, ["FR", "CH", "VN", "AE"]);
  assert.equal(payload.trade_proxy_dictionary.length, 4);
  assert.match(payload.meta.scope, /不是全球零食市场规模数据库/);
  assert.ok(payload.markets.every((market) => market.macro.population?.value > 0));
  assert.ok(payload.markets.every((market) => market.macro.gdp_per_capita_usd?.value > 0));
  assert.ok(payload.markets.every((market) => market.macro.household_consumption_pc_2015_usd?.value > 0));
  assert.ok(payload.markets.every((market) => market.macro.household_consumption_pc_2015_usd?.source_url.includes("NE.CON.PRVT.PC.KD")));
  assert.ok(payload.markets.every((market) => market.macro.internet_users_pct?.value > 0));
  const saudiInternet = payload.markets.find((market) => market.code === "SA").macro.internet_users_pct;
  const uaeInternet = payload.markets.find((market) => market.code === "AE").macro.internet_users_pct;
  assert.equal(saudiInternet.value, 100);
  assert.equal(saudiInternet.analysis_value, 99);
  assert.equal(saudiInternet.analysis_period, "2024");
  assert.equal(saudiInternet.verification_status, "official_source_conflict");
  assert.equal(saudiInternet.source_conflict, true);
  assert.match(saudiInternet.analysis_source, /Saudi CST/);
  assert.match(saudiInternet.analysis_source_url, /cst\.gov\.sa/);
  assert.equal(uaeInternet.value, 100);
  assert.equal(uaeInternet.analysis_value, null);
  assert.equal(uaeInternet.verification_status, "boundary_value_review_required");
  assert.equal(payload.meta.national_indicator_check_count, 1);
  assert.equal(payload.meta.indicator_source_conflict_count, 1);
  assert.equal(payload.meta.indicator_boundary_review_count, 1);
  assert.equal(payload.markets.filter((market) => market.data_layers.consumer_survey === "simulated_baseline").length, 1);
  assert.ok(payload.markets.filter((market) => market.code !== "CN").every((market) => market.data_layers.consumer_survey === "not_fielded"));
  assert.ok(payload.markets.every((market) => market.data_layers.business_outcomes === "not_connected"));
  assert.equal(payload.markets.filter((market) => market.trade_proxy.status === "available").length, 21);
  assert.deepEqual(payload.markets.filter((market) => market.data_layers.public_product_attributes === "bounded_open_sample").map((market) => market.code), ["CN", "US", "UK", "JP", "KR", "BR"]);
  assert.ok(payload.markets.filter((market) => market.trade_proxy.status === "available").every((market) => market.trade_proxy.record_count === 4));
  assert.match(payload.markets.find((market) => market.code === "US").trade_proxy.boundary_zh, /不是零食市场规模/);
  assert.ok(["US", "UK", "DE", "JP", "KR", "ID", "TH", "VN", "BR", "SA"].every((code) => payload.markets.some((market) => market.code === code)));
});

test("builds a China-first questionnaire, KPI and model pipeline from labeled simulation", () => {
  const questionnairePath = new URL("../output/packaged-food-beverage/china-snack-questionnaire-template.json", import.meta.url);
  const kpiPath = new URL("../output/packaged-food-beverage/china-snack-kpi-system.json", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const questionnaireWorkbookPath = new URL("../public/downloads/零食消费者研究_问卷确认稿-20260817.xlsx", import.meta.url);
  const independentQuotaPath = new URL("../public/downloads/零食消费者研究_独立配额表-20260817.xlsx", import.meta.url);
  const crossQuotaPath = new URL("../public/downloads/零食消费者研究_核心交叉配额表-20260817.xlsx", import.meta.url);
  const boostQuotaPath = new URL("../public/downloads/零食消费者研究_重点人群增样配额表-20260817.xlsx", import.meta.url);
  const dpSpecPath = new URL("../public/downloads/零食消费者研究_DP_Spec-20260817.xlsx", import.meta.url);
  const internalQcPath = new URL("../output/packaged-food-beverage/research-operations/零食消费者研究_Raw_Data_QC-20260817.xlsx", import.meta.url);
  const oldCombinedPath = new URL("../public/downloads/china-snack-questionnaire-template.xlsx", import.meta.url);
  const questionnaire = JSON.parse(readFileSync(questionnairePath, "utf8"));
  const payload = JSON.parse(readFileSync(kpiPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");

  assert.equal(questionnaire.meta.market, "中国");
  assert.equal(questionnaire.meta.deep_dive_category, "膨化食品");
  assert.equal(questionnaire.questions.length, 18);
  assert.equal(questionnaire.sample_plan.prototype_n, 5000);
  assert.match(questionnaire.sample_plan.quota_status, /模拟配额假设/);
  assert.ok(questionnaire.questions.every((item) => item.question_id && item.base && item.response_type));
  const metricIds = new Set(payload.metric_definitions.map((item) => item.metric_id));
  assert.equal(metricIds.size, 17);
  assert.ok(questionnaire.questions.flatMap((item) => item.kpi_ids).every((metricId) => metricIds.has(metricId)));
  assert.equal(payload.meta.respondent_count, 5000);
  assert.equal(payload.meta.dce_task_count, 40000);
  assert.equal(payload.quality_profile.duplicate_respondent_ids, 0);
  assert.equal(payload.quality_profile.missing_required_rows, 0);
  assert.equal(payload.quality_profile.routing_violations, 0);
  assert.equal(payload.quality_profile.price_monotonicity_violations, 0);
  assert.ok(payload.overall_kpis.penetration_3m > payload.overall_kpis.monthly_buyer_rate);
  assert.deepEqual(payload.price_curve.map((item) => item.price_cny), [5.9, 7.9, 9.9, 11.9]);
  assert.ok(payload.price_curve.every((item, index, rows) => index === 0 || item.acceptance_rate <= rows[index - 1].acceptance_rate));
  assert.ok(payload.models.purchase_propensity.test_auc > 0.65);
  assert.equal(payload.models.discrete_choice.task_n, 40000);
  assert.equal(payload.models.discrete_choice.scenario_shares.length, 3);
  assert.equal(payload.models.discrete_choice.scenario_shares.reduce((total, item) => total + item.relative_choice_share, 0), 100);
  assert.match(payload.meta.blocked_use, /不得作为中国市场真实渗透率/);
  assert.match(component, /KPI总览/);
  assert.match(component, /项目启动/);
  assert.match(component, /问卷与指标/);
  assert.match(component, /模型输出/);
  assert.match(component, /问卷、配额与DP Spec分别设计/);
  assert.match(component, /输入业务问题，生成研究方案与交付清单/);
  assert.match(component, /生成研究方案/);
  assert.match(component, /下载Final问卷/);
  assert.match(component, /下载配额表/);
  assert.match(component, /下载DP Spec/);
  assert.match(component, /问卷设计/);
  assert.match(component, /受访者预览/);
  assert.match(component, /条件路由/);
  assert.match(component, /questionnaire-impact-ledger/);
  assert.match(component, /FINAL-R/);
  assert.match(component, /配额设计/);
  assert.match(component, /核心交叉配额/);
  assert.match(component, /本次问卷与模型路线的生成依据/);
  assert.match(component, /AI RESEARCH ROUTING/);
  assert.match(component, /从业务问题确定研究任务、模型与可交付结果/);
  assert.match(component, /AI推荐并采用/);
  assert.match(component, /分阶段可以产出什么/);
  assert.match(component, /routeResearchBrief/);
  assert.match(component, /buildResearchProjectPlan/);
  assert.match(component, /EVIDENCE INVENTORY/);
  assert.match(component, /RESEARCH QUALITY LAYER/);
  assert.match(component, /DELIVERY MANIFEST/);
  assert.match(component, /模型训练门槛/);
  assert.match(component, /研究内容检索与推荐排序/);
  for (const workbookPath of [questionnaireWorkbookPath, independentQuotaPath, crossQuotaPath, boostQuotaPath, dpSpecPath, internalQcPath]) {
    assert.equal(readFileSync(workbookPath).subarray(0, 2).toString(), "PK");
  }
  assert.equal(existsSync(oldCombinedPath), false);
});

test("rebuilds step 04 tables and a holdout model from the uploaded Raw structure", async () => {
  const rawPath = new URL("../output/packaged-food-beverage/cracker-concept-simulated-raw.csv", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const routePath = new URL("../app/api/research-operations/raw-production/route.ts", import.meta.url);
  const { buildRawProductionResult } = await import("../app/lib/rawDataProduction.ts");
  const payload = buildRawProductionResult(readFileSync(rawPath, "utf8"), "cracker.csv");
  const component = readFileSync(componentPath, "utf8");
  const route = readFileSync(routePath, "utf8");

  assert.equal(payload.meta.status, "ready");
  assert.equal(payload.meta.rowCount, 5000);
  assert.equal(payload.meta.eligibleRowCount, 5000);
  assert.equal(payload.structuralChecks.duplicateRespondentIds, 0);
  assert.equal(payload.structuralChecks.invalidWeights, 0);
  assert.equal(payload.structuralChecks.metricCount, 55);
  assert.equal(payload.table.rows[0].metrics.penetration_3m.percent, 59.3);
  assert.equal(payload.table.rows[0].metrics.price_accept_reference.percent, 86.4);
  assert.equal(payload.table.rows[0].metrics.concept_trial_t2b.percent, 29.8);
  assert.ok(payload.table.rows[0].metrics.monthly_frequency_mean.mean > 0);
  assert.ok(payload.table.rows[0].metrics.monthly_frequency_median.median > 0);
  assert.ok(payload.table.rows[0].metrics.importance_taste_t2b.percent > 0);
  assert.ok(payload.table.rows[0].metrics.satisfaction_taste_b2b.percent >= 0);
  assert.equal(new Set(payload.preview.headers).size, payload.preview.headers.length);
  assert.equal(payload.preview.headers.filter((header) => header === "monthly_frequency").length, 1);
  assert.deepEqual(payload.table.metricGroups.map((group) => group.key), ["summary", "importance", "satisfaction", "price", "concept"]);
  assert.deepEqual(payload.table.grids[0].columns.map((column) => column.letter), ["A", "D", "E", "F", "G", "B", "C"]);
  assert.deepEqual(payload.table.bannerGroups.map((group) => group.key), ["gender", "age", "region"]);
  assert.deepEqual(payload.table.bannerGroups.find((group) => group.key === "gender").rows.slice(1).map((row) => row.letter), ["B", "C"]);
  assert.deepEqual(payload.table.bannerGroups.find((group) => group.key === "age").rows.slice(1).map((row) => row.letter), ["D", "E", "F", "G"]);
  assert.deepEqual(payload.table.bannerGroups.find((group) => group.key === "region").rows.slice(1).map((row) => row.letter), ["H", "I", "J", "K", "L"]);
  assert.deepEqual(payload.table.rows.find((row) => row.label === "18–24").metrics.penetration_3m.sigHigherThan, ["E", "F", "G"]);
  assert.equal(payload.model.status, "fitted");
  assert.equal(payload.model.trainN + payload.model.testN, 5000);
  assert.ok(payload.model.testAuc >= .65 && payload.model.testAuc <= 1);
  assert.ok(payload.model.testBrier > 0 && payload.model.testBrier < .25);
  assert.ok(payload.model.coefficients.length >= 6);
  assert.match(payload.model.boundary, /不代表因果效应、实际购买、销量或市场份额/);
  assert.match(component, /\/api\/research-operations\/raw-production/);
  assert.match(component, /CompressionStream\("gzip"\)/);
  assert.match(route, /DecompressionStream\("gzip"\)/);
  assert.match(route, /x-raw-uncompressed-size/);
  assert.match(route, /x-project-run-id/);
  assert.match(route, /storeProjectResult/);
  assert.match(component, /x-design-version/);
  assert.match(component, /encodeURIComponent\(design\.confirmationKey\)/);
  assert.match(route, /decodedHeader\(request, "x-design-confirmation-key"\)/);
  assert.match(component, /项目结果未正确绑定当前运行版本/);
  assert.doesNotMatch(component, /运行案例Raw/);
  assert.match(component, /等待最终CSV/);
  assert.match(component, /字段、Table与模型已按当前文件重新生产/);
  assert.match(component, /Kish有效样本量/);
  assert.match(component, /分析Banner/);
  assert.match(component, /多指标结果矩阵/);
  assert.match(component, /Grid101/);
  assert.match(component, /字段契约/);
  assert.match(component, /查看全部/);
  assert.match(component, /Count CSV/);
  assert.match(component, /No sig CSV/);
  assert.match(component, /Sig CSV/);
  assert.match(route, /当前在线生产接口接受CSV/);
  assert.doesNotMatch(component, /接受CSV、XLSX或SAV/);
});

test("persists and restores a project-bound result and versioned Table archive", async () => {
  const rawPath = new URL("../output/packaged-food-beverage/cracker-concept-simulated-raw.csv", import.meta.url);
  const routePath = new URL("../app/api/research-operations/project-results/route.ts", import.meta.url);
  const { buildRawProductionResult } = await import("../app/lib/rawDataProduction.ts");
  const { storeProjectResult, readProjectResult, readProjectResultArtifact } = await import("../app/lib/projectResultStore.ts");
  const source = buildRawProductionResult(readFileSync(rawPath, "utf8"), "versioned-cracker.csv");
  const runId = `TEST-RUN-${process.pid}-${Date.now()}`;
  const designVersion = "V2-R99";
  const bound = await storeProjectResult({ runId, designVersion, designConfirmationKey: "file.csv|2026-08-20T00:00:00.000Z|health-price|age_gender" }, source);
  const storedPath = new URL(`../output/packaged-food-beverage/project-runs/${bound.binding.resultKey}.json`, import.meta.url);
  const manifestPath = new URL(`../output/packaged-food-beverage/project-runs/${bound.binding.resultKey}.manifest.json`, import.meta.url);
  const artifactRoot = new URL(`../output/packaged-food-beverage/project-runs/${bound.binding.resultKey}/`, import.meta.url);
  try {
    const restored = await readProjectResult(runId, designVersion);
    assert.equal(bound.binding.runId, runId);
    assert.equal(bound.binding.designVersion, designVersion);
    assert.equal(restored.binding.resultKey, bound.binding.resultKey);
    assert.equal(restored.meta.fileName, "versioned-cracker.csv");
    assert.equal(restored.meta.eligibleRowCount, 5000);
    assert.equal(restored.binding.artifacts.length, 12);
    assert.ok(restored.binding.artifacts.every((item) => item.fileName.includes(`${designVersion}_${runId}`)));
    const artifact = await readProjectResultArtifact(runId, designVersion, "banner-age-sig");
    assert.match(artifact.contents, /"Table family","Sig"/);
    assert.match(artifact.contents, /"65\.2% EFG"/);
    assert.equal(existsSync(manifestPath), true);
    const { buildInsightReportDocument, buildModelAppendixDocument } = await import("../app/lib/insightDelivery.ts");
    const report = buildInsightReportDocument(restored, "zh");
    const appendix = buildModelAppendixDocument(restored, "zh");
    assert.match(report, /V2-R99 · TEST-RUN-/);
    assert.match(appendix, /V2-R99 · TEST-RUN-/);
    const resultRoute = readFileSync(routePath, "utf8");
    assert.match(resultRoute, /readProjectResult/);
    assert.match(resultRoute, /readProjectResultArtifact/);
    assert.match(resultRoute, /Content-Disposition/);
    assert.match(resultRoute, /未找到对应项目结果/);
  } finally {
    if (existsSync(storedPath)) unlinkSync(storedPath);
    if (existsSync(manifestPath)) unlinkSync(manifestPath);
    rmSync(artifactRoot, { recursive: true, force: true });
  }
});

test("persists server-side project run records with the locked design snapshot", async () => {
  const routePath = new URL("../app/api/research-operations/project-runs/route.ts", import.meta.url);
  const { storeProjectRunRecord, listProjectRunRecords } = await import("../app/lib/projectRunStore.ts");
  const runId = `TEST-RUN-INDEX-${process.pid}-${Date.now()}`;
  const designVersion = "V2-R98";
  const confirmationKey = "questionnaire.xlsx|quota.xlsx|dp.xlsx|health|age_gender";
  const record = {
    runId,
    projectId: "SNACK-CN-CRACKER-001",
    designVersion,
    designConfirmationKey: confirmationKey,
    designSnapshot: {
      projectId: "SNACK-CN-CRACKER-001",
      designVersion,
      artifactVersion: "V2",
      revision: 98,
      lockedAt: "2026-08-20T08:00:00.000Z",
      confirmationKey,
      sampleN: 5000,
      quotaMode: "age_gender",
      experimentKeys: ["health"],
      experimentQuestionIds: ["PJT_HEALTH_01", "PJT_HEALTH_02"],
      sourceProductionFile: "prior.csv",
      sourceProductionProcessedAt: "2026-08-20T07:00:00.000Z",
      files: { questionnaire: "/q.xlsx", quota: "/quota.xlsx", dpSpec: "/dp.xlsx" },
    },
    stage: "programming",
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-08-20T08:00:00.000Z",
    targetN: 5000,
    fieldwork: { completedN: 0, minimumQuotaCompletion: 0, updatedAt: null },
  };
  const storedPath = new URL(`../output/packaged-food-beverage/project-run-records/${runId}__${designVersion}.run.json`, import.meta.url);
  try {
    await storeProjectRunRecord(record);
    const records = await listProjectRunRecords();
    const restored = records.find((item) => item.runId === runId && item.designVersion === designVersion);
    assert.equal(restored.designSnapshot.confirmationKey, confirmationKey);
    assert.equal(restored.targetN, 5000);
    const route = readFileSync(routePath, "utf8");
    assert.match(route, /listProjectRunRecords/);
    assert.match(route, /storeProjectRunRecord/);
  } finally {
    if (existsSync(storedPath)) unlinkSync(storedPath);
  }
});

test("blocks model production when final Raw has duplicate IDs or invalid weights", async () => {
  const { buildRawProductionResult } = await import("../app/lib/rawDataProduction.ts");
  const payload = buildRawProductionResult([
    "respondent_id,age_group,weight,puffed_3m,price_accept_7_9,concept_trial,health_fit",
    "R1,18-24,1,1,1,5,4",
    "R1,25-34,1,0,1,3,3",
    "R2,25-34,0,1,1,4,4",
  ].join("\n"), "blocked.csv");

  assert.equal(payload.meta.status, "blocked");
  assert.equal(payload.structuralChecks.duplicateRespondentIds, 1);
  assert.equal(payload.structuralChecks.invalidWeights, 1);
  assert.equal(payload.model.status, "blocked");
  assert.ok(payload.model.blockers.some((item) => item.includes("数据结构检查未通过")));
});

test("generates downloadable step 05 insight and model documents from the step 04 result", async () => {
  const rawPath = new URL("../output/packaged-food-beverage/cracker-concept-simulated-raw.csv", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const { buildRawProductionResult } = await import("../app/lib/rawDataProduction.ts");
  const { buildInsightDecisionSummary, buildInsightReportDocument, buildModelAppendixDocument, buildNextWaveResearchDesign, buildNextWaveResearchDesignDocument } = await import("../app/lib/insightDelivery.ts");
  const production = buildRawProductionResult(readFileSync(rawPath, "utf8"), "cracker_final_raw.csv");
  const summary = buildInsightDecisionSummary(production);
  const nextWave = buildNextWaveResearchDesign(production);
  const report = buildInsightReportDocument(production, "zh");
  const appendix = buildModelAppendixDocument(production, "zh");
  const nextWaveDocument = buildNextWaveResearchDesignDocument(production, "zh");
  const component = readFileSync(componentPath, "utf8");

  assert.match(report, /cracker_final_raw\.csv/);
  assert.match(report, /59\.3%/);
  assert.match(report, /86\.4%/);
  assert.match(report, /29\.8%/);
  assert.match(report, /1\.21/);
  assert.match(report, /18–24是当前优先深入验证的人群/);
  assert.match(report, /健康属性是当前产品优化的第一优先级/);
  assert.match(report, /40\.2pp/);
  assert.match(report, /¥10\.9–¥12\.9/);
  assert.match(report, /概念差异化是当前概念的主要表达短板/);
  assert.match(report, /AUC/);
  assert.equal(summary.topNeedGap.key, "health");
  assert.equal(summary.topNeedGap.gap, 40.2);
  assert.equal(summary.priceTransition.fromPrice, 10.9);
  assert.equal(summary.priceTransition.toPrice, 12.9);
  assert.equal(summary.priceTransition.drop, 35.4);
  assert.equal(summary.weakestConcept.key, "concept_uniqueness");
  assert.equal(summary.decisions.length, 4);
  assert.ok(summary.leadingAge.baseN >= 300);
  assert.deepEqual(nextWave.stableCore.questionIds, ["Q1", "Q2", "Q7", "Q8", "Q9", "Q10"]);
  assert.equal(nextWave.samplePlan.requiresBoost, false);
  assert.deepEqual(nextWave.actions.filter((item) => item.layer === "项目专项").map((item) => item.questionIds[0]), ["PJT_HEALTH_01", "PJT_PRICE_01", "PJT_CONCEPT_01"]);
  assert.match(nextWave.actions.find((item) => item.code === "P02").designZh, /¥9\.9 \/ ¥10\.9 \/ ¥12\.9/);
  assert.match(appendix, /模型解析附录/);
  assert.match(appendix, /0\.697/);
  assert.match(appendix, /0\.196/);
  assert.match(appendix, /标准化系数与方向/);
  assert.match(component, /latestProduction/);
  assert.match(component, /buildInsightReportDocument/);
  assert.match(component, /"完整报告"/);
  assert.match(component, /"模型解析附录"/);
  assert.match(component, /版本Table/);
  assert.match(component, /将当前证据转成下一期研究设计/);
  assert.match(component, /下载下一期研究设计/);
  assert.match(component, /production=\{latestProduction\}/);
  assert.match(component, /需求重要性−满足度缺口/);
  assert.match(component, /价格接受曲线/);
  assert.match(component, /不使用另一套静态数据替代当前项目/);
  assert.doesNotMatch(component, /什么证据支持到什么结论/);
  assert.match(nextWaveDocument, /下一期研究设计/);
  assert.match(nextWaveDocument, /PJT_HEALTH_01/);
  assert.match(nextWaveDocument, /不需为放大结论机械增样/);
  assert.doesNotMatch(report + appendix + nextWaveDocument, /Raw Data QC|清洗日志|EXPERT REVIEW/);
});

test("confirms next-wave experiments before exposing three separate V2 design files", () => {
  const manifestPath = new URL("../output/packaged-food-beverage/next-wave-v2-manifest.json", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const scriptPath = new URL("../scripts/build_next_wave_v2_deliverables.mjs", import.meta.url);
  const outputRoot = new URL("../output/packaged-food-beverage/client-deliverables/next-wave-v2/", import.meta.url);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const script = readFileSync(scriptPath, "utf8");

  assert.equal(manifest.version, "V2");
  assert.deepEqual(manifest.stableCoreQuestionIds, ["Q1", "Q2", "Q7", "Q8", "Q9", "Q10"]);
  assert.equal(manifest.variants.length, 7);
  assert.deepEqual(manifest.variants.map((item) => item.key), ["health", "price", "health-price", "concept", "health-concept", "price-concept", "health-price-concept"]);
  const complete = manifest.variants.find((item) => item.key === "health-price-concept");
  assert.deepEqual(complete.experimentQuestionIds, ["PJT_HEALTH_01", "PJT_HEALTH_02", "PJT_PRICE_01", "PJT_PRICE_02", "PJT_CONCEPT_01", "PJT_CONCEPT_02"]);
  assert.match(component, /确认并生成V2/);
  assert.match(component, /问卷 V2/);
  assert.match(component, /配额表 V2/);
  assert.match(component, /DP Spec V2/);
  assert.match(component, /lockedProjectDesign\?\.confirmationKey === nextWaveConfirmationKey/);
  assert.match(component, /PROJECT_DESIGN_STORAGE_KEY/);
  assert.match(component, /PROJECT_DESIGN_HISTORY_STORAGE_KEY/);
  assert.match(component, /PROJECT_RUN_STORAGE_KEY/);
  assert.match(component, /PROJECT_RUN_HISTORY_STORAGE_KEY/);
  assert.match(component, /designVersion: `V2-R\$\{revision\}`/);
  assert.match(component, /等待第02步锁定研究设计/);
  assert.match(component, /本页读取第02步确认的同一问卷、配额与DP Spec版本/);
  assert.match(component, /N≥30且四项全部通过后才能开始正式回收/);
  assert.match(component, /最低配额单元达到100%/);
  assert.match(component, /当前执行记录尚未关闭回收/);
  assert.match(component, /stage: "data_ready"/);
  assert.match(component, /finalRaw:/);
  assert.match(component, /resultKey: result\.binding\.resultKey/);
  assert.match(component, /项目成果版本/);
  assert.match(component, /\/api\/research-operations\/project-results/);
  assert.match(component, /\/api\/research-operations\/project-runs/);
  assert.match(component, /designSnapshot: design/);
  assert.match(component, /run\?\.designVersion.*run\?\.runId/);
  assert.doesNotMatch(component, /3,842 \/ 5,000|76\.8%|61\.4%–92\.6%/);
  assert.doesNotMatch(component, /V2工作包|V2交付包/);
  assert.match(script, /PJT_HEALTH_02/);
  assert.match(script, /PJT_PRICE_02/);
  assert.match(script, /Price curve \/ % at each price/);
  assert.match(script, /key === "price"/);
  assert.match(script, /PJT_CONCEPT_02/);
  assert.match(script, /随机分配 \/ 软监测/);
  assert.match(script, /PJT_\*默认只进入当前项目Table与专项模型/);

  const workbookFiles = [complete.files.questionnaire, complete.files.quota.age_gender, complete.files.dpSpec];
  for (const publicPath of workbookFiles) {
    const fileName = publicPath.split("/").at(-1);
    const workbookPath = fileURLToPath(new URL(fileName, outputRoot));
    assert.equal(existsSync(workbookPath), true, `${fileName} should exist`);
    assert.equal(readFileSync(workbookPath).subarray(0, 2).toString(), "PK");
    assert.match(execFileSync("/usr/bin/unzip", ["-t", workbookPath], { encoding: "utf8" }), /No errors detected/);
  }
  const questionnaireXml = execFileSync("/usr/bin/unzip", ["-p", fileURLToPath(new URL(complete.files.questionnaire.split("/").at(-1), outputRoot)), "xl/workbook.xml"], { encoding: "utf8" });
  const dpXml = execFileSync("/usr/bin/unzip", ["-p", fileURLToPath(new URL(complete.files.dpSpec.split("/").at(-1), outputRoot)), "xl/workbook.xml"], { encoding: "utf8" });
  const quotaXml = execFileSync("/usr/bin/unzip", ["-p", fileURLToPath(new URL(complete.files.quota.age_gender.split("/").at(-1), outputRoot)), "xl/workbook.xml"], { encoding: "utf8" });
  assert.match(questionnaireXml, /name="问卷"/);
  assert.match(questionnaireXml, /name="指标映射"/);
  assert.match(dpXml, /name="General"/);
  assert.match(dpXml, /name="Spec"/);
  assert.match(dpXml, /name="Banner"/);
  assert.match(dpXml, /name="Grid"/);
  assert.match(quotaXml, /name="配额表"/);
});

test("exports separate Count, No sig and Sig tables for each locked banner and Grid101", async () => {
  const rawPath = new URL("../output/packaged-food-beverage/cracker-concept-simulated-raw.csv", import.meta.url);
  const { buildRawProductionResult } = await import("../app/lib/rawDataProduction.ts");
  const { buildGridCsv, buildTableCsv, gridCsvFileName, tableCsvFileName } = await import("../app/lib/tableDelivery.ts");
  const production = buildRawProductionResult(readFileSync(rawPath, "utf8"), "cracker_final_raw.csv");
  const age = production.table.bannerGroups.find((group) => group.key === "age");
  const count = buildTableCsv(production, "age", "count", "zh");
  const noSig = buildTableCsv(production, "age", "no_sig", "zh");
  const sig = buildTableCsv(production, "age", "sig", "zh");
  const importance = buildTableCsv(production, "age", "no_sig", "zh", "importance");
  const grid = buildGridCsv(production, "grid101", "sig", "zh");

  assert.equal(count.charCodeAt(0), 0xfeff);
  assert.match(count, /"Table family","Count"/);
  assert.match(count, /"A Total","D 18–24","E 25–34","F 35–44","G 45–54"/);
  assert.match(noSig, /"Q1 过去3个月购买率","59\.3%","65\.2%","60\.2%","57\.2%","55\.5%"/);
  assert.match(sig, /"65\.2% EFG"/);
  assert.match(sig, /互斥独立样本 · 双侧95%/);
  assert.match(importance, /需求重要性/);
  assert.match(importance, /Q7_1 口味重要性 Mean/);
  assert.match(grid, /Grid101/);
  assert.match(grid, /"A Total","D 18–24","E 25–34","F 35–44","G 45–54","B 男性","C 女性"/);
  assert.equal(tableCsvFileName(age, "sig", "zh"), "中国薄脆饼干新品概念与定价研究_年龄_Sig.csv");
  assert.equal(gridCsvFileName("sig", "zh"), "中国薄脆饼干新品概念与定价研究_Grid101_Sig.csv");
});

test("separates the client project workspace from research-team operations", async () => {
  const [clientHtml, operationsHtml] = await Promise.all([
    renderHtml("/packaged-food-beverage"),
    renderHtml("/research-operations/snack"),
  ]);
  const component = readFileSync(new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url), "utf8");
  const pipeline = JSON.parse(readFileSync(new URL("../output/packaged-food-beverage/research-production-pipeline.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(readFileSync(new URL("../output/packaged-food-beverage/client-deliverables/交付清单-20260817.json", import.meta.url), "utf8"));

  assert.doesNotMatch(clientHtml, /Raw Data QC|QC通过率|下载QC工作簿/);
  assert.match(operationsHtml, /研究团队工作区/);
  assert.match(operationsHtml, /Raw Data QC/);
  assert.match(operationsHtml, /规则命中、复核与最终纳入/);
  assert.match(component, /基于Final问卷设计配额/);
  assert.match(component, /下载配额表/);
  assert.match(pipeline.workspace_boundary.delivery_rule, /分别生成、确认和下载/);
  assert.match(pipeline.workspace_boundary.delivery_rule, /研究团队工作区/);
  assert.deepEqual(manifest.client_deliverables.map((item) => item.key), ["questionnaire", "quota-cross", "dp-spec"]);
  assert.equal(manifest.quota_configuration.selection_required, true);
  assert.equal(manifest.quota_configuration.options.length, 3);
  assert.ok(manifest.research_operations.every((item) => item.client_visible === false));
});

test("builds a complete questionnaire with routing, KPI contribution and metric governance", () => {
  const questionnairePath = new URL("../output/packaged-food-beverage/complete-snack-questionnaire-template.json", import.meta.url);
  const kpiPath = new URL("../output/packaged-food-beverage/china-snack-kpi-system.json", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const sourceRegistryPath = new URL("../app/data/externalResearchResources.ts", import.meta.url);
  const questionnaire = JSON.parse(readFileSync(questionnairePath, "utf8"));
  const kpiSystem = JSON.parse(readFileSync(kpiPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const sourceRegistry = readFileSync(sourceRegistryPath, "utf8");
  const ids = new Set(questionnaire.questions.map((item) => item.question_id));
  const metricIds = new Set(kpiSystem.metric_definitions.map((item) => item.metric_id));

  assert.equal(questionnaire.questions.length, 46);
  assert.equal(questionnaire.meta.module_count, 13);
  assert.equal(ids.size, 46);
  assert.deepEqual(Object.keys(questionnaire.objective_modules).sort(), ["channel", "concept", "pricing", "tracking"]);
  assert.ok(questionnaire.questions.every((item) => item.question_text && item.response_type && Array.isArray(item.options) && item.base && item.logic));
  assert.ok(questionnaire.questions.every((item) => item.metric_contribution && item.indicator_layer && item.inclusion_recommendation));
  assert.ok(questionnaire.questions.flatMap((item) => item.kpi_ids).every((metricId) => metricIds.has(metricId)));
  assert.match(questionnaire.questions.find((item) => item.question_id === "S6").logic, /结束访问/);
  assert.match(questionnaire.governance.default_rule, /不自动改变通用指标体系/);
  assert.match(component, /通用数据产品/);
  assert.match(component, /项目专项工作台/);
  assert.match(component, /成果示例/);
  assert.match(component, /只回流可比的通用指标/);
  assert.match(component, /项目专属变量留在项目层/);
  assert.match(component, /人均家庭消费支出/);
  assert.doesNotMatch(component, /互联网使用率|沙特CST/);
  assert.match(component, /新增项目问题/);
  assert.match(component, /KPI与模型影响/);
  assert.match(component, /确认Final问卷/);
  assert.match(component, /外部数据作为校准层，不替代消费者研究/);
  assert.doesNotMatch(component, /globalAtlasJson/);
  assert.match(component, /globalMarketJson\.meta\.world_bank_last_updated/);
  assert.match(sourceRegistry, /Statista Market & Consumer Insights/);
  assert.match(sourceRegistry, /Sensor Tower/);
  assert.match(sourceRegistry, /access: "licensed"/);
});

test("uses real-case screener logic and a bilingual questionnaire production contract", () => {
  const questionnairePath = new URL("../output/packaged-food-beverage/complete-snack-questionnaire-template.json", import.meta.url);
  const translationsPath = new URL("../output/packaged-food-beverage/snack-questionnaire-translations.json", import.meta.url);
  const programmingPath = new URL("../output/packaged-food-beverage/snack-questionnaire-programming-model.json", import.meta.url);
  const pipelinePath = new URL("../output/packaged-food-beverage/research-production-pipeline.json", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const operationsPath = new URL("../app/components/SnackResearchOperations.tsx", import.meta.url);
  const hierarchyPath = new URL("../app/lib/modelHierarchy.ts", import.meta.url);
  const questionnaire = JSON.parse(readFileSync(questionnairePath, "utf8"));
  const translations = JSON.parse(readFileSync(translationsPath, "utf8"));
  const programming = JSON.parse(readFileSync(programmingPath, "utf8"));
  const pipeline = JSON.parse(readFileSync(pipelinePath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const operations = readFileSync(operationsPath, "utf8");
  const hierarchy = readFileSync(hierarchyPath, "utf8");
  const s8 = questionnaire.questions.find((item) => item.question_id === "S8");
  const s9 = questionnaire.questions.find((item) => item.question_id === "S9");
  const p8 = programming.questions.find((item) => item.question_id === "S8");
  const p9 = programming.questions.find((item) => item.question_id === "S9");

  assert.equal(s8.response_type, "多选");
  assert.match(s8.question_text, /过去6个月.*市场调研/);
  assert.equal(s9.response_type, "多选");
  assert.match(s9.question_text, /本人或您的家人.*行业/);
  assert.doesNotMatch(JSON.stringify(questionnaire), /愿意认真阅读题目/);
  assert.match(p8.programmer_logic, /99.*互斥/);
  assert.match(p9.programmer_logic_en, /terminate.*exclusive/i);
  assert.equal(Object.keys(translations.questions).length, questionnaire.questions.length);
  assert.equal(translations.questions.S8.options_en.length, s8.options.length);
  assert.deepEqual(programming.meta.logic_columns, ["zh-CN", "en"]);
  assert.ok(pipeline.significance_routes.some((item) => item.route === "overlapping"));
  assert.match(pipeline.question_governance.new_option, /Append/);
  assert.deepEqual(pipeline.workflow.find((item) => item.step === "02").outputs, ["独立问卷确认稿", "已选配额表", "独立DP Spec"]);
  assert.match(pipeline.workflow.find((item) => item.step === "04").name_zh, /数据、Table与模型/);
  assert.match(component, /02 问卷与样本设计/);
  assert.match(component, /04 数据、Table与模型/);
  assert.match(component, /从最终Raw Data到Table、指标与模型/);
  assert.match(component, /多指标结果矩阵/);
  assert.match(component, /外部校准数据覆盖/);
  assert.match(component, /人口、人均GDP与居民消费支出用于研究市场筛选和消费环境比较/);
  const productionSource = component.slice(component.indexOf("function ResearchProductionFlow"), component.indexOf("function ProjectExecutionHub"));
  assert.doesNotMatch(productionSource, /DP Spec|配额表|配额方式|下载DP/);
  assert.match(productionSource, /上传唯一生产数据版本/);
  assert.match(productionSource, /Count · No sig · Sig/);
  assert.match(component, /问卷语言/);
  assert.match(operations, /必答与路由/);
  assert.match(operations, /04 Table与模型生产/);
  assert.doesNotMatch(operations, /DP Spec|DP与Table生产|唯一进入DP与模型/);
  assert.match(component, /项目专项工作台/);
  assert.match(component, /通用基准与项目决策分层运行/);
  assert.match(hierarchy, /跨行业消费者核心/);
  assert.match(hierarchy, /快速消费品/);
  assert.match(hierarchy, /食品与饮料/);
  assert.match(hierarchy, /包装食品/);
  assert.match(hierarchy, /膨化食品/);
  assert.match(component, /品类基准与通用模型/);
  assert.match(component, /品牌与产品专项模型/);
  assert.match(hierarchy, /上层标准下发/);
  assert.match(hierarchy, /下层项目收数/);
  assert.match(hierarchy, /上级模型更新/);
  assert.match(component, /03 执行与进度/);
  assert.match(component, /05 洞察与交付/);
  assert.doesNotMatch(JSON.stringify(programming), /programmer_cleaning_logic/);
});

test("governs hierarchical model inheritance and upward metric contribution", async () => {
  const { AIPC_MODEL_PATH, REGISTRY_CONTRACT, SNACK_MODEL_PATH, assessMetricPromotion, buildMetricKey, buildRawVariable, validateModelPath } = await import("../app/lib/modelHierarchy.ts");

  assert.equal(validateModelPath(SNACK_MODEL_PATH), true);
  assert.equal(validateModelPath(AIPC_MODEL_PATH), true);
  assert.equal(SNACK_MODEL_PATH.at(-1).sharingMode, "project_only");
  assert.equal(AIPC_MODEL_PATH.find((item) => item.id === "consumer_electronics").parentId, "durable_goods");

  const eligible = assessMetricPromotion({
    constructAligned: true,
    definitionAligned: true,
    denominatorAligned: true,
    scaleMapped: true,
    segmentInvariant: true,
    timeStable: true,
    aggregateUseAllowed: true,
  });
  assert.equal(eligible.destination, "parent_candidate");

  const projectOnly = assessMetricPromotion({
    constructAligned: true,
    definitionAligned: true,
    denominatorAligned: true,
    scaleMapped: true,
    segmentInvariant: false,
    timeStable: true,
    aggregateUseAllowed: false,
  });
  assert.equal(projectOnly.destination, "current_layer");
  assert.deepEqual(projectOnly.failedGates, ["关键人群测量等值性未通过", "未获得匿名聚合复用授权"]);
  assert.equal(buildMetricKey("snack.core", "kpi_penetration_3m"), "SNACK.CORE.KPI_PENETRATION_3M");
  assert.equal(buildRawVariable("prj.snack", "DCE1-DCE8"), "prj_snack_dce1_dce8");
  assert.match(REGISTRY_CONTRACT.displayOrder, /展示顺序与题号解耦/);
  assert.match(REGISTRY_CONTRACT.projectIsolation, /禁止自动上行/);
});

test("registers stable metrics, questions, contribution bases and model runs", () => {
  const registryPath = new URL("../output/packaged-food-beverage/research-registry.json", import.meta.url);
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const loaderPath = new URL("../scripts/load_packaged_food_database.py", import.meta.url);
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const loader = readFileSync(loaderPath, "utf8");

  assert.equal(registry.summary.layer_count, 7);
  assert.equal(registry.summary.metric_count, 18);
  assert.equal(registry.summary.question_count, 46);
  assert.equal(registry.summary.option_count, 200);
  assert.equal(registry.summary.gross_respondent_rows, 21600);
  assert.equal(registry.summary.common_prior_n, 16600);
  assert.equal(registry.summary.project_train_n, 3500);
  assert.equal(registry.summary.project_holdout_n, 1500);

  const metricKeys = new Set(registry.metric_registry.map((item) => item.metric_key));
  const questionKeys = new Set(registry.question_registry.map((item) => item.question_key));
  const modelIds = new Set(registry.model_registry.map((item) => item.model_id));
  assert.equal(metricKeys.size, registry.metric_registry.length);
  assert.equal(questionKeys.size, registry.question_registry.length);
  assert.ok(registry.question_metric_map.every((item) => metricKeys.has(item.metric_key) && questionKeys.has(item.question_key)));
  assert.ok(registry.sample_contribution_ledger.every((item) => metricKeys.has(item.metric_key)));
  assert.ok(registry.sample_contribution_ledger.every((item) => item.gross_n >= item.comparable_n && item.comparable_n >= item.effective_n));
  assert.ok(registry.model_runs.every((item) => modelIds.has(item.model_id) && item.train_n > 0));
  assert.ok(registry.metric_contribution_summary.find((item) => item.metric_key === "SNACK.CORE.FREQ_BUYER").comparable_n < registry.summary.gross_respondent_rows);
  assert.ok(registry.method_references.some((item) => item.reference_id === "feast"));
  assert.ok(registry.method_references.some((item) => item.reference_id === "ipsos-synthesio"));

  assert.match(component, /一个指标到底能使用多少样本/);
  assert.match(component, /哪些项目真正贡献了这个指标/);
  assert.match(component, /从问卷题号追到模型输入/);
  assert.match(component, /每次训练都保留样本切分与验证结果/);
  assert.match(loader, /CREATE TABLE food_metric_registry_v2/);
  assert.match(loader, /CREATE TABLE food_sample_contribution_ledger/);
  assert.match(loader, /CREATE TABLE food_model_runs_v2/);
});

test("builds a research-company project intake and delivery-control system", async () => {
  const systemPath = new URL("../output/packaged-food-beverage/research-project-system.json", import.meta.url);
  const kpiPath = new URL("../output/packaged-food-beverage/china-snack-kpi-system.json", import.meta.url);
  const system = JSON.parse(readFileSync(systemPath, "utf8"));
  const kpis = JSON.parse(readFileSync(kpiPath, "utf8"));
  const { buildResearchProjectPlan, marginOfError95 } = await import("../app/lib/researchProjectPlan.ts");

  assert.equal(system.intake_fields.length, 9);
  assert.equal(system.evidence_requirements.length, 9);
  assert.equal(system.quota_framework.length, 5);
  assert.equal(system.quality_controls.length, 10);
  assert.equal(system.delivery_templates.length, 14);
  assert.equal(system.research_checkpoints.length, 4);
  assert.equal(system.method_sources.length, 4);
  assert.ok(system.meta.blocked_asset_types.includes("合同"));
  assert.ok(system.delivery_templates.every((item) => item.deliverable_id && item.acceptance && item.owner));
  assert.ok(system.delivery_templates.every((item) => item.name_en && item.acceptance_en && item.owner_en));
  assert.ok(system.evidence_requirements.every((item) => item.name_en && item.enables_en));
  assert.ok(system.quota_framework.every((item) => item.dimension_en && item.control_en && item.target_source_en && item.analysis_gate_en));
  assert.ok(system.research_checkpoints.every((item) => item.name_en && item.role_en && item.value_en));
  assert.ok(system.delivery_templates.filter((item) => item.phase === "analysis").every((item) => item.required_evidence.includes("fieldwork_raw")));
  assert.equal(Number(marginOfError95(5000).toFixed(1)), 1.4);

  const generatedMetrics = kpis.metric_definitions.filter((item) => ["primary", "driver", "guardrail", "model"].includes(item.role));
  const initial = buildResearchProjectPlan({ objective: "tracking", sampleN: 5000, marketScope: "china", markets: "", availableEvidence: [] }, generatedMetrics, system);
  assert.equal(initial.marketCount, 1);
  assert.equal(initial.stableMutuallyExclusiveGroups, 12);
  assert.ok(initial.byStage.find((item) => item.stage === "design").ready >= 5);
  assert.equal(initial.byStage.find((item) => item.stage === "analysis").ready, 0);

  const mature = buildResearchProjectPlan({ objective: "tracking", sampleN: 5000, marketScope: "china_overseas", markets: "美国、日本", availableEvidence: ["prior_questionnaire", "prior_raw", "prior_tables", "fieldwork_raw", "next_wave", "business_outcome"] }, generatedMetrics, system);
  assert.equal(mature.marketCount, 3);
  assert.equal(mature.missingPriorityEvidence.length, 0);
  assert.ok(mature.byStage.find((item) => item.stage === "analysis").ready >= 4);
  assert.ok(mature.byStage.find((item) => item.stage === "validation").ready >= 2);
  assert.ok(mature.byStage.find((item) => item.stage === "outcome").ready >= 1);
});

test("runs a complete simulated cracker concept case and feeds reusable metrics back to the common layer", () => {
  const casePath = new URL("../output/packaged-food-beverage/cracker-concept-simulation.json", import.meta.url);
  const commonPath = new URL("../output/packaged-food-beverage/snack-common-project-system.json", import.meta.url);
  const componentPath = new URL("../app/components/CrackerConceptCase.tsx", import.meta.url);
  const rawDownload = new URL("../public/downloads/cracker-concept-simulated-raw.csv", import.meta.url);
  const dceDownload = new URL("../public/downloads/cracker-concept-simulated-dce.csv", import.meta.url);
  const payload = JSON.parse(readFileSync(casePath, "utf8"));
  const common = JSON.parse(readFileSync(commonPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");

  assert.equal(payload.meta.respondent_count, 5000);
  assert.equal(payload.meta.dce_task_count, 30000);
  assert.equal(payload.questionnaire_map.length, 7);
  assert.equal(payload.models.trial_propensity.train_n + payload.models.trial_propensity.test_n, 5000);
  assert.ok(payload.models.trial_propensity.test_auc > 0.7);
  assert.ok(payload.models.discrete_choice.test_accuracy > 0.65);
  assert.equal(payload.models.discrete_choice.scenarios.length, 3);
  assert.ok(payload.price_curve.every((item, index, rows) => index === 0 || item.acceptance_rate <= rows[index - 1].acceptance_rate));
  assert.equal(payload.decision_output.target_segment, "轻负担品质派");
  assert.equal(payload.decision_output.recommended_scenario, "海盐香葱轻油薄脆");
  assert.match(payload.meta.blocked_use, /不得作为中国饼干市场真实规模/);
  assert.equal(common.common_metrics.length, 16);
  assert.equal(common.case_registry.length, 2);
  assert.equal(common.metric_observations.length, 8);
  assert.ok(common.case_registry.every((item) => item.data_status === "模拟" && item.outcome_labels === 0));
  assert.ok(common.common_metrics.some((item) => item.metric_id === "SNACK_SPEND_BUYER"));
  assert.ok(common.common_metrics.some((item) => item.metric_id === "SNACK_REPEAT_OUTCOME"));
  assert.match(common.uncertainty_note, /不是实际模型准确率/);
  assert.match(component, /通用指标持续积累，定制项目持续校准/);
  assert.match(component, /SCENARIO SIMULATOR/);
  assert.match(component, /模型预测试购/);
  assert.ok(readFileSync(rawDownload).length > 1_000_000);
  assert.ok(readFileSync(dceDownload).length > 3_000_000);
});

test("connects common sample contribution, project customization and expert service in one workbench", () => {
  const payloadPath = new URL("../output/packaged-food-beverage/snack-project-workbench.json", import.meta.url);
  const poolPath = new URL("../public/downloads/snack-common-simulated-pool.csv", import.meta.url);
  const componentPath = new URL("../app/components/SnackProjectWorkbench.tsx", import.meta.url);
  const dashboardPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
  const component = readFileSync(componentPath, "utf8");
  const dashboard = readFileSync(dashboardPath, "utf8");

  assert.equal(payload.sample_pool.before_project_n, 16600);
  assert.equal(payload.sample_pool.project_contribution_n, 5000);
  assert.equal(payload.sample_pool.after_project_n, 21600);
  assert.equal(payload.sample_pool.common_metric_count, 16);
  assert.equal(payload.sample_pool.project_metric_coverage, 14);
  assert.equal(payload.case_registry.length, 5);
  assert.equal(payload.model_results.sample_ladder.length, 5);
  assert.ok(payload.model_results.sample_ladder[0].common_plus_custom_auc > payload.model_results.sample_ladder[0].project_only_auc);
  assert.ok(payload.model_results.sample_ladder[0].common_plus_custom_sd < payload.model_results.sample_ladder[0].project_only_sd);
  assert.equal(payload.service_teams.length, 3);
  assert.equal(payload.experts.length, 4);
  assert.ok(payload.experts.some((item) => item.expert_id === "EXP-RW" && item.experience.includes("TT及外部竞品生态满意度调研")));
  assert.ok(payload.meta.boundary.includes("不代表真实行业模型表现"));
  assert.match(component, /通用样本扩大模型基础，项目专属研究回答产品问题/);
  assert.match(component, /TEAM & EXPERT SERVICE/);
  assert.match(component, /下载项目方案/);
  assert.match(component, /PROJECT OUTPUT/);
  assert.match(component, /当前配置直接生成问卷、样本结构、KPI、模型与决策输出/);
  assert.match(component, /下载当前问卷结构/);
  assert.match(component, /模型回答什么/);
  assert.match(dashboard, /项目专项工作台/);
  assert.ok(readFileSync(poolPath).length > 2_000_000);
});

test("generates a project-specific simulated questionnaire, fieldwork and decision preview", async () => {
  const sourcePath = new URL("../app/lib/snackProjectGenerator.ts", import.meta.url);
  const source = readFileSync(sourcePath, "utf8");
  assert.match(source, /buildSnackProjectPreview/);
  assert.match(source, /模拟产品原型/);
  assert.match(source, /marginOfError95Pp/);
  assert.match(source, /当前数值均为模拟/);
  assert.match(source, /真实问卷、实验和后续结果重新估计/);
  assert.match(source, /DCE1-DCE8/);
  assert.doesNotMatch(source, /真实销量预测|真实市场份额预测/);
});

test("builds a traceable research knowledge index for questionnaire and model routing", () => {
  const knowledgePath = new URL("../output/packaged-food-beverage/research-knowledge-index.json", import.meta.url);
  const payload = JSON.parse(readFileSync(knowledgePath, "utf8"));
  const ids = new Set(payload.knowledge_items.map((item) => item.knowledge_id));
  const blockedArchiveTerms = /合同|报价|预算|发票|付款|收款|结算金额|invoice|contract|quotation|payment/i;

  assert.equal(payload.meta.knowledge_item_count, 57);
  assert.deepEqual(payload.meta.by_kind, {
    historical_project_structure: 13,
    metric_definition: 17,
    model_method: 4,
    question_template: 18,
    research_capability: 5,
  });
  assert.equal(ids.size, 57);
  assert.deepEqual(Object.keys(payload.recommendation_profiles).sort(), ["channel", "concept", "pricing", "tracking"]);
  assert.ok(Object.values(payload.recommendation_profiles).every((profile) => profile.matched_evidence.length === 4));
  assert.ok(Object.values(payload.recommendation_profiles).every((profile) => profile.delivery_gates.length === 4));
  assert.ok(Object.values(payload.recommendation_profiles).every((profile) => profile.delivery_gates.every((gate) => gate.stage_en && gate.output_en)));
  assert.ok(Object.values(payload.recommendation_profiles).every((profile) => profile.primary_model_en && profile.supporting_model_en && profile.training_gate_en));
  assert.ok(Object.values(payload.recommendation_profiles).flatMap((profile) => profile.matched_evidence).every((item) => ids.has(item.knowledge_id)));
  assert.ok(payload.knowledge_items.every((item) => !blockedArchiveTerms.test(`${item.provenance} ${item.title}`)));
  assert.match(payload.meta.learning_boundary, /不宣称已训练商业结果预测模型/);
  assert.match(payload.meta.archive_policy, /不复制历史客户文件内容/);
});

test("routes clear client briefs to the appropriate research task", async () => {
  const knowledgePath = new URL("../output/packaged-food-beverage/research-knowledge-index.json", import.meta.url);
  const payload = JSON.parse(readFileSync(knowledgePath, "utf8"));
  const profileQueries = Object.fromEntries(Object.entries(payload.recommendation_profiles).map(([key, profile]) => [key, [profile.retrieval_query, ...payload.knowledge_items.filter((item) => item.objectives.includes(key)).map((item) => item.text)].join(" ")]));
  const { routeResearchBrief } = await import("../app/lib/researchRouting.ts");
  const briefs = {
    tracking: "连续追踪每季度品类渗透和购买意向变化，预测下一期KPI",
    concept: "测试新品概念、口味包装规格和产品组合，确定目标人群",
    pricing: "评估价格带、支付意愿、价格弹性和哪些属性可以支撑溢价",
    channel: "选择商超电商和零食量贩渠道，研究货架上架、场景和增量触达",
  };

  for (const [expected, brief] of Object.entries(briefs)) {
    const result = routeResearchBrief(brief, profileQueries);
    assert.equal(result.primary, expected);
    assert.equal(result.needsReview, false);
    assert.ok(result.ranked[0].score >= 60);
    assert.equal(result.ranked.reduce((sum, item) => sum + item.score, 0), 100);
  }
});

test("keeps nuts and dried fruit outside the deep snack model until evidence gates are met", () => {
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const source = readFileSync(componentPath, "utf8");

  assert.match(source, /category !== "puffed" \? <ObservationOnly/);
  assert.match(source, /坚果炒货.*市场观察/);
  assert.match(source, /公开商品、规格和价格样本/);
  assert.match(source, /消费者洞察与新品决策模型/);
  assert.match(source, /连接经营结果/);
  assert.match(source, /注册中心下的七类数据域/);
  assert.match(source, /全球市场、贸易与商品库/);
});

test("turns the snack model into a gated launch decision and continuous survey system", () => {
  const componentPath = new URL("../app/components/SnackIndustryFocusDashboard.tsx", import.meta.url);
  const source = readFileSync(componentPath, "utf8");

  assert.match(source, /新品上架与渠道进入决策/);
  assert.match(source, /当前筛选建议/);
  assert.match(source, /问卷选择概率达到60%/);
  assert.match(source, /上市判断/);
  assert.match(source, /缺少真实试购、复购与销售结果/);
  assert.match(source, /固定核心指标/);
  assert.match(source, /轮换决策模块/);
  assert.match(source, /重点人群增样/);
  assert.match(source, /真实结果回流/);
  assert.match(source, /数据更新时间与下一步/);
  assert.match(source, /零食行业数据底座/);
  assert.match(source, /consumerRecords: chinaSurveyJson\.meta\.respondent_count/);
  assert.match(source, /scenarioSkus: foodJson\.skus\.length/);
  assert.match(source, /人群机会排序/);
  assert.doesNotMatch(source, /收入代理指数|模拟选择份额/);
});

test("builds a finite time-holdout food purchase model and labeled SKU layer", () => {
  const dashboardPath = new URL("../output/packaged-food-beverage/dashboard-data.json", import.meta.url);
  const payload = JSON.parse(readFileSync(dashboardPath, "utf8"));

  assert.equal(payload.meta.data_status, "模拟产品原型");
  assert.equal(payload.skus.length, 840);
  assert.ok(payload.skus.every((item) => item.data_label === "模拟SKU"));
  assert.ok(payload.channels.every((channel) => payload.skus.filter((item) => item.channel === channel.code).length >= 100));
  assert.ok(payload.skus.every((item) => Number.isFinite(item.incremental_reach_index) && Number.isFinite(item.substitution_risk_index)));
  assert.ok(payload.skus.every((item) => ["优先引入", "保留观察", "替换测试候选"].includes(item.assortment_action)));
  assert.equal(payload.model.train_n, 9000);
  assert.equal(payload.model.test_n, 3000);
  assert.ok(payload.model.test_auc >= 0.65);
  assert.ok(payload.model.coefficients.every((item) => Object.values(item).every((value) => typeof value !== "number" || Number.isFinite(value))));
  assert.match(payload.meta.prohibited_interpretation, /不代表京东.*真实销量/);
  assert.equal(payload.service_model.standard.price_assumption, "¥20,000/年");
  assert.match(payload.service_model.standard.label, /付费设计伙伴/);
  assert.ok(payload.service_model.standard.includes.includes("月度渠道TOP100可见商品池"));
  assert.equal(payload.external_benchmarks[1].value, "¥12,091亿");
  assert.equal(payload.external_benchmarks[2].value, "+16.8%");
  assert.equal(payload.channel_profiles.length, 8);
  assert.equal(payload.metric_dictionary.length, 16);
  assert.equal(payload.model_routes.length, 6);
  assert.equal(payload.subscription_workspaces.length, 6);
  assert.equal(payload.release_calendar.length, 4);
  assert.match(payload.subscription_workspaces.find((item) => item.name === "SKU与价格监测")?.status, /CSV/);
  assert.ok(payload.metric_dictionary.every((item) => item.definition && item.grain && item.source && item.cannot_answer));
  assert.deepEqual(payload.service_model.standard.includes, ["月度渠道TOP100可见商品池", "标准化价格、规格、促销与上新", "季度人群、场景、价格接受与需求机会", "TOP20%商品组合与价格带对照", "1页渠道沟通证据页/季度", "2个新品概念快速筛查/年"]);
});

test("implements six decision-output model prototypes for food research", () => {
  const componentPath = new URL("../app/components/PackagedFoodBeverageDashboard.tsx", import.meta.url);
  const source = readFileSync(componentPath, "utf8");

  for (const modelOutput of [
    "地区机会后验排序",
    "价格、促销与人群的预测购买概率",
    "增量触达 × 内部替代风险",
    "包装 × 位置 × 排面选择率",
    "概念—产品联合成功概率",
    "测试组与匹配对照组周销售指数",
  ]) {
    assert.match(source, new RegExp(modelOutput), `${modelOutput} should be implemented`);
  }
  assert.match(source, /模型支持的结论/);
  assert.match(source, /模拟模型演示/);
  assert.match(source, /官方数据只用于宏观先验或外部校准/);
  assert.match(source, /90%区间/);
  assert.match(source, /价格弹性/);
  assert.match(source, /差分净增量/);
  assert.match(source, /DECISION DATA LINEAGE/);
  assert.match(source, /fact_consumer_wave/);
  assert.match(source, /fact_store_sku_week/);
  assert.match(source, /DECISION EVIDENCE/);
  assert.match(source, /包装食品与饮料决策订阅/);
  assert.match(source, /当前筛选下需要处理的四项决策/);
  assert.match(source, /持续交付，不是一次性报告/);
  assert.match(source, /PRICE × PROMOTION RESPONSE SURFACE/);
  assert.match(source, /SEGMENT SENSITIVITY MATRIX/);
  assert.match(source, /Research market/);
  assert.match(source, /Ipsos China · Packaged food & beverage/);
});

test("loads the food prototype into an indexed SQLite evidence store", () => {
  const manifestPath = new URL("../output/packaged-food-beverage/database-manifest.json", import.meta.url);
  const payload = JSON.parse(readFileSync(manifestPath, "utf8"));

  assert.equal(payload.table_counts.food_skus, 840);
  assert.equal(payload.table_counts.food_metric_definitions, 16);
  assert.equal(payload.table_counts.food_model_coefficients, 10);
  assert.equal(payload.table_counts.food_subscription_workspaces, 6);
  assert.equal(payload.table_counts.food_public_product_observations, 118);
  assert.equal(payload.table_counts.food_public_source_registry, 8);
  assert.equal(payload.table_counts.food_data_quality_gates, 9);
  assert.equal(payload.table_counts.food_open_product_attribute_samples, 120);
  assert.equal(payload.table_counts.food_authoritative_sources, 5);
  assert.equal(payload.table_counts.food_authoritative_metrics, 9);
  assert.equal(payload.table_counts.food_regulatory_standards, 2);
  assert.equal(payload.table_counts.food_global_markets, 25);
  assert.equal(payload.table_counts.food_global_market_indicators, 100);
  assert.equal(payload.table_counts.food_global_indicator_validations, 25);
  assert.equal(payload.table_counts.food_global_market_data_layers, 175);
  assert.equal(payload.table_counts.food_global_trade_proxies, 84);
  assert.equal(payload.table_counts.food_global_product_attribute_releases, 6);
  assert.equal(payload.table_counts.food_global_product_attributes, 260);
  assert.equal(payload.table_counts.food_global_source_registry, 4);
  assert.equal(payload.table_counts.food_survey_releases, 1);
  assert.equal(payload.table_counts.food_questionnaire_items, 18);
  assert.equal(payload.table_counts.food_survey_metric_definitions, 17);
  assert.equal(payload.table_counts.food_survey_respondents, 5000);
  assert.equal(payload.table_counts.food_survey_dce_tasks, 40000);
  assert.equal(payload.table_counts.food_survey_kpi_results, 247);
  assert.equal(payload.table_counts.food_survey_model_coefficients, 20);
  assert.equal(payload.table_counts.food_survey_quality_gates, 5);
  assert.equal(payload.table_counts.food_research_knowledge_items, 57);
  assert.equal(payload.table_counts.food_questionnaire_recommendation_profiles, 4);
  assert.equal(payload.table_counts.food_research_project_intake_fields, 9);
  assert.equal(payload.table_counts.food_research_evidence_requirements, 9);
  assert.equal(payload.table_counts.food_cracker_case_respondents, 5000);
  assert.equal(payload.table_counts.food_cracker_case_dce_tasks, 30000);
  assert.equal(payload.table_counts.food_cracker_case_results, 110);
  assert.equal(payload.table_counts.food_cracker_case_model_coefficients, 21);
  assert.equal(payload.table_counts.food_snack_common_metrics, 16);
  assert.equal(payload.table_counts.food_snack_case_registry, 2);
  assert.equal(payload.table_counts.food_snack_common_observations, 8);
  assert.equal(payload.table_counts.food_snack_project_pool_respondents, 21600);
  assert.equal(payload.table_counts.food_snack_project_portfolio, 5);
  assert.equal(payload.table_counts.food_snack_project_model_ladder, 5);
  assert.equal(payload.table_counts.food_snack_service_teams, 3);
  assert.equal(payload.table_counts.food_snack_expert_directory, 4);
  assert.equal(payload.table_counts.food_research_quota_framework, 5);
  assert.equal(payload.table_counts.food_research_project_quality_controls, 10);
  assert.equal(payload.table_counts.food_research_delivery_templates, 14);
  assert.equal(payload.table_counts.food_research_checkpoints, 4);
  assert.equal(payload.table_counts.food_research_method_sources, 4);
  assert.match(payload.query_plans.channel_category[0][3], /idx_food_skus_channel_category/);
  assert.match(payload.query_plans.metric_family[0][3], /idx_food_metrics_family/);
  assert.match(payload.query_plans.public_retail_category_date[0][3], /idx_food_public_retail_category_date/);
  assert.match(payload.query_plans.public_brand[0][3], /idx_food_public_brand/);
  assert.match(payload.query_plans.open_attribute_brand[0][3], /idx_food_open_attribute_brand/);
  assert.match(payload.query_plans.open_attribute_quality[0][3], /idx_food_open_attribute_quality/);
  assert.match(payload.query_plans.authoritative_model_role[0][3], /idx_food_authoritative_metric_role/);
  assert.match(payload.query_plans.global_market_region[0][3], /idx_food_global_market_region/);
  assert.match(payload.query_plans.global_indicator_period[0][3], /idx_food_global_indicator/);
  assert.match(payload.query_plans.global_data_layer_status[0][3], /idx_food_global_layer_status/);
  assert.match(payload.query_plans.global_trade_market_year[0][3], /idx_food_global_trade_market_year/);
  assert.match(payload.query_plans.global_trade_hs_year[0][3], /idx_food_global_trade_hs_year/);
  assert.match(payload.query_plans.global_product_market_quality[0][3], /idx_food_global_product_market_quality/);
  assert.match(payload.query_plans.global_product_nutrition[0][3], /idx_food_global_product_nutrition/);
  assert.match(payload.query_plans.survey_demographic_cut[0][3], /idx_food_survey_demographics/);
  assert.match(payload.query_plans.survey_kpi_cut[0][3], /idx_food_survey_kpi_cut/);
  assert.match(payload.query_plans.research_knowledge_kind[0][3], /idx_food_research_knowledge_kind/);
  assert.equal(payload.global_market_boundary.market_count, 25);
  assert.equal(payload.research_knowledge_boundary.knowledge_item_count, 57);
  assert.match(payload.storage_boundary, /六国Open Food Facts.*膨化食品与薄脆饼干各N=5,000模拟问卷Raw.*不含真实受访者个人信息/);
});

test("quality-gates the bounded multi-market product attribute pilot", () => {
  const pilotPath = new URL("../output/packaged-food-beverage/global-product-attribute-pilot.json", import.meta.url);
  const payload = JSON.parse(readFileSync(pilotPath, "utf8"));

  assert.equal(payload.meta.market_count, 6);
  assert.equal(payload.meta.standardized_market_count, 5);
  assert.equal(payload.meta.record_count, 260);
  assert.equal(payload.meta.standardized_record_count, 160);
  assert.equal(payload.quality_profile.duplicate_composite_keys.length, 0);
  assert.equal(payload.quality_profile.missing_barcode_records, 0);
  assert.equal(payload.quality_profile.eligible_nutrition_records, 184);
  assert.equal(payload.quality_profile.eligible_pack_records, 166);
  assert.equal(payload.quality_profile.invalid_nutrition_records, 8);
  assert.deepEqual(payload.market_summaries.map((item) => item.market_code), ["CN", "US", "UK", "JP", "KR", "BR"]);
  assert.ok(payload.products.every((item) => item.market_code && item.barcode && item.quality_status));
  assert.match(payload.meta.blocked_use, /价格、销量、市场份额或消费者需求/);
});

test("builds a traceable public retail observation layer with hard quality gates", () => {
  const observationPath = new URL("../output/packaged-food-beverage/public-retail-observations.json", import.meta.url);
  const payload = JSON.parse(readFileSync(observationPath, "utf8"));
  const priceGate = payload.quality_gates.find((item) => item.gate_id === "G05");
  const channelGate = payload.quality_gates.find((item) => item.gate_id === "G08");
  const sourceGate = payload.quality_gates.find((item) => item.gate_id === "G01");
  const packGate = payload.quality_gates.find((item) => item.gate_id === "G02");
  const reviewGate = payload.quality_gates.find((item) => item.gate_id === "G04");
  const nutritionGate = payload.quality_gates.find((item) => item.gate_id === "G06");

  assert.equal(payload.meta.observation_count, 118);
  assert.equal(payload.meta.brand_count, 43);
  assert.equal(payload.meta.page_visible_total_label, "共5087件膨化食品");
  assert.match(payload.meta.page_visible_total_boundary, /不作为全市场SKU规模/);
  assert.ok(payload.observations.every((item) => item.source_url && item.retrieved_at && item.data_label === "公开页面观察"));
  assert.equal(payload.meta.detail_price_captured_count, 19);
  assert.equal(payload.meta.detail_price_attempted_count, 30);
  assert.equal(payload.observations.filter((item) => item.price_cny != null).length, 19);
  assert.equal(payload.observations.filter((item) => item.unit_price_per_100g_cny != null).length, 18);
  assert.equal(priceGate.value, "19/118 · 16.1%");
  assert.equal(sourceGate.value, "118/118条");
  assert.equal(packGate.value, "118/118条");
  assert.equal(reviewGate.value, "118/118条");
  assert.equal(nutritionGate.value, "0/118条");
  assert.equal(priceGate.status, "谨慎");
  assert.equal(channelGate.status, "阻断");
  assert.ok(payload.observations.some((item) => item.retailer_sku_id === "859518" && item.source_url === "https://item.jd.com/859518.html"));
  assert.ok(payload.observations.some((item) => item.model_eligibility === "excluded_category_conflict"));
  assert.equal(Math.max(...payload.observations.filter((item) => item.source_id === "JD_PUFFED_CATEGORY_BROWSER_20260812").map((item) => item.page_position)), 30);
});

test("keeps the global open-food attribute sample separate from China retail observations", () => {
  const samplePath = new URL("../output/packaged-food-beverage/open-food-facts-lays-sample.json", import.meta.url);
  const payload = JSON.parse(readFileSync(samplePath, "utf8"));

  assert.equal(payload.meta.sample_count, 20);
  assert.match(payload.meta.blocked_use, /不能与京东观察样本直接匹配/);
  assert.ok(payload.products.every((item) => item.barcode));
  assert.ok(payload.products.some((item) => Number.isFinite(item.nutrition_per_100g.energy_kcal)));
});

test("profiles and quality-gates the China-related open food sample", () => {
  const samplePath = new URL("../output/packaged-food-beverage/open-food-facts-china-snacks-sample.json", import.meta.url);
  const payload = JSON.parse(readFileSync(samplePath, "utf8"));

  assert.equal(payload.meta.sample_count, 100);
  assert.equal(payload.meta.result_count_reported_by_api, 144);
  assert.equal(payload.meta.field_coverage_counts.product_name, 87);
  assert.equal(payload.meta.field_coverage_counts.ingredients, 80);
  assert.equal(payload.meta.field_coverage_counts.nutrition_chart_eligible, 40);
  assert.equal(payload.meta.field_coverage_counts.invalid_nutrition_excluded, 5);
  assert.ok(payload.products.some((item) => item.quality_status === "excluded_invalid_nutrition"));
});

test("answers food research questions with explicit data labels and outcome boundaries", async () => {
  const [price, model, boundary, observed, observedPrice, nutrition] = await Promise.all([
    foodResearchAnswer("零食量贩的膨化食品价格带是多少？"),
    foodResearchAnswer("购买选择模型的关键变量是什么？"),
    foodResearchAnswer("现有数据能否回答真实市场份额？"),
    foodResearchAnswer("公开页面观察中有哪些膨化食品规格？"),
    foodResearchAnswer("公开商品观察能否回答真实价格带？"),
    foodResearchAnswer("中国零食的营养、钠和配料字段是否可用？"),
  ]);

  assert.equal(price.mode, "local-food-evidence-retrieval");
  assert.equal(price.answer.matchedBy, "sku_price_distribution");
  assert.equal(price.answer.dataLabel, "模拟数据");
  assert.match(price.answer.answer, /每100g价格中间50%/);
  assert.equal(model.answer.matchedBy, "model_validation_and_coefficients");
  assert.match(model.answer.answer, /AUC=0\.667.*Brier=0\.210/);
  assert.match(model.answer.boundary, /不能作为真实品牌销量/);
  assert.equal(boundary.answer.matchedBy, "unsupported_real_outcome");
  assert.match(boundary.answer.answer, /没有渠道POS或品牌成交数据/);
  assert.equal(observed.answer.matchedBy, "public_retail_observation_registry");
  assert.equal(observed.answer.dataLabel, "公开页面观察");
  assert.match(observed.answer.answer, /58条.*19个品牌/);
  const nuts = await foodResearchAnswer("公开页面观察中有哪些坚果炒货商品？");
  assert.match(nuts.answer.answer, /30条.*品牌/);
  assert.equal(observedPrice.answer.matchedBy, "public_observation_price_quality_gate");
  assert.match(observedPrice.answer.answer, /19条当前规格详情价.*18条可精确标准化.*中位数/);
  assert.equal(nutrition.answer.matchedBy, "china_open_food_attribute_quality");
  assert.equal(nutrition.answer.dataLabel, "公开开放数据样本");
  assert.match(nutrition.answer.answer, /144条.*前100条.*40条.*38条.*5条/);
  assert.match(nutrition.answer.boundary, /不等于中国实时在售/);
});

test("computes the AIPC W2 metric layer from Raw with subgroup bases", () => {
  const aggregatePath = new URL("../output/lenovo-pc-intelligence/aipc-w2-aggregates.json", import.meta.url);
  const payload = JSON.parse(readFileSync(aggregatePath, "utf8"));
  const factors = payload.metrics.find((item) => item.metric_key === "aipc_core_purchase_factor");
  const purchaseChannel = payload.metrics.find((item) => item.metric_key === "aipc_purchase_channel");

  assert.equal(payload.meta.project, "AIPC进店用户调研（第二期）");
  assert.equal(payload.meta.metric_count, 29);
  assert.equal(factors.base_unweighted, 1000);
  assert.deepEqual(
    factors.options.slice(0, 3).map((item) => [item.label, item.percent]),
    [["性能配置", 56.8], ["屏幕", 45], ["内置AI功能", 36.9]],
  );
  assert.equal(factors.subgroups.find((item) => item.dimension === "用户类型" && item.dimension_value === "潜在用户")?.base, 516);
  assert.equal(purchaseChannel.analysis_unit, "respondent_with_any_purchased_device");
  assert.equal(purchaseChannel.base_unweighted, 484);
});

test("blocks Q14 deployment when a later wave is quota-constrained", () => {
  const diagnosisPath = new URL("../output/lenovo-pc-intelligence/pc-q14-dynamic-forecast.json", import.meta.url);
  const payload = JSON.parse(readFileSync(diagnosisPath, "utf8"));

  assert.equal(payload.meta.deployment_status, "blocked_pending_sample_frame_harmonization");
  assert.equal(payload.later_wave_validation.value, 50);
  assert.equal(payload.later_wave_validation.positive_n, 500);
  assert.equal(payload.later_wave_validation.comparability_status, "quota_constrained_not_natural_market_holdout");
  assert.match(payload.decision.client_answer, /不能确认笔记本自然需求下降11\.3个百分点/);
  assert.equal(payload.historical_frozen_forecast.interval_low, 55.94);
  assert.equal(payload.historical_frozen_forecast.interval_high, 66.65);
});

test("turns AIPC evidence into traceable client decisions", () => {
  const decisionsPath = new URL("../output/lenovo-pc-intelligence/aipc-decision-outputs.json", import.meta.url);
  const payload = JSON.parse(readFileSync(decisionsPath, "utf8"));
  const product = payload.outputs.find((item) => item.decision_id === "aipc_product_story");
  const store = payload.outputs.find((item) => item.decision_id === "aipc_store_conversion");

  assert.equal(payload.meta.output_count, 4);
  assert.match(product.conclusion, /性能与屏幕.*AI信息处理/);
  assert.deepEqual(product.evidence.slice(0, 3).map((item) => [item.question, item.value, item.base_unweighted]), [
    ["B11", 56.8, 1000], ["B11", 45, 1000], ["B11", 36.9, 1000],
  ]);
  assert.match(store.action, /销售知识测评/);
  assert.match(store.model_evidence.interpretation, /不能当作.*因果增量/);
});

test("answers research questions from the server-side evidence index", async () => {
  const [store, drift, price, consumer, smb, ambiguous] = await Promise.all([
    researchAnswer("门店转化先改什么？"),
    researchAnswer("FY25 Q4的Q14为什么不能直接说需求下降？"),
    researchAnswer("目前可以估计PC价格弹性吗？"),
    researchAnswer("大众消费者Q713的AI PC无提示认知趋势？"),
    researchAnswer("SMB Q237的AI PC品牌认知是多少？"),
    researchAnswer("Q58品牌认知是多少？"),
  ]);

  assert.equal(store.mode, "local-evidence-retrieval");
  assert.match(store.answer.answer, /销售人员.*真机体验/);
  assert.ok(store.answer.evidence.some((item) => item.label.includes("C3")));
  assert.match(drift.answer.answer, /配额固定为1:1/);
  assert.match(drift.answer.boundary, /不是实际购买、销量或市场份额/);
  assert.match(price.answer.title, /不能直接回答价格弹性/);
  assert.match(price.answer.boundary, /不会用单题预算分布/);
  assert.equal(consumer.answer.matchedBy, "historical_metric:bht_consumer_q713");
  assert.match(consumer.answer.answer, /52\.0%.*51\.0%.*62\.0%.*58\.0%/);
  assert.match(consumer.answer.points[0], /Base N=2,400/);
  assert.equal(smb.answer.matchedBy, "historical_metric:bht_smb_q237");
  assert.match(smb.answer.title, /Q237/);
  assert.equal(ambiguous.answer.matchedBy, "metric_definition_ambiguous:Q58");
  assert.match(ambiguous.answer.answer, /指定大众消费者、SMB或政企大客户/);
});

test("publishes a source-backed PC data release with quality gates", () => {
  const releasePath = new URL("../output/lenovo-pc-intelligence/pc-data-release.json", import.meta.url);
  const payload = JSON.parse(readFileSync(releasePath, "utf8"));
  const q14 = payload.datasets.find((item) => item.dataset_id === "lenovo_fy25q4_q14_gate");
  const aipc = payload.datasets.find((item) => item.dataset_id === "aipc_store_w2");

  assert.equal(payload.release.datasets, 5);
  assert.equal(payload.release.metric_definitions, 119);
  assert.equal(payload.release.aipc_aggregate_observations, 4825);
  assert.equal(payload.quality_gates.length, 5);
  assert.match(q14.comparability, /阻断.*1:1配额/);
  assert.ok(q14.blocked_use.includes("自然市场需求变化"));
  assert.match(aipc.coverage, /29组指标.*4,825条聚合观测/);
  assert.equal(payload.next_release_requirements.filter((item) => item.priority === "P0").length, 2);
});

test("registers official research capabilities and decision-specific model routes", () => {
  const registryPath = new URL("../output/lenovo-pc-intelligence/research-agent-registry.json", import.meta.url);
  const payload = JSON.parse(readFileSync(registryPath, "utf8"));

  assert.deepEqual(payload.capabilities.map((item) => item.code), ["BHT", "CRE", "INNO", "MSU", "SL"]);
  assert.equal(payload.routes.length, 6);
  const pc = payload.routes.find((item) => item.route_id === "pc_industry_opportunity");
  const campaign = payload.routes.find((item) => item.route_id === "campaign_effectiveness");
  const tracking = payload.routes.find((item) => item.route_id === "tracking_forecast");
  assert.equal(pc.primary_capability, "MSU");
  assert.ok(pc.primary_models.includes("分层贝叶斯跨期预测"));
  assert.ok(pc.evidence_gaps.includes("实际销量/转化结果"));
  assert.equal(campaign.primary_capability, "CRE");
  assert.ok(campaign.research_design.some((item) => /暴露\/对照/.test(item)));
  assert.equal(tracking.primary_capability, "BHT");
  assert.ok(tracking.client_outputs.includes("逐KPI预测值与区间"));
});

test("extracts Lenovo PC project evidence from the FY26 platform tables", () => {
  const evidencePath = new URL("../output/lenovo-pc-intelligence/platform-metrics.json", import.meta.url);
  const payload = JSON.parse(readFileSync(evidencePath, "utf8"));
  const consumer = payload.audiences.find((item) => item.code === "consumer");
  const smb = payload.audiences.find((item) => item.code === "smb");
  const enterprise = payload.audiences.find((item) => item.code === "enterprise");

  assert.equal(payload.meta.study, "联想FY26品牌健康度监测");
  assert.equal(payload.meta.latest_wave, "26 Jun");
  assert.deepEqual(
    [consumer.ai_pc.unaided.value, consumer.ai_pc.aided.value, consumer.ai_pc.unaided.base],
    [23, 36, 2000],
  );
  assert.deepEqual(
    [smb.ai_pc.unaided.value, smb.ai_pc.aided.value, smb.ai_pc.reputation.value, smb.ai_pc.aided.base],
    [22, 40, 17, 1200],
  );
  assert.deepEqual(
    [enterprise.ai_pc.unaided.value, enterprise.ai_pc.aided.value, enterprise.ai_pc.aided.base],
    [28, 42, 600],
  );
  assert.deepEqual(
    payload.enterprise_selection_factors.factors.slice(0, 4).map((item) => [item.indicator, item.value]),
    [
      ["产品品质和稳定性", 63],
      ["产品配置和技术参数", 54],
      ["品牌知名度高", 45],
      ["产品设计功能符合业务需求", 41],
    ],
  );
});

test("maintains a current external calibration register with guarded uses", () => {
  const registerPath = new URL("../output/consumer-electronics-industry/external-calibration-register.json", import.meta.url);
  const payload = JSON.parse(readFileSync(registerPath, "utf8"));
  const omdia = payload.sources.find((item) => item.id === "omdia_china_pc_2025_2026");
  const cnnic = payload.sources.find((item) => item.id === "cnnic_57");
  const nbs = payload.sources.find((item) => item.id === "nbs_income_2025");

  const population = payload.sources.find((item) => item.id === "nbs_population_2025");

  assert.equal(payload.as_of, "2026-08-12");
  assert.equal(omdia.published, "2026-06-22");
  assert.deepEqual(
    omdia.headline_evidence.slice(0, 4).map((item) => item.value),
    [8.9, -2, 36, -14],
  );
  assert.deepEqual(
    cnnic.headline_evidence.slice(0, 3).map((item) => item.value),
    [11.25, 80.1, 6.02],
  );
  assert.equal(nbs.headline_evidence.find((item) => item.metric.includes("中位数"))?.value, 36231);
  assert.ok(omdia.not_allowed.includes("purchase-intent replacement"));
  assert.ok(cnnic.not_allowed.includes("PC ownership calibration"));
  assert.deepEqual(population.headline_evidence.slice(1).map((item) => item.value), [51.03, 48.97]);
  assert.ok(population.not_allowed.includes("PC eligible-universe estimate"));
});

test("documents separate product-opportunity and data-product validation systems", () => {
  const systemPath = new URL("../output/consumer-electronics-industry/PRODUCT_VALIDATION_SYSTEM.md", import.meta.url);
  const system = readFileSync(systemPath, "utf8");

  assert.match(system, /单个产品机会是否成立/);
  assert.match(system, /订阅式数据产品是否成立/);
  assert.match(system, /不能把 N=1,000 复制100次当作 N=100,000/);
  assert.match(system, /时间留出AUC、Brier、校准/);
  assert.match(system, /接入销量、转化或其他真实商业结果/);
});

test("ships fitted propensity models with coefficients and time-holdout validation", () => {
  const modelPath = new URL("../output/consumer-electronics-industry/propensity-model-results.json", import.meta.url);
  const payload = JSON.parse(readFileSync(modelPath, "utf8"));
  const pcChina = payload.models.find((item) => item.market === "CN" && item.category === "pc");

  assert.equal(payload.models.length, 56);
  assert.equal(payload.meta.model, "L2正则化逻辑回归");
  assert.equal(pcChina.train_n, 24000);
  assert.equal(pcChina.test_n, 8000);
  assert.ok(pcChina.metrics.test_auc > 0.6);
  assert.equal(pcChina.calibration.length, 10);
  assert.ok(Number.isFinite(pcChina.intercept));
  assert.ok(pcChina.effective_train_n > 23000);
  assert.match(pcChina.weighting, /后分层校准/);
  assert.deepEqual(pcChina.weight_range.length, 2);
  assert.equal(pcChina.profile_options.age_group.length, 5);
  assert.equal(typeof pcChina.default_profile.ai_interest, "number");
  for (const source of ["age_group", "gender", "income_group", "region_group", "ai_interest", "price_sensitivity"]) {
    assert.ok(pcChina.coefficients.some((item) => item.source === source), `${source} coefficient should exist`);
  }
  for (const source of [
    "ai_interest__x__replacement_urgency",
    "ai_interest__x__innovation_orientation",
    "owns_device__x__replacement_urgency",
    "price_sensitivity__x__ai_attitude",
  ]) {
    assert.ok(pcChina.coefficients.some((item) => item.source === source), `${source} interaction should exist`);
  }
});

test("shows ByteDance project models only inside the ByteDance workspace", async () => {
  const html = await renderHtml("/clients/bytedance");

  assert.match(html, /字节跳动项目空间/);
  assert.match(html, /选择研究项目/);
  assert.match(html, /TT及外部竞品生态满意度调研/);
  assert.match(html, /TikTok Search Awareness Tracking/);
  assert.match(html, /href="\/clients\/bytedance\/ecosystem"/);
  assert.match(html, /href="\/clients\/bytedance\/search-awareness"/);
  assert.doesNotMatch(html, /联想|Lenovo/);
});

test("keeps the Lenovo portal at project-selection level", async () => {
  const html = await renderHtml("/clients/lenovo");

  assert.match(html, /联想消费者研究空间/);
  assert.match(html, /选择业务模块与项目/);
  assert.match(html, /2026 FIFA 世界杯 Campaign 后测/);
  assert.match(html, /AI PC Adoption Tracker/);
  assert.match(html, /Lenovo BHT \+ Social Dashboard/);
  assert.match(html, /客户.*业务模块.*项目.*模型与洞察/s);
  assert.match(html, /href="\/clients\/lenovo\/campaign"/);
  assert.match(html, /href="\/clients\/lenovo\/aipc"/);
  assert.match(html, /href="\/clients\/lenovo\/bht-social"/);
  assert.doesNotMatch(html, /字节跳动|ByteDance/);
});

test("renders separate Lenovo project workspaces", async () => {
  const [campaign, aipc] = await Promise.all([
    renderHtml("/clients/lenovo/campaign"),
    renderHtml("/clients/lenovo/aipc"),
  ]);

  assert.match(campaign, /世界杯 Campaign/);
  assert.match(campaign, /项目洞察/);
  assert.match(campaign, /模型工作台/);
  assert.match(campaign, /返回联想项目/);
  assert.doesNotMatch(campaign, /字节跳动|ByteDance/);

  assert.match(aipc, /AI PC 消费者模型/);
  assert.match(aipc, /79\.2%/);
  assert.match(aipc, /MULTIVARIATE FILTER/);
  assert.match(aipc, /AUC .*0\.870/);
  assert.match(aipc, /ADJUSTED DRIVERS/);
  assert.match(aipc, /W3 保留 B5 \/ C1 \/ C2/);
  assert.match(aipc, /未来三年 AI PC 渗透率/);
  assert.match(aipc, /品牌选择、功能效用与价格弹性/);
  assert.match(aipc, /Consumer Digital Twin/);
  assert.match(aipc, /返回联想项目/);
  assert.doesNotMatch(aipc, /字节跳动|ByteDance/);
});

test("renders the Lenovo BHT and Social dashboard with model and subgroup selectors", async () => {
  const html = await renderHtml("/clients/lenovo/bht-social");

  assert.match(html, /联想 BHT \+ Social Dashboard/);
  assert.match(html, /BHT \+ Social 管理总览/);
  assert.match(html, /子群差异与跨期变化/);
  assert.match(html, /消费市场/);
  assert.match(html, /AI PC 高兴趣人群/);
  assert.match(html, /FY25\/26 Q3/);
  assert.match(html, /品牌健康指数/);
  assert.match(html, /Social 热度指数/);
  assert.match(html, /返回联想项目/);
  assert.doesNotMatch(html, /字节跳动|ByteDance/);
});

test("renders the ByteDance ecosystem cross-period decision models", async () => {
  const html = await renderHtml("/clients/bytedance/ecosystem");

  assert.match(html, /TT及外部竞品生态满意度调研/);
  assert.match(html, /第六期 KPI 预测矩阵/);
  assert.match(html, /W6−W5/);
  assert.match(html, /W6−W4/);
  assert.match(html, /Q4_2/);
  assert.match(html, /Q4_3/);
  assert.match(html, /Q5_1/);
  assert.match(html, /Q5\.b_1/);
  assert.match(html, /Q5\.b_2/);
  assert.match(html, /Q5\.b_3/);
  assert.match(html, /N=400/);
  assert.match(html, /Instagram/);
  assert.match(html, /YouTube/);
  assert.match(html, /IG Reels/);
  assert.match(html, /美国.*US.*英国.*UK.*日本.*JP/s);
  assert.match(html, /第六期 TikTok 总体内容满意度预测/);
  assert.match(html, /74\.9%/);
  assert.match(html, /71\.9%–77\.9%/);
  assert.match(html, /跨期模型/);
  assert.match(html, /题意重置/);
  assert.match(html, /冷启动模型/);
  assert.doesNotMatch(html, /href="\/clients\/bytedance\/ecosystem\/report"/);
  assert.doesNotMatch(html, /Search Mindset Tracker|生态合作伙伴满意度/);
});

test("renders the separate ByteDance ecosystem web readout", async () => {
  const html = await renderHtml("/clients/bytedance/ecosystem/report");

  assert.match(html, /TT及外部竞品生态满意度调研/);
  assert.match(html, /第六期模型预测/);
  assert.match(html, /74\.9%/);
  assert.match(html, /71\.9%–77\.9%/);
});

test("renders the TikTok Search Awareness Tracking model", async () => {
  const html = await renderHtml("/clients/bytedance/search-awareness");

  assert.match(html, /TikTok Search Awareness Tracking/);
  assert.match(html, /Q14–Q16 搜索漏斗/);
  assert.match(html, /75\.36/);
  assert.match(html, /44\.77/);
  assert.match(html, /9\.49/);
  assert.match(html, /Q15_4/);
  assert.match(html, /24 \/ 24/);
  assert.match(html, /Q14–Q16 KPI 漏斗与七国差异/);
});

test("links demographic and channel filters through one segment-estimation model", async () => {
  const { adjustPriceAcceptanceCurve, buildSegmentEstimate } = await import("../app/lib/segmentEstimate.ts");
  const kpiPath = new URL("../output/packaged-food-beverage/china-snack-kpi-system.json", import.meta.url);
  const kpi = JSON.parse(readFileSync(kpiPath, "utf8"));
  const shared = {
    overall: kpi.overall_kpis,
    subgroupRows: kpi.subgroup_kpis,
    age: "25-34",
    region: "华东",
  };
  const lowIncome = buildSegmentEstimate({ ...shared, income: "6000以下", channelShift: 1.5 });
  const highIncome = buildSegmentEstimate({ ...shared, income: "20000以上", channelShift: 5.2 });
  const olderSouthwest = buildSegmentEstimate({ ...shared, age: "45-54", income: "6000以下", region: "西南", channelShift: 1.5 });

  assert.equal(lowIncome.method, "partial_pooling_additive");
  assert.equal(lowIncome.modelBaseN, 5000);
  assert.ok(lowIncome.approximateCellBaseN >= 30);
  assert.ok(lowIncome.interval90Pp > 0);
  assert.ok(highIncome.kpis.price_accept_7_9 > lowIncome.kpis.price_accept_7_9);
  assert.notEqual(highIncome.kpis.purchase_intent_t2b, olderSouthwest.kpis.purchase_intent_t2b);
  assert.notEqual(highIncome.kpis.concept_trial_t2b, lowIncome.kpis.concept_trial_t2b);

  const adjustedCurve = adjustPriceAcceptanceCurve(
    kpi.price_curve,
    kpi.overall_kpis.price_accept_7_9,
    highIncome.kpis.price_accept_7_9,
  );
  assert.equal(adjustedCurve.length, kpi.price_curve.length);
  assert.ok(adjustedCurve[1].acceptance_rate > kpi.price_curve[1].acceptance_rate);
  assert.ok(adjustedCurve.every((point, index) => index === 0 || point.acceptance_rate <= adjustedCurve[index - 1].acceptance_rate));
});

test("never renders commercial or settlement file terms on any client-facing route", async () => {
  const routes = [
    "/", "/tmt", "/packaged-food-beverage", "/clients/lenovo", "/clients/lenovo/campaign",
    "/tmt/consumer-electronics",
    "/clients/lenovo/aipc", "/clients/lenovo/bht-social", "/clients/bytedance",
    "/clients/bytedance/ecosystem", "/clients/bytedance/ecosystem/report", "/clients/bytedance/search-awareness",
  ];
  for (const route of routes) {
    const html = await renderHtml(route);
    assert.doesNotMatch(html, blockedDisplayTerms, `${route} must not expose blocked display terms`);
  }
});
