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
  sourceQualityChecks,
  trackingSignals,
  worldCupRecognition,
} from "../data/lenovoCampaign";
import { choiceProbabilities, predictConsumer, type ConsumerProfile } from "../models/consumerModels";

type PortalView = "command" | "audience" | "evidence" | "models" | "foundation";

const tabs: Array<{ id: PortalView; label: string; code: string }> = [
  { id: "command", label: "Campaign 决策", code: "01" },
  { id: "audience", label: "人群与触达", code: "02" },
  { id: "evidence", label: "证据审计", code: "03" },
  { id: "models", label: "AI PC 模型实验室", code: "04" },
  { id: "foundation", label: "数据与模型底座", code: "05" },
];

function Grade({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`grade grade-${tone}`}>{children}</span>;
}

function SourceTag({ children }: { children: React.ReactNode }) {
  return <span className="source-tag">{children}</span>;
}

function PortalHeader({ view, setView }: { view: PortalView; setView: (view: PortalView) => void }) {
  return (
    <>
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <div className="lenovo-wordmark">Lenovo</div>
          <div><strong>Consumer Intelligence</strong><small>China · TMT client workspace</small></div>
        </div>
        <div className="client-header-actions">
          <span className="scope-chip"><i />LENOVO SCOPE ONLY</span>
          <Link href="/">返回 Ipsos 中台</Link>
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
          <span className="kicker">2026 FIFA WORLD CUP CAMPAIGN · POST-TEST</span>
          <h1>传播有效，但增量效果仍未被证明。</h1>
          <p>现有证据足以判断认知、品牌联结与 AI 标签记忆；不足以把 W0–W1 的上涨归因给 Campaign，更不能直接推导销量 ROI。</p>
        </div>
        <div className="data-period"><span>FINAL REPORT</span><strong>N=2,000</strong><small>Fieldwork · 20–23 Jul 2026</small></div>
      </header>

      <section className="decision-banner">
        <div className="decision-index">01</div>
        <div><span>DECISION VERDICT</span><h2>继续放大“联想 × 世界杯 × AI”的记忆链路，同时补建可归因设计。</h2></div>
        <p>下一波不要只重复后测。保留自然曝光差异或城市/媒体 holdout，并接入周度投放与 SKU 结果，才能判断增量。</p>
      </section>

      <section className="scorecard-grid">
        {campaignScorecard.map((item) => (
          <article className="score-card" key={item.key}>
            <span>{item.label}</span>
            <div><strong>{item.value}%</strong><em>Norm {item.benchmark}%</em></div>
            <p>{item.note}</p>
            <SourceTag>{item.source}</SourceTag>
          </article>
        ))}
      </section>

      <section className="two-column-grid">
        <article className="portal-panel chart-panel-real">
          <div className="panel-title"><div><span>BENCHMARK VIEW</span><h2>核心认知指标高于报告行业均值</h2></div><Grade tone="supported">描述性可支持</Grade></div>
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
          <p className="chart-footnote">Norm 来自报告引用的 2023–2025 消费电子 20+ 案例；当前材料未提供可比案例清单与加权口径。</p>
        </article>

        <article className="portal-panel evidence-summary">
          <div className="panel-title"><div><span>EVIDENCE LADDER</span><h2>汇报中应如何写</h2></div></div>
          {evidenceClaims.slice(0, 4).map((item, index) => (
            <div className="evidence-line" key={item.claim}>
              <b>0{index + 1}</b>
              <div><strong>{item.claim}</strong><p>{item.decision}</p></div>
              <Grade tone={item.tone}>{item.status}</Grade>
            </div>
          ))}
          <div className="do-not-claim"><span>DO NOT CLAIM</span><strong>“Campaign 带来全面提升 / 增量销量 / ROI”</strong><p>缺少同期对照与商业结果标签。</p></div>
        </article>
      </section>

      <section className="portal-panel tracking-panel">
        <div className="panel-title"><div><span>W0 → W1 TRACKING</span><h2>指标在投放期上涨，但属于同期信号</h2></div><Grade tone="directional">不可直接归因</Grade></div>
        <div className="tracking-grid">
          {trackingSignals.map((item) => (
            <div key={item.metric}><span>{item.metric}</span><div><b>{item.before}%</b><i>→</i><strong>{item.after}%</strong><em>+{item.change}pts</em></div></div>
          ))}
        </div>
        <p className="chart-footnote">W0=2026 年 3 月，W1=2026 年 7 月；季节、其他营销、产品/渠道变化均可能造成差异。</p>
      </section>
    </>
  );
}

function AudienceView() {
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><span className="kicker">AUDIENCE & REACH</span><h1>电视是记忆入口，世界杯兴趣决定触达上限。</h1><p>以下为真实 raw 的关联结果与最终汇总渠道表现；它们说明“谁更容易看到”，不代表“广告对谁造成更大增量”。</p></div>
        <div className="model-badge"><span>INTERIM RAW MODEL</span><strong>AUC {preliminaryRecognitionModel.auc}</strong><small>{preliminaryRecognitionModel.validation}</small></div>
      </header>
      <section className="two-column-grid audience-grid">
        <article className="portal-panel">
          <div className="panel-title"><div><span>CHANNEL RECALL · BASE 960</span><h2>Campaign 认知渠道</h2></div></div>
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
          <SourceTag>Campaign!A300:B347 · 报告 P15</SourceTag>
        </article>
        <article className="portal-panel raw-model-panel">
          <div className="panel-title"><div><span>REAL RAW · N=1,000</span><h2>世界杯关注与 Campaign 认知</h2></div><Grade tone="directional">关联</Grade></div>
          <div className="mini-bar-compare">
            {worldCupRecognition.map((item, index) => (
              <div key={item.group}>
                <span>{item.group}<small>N={item.n}</small></span>
                <div><i style={{ width: `${item.recognition}%` }} className={index === 0 ? "primary" : "muted"} /><b>{item.recognition}%</b></div>
              </div>
            ))}
          </div>
          <div className="model-fact"><span>差异</span><strong>24.4 pts</strong><p>初步模型中，世界杯关注仍是最强可解释信号。</p></div>
          <div className="model-validation"><span>5-fold AUC</span><div>{preliminaryRecognitionModel.folds.map((value, index) => <b key={index}>{value.toFixed(3)}</b>)}</div></div>
          <p className="chart-footnote">模型目标是“提示后自报认知”，不是增量曝光、购买或 ROI。</p>
        </article>
      </section>
      <section className="insight-actions">
        <article><span>01</span><h3>电视用于建立主记忆</h3><p>电视广告认知 46%，是最强入口；赛前贴片与赛时分屏最突出。</p></article>
        <article><span>02</span><h3>非球迷需要不同创意入口</h3><p>把产品日常使用场景放在前 3 秒，降低依赖赛事兴趣的触达门槛。</p></article>
        <article><span>03</span><h3>下一波保留可比较曝光</h3><p>按城市、媒体或频次形成可观测差异，预注册主要结果指标。</p></article>
      </section>
    </>
  );
}

function EvidenceView() {
  return (
    <>
      <header className="portal-intro compact-intro">
        <div><span className="kicker">QUESTIONNAIRE & EVIDENCE AUDIT</span><h1>问卷能回答传播诊断，不能单独回答因果效果。</h1><p>每条结论都绑定证据来源、方法边界和可用措辞，避免报告从“同期变化”跨越到“因果提升”。</p></div>
        <div className="evidence-count"><strong>5</strong><span>关键结论</span><small>2 可支持 · 2 方向性 · 1 缺口</small></div>
      </header>

      <section className="evidence-table portal-panel">
        <div className="panel-title"><div><span>CLAIM LEDGER</span><h2>结论证据账本</h2></div></div>
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

      <section className="portal-panel data-alerts">
        <div className="panel-title"><div><span>DATA QUALITY</span><h2>交付前必须关闭的三个问题</h2></div></div>
        {sourceQualityChecks.map((item) => (
          <div className="alert-row" key={item.title}><span className={`severity severity-${item.severity}`}>{item.severity}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><SourceTag>{item.source}</SourceTag></div>
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
        <div><span className="kicker">AI PC MODEL LAB</span><h1>三个核心模型已做成交互架构，只有认知倾向模型接入了真实 raw。</h1><p>预测、品牌选择和 Digital Twin 仍是未经商业结果校准的原型；界面展示产品形态，不把模拟值伪装成结论。</p></div>
        <div className="readiness-ring"><strong>1/4</strong><span>已接入真实数据</span><small>Campaign propensity v0.1</small></div>
      </header>

      <section className="model-registry-grid">
        {modelCards.map((model) => <article key={model.name}><div><span>{model.status}</span><h3>{model.name}</h3><p>{model.family}</p></div><dl><div><dt>预测对象</dt><dd>{model.target}</dd></div><div><dt>仍需数据</dt><dd>{model.needs}</dd></div><div><dt>验证</dt><dd>{model.validation}</dd></div></dl></article>)}
      </section>

      <section className="portal-panel simulation-demo">
        <div className="panel-title"><div><span>SYNTHETIC CAUSAL SANDBOX</span><h2>模拟广告增量与 90 天购买预测</h2><p>{simulatedCampaignModel.calibration}</p></div><Grade tone="directional">模拟数据</Grade></div>
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
          <div className="simulation-note"><span>HOW TO READ</span><h3>这段 demo 真正展示的是方法，而不是结果。</h3><p>系统用真实 raw 的样本结构生成 30,000 个合成消费者，再随机分配投放与 holdout，并注入可验证的购买结果。这样可以先把数据管道、uplift、区间估计和决策界面搭起来。</p><strong>{simulatedCampaignModel.limit}</strong><small>Seed {simulatedCampaignModel.seed} · {simulatedCampaignModel.dataset}</small></div>
        </div>
      </section>

      <section className="portal-panel model-demo forecast-demo">
        <div className="panel-title"><div><span>BAYESIAN MARKET FORECAST</span><h2>未来 3 年 AI PC 渗透率</h2><p>架构预览 · 未校准 · 不用于当前决策</p></div><Grade tone="gap">需要市场结果</Grade></div>
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
          <div className="panel-title"><div><span>CHOICE MODEL</span><h2>品牌选择模拟</h2><p>示意效用函数 · 未基于 conjoint 训练</p></div></div>
          <div className="controls-grid">
            <RangeControl label="价格敏感" value={choice.priceSensitivity} setValue={(value) => setChoice({ ...choice, priceSensitivity: value })} />
            <RangeControl label="AI 价值" value={choice.aiValue} setValue={(value) => setChoice({ ...choice, aiValue: value })} />
            <RangeControl label="生态粘性" value={choice.ecosystem} setValue={(value) => setChoice({ ...choice, ecosystem: value })} />
            <RangeControl label="品牌信任" value={choice.brandTrust} setValue={(value) => setChoice({ ...choice, brandTrust: value })} />
          </div>
          <div className="probability-bars">{choiceResult.map((item, index) => <div key={item.brand}><span>{item.brand}</span><div><i style={{ width: `${item.probability}%` }} className={`choice-${index}`} /></div><strong>{item.probability}%</strong></div>)}</div>
        </article>

        <article className="portal-panel model-demo twin-demo">
          <div className="panel-title"><div><span>CONSUMER DIGITAL TWIN</span><h2>消费者画像模拟</h2><p>规则原型 · 需要后续购买标签校准</p></div></div>
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
        <div><span className="kicker">DATA FOUNDATION & MODEL OPERATIONS</span><h1>raw 已经让“认知倾向模型”可运行，但完整闭环仍差结果标签。</h1><p>当前拿到的是 7 月 21 日中期样本；最终报告 N=2,000，因此所有复算与正式模型仍需最终 raw、权重与商业结果。</p></div>
        <div className="raw-snapshot"><span>INTERIM RAW</span><strong>{rawDataSnapshot.respondents.toLocaleString()} × {rawDataSnapshot.variables.toLocaleString()}</strong><small>respondents × variables</small></div>
      </header>

      <section className="raw-quality-grid">
        <article><span>受访者</span><strong>{rawDataSnapshot.respondents.toLocaleString()}</strong><small>最终报告基数 {rawDataSnapshot.finalReportBase.toLocaleString()}</small></article>
        <article><span>访问时长中位数</span><strong>{rawDataSnapshot.medianMinutes} min</strong><small>{rawDataSnapshot.underTenMinutes} 份低于 10 分钟，需联合质控</small></article>
        <article><span>Respondent Serial</span><strong>0</strong><small>缺失 / 重复</small></article>
        <article><span>关键路由</span><strong>{rawDataSnapshot.routeChecksPassed}/12</strong><small>抽查均通过</small></article>
      </section>
      <div className="raw-note">{rawDataSnapshot.note}</div>

      <section className="portal-panel layer-table">
        <div className="panel-title"><div><span>DATA PRODUCTS</span><h2>从研究数据到模型结果</h2></div></div>
        {dataLayers.map((item, index) => <div className="layer-row" key={item.layer}><b>0{index + 1}</b><div><strong>{item.layer}</strong><p>{item.detail}</p></div><span>{item.cadence}</span><em className={item.state.includes("待") ? "pending" : "ready"}>{item.state}</em></div>)}
      </section>

      <section className="architecture-panel">
        <div className="architecture-node primary"><span>业务决策</span><strong>广告是否有效？下一波如何投？</strong></div><i>→</i>
        <div className="architecture-node"><span>数据产品</span><strong>respondent × wave × exposure</strong></div><i>→</i>
        <div className="architecture-node"><span>模型</span><strong>Propensity · Uplift · MMM</strong></div><i>→</i>
        <div className="architecture-node"><span>决策产品</span><strong>人群 · 素材 · 预算模拟</strong></div><i>→</i>
        <div className="architecture-node gap"><span>结果回流</span><strong>销量 · 转化 · 市场份额</strong></div>
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
      <footer className="client-footer"><span>Lenovo Consumer Intelligence</span><p>Evidence first · Every claim linked to source, method and limitation.</p></footer>
    </main>
  );
}
