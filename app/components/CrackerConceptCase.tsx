"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import caseJson from "../../output/packaged-food-beverage/cracker-concept-simulation.json";
import commonJson from "../../output/packaged-food-beverage/snack-common-project-system.json";
import workbenchJson from "../../output/packaged-food-beverage/snack-project-workbench.json";
import { publicAssetPath } from "../lib/publicRuntime";


type Locale = "zh" | "en";
type View = "decision" | "model" | "learning";
type CutDimension = "segment" | "age_group" | "region" | "income";

const CHART_DIMENSION = { width: 800, height: 320 };

function tr(locale: Locale, zh: string, en: string) {
  return locale === "zh" ? zh : en;
}

function fmt(value: number, digits = 1) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function CaseTag({ children }: { children: React.ReactNode }) {
  return <span className="cracker-case-tag">{children}</span>;
}

function downloadUrl(name: string) {
  return publicAssetPath(`/downloads/${name}`);
}

const CUT_LABELS: Record<CutDimension, { zh: string; en: string }> = {
  segment: { zh: "需求人群", en: "Need segment" },
  age_group: { zh: "年龄", en: "Age" },
  region: { zh: "地区", en: "Region" },
  income: { zh: "月收入", en: "Monthly income" },
};

const EN_VALUE: Record<string, string> = {
  "轻负担品质派": "Light-quality seekers", "随身便利派": "Convenience seekers", "经典口味主流派": "Classic mainstream",
  "新口味尝鲜派": "Flavor explorers", "家庭性价比派": "Value families",
  "华东": "East China", "华南": "South China", "华北": "North China", "华中": "Central China", "西南": "Southwest China",
  "6000以下": "Below ¥6k", "6000-12000": "¥6k–12k", "12000-20000": "¥12k–20k", "20000以上": "Above ¥20k",
};

function localValue(locale: Locale, value: string) {
  return locale === "zh" ? value : EN_VALUE[value] ?? value;
}

export default function CrackerConceptCase({ locale }: { locale: Locale }) {
  const [view, setView] = useState<View>("decision");
  const [cutDimension, setCutDimension] = useState<CutDimension>("segment");
  const [cutValue, setCutValue] = useState(caseJson.decision_output.target_segment);
  const [flavor, setFlavor] = useState("海盐香葱");
  const [pack, setPack] = useState(80);
  const [resealable, setResealable] = useState(1);
  const [health, setHealth] = useState("轻油烘焙");
  const [brand, setBrand] = useState("成长品牌");
  const [price, setPrice] = useState(9.9);

  const cutRows = useMemo(() => caseJson.subgroup_kpis.filter((row) => row.dimension === cutDimension), [cutDimension]);
  const activeCut = cutRows.find((row) => row.value === cutValue) ?? cutRows[0];
  const segmentRows = caseJson.subgroup_kpis.filter((row) => row.dimension === "segment");
  const propensityDrivers = [...caseJson.models.trial_propensity.coefficients]
    .filter((row) => row.variable !== "截距")
    .sort((a, b) => Math.abs(b.impact_pp_q25_q75) - Math.abs(a.impact_pp_q25_q75))
    .slice(0, 8);
  const dceDrivers = caseJson.models.discrete_choice.coefficients.filter((row) => row.variable !== "截距");
  const dceMap = Object.fromEntries(dceDrivers.map((row) => [row.variable, row.coefficient]));

  const scenarioUtility = (scenario: { price: number; flavor: string; pack: number; resealable: number; health: string; brand: string }) => {
    let utility = scenario.price * (dceMap["价格（每增加1元）"] ?? 0);
    if (scenario.flavor !== "经典原味") utility += dceMap[scenario.flavor] ?? 0;
    if (scenario.pack === 80) utility += dceMap["80g规格"] ?? 0;
    if (scenario.pack === 120) utility += dceMap["120g规格"] ?? 0;
    if (scenario.resealable) utility += dceMap["可重复封口"] ?? 0;
    if (scenario.health !== "无特别表达") utility += dceMap[scenario.health] ?? 0;
    if (scenario.brand !== "新锐品牌") utility += dceMap[scenario.brand] ?? 0;
    return utility;
  };
  const currentUtility = scenarioUtility({ price, flavor, pack, resealable, health, brand });
  const referenceUtility = scenarioUtility({ price: 8.9, flavor: "经典原味", pack: 120, resealable: 0, health: "无特别表达", brand: "成长品牌" });
  const scenarioProbability = 100 / (1 + Math.exp(-(currentUtility - referenceUtility)));

  const sampleContributionChart = workbenchJson.case_registry.map((row) => ({
    project: row.name.replace("中国", "").replace("海盐香葱", ""), sample_n: row.sample_n,
  }));
  const comparableMetrics = ["SNACK_PEN_3M", "SNACK_ACTIVE_MONTH", "SNACK_CONCEPT_TRIAL", "SNACK_UNMET_GAP"];
  const commonComparison = comparableMetrics.map((metricId) => {
    const metric = commonJson.common_metrics.find((row) => row.metric_id === metricId);
    const observations = commonJson.metric_observations.filter((row) => row.metric_id === metricId);
    return {
      metric: metric?.name.replace("过去3个月品类", "品类").replace("比例", "") ?? metricId,
      膨化食品: observations.find((row) => row.category === "膨化食品")?.value ?? 0,
      薄脆饼干: observations.find((row) => row.category === "咸味薄脆饼干")?.value ?? 0,
    };
  });
  const metricFamilies = Array.from(new Set(commonJson.common_metrics.map((row) => row.family))).map((family) => ({
    family, count: commonJson.common_metrics.filter((row) => row.family === family).length,
  }));

  return <div className="cracker-case-shell">
    <section className="cracker-case-header">
      <div>
        <span>CONCEPT RESEARCH CASE</span>
        <h1>{tr(locale, "海盐香葱薄脆饼干新品研究", "Sea-salt scallion cracker concept research")}</h1>
        <p>{tr(locale, caseJson.case_brief.business_decision, "Which consumers, configuration, price and launch channels should a growing brand test first?")}</p>
      </div>
      <aside><CaseTag>{tr(locale, "模拟研究数据", "Simulated research")}</CaseTag><strong>N={caseJson.meta.respondent_count.toLocaleString()}</strong><small>{caseJson.meta.dce_task_count.toLocaleString()} {tr(locale, "条选择任务", "choice tasks")}</small></aside>
    </section>

    <nav className="cracker-case-nav">
      {(["decision", "model", "learning"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "decision" ? tr(locale, "决策结论", "Decision") : item === "model" ? tr(locale, "数据与模型", "Data & models") : tr(locale, "通用层学习", "Shared learning")}</button>)}
      <span>{tr(locale, "当前结果只验证分析链路，不代表真实中国市场", "Results validate the workflow only; they are not China market estimates")}</span>
    </nav>

    {view === "decision" && <>
      <section className="cracker-verdict">
        <div><span>DECISION</span><h2>{tr(locale, "建议进入实物产品测试，不直接进入上市决策", "Advance to physical product testing, not directly to launch")}</h2><p>{tr(locale, caseJson.decision_output.interpretation, "The simulation supports blind product and shelf tests, but not sales or distribution commitments.")}</p></div>
        <aside><b>{tr(locale, "总体概念试购", "Overall concept trial")}</b><strong>{fmt(caseJson.overall_kpis.concept_trial_t2b)}%</strong><small>{tr(locale, "模拟问卷加权结果", "weighted simulated survey")}</small></aside>
      </section>

      <section className="cracker-decision-cards">
        <article><span>01 · {tr(locale, "目标人群", "Audience")}</span><strong>{localValue(locale, caseJson.decision_output.target_segment)}</strong><b>{fmt(caseJson.decision_output.target_segment_trial)}%</b><p>{tr(locale, `模型预测试购意向，Base N=${caseJson.decision_output.target_segment_base_n}`, `model-predicted trial, Base N=${caseJson.decision_output.target_segment_base_n}`)}</p></article>
        <article><span>02 · {tr(locale, "产品配置", "Configuration")}</span><strong>{tr(locale, caseJson.decision_output.recommended_scenario, "Sea-salt scallion light-baked cracker")}</strong><b>{fmt(caseJson.decision_output.recommended_scenario_share)}%</b><p>{tr(locale, "三个固定方案内相对选择份额", "relative share among three fixed scenarios")}</p></article>
        <article><span>03 · {tr(locale, "测试价格", "Test price")}</span><strong>¥{fmt(caseJson.decision_output.test_price_cny)}</strong><b>{fmt(caseJson.decision_output.price_acceptance)}%</b><p>{tr(locale, `80g价格接受；升至¥12.9下降${fmt(caseJson.decision_output.price_risk_drop_to_12_9_pp)}个百分点`, `80g acceptance; moving to ¥12.9 reduces acceptance by ${fmt(caseJson.decision_output.price_risk_drop_to_12_9_pp)} points`)}</p></article>
        <article><span>04 · {tr(locale, "首轮渠道", "First channels")}</span><strong>{caseJson.decision_output.priority_channels.join(" + ")}</strong><b>{fmt(caseJson.decision_output.largest_unmet_gap)}</b><p>{tr(locale, `${caseJson.decision_output.largest_unmet_need}为最大需求缺口`, `${caseJson.decision_output.largest_unmet_need} is the largest need gap`)}</p></article>
      </section>

      <section className="cracker-grid two">
        <article className="cracker-panel">
          <header><div><span>NEED GAP</span><h3>{tr(locale, "重要性高，但当前满足不足的需求", "Important needs with weak current satisfaction")}</h3></div><CaseTag>{tr(locale, "模拟", "Simulated")}</CaseTag></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><ScatterChart margin={{ top: 18, right: 24, bottom: 24, left: 12 }}><CartesianGrid stroke="#e4e8ef" /><XAxis type="number" dataKey="satisfaction" name={tr(locale, "满足度", "Satisfaction")} domain={[2.4, 4.2]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="importance" name={tr(locale, "重要性", "Importance")} domain={[2.8, 4.2]} tick={{ fontSize: 9 }} /><ZAxis dataKey="gap_points" range={[80, 460]} /><ReferenceLine x={3} stroke="#ef9b2d" strokeDasharray="4 4" /><ReferenceLine y={3.5} stroke="#0aa59e" strokeDasharray="4 4" /><Tooltip cursor={{ strokeDasharray: "4 4" }} /><Scatter data={caseJson.unmet_needs} fill="#263aa5">{caseJson.unmet_needs.map((row) => <Cell key={row.need} fill={row.need === caseJson.decision_output.largest_unmet_need ? "#ef9b2d" : "#263aa5"} />)}</Scatter></ScatterChart></ResponsiveContainer></div>
          <footer>{tr(locale, `“${caseJson.decision_output.largest_unmet_need}”缺口${fmt(caseJson.decision_output.largest_unmet_gap)}分，应进入配方与实物盲测；问卷不能替代产品体验。`, `The largest gap should enter formulation and blind product testing; survey evidence cannot replace product experience.`)}</footer>
        </article>
        <article className="cracker-panel">
          <header><div><span>SEGMENT OPPORTUNITY</span><h3>{tr(locale, "人群规模、价格接受与试购倾向", "Segment size, price acceptance and trial propensity")}</h3></div></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><ScatterChart margin={{ top: 18, right: 24, bottom: 24, left: 12 }}><CartesianGrid stroke="#e4e8ef" /><XAxis type="number" dataKey="price_accept_9_9" name={tr(locale, "¥9.9接受率", "¥9.9 acceptance")} unit="%" domain={[45, 90]} tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="model_predicted_trial" name={tr(locale, "预测试购", "Predicted trial")} unit="%" domain={[15, 42]} tick={{ fontSize: 9 }} /><ZAxis dataKey="base_n" range={[90, 520]} /><Tooltip cursor={{ strokeDasharray: "4 4" }} /><Scatter data={segmentRows} fill="#0aa59e">{segmentRows.map((row) => <Cell key={row.value} fill={row.value === caseJson.decision_output.target_segment ? "#ef9b2d" : "#0aa59e"} />)}</Scatter></ScatterChart></ResponsiveContainer></div>
          <footer>{tr(locale, `${caseJson.decision_output.target_segment}不仅试购倾向较高，¥9.9接受率也达到${fmt(segmentRows.find((row) => row.value === caseJson.decision_output.target_segment)?.price_accept_9_9 ?? 0)}%，避免只按单一意向指标选人。`, `The priority segment combines trial propensity with price acceptance rather than ranking on intent alone.`)}</footer>
        </article>
      </section>

      <section className="cracker-grid wide-left">
        <article className="cracker-panel">
          <header><div><span>PRICE RESPONSE</span><h3>{tr(locale, "80g价格接受率与收入指数", "80g price acceptance and revenue index")}</h3></div></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><LineChart data={caseJson.price_curve} margin={{ top: 18, right: 24, bottom: 18, left: 8 }}><CartesianGrid stroke="#e4e8ef" vertical={false} /><XAxis dataKey="price_cny" tickFormatter={(value) => `¥${value}`} tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><ReferenceLine x={9.9} stroke="#ef9b2d" strokeDasharray="4 4" /><Line type="monotone" dataKey="acceptance_rate" name={tr(locale, "价格接受率", "Acceptance")} stroke="#263aa5" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="revenue_index" name={tr(locale, "收入指数", "Revenue index")} stroke="#0aa59e" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        </article>
        <article className="cracker-evidence-chain">
          <header><span>RECOMMENDATION LOGIC</span><h3>{tr(locale, "结论由什么证据支持", "Evidence behind the recommendation")}</h3></header>
          <ol>
            <li><b>{tr(locale, "需求", "Need")}</b><p>{tr(locale, `轻负担/成分缺口${fmt(caseJson.decision_output.largest_unmet_gap)}分。`, `Lightness and ingredients have a ${fmt(caseJson.decision_output.largest_unmet_gap)}-point gap.`)}</p></li>
            <li><b>{tr(locale, "配置", "Configuration")}</b><p>{tr(locale, `推荐方案在三个固定方案中获得${fmt(caseJson.decision_output.recommended_scenario_share)}%相对选择。`, `The recommended option takes ${fmt(caseJson.decision_output.recommended_scenario_share)}% relative share among three scenarios.`)}</p></li>
            <li><b>{tr(locale, "转化", "Conversion")}</b><p>{tr(locale, `概念相关性${fmt(caseJson.overall_kpis.concept_relevance_t2b)}%，但试购仅${fmt(caseJson.overall_kpis.concept_trial_t2b)}%，需要实物体验补证。`, `Relevance is ${fmt(caseJson.overall_kpis.concept_relevance_t2b)}%, but trial is ${fmt(caseJson.overall_kpis.concept_trial_t2b)}%; product experience still needs validation.`)}</p></li>
            <li><b>{tr(locale, "门槛", "Gate")}</b><p>{tr(locale, "先完成盲测、货架情景和下一期验证，再讨论上市。", "Complete blind product, shelf and next-wave validation before launch decisions.")}</p></li>
          </ol>
        </article>
      </section>
    </>}

    {view === "model" && <>
      <section className="cracker-model-strip">
        <article><span>{tr(locale, "受访者Raw", "Respondent raw")}</span><strong>{caseJson.meta.respondent_count.toLocaleString()}</strong><small>{tr(locale, "加权问卷记录", "weighted survey records")}</small></article>
        <article><span>{tr(locale, "选择任务", "Choice tasks")}</span><strong>{caseJson.meta.dce_task_count.toLocaleString()}</strong><small>DCE1–DCE6</small></article>
        <article><span>{tr(locale, "试购模型AUC", "Trial-model AUC")}</span><strong>{fmt(caseJson.models.trial_propensity.test_auc, 3)}</strong><small>30% holdout</small></article>
        <article><span>{tr(locale, "离散选择准确率", "DCE accuracy")}</span><strong>{fmt(caseJson.models.discrete_choice.test_accuracy * 100)}%</strong><small>25% task holdout</small></article>
        <article><span>Brier</span><strong>{fmt(caseJson.models.trial_propensity.test_brier, 3)}</strong><small>{tr(locale, "概率误差", "probability error")}</small></article>
      </section>

      <section className="cracker-subgroup-controls">
        <label><span>{tr(locale, "查看分组", "Subgroup")}</span><select value={cutDimension} onChange={(event) => { const next = event.target.value as CutDimension; setCutDimension(next); setCutValue(caseJson.subgroup_kpis.find((row) => row.dimension === next)?.value ?? ""); }}>{(Object.keys(CUT_LABELS) as CutDimension[]).map((key) => <option key={key} value={key}>{tr(locale, CUT_LABELS[key].zh, CUT_LABELS[key].en)}</option>)}</select></label>
        <label><span>{tr(locale, "分组值", "Value")}</span><select value={activeCut?.value} onChange={(event) => setCutValue(event.target.value)}>{cutRows.map((row) => <option key={row.value} value={row.value}>{localValue(locale, row.value)}</option>)}</select></label>
        <article><span>Base</span><strong>N={activeCut?.base_n.toLocaleString()}</strong></article>
        <article><span>{tr(locale, "模型预测试购", "Model-predicted trial")}</span><strong>{fmt(activeCut?.model_predicted_trial ?? 0)}%</strong></article>
        <article><span>¥9.9 {tr(locale, "接受率", "acceptance")}</span><strong>{fmt(activeCut?.price_accept_9_9 ?? 0)}%</strong></article>
      </section>

      <section className="cracker-grid two">
        <article className="cracker-panel">
          <header><div><span>PROPENSITY MODEL</span><h3>{tr(locale, "多变量共同解释新品试购意向", "Multivariable drivers of concept trial")}</h3></div><CaseTag>AUC {fmt(caseJson.models.trial_propensity.test_auc, 3)}</CaseTag></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><BarChart data={propensityDrivers} layout="vertical" margin={{ top: 12, right: 32, bottom: 16, left: 82 }}><CartesianGrid stroke="#e4e8ef" horizontal={false} /><XAxis type="number" unit="pp" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="variable" width={82} tick={{ fontSize: 9 }} /><ReferenceLine x={0} stroke="#8893a5" /><Tooltip /><Bar dataKey="impact_pp_q25_q75" name={tr(locale, "P25→P75边际影响", "P25→P75 marginal impact")}><Cell fill="#263aa5" />{propensityDrivers.slice(1).map((row) => <Cell key={row.variable} fill={row.impact_pp_q25_q75 < 0 ? "#dc6a55" : "#0aa59e"} />)}</Bar></BarChart></ResponsiveContainer></div>
          <footer>{tr(locale, caseJson.models.trial_propensity.validation, "Single-wave 70/30 holdout; live work requires next-wave validation.")}</footer>
        </article>
        <article className="cracker-panel">
          <header><div><span>DISCRETE CHOICE</span><h3>{tr(locale, "价格与产品属性相对效用", "Relative utility of price and product attributes")}</h3></div><CaseTag>{caseJson.models.discrete_choice.test_tasks.toLocaleString()} test</CaseTag></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><BarChart data={dceDrivers} layout="vertical" margin={{ top: 12, right: 28, bottom: 16, left: 90 }}><CartesianGrid stroke="#e4e8ef" horizontal={false} /><XAxis type="number" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="variable" width={90} tick={{ fontSize: 9 }} /><ReferenceLine x={0} stroke="#8893a5" /><Tooltip /><Bar dataKey="coefficient" name={tr(locale, "效用系数", "Utility")} fill="#263aa5">{dceDrivers.map((row) => <Cell key={row.variable} fill={row.coefficient < 0 ? "#dc6a55" : "#0aa59e"} />)}</Bar></BarChart></ResponsiveContainer></div>
          <footer>{tr(locale, caseJson.models.discrete_choice.blocked_use, "Relative choice share is not market share or sales.")}</footer>
        </article>
      </section>

      <section className="cracker-simulator">
        <aside>
          <header><span>SCENARIO SIMULATOR</span><h3>{tr(locale, "同时调整价格与产品配置", "Adjust price and configuration together")}</h3></header>
          <label><span>{tr(locale, "口味", "Flavor")}</span><select value={flavor} onChange={(event) => setFlavor(event.target.value)}>{["经典原味", "海盐香葱", "芝士", "微辣"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>{tr(locale, "规格", "Pack")}</span><select value={pack} onChange={(event) => setPack(Number(event.target.value))}>{[45, 80, 120].map((item) => <option key={item} value={item}>{item}g</option>)}</select></label>
          <label><span>{tr(locale, "封口", "Closure")}</span><select value={resealable} onChange={(event) => setResealable(Number(event.target.value))}><option value={1}>{tr(locale, "可重复封口", "Resealable")}</option><option value={0}>{tr(locale, "普通袋", "Standard bag")}</option></select></label>
          <label><span>{tr(locale, "产品表达", "Claim")}</span><select value={health} onChange={(event) => setHealth(event.target.value)}>{["无特别表达", "轻油烘焙", "全谷物"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>{tr(locale, "品牌层级", "Brand tier")}</span><select value={brand} onChange={(event) => setBrand(event.target.value)}>{["成熟品牌", "成长品牌", "新锐品牌"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>{tr(locale, "80g等价价格", "80g-equivalent price")}<b>¥{fmt(price)}</b></span><input type="range" min="6.9" max="15.9" step="1" value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label>
        </aside>
        <main>
          <header><div><span>{tr(locale, "相对参考方案", "Versus reference")}</span><h3>{tr(locale, "经典原味 · 120g · 普通袋 · 成长品牌 · ¥8.9", "Classic · 120g · standard bag · growth brand · ¥8.9")}</h3></div><CaseTag>{tr(locale, "模拟DCE", "Simulated DCE")}</CaseTag></header>
          <div className="cracker-simulator-output"><article><span>{tr(locale, "二选一模型概率", "Pairwise model probability")}</span><strong>{fmt(scenarioProbability)}%</strong></article><article><span>{tr(locale, "配置效用", "Configuration utility")}</span><strong>{fmt(currentUtility, 3)}</strong></article><article><span>{tr(locale, "相对效用差", "Utility difference")}</span><strong>{currentUtility - referenceUtility >= 0 ? "+" : ""}{fmt(currentUtility - referenceUtility, 3)}</strong></article></div>
          <footer><b>{tr(locale, "用途", "Use")}</b><p>{tr(locale, "用于比较同一实验边界内的配置取舍；切换多项变量会同步重新计算。不能外推为真实销量或市场份额。", "Compares configurations inside the experiment; all selected variables recalculate together. It cannot be extrapolated to sales or market share.")}</p></footer>
        </main>
      </section>

      <section className="cracker-question-map">
        <header><span>{tr(locale, "题号", "Question")}</span><span>{tr(locale, "采集信息", "Measure")}</span><span>{tr(locale, "进入指标与模型", "Metric/model role")}</span></header>
        {caseJson.questionnaire_map.map((row) => <div key={row.question}><strong>{row.question}</strong><p>{row.measure}</p><span>{row.model_role}</span></div>)}
      </section>
      <section className="cracker-downloads"><div><span>DATA PACKAGE</span><h3>{tr(locale, "可复核的模拟研究文件", "Inspectible simulation files")}</h3></div><a href={downloadUrl("cracker-concept-simulated-raw.csv")} download>{tr(locale, "下载受访者Raw Data", "Download respondent raw")}</a><a href={downloadUrl("cracker-concept-simulated-dce.csv")} download>{tr(locale, "下载选择任务", "Download choice tasks")}</a><a href={downloadUrl("cracker-concept-simulation.json")} download>{tr(locale, "下载KPI与模型结果", "Download KPI and model results")}</a></section>
    </>}

    {view === "learning" && <>
      <section className="cracker-learning-hero">
        <div><span>COMMON × PROJECT</span><h2>{tr(locale, "通用指标持续积累，定制项目持续校准", "Shared metrics accumulate; custom projects continuously calibrate")}</h2><p>{tr(locale, "项目使用行业统一口径，同时增加专属概念、产品与实验变量；经授权且可聚合的指标结果回流行业层，客户专属内容仍留在项目空间。", "Projects use shared definitions and add proprietary concept and experiment variables. Authorized aggregate metrics return to the industry layer while client-specific content remains isolated.")}</p></div>
        <aside><article><span>{tr(locale, "通用指标", "Common metrics")}</span><strong>{commonJson.common_metrics.length}</strong></article><article><span>{tr(locale, "模拟Case", "Simulated cases")}</span><strong>{workbenchJson.case_registry.length}</strong></article><article><span>{tr(locale, "通用模拟样本", "Common simulated sample")}</span><strong>{workbenchJson.sample_pool.after_project_n.toLocaleString()}</strong></article></aside>
      </section>

      <section className="cracker-layer-flow">{commonJson.architecture.map((row, index) => <article key={row.layer}><span>0{index + 1}</span><h3>{row.layer}</h3><b>{row.input}</b><p>{row.output}</p><small>{row.client_value}</small></article>)}</section>

      <section className="cracker-grid two">
        <article className="cracker-panel">
          <header><div><span>COMMON METRICS</span><h3>{tr(locale, "跨Case统一指标观测", "Comparable metrics across cases")}</h3></div><CaseTag>{tr(locale, "全部模拟", "All simulated")}</CaseTag></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><BarChart data={commonComparison} margin={{ top: 16, right: 18, bottom: 30, left: 8 }}><CartesianGrid stroke="#e4e8ef" vertical={false} /><XAxis dataKey="metric" interval={0} tick={{ fontSize: 8 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="膨化食品" fill="#263aa5" /><Bar dataKey="薄脆饼干" fill="#0aa59e" /></BarChart></ResponsiveContainer></div>
          <footer>{tr(locale, "同一指标ID、Base、时期和口径才能进入比较；价格等规格敏感指标不会被直接横比。", "Only matching metric IDs, bases, periods and definitions are comparable; pack-sensitive price metrics are not directly compared.")}</footer>
        </article>
        <article className="cracker-panel">
          <header><div><span>SAMPLE CONTRIBUTION</span><h3>{tr(locale, "五个模拟项目构成通用样本基础", "Five simulated projects form the common sample base")}</h3></div></header>
          <div className="cracker-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><BarChart data={sampleContributionChart} layout="vertical" margin={{ top: 18, right: 24, bottom: 18, left: 108 }}><CartesianGrid stroke="#e4e8ef" horizontal={false} /><XAxis type="number" domain={[0, 6500]} tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="project" width={108} tick={{ fontSize: 8 }} /><Tooltip /><Bar dataKey="sample_n" name={tr(locale, "有效样本", "Valid sample")} fill="#263aa5" /></BarChart></ResponsiveContainer></div>
          <footer>{tr(locale, "各项目的统一核心字段进入模拟通用样本池；专属概念、配方和产品变量仍保留在项目空间。", "Aligned core fields enter the simulated common pool while proprietary concepts, formulations and product variables remain in the project space.")}</footer>
        </article>
      </section>

      <section className="cracker-metric-system">
        <header><div><span>SEMANTIC LAYER</span><h3>{tr(locale, "通用指标字典", "Common metric dictionary")}</h3></div><div>{metricFamilies.map((row) => <b key={row.family}>{row.family} {row.count}</b>)}</div></header>
        <div className="cracker-metric-table"><div className="head"><span>ID</span><span>{tr(locale, "指标", "Metric")}</span><span>{tr(locale, "口径与Base", "Definition & base")}</span><span>{tr(locale, "两个Case题号映射", "Question mapping")}</span><span>{tr(locale, "模型角色", "Model role")}</span></div>{commonJson.common_metrics.map((row) => <div key={row.metric_id}><code>{row.metric_id}</code><b>{row.name}</b><p>{row.denominator}</p><span>{Object.entries(row.question_mapping).map(([project, question]) => `${project}: ${question ?? "待补"}`).join(" · ")}</span><em>{row.role}</em></div>)}</div>
      </section>

      <section className="cracker-model-levels">{commonJson.model_stack.map((row, index) => <article key={row.level} className={index === 0 ? "active" : ""}><span>{row.level}</span><h3>{row.model}</h3><p>{row.learns}</p><b>{row.current_state}</b></article>)}</section>

      <section className="cracker-feedback-policy">
        <article><span>{tr(locale, "回流通用层", "Returns to common layer")}</span>{commonJson.project_feedback_policy.returns_to_common_layer.map((item) => <b key={item}>✓ {item}</b>)}</article>
        <article><span>{tr(locale, "保留在项目空间", "Stays in project space")}</span>{commonJson.project_feedback_policy.stays_in_project_space.map((item) => <b key={item}>— {item}</b>)}</article>
        <article><span>{tr(locale, "进入行业模型前", "Before model pooling")}</span>{commonJson.project_feedback_policy.required_before_pooling.map((item) => <b key={item}>◇ {item}</b>)}</article>
      </section>
    </>}
  </div>;
}
