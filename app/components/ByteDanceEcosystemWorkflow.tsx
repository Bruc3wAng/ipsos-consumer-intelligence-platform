"use client";

import { useMemo, useState } from "react";
import forecastJson from "../../output/tt-ecosystem-satisfaction-w5/w6-question-kpi-forecast.json";
import matrixJson from "../../output/tt-ecosystem-satisfaction-w5/w6-kpi-display-matrix.json";

type Metric = {
  metric_id: string;
  question: string;
  label: string;
  direction: "positive" | "negative";
  display_metric: string;
  history: { W3: number; W4: number; W5: number };
  n_w5: number;
  w6_prediction: number;
  prediction_low: number;
  prediction_high: number;
  projected_change_pp: number;
  market_forecasts: Array<{ market: string; n_w5: number; history: { W3: number | null; W4: number | null; W5: number | null }; w5_actual: number; w6_prediction: number; prediction_low: number; prediction_high: number }>;
};

const forecast = forecastJson as { metrics: Metric[]; historical_level_forecast_backtest: { mae_pp: number }; respondent_probability_validation: { auc: number; brier: number } };

type MatrixMarket = {
  market: string;
  n_w5: number;
  history: { W3: number | null; W4: number | null; W5: number | null };
  prediction: number | null;
  low: number | null;
  high: number | null;
};

type MatrixMetric = {
  code: string;
  label: string;
  method: string;
  platforms: Array<{ platform: string; markets: MatrixMarket[] }>;
};

const matrix = matrixJson as {
  meta: { markets: string[]; platforms: string[]; display_base_per_market_platform: number; source: string };
  metrics: MatrixMetric[];
};

type StageId = "request" | "questionnaire" | "data" | "model" | "fieldwork" | "validation" | "delivery";

const stages: Array<{ id: StageId; number: string; label: string; output: string }> = [
  { id: "request", number: "01", label: "客户新一期需求", output: "研究范围与交付目标" },
  { id: "questionnaire", number: "02", label: "问卷与指标版本", output: "可比题、变更题与新增题" },
  { id: "data", number: "03", label: "历史数据准备", output: "跨期建模表与KPI对账" },
  { id: "model", number: "04", label: "模型构建与预测", output: "10项核心题与七国区间" },
  { id: "fieldwork", number: "05", label: "实地进度与Nowcast", output: "配额、质量与滚动预测" },
  { id: "validation", number: "06", label: "结果验证与更新", output: "误差、校准与模型重训" },
  { id: "delivery", number: "07", label: "洞察与客户交付", output: "Dashboard与网页版报告" },
];

const markets = ["US", "UK", "JP", "ID", "SA", "DE", "BR"] as const;

const marketNames: Record<(typeof markets)[number], string> = {
  US: "美国", UK: "英国", JP: "日本", ID: "印度尼西亚", SA: "沙特阿拉伯", DE: "德国", BR: "巴西",
};

function displayValue(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function displayThreeDecimals(value: number) {
  return (Math.round(value * 1000) / 1000).toFixed(3);
}

function trendLabel(change: number | null) {
  if (change === null) return "待积累";
  if (change >= 2) return "预测回升";
  if (change <= -2) return "预测下降";
  return "预测平稳";
}

export function KpiPredictionMatrix() {
  const [platform, setPlatform] = useState("TikTok");
  const [family, setFamily] = useState("ALL");
  const metrics = useMemo(() => matrix.metrics.filter((metric) => family === "ALL" || metric.code.startsWith(family)), [family]);
  return (
    <article className="workflow-model-table kpi-forecast-matrix">
      <header>
        <div><span>PLATFORM × QUESTION × MARKET</span><h3>第六期 KPI 预测矩阵</h3><p>完整显示 Q4_2–Q5_2 十项核心 KPI；W3–W5 采用各国 NOSIG Table 核心样本，W6 为模型预测。</p></div>
        <div><label>平台<select value={platform} onChange={(event) => setPlatform(event.target.value)}>{matrix.meta.platforms.map((item) => <option key={item}>{item}</option>)}</select></label><label>题组<select value={family} onChange={(event) => setFamily(event.target.value)}><option value="ALL">Q4–Q5 全部</option><option value="Q4">Q4 内容体验</option><option value="Q5">Q5 促销与评论</option></select></label></div>
      </header>
      <div className="kpi-matrix-scroll">
        <table>
          <thead>
            <tr><th rowSpan={2}>平台 / Base</th><th rowSpan={2}>W5题号</th><th rowSpan={2}>W6题号</th><th rowSpan={2}>模型状态</th><th rowSpan={2}>题目 / KPI</th>{markets.map((market) => <th colSpan={6} key={market}>{marketNames[market]} <small>{market}</small></th>)}</tr>
            <tr>{markets.flatMap((market) => ["W3", "W4", "W5", "W6预测", "W6−W5", "W6−W4"].map((label) => <th key={`${market}-${label}`} className={label === "W6预测" ? "prediction" : label.includes("−") ? "delta" : ""}>{label}</th>))}</tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const platformData = metric.platforms.find((item) => item.platform === platform);
              const us = platformData?.markets.find((item) => item.market === "US");
              const rowTrend = us?.prediction != null && us.history.W5 != null ? us.prediction - us.history.W5 : null;
              const label = trendLabel(rowTrend);
              return <tr key={metric.code}>
              <td><b>{platform}</b><small>N={matrix.meta.display_base_per_market_platform}</small></td><td>{metric.code}</td><td>{metric.code}</td><td><span className={`matrix-trend ${label === "预测平稳" ? "stable" : label === "预测回升" ? "up" : label === "预测下降" ? "down" : ""}`}>{metric.method}</span></td><td><strong>{metric.label}</strong><small>Top-2-Box</small></td>
              {markets.flatMap((market) => {
                const values = platformData?.markets.find((item) => item.market === market);
                const prediction = values?.prediction ?? null;
                const history = values?.history ?? { W3: null, W4: null, W5: null };
                const vsW5 = prediction === null || history.W5 === null ? null : prediction - history.W5;
                const vsW4 = prediction === null || history.W4 === null ? null : prediction - history.W4;
                return [
                  <td key={`${market}-w3`}>{displayValue(history.W3)}</td>,
                  <td key={`${market}-w4`}>{displayValue(history.W4)}</td>,
                  <td key={`${market}-w5`}>{displayValue(history.W5)}</td>,
                  <td key={`${market}-w6`} className="prediction"><b>{prediction === null ? "—" : prediction.toFixed(1)}</b><small>{values?.low == null || values?.high == null ? "" : `${values.low.toFixed(1)}–${values.high.toFixed(1)}`}</small></td>,
                  <td key={`${market}-d5`} className={`delta ${vsW5 !== null && vsW5 > 0 ? "positive" : vsW5 !== null && vsW5 < 0 ? "negative" : ""}`}>{vsW5 === null ? "—" : `${vsW5 > 0 ? "+" : ""}${vsW5.toFixed(1)}`}</td>,
                  <td key={`${market}-d4`} className={`delta ${vsW4 !== null && vsW4 > 0 ? "positive" : vsW4 !== null && vsW4 < 0 ? "negative" : ""}`}>{vsW4 === null ? "—" : `${vsW4 > 0 ? "+" : ""}${vsW4.toFixed(1)}`}</td>,
                ];
              })}
            </tr>;})}
          </tbody>
        </table>
      </div>
      <footer><span>展示口径：每个平台 × 每个国家核心样本 N=400</span><span>跨期模型 / 题意重置 / 冷启动模型均保留显示</span><span>预测区间显示在 W6 数值下方</span></footer>
    </article>
  );
}

function RequestStage() {
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>第六期需求输入</span><h2>沿用七国 Tracking 主体，锁定可比 KPI，并在正式访问前冻结模型。</h2><p>项目范围：美国、英国、日本、印度尼西亚、沙特阿拉伯、德国、巴西；每国计划 N=2,000，总样本 N=14,000。</p></section><section className="workflow-requirements"><article><b>研究问题</b><strong>总体满意度是否恢复，哪些体验驱动变化，哪些市场需要优先改善</strong></article><article><b>核心输出</b><strong>Q3–Q7 KPI、平台与七国差异、驱动优先级、下一期预测误差</strong></article><article><b>数据输入</b><strong>W3–W5问卷、Raw Data、DP Spec、Table与第六期配额</strong></article><article><b>冻结点</b><strong>问卷定稿、建模字段、预测值与验收指标在实地前锁定</strong></article></section></div>;
}

function QuestionnaireStage() {
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>问卷版本判断</span><h2>十个客户核心题全部进入展示矩阵，再按题意、量表、Base 和方向选择训练方式。</h2><p>Q4_2–Q5_2 不因模型训练条件不同而被隐藏：5项进入跨期模型，2项题意重置，3项使用冷启动模型。</p></section><section className="workflow-question-groups"><article className="stable"><span>跨期稳定 · 5项</span><h3>进入主模型</h3><p>Q4_2、Q4_4、Q4_5、Q4_6、Q5_2连接W3–W5历史值。</p></article><article className="changed"><span>题意重置 · 2项</span><h3>重新起算</h3><p>Q4_3、Q5_1保留本期数值并收窄趋势权重，不机械连接旧题含义。</p></article><article className="new"><span>W5新增 · 3项</span><h3>冷启动</h3><p>Q5.b_1、Q5.b_2、Q5.b_3以W5为先验中心，输出更宽的预测区间。</p></article></section></div>;
}

function DataStage() {
  const lineage = [
    ["W3–W5 问卷", "题干、选项、量表、Base与版本变更"], ["Raw Data", "33,194名受访者；保留ID、国家、平台、期次和题目"], ["KPI对账", "Raw重算与Table逐项核对"], ["跨期建模表", "44,234条受访者×配额平台记录"], ["结果标签", "Q3 1–5分及Top-2-Box"],
  ];
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>数据底座</span><h2>同一题目只保留一个标准定义，Raw、Table 和模型共享同一口径。</h2><p>建模粒度是受访者 × 具备配额资格的平台 × 期次；客户汇报 KPI 从同一建模表聚合，不另外手工填写。</p></section><section className="workflow-data-track">{lineage.map(([title, detail], index) => <div key={title}><article><b>{String(index + 1).padStart(2, "0")}</b><strong>{title}</strong><p>{detail}</p></article>{index < lineage.length - 1 && <i>→</i>}</div>)}</section></div>;
}

function ModelStage() {
  return <div className="workflow-stage-content"><section className="workflow-stage-answer model"><span>模型体系</span><h2>个体概率、总体 KPI 和改善优先级由三个模型分别负责，再在同一 Dashboard 汇合。</h2><p>把模型对象拆开后，AUC 不再被误用为总体预测准确率；每一类输出都有自己的时间留出验证。</p></section><section className="workflow-model-layers"><article><b>01</b><span>个体概率模型</span><h3>谁更可能满意</h3><p>正则化逻辑回归；W3+W4训练、W5留出。</p><strong>AUC {displayThreeDecimals(forecast.respondent_probability_validation.auc)} · Brier {displayThreeDecimals(forecast.respondent_probability_validation.brier)}</strong></article><article className="primary"><b>02</b><span>分层动态KPI模型</span><h3>下一期落在哪里</h3><p>题目×国家×平台×期次；小样本向上层收缩，加入期次动态截距。</p><strong>10项核心题 × 6平台 × 7市场</strong></article><article><b>03</b><span>驱动与情景模型</span><h3>先改善什么</h3><p>跨期系数 × 本期表现空间；输出优先级和敏感性情景。</p><strong>评论区氛围 · 时间价值 · 内容质量</strong></article></section><KpiPredictionMatrix /><section className="workflow-model-caveat"><b>模型升级重点</b><p>历史趋势单独预测 W5 的 KPI 水平 MAE 为 {forecast.historical_level_forecast_backtest.mae_pp.toFixed(1)}pts，说明 W5 存在强烈共同期次冲击。第六期真实结果回来后将按题目、平台和国家逐层检验并更新模型，避免只做直线外推。</p></section></div>;
}

function FieldworkStage() {
  const progress = [{ market: "US", complete: 840, pass: 91, nowcast: 73.8 }, { market: "UK", complete: 816, pass: 94, nowcast: 77.1 }, { market: "JP", complete: 768, pass: 93, nowcast: 65.2 }, { market: "ID", complete: 902, pass: 90, nowcast: 78.4 }, { market: "SA", complete: 735, pass: 92, nowcast: 72.7 }, { market: "DE", complete: 791, pass: 95, nowcast: 74.6 }, { market: "BR", complete: 875, pass: 91, nowcast: 79.3 }];
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>模拟实地进度</span><h2>访问期间不等待最终 Table：每天更新样本结构、质量和 KPI Nowcast。</h2><p>Nowcast 将已完成样本与实地前预测合并；样本较少时更多依赖历史先验，完成度提高后逐步让本期数据主导。</p></section><section className="workflow-field-table"><div className="head"><span>市场</span><span>完成 / 目标</span><span>完成率</span><span>质检通过</span><span>Q3 Nowcast</span><span>预警</span></div>{progress.map((row) => <div key={row.market}><strong>{row.market}</strong><span>{row.complete.toLocaleString()} / 2,000</span><i><b style={{ width: `${row.complete / 20}%` }} /></i><span>{row.pass}%</span><b>{row.nowcast}%</b><em className={row.market === "JP" ? "risk" : "normal"}>{row.market === "JP" ? "重点跟踪" : "正常"}</em></div>)}</section></div>;
}

function ValidationStage() {
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>第六期结果回流</span><h2>先验预测在看结果前冻结；结果回来后逐层定位误差，再决定是否升级模型。</h2><p>验收分为总体KPI、国家/平台、子群、个体概率和题目驱动五层，不用单一准确率覆盖全部输出。</p></section><section className="workflow-validation-grid"><article><b>01</b><h3>Raw ↔ Table</h3><p>按题号、Base、权重、国家和平台逐项对账。</p><strong>目标：核心KPI零差异</strong></article><article><b>02</b><h3>KPI预测</h3><p>计算总体与91个题目×市场单元的 MAE、方向准确率和区间覆盖。</p><strong>目标：优于季节性基线</strong></article><article><b>03</b><h3>个体概率</h3><p>AUC、Brier、校准曲线与分市场稳定性。</p><strong>冻结W6作为未见数据</strong></article><article><b>04</b><h3>驱动稳定性</h3><p>比较系数方向、排名和市场异质性。</p><strong>不把预测关系表述为因果</strong></article></section></div>;
}

function DeliveryStage() {
  return <div className="workflow-stage-content"><section className="workflow-stage-answer"><span>客户交付</span><h2>同一套结果输出 Dashboard、网页汇报和可下载数据表，洞察与数值保持同源。</h2><p>网页版汇报已单独建立，但不从项目主页显示；需要汇报时通过独立地址进入，避免日常模型工作台被报告页干扰。</p></section><section className="workflow-delivery-grid"><article><span>01</span><h3>项目 Dashboard</h3><p>筛选市场、平台、题组、子群和期次，查看模型与实际结果。</p></article><article><span>02</span><h3>客户网页版汇报</h3><p>结论优先：总体判断、市场差异、驱动、行动与下一期验证。</p></article><article><span>03</span><h3>KPI 数据表</h3><p>题号、口径、W3–W6值、预测区间、实际误差和版本状态。</p></article><article><span>04</span><h3>模型验证记录</h3><p>训练期、留出期、参数版本、指标、限制与结果回流。</p></article></section></div>;
}

export default function ByteDanceEcosystemWorkflow() {
  const [stage, setStage] = useState<StageId>("model");
  return <section className="ecosystem-workflow"><div className="workflow-summary"><article><span>历史期次</span><strong>W3–W5</strong><p>真实 Raw Data</p></article><article><span>历史受访者</span><strong>33,194</strong><p>三期原始样本</p></article><article><span>核心题号</span><strong>10</strong><p>全部进入展示矩阵</p></article><article><span>预测单元</span><strong>420</strong><p>10项 × 6平台 × 7市场</p></article><article><span>第六期计划</span><strong>14,000</strong><p>七国每国N=2,000</p></article></div><nav className="workflow-stage-nav" aria-label="第六期项目流程">{stages.map((item) => <button type="button" className={stage === item.id ? "active" : ""} key={item.id} onClick={() => setStage(item.id)}><b>{item.number}</b><span>{item.label}</span><small>{item.output}</small></button>)}</nav>{stage === "request" && <RequestStage />}{stage === "questionnaire" && <QuestionnaireStage />}{stage === "data" && <DataStage />}{stage === "model" && <ModelStage />}{stage === "fieldwork" && <FieldworkStage />}{stage === "validation" && <ValidationStage />}{stage === "delivery" && <DeliveryStage />}</section>;
}
