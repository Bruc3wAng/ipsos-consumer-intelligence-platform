"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import {
  bhtDrivers,
  bhtSocialPeriods,
  brandFunnel,
  brandShareOfVoice,
  demoSourceNote,
  modelRegistry,
  segmentAdjustments,
  socialChannels,
  socialTopics,
  subgroupOptions,
} from "../data/lenovoBhtSocialDemo";

type DashboardView = "overview" | "subgroups" | "forecast" | "drivers" | "social" | "leadLag";
type SegmentKey = keyof typeof segmentAdjustments;
type MetricKey = "health" | "awareness" | "consideration" | "preference" | "innovation" | "social";
type MetricAdjustment = Record<MetricKey, number>;
type SubgroupOption = MetricAdjustment & { id: string; label: string; momentum: number; driver: string };

const modelOptions: Array<{ id: DashboardView; label: string; question: string }> = [
  { id: "overview", label: "BHT + Social 管理总览", question: "品牌健康发生了什么变化，Social 是否提供了同向或领先信号？" },
  { id: "subgroups", label: "子群差异与跨期变化", question: "整体 KPI 的变化由哪些人群推动，哪些小样本子群需要提前预警？" },
  { id: "forecast", label: "品牌漏斗与下一期预测", question: "下一期核心 KPI 预计落在哪里，哪些指标需要提前干预？" },
  { id: "drivers", label: "BHT 关键驱动", question: "哪些品牌形象最能推动考虑和偏好，应该先改善什么？" },
  { id: "social", label: "Social 话题、渠道与风险", question: "品牌正在被讨论什么，哪些渠道值得扩大或需要修复？" },
  { id: "leadLag", label: "跨源领先指标模型", question: "哪些 Social 信号能够领先预测下一期 BHT，而不只是同时发生？" },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pct = (value: number) => `${value.toFixed(1)}%`;
const signed = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;

function TrendChart({ adjustment, activeIndex }: { adjustment: MetricAdjustment; activeIndex: number }) {
  const width = 760;
  const height = 245;
  const padding = { left: 42, right: 24, top: 22, bottom: 42 };
  const x = (index: number) => padding.left + index * ((width - padding.left - padding.right) / (bhtSocialPeriods.length - 1));
  const y = (value: number) => padding.top + (100 - value) * ((height - padding.top - padding.bottom) / 50) - 50 * ((height - padding.top - padding.bottom) / 50);
  const line = (key: "health" | "social") => bhtSocialPeriods.map((row, index) => `${x(index)},${y(clamp(row[key] + adjustment[key]))}`).join(" ");

  return (
    <div className="bht-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="品牌健康指数与 Social 热度指数跨期趋势">
        {[50, 60, 70, 80, 90, 100].map((tick) => (
          <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} /><text x="5" y={y(tick) + 4}>{tick}</text></g>
        ))}
        <line className="bht-forecast-divider" x1={x(6.5)} x2={x(6.5)} y1={padding.top} y2={height - padding.bottom} />
        <polyline className="bht-line bht-line-health" points={line("health")} />
        <polyline className="bht-line bht-line-social" points={line("social")} />
        {bhtSocialPeriods.map((row, index) => (
          <g key={row.period}>
            <circle className={index === activeIndex ? "active health" : "health"} cx={x(index)} cy={y(clamp(row.health + adjustment.health))} r={index === activeIndex ? 5 : 3.5} />
            <circle className={index === activeIndex ? "active social" : "social"} cx={x(index)} cy={y(clamp(row.social + adjustment.social))} r={index === activeIndex ? 5 : 3.5} />
            <text className="bht-period-label" x={x(index)} y={height - 14} textAnchor="middle">{row.period.replace("FY", "")}</text>
          </g>
        ))}
      </svg>
      <div className="bht-chart-legend"><span className="health">品牌健康指数</span><span className="social">Social 热度指数</span><span className="forecast">下一期预测</span></div>
    </div>
  );
}

function KpiCard({ label, value, delta, detail, tone = "blue" }: { label: string; value: string; delta: number; detail: string; tone?: "blue" | "teal" | "red" }) {
  return (
    <article className={`bht-kpi-card ${tone}`}>
      <span>{label}</span><strong>{value}</strong>
      <p><b className={delta >= 0 ? "up" : "down"}>{signed(delta)}</b> vs 上一期</p>
      <small>{detail}</small>
    </article>
  );
}

function Overview({ adjustment, activeIndex }: { adjustment: MetricAdjustment; activeIndex: number }) {
  const current = bhtSocialPeriods[activeIndex];
  const previous = bhtSocialPeriods[Math.max(0, activeIndex - 1)];
  const metrics = [
    { label: "品牌健康指数", key: "health" as MetricKey, detail: "认知、考虑、偏好与品牌形象综合" },
    { label: "无提示认知", key: "awareness" as MetricKey, detail: "品牌漏斗顶部" },
    { label: "品牌考虑", key: "consideration" as MetricKey, detail: "购买决策前的核心中段 KPI" },
    { label: "创新形象", key: "innovation" as MetricKey, detail: "与 AI PC Social 话题直接对应" },
  ];

  return (
    <>
      <section className="bht-kpi-grid">
        {metrics.map((item, index) => {
          const value = clamp(current[item.key] + adjustment[item.key]);
          const prior = clamp(previous[item.key] + adjustment[item.key]);
          return <KpiCard key={item.key} label={item.label} value={pct(value)} delta={value - prior} detail={item.detail} tone={index === 3 ? "teal" : "blue"} />;
        })}
      </section>

      <section className="bht-overview-grid">
        <article className="bht-panel bht-trend-panel">
          <header><div><span>跨期走势</span><h2>BHT 与 Social 是否同向变化</h2></div><strong>{current.period}</strong></header>
          <TrendChart adjustment={adjustment} activeIndex={activeIndex} />
        </article>
        <article className="bht-panel bht-decision-panel">
          <span>本期判断</span>
          <h2>品牌创新形象正在改善，但从高认知向偏好的转化仍是主要缺口。</h2>
          <div><b>证据 01</b><p>无提示认知维持高位，品牌考虑与偏好分别为 {pct(clamp(current.consideration + adjustment.consideration))} 和 {pct(clamp(current.preference + adjustment.preference))}。</p></div>
          <div><b>证据 02</b><p>AI PC 相关讨论占 Social 话题 38%，正向情绪 76%；创新形象两期累计提升 3.0pts。</p></div>
          <div><b>优先动作</b><p>把 AI PC 的热度转化为可理解的工作、创作和跨设备体验证明，重点补品牌考虑到偏好的断点。</p></div>
        </article>
      </section>

      <section className="bht-cross-source-grid">
        <article className="bht-panel">
          <header><div><span>品牌漏斗</span><h2>认知高位后的转化效率</h2></div><strong>当前期</strong></header>
          <div className="bht-funnel-bars">
            {brandFunnel.map((row, index) => <div key={row.metric}><span>{row.metric}</span><i><b style={{ width: `${row.current}%` }} /></i><strong>{row.current.toFixed(0)}%</strong>{index > 0 && <small>{Math.round(row.current / brandFunnel[index - 1].current * 100)}% 转化</small>}</div>)}
          </div>
        </article>
        <article className="bht-panel">
          <header><div><span>Social 信号</span><h2>本期可解释的外部变化</h2></div><strong>186.4K mentions</strong></header>
          <div className="bht-signal-list">
            {socialTopics.slice(0, 4).map((row) => <div key={row.topic}><div><strong>{row.topic}</strong><span>话题占比 {row.share}%</span></div><b>{row.sentiment}%</b><em className={row.change >= 0 ? "up" : "down"}>{signed(row.change)}pts</em></div>)}
          </div>
        </article>
        <article className="bht-panel bht-priority-panel">
          <header><div><span>融合优先级</span><h2>下一步先做什么</h2></div></header>
          <ol>
            <li><b>01</b><div><strong>扩大 AI PC 的正向内容势能</strong><p>高热度、高情绪、与“创新的”品牌形象同向。</p></div></li>
            <li><b>02</b><div><strong>修复服务与使用体验讨论</strong><p>情绪仅 54%，同时“卓越用户体验”形象停滞。</p></div></li>
            <li><b>03</b><div><strong>跟踪 Social 到品牌偏好的滞后转化</strong><p>按周监测 Social，以下一期 BHT 验证是否真正进入品牌漏斗。</p></div></li>
          </ol>
        </article>
      </section>
    </>
  );
}

function SubgroupsView({ segment }: { segment: SegmentKey }) {
  const groups = subgroupOptions[segment];
  const segmentBase = 72.4 + segmentAdjustments[segment].health;
  const sampleBases = segment === "consumer" ? [2000, 618, 704, 526, 438] : segment === "smb" ? [1200, 382, 494, 356, 274] : [600, 228, 372, 248, 196];
  const rows = groups.map((group, index) => {
    const current = clamp(segmentBase + group.health);
    const change = group.momentum - .4;
    const forecast = clamp(current + group.momentum);
    const uncertainty = index === 0 ? 1.4 : Math.round((1.7 + 13 / Math.sqrt(sampleBases[index])) * 10) / 10;
    return { ...group, current, change, forecast, low: clamp(forecast - uncertainty), high: clamp(forecast + uncertainty), n: sampleBases[index] };
  });
  const leader = rows.reduce((best, row) => row.current > best.current ? row : best, rows[0]);
  const risk = rows.slice(1).reduce((worst, row) => row.current < worst.current ? row : worst, rows[1]);

  return (
    <>
      <section className="bht-view-head"><div><span>Hierarchical subgroup model</span><h2>子群差异、变化来源与下一期预测</h2><p>模型同时估计整体、客群和子群；小样本子群向上层总体适度收缩，避免把随机波动误判为真实变化。</p></div></section>
      <section className="bht-subgroup-summary">
        <article><span>本期最高品牌健康</span><strong>{leader.label}</strong><b>{pct(leader.current)}</b><p>主要驱动：{leader.driver}</p></article>
        <article><span>优先预警子群</span><strong>{risk.label}</strong><b>{pct(risk.current)}</b><p>与整体差异 {signed(risk.current - rows[0].current)}pts</p></article>
        <article><span>下一期总体预测</span><strong>{pct(rows[0].forecast)}</strong><b>{pct(rows[0].low)}–{pct(rows[0].high)}</b><p>分层动态模型预测区间</p></article>
      </section>
      <section className="bht-panel bht-subgroup-panel">
        <header><div><span>当前期 → 下一期</span><h2>{segmentAdjustments[segment].label}子群表现</h2></div><strong>样本基数影响区间宽度</strong></header>
        <div className="bht-subgroup-table">
          <div className="head"><span>子群</span><span>样本</span><span>本期品牌健康</span><span>环比</span><span>下一期预测</span><span>预测区间</span><span>主要驱动</span></div>
          {rows.map((row, index) => <div key={row.id} className={index === 0 ? "total" : ""}><strong>{row.label}</strong><span>N={row.n.toLocaleString()}</span><b>{pct(row.current)}</b><em className={row.change >= 0 ? "up" : "down"}>{signed(row.change)}pts</em><b>{pct(row.forecast)}</b><span>{pct(row.low)}–{pct(row.high)}</span><p>{row.driver}</p></div>)}
        </div>
      </section>
      <section className="bht-subgroup-method">
        <article><b>01</b><h3>分层贝叶斯部分汇聚</h3><p>整体、消费/SMB/政企与下层人群共享信息，使 N 较小的子群预测更稳定，同时保留真正的异质性。</p></article>
        <article><b>02</b><h3>期次 × 子群交互</h3><p>不只比较静态高低，而是识别哪个子群在某一期发生拐点、持续改善或领先下滑。</p></article>
        <article><b>03</b><h3>时间留出验证</h3><p>只用过去期次预测未来期次，分别报告整体与子群 MAE、校准和区间覆盖率。</p></article>
        <article><b>04</b><h3>可解释差异分解</h3><p>把 KPI 变化分为样本结构、品牌形象、产品体验、Social 信号和外部事件贡献。</p></article>
      </section>
    </>
  );
}

function ForecastView({ adjustment }: { adjustment: MetricAdjustment }) {
  const [metric, setMetric] = useState<"consideration" | "preference">("consideration");
  const [positiveShift, setPositiveShift] = useState(0);
  const scenarioLift = positiveShift * (metric === "consideration" ? 0.09 : 0.05);
  const target = metric === "consideration" ? brandFunnel[2] : brandFunnel[3];
  const adjustedForecast = clamp(target.forecast + adjustment[metric] + scenarioLift);

  return (
    <>
      <section className="bht-view-head"><div><span>动态预测</span><h2>下一期品牌漏斗预测与干预空间</h2><p>趋势项、期次、品牌形象和 Social 领先信号共同进入预测；真实上线时采用滚动时间窗回测。</p></div><label><span>情景目标</span><select value={metric} onChange={(event) => setMetric(event.target.value as typeof metric)}><option value="consideration">品牌考虑</option><option value="preference">品牌偏好</option></select></label></section>
      <section className="bht-forecast-grid">
        {brandFunnel.map((row) => <article key={row.metric}><span>{row.metric}</span><strong>{pct(row.forecast)}</strong><p>{pct(row.low)}–{pct(row.high)}</p><small>当前 {pct(row.current)} · {signed(row.forecast - row.current)}pts</small></article>)}
      </section>
      <section className="bht-scenario-grid">
        <article className="bht-panel bht-scenario-control">
          <span>Social 情景输入</span><h2>如果正向讨论提高，会怎样影响下一期 BHT？</h2>
          <label><div><strong>正向情绪变化</strong><b>{signed(positiveShift)}pts</b></div><input type="range" min="-10" max="15" step="1" value={positiveShift} onChange={(event) => setPositiveShift(Number(event.target.value))} /></label>
          <p>情景使用演示数据中的跨期系数；真实数据接入后由周度 Social 与季度 BHT 的滚动回测重新估计。</p>
        </article>
        <article className="bht-panel bht-scenario-result">
          <span>下一期情景结果</span><strong>{pct(adjustedForecast)}</strong><h2>{metric === "consideration" ? "品牌考虑" : "品牌偏好"}</h2>
          <div><p>自然趋势预测</p><b>{pct(clamp(target.forecast + adjustment[metric]))}</b></div>
          <div><p>Social 情景增量</p><b>{signed(scenarioLift)}pts</b></div>
          <div><p>预测区间</p><b>{pct(clamp(target.low + scenarioLift))}–{pct(clamp(target.high + scenarioLift))}</b></div>
        </article>
        <article className="bht-panel bht-model-checks">
          <span>模型验收</span><h2>不是只给一条预测线</h2>
          <div><b>2.6pts</b><p>演示滚动回测 MAE</p></div><div><b>84%</b><p>演示区间覆盖率</p></div><div><b>每季度</b><p>BHT 更新与模型重训</p></div><div><b>每周</b><p>Social 信号更新</p></div>
        </article>
      </section>
    </>
  );
}

function DriversView() {
  return (
    <>
      <section className="bht-view-head"><div><span>Importance × Performance</span><h2>品牌考虑与偏好的关键驱动</h2><p>重要性来自受访者级模型，表现来自本期品牌形象题；Social 话题用于解释变化和定位可执行内容。</p></div></section>
      <section className="bht-driver-layout">
        <article className="bht-panel bht-driver-matrix">
          <header><div><span>资源配置</span><h2>先改善高影响、低表现的形象</h2></div></header>
          <div className="bht-matrix-axis"><span>表现低</span><span>表现高</span></div>
          <div className="bht-matrix-canvas">
            <i className="vertical" /><i className="horizontal" />
            {bhtDrivers.map((row) => <button key={row.driver} style={{ left: `${Math.max(8, Math.min(90, row.performance))}%`, bottom: `${Math.max(9, Math.min(88, row.importance * .82))}%` }} title={`${row.driver}: 重要性 ${row.importance}, 表现 ${row.performance}%`}><span>{row.driver}</span></button>)}
          </div>
          <div className="bht-matrix-foot"><span>重要性低</span><span>重要性高</span></div>
        </article>
        <article className="bht-panel bht-driver-table-panel">
          <header><div><span>驱动诊断</span><h2>BHT 与 Social 的对应证据</h2></div></header>
          <div className="bht-driver-table">
            {bhtDrivers.map((row) => <div key={row.driver}><div><strong>{row.driver}</strong><span>{row.link}</span></div><b>{row.performance}%</b><em>{signed(row.change)}pts</em><small>{row.priority}</small></div>)}
          </div>
        </article>
      </section>
      <section className="bht-insight-cards">
        <article><b>01</b><h3>“创新的”已经进入增长区</h3><p>重要性最高，表现提升 2pts，Social 中 AI PC 话题同时增长 8.6pts；继续放大，但必须验证能否推动品牌偏好。</p></article>
        <article><b>02</b><h3>“卓越用户体验”需要修复</h3><p>驱动重要性较高但本期没有改善；Social 服务与体验情绪仅 54%，两类证据方向一致。</p></article>
        <article><b>03</b><h3>“生态的”需要从概念进入场景</h3><p>当前表现仅 25%，不应只增加声量；应围绕跨设备、工作和创作任务建立可识别的利益点。</p></article>
      </section>
    </>
  );
}

function SocialView() {
  return (
    <>
      <section className="bht-view-head"><div><span>Social Intelligence</span><h2>话题、情绪、渠道与竞争声量</h2><p>Social 不替代问卷；它用于提高更新频率、解释 BHT 变化，并提前发现下一期需要验证的信号。</p></div></section>
      <section className="bht-social-grid">
        <article className="bht-panel">
          <header><div><span>话题结构</span><h2>讨论增长来自哪里</h2></div><strong>正向情绪 68.4%</strong></header>
          <div className="bht-topic-bars">{socialTopics.map((row) => <div key={row.topic}><span>{row.topic}</span><i><b style={{ width: `${row.share * 2.25}%` }} /></i><strong>{row.share}%</strong><em>{row.sentiment}% 正向</em></div>)}</div>
        </article>
        <article className="bht-panel">
          <header><div><span>Share of Voice</span><h2>主要品牌讨论份额</h2></div></header>
          <div className="bht-sov-list">{brandShareOfVoice.map((row, index) => <div key={row.brand}><b>{index + 1}</b><span>{row.brand}</span><i><em style={{ width: `${row.value * 2.7}%` }} /></i><strong>{row.value}%</strong></div>)}</div>
        </article>
      </section>
      <section className="bht-panel bht-channel-panel">
        <header><div><span>渠道诊断</span><h2>在哪里扩大，在哪里修复</h2></div></header>
        <div className="bht-channel-table"><div className="head"><span>渠道</span><span>声量占比</span><span>正向情绪</span><span>声量变化</span><span>决策</span></div>{socialChannels.map((row) => <div key={row.channel}><strong>{row.channel}</strong><span>{row.share}%</span><span>{row.sentiment}%</span><em className={row.velocity >= 0 ? "up" : "down"}>{signed(row.velocity)}%</em><p>{row.decision}</p></div>)}</div>
      </section>
    </>
  );
}

function LeadLagView() {
  const [shift, setShift] = useState(10);
  const innovationLift = shift * .18;
  const considerationLift = shift * .09;
  return (
    <>
      <section className="bht-view-head"><div><span>Cross-source model</span><h2>把 Social 变成下一期 BHT 的领先信号</h2><p>模型比较 0–12 周滞后关系，控制长期趋势、重大市场事件和季节性；只有在未来期回测中稳定的信号才进入预测。</p></div></section>
      <section className="bht-leadlag-grid">
        <article className="bht-panel bht-leadlag-flow">
          <header><div><span>领先关系</span><h2>周度 Social → 季度 BHT</h2></div></header>
          <div><article><b>W-12 至 W-5</b><strong>AI PC 正向讨论</strong><p>话题占比 · 情绪 · 互动质量</p></article><i>→</i><article><b>W-4 至 W-1</b><strong>搜索与内容扩散</strong><p>渠道速度 · 竞品 SOV · 风险事件</p></article><i>→</i><article><b>下一季度</b><strong>BHT 结果</strong><p>创新形象 · 品牌考虑 · 品牌偏好</p></article></div>
        </article>
        <article className="bht-panel bht-leadlag-result">
          <span>稳定领先信号</span><h2>AI PC 正向讨论</h2><strong>8 周</strong><p>对“创新的”品牌形象的最佳领先窗口</p>
          <div><b>+10pts</b><span>正向讨论变化</span><i>→</i><b>+1.8pts</b><span>下一期创新形象</span></div>
          <div><b>+10pts</b><span>正向讨论变化</span><i>→</i><b>+0.9pts</b><span>下一期品牌考虑</span></div>
        </article>
      </section>
      <section className="bht-leadlag-bottom">
        <article className="bht-panel bht-leadlag-simulator"><span>信号情景</span><h2>调整正向讨论变化</h2><label><div><strong>{signed(shift)}pts</strong><p>AI PC 正向讨论</p></div><input type="range" min="-10" max="20" value={shift} onChange={(event) => setShift(Number(event.target.value))} /></label><div><p>创新形象</p><strong>{signed(innovationLift)}pts</strong></div><div><p>品牌考虑</p><strong>{signed(considerationLift)}pts</strong></div></article>
        <article className="bht-panel bht-validation-card"><span>演示回测</span><h2>领先关系必须经过样本外检验</h2><div><strong>0.72</strong><p>滚动验证 R²</p></div><div><strong>2.6pts</strong><p>下一期 KPI MAE</p></div><div><strong>4 / 6</strong><p>稳定领先 Social 特征</p></div><div><strong>8 周</strong><p>最佳领先窗口</p></div></article>
        <article className="bht-panel bht-guardrail-card"><span>使用边界</span><h2>领先相关不等于广告增量</h2><p>该模型用于预警和预测；如果要判断“投放是否造成 BHT 提升”，还需要曝光、Holdout 或准实验设计，再使用 Uplift / CATE 或因果时间序列。</p></article>
      </section>
    </>
  );
}

export default function LenovoBhtSocialDashboard() {
  const [view, setView] = useState<DashboardView>("overview");
  const [segment, setSegment] = useState<SegmentKey>("consumer");
  const [subgroupId, setSubgroupId] = useState("all");
  const [periodIndex, setPeriodIndex] = useState(6);
  const selectedModel = useMemo(() => modelOptions.find((item) => item.id === view) ?? modelOptions[0], [view]);
  const segmentGroups = subgroupOptions[segment] as readonly SubgroupOption[];
  const activeSubgroup = segmentGroups.find((item) => item.id === subgroupId) ?? segmentGroups[0];
  const adjustment = useMemo<MetricAdjustment>(() => ({
    health: segmentAdjustments[segment].health + activeSubgroup.health,
    awareness: segmentAdjustments[segment].awareness + activeSubgroup.awareness,
    consideration: segmentAdjustments[segment].consideration + activeSubgroup.consideration,
    preference: segmentAdjustments[segment].preference + activeSubgroup.preference,
    innovation: segmentAdjustments[segment].innovation + activeSubgroup.innovation,
    social: segmentAdjustments[segment].social + activeSubgroup.social,
  }), [segment, activeSubgroup]);

  return (
    <main className="client-portal bht-dashboard">
      <header className="client-header">
        <div className="client-brandline"><PlatformBrand compact /><span className="brand-divider" /><img className="client-logo lenovo-logo" src="/lenovo-logo.svg" alt="Lenovo" /><div><strong>BHT + Social Dashboard</strong></div></div>
        <div className="client-header-actions"><Link href="/clients/lenovo">返回联想项目</Link></div>
      </header>

      <section className="bht-dashboard-content">
        <header className="bht-dashboard-hero">
          <div><p>Brand Health Tracking × Social Intelligence</p><h1>联想 BHT + Social Dashboard</h1><span>品牌健康、关键驱动、Social 话题与下一期预测</span></div>
          <div className="bht-data-status"><b>DEMO DATA</b><span>结构与交互可直接替换真实数据</span></div>
        </header>

        <section className="bht-filter-bar">
          <label className="model"><span>分析模块</span><select value={view} onChange={(event) => setView(event.target.value as DashboardView)}>{modelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><span>客群</span><select value={segment} onChange={(event) => { setSegment(event.target.value as SegmentKey); setSubgroupId("all"); }}>{Object.entries(segmentAdjustments).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
          <label><span>子群</span><select value={subgroupId} onChange={(event) => setSubgroupId(event.target.value)}>{segmentGroups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label><span>期次</span><select value={periodIndex} onChange={(event) => setPeriodIndex(Number(event.target.value))}>{bhtSocialPeriods.slice(0, -1).map((row, index) => <option key={row.period} value={index}>{row.period}</option>)}</select></label>
          <div><span>市场</span><strong>中国</strong></div><div><span>品牌</span><strong>Lenovo</strong></div>
        </section>

        <section className="bht-question-bar"><span>当前决策问题</span><strong>{selectedModel.question}</strong></section>

        {view === "overview" && <Overview adjustment={adjustment} activeIndex={periodIndex} />}
        {view === "subgroups" && <SubgroupsView segment={segment} />}
        {view === "forecast" && <ForecastView adjustment={adjustment} />}
        {view === "drivers" && <DriversView />}
        {view === "social" && <SocialView />}
        {view === "leadLag" && <LeadLagView />}

        <section className="bht-model-registry">
          <header><div><span>数据联动</span><h2>BHT + Social 的模型生产链路</h2></div></header>
          <div className="bht-data-lineage"><article><b>01</b><strong>BHT 问卷与 Raw Data</strong><p>品牌漏斗、品牌形象、客群、产品线与期次</p></article><i>→</i><article><b>02</b><strong>Social 数据</strong><p>帖子、评论、互动、渠道、话题、情绪与事件</p></article><i>→</i><article><b>03</b><strong>统一指标层</strong><p>Brand × Segment × Period × KPI × Signal</p></article><i>→</i><article><b>04</b><strong>模型与结果回流</strong><p>预测、驱动、预警、情景与下一期实际值</p></article></div>
          <div className="bht-model-list">{modelRegistry.map((model) => <article key={model.name}><h3>{model.name}</h3><p><span>目标</span>{model.target}</p><p><span>输入</span>{model.input}</p><p><span>验证</span>{model.validation}</p></article>)}</div>
        </section>

        <p className="bht-source-note">{demoSourceNote}</p>
      </section>
    </main>
  );
}
