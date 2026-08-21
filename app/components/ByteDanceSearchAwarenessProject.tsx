"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { publicAssetPath } from "../lib/publicRuntime";

const marketFunnel = [
  ["美国", 87.1, 54.3, 9.5, 62.3],
  ["英国", 79.8, 43.4, 9.8, 54.4],
  ["德国", 66.5, 35.3, 7.7, 53.1],
  ["日本", 64.6, 36.4, 6.5, 56.3],
  ["印度尼西亚", 86.4, 69.6, 16.5, 80.6],
  ["韩国", 65.8, 25.8, 5.4, 39.2],
  ["巴西", 77.3, 48.6, 11.0, 62.9],
] as const;

const predictiveSignals = [
  { key: "longUse", variable: "S1_4", label: "持续使用 TikTok 至少 3 个月", coefficient: 1.4166 },
  { key: "aware", variable: "Q14_4", label: "认知 TikTok 的搜索功能", coefficient: 1.3331 },
  { key: "installed", variable: "Q13_4", label: "手机安装 TikTok 超过 1 周", coefficient: 1.0022 },
] as const;

const kpiCards = [
  { question: "Q14", label: "TikTok 搜索功能认知", value: 75.36, raw: 75.3571, table: 75.36, difference: "+0.0029pp" },
  { question: "Q15", label: "过去 30 天使用 TikTok 搜索", value: 44.77, raw: 44.7714, table: 44.77, difference: "−0.0014pp" },
  { question: "Q16", label: "TikTok 为最常使用搜索平台", value: 9.49, raw: 9.4857, table: 9.49, difference: "+0.0043pp" },
] as const;

export default function ByteDanceSearchAwarenessProject() {
  const [activeModel, setActiveModel] = useState("funnel");
  const [profile, setProfile] = useState<Record<string, boolean>>({ longUse: true, aware: true, installed: true });

  const probability = useMemo(() => {
    const logit = predictiveSignals.reduce(
      (current, signal) => current + (profile[signal.key] ? signal.coefficient : 0),
      -3.1745,
    );
    return 100 / (1 + Math.exp(-logit));
  }, [profile]);

  return (
    <main className="client-portal ecosystem-project search-awareness-project">
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <img className="client-logo bytedance-logo" src={publicAssetPath("/bytedance-logo.svg")} alt="ByteDance" />
          <div><strong>消费者洞察与模型平台</strong></div>
        </div>
        <div className="client-header-actions"><Link href="/clients/bytedance">返回字节跳动项目</Link></div>
      </header>

      <section className="eco-content">
        <header className="eco-intro">
          <div>
            <p>字节跳动&nbsp;&nbsp;/&nbsp;&nbsp;TikTok Search Awareness Tracking</p>
            <h1>Q14–Q16 搜索漏斗与 Q15_4 使用概率模型</h1>
            <span>W4 · 7 个市场 · N=7,000 · 1,373 个 Raw Data 变量</span>
          </div>
          <div className="eco-wave-count"><strong>24 / 24</strong><span>Q14 / Q15 / Q16 Raw Data 与最终 Table KPI 对账通过</span></div>
        </header>

        <section className="eco-answer-hero search-answer-hero">
          <div>
            <p>FUNNEL BOTTLENECK</p>
            <h2>搜索功能认知已达 <strong>75.36%</strong>，但近 30 天使用仅 <strong>44.77%</strong>；主要问题是认知向实际使用的转化</h2>
          </div>
          <p>Q14→Q15 转化率为 59.41%；Q15→Q16 仅为 21.20%。消费者行为、安装与认知变量使 Q15_4 的样本外 AUC 从 0.714 提升至 0.882。</p>
        </section>

        <section className="eco-model-selector search-model-selector">
          <div><span>MODEL WORKBENCH</span><h2>选择本项目要回答的问题</h2></div>
          <label>
            <span>模型输出</span>
            <select value={activeModel} onChange={(event) => setActiveModel(event.target.value)}>
              <option value="funnel">Q14–Q16 KPI 漏斗与七国差异</option>
              <option value="probability">Q15_4 个体使用概率模型</option>
              <option value="evidence">数据对账与下一期验证</option>
            </select>
          </label>
          <p>{activeModel === "funnel" ? "直接展示 Q14、Q15、Q16 的 Total KPI、Raw/Table 差异、阶段转化与七国差异。" : activeModel === "probability" ? "输入一个消费者的三个关键问卷特征，输出其过去 30 天使用 TikTok 搜索的模型概率。" : "追溯问卷题号、Raw Data、Table 对账、建模字段、验证方法与下一期结果回流。"}</p>
        </section>

        {activeModel === "funnel" && <>
          <section className="search-kpi-grid">
            {kpiCards.map((item) => (
              <article key={item.question}>
                <span>{item.question}</span><h2>{item.label}</h2><strong>{item.value.toFixed(2)}%</strong>
                <dl><div><dt>Raw 重算</dt><dd>{item.raw.toFixed(4)}%</dd></div><div><dt>最终 Table</dt><dd>{item.table.toFixed(2)}%</dd></div><div><dt>差异</dt><dd>{item.difference}</dd></div></dl>
              </article>
            ))}
            <article className="search-conversion-card">
              <span>STAGE CONVERSION</span><h2>搜索漏斗阶段转化</h2>
              <div><b>Q14 → Q15</b><strong>59.41%</strong><i><em style={{ width: "59.41%" }} /></i></div>
              <div><b>Q15 → Q16</b><strong>21.20%</strong><i><em style={{ width: "21.2%" }} /></i></div>
            </article>
          </section>

          <section className="eco-country-panel search-funnel-panel">
            <header><div><span>SEVEN-MARKET FUNNEL</span><h2>七国搜索漏斗</h2></div><p>Raw Data 重算与最终 NoSig Table 一致</p></header>
            <div className="search-funnel-table">
              <div className="search-funnel-head"><span>市场</span><span>Q14 搜索认知</span><span>Q15 近 30 天使用</span><span>Q16 最常使用</span><span>Q14→Q15</span></div>
              {marketFunnel.map(([market, awareness, use, mostUsed, conversion]) => (
                <div className="search-funnel-row" key={market}>
                  <strong>{market}</strong><span>{awareness.toFixed(1)}%</span><span>{use.toFixed(1)}%</span><span>{mostUsed.toFixed(1)}%</span>
                  <span className={conversion >= 65 ? "high" : conversion < 45 ? "low" : ""}>{conversion.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <p className="eco-chart-note">印度尼西亚 Q14→Q15 转化最高（80.6%）；韩国最低（39.2%）。这说明同一总体 KPI 下，不同市场需要区分“建立认知”和“推动使用”两类任务。</p>
          </section>
        </>}

        {activeModel === "probability" && <>
          <section className="search-probability-workbench">
            <article className="eco-panel search-profile-controls">
              <header><div><span>CONSUMER PROFILE</span><h2>输入消费者问卷特征</h2></div><p>三个主要预测信号</p></header>
              <div className="search-profile-list">
                {predictiveSignals.map((signal) => (
                  <label key={signal.key}>
                    <input type="checkbox" checked={Boolean(profile[signal.key])} onChange={(event) => setProfile((current) => ({ ...current, [signal.key]: event.target.checked }))} />
                    <span><strong>{signal.label}</strong><small>{signal.variable} · 系数 +{signal.coefficient.toFixed(4)}</small></span>
                    <b>{profile[signal.key] ? "是" : "否"}</b>
                  </label>
                ))}
              </div>
              <button type="button" onClick={() => setProfile({ longUse: false, aware: false, installed: false })}>清空画像</button>
            </article>

            <article className="search-probability-result">
              <span>Q15_4 PREDICTED PROBABILITY</span>
              <h2>过去 30 天使用 TikTok 搜索的模型概率</h2>
              <strong>{probability.toFixed(1)}%</strong>
              <div className="search-probability-gauge"><i style={{ width: `${probability}%` }} /></div>
              <p>以完整模型截距 −3.1745 和三个主要系数计算；其他 172 个编码特征固定在参考值。该结果用于解释模型如何响应消费者画像，不代表个体必然行为。</p>
            </article>
          </section>

          <section className="search-model-grid">
            <article className="eco-panel search-comparison">
              <header><div><span>MODEL COMPARISON</span><h2>消费者行为与认知数据的增量价值</h2></div><p>目标变量：Q15_4</p></header>
              <div className="search-model-bars">
                <div><b>人口属性与国家</b><i><em style={{ width: "71.35%" }} /></i><strong>0.7135 AUC</strong><small>58 个模型特征 · Brier 0.2151</small></div>
                <div className="active"><b>人口属性 + 平台行为 + 安装 + 搜索认知</b><i><em style={{ width: "88.24%" }} /></i><strong>0.8824 AUC</strong><small>175 个模型特征 · Brier 0.1358</small></div>
              </div>
              <p className="eco-chart-note">验证采用 W4 的 5 折交叉验证，按国家与 Q15_4 结果分层；每名受访者只进入一个验证折。</p>
            </article>

            <article className="eco-panel search-driver-panel">
              <header><div><span>PREDICTIVE SIGNALS</span><h2>三个主要预测信号</h2></div><p>完整 W4 模型系数</p></header>
              <div className="search-signal-list">
                {predictiveSignals.map((signal, index) => (
                  <div key={signal.variable}><b>{String(index + 1).padStart(2, "0")}</b><p><strong>{signal.label}</strong><span>{signal.variable}</span></p><em>+{signal.coefficient.toFixed(4)}</em></div>
                ))}
              </div>
              <p className="eco-chart-note">三项均来自问卷原始变量；系数用于概率预测，不解释为因果提升。</p>
            </article>
          </section>
        </>}

        {activeModel === "evidence" && <>
          <section className="eco-model-lineage search-data-lineage">
            {[
              ["01", "问卷", "Q14 搜索认知；Q15 近30天使用；Q16 最常使用"],
              ["02", "Raw Data", "N=7,000；1,373 个变量"],
              ["03", "Table 对账", "Q14/Q15/Q16 共 24 项 KPI 逐项通过"],
              ["04", "建模字段", "Q15_4 目标；S1/Q13/Q14 与人口属性输入"],
              ["05", "验证与回流", "5 折验证；下一期执行历史训练→后一期留出"],
            ].map(([index, title, detail]) => <article key={index}><b>{index}</b><div><strong>{title}</strong><p>{detail}</p></div></article>)}
          </section>

          <section className="eco-evidence-grid search-evidence-grid">
            <article className="eco-questionnaire-card">
              <header><span>DATA TO MODEL</span><h2>模型实际读取的问卷信息</h2></header>
              <div className="eco-fit-list">
                <p><b>预测目标</b> Q15_4：过去 30 天是否使用 TikTok 搜索信息、服务、内容或答案。</p>
                <p><b>人口属性</b> Q1、Q2、Q3、Q4、Q5、Q6、Q8、Q10、Q11。</p>
                <p><b>平台行为</b> S1：持续使用至少 3 个月的平台。</p>
                <p><b>前置信号</b> Q13 手机安装平台；Q14 搜索功能认知。</p>
              </div>
            </article>
            <article className="eco-model-route">
              <header><span>TRACKING MODEL ROUTE</span><h2>下一期如何形成真正的跨期预测</h2></header>
              <div><b>当前结果</b><strong>W4 正则化逻辑回归</strong><p>先验证研究变量能否提高 Q15_4 个体概率预测，保留 AUC、Brier 与校准结果。</p></div>
              <div><b>下一期</b><strong>历史期次训练、下一期留出</strong><p>完成题号与变量映射后，早期数据训练，后一期只用于检验迁移误差。</p></div>
              <div><b>积累后</b><strong>动态多层模型</strong><p>同时估计期次、国家与消费者差异，输出下一期 KPI 分布与市场风险。</p></div>
            </article>
          </section>
        </>}
      </section>
    </main>
  );
}
