"use client";

import { useState } from "react";
import Link from "next/link";
import PlatformBrand from "./PlatformBrand";

type ProjectKey = "campaign" | "aipc" | "bhtSocial";

const projects = {
  campaign: {
    domain: "广告效果",
    title: "2026 FIFA 世界杯 Campaign 后测",
    question: "Campaign 是否建立了联想品牌记忆？哪些人群、渠道与信息最值得下一波继续投入？",
    data: "问卷 · 最终报告 N=2,000 · 中期 raw N=1,000 · W0/W1 Tracking",
    models: [
      { role: "主模型", name: "Logistic 认知倾向模型", reason: "目标变量 B2 为二分类，适合解释哪些消费者更容易形成 Campaign 认知。", validation: "5 折样本外 AUC 0.717" },
      { role: "辅助模型", name: "传播驱动与人群分层", reason: "比较世界杯兴趣、渠道接触、品牌态度与人口特征的影响强度。", validation: "系数稳定性 · 分层 lift" },
      { role: "跨期", name: "时间序列与动态回归", reason: "随着季度和期次积累，分离长期趋势、Campaign 期变化与外部因素。", validation: "滚动时间窗回测" },
      { role: "结果接入后", name: "Uplift / CATE", reason: "接入曝光、Holdout 与购买结果后，识别真正产生增量的人群。", validation: "Qini · AUUC · 增量回测" },
    ],
    href: "/clients/lenovo/campaign",
    accent: "#e2231a",
  },
  aipc: {
    domain: "AI PC",
    title: "AI PC Adoption Tracker",
    question: "未来三年 AI PC 如何渗透？消费者为何选择 Lenovo / Dell / Apple？谁会购买、接受什么价格？",
    data: "消费者问卷 · 市场时间序列 · Conjoint 选择任务 · 后续购买结果",
    models: [
      { role: "市场层", name: "贝叶斯扩散与动态预测", reason: "整合季度渗透、销量、价格、渠道和宏观变量，输出未来三年预测区间。", validation: "时间窗回测 · MAPE · 区间覆盖率" },
      { role: "选择层", name: "Hierarchical Bayes Choice Model", reason: "估计品牌、价格、配置和 AI 功能的个体效用与价格弹性。", validation: "留出 Choice Task · 份额校准" },
      { role: "消费者层", name: "Consumer Digital Twin", reason: "基于画像预测购买概率、功能偏好和价格接受度。", validation: "AUC · Brier · 分群校准" },
    ],
    href: "/clients/lenovo/aipc",
    accent: "#2639a5",
  },
  bhtSocial: {
    domain: "品牌健康追踪",
    title: "Lenovo BHT + Social Dashboard",
    question: "品牌健康在不同期次和子群中如何变化？哪些 Social 信号能够解释变化并领先预测下一期 KPI？",
    data: "多期 BHT KPI · 受访者级 Raw Data · Social 话题、情绪、声量与市场事件",
    models: [
      { role: "跨期主模型", name: "分层动态品牌健康模型", reason: "同时估计整体、消费/SMB/政企及下层子群趋势，用部分汇聚稳定小样本人群。", validation: "时间留出 · 子群 MAE · 区间覆盖率" },
      { role: "驱动模型", name: "BHT 关键驱动与变化分解", reason: "识别品牌形象、体验和人群结构对考虑、偏好与购买意向的贡献。", validation: "AUC · Brier · 系数稳定性" },
      { role: "Social 模型", name: "话题、情绪与异常检测", reason: "从持续更新的公开讨论中识别话题结构、风险事件与竞争声量变化。", validation: "人工标注集 F1 · 事件召回率" },
      { role: "跨源模型", name: "Social 领先指标模型", reason: "比较 Social 信号与下一期 BHT 的滞后关系，用于预警与预测。", validation: "分布滞后回归 · 滚动回测" },
    ],
    href: "/clients/lenovo/bht-social",
    accent: "#109f99",
  },
} as const;

export default function LenovoHub() {
  const [selected, setSelected] = useState<ProjectKey>("campaign");
  const project = projects[selected];
  return (
    <main className="client-portal lenovo-hub">
      <header className="client-header">
        <div className="client-brandline"><PlatformBrand compact /><span className="brand-divider" /><img className="client-logo lenovo-logo" src="/lenovo-logo.svg" alt="Lenovo" /><div><strong>消费者洞察与模型平台</strong></div></div>
        <div className="client-header-actions"><Link href="/">返回 Ipsos 平台</Link></div>
      </header>

      <section className="hub-content">
        <header className="hub-hero">
          <div><p>TMT&nbsp;&nbsp;/&nbsp;&nbsp;Lenovo</p><h1>联想消费者研究空间</h1><span>按业务模块进入具体项目，每个项目独立选择最适合的模型。</span></div>
          <div className="hub-hero-path"><span>客户</span><i>→</i><span>业务模块</span><i>→</i><span>项目</span><i>→</i><strong>模型与洞察</strong></div>
        </header>

        <section className="hub-projects">
          <div className="hub-section-title"><span>项目组合</span><h2>选择业务模块与项目</h2></div>
          <div className="hub-project-grid">
            {(Object.entries(projects) as Array<[ProjectKey, typeof projects[ProjectKey]]>).map(([key, item], index) => (
              <article className={selected === key ? "active" : ""} key={key} style={{ "--project-accent": item.accent } as React.CSSProperties} onClick={() => setSelected(key)}>
                <div className="hub-project-domain"><span>{item.domain}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
                <h3>{item.title}</h3>
                <p>{item.question}</p>
                <div className="hub-project-models">{item.models.slice(0, 3).map((model) => <span key={model.name}>{model.name}</span>)}</div>
                <Link href={item.href}>进入项目 <span>→</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="model-recommendation-board">
          <div className="recommendation-head">
            <div><span>当前选择 · {project.domain}</span><h2>{project.title}</h2><p>{project.question}</p></div>
            <Link href={project.href}>进入模型与洞察 <span>→</span></Link>
          </div>
          <div className="recommendation-logic">
            <div><span>研究目标</span><strong>{project.question}</strong></div><i>→</i>
            <div><span>可用数据</span><strong>{project.data}</strong></div><i>→</i>
            <div><span>模型推荐</span><strong>{project.models.map((model) => model.name).join(" · ")}</strong></div>
          </div>
          <div className="recommended-models">
            {project.models.map((model, index) => (
              <article key={model.name}><b>{String(index + 1).padStart(2, "0")}</b><div><span>{model.role}</span><h3>{model.name}</h3><p>{model.reason}</p><strong>{model.validation}</strong></div></article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
