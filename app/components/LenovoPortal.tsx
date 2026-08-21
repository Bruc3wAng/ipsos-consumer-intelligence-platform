"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import {
  campaignChannels,
  campaignFunnel,
  campaignModelInsights,
  campaignPerformanceIndex,
  preliminaryRecognitionModel,
  rawDataSnapshot,
  trackingSignals,
} from "../data/lenovoCampaign";

type PortalView = "insights" | "workbench" | "pipeline";

const portalTabs: Array<{ id: PortalView; label: string }> = [
  { id: "insights", label: "项目洞察" },
  { id: "workbench", label: "模型工作台" },
  { id: "pipeline", label: "数据链路" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function PortalHeader({ view, setView }: { view: PortalView; setView: (view: PortalView) => void }) {
  return (
    <>
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <img className="client-logo lenovo-logo" src="/lenovo-logo.svg" alt="Lenovo" />
          <div><strong>消费者洞察与模型平台</strong></div>
        </div>
        <div className="client-header-actions"><Link href="/clients/lenovo">返回联想项目</Link></div>
      </header>
      <nav className="client-tabs focused-tabs" aria-label="联想门户导航">
        {portalTabs.map((tab, index) => (
          <button className={view === tab.id ? "active" : ""} key={tab.id} onClick={() => setView(tab.id)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function ImpactIndex() {
  return (
    <article className="focused-index-card">
      <div className="focused-index-score">
        <div className="impact-dial" style={{ "--score": campaignPerformanceIndex.score } as React.CSSProperties}>
          <div><strong>{campaignPerformanceIndex.score}</strong><span>Norm = 100</span></div>
        </div>
        <div><span>Campaign 综合表现指数</span><h2>整体表现高于行业常模</h2><p>四项核心认知指标相对行业 Norm 等权合成。</p></div>
      </div>
      <div className="impact-dimensions focused-dimensions">
        {campaignPerformanceIndex.dimensions.map((item) => (
          <div key={item.name}><span>{item.name}</span><i><b style={{ width: `${Math.min(item.index / 1.6, 100)}%` }} /></i><strong>{item.index}</strong></div>
        ))}
      </div>
    </article>
  );
}

function InsightsView() {
  return (
    <>
      <header className="focused-intro">
        <div><p>广告效果&nbsp;&nbsp;/&nbsp;&nbsp;2026 FIFA 世界杯 Campaign 后测</p><h1>世界杯 Campaign 效果评估</h1><span>最终报告 N=2,000 · 2026.07.20–07.23</span></div>
        <strong>联想、世界杯与 AI 已形成清晰的品牌记忆链路</strong>
      </header>

      <section className="focused-hero-grid">
        <ImpactIndex />
        <article className="focused-decision-card">
          <span>模型洞察</span>
          <h2>世界杯兴趣是广告记忆的最强人群驱动</h2>
          <p>世界杯关注者的 Campaign 认知为 60.9%，非关注者为 36.5%，差异达到 24.4pts；认知倾向模型 5 折 AUC 为 {preliminaryRecognitionModel.auc}。</p>
          <div><b>球迷</b><strong>强化赛事与 AI 技术伙伴身份</strong></div>
          <div><b>非球迷</b><strong>前置日常 AI PC 使用价值</strong></div>
        </article>
      </section>

      <section className="focused-analysis-grid">
        <article className="focused-panel memory-panel">
          <div className="focused-panel-title"><h2>消费者记忆链路</h2><span>N=2,000</span></div>
          <div className="focused-memory-chain">
            {campaignFunnel.slice(1).map((item) => (
              <div key={item.stage}><span>{item.stage}</span><strong>{item.value}%</strong><i><b style={{ width: `${item.value * 1.85}%` }} /></i></div>
            ))}
          </div>
          <p>Campaign 认知 48% → 有效品牌认知 33% → 联想 AI 认知 26%。</p>
        </article>

        <article className="focused-panel channel-panel">
          <div className="focused-panel-title"><h2>广告记忆入口</h2><span>Base=960</span></div>
          <div className="focused-channel-bars">
            {campaignChannels.slice(0, 6).map((item, index) => (
              <div key={item.channel}><span>{item.channel}</span><i><b style={{ width: `${item.value * 2}%` }} className={index === 0 ? "primary" : ""} /></i><strong>{item.value}%</strong></div>
            ))}
          </div>
          <p>电视广告 46%，是最强记忆入口；网络、线下和品牌官方渠道共同补充触达。</p>
        </article>
      </section>

      <section className="focused-insights">
        {campaignModelInsights.map((item, index) => (
          <article key={item.title}><b>{String(index + 1).padStart(2, "0")}</b><h3>{item.title}</h3><p>{item.finding}</p><strong>{item.action}</strong></article>
        ))}
      </section>

      <section className="focused-tracking">
        <div><span>W0–W1 Tracking</span><h2>品牌与 AI 心智同步改善</h2></div>
        {trackingSignals.slice(0, 6).map((item) => <article key={item.metric}><span>{item.metric}</span><div><b>{item.before}%</b><i>→</i><strong>{item.after}%</strong><em>+{item.change}pts</em></div></article>)}
      </section>
    </>
  );
}

function Slider({ label, value, min = 0, max = 100, setValue }: { label: string; value: number; min?: number; max?: number; setValue: (value: number) => void }) {
  return <label className="model-slider"><span>{label}<b>{value}</b></span><input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>;
}

function CampaignScenarioModel() {
  const [inputs, setInputs] = useState({ fanShare: 43, tvReach: 46, brandLinkage: 68, aiClarity: 54, population: 100000 });
  const output = useMemo(() => {
    const recognition = clamp(48 + (inputs.fanShare - 43) * .18 + (inputs.tvReach - 46) * .15 + (inputs.aiClarity - 54) * .05, 20, 82);
    const effectiveBrand = recognition * inputs.brandLinkage / 100;
    const aiRecognition = recognition * inputs.aiClarity / 100;
    const purchaseAttitude = clamp(55 + (effectiveBrand - 33) * .3 + (aiRecognition - 26) * .2, 30, 78);
    return {
      recognition: Math.round(recognition * 10) / 10,
      effectiveBrand: Math.round(effectiveBrand * 10) / 10,
      aiRecognition: Math.round(aiRecognition * 10) / 10,
      purchaseAttitude: Math.round(purchaseAttitude * 10) / 10,
    };
  }, [inputs]);

  const outputs = [
    { label: "Campaign 认知", value: output.recognition, baseline: 48 },
    { label: "有效品牌认知", value: output.effectiveBrand, baseline: 33 },
    { label: "联想 AI 认知", value: output.aiRecognition, baseline: 26 },
    { label: "购买态度 T2B", value: output.purchaseAttitude, baseline: 55 },
  ];

  return (
    <section className="scenario-layout">
      <aside className="scenario-controls">
        <div><span>输入变量</span><h2>调整传播条件</h2></div>
        <Slider label="目标人群中的世界杯关注占比" value={inputs.fanShare} setValue={(value) => setInputs({ ...inputs, fanShare: value })} />
        <Slider label="电视广告触达" value={inputs.tvReach} setValue={(value) => setInputs({ ...inputs, tvReach: value })} />
        <Slider label="品牌联结强度" value={inputs.brandLinkage} setValue={(value) => setInputs({ ...inputs, brandLinkage: value })} />
        <Slider label="AI 信息清晰度" value={inputs.aiClarity} setValue={(value) => setInputs({ ...inputs, aiClarity: value })} />
        <label className="population-input"><span>目标人群规模</span><input type="number" min="1000" step="10000" value={inputs.population} onChange={(event) => setInputs({ ...inputs, population: Math.max(1000, Number(event.target.value) || 1000) })} /><b>人</b></label>
        <button onClick={() => setInputs({ fanShare: 43, tvReach: 46, brandLinkage: 68, aiClarity: 54, population: 100000 })}>恢复项目基准</button>
      </aside>

      <div className="scenario-output">
        <div className="scenario-output-head"><div><span>模型输出</span><h2>传播结果情景预测</h2></div><p>以最终报告 N=2,000 为基准</p></div>
        <div className="scenario-metrics">
          {outputs.map((item) => {
            const delta = Math.round((item.value - item.baseline) * 10) / 10;
            return <article key={item.label}><span>{item.label}</span><strong>{item.value}%</strong><p>基准 {item.baseline}% <b className={delta >= 0 ? "up" : "down"}>{delta >= 0 ? "+" : ""}{delta}pts</b></p></article>;
          })}
        </div>
        <div className="scenario-visual">
          {outputs.slice(0, 3).map((item) => (
            <div key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.value}%` }} /></i><strong>{Math.round(inputs.population * item.value / 100).toLocaleString()} 人</strong></div>
          ))}
        </div>
        <div className="scenario-recommendation"><span>建议</span><strong>{output.effectiveBrand >= 36 ? "扩大高赛事兴趣人群中的电视与品牌资产联投，同时保持 AI 信息单一清晰。" : "先提高品牌联结和 AI 信息清晰度，再扩大触达规模。"}</strong></div>
        <p className="scenario-method">模型以项目基准和 raw 人群差异构建情景函数；用于比较方案方向，后续由真实曝光与销售结果持续校准。</p>
      </div>
    </section>
  );
}

function ModelWorkbench() {
  return (
    <>
      <header className="focused-intro model-intro"><div><p>世界杯 Campaign&nbsp;&nbsp;/&nbsp;&nbsp;模型分析</p><h1>模型由研究问题与数据结构决定</h1><span>本项目优先解释广告认知、人群差异和跨期变化；AI PC 市场预测与品牌选择不在此项目中混用。</span></div></header>
      <section className="campaign-model-plan">
        <article className="primary"><span>主模型</span><h3>Logistic 认知倾向模型</h3><p>用受访者级特征预测 B2 Campaign 认知，识别高记忆概率人群与关键驱动。</p><strong>5 折 AUC {preliminaryRecognitionModel.auc}</strong></article>
        <article><span>辅助模型</span><h3>传播驱动与人群分层</h3><p>比较世界杯兴趣、渠道接触与品牌态度对认知和品牌联结的影响。</p><strong>系数稳定性 · Segment Lift</strong></article>
        <article><span>跨期</span><h3>时间序列与动态回归</h3><p>随着季度和期次积累，估计长期趋势、Campaign 期变化与外部因素。</p><strong>滚动时间窗回测</strong></article>
        <article><span>结果接入后</span><h3>Uplift / CATE</h3><p>接入曝光、Holdout 和购买结果后，识别真正产生增量的目标人群。</p><strong>Qini · AUUC · 增量回测</strong></article>
      </section>
      <section className="active-model-shell"><CampaignScenarioModel /></section>
      <section className="model-engine-line"><div><strong>scikit-learn / statsmodels</strong><span>Logistic · GLM · Feature Importance</span></div><div><strong>CausalML</strong><span>Uplift · CATE · Targeting</span></div><div><strong>PyMC</strong><span>Bayesian Dynamic Regression</span></div></section>
    </>
  );
}

function DataPipelineView() {
  const [sampleSize, setSampleSize] = useState(2000);
  const margin = Math.round(1.96 * Math.sqrt(.25 / sampleSize) * 1000) / 10;
  const train = Math.round(sampleSize * .7);
  const validation = sampleSize - train;
  return (
    <>
      <header className="focused-intro"><div><p>数据链路</p><h1>样本积累如何转化为更稳定的模型</h1><span>统一口径、持续追加结果标签，并用样本外验证衡量模型效果</span></div></header>

      <section className="end-to-end-chain">
        <article><b>01</b><span>研究资产</span><strong>问卷 · Raw · 定性 · Table · 报告 · Norm</strong></article><i>→</i>
        <article><b>02</b><span>消费者数仓</span><strong>Consumer × Wave × Campaign × Brand × Outcome</strong></article><i>→</i>
        <article><b>03</b><span>模型训练</span><strong>特征工程 · 训练 · 验证 · 校准 · 版本</strong></article><i>→</i>
        <article><b>04</b><span>决策输出</span><strong>洞察 · 预测 · 情景 · 人群 · Tracking</strong></article>
      </section>

      <section className="sample-lab">
        <div className="sample-control">
          <span>样本量模拟</span><h2>更大样本如何提高研究与建模稳定性</h2>
          <label><div><strong>N={sampleSize.toLocaleString()}</strong><p>拖动查看抽样误差与验证集规模</p></div><input type="range" min="1000" max="20000" step="1000" value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} /></label>
          <p>增加样本不会自动创造因果关系，但能降低抽样误差、扩大细分人群基数，并为训练/验证切分提供更稳定的数据。</p>
        </div>
        <div className="sample-output">
          <article><span>95% 最大抽样误差</span><strong>±{margin}%</strong><i><b style={{ width: `${Math.min(margin * 18, 100)}%` }} /></i></article>
          <article><span>训练集 · 70%</span><strong>{train.toLocaleString()}</strong><p>用于拟合参数与特征关系</p></article>
          <article><span>验证集 · 30%</span><strong>{validation.toLocaleString()}</strong><p>用于样本外效果评估</p></article>
          <article><span>10 个细分平均样本</span><strong>{Math.floor(sampleSize / 10).toLocaleString()}</strong><p>决定人群层洞察的稳定性</p></article>
        </div>
      </section>

      <section className="current-data-assets">
        <div><span>最终项目洞察</span><strong>N={rawDataSnapshot.finalReportBase.toLocaleString()}</strong><p>世界杯 Campaign 报告与汇总表</p></div>
        <div><span>受访者级建模表</span><strong>N={rawDataSnapshot.respondents.toLocaleString()}</strong><p>{rawDataSnapshot.variables.toLocaleString()} 个变量</p></div>
        <div><span>数据完整性</span><strong>{rawDataSnapshot.routeChecksPassed}/12</strong><p>关键路由检查通过</p></div>
        <div><span>当前模型验证</span><strong>AUC {preliminaryRecognitionModel.auc}</strong><p>5 折样本外验证</p></div>
      </section>
    </>
  );
}

export default function LenovoPortal() {
  const [view, setView] = useState<PortalView>("insights");
  return (
    <main className="client-portal lenovo-portal focused-portal">
      <PortalHeader view={view} setView={setView} />
      <section className="focused-content">
        {view === "insights" && <InsightsView />}
        {view === "workbench" && <ModelWorkbench />}
        {view === "pipeline" && <DataPipelineView />}
      </section>
      <footer className="client-footer"><span>Ipsos × Lenovo Consumer Intelligence</span><p>研究数据、模型输出与项目洞察保持同源更新</p></footer>
    </main>
  );
}
