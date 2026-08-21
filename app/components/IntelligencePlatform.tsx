"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import {
  adoptionDrivers,
  annualForecast,
  audienceUplift,
  campaignFunnel,
  campaignWeekly,
  creativeDiagnostics,
  dataAssets,
  evidenceLedger,
  featureValues,
  marketTrend,
  mediaPerformance,
  modelRegistry,
  officialCampaignFacts,
  researchProjects,
  segmentPoints,
  segments,
} from "../data/synthetic";
import {
  choiceProbabilities,
  predictConsumer,
  simulateMarket,
  type ConsumerProfile,
} from "../models/consumerModels";

type ViewId =
  | "campaign"
  | "uplift"
  | "creative"
  | "media"
  | "consumer"
  | "forecast"
  | "choice"
  | "twin"
  | "foundation"
  | "models"
  | "knowledge";

const navGroups: Array<{ label: string; items: Array<{ id: ViewId; label: string; code: string }> }> = [
  {
    label: "CAMPAIGN DECISION",
    items: [
      { id: "campaign", label: "Executive Command", code: "EC" },
      { id: "uplift", label: "Audience Uplift", code: "AU" },
      { id: "creative", label: "Creative Diagnosis", code: "CD" },
      { id: "media", label: "Media Optimization", code: "MO" },
    ],
  },
  {
    label: "AIPC CONSUMER MODEL",
    items: [
      { id: "consumer", label: "Adoption Intelligence", code: "AI" },
      { id: "forecast", label: "Bayesian Forecast", code: "BF" },
      { id: "choice", label: "Brand Choice", code: "BC" },
      { id: "twin", label: "Consumer Digital Twin", code: "DT" },
    ],
  },
  {
    label: "MODEL FACTORY",
    items: [
      { id: "foundation", label: "Data Foundation", code: "DF" },
      { id: "models", label: "Model Registry", code: "MR" },
      { id: "knowledge", label: "Research Knowledge", code: "RK" },
    ],
  },
];

const segmentColors: Record<string, string> = {
  Productivity: "#2468c9",
  Practical: "#5b7fa8",
  Skeptics: "#8c96a3",
  Students: "#b07a25",
  Creators: "#67579b",
};

const compactNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "amber" | "dark" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function PageIntro({
  eyebrow,
  title,
  question,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  question: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <div className="decision-question">Decision question · {question}</div>
        <p>{description}</p>
      </div>
      {children && <div className="page-intro-actions">{children}</div>}
    </header>
  );
}

function MetricCard({
  label,
  value,
  unit,
  delta,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  detail: string;
  tone?: "blue" | "amber" | "ink" | "violet";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-row">
        <strong>{value}</strong>
        {unit && <span>{unit}</span>}
        {delta && <em>{delta}</em>}
      </div>
      <p>{detail}</p>
    </article>
  );
}

function ChartPanel({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel chart-panel ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="chart-area">{children}</div>
    </section>
  );
}

function EvidenceGrade({ grade }: { grade: string }) {
  const tone = grade.includes("Not") ? "grade-gap" : grade.includes("Directional") ? "grade-directional" : "grade-supported";
  return <span className={`evidence-grade ${tone}`}>{grade}</span>;
}

function CampaignExecutive() {
  return (
    <>
      <PageIntro
        eyebrow="LENOVO × FIFA WORLD CUP 2026"
        title="Campaign Effect Command Center"
        question="Did the campaign create incremental AIPC demand—and what should Lenovo change next?"
        description="A decision view that separates observed campaign signals, modeled incrementality and unproven commercial outcomes."
      >
        <Badge tone="blue">Synthetic post-test · N=6,240</Badge>
        <Badge>Fieldwork: 10–22 Jul 2026</Badge>
      </PageIntro>

      <section className="campaign-context panel">
        <div className="campaign-mark">MD</div>
        <div className="campaign-context-main">
          <span className="eyebrow">REAL CAMPAIGN CONTEXT</span>
          <h2>Maximum David turns Lenovo’s World Cup role into human-scale AI proof.</h2>
          <p>The demo evaluates whether that proof moves consumers from sponsorship recall to AIPC value understanding and purchase consideration.</p>
        </div>
        <div className="campaign-facts">
          {officialCampaignFacts.slice(0, 3).map((fact) => (
            <div key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <small>{fact.detail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="verdict-grid">
        <article className="verdict-card">
          <div className="verdict-kicker">MODEL VERDICT</div>
          <h2>Invest selectively</h2>
          <p>The campaign builds Lenovo–World Cup association and AIPC consideration. Conversion is limited by weak daily-use clarity, not by attention.</p>
          <div className="verdict-action">
            <span>Next decision</span>
            <strong>Shift 12% of display spend into use-case video + retail proof.</strong>
          </div>
        </article>
        <div className="metrics-grid campaign-metrics">
          <MetricCard label="Incremental consideration" value="+8" unit="pts" delta="95% CI +4.1–11.9" detail="Exposed vs matched control" />
          <MetricCard label="Brand association lift" value="+22" unit="pts" detail="World Cup × Lenovo linkage" tone="ink" />
          <MetricCard label="Purchase-intent lift" value="+4" unit="pts" detail="Positive, but not yet sales proof" tone="amber" />
          <MetricCard label="Growth opportunity" value="82" unit="/100" detail="Young professionals × AI productivity" tone="violet" />
        </div>
      </section>

      <section className="three-column-insight">
        <article className="insight-block">
          <div className="insight-index">01</div>
          <span>WHAT WORKED</span>
          <h3>Football earns attention and brand memory.</h3>
          <p>Attention scores 12 points above the synthetic technology-ad benchmark; Lenovo linkage remains strong after exposure.</p>
        </article>
        <article className="insight-block">
          <div className="insight-index">02</div>
          <span>WHERE IT BREAKS</span>
          <h3>AI feels impressive, but not yet personally useful.</h3>
          <p>The largest funnel loss is between AI PC linkage and daily-use clarity. Viewers need a repeatable “save time at work” proof.</p>
        </article>
        <article className="insight-block action-block">
          <div className="insight-index">03</div>
          <span>WHAT TO DO NEXT</span>
          <h3>Turn sponsorship reach into product evidence.</h3>
          <p>Retarget high-uplift audiences with 15-second workflow demos, then close with a RMB 6,999 retail anchor.</p>
        </article>
      </section>

      <section className="two-column">
        <ChartPanel title="AI PC consideration over campaign weeks" subtitle="Percent considering an AI PC · exposed vs matched control · synthetic tracking panel">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={campaignWeekly} margin={{ top: 10, right: 18, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#e8ebef" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={{ stroke: "#cdd3da" }} tick={{ fontSize: 11 }} />
              <YAxis domain={[25, 52]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend verticalAlign="top" align="right" height={28} />
              <ReferenceLine x="W1" stroke="#b07a25" strokeDasharray="4 4" label={{ value: "Launch", position: "insideTopLeft", fill: "#805a20", fontSize: 11 }} />
              <Line type="monotone" dataKey="exposed" name="Campaign exposed" stroke="#2468c9" strokeWidth={3} dot={{ r: 3, fill: "#2468c9" }} />
              <Line type="monotone" dataKey="control" name="Matched control" stroke="#7d8794" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <section className="panel funnel-panel">
          <div className="panel-head">
            <div>
              <h2>Incremental effect ladder</h2>
              <p>Percent of eligible consumers · synthetic post-test</p>
            </div>
            <Badge tone="dark">Uplift model v0.8</Badge>
          </div>
          <div className="funnel-list">
            {campaignFunnel.map((item) => (
              <div className="funnel-row" key={item.metric}>
                <div className="funnel-label">
                  <span>{item.metric}</span>
                  <small>{item.confidence}</small>
                </div>
                <div className="funnel-bars">
                  <div className="bar-control" style={{ width: `${item.control}%` }} />
                  <div className="bar-exposed" style={{ width: `${item.exposed}%` }} />
                </div>
                <strong>+{item.lift}</strong>
              </div>
            ))}
          </div>
          <div className="mini-legend"><span className="legend-control" /> Control <span className="legend-exposed" /> Exposed <b>right = incremental lift</b></div>
        </section>
      </section>

      <section className="panel evidence-preview">
        <div className="panel-head">
          <div>
            <h2>Can leadership trust the conclusion?</h2>
            <p>Every claim is graded by evidence, method and uncertainty—not by how convincing it sounds.</p>
          </div>
          <button className="text-button" type="button">Open full evidence ledger →</button>
        </div>
        <div className="evidence-grid">
          {evidenceLedger.slice(0, 3).map((item) => (
            <article key={item.claim}>
              <EvidenceGrade grade={item.grade} />
              <h3>{item.claim}</h3>
              <p>{item.evidence}</p>
              <small>{item.method} · {item.uncertainty}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AudienceUpliftPage() {
  return (
    <>
      <PageIntro eyebrow="CAMPAIGN MODEL / HETEROGENEOUS EFFECTS" title="Audience Uplift Intelligence" question="Which consumers changed because of the campaign—not merely saw it?" description="Conditional average treatment effects estimate the incremental consideration lift for comparable exposed and control consumers." />
      <section className="metrics-grid four">
        <MetricCard label="Best scalable audience" value="Young professionals" detail="+10.6 pts uplift · 81% reach" />
        <MetricCard label="Highest response" value="+12.8" unit="pts" detail="AI productivity users" tone="ink" />
        <MetricCard label="Low-response pool" value="18%" detail="Technology skeptics" tone="amber" />
        <MetricCard label="Model stability" value="4/5" unit="folds" detail="Positive uplift reproduced" tone="violet" />
      </section>
      <section className="two-column wide-left">
        <ChartPanel title="Incremental AI PC consideration by audience" subtitle="Percentage-point uplift · bars show model estimate; sample and interval shown in table">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={audienceUplift} layout="vertical" margin={{ top: 8, right: 22, bottom: 8, left: 26 }}>
              <CartesianGrid stroke="#e8ebef" horizontal={false} />
              <XAxis type="number" domain={[0, 15]} unit=" pts" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="audience" width={142} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="lift" name="Incremental lift" fill="#2468c9" radius={[0, 3, 3, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="panel decision-card">
          <span className="eyebrow">AUDIENCE DECISION</span>
          <h2>Prioritize scale × responsiveness, not uplift alone.</h2>
          <p>AI productivity users respond most, but young professionals combine nearly the same lift with broader campaign reach.</p>
          <div className="decision-rule">
            <span>Priority score</span>
            <strong>Uplift × reachable population × product fit</strong>
          </div>
          <ol>
            <li><b>Young professionals</b><span>Scale use-case video</span></li>
            <li><b>AI productivity users</b><span>Lead with workflow proof</span></li>
            <li><b>Football-first fans</b><span>Retarget with product bridge</span></li>
          </ol>
        </section>
      </section>
      <section className="panel table-panel">
        <div className="panel-head"><div><h2>Uplift evidence by segment</h2><p>All intervals are synthetic 95% credible intervals; negative lower bounds indicate an unresolved effect.</p></div></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Audience</th><th>Estimated lift</th><th>95% interval</th><th>Sample</th><th>Campaign reach</th><th>Decision status</th></tr></thead><tbody>{audienceUplift.map((row) => <tr key={row.audience}><td><strong>{row.audience}</strong></td><td className="numeric">+{row.lift.toFixed(1)} pts</td><td className="numeric">{row.low.toFixed(1)} to {row.high.toFixed(1)}</td><td className="numeric">{row.n}</td><td className="numeric">{row.reach}%</td><td><Badge tone={row.low > 0 ? "blue" : "amber"}>{row.low > 0 ? "Act" : "Learn"}</Badge></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}

function CreativeDiagnosisPage() {
  const mediation = [
    { label: "Attention", value: 84 },
    { label: "Lenovo linkage", value: 76 },
    { label: "AI PC linkage", value: 61 },
    { label: "Daily-use clarity", value: 54 },
    { label: "Consideration", value: 48 },
    { label: "Purchase intent", value: 31 },
  ];
  return (
    <>
      <PageIntro eyebrow="CAMPAIGN MODEL / CREATIVE PATH" title="Creative Diagnosis" question="Which part of the idea creates demand, and where does persuasion break?" description="A message-path model connects attention, brand linkage, AI value comprehension and action—so the next edit is specific." />
      <section className="creative-summary">
        <article className="panel creative-verdict"><Badge tone="amber">Primary bottleneck</Badge><h2>The campaign proves Lenovo can power the moment. It does not yet prove how an AI PC improves my day.</h2><p>Sports stature is doing the emotional work; product utility needs to do more of the conversion work.</p></article>
        <MetricCard label="Strongest asset" value="84" unit="/100" detail="Attention stopping power" />
        <MetricCard label="Largest gap" value="−12" unit="pts" detail="Daily-use clarity vs benchmark" tone="amber" />
      </section>
      <section className="panel pathway-panel">
        <div className="panel-head"><div><h2>Creative persuasion pathway</h2><p>Percent retaining the intended message at each stage · synthetic exposed audience</p></div></div>
        <div className="pathway">
          {mediation.map((node, index) => (
            <div className="pathway-wrap" key={node.label}>
              <div className={`pathway-node ${node.label === "Daily-use clarity" ? "pathway-alert" : ""}`}><strong>{node.value}%</strong><span>{node.label}</span></div>
              {index < mediation.length - 1 && <div className="pathway-arrow"><span>→</span><small>−{node.value - mediation[index + 1].value}</small></div>}
            </div>
          ))}
        </div>
      </section>
      <section className="two-column">
        <ChartPanel title="Creative signal vs technology-ad benchmark" subtitle="Index score · synthetic campaign diagnostic">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={creativeDiagnostics} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 18 }}>
              <CartesianGrid stroke="#e8ebef" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="signal" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" height={28} />
              <Bar dataKey="score" name="Maximum David" fill="#2468c9" radius={[0, 2, 2, 0]} barSize={10} />
              <Bar dataKey="benchmark" name="Benchmark" fill="#c6ccd4" radius={[0, 2, 2, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="panel recommendation-list">
          <div className="panel-head"><div><h2>Next creative iteration</h2><p>Changes ranked by expected effect and implementation effort</p></div></div>
          <article><span>01</span><div><h3>Show one repeatable workflow</h3><p>Open with a concrete “summarize, create, decide” task completed on-device.</p></div><b>High impact</b></article>
          <article><span>02</span><div><h3>Make AIPC the hero earlier</h3><p>Move product and personal AI proof into the first six seconds.</p></div><b>High impact</b></article>
          <article><span>03</span><div><h3>Add a conversion anchor</h3><p>Close with a model, price point and retail action for high-intent viewers.</p></div><b>Medium impact</b></article>
        </section>
      </section>
    </>
  );
}

function MediaOptimizationPage() {
  const [shift, setShift] = useState(12);
  const expectedLift = (6.8 + shift * 0.11).toFixed(1);
  return (
    <>
      <PageIntro eyebrow="CAMPAIGN MODEL / INCREMENTAL MEDIA" title="Media Optimization" question="Where should the next RMB of campaign investment go?" description="Bayesian response curves compare incremental intent, reach and uncertainty—not clicks alone." />
      <section className="scenario-banner panel">
        <div><span className="eyebrow">RECOMMENDED REALLOCATION</span><h2>Move {shift}% from display into online video and retail proof.</h2><p>Expected incremental consideration increases from 6.8 to {expectedLift} points with the same total media allocation.</p></div>
        <label className="range-control"><span>Allocation shift</span><strong>{shift}%</strong><input type="range" min="0" max="24" value={shift} onChange={(event) => setShift(Number(event.target.value))} /></label>
      </section>
      <section className="two-column">
        <ChartPanel title="Channel reach vs incremental intent" subtitle="Each point is a media channel · same campaign window · synthetic modeled effect">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 14, left: 0 }}>
              <CartesianGrid stroke="#e8ebef" />
              <XAxis type="number" dataKey="reach" name="Reach" unit="%" domain={[20, 75]} tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="incrementalIntent" name="Intent lift" unit=" pts" domain={[0, 14]} tick={{ fontSize: 11 }} />
              <ZAxis type="number" dataKey="spend" range={[90, 420]} name="Spend share" unit="%" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={mediaPerformance} name="Channel" fill="#2468c9" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="panel allocation-card">
          <div className="panel-head"><div><h2>Decision rules</h2><p>What the optimizer is allowed to prioritize</p></div></div>
          <div className="rule-stack"><div><span>Primary objective</span><strong>Incremental AI PC consideration</strong></div><div><span>Guardrail</span><strong>Maintain ≥75% target reach</strong></div><div><span>Constraint</span><strong>Retail proof ≥15% of spend</strong></div><div><span>Uncertainty penalty</span><strong>20% applied to weak estimates</strong></div></div>
          <div className="expected-result"><span>Expected optimized lift</span><strong>+{expectedLift} pts</strong><small>Synthetic 80% interval: +5.9 to +10.1</small></div>
        </section>
      </section>
      <section className="panel table-panel">
        <div className="panel-head"><div><h2>Channel decision table</h2><p>Reach and spend are indexed within this synthetic campaign scenario.</p></div></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Channel</th><th>Spend share</th><th>Reach</th><th>Incremental intent</th><th>Efficiency index</th><th>Action</th></tr></thead><tbody>{mediaPerformance.map((row) => <tr key={row.channel}><td><strong>{row.channel}</strong></td><td className="numeric">{row.spend}%</td><td className="numeric">{row.reach}%</td><td className="numeric">+{row.incrementalIntent} pts</td><td className="numeric">{row.efficiency}</td><td><Badge tone={row.efficiency >= 100 ? "blue" : "amber"}>{row.efficiency >= 110 ? "Scale" : row.efficiency >= 100 ? "Protect" : "Reduce"}</Badge></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}

function ConsumerModelPage() {
  return (
    <>
      <PageIntro eyebrow="TECHNOLOGY INDUSTRY MODEL / AIPC" title="Lenovo Consumer Model" question="Who will adopt an AI PC, what do they value and what blocks conversion?" description="The industry model standardizes adoption, need-state, feature value and purchase drivers so campaigns and product decisions share one consumer truth." />
      <section className="metrics-grid four">
        <MetricCard label="Adoption readiness" value="72" unit="/100" detail="Awareness, value clarity, intent and price acceptance" />
        <MetricCard label="Highest-opportunity segment" value="86" unit="/100" detail="AI Productivity Enthusiasts" tone="ink" />
        <MetricCard label="Top driver" value="32%" detail="AI productivity benefit" tone="violet" />
        <MetricCard label="Primary barrier" value="61%" detail="Understand AI value clearly" tone="amber" />
      </section>
      <section className="two-column">
        <ChartPanel title="Purchase-propensity driver importance" subtitle="Normalized model contribution · synthetic temporal holdout">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adoptionDrivers} layout="vertical" margin={{ top: 6, right: 20, bottom: 6, left: 26 }}>
              <CartesianGrid stroke="#e8ebef" horizontal={false} />
              <XAxis type="number" domain={[0, 35]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="driver" width={144} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="importance" fill="#2468c9" radius={[0, 3, 3, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="panel segment-cards-panel">
          <div className="panel-head"><div><h2>Need-state segments</h2><p>Size, 12-month propensity and commercial opportunity</p></div></div>
          <div className="segment-mini-grid">{segments.map((segment) => <article key={segment.name}><span className="segment-dot" style={{ background: segment.color }} /><div><h3>{segment.name}</h3><p>{segment.traits.slice(0, 2).join(" · ")}</p></div><div className="segment-scores"><b>{segment.size}%</b><small>size</small><b>{segment.probability}%</b><small>buy</small></div></article>)}</div>
        </section>
      </section>
      <section className="two-column wide-left">
        <ChartPanel title="Consumer need-state map" subtitle="AI adoption interest vs price sensitivity · 20 illustrative micro-cohorts · point size = cohort N">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 14, left: 0 }}>
              <CartesianGrid stroke="#e8ebef" />
              <XAxis type="number" dataKey="x" name="AI adoption" domain={[15, 100]} unit="" tick={{ fontSize: 11 }} label={{ value: "AI adoption interest →", position: "insideBottomRight", offset: -8, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Price sensitivity" domain={[15, 100]} tick={{ fontSize: 11 }} label={{ value: "Price sensitivity →", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <ZAxis type="number" dataKey="size" range={[65, 240]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              {Object.keys(segmentColors).map((segment) => <Scatter key={segment} name={segment} data={segmentPoints.filter((point) => point.segment === segment)} fill={segmentColors[segment]} />)}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="panel feature-rank">
          <div className="panel-head"><div><h2>Feature value signals</h2><p>Overall importance and modeled purchase impact</p></div></div>
          {featureValues.map((item, index) => <div className="feature-row" key={item.feature}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.feature}</strong><div className="thin-bar"><i style={{ width: `${item.overall}%` }} /></div></div><b>{item.overall}</b><small>+{item.impact} pts</small></div>)}
        </section>
      </section>
    </>
  );
}

function ForecastPage() {
  return (
    <>
      <PageIntro eyebrow="TECHNOLOGY INDUSTRY MODEL / BAYESIAN FORECAST" title="AI PC Adoption Forecast" question="What is the likely three-year penetration path, and how uncertain is it?" description="A Bayesian diffusion model updates the forecast after every tracking wave instead of treating a point estimate as certainty." />
      <section className="forecast-hero panel">
        <div><span className="eyebrow">BASE CASE · CHINA CONSUMER NOTEBOOK MARKET</span><strong>52%</strong><p>AI PC penetration by 2029 Q4</p></div>
        <div className="forecast-range"><span>90% credible range</span><strong>36% – 68%</strong><p>The range widens because price, replacement cycle and use-case clarity are not fixed.</p></div>
        <div className="forecast-update"><Badge tone="blue">Posterior updated</Badge><strong>18 Jul 2026</strong><p>Tracking wave 14 · N=2,480</p></div>
      </section>
      <ChartPanel title="Observed and forecast AI PC penetration" subtitle="Quarterly share of new notebook purchases · observed through 2026 Q2 · synthetic model">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={marketTrend} margin={{ top: 12, right: 20, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="#e8ebef" vertical={false} />
            <XAxis dataKey="period" interval={1} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#cdd3da" }} />
            <YAxis domain={[0, 75]} unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend verticalAlign="top" align="right" height={30} />
            <ReferenceLine x="26 Q2" stroke="#1f2933" strokeDasharray="3 3" label={{ value: "Latest observed", position: "insideTopLeft", fontSize: 10 }} />
            <Area type="monotone" dataKey="high" name="Upper credible bound" stroke="#aebfd6" fill="#e6edf7" fillOpacity={0.8} dot={false} />
            <Area type="monotone" dataKey="low" name="Lower credible bound" stroke="#ffffff" fill="#ffffff" fillOpacity={1} dot={false} />
            <Line type="monotone" dataKey="adoption" name="Base forecast" stroke="#2468c9" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>
      <section className="forecast-bottom">
        <div className="annual-cards">{annualForecast.map((row) => <article className="panel" key={row.year}><span>{row.year}</span><strong>{row.base}%</strong><small>{row.low}%–{row.high}% credible range</small><b>{row.delta} vs prior year</b></article>)}</div>
        <section className="panel assumption-panel"><div className="panel-head"><div><h2>What changes the forecast?</h2><p>Posterior drivers monitored each month</p></div></div><div className="assumption-list"><div><span>Use-case clarity</span><strong>+6.1 pts upside</strong></div><div><span>Sub-RMB 7k availability</span><strong>+4.8 pts upside</strong></div><div><span>Replacement cycle slowdown</span><strong>−5.4 pts risk</strong></div><div><span>Privacy confidence</span><strong>+2.7 pts upside</strong></div></div></section>
      </section>
    </>
  );
}

function ChoicePage() {
  const [inputs, setInputs] = useState({ priceSensitivity: 58, aiValue: 74, ecosystem: 42, brandTrust: 70 });
  const choices = useMemo(() => choiceProbabilities(inputs), [inputs]);
  const update = (key: keyof typeof inputs, value: number) => setInputs((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageIntro eyebrow="TECHNOLOGY INDUSTRY MODEL / DISCRETE CHOICE" title="Brand Choice Model" question="Why does a consumer choose Lenovo, Dell or Apple—and what changes that choice?" description="A hierarchical multinomial choice model separates brand utility from price, AI value and ecosystem preference." />
      <section className="choice-layout">
        <section className="panel control-panel"><div className="panel-head"><div><h2>Preference scenario</h2><p>Adjust consumer utilities and watch modeled choice share update</p></div></div>{Object.entries(inputs).map(([key, value]) => { const labels: Record<string, string> = { priceSensitivity: "Price sensitivity", aiValue: "AI productivity value", ecosystem: "Ecosystem dependence", brandTrust: "Brand trust" }; return <label className="range-control" key={key}><span>{labels[key]}</span><strong>{value}</strong><input type="range" min="0" max="100" value={value} onChange={(event) => update(key as keyof typeof inputs, Number(event.target.value))} /></label>; })}<div className="model-note"><Badge tone="amber">Synthetic conjoint</Badge><p>Shares are preference probabilities, not observed market share.</p></div></section>
        <ChartPanel title="Predicted brand choice probability" subtitle="Same consumer profile and product context · synthetic hierarchical MNL">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={choices} margin={{ top: 12, right: 16, bottom: 8, left: -4 }}><CartesianGrid stroke="#e8ebef" vertical={false} /><XAxis dataKey="brand" tickLine={false} axisLine={{ stroke: "#cdd3da" }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="probability" name="Choice probability" radius={[4, 4, 0, 0]}>{choices.map((item) => <Cell key={item.brand} fill={item.brand === "Lenovo" ? "#2468c9" : item.brand === "Apple" ? "#6a7480" : "#9aa4af"} />)}</Bar></BarChart></ResponsiveContainer>
        </ChartPanel>
        <section className="panel choice-readout"><span className="eyebrow">MODEL INTERPRETATION</span><h2>{choices[0].probability >= Math.max(...choices.map((choice) => choice.probability)) ? "Lenovo leads this preference scenario." : "Lenovo needs a stronger utility proposition."}</h2><p>AI productivity value increases Lenovo utility most. Ecosystem dependence shifts choice toward Apple; price sensitivity compresses premium options.</p><div className="choice-components"><div><span>Lenovo advantage</span><strong>AI value + trust</strong></div><div><span>Largest threat</span><strong>Ecosystem lock-in</strong></div><div><span>Best intervention</span><strong>Workflow proof + price anchor</strong></div></div></section>
      </section>
    </>
  );
}

function DigitalTwinPage() {
  const [profile, setProfile] = useState<ConsumerProfile>({ age: 31, monthlyIncome: 18000, workFrequency: 82, contentCreation: 48, aiInterest: 78, privacyConcern: 61, priceSensitivity: 55 });
  const prediction = useMemo(() => predictConsumer(profile), [profile]);
  const set = (key: keyof ConsumerProfile, value: number) => setProfile((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageIntro eyebrow="CLIENT ADAPTATION / DIGITAL TWIN" title="Consumer Digital Twin" question="How would this consumer respond to the campaign, product and price?" description="A transparent profile simulator combines AIPC propensity, feature preference and price response. It is an aggregate behavioral twin—not an identifiable person." />
      <section className="twin-layout">
        <section className="panel twin-controls"><div className="panel-head"><div><h2>Consumer profile</h2><p>Adjust inputs to simulate a different need state</p></div></div><div className="field-pair"><label><span>Age</span><input type="number" min="18" max="70" value={profile.age} onChange={(event) => set("age", Number(event.target.value))} /></label><label><span>Monthly income (RMB)</span><input type="number" min="3000" max="80000" step="1000" value={profile.monthlyIncome} onChange={(event) => set("monthlyIncome", Number(event.target.value))} /></label></div>{(["workFrequency", "contentCreation", "aiInterest", "privacyConcern", "priceSensitivity"] as Array<keyof ConsumerProfile>).map((key) => { const labels: Record<string, string> = { workFrequency: "Work intensity", contentCreation: "Content creation", aiInterest: "AI interest", privacyConcern: "Privacy concern", priceSensitivity: "Price sensitivity" }; return <label className="range-control" key={key}><span>{labels[key]}</span><strong>{profile[key]}</strong><input type="range" min="0" max="100" value={profile[key]} onChange={(event) => set(key, Number(event.target.value))} /></label>; })}</section>
        <section className="twin-output">
          <article className="twin-hero panel"><div><span className="eyebrow">PREDICTED PURCHASE</span><strong>{prediction.purchaseProbability}%</strong><small>{prediction.confidence}% model confidence</small></div><div><Badge tone="blue">{prediction.segment}</Badge><h2>Likely to respond to workflow-led AIPC proof.</h2><p>Retarget after campaign exposure with a productivity demo and a price near the consumer’s estimated acceptance ceiling.</p></div></article>
          <div className="twin-metrics"><MetricCard label="Accepted price" value={`¥${compactNumber.format(prediction.acceptedPrice)}`} detail="Estimated upper comfortable point" tone="ink" /><MetricCard label="Campaign response" value={profile.aiInterest >= 65 ? "+9.4" : "+3.1"} unit="pts" detail="Estimated consideration uplift" tone="violet" /></div>
          <section className="panel twin-features"><div className="panel-head"><div><h2>Predicted feature preference</h2><p>Relative fit from the current profile</p></div></div>{prediction.topFeatures.map((feature, index) => <div className="feature-row" key={feature.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{feature.name}</strong><div className="thin-bar"><i style={{ width: `${Math.round(feature.score)}%` }} /></div></div><b>{Math.round(feature.score)}</b></div>)}</section>
        </section>
      </section>
    </>
  );
}

function DataFoundationPage({ wave, onWave }: { wave: number; onWave: () => void }) {
  return (
    <>
      <PageIntro eyebrow="MODEL FACTORY / DATA FOUNDATION" title="From Research Projects to a Learning System" question="Can every insight be traced, validated and improved with real outcomes?" description="The warehouse is the foundation, SQL is the pipeline, models are the engine, and decision products are the cockpit. Commercial outcomes close the loop." >
        <button className="primary-button" type="button" onClick={onWave}>Ingest synthetic wave {wave + 1}</button>
      </PageIntro>
      <section className="architecture-strip panel">
        {[{ code: "01", title: "Business decision", text: "Creative, audience, media mix" }, { code: "02", title: "Data foundation", text: "Survey, media, CRM, sales" }, { code: "03", title: "Models", text: "Causal, choice, Bayesian" }, { code: "04", title: "Decision product", text: "Actions, scenarios, APIs" }, { code: "05", title: "Outcome return", text: "Sales, conversion, share" }].map((item, index) => <div className="architecture-wrap" key={item.title}><article><span>{item.code}</span><h3>{item.title}</h3><p>{item.text}</p></article>{index < 4 && <b>→</b>}</div>)}
      </section>
      <section className="model-hierarchy">
        <article className="hierarchy-level company"><span>1</span><div><small>COMPANY FOUNDATION</small><h2>Unified consumer, brand, product, market and time definitions</h2><p>Governed metrics · client isolation · research knowledge · outcome registry</p></div></article>
        <article className="hierarchy-level industry"><span>N</span><div><small>INDUSTRY MODEL</small><h2>Technology → AI PC consumer model</h2><p>Adoption · needs · choice · pricing · trend · intervention</p></div></article>
        <article className="hierarchy-level client"><span>M</span><div><small>CLIENT ADAPTATION</small><h2>Lenovo → World Cup campaign effectiveness</h2><p>Lenovo research + campaign exposure + media + future sales calibration</p></div></article>
      </section>
      <section className="two-column wide-left">
        <section className="panel table-panel"><div className="panel-head"><div><h2>Data asset readiness</h2><p>What the current demo can use—and what must be connected for mature prediction</p></div><Badge tone="dark">Wave {wave}</Badge></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Source</th><th>Coverage</th><th>Canonical grain</th><th>Rows</th><th>Freshness</th><th>Status</th></tr></thead><tbody>{dataAssets.map((row) => <tr key={row.source}><td><strong>{row.source}</strong></td><td>{row.coverage}</td><td>{row.grain}</td><td className="numeric">{row.rows}</td><td>{row.freshness}</td><td><Badge tone={row.state === "Ready" ? "blue" : "amber"}>{row.state}</Badge></td></tr>)}</tbody></table></div></section>
        <section className="panel warehouse-panel"><div className="panel-head"><div><h2>Warehouse layers</h2><p>Proposed client-isolated architecture</p></div></div><div className="layer-card"><span>BRONZE</span><strong>Immutable source</strong><p>Raw survey · delivery logs · outcome files</p></div><div className="layer-card"><span>SILVER</span><strong>Standardized intelligence</strong><p>Questions · audiences · products · markets · time</p></div><div className="layer-card"><span>GOLD</span><strong>Decision-ready features</strong><p>Exposure cohorts · uplift features · outcome labels</p></div></section>
      </section>
      <section className="panel data-definition"><div><span className="eyebrow">FIRST MATURE MODEL DEFINITION</span><h2>World Cup campaign effect × China × eligible notebook buyers</h2></div><div><span>Prediction object</span><strong>Incremental AI PC consideration and purchase</strong></div><div><span>Training row</span><strong>Anonymous consumer × campaign wave</strong></div><div><span>Truth label still needed</span><strong>Matched SKU sales / conversion outcome</strong></div></section>
    </>
  );
}

function ModelRegistryPage() {
  return (
    <>
      <PageIntro eyebrow="MODEL FACTORY / GOVERNANCE" title="Model Registry & Evidence Ledger" question="Which outputs are decision-ready, how were they validated and when should they not be used?" description="Every model declares its business decision, target, data, validation method, refresh cadence and limitations." />
      <section className="panel table-panel"><div className="panel-head"><div><h2>Registered AIPC models</h2><p>Demo validation statistics are synthetic and illustrate the governance rules.</p></div><Badge tone="blue">5 active models</Badge></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>Family</th><th>Target</th><th>Validation</th><th>Score</th><th>Status</th><th>Refresh</th></tr></thead><tbody>{modelRegistry.map((row) => <tr key={row.name}><td><strong>{row.name}</strong></td><td>{row.family}</td><td>{row.target}</td><td>{row.validation}</td><td className="numeric">{row.score}</td><td><Badge tone={row.status === "Prototype" ? "amber" : "blue"}>{row.status}</Badge></td><td>{row.refresh}</td></tr>)}</tbody></table></div></section>
      <section className="panel evidence-ledger"><div className="panel-head"><div><h2>Campaign claim evidence ledger</h2><p>Claim status prevents a plausible narrative from being mistaken for a proven effect.</p></div></div>{evidenceLedger.map((item) => <article key={item.claim}><EvidenceGrade grade={item.grade} /><div><h3>{item.claim}</h3><p>{item.evidence}</p></div><div><span>{item.method}</span><small>{item.uncertainty}</small></div></article>)}</section>
      <section className="validation-grid"><article className="panel"><span className="eyebrow">REQUIRED FOR CAUSAL LANGUAGE</span><h2>Comparable counterfactual</h2><p>Randomized holdout where possible; otherwise propensity overlap, pre-trend and doubly robust estimation.</p></article><article className="panel"><span className="eyebrow">REQUIRED FOR PREDICTION</span><h2>Out-of-time validation</h2><p>Train on earlier waves and test on a future campaign, market or time period never used in fitting.</p></article><article className="panel"><span className="eyebrow">REQUIRED FOR COMMERCIAL VALUE</span><h2>Outcome return</h2><p>Connect purchase, SKU sales or consideration-to-sale conversion back to the original research predictions.</p></article></section>
    </>
  );
}

function KnowledgePage() {
  const [query, setQuery] = useState("");
  const filtered = researchProjects.filter((project) => `${project.title} ${project.tags.join(" ")} ${project.insight}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageIntro eyebrow="MODEL FACTORY / RESEARCH ASSET" title="Research Knowledge Base" question="What prior evidence can inform this decision without pretending it is current-wave proof?" description="Projects, variables, model outputs and source documents are indexed with market, time, sample and evidence boundaries." />
      <section className="knowledge-search panel"><label><span>Search research evidence</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: purchase barrier, AI perception, price elasticity" /></label><div><Badge tone="dark">{filtered.length} projects</Badge><Badge>Current client scope: Lenovo demo</Badge></div></section>
      <section className="knowledge-grid">{filtered.map((project) => <article className="panel project-card" key={project.id}><div className="project-meta"><span>{project.id}</span><strong>{project.year}</strong></div><h2>{project.title}</h2><p>{project.insight}</p><div className="project-stats"><span><small>MARKET</small><b>{project.market}</b></span><span><small>SAMPLE</small><b>N={compactNumber.format(project.sample)}</b></span></div><div className="tag-list">{project.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div><button type="button" className="text-button">View evidence map →</button></article>)}</section>
      {filtered.length === 0 && <div className="empty-state panel"><h2>No matching research asset</h2><p>Try a broader consumer need, brand, pricing or AI-perception term.</p></div>}
    </>
  );
}

function PlatformPage({ active, wave, onWave }: { active: ViewId; wave: number; onWave: () => void }) {
  if (active === "campaign") return <CampaignExecutive />;
  if (active === "uplift") return <AudienceUpliftPage />;
  if (active === "creative") return <CreativeDiagnosisPage />;
  if (active === "media") return <MediaOptimizationPage />;
  if (active === "consumer") return <ConsumerModelPage />;
  if (active === "forecast") return <ForecastPage />;
  if (active === "choice") return <ChoicePage />;
  if (active === "twin") return <DigitalTwinPage />;
  if (active === "foundation") return <DataFoundationPage wave={wave} onWave={onWave} />;
  if (active === "models") return <ModelRegistryPage />;
  return <KnowledgePage />;
}

export default function IntelligencePlatform() {
  const [active, setActive] = useState<ViewId>("campaign");
  const [market, setMarket] = useState("China");
  const [wave, setWave] = useState(14);
  const [lastRefresh, setLastRefresh] = useState("18 Jul 2026 · 09:40");
  const [mobileNav, setMobileNav] = useState(false);

  const navigate = (id: ViewId) => {
    setActive(id);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = () => {
    const now = new Date();
    setLastRefresh(`${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
  };

  const ingestWave = () => {
    setWave((value) => value + 1);
    refresh();
  };

  return (
    <div className="platform-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup"><div className="brand-symbol"><span>L</span></div><div><strong>Consumer Intelligence</strong><small>Technology / AIPC</small></div></div>
        <div className="client-scope"><span>CLIENT MODEL</span><strong>Lenovo</strong><small>World Cup campaign scenario</small></div>
        <nav aria-label="Platform navigation">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map((item) => <button type="button" className={active === item.id ? "nav-active" : ""} onClick={() => navigate(item.id)} key={item.id}><span>{item.code}</span>{item.label}</button>)}</div>)}
        </nav>
        <div className="sidebar-status"><div><i /><span>Synthetic data stream</span></div><small>Client-isolated prototype</small></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button type="button" className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNav((value) => !value)}>☰</button>
          <div className="topbar-title"><strong>AI PC Consumer Intelligence Platform</strong><span>Predict · explain · decide · learn</span></div>
          <div className="global-filters">
            <label><span>MARKET</span><select value={market} onChange={(event) => setMarket(event.target.value)}><option>China</option><option>United States</option><option>Germany</option></select></label>
            <label><span>AUDIENCE</span><select defaultValue="Eligible notebook buyers"><option>Eligible notebook buyers</option><option>Young professionals</option><option>AI productivity users</option></select></label>
            <label><span>PERIOD</span><select defaultValue="Campaign post"><option>Campaign post</option><option>Campaign live</option><option>Pre-campaign</option></select></label>
          </div>
          <div className="refresh-state"><span>LAST REFRESH</span><strong>{lastRefresh}</strong></div>
          <button type="button" className="sync-button" onClick={refresh}>↻ Sync</button>
        </header>
        <div className="demo-ribbon"><strong>SYNTHETIC DEMONSTRATION</strong><span>Campaign context is real; all performance, model scores and recommendations are simulated until Lenovo research, media and outcome data are connected.</span><b>{market}</b></div>
        <main className="workspace"><PlatformPage active={active} wave={wave} onWave={ingestWave} /></main>
        <footer><span>Lenovo Consumer Model · Technology / AIPC</span><span>Data → Models → Decisions → Outcomes</span><span>v0.8 prototype</span></footer>
      </div>
    </div>
  );
}
