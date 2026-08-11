"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PlatformBrand from "./PlatformBrand";
import {
  campaignChannels,
  campaignFunnel,
  campaignModelInsights,
  campaignPerformanceIndex,
  campaignScorecard,
  dataLayers,
  evidenceClaims,
  forecastPreview,
  modelCards,
  preliminaryRecognitionModel,
  questionnaireAudit,
  rawDataSnapshot,
  simulatedCampaignModel,
  simulatedUpliftSegments,
  trackingSignals,
  worldCupRecognition,
} from "../data/lenovoCampaign";
import { choiceProbabilities, predictConsumer, type ConsumerProfile } from "../models/consumerModels";

type PortalView = "command" | "audience" | "evidence" | "models" | "foundation";

const tabs: Array<{ id: PortalView; label: string; code: string }> = [
  { id: "command", label: "Campaign 总览", code: "01" },
  { id: "audience", label: "人群与触达", code: "02" },
  { id: "evidence", label: "问卷与证据", code: "03" },
  { id: "models", label: "AI PC 模型", code: "04" },
  { id: "foundation", label: "数据底座", code: "05" },
];

function Grade({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`grade grade-${tone}`}>{children}</span>;
}

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
        <div className="client-header-actions">
          <Link href="/">返回 Ipsos 平台</Link>
        </div>
      </header>
      <nav className="client-tabs" aria-label="联想门户导航">
        {tabs.map((tab) => (
          <button className={view === tab.id ? "active" : ""} key={tab.id} onClick={() => setView(tab.id)}>
            <span>{tab.code}</span>{tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function CommandView() {
  const benchmarkChart = campaignScorecard.map((item) => ({ name: item.label, 本项目: item.value, 行业Norm: item.benchmark }));
  return (
    <>
      <header className="portal-intro">
        <div>
          <p className="portal-breadcrumb">广告效果&nbsp;&nbsp;/&nbsp;&nbsp;2026 FIFA 世界杯 Campaign 后测</p>
          <h1>世界杯 Campaign 效果评估</h1>
          <p>Campaign 已建立清晰的联想品牌记忆与 AI 标签认知。模型进一步识别传播效率、人群差异和下一波投放优先级。</p>
        </div>
        <div className="data-period"><span>样本</span><strong>N=2,000</strong><small>2026.07.20–07.23</small></div>
      </header>

      <section className="decision-banner">
        <div><span>核心洞察</span><h2>继续放大“联想 × 世界杯 × AI”的记忆链路</h2></div>
        <p>品牌联结已经高于行业常模；下一波针对球迷与非球迷采用不同创意入口，并用媒体与销售结果继续校准增量。</p>
      </section>

      <section className="model-hero-grid">
        <article className="impact-index-card">
          <div className="impact-dial" style={{ "--score": campaignPerformanceIndex.score } as React.CSSProperties}>
            <div><strong>{campaignPerformanceIndex.score}</strong><span>Norm = 100</span></div>
          </div>
          <div className="impact-copy">
            <span>Campaign 综合表现指数</span>
            <h2>四项核心指标整体高于行业常模</h2>
            <p>{campaignPerformanceIndex.method}</p>
          </div>
          <div className="impact-dimensions">
            {campaignPerformanceIndex.dimensions.map((item) => (
              <div key={item.name}><span>{item.name}</span><i><b style={{ width: `${Math.min(item.index / 1.6, 100)}%` }} /></i><strong>{item.index}</strong></div>
            ))}
          </div>
        </article>

        <article className="memory-chain-card">
          <div className="panel-title"><h2>消费者记忆链路</h2><Grade tone="supported">N=2,000</Grade></div>
          <div className="memory-chain">
            {campaignFunnel.slice(1).map((item, index) => (
              <div key={item.stage}>
                <span>{item.stage}</span>
                <strong>{item.value}%</strong>
                <i style={{ width: `${item.value * 1.8}%` }} />
                {index < campaignFunnel.slice(1).length - 1 && <b>→</b>}
              </div>
            ))}
          </div>
          <p>48% 形成 Campaign 认知，33% 进一步形成有效品牌认知；联想 AI 与天禧 AI 标签分别达到 26% 和 24%。</p>
        </article>
      </section>

      <section className="scorecard-grid">
        {campaignScorecard.map((item) => (
          <article className="score-card" key={item.key}>
            <span>{item.label}</span>
            <div><strong>{item.value}%</strong><em>Norm {item.benchmark}%</em></div>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="campaign-insights">
        {campaignModelInsights.map((item, index) => (
          <article key={item.title}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div><h3>{item.title}</h3><p>{item.finding}</p><strong>{item.action}</strong></div>
          </article>
        ))}
      </section>

      <section className="two-column-grid">
        <article className="portal-panel chart-panel-real">
          <div className="panel-title"><h2>核心认知指标与行业常模</h2><Grade tone="supported">高于常模</Grade></div>
          <div className="chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkChart} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid stroke="#e6e9ee" horizontal={false} />
                <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="name" type="category" width={118} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="本项目" fill="#2436a8" radius={[0, 4, 4, 0]} />
                <Bar dataKey="行业Norm" fill="#b7c0cf" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footnote">行业常模来自报告引用的 2023–2025 年消费电子 20+ 案例。</p>
        </article>

        <article className="portal-panel evidence-summary">
          <div className="panel-title"><h2>结论与证据等级</h2></div>
          {evidenceClaims.slice(0, 4).map((item, index) => (
            <div className="evidence-line" key={item.claim}>
              <b>0{index + 1}</b>
              <div><strong>{item.claim}</strong><p>{item.decision}</p></div>
              <Grade tone={item.tone}>{item.status}</Grade>
            </div>
          ))}
          <div className="do-not-claim"><span>商业结果连接</span><strong>下一阶段接入投放、SKU 销量与转化数据</strong><p>将传播表现继续转化为销量增量与 ROI 预测。</p></div>
        </article>
      </section>

      <section className="portal-panel tracking-panel">
        <div className="panel-title"><h2>W0–W1 品牌追踪变化</h2><Grade tone="supported">指标改善</Grade></div>
        <div className="tracking-grid">
          {trackingSignals.map((item) => (
            <div key={item.metric}><span>{item.metric}</span><div><b>{item.before}%</b><i>→</i><strong>{item.after}%</strong><em>+{item.change}pts</em></div></div>
          ))}
        </div>
        <p className="chart-footnote">W0=2026 年 3 月，W1=2026 年 7 月。联想 AI 提示后认知提升 6pts，是本轮最明显的追踪变化。</p>
      </section>
    </>
  );
}

function PopulationProjection() {
  const [population, setPopulation] = useState(100000);
  return (
    <section className="portal-panel population-projection">
      <div className="projection-head">
        <div><h2>目标人群规模投影</h2><p>把最终报告比例投影到目标购机人群，用于估算传播资产覆盖规模。</p></div>
        <label><span>目标人群</span><input type="number" min="1000" step="10000" value={population} onChange={(event) => setPopulation(Math.max(1000, Number(event.target.value) || 1000))} /><b>人</b></label>
      </div>
      <div className="projection-grid">
        {campaignScorecard.map((item) => (
          <article key={item.key}>
            <span>{item.label}</span>
            <strong>{Math.round(population * item.value / 100).toLocaleString()}</strong>
            <p>{item.value}% × {population.toLocaleString()} 人</p>
          </article>
        ))}
      </div>
      <p className="projection-method">该投影用于把比例转换为业务规模；样本量仍为 N=2,000，不把规模放大解释为新增样本。</p>
    </section>
  );
}

function AudienceView() {
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><p className="portal-breadcrumb">世界杯 Campaign&nbsp;&nbsp;/&nbsp;&nbsp;人群与触达</p><h1>电视建立主记忆，世界杯兴趣放大传播效率</h1><p>最终报告呈现触达渠道；中期 raw 的认知倾向模型进一步识别更容易形成 Campaign 记忆的人群。</p></div>
        <div className="model-badge"><span>模型验证</span><strong>AUC {preliminaryRecognitionModel.auc}</strong><small>5 折交叉验证 · raw N=1,000</small></div>
      </header>
      <section className="two-column-grid audience-grid">
        <article className="portal-panel">
          <div className="panel-title"><h2>Campaign 认知渠道</h2><Grade tone="supported">Base=960</Grade></div>
          <div className="chart-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignChannels} layout="vertical" margin={{ left: 18, right: 28 }}>
                <CartesianGrid stroke="#e6e9ee" horizontal={false} />
                <XAxis type="number" domain={[0, 55]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="channel" width={92} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" fill="#2336a8" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="portal-panel raw-model-panel">
          <div className="panel-title"><h2>世界杯关注对广告记忆的影响</h2><Grade tone="supported">raw N=1,000</Grade></div>
          <div className="mini-bar-compare">
            {worldCupRecognition.map((item, index) => (
              <div key={item.group}>
                <span>{item.group}<small>N={item.n}</small></span>
                <div><i style={{ width: `${item.recognition}%` }} className={index === 0 ? "primary" : "muted"} /><b>{item.recognition}%</b></div>
              </div>
            ))}
          </div>
          <div className="model-fact"><span>核心驱动</span><strong>+24.4 pts</strong><p>世界杯关注是当前模型中最强的人群识别信号。</p></div>
          <div className="model-validation"><span>5-fold AUC</span><div>{preliminaryRecognitionModel.folds.map((value, index) => <b key={index}>{value.toFixed(3)}</b>)}</div></div>
          <p className="chart-footnote">模型目标：预测提示后 Campaign 认知，并用于指导分人群创意与媒介选择。</p>
        </article>
      </section>
      <section className="insight-actions">
        <article><span>01</span><h3>电视用于建立主记忆</h3><p>电视广告认知 46%，是最强入口；赛前贴片与赛时分屏最突出。</p></article>
        <article><span>02</span><h3>非球迷需要不同创意入口</h3><p>把产品日常使用场景放在前 3 秒，降低依赖赛事兴趣的触达门槛。</p></article>
        <article><span>03</span><h3>下一波保留可比较曝光</h3><p>按城市、媒体或频次形成可观测差异，预注册主要结果指标。</p></article>
      </section>
      <PopulationProjection />
    </>
  );
}

function EvidenceView() {
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><p className="portal-breadcrumb">世界杯 Campaign&nbsp;&nbsp;/&nbsp;&nbsp;问卷与证据</p><h1>问卷支持完整的传播链路诊断</h1><p>从触达、Campaign 认知、品牌联结、AI 标签到购买态度，核心结论均可回溯到问卷题目、汇总表和最终报告。</p></div>
        <div className="evidence-count"><strong>5</strong><span>关键结论</span><small>来源 · 方法 · 决策含义</small></div>
      </header>

      <section className="evidence-table portal-panel">
        <div className="panel-title"><h2>结论证据账本</h2></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>结论</th><th>证据</th><th>决策口径</th><th>状态</th></tr></thead>
            <tbody>{evidenceClaims.map((item) => <tr key={item.claim}><td><strong>{item.claim}</strong></td><td>{item.evidence}</td><td>{item.decision}</td><td><Grade tone={item.tone}>{item.status}</Grade></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="audit-grid">
        {questionnaireAudit.map((item) => (
          <article className="audit-card" key={item.item}>
            <div><h3>{item.item}</h3><Grade tone={item.tone}>{item.rating}</Grade></div>
            <p>{item.finding}</p><strong>{item.implication}</strong>
          </article>
        ))}
      </section>
    </>
  );
}

function RangeControl({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return <label className="range-control"><span>{label}<b>{value}</b></span><input type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>;
}

function ModelsView() {
  const [choice, setChoice] = useState({ priceSensitivity: 62, aiValue: 78, ecosystem: 48, brandTrust: 74 });
  const choiceResult = useMemo(() => choiceProbabilities(choice), [choice]);
  const [profile, setProfile] = useState<ConsumerProfile>({ age: 31, monthlyIncome: 14000, workFrequency: 78, contentCreation: 42, aiInterest: 82, privacyConcern: 66, priceSensitivity: 54 });
  const twin = useMemo(() => predictConsumer(profile), [profile]);
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><p className="portal-breadcrumb">联想&nbsp;&nbsp;/&nbsp;&nbsp;AI PC 消费者模型</p><h1>从市场趋势到单个消费者的四类模型</h1><p>覆盖广告认知、人群增量、未来三年渗透率、品牌选择和消费者购买预测，并在同一界面呈现输入、输出与验证结果。</p></div>
        <div className="readiness-ring"><strong>4</strong><span>模型模块</span><small>预测 · 增量 · 选择 · 数字孪生</small></div>
      </header>

      <section className="model-registry-grid">
        {modelCards.map((model) => <article key={model.name}><div><span>{model.status}</span><h3>{model.name}</h3><p>{model.family}</p></div><dl><div><dt>预测对象</dt><dd>{model.target}</dd></div><div><dt>数据输入</dt><dd>{model.needs}</dd></div><div><dt>验证方法</dt><dd>{model.validation}</dd></div></dl></article>)}
      </section>

      <section className="model-engine-strip">
        <div><strong>PyMC-Marketing</strong><span>贝叶斯预测 · MMM · Customer Choice · Incrementality</span></div>
        <div><strong>CausalML</strong><span>Uplift · CATE · Campaign Targeting</span></div>
        <div><strong>Biogeme</strong><span>离散选择 · 参数估计 · 价格弹性</span></div>
      </section>

      <section className="portal-panel simulation-demo">
        <div className="panel-title"><div><h2>广告增量与 90 天购买预测</h2><p>{simulatedCampaignModel.calibration}</p></div><Grade tone="directional">合成消费者</Grade></div>
        <div className="simulation-metrics">
          <div><span>模拟投放组购买率</span><strong>{simulatedCampaignModel.treatedPurchase}%</strong><small>65% randomized treatment</small></div>
          <div><span>模拟 Holdout 购买率</span><strong>{simulatedCampaignModel.controlPurchase}%</strong><small>35% randomized holdout</small></div>
          <div className="highlight"><span>模拟绝对增量</span><strong>+{simulatedCampaignModel.absoluteUplift} pts</strong><small>95% CI +{simulatedCampaignModel.ci95[0]} – +{simulatedCampaignModel.ci95[1]}</small></div>
          <div><span>每万名增量购买</span><strong>+{simulatedCampaignModel.incrementalPer10000}</strong><small>模型 holdout AUC {simulatedCampaignModel.purchaseAuc}</small></div>
        </div>
        <div className="simulation-body">
          <div className="chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulatedUpliftSegments} margin={{ left: 0, right: 10 }}>
                <CartesianGrid stroke="#e6e9ee" vertical={false} />
                <XAxis dataKey="segment" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 22]} unit="%" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="treated" name="模拟投放组" fill="#2436a8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="control" name="模拟 Holdout" fill="#aeb7c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="simulation-note"><span>模型方法</span><h3>真实样本结构 × 随机 Holdout × 购买结果</h3><p>系统以 raw 的人口与世界杯关注结构生成 30,000 个合成消费者，再随机分配投放与 Holdout，输出整体增量、区间估计和人群异质性。</p><strong>接入真实曝光与购买结果后，模型结构保持不变，合成标签替换为真实结果标签。</strong><small>Seed {simulatedCampaignModel.seed} · {simulatedCampaignModel.dataset}</small></div>
        </div>
      </section>

      <section className="portal-panel model-demo forecast-demo">
        <div className="panel-title"><div><h2>贝叶斯市场预测：未来 3 年 AI PC 渗透率</h2><p>中位数预测与不确定区间</p></div><Grade tone="gap">情景预测</Grade></div>
        <div className="chart-medium">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastPreview} margin={{ left: 0, right: 18 }}>
              <defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2636a8" stopOpacity={0.28}/><stop offset="95%" stopColor="#2636a8" stopOpacity={0.02}/></linearGradient></defs>
              <CartesianGrid stroke="#e6e9ee" vertical={false} />
              <XAxis dataKey="year" /><YAxis domain={[0, 70]} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Area type="monotone" dataKey="high" stroke="none" fill="#dce1f7" name="上界" />
              <Area type="monotone" dataKey="low" stroke="#a9b2d8" fill="#ffffff" name="下界" />
              <Area type="monotone" dataKey="mean" stroke="#2636a8" strokeWidth={3} fill="url(#forecastFill)" name="预测中位数" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="two-column-grid model-tools">
        <article className="portal-panel model-demo">
          <div className="panel-title"><div><h2>Choice Model：品牌选择模拟</h2><p>调整消费者决策因子，实时比较 Lenovo / Dell / Apple 选择概率</p></div></div>
          <div className="controls-grid">
            <RangeControl label="价格敏感" value={choice.priceSensitivity} setValue={(value) => setChoice({ ...choice, priceSensitivity: value })} />
            <RangeControl label="AI 价值" value={choice.aiValue} setValue={(value) => setChoice({ ...choice, aiValue: value })} />
            <RangeControl label="生态粘性" value={choice.ecosystem} setValue={(value) => setChoice({ ...choice, ecosystem: value })} />
            <RangeControl label="品牌信任" value={choice.brandTrust} setValue={(value) => setChoice({ ...choice, brandTrust: value })} />
          </div>
          <div className="probability-bars">{choiceResult.map((item, index) => <div key={item.brand}><span>{item.brand}</span><div><i style={{ width: `${item.probability}%` }} className={`choice-${index}`} /></div><strong>{item.probability}%</strong></div>)}</div>
        </article>

        <article className="portal-panel model-demo twin-demo">
          <div className="panel-title"><div><h2>Consumer Digital Twin：消费者画像预测</h2><p>输入画像，输出购买概率、价格接受度与功能偏好</p></div></div>
          <div className="twin-inputs">
            <label><span>年龄</span><input type="number" value={profile.age} min="18" max="70" onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} /></label>
            <label><span>月收入</span><input type="number" value={profile.monthlyIncome} step="1000" onChange={(e) => setProfile({ ...profile, monthlyIncome: Number(e.target.value) })} /></label>
            <RangeControl label="AI 兴趣" value={profile.aiInterest} setValue={(value) => setProfile({ ...profile, aiInterest: value })} />
            <RangeControl label="价格敏感" value={profile.priceSensitivity} setValue={(value) => setProfile({ ...profile, priceSensitivity: value })} />
          </div>
          <div className="twin-output"><div><span>模拟购买概率</span><strong>{twin.purchaseProbability}%</strong></div><div><span>可接受价格</span><strong>¥{twin.acceptedPrice.toLocaleString()}</strong></div><div><span>需求分群</span><strong>{twin.segment}</strong></div></div>
          <div className="feature-chips">{twin.topFeatures.map((feature) => <span key={feature.name}>{feature.name}</span>)}</div>
        </article>
      </section>
    </>
  );
}

function FoundationView() {
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><p className="portal-breadcrumb">联想&nbsp;&nbsp;/&nbsp;&nbsp;数据底座</p><h1>同一项目资料转化为可复用的数据对象与模型输入</h1><p>最终报告 N=2,000 用于 Campaign 洞察；中期 raw N=1,000 用于受访者级特征工程、驱动分析和模型回测。</p></div>
        <div className="raw-snapshot"><span>受访者级建模表</span><strong>{rawDataSnapshot.respondents.toLocaleString()} × {rawDataSnapshot.variables.toLocaleString()}</strong><small>受访者 × 变量</small></div>
      </header>

      <section className="raw-quality-grid">
        <article><span>最终洞察样本</span><strong>{rawDataSnapshot.finalReportBase.toLocaleString()}</strong><small>最终报告与汇总表</small></article>
        <article><span>建模样本</span><strong>{rawDataSnapshot.respondents.toLocaleString()}</strong><small>中期 raw · 1,153 个变量</small></article>
        <article><span>访问时长中位数</span><strong>{rawDataSnapshot.medianMinutes} min</strong><small>{rawDataSnapshot.underTenMinutes} 份低于 10 分钟，需联合质控</small></article>
        <article><span>关键路由</span><strong>{rawDataSnapshot.routeChecksPassed}/12</strong><small>抽查均通过</small></article>
      </section>

      <section className="portal-panel layer-table">
        <div className="panel-title"><h2>从研究数据到模型结果</h2></div>
        {dataLayers.map((item, index) => <div className="layer-row" key={item.layer}><b>0{index + 1}</b><div><strong>{item.layer}</strong><p>{item.detail}</p></div><span>{item.cadence}</span><em className={item.state.includes("待") ? "pending" : "ready"}>{item.state}</em></div>)}
      </section>

      <section className="architecture-panel">
        <div className="architecture-node primary"><span>消费者</span><strong>画像 · 需求 · 选择 · 购买</strong></div><i>↔</i>
        <div className="architecture-node"><span>Campaign</span><strong>素材 · 渠道 · 曝光 · 频次</strong></div><i>↔</i>
        <div className="architecture-node"><span>品牌与产品</span><strong>联想 · AI PC · 天禧 AI</strong></div><i>↔</i>
        <div className="architecture-node"><span>时间</span><strong>年 · 季度 · 月 · 周 · 波次</strong></div><i>↔</i>
        <div className="architecture-node gap"><span>结果</span><strong>认知 · 意愿 · 销量 · 份额</strong></div>
      </section>

      <section className="portal-panel next-data">
        <div><span>01</span><strong>最终 N=2,000 raw + 权重</strong><p>复算全部表格、关闭 B9 汇总问题，并冻结分析基线。</p></div>
        <div><span>02</span><strong>个人/城市级曝光与频次</strong><p>构建可比曝光组，估计异质性与增量。</p></div>
        <div><span>03</span><strong>周度媒体、渠道与 SKU 结果</strong><p>验证购买意愿是否转化为真实销量和份额。</p></div>
      </section>
    </>
  );
}

export default function LenovoPortal() {
  const [view, setView] = useState<PortalView>("command");
  return (
    <main className="client-portal lenovo-portal">
      <PortalHeader view={view} setView={setView} />
      <section className="portal-content">
        {view === "command" && <CommandView />}
        {view === "audience" && <AudienceView />}
        {view === "evidence" && <EvidenceView />}
        {view === "models" && <ModelsView />}
        {view === "foundation" && <FoundationView />}
      </section>
      <footer className="client-footer"><span>Ipsos × Lenovo Consumer Intelligence</span><p>数据、模型、洞察与决策建议保持同源更新</p></footer>
    </main>
  );
}
