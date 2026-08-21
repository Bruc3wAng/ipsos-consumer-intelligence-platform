"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import PlatformBrand from "./PlatformBrand";
import { forecastPreview } from "../data/lenovoCampaign";
import { choiceProbabilities, predictConsumer, type ConsumerProfile } from "../models/consumerModels";
import aipcStoreModelJson from "../../output/lenovo-pc-intelligence/aipc-store-purchase-uplift-model.json";

type ModelKey = "store" | "forecast" | "choice" | "twin";
type FilterKey = "S1a" | "S10" | "B_loop[{_1}].C1" | "B_loop[{_1}].C2";
type Driver = { source: string; level: string; group: string; name: string; reference: string; odds_ratio: number; or_low: number; or_high: number; stable_direction_95: boolean; direction: string };
type StoreModel = {
  meta: { target_question: string; target_definition: string; outcome_boundary: string };
  sample: { n: number; positive_n: number; positive_rate: number };
  validation: {
    method: string;
    profile_only: { auc: number; brier: number };
    profile_plus_experience: { auc: number; auc_low: number; auc_high: number; brier: number };
    auc_gain: number;
    brier_improvement: number;
    calibration: Array<{ n: number; predicted: number; observed: number }>;
  };
  stable_drivers: Driver[];
  coefficients: Driver[];
  scenarios: Array<{ dimension: string; from: string; to: string; eligible_n: number; baseline_association: number; scenario_association: number; difference_points: number; interpretation: string }>;
  cross_filter: {
    minimum_reporting_base: number;
    options: Record<FilterKey, Array<{ code: string; label: string; n: number }>>;
    cells: Array<{ filters: Record<FilterKey, string>; n: number; positive_n: number; observed_rate: number; model_probability_sum: number }>;
  };
  descriptive_evidence: { good_experience_content: Array<{ code: string; label: string; n: number; percent: number }> };
  governance: { included_questions: string[]; excluded_for_leakage: Array<{ question: string; reason: string }>; next_validation: string };
};

const realModel = aipcStoreModelJson as unknown as StoreModel;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const filterLabels: Record<FilterKey, string> = {
  S1a: "年龄",
  S10: "用户类型",
  "B_loop[{_1}].C1": "门店整体体验",
  "B_loop[{_1}].C2": "销售人员评价",
};
const filterKeys = Object.keys(filterLabels) as FilterKey[];

function Slider({ label, value, min = 0, max = 100, setValue }: { label: string; value: number; min?: number; max?: number; setValue: (value: number) => void }) {
  return <label className="model-slider"><span>{label}<b>{value}</b></span><input aria-label={label} type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>;
}

function ModelTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; percent: number; odds: number; stable: boolean } }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="aipc-chart-tooltip"><strong>{point.label}</strong><span>被提及 {point.percent.toFixed(1)}%</span><span>调整后 OR {point.odds.toFixed(2)}</span><em>{point.stable ? "Bootstrap 95%区间不跨1" : "方向尚未稳定"}</em></div>;
}

function ForestRow({ driver }: { driver: Driver }) {
  const min = Math.log(.05);
  const max = Math.log(8);
  const position = (value: number) => clamp((Math.log(clamp(value, .05, 8)) - min) / (max - min) * 100, 0, 100);
  const low = position(driver.or_low);
  const high = position(driver.or_high);
  const point = position(driver.odds_ratio);
  const reference = position(1);
  return <div className="aipc-forest-row">
    <div><strong>{driver.name}</strong><span>参照：{driver.reference}</span></div>
    <div className="aipc-forest-axis"><i className="reference" style={{ left: `${reference}%` }} /><i className="interval" style={{ left: `${low}%`, width: `${high - low}%` }} /><b style={{ left: `${point}%` }} /></div>
    <em>{driver.odds_ratio.toFixed(2)}<small>{driver.or_low.toFixed(2)}–{driver.or_high.toFixed(2)}</small></em>
  </div>;
}

function StoreExperienceWorkbench() {
  const [filters, setFilters] = useState<Record<FilterKey, string>>({ S1a: "all", S10: "all", "B_loop[{_1}].C1": "all", "B_loop[{_1}].C2": "all" });
  const filtered = useMemo(() => realModel.cross_filter.cells.filter((cell) => filterKeys.every((key) => filters[key] === "all" || cell.filters[key] === filters[key])), [filters]);
  const selected = useMemo(() => {
    const n = filtered.reduce((sum, cell) => sum + cell.n, 0);
    const positive = filtered.reduce((sum, cell) => sum + cell.positive_n, 0);
    const modeled = filtered.reduce((sum, cell) => sum + cell.model_probability_sum, 0);
    return { n, observed: n ? positive / n * 100 : 0, modeled: n ? modeled / n * 100 : 0 };
  }, [filtered]);
  const reportable = selected.n >= realModel.cross_filter.minimum_reporting_base;
  const experienceScatter = useMemo(() => realModel.descriptive_evidence.good_experience_content.map((item) => {
    const coefficient = realModel.coefficients.find((row) => row.source.endsWith("C1a") && row.level === item.code);
    return { label: item.label, percent: item.percent, odds: coefficient?.odds_ratio ?? 1, stable: coefficient?.stable_direction_95 ?? false };
  }), []);
  const stablePoints = experienceScatter.filter((row) => row.stable);
  const otherPoints = experienceScatter.filter((row) => !row.stable);
  const drivers = realModel.stable_drivers.filter((row) => row.group !== "个人月收入").slice(0, 7);
  const salesScenario = realModel.scenarios.find((row) => row.dimension.includes("销售人员"))!;
  const storeScenario = realModel.scenarios.find((row) => row.dimension.includes("整体体验"))!;

  return <div className="aipc-real-model">
    <section className="aipc-model-thesis">
      <div className="aipc-model-verdict"><span>模型结论 · B5</span><strong>{realModel.sample.positive_rate.toFixed(1)}%</strong><h2>联想门店体验者表示购买意愿有所提升</h2><p>Base={realModel.sample.n}，其中 {realModel.sample.positive_n} 人选择“有一点提升”或“有明显提升”。</p></div>
      <article><span>最明确的门店抓手</span><h3>先守住销售讲解与整体体验</h3><p>评价从“比较满意”落到“一般”时，购买意愿提升的优势明显减弱；两项体验评价在多变量控制后仍保持稳定关联。</p><strong>销售评价“一般” OR 0.09</strong></article>
      <article><span>内容策略的增量发现</span><h3>效率负责覆盖，生成质量负责区分</h3><p>“提升效率、节省时间”被提及最多；但控制人群和满意度后，“AI生成内容质量高”仍与购买意愿提升稳定相关。</p><strong>生成内容质量 OR 2.21</strong></article>
      <article><span>优先承接人群</span><h3>潜在用户比现有用户更容易被门店推动</h3><p>潜在用户自报购买意愿提升 87.4%，现有用户为 70.0%。门店对潜在用户应强化转化，对现有用户应增加升级理由。</p><strong>现有 vs 潜在 OR 0.42</strong></article>
    </section>

    <section className="aipc-crossfilter">
      <header><div><span>MULTIVARIATE FILTER</span><h2>选择人群与体验组合，查看真实值和模型估计</h2></div><p>最小展示 Base={realModel.cross_filter.minimum_reporting_base}</p></header>
      <div className="aipc-filter-row">{filterKeys.map((key) => <label key={key}><span>{filterLabels[key]}</span><select value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}><option value="all">全部</option>{realModel.cross_filter.options[key].map((option) => <option key={option.code} value={option.code}>{option.label} · N={option.n}</option>)}</select></label>)}</div>
      <div className="aipc-filter-output">
        <article><span>当前组合 Base</span><strong>{selected.n}</strong><p>{reportable ? "达到展示门槛" : "样本不足，不解释差异"}</p></article>
        <article><span>实际 B5 T2B</span><strong>{reportable ? `${selected.observed.toFixed(1)}%` : "—"}</strong><p>Raw Data 直接统计</p></article>
        <article><span>样本外模型估计</span><strong>{reportable ? `${selected.modeled.toFixed(1)}%` : "—"}</strong><p>重复5折预测聚合</p></article>
        <article className="accent"><span>实际 − 模型</span><strong>{reportable ? `${selected.observed - selected.modeled >= 0 ? "+" : ""}${(selected.observed - selected.modeled).toFixed(1)} pts` : "—"}</strong><p>用于识别异常组合</p></article>
      </div>
    </section>

    <section className="aipc-model-grid">
      <article className="aipc-evidence-matrix">
        <header><div><span>FREQUENCY × ADJUSTED ASSOCIATION</span><h2>消费者说得多，不一定最能区分购买意愿</h2></div><strong>每个点 = C1a一项体验</strong></header>
        <div><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 24, bottom: 18, left: 0 }}><CartesianGrid stroke="#e3e7ed" /><XAxis type="number" dataKey="percent" name="被提及率" unit="%" domain={[10, 62]} label={{ value: "被提及率", position: "insideBottom", offset: -10 }} /><YAxis type="number" dataKey="odds" name="调整后OR" domain={[0, 3]} /><ReferenceLine y={1} stroke="#7e879a" strokeDasharray="4 4" /><Tooltip content={<ModelTooltip />} /><Legend verticalAlign="top" height={28} /><Scatter name="稳定关联" data={stablePoints} fill="#2439a7" /><Scatter name="方向未稳定" data={otherPoints} fill="#74c9c3" /></ScatterChart></ResponsiveContainer></div>
        <p>“提升效率、节省时间”覆盖最广；“AI生成内容质量高”在控制年龄、收入、用户类型、整体体验与销售评价后仍保持稳定正向关联。</p>
      </article>
      <article className="aipc-calibration-panel">
        <header><div><span>OUT-OF-FOLD CALIBRATION</span><h2>预测概率是否接近真实发生率</h2></div><strong>AUC {realModel.validation.profile_plus_experience.auc.toFixed(3)}</strong></header>
        <div><ResponsiveContainer width="100%" height="100%"><LineChart data={realModel.validation.calibration} margin={{ top: 16, right: 18, bottom: 12, left: 0 }}><CartesianGrid stroke="#e3e7ed" vertical={false} /><XAxis dataKey="predicted" unit="%" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Legend /><Line type="monotone" dataKey="predicted" name="模型预测" stroke="#8d98b4" strokeWidth={2} /><Line type="monotone" dataKey="observed" name="实际T2B" stroke="#2439a7" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
        <dl><div><dt>仅人口属性</dt><dd>AUC {realModel.validation.profile_only.auc.toFixed(3)}</dd></div><div><dt>加入体验证据</dt><dd>AUC {realModel.validation.profile_plus_experience.auc.toFixed(3)}</dd></div><div><dt>校准误差</dt><dd>Brier {realModel.validation.profile_plus_experience.brier.toFixed(3)}</dd></div></dl>
        <p className="aipc-model-boundary">AUC反映同一问卷内对B5意愿差异的区分度；需要W3留出样本与真实成交结果继续检验。</p>
      </article>
    </section>

    <section className="aipc-driver-panel">
      <header><div><span>ADJUSTED DRIVERS · BOOTSTRAP 95%</span><h2>控制其他变量后仍保持稳定方向的因素</h2></div><p>OR=1 表示与参照组无差异；区间不跨1才列入此处</p></header>
      <div className="aipc-forest-head"><span>因素与参照组</span><span>0.05　降低关联 ←　1　→ 提高关联　8</span><span>OR / 95%区间</span></div>
      {drivers.map((driver) => <ForestRow key={`${driver.source}-${driver.level}`} driver={driver} />)}
    </section>

    <section className="aipc-scenarios">
      <div><span>CONTROLLED SCENARIOS</span><h2>把模型转成下一轮可验证的业务假设</h2><p>以下为保持其他变量不变后的关联情景，不作为已实现的因果增量。</p></div>
      {[storeScenario, salesScenario].map((scenario) => <article key={scenario.dimension}><span>{scenario.dimension}</span><div><b>{scenario.from}</b><i>→</i><strong>{scenario.to}</strong></div><p>{scenario.baseline_association.toFixed(1)}% → {scenario.scenario_association.toFixed(1)}%</p><em>关联差异 +{scenario.difference_points.toFixed(1)} pts · Base={scenario.eligible_n}</em></article>)}
      <article className="next-test"><span>下一轮验证</span><h3>W3 保留 B5 / C1 / C2</h3><p>用 W2 完整训练、W3 完全留出；同时回传门店成交或 SKU 销售后，再把结果变量从“自报意愿”升级为真实购买。</p></article>
    </section>
  </div>;
}

function ForecastWorkbench() {
  const [drivers, setDrivers] = useState({ aiUtility: 65, channel: 58, priceIndex: 100 });
  const forecast = useMemo(() => {
    const driver = (drivers.aiUtility - 65) * .08 + (drivers.channel - 58) * .06 - (drivers.priceIndex - 100) * .09;
    return forecastPreview.map((item, index) => ({ ...item, mean: Math.round(clamp(item.mean + driver * index, 12, 72)), low: Math.round(clamp(item.low + driver * index - index * .4, 8, 65)), high: Math.round(clamp(item.high + driver * index + index * .5, 16, 82)) }));
  }, [drivers]);
  return <section className="forecast-workbench"><aside className="scenario-controls"><div><span>研究设计输入</span><h2>市场驱动因素</h2></div><Slider label="消费者 AI 实用价值感" value={drivers.aiUtility} setValue={(value) => setDrivers({ ...drivers, aiUtility: value })} /><Slider label="渠道可获得性" value={drivers.channel} setValue={(value) => setDrivers({ ...drivers, channel: value })} /><Slider label="相对价格指数" value={drivers.priceIndex} min={70} max={130} setValue={(value) => setDrivers({ ...drivers, priceIndex: value })} /></aside><div className="forecast-output"><div className="scenario-output-head"><div><span>结构预演</span><h2>未来三年 AI PC 渗透率</h2></div><strong>{forecast[3].mean}%<small>情景中位数</small></strong></div><div className="forecast-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecast} margin={{ left: 0, right: 20, top: 10 }}><defs><linearGradient id="aipcForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c43b5" stopOpacity=".28"/><stop offset="1" stopColor="#2c43b5" stopOpacity=".02"/></linearGradient></defs><CartesianGrid stroke="#e4e8ef" vertical={false}/><XAxis dataKey="year"/><YAxis domain={[0,80]} unit="%"/><Tooltip formatter={(value) => `${value}%`}/><Area type="monotone" dataKey="high" stroke="none" fill="#e0e6fb" name="上界"/><Area type="monotone" dataKey="low" stroke="#a6b0d6" fill="#fff" name="下界"/><Area type="monotone" dataKey="mean" stroke="#2639a5" strokeWidth={3} fill="url(#aipcForecast)" name="中位数"/></AreaChart></ResponsiveContainer></div><p className="scenario-method">待接入季度渗透、销量/装机、价格和渠道的连续数据后训练并做滚动时间验证；当前仅用于确认输入与输出结构。</p></div></section>;
}

function ChoiceWorkbench() {
  const [choice, setChoice] = useState({ priceSensitivity: 62, aiValue: 78, ecosystem: 48, brandTrust: 74 });
  const result = useMemo(() => choiceProbabilities(choice), [choice]);
  return <section className="choice-workbench"><aside className="scenario-controls"><div><span>研究设计输入</span><h2>消费者效用因子</h2></div><Slider label="价格敏感" value={choice.priceSensitivity} setValue={(value) => setChoice({ ...choice, priceSensitivity: value })}/><Slider label="AI 价值" value={choice.aiValue} setValue={(value) => setChoice({ ...choice, aiValue: value })}/><Slider label="生态粘性" value={choice.ecosystem} setValue={(value) => setChoice({ ...choice, ecosystem: value })}/><Slider label="品牌信任" value={choice.brandTrust} setValue={(value) => setChoice({ ...choice, brandTrust: value })}/></aside><div className="choice-output"><div className="scenario-output-head"><div><span>结构预演</span><h2>品牌选择概率</h2></div><p>Hierarchical Bayes MNL</p></div><div className="choice-brand-results">{result.map((item, index) => <article key={item.brand} className={index === 0 ? "primary" : ""}><span>{item.brand}</span><strong>{item.probability}%</strong><i><b style={{ height: `${Math.max(item.probability, 8)}%` }}/></i></article>)}</div><p className="scenario-method">正式版本需在问卷加入 Conjoint 选择任务，估计价格、配置、AI功能与品牌的个体效用，并以真实购买份额校准。</p></div></section>;
}

function TwinWorkbench() {
  const [profile, setProfile] = useState<ConsumerProfile>({ age: 31, monthlyIncome: 14000, workFrequency: 78, contentCreation: 42, aiInterest: 82, privacyConcern: 66, priceSensitivity: 54 });
  const result = useMemo(() => predictConsumer(profile), [profile]);
  return <section className="twin-workbench"><aside className="scenario-controls"><div><span>研究设计输入</span><h2>消费者画像</h2></div><label className="twin-field"><span>年龄</span><input type="number" value={profile.age} min="18" max="70" onChange={(event) => setProfile({ ...profile, age: Number(event.target.value) })}/></label><label className="twin-field"><span>月收入</span><input type="number" value={profile.monthlyIncome} step="1000" onChange={(event) => setProfile({ ...profile, monthlyIncome: Number(event.target.value) })}/></label><Slider label="AI 兴趣" value={profile.aiInterest} setValue={(value) => setProfile({ ...profile, aiInterest: value })}/><Slider label="工作使用频率" value={profile.workFrequency} setValue={(value) => setProfile({ ...profile, workFrequency: value })}/><Slider label="价格敏感" value={profile.priceSensitivity} setValue={(value) => setProfile({ ...profile, priceSensitivity: value })}/></aside><div className="twin-result-card"><div className="twin-persona"><span>预测分群</span><h2>{result.segment}</h2><p>模型置信度 {result.confidence}%</p></div><div className="twin-kpis"><article><span>购买概率</span><strong>{result.purchaseProbability}%</strong></article><article><span>价格接受度</span><strong>¥{result.acceptedPrice.toLocaleString()}</strong></article></div><div className="twin-features"><span>功能优先级</span>{result.topFeatures.map((feature,index) => <div key={feature.name}><b>{index+1}</b><strong>{feature.name}</strong><i><em style={{width:`${feature.score}%`}}/></i></div>)}</div><p className="scenario-method">正式训练需连接问卷画像与 CRM、电商或追访购买结果；当前仅展示未来单客预测需要的输入与输出。</p></div></section>;
}

const modelPlan = [
  { id: "store" as const, role: "已训练 · W2 Raw", title: "门店体验 → 购买意愿提升", target: "回答门店是否推动购买，以及优先改善什么", validation: "N=520 · 重复5折CV · Bootstrap" },
  { id: "forecast" as const, role: "下一步 · 市场层", title: "贝叶斯扩散与动态预测", target: "未来三年 AI PC 渗透率与不确定区间", validation: "需多期市场与销量数据" },
  { id: "choice" as const, role: "下一步 · 选择层", title: "Hierarchical Bayes Choice Model", target: "品牌选择、功能效用与价格弹性", validation: "需新增 Conjoint 选择任务" },
  { id: "twin" as const, role: "下一步 · 消费者层", title: "Consumer Digital Twin", target: "购买概率、功能偏好与价格接受度", validation: "需真实购买结果回流" },
];

export default function LenovoAipcProject() {
  const [model, setModel] = useState<ModelKey>("store");
  return <main className="client-portal focused-portal aipc-project">
    <header className="client-header"><div className="client-brandline"><PlatformBrand compact/><span className="brand-divider"/><img className="client-logo lenovo-logo" src="/lenovo-logo.svg" alt="Lenovo"/><div><strong>AI PC Consumer Intelligence</strong></div></div><div className="client-header-actions"><Link href="/clients/lenovo">返回联想项目</Link></div></header>
    <section className="focused-content">
      <header className="focused-intro"><div><p>AI PC&nbsp;&nbsp;/&nbsp;&nbsp;AIPC进店用户调研（第二期）</p><h1>AI PC 消费者模型</h1><span>从问卷结果进入可验证的门店决策模型：先用真实 Raw Data 回答门店体验如何关联购买意愿，再把下一期设计成样本外验证。</span></div></header>
      <section className="aipc-model-plan">{modelPlan.map((item,index) => <button className={model===item.id?"active":""} key={item.id} onClick={()=>setModel(item.id)}><b>{String(index+1).padStart(2,"0")}</b><span>{item.role}</span><h2>{item.title}</h2><p>{item.target}</p><strong>{item.validation}</strong></button>)}</section>
      <section className="active-model-shell aipc-active-model">{model==="store"&&<StoreExperienceWorkbench/>}{model==="forecast"&&<ForecastWorkbench/>}{model==="choice"&&<ChoiceWorkbench/>}{model==="twin"&&<TwinWorkbench/>}</section>
      {model === "store" && <>
        <section className="aipc-lineage"><div><span>01</span><strong>问卷与口径</strong><p>B5购买意愿影响；DP Spec规定4/5为提升</p></div><i>→</i><div><span>02</span><strong>Raw与Table</strong><p>联想循环有效样本N=520；T2B=79.2%</p></div><i>→</i><div><span>03</span><strong>多变量模型</strong><p>人口属性 + B3a/C1a/C1/C2；题后变量排除</p></div><i>→</i><div><span>04</span><strong>客户决策</strong><p>门店抓手、人群优先级、W3验证方案</p></div></section>
        <section className="aipc-research-advantage"><header><span>MARKET RESEARCH × MODELING</span><h2>Agent负责加速，市场研究负责让答案可信</h2></header><div>{[
          ["业务问题", "将“门店有没有用”拆成购买意愿、购机价格、转化与体验抓手"],
          ["研究设计", "沿用Tracking核心题，并为下一期样本外验证保留稳定口径"],
          ["抽样与执行", "配额、筛选、问卷逻辑、品牌循环与现场质控形成可用样本"],
          ["证据整合", "问卷Raw、Table、开放题、报告与后续社媒/行为信号并列核对"],
          ["模型判断", "由问题和数据条件选择主模型、基线模型与验证方式，而非堆叠算法"],
          ["结果回流", "W3与门店成交结果回传，检验W2结论并更新模型"],
        ].map(([title,body],index)=><article key={title}><b>{String(index+1).padStart(2,"0")}</b><strong>{title}</strong><p>{body}</p></article>)}</div></section>
      </>}
      {model !== "store" && <section className="model-engine-line"><div><strong>研究问题</strong><span>先定义预测对象与决策动作</span></div><div><strong>新增数据设计</strong><span>把缺失标签或选择任务写入下一期问卷</span></div><div><strong>样本外验证</strong><span>用后续时间、市场或真实购买检验</span></div></section>}
    </section>
  </main>;
}
