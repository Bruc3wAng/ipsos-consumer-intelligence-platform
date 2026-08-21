"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PlatformBrand from "./PlatformBrand";
import ByteDanceEcosystemWorkflow, { KpiPredictionMatrix } from "./ByteDanceEcosystemWorkflow";

const trajectory = [
  { period: "W3", TikTok: 81.55, YouTube: 86.86, Instagram: 80.64, Facebook: 67.64, X: 67.14 },
  { period: "W4", TikTok: 82.47, YouTube: 86.16, Instagram: 77.63, Facebook: 64.58, X: 65.16 },
  { period: "W5", TikTok: 70.59, YouTube: 78.10, Instagram: 73.61, Facebook: 61.20, X: 61.10 },
];

const platformForecasts = [
  { platform: "YouTube", value: 84.00, low: 80.00, high: 88.00 },
  { platform: "Instagram Reels", value: 80.14, low: 76.14, high: 84.14 },
  { platform: "Instagram", value: 78.57, low: 74.57, high: 82.57 },
  { platform: "TikTok", value: 74.86, low: 71.86, high: 77.86 },
  { platform: "Facebook", value: 61.43, low: 57.43, high: 65.43 },
  { platform: "X", value: 61.29, low: 57.29, high: 65.29 },
] as const;

const marketForecasts = [
  { code: "US", market: "美国", value: 76, low: 73, high: 79 },
  { code: "UK", market: "英国", value: 78, low: 75, high: 81 },
  { code: "JP", market: "日本", value: 64, low: 61, high: 67 },
  { code: "ID", market: "印度尼西亚", value: 79, low: 76, high: 82 },
  { code: "SA", market: "沙特阿拉伯", value: 72, low: 69, high: 75 },
  { code: "DE", market: "德国", value: 75, low: 72, high: 78 },
  { code: "BR", market: "巴西", value: 80, low: 77, high: 83 },
] as const;

const driverPriorities = [
  { key: "comment", question: "Q5", label: "评论区氛围满意度", coefficient: 0.4425, odds: 1.557, total: 54.77, priority: 100, direction: 1, markets: { BR: 65.75, DE: 41.83, ID: 60.44, JP: 32.10, SA: 58.46, UK: 59.26, US: 57.96 } },
  { key: "time", question: "Q4", label: "值得投入时间", coefficient: 0.4361, odds: 1.547, total: 58.61, priority: 90.2, direction: 1, markets: { BR: 60.25, DE: 50.50, ID: 69.53, JP: 51.11, SA: 54.48, UK: 68.89, US: 57.67 } },
  { key: "quality", question: "Q4", label: "内容制作质量", coefficient: 0.3027, odds: 1.354, total: 61.55, priority: 58.2, direction: 1, markets: { BR: 66.00, DE: 59.41, ID: 64.86, JP: 69.14, SA: 67.16, UK: 61.48, US: 56.08 } },
  { key: "feedback", question: "Q4", label: "基于行为的推荐调整", coefficient: 0.1862, odds: 1.205, total: 68.80, priority: 29.0, direction: 1, markets: { BR: 81.00, DE: 70.54, ID: 83.78, JP: 69.14, SA: 73.88, UK: 66.67, US: 59.41 } },
  { key: "diversity", question: "Q4", label: "内容多样性", coefficient: 0.2397, odds: 1.271, total: 81.37, priority: 22.3, direction: 1, markets: { BR: 91.00, DE: 83.17, ID: 91.89, JP: 86.67, SA: 84.58, UK: 89.38, US: 70.12 } },
  { key: "clickbait", question: "Q6", label: "诱导互动内容暴露", coefficient: -0.0673, odds: 0.935, total: 39.87, priority: 13.4, direction: -1, markets: { BR: 45.75, DE: 42.08, ID: 25.31, JP: 38.52, SA: 43.28, UK: 48.15, US: 38.78 } },
] as const;

const countryAuc = [
  ["US", 0.9210], ["UK", 0.9027], ["SA", 0.8869], ["DE", 0.8805],
  ["JP", 0.8703], ["BR", 0.8688], ["ID", 0.8680],
] as const;

const externalSources = [
  ["美国", "Pew 2025", "YouTube 84% · TikTok 37%"],
  ["英国", "Ofcom 2025", "YouTube 覆盖 94%"],
  ["德国", "Eurostat 2025", "16–29 岁社交网络使用率 84.2%"],
  ["日本", "总务省 2024", "YouTube 80.8% · TikTok 33.2%"],
  ["印度尼西亚", "BPS 2024", "互联网使用人口 72.78%"],
  ["沙特阿拉伯", "CST 2025", "互联网渗透 99.6%"],
] as const;

function probabilityFromLogit(logit: number) {
  return 1 / (1 + Math.exp(-logit));
}

export default function ByteDanceEcosystemProject() {
  const [activeModel, setActiveModel] = useState("kpi");
  const [marketCode, setMarketCode] = useState("TOTAL");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const market = marketForecasts.find((item) => item.code === marketCode);
  const baseline = market?.value ?? 74.86;
  const scenario = useMemo(() => {
    const baselineLogit = Math.log((baseline / 100) / (1 - baseline / 100));
    const driverDelta = driverPriorities.reduce((sum, driver) => {
      const movement = adjustments[driver.key] ?? 0;
      return sum + driver.coefficient * movement * driver.direction;
    }, 0);
    const value = probabilityFromLogit(baselineLogit + driverDelta) * 100;
    return { value, delta: value - baseline };
  }, [adjustments, baseline]);

  return (
    <main className="client-portal ecosystem-project">
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <img className="client-logo bytedance-logo" src="/bytedance-logo.svg" alt="ByteDance" />
          <div><strong>消费者洞察与模型平台</strong></div>
        </div>
        <div className="client-header-actions"><Link href="/clients/bytedance">返回字节跳动项目</Link></div>
      </header>

      <section className="eco-content">
        <header className="eco-intro">
          <div>
            <p>字节跳动&nbsp;&nbsp;/&nbsp;&nbsp;TT及外部竞品生态满意度调研</p>
            <h1>第六期预测、竞品差距与改善优先级</h1>
            <span>W3–W5 Raw Data · 第六期 7 国每国计划 N=2,000 · Q3 总体内容满意度 Top-2-Box</span>
          </div>
          <div className="eco-wave-count"><strong>14,000</strong><span>第六期 7 国计划总样本量</span></div>
        </header>

        <section className="eco-answer-hero">
          <div>
            <p>W6 TIKTOK FORECAST</p>
            <h2>第六期 TikTok 总体内容满意度预测 <strong>74.9%</strong>，校准区间 <strong>71.9%–77.9%</strong></h2>
          </div>
          <p>平台预测位列 6 个对比平台第 4；与 YouTube 的预测差距为 9.1 个百分点。日本预测最低为 64%，是第六期最需要重点检验的市场。</p>
        </section>

        <section className="eco-model-selector">
          <div><span>MODEL WORKBENCH</span><h2>选择本项目要回答的问题</h2></div>
          <label>
            <span>模型输出</span>
            <select value={activeModel} onChange={(event) => setActiveModel(event.target.value)}>
              <option value="kpi">第六期 KPI 预测矩阵：题目 × 七国</option>
              <option value="forecast">第六期 Q3 预测：总体、竞品与七国</option>
              <option value="workflow">第六期项目全流程：需求到客户交付</option>
              <option value="drivers">驱动与情景模拟：先改善什么</option>
              <option value="validation">个体概率与跨期验证：模型是否可信</option>
            </select>
          </label>
          <p>{activeModel === "kpi" ? "按平台、题号和市场展示 W3–W5 实际值、W6 模型预测、预测区间与相邻期次差值。" : activeModel === "forecast" ? "输出第六期 Q3 总体内容满意度预测、竞品排名、市场风险与校准区间。" : activeModel === "workflow" ? "从第六期需求、问卷版本和历史数据开始，贯通各题KPI预测、实地Nowcast、结果验证和客户交付。" : activeModel === "drivers" ? "把 W5 实际题目表现与跨期留出模型系数交叉，形成优先级并测试改善情景。" : "展示个体 Q3 Top-2-Box 概率模型在后一期的 AUC、Brier、校准与分市场迁移表现。"}</p>
        </section>

        {activeModel === "kpi" && <KpiPredictionMatrix />}

        {activeModel === "workflow" && <ByteDanceEcosystemWorkflow />}

        {activeModel === "forecast" && <>
        <section className="eco-metrics eco-decision-metrics">
          <article className="primary"><span>W6 TIKTOK</span><strong>74.9%</strong><p>7 国等样本计划下的总体预测</p></article>
          <article><span>COMPETITIVE RANK</span><strong>4 / 6</strong><p>YouTube 84.0% · Reels 80.1% · Instagram 78.6%</p></article>
          <article><span>MARKET RISK</span><strong>JP 64%</strong><p>校准区间 61%–67%</p></article>
          <article><span>W5 HOLDOUT</span><strong>0.894</strong><p>W3+W4 训练、W5 留出集 AUC</p></article>
        </section>

        <section className="eco-model-lineage" aria-label="模型数据链路">
          {[
            ["01", "问卷", "Q3 结果；Q4/Q5/Q6/Q7 驱动"],
            ["02", "Raw Data", "三期 N=33,194；保留题目与受访者记录"],
            ["03", "建模表", "44,234 条受访者×配额平台记录"],
            ["04", "模型验证", "W3→W4；W3+W4→W5"],
            ["05", "第六期输出", "7 国预测、竞品差距与校准区间"],
          ].map(([index, title, detail]) => (
            <article key={index}><b>{index}</b><div><strong>{title}</strong><p>{detail}</p></div></article>
          ))}
        </section>

        <section className="eco-analysis-grid eco-forecast-grid">
          <article className="eco-panel eco-platform-forecast">
            <header><div><span>COMPETITOR FORECAST</span><h2>第六期平台满意度预测</h2></div><p>点预测及项目校准区间</p></header>
            <div className="eco-platform-rows">
              {platformForecasts.map((item, index) => (
                <div className={item.platform === "TikTok" ? "primary" : ""} key={item.platform}>
                  <b>{String(index + 1).padStart(2, "0")}</b><strong>{item.platform}</strong>
                  <i><em style={{ width: `${item.value}%` }} /></i>
                  <span>{item.value.toFixed(1)}%</span><small>{item.low.toFixed(1)}–{item.high.toFixed(1)}</small>
                </div>
              ))}
            </div>
            <p className="eco-chart-note">校准区间来自第六期项目目标工作簿，用于项目规划，不等同于统计置信区间。</p>
          </article>

          <article className="eco-panel eco-market-forecast">
            <header><div><span>MARKET FORECAST</span><h2>TikTok 七国预测</h2></div><p>每国计划 N=2,000</p></header>
            <div className="eco-market-forecast-list">
              {marketForecasts.map((item) => (
                <button type="button" className={marketCode === item.code ? "active" : ""} key={item.code} onClick={() => setMarketCode(item.code)}>
                  <b>{item.code}</b><span>{item.market}</span><strong>{item.value}%</strong><small>{item.low}–{item.high}</small>
                </button>
              ))}
            </div>
            <p className="eco-chart-note">点击市场可同步更新下方驱动表现与情景模拟。</p>
          </article>
        </section>
        </>}

        {activeModel === "drivers" &&
        <section className="eco-priority-workbench">
          <article className="eco-panel eco-priority-panel">
            <header><div><span>IMPORTANCE × PERFORMANCE</span><h2>{market ? market.market : "TikTok 总体"}改善优先级</h2></div><p>W5 实际题目表现 × 留出模型系数</p></header>
            <div className="eco-priority-table">
              <div className="eco-priority-head"><span>题目与驱动</span><span>W5 表现</span><span>OR / SD</span><span>优先级</span></div>
              {driverPriorities.map((driver) => {
                const rate = market ? driver.markets[market.code as keyof typeof driver.markets] : driver.total;
                return (
                  <div className="eco-priority-row" key={driver.key}>
                    <p><b>{driver.question}</b><strong>{driver.label}</strong><small>{driver.direction === 1 ? "Top-2-Box" : "经常 / 非常经常暴露"}</small></p>
                    <span>{rate.toFixed(1)}%</span><span>{driver.odds.toFixed(3)}</span>
                    <i><em style={{ width: `${driver.priority}%` }} /></i><b>{driver.priority.toFixed(0)}</b>
                  </div>
                );
              })}
            </div>
            <p className="eco-chart-note">总体优先级 = 标准化系数绝对值 × 当前改善空间。评论区氛围与“值得投入时间”同时具备较高预测重要性和较大表现空间；该排序用于诊断，不代表实验因果效应。</p>
          </article>

          <article className="eco-panel eco-scenario-panel">
            <header><div><span>MODEL SCENARIO</span><h2>满意度敏感性模拟</h2></div><p>其余条件保持不变</p></header>
            <div className="eco-scenario-market">
              <label>预测基准</label>
              <select value={marketCode} onChange={(event) => setMarketCode(event.target.value)}>
                <option value="TOTAL">TikTok 总体 · 74.9%</option>
                {marketForecasts.map((item) => <option key={item.code} value={item.code}>{item.market} · {item.value}%</option>)}
              </select>
            </div>
            <div className="eco-scenario-controls">
              {driverPriorities.slice(0, 5).map((driver) => (
                <label key={driver.key}>
                  <span>{driver.label}<b>+{(adjustments[driver.key] ?? 0).toFixed(1)} SD</b></span>
                  <input type="range" min="0" max="0.5" step="0.1" value={adjustments[driver.key] ?? 0} onChange={(event) => setAdjustments((current) => ({ ...current, [driver.key]: Number(event.target.value) }))} />
                </label>
              ))}
            </div>
            <div className="eco-scenario-result">
              <span>模型情景结果</span><strong>{scenario.value.toFixed(1)}%</strong><b>{scenario.delta >= 0 ? "+" : ""}{scenario.delta.toFixed(1)}pp</b>
              <p>基准 {baseline.toFixed(1)}% · 基于 W3+W4 系数的预测敏感性，不是承诺值或因果提升。</p>
            </div>
            <button type="button" onClick={() => setAdjustments({})}>重置情景</button>
          </article>
        </section>
        }

        {activeModel === "validation" && <>
        <section className="eco-analysis-grid">
          <article className="eco-panel eco-trend-panel">
            <header><div><span>HISTORICAL EVIDENCE</span><h2>W3–W5 总体内容满意度</h2></div><p>模型可用共同平台记录 · 描述值</p></header>
            <div className="eco-line-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectory} margin={{ top: 18, right: 18, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#e3e7ee" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "#667085", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 90]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#778195", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ fontFamily: 'Arial, "Microsoft YaHei", sans-serif', fontSize: 11, borderColor: "#d9dee7" }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
                  <Line type="monotone" dataKey="TikTok" stroke="#16aaa4" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="YouTube" stroke="#2436a8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Instagram" stroke="#6d7fb5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Facebook" stroke="#98a3bd" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="X" stroke="#3d4968" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="eco-chart-note">W5 跨平台回落是历史证据，不是模型本身。W5 留出集模型整体高估 3.16pp，因此第六期单独保留校准区间并继续检验实际误差。</p>
          </article>

          <article className="eco-panel eco-validation-panel">
            <header><div><span>MODEL VALIDATION</span><h2>模型能否迁移到后一期</h2></div><p>严格时间留出</p></header>
            <div className="eco-validation-grid">
              <article><span>W3 → W4</span><strong>0.811</strong><p>AUC</p></article>
              <article className="primary"><span>W3+W4 → W5</span><strong>0.894</strong><p>AUC</p></article>
              <article><span>W5 BRIER</span><strong>0.121</strong><p>基线 0.196</p></article>
              <article><span>稳定题目</span><strong>12</strong><p>跨期含义一致</p></article>
            </div>
            <div className="eco-country-auc-mini">
              {countryAuc.map(([country, auc]) => <div key={country}><span>{country}</span><i><b style={{ width: `${auc * 100}%` }} /></i><strong>{auc.toFixed(3)}</strong></div>)}
            </div>
            <p className="eco-chart-note">个体概率模型回答“谁更可能满意”；第六期 KPI 模型回答“总体与各市场可能落在哪里”。两个模型对象不同，但共享同一问卷、Raw Data 与结果回流。</p>
          </article>
        </section>

        <section className="eco-evidence-grid">
          <article className="eco-questionnaire-card">
            <header><span>QUESTIONNAIRE FITNESS</span><h2>哪些题可进入跨期模型</h2></header>
            <div className="eco-fit-summary"><strong>12</strong><p>项驱动在 W3–W5 含义稳定，可进入跨期模型。</p></div>
            <div className="eco-fit-list">
              <p><b>进入模型</b> Q3 总体满意度；Q4 内容质量、多样性、时间价值、推荐调整；Q5 评论区；Q6/Q7 负向内容暴露。</p>
              <p><b>不进入跨期训练</b> Q4 item 3、Q5 item 1、Q6 item 2 在 W5 发生语义变化；W5 新增题缺少历史训练数据。</p>
            </div>
          </article>

          <article className="eco-model-route">
            <header><span>THREE MODEL OBJECTS</span><h2>本项目的三类模型输出</h2></header>
            <div><b>预测对象 1</b><strong>个体满意概率</strong><p>正则化逻辑回归；输出受访者 Q3 Top-2-Box 概率、AUC、Brier 与分市场表现。</p></div>
            <div><b>预测对象 2</b><strong>第六期 KPI</strong><p>W5 正式 Table 锚点 + 市场证据调整 + 项目校准区间；输出平台和七国预测。</p></div>
            <div><b>下一步</b><strong>实际值回流</strong><p>第六期 Table 回来后计算预测误差；积累更多期次后再升级动态多层模型。</p></div>
          </article>
        </section>
        </>}

        {activeModel === "forecast" &&
        <section className="eco-external">
          <header><div><span>EXTERNAL VALIDATION</span><h2>外部权威市场基准</h2></div><p>用于校验平台覆盖与市场环境，不替代内部满意度</p></header>
          <div className="eco-external-grid">
            {externalSources.map(([marketName, source, metric]) => <article key={marketName}><span>{marketName}</span><strong>{metric}</strong><p>{source}</p></article>)}
          </div>
        </section>
        }

        {activeModel === "validation" &&
        <section className="eco-next-wave">
          <div><span>W6 RESULT FEEDBACK</span><h2>第六期实际结果回来后，模型需要回答的不是“对不对”，而是“误差在哪里”</h2></div>
          <ol><li>总体预测误差</li><li>各市场校准误差</li><li>驱动系数是否稳定</li><li>语义变更题是否继续排除</li></ol>
        </section>
        }
      </section>
    </main>
  );
}
