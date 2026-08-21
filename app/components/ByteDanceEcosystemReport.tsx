import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { publicAssetPath } from "../lib/publicRuntime";
import forecastJson from "../../output/tt-ecosystem-satisfaction-w5/w6-question-kpi-forecast.json";

type Metric = {
  metric_id: string;
  question: string;
  label: string;
  direction: "positive" | "negative";
  history: { W3: number; W4: number; W5: number };
  w6_prediction: number;
  prediction_low: number;
  prediction_high: number;
  projected_change_pp: number;
};

const metrics = (forecastJson as { metrics: Metric[] }).metrics;

const marketResults = [
  { market: "美国", code: "US", value: 76, low: 73, high: 79, finding: "总体恢复，但内容质量与推荐调整仍需验证" },
  { market: "英国", code: "UK", value: 78, low: 75, high: 81, finding: "时间价值表现较强，维持内容投入感" },
  { market: "日本", code: "JP", value: 64, low: 61, high: 67, finding: "总体预测最低，评论区氛围是突出短板" },
  { market: "印度尼西亚", code: "ID", value: 79, low: 76, high: 82, finding: "推荐调整与内容多样性优势明显" },
  { market: "沙特阿拉伯", code: "SA", value: 72, low: 69, high: 75, finding: "负向内容暴露需要持续跟踪" },
  { market: "德国", code: "DE", value: 75, low: 72, high: 78, finding: "评论区氛围和时间价值偏弱" },
  { market: "巴西", code: "BR", value: 80, low: 77, high: 83, finding: "预测最高，内容多样性保持领先" },
] as const;

const driverResults = [
  { rank: "01", label: "评论区氛围满意度", performance: 54.77, importance: 100, action: "优先改善评论生态；日本与德国重点验证" },
  { rank: "02", label: "值得投入时间", performance: 58.61, importance: 90, action: "提高内容获得感，减少低价值重复消费" },
  { rank: "03", label: "内容制作质量", performance: 61.55, importance: 58, action: "稳定专业度和完成度，避免只增加内容数量" },
  { rank: "04", label: "内容多样性", performance: 81.37, importance: 22, action: "当前优势，重点防止回落" },
] as const;

export default function ByteDanceEcosystemReport() {
  const positive = metrics.filter((metric) => metric.direction === "positive").slice(0, 6);
  const negative = metrics.filter((metric) => metric.direction === "negative").slice(0, 4);
  return (
    <main className="ecosystem-report">
      <header className="report-topbar"><div><PlatformBrand compact /><span /><img src={publicAssetPath("/bytedance-logo.svg")} alt="ByteDance" /></div><p>TT及外部竞品生态满意度调研 · 第六期模型预测</p><Link href="/clients/bytedance/ecosystem">返回项目模型</Link></header>

      <section className="report-slide report-cover">
        <div className="report-cover-copy"><p>W6 CLIENT READOUT</p><h1>满意度预计恢复，<br />但核心体验修复仍不充分</h1><span>W3–W5 Raw Data · 七国每国计划 N=2,000 · Q3–Q7 跨期模型</span></div>
        <div className="report-cover-metric"><span>W6 TikTok总体内容满意度</span><strong>74.9%</strong><p>预测区间 71.9%–77.9%</p><div><b>+4.3pts</b><span>较W5</span></div></div>
        <div className="report-cover-findings"><article><b>01</b><strong>预计位列 6 个平台第 4</strong><p>与 YouTube 预测仍相差 9.1pts。</p></article><article><b>02</b><strong>日本是首要市场风险</strong><p>Q3 预测 64%，评论区氛围表现最低。</p></article><article><b>03</b><strong>评论区与时间价值决定恢复质量</strong><p>两项同时具备高模型重要性和较大改善空间。</p></article></div>
      </section>

      <section className="report-slide report-kpis">
        <header><div><p>01 · KPI FORECAST</p><h2>恢复首先体现在总体满意度，正向体验指标仍接近 W5 低位</h2></div><span>模型预测 · W6</span></header>
        <div className="report-kpi-grid">{positive.map((metric) => <article className={metric.metric_id === "q3" ? "primary" : ""} key={metric.metric_id}><div><b>{metric.question}</b><span>{metric.label}</span></div><strong>{metric.w6_prediction.toFixed(1)}%</strong><p>W5 {metric.history.W5.toFixed(1)}% <em className={metric.projected_change_pp >= 0 ? "up" : "down"}>{metric.projected_change_pp >= 0 ? "+" : ""}{metric.projected_change_pp.toFixed(1)}pts</em></p><small>{metric.prediction_low.toFixed(1)}%–{metric.prediction_high.toFixed(1)}%</small></article>)}</div>
        <div className="report-insight-band"><b>判断</b><p>Q3 的预计回升不能直接解释为所有体验同步修复。内容质量、时间价值与评论区氛围预测仅小幅变化，因此第六期需要验证“总体恢复”是否来自样本与期次环境，还是来自具体体验改善。</p></div>
      </section>

      <section className="report-slide report-markets">
        <header><div><p>02 · MARKET DIFFERENCE</p><h2>七国恢复节奏不同，日本、沙特需要单独解释</h2></div><span>TikTok Q3</span></header>
        <div className="report-market-grid">{marketResults.map((row) => <article className={row.code === "JP" ? "risk" : ""} key={row.code}><div><b>{row.code}</b><span>{row.market}</span></div><strong>{row.value}%</strong><i><em style={{ width: `${row.value}%` }} /></i><small>{row.low}%–{row.high}%</small><p>{row.finding}</p></article>)}</div>
        <div className="report-market-summary"><strong>优先级不是按绝对高低排序，而是按“预测水平 × 与竞品差距 × 驱动短板”综合判断。</strong><p>日本重点看评论区氛围；德国看时间价值与评论区；沙特继续监测负向内容暴露；印度尼西亚和巴西用于验证优势能否保持。</p></div>
      </section>

      <section className="report-slide report-drivers">
        <header><div><p>03 · DRIVER PRIORITY</p><h2>决定满意度恢复质量的，是评论区氛围和时间价值</h2></div><span>W5实际表现 × 跨期模型</span></header>
        <div className="report-driver-grid"><article className="report-driver-chart">{driverResults.map((row) => <div key={row.label}><b>{row.rank}</b><span>{row.label}</span><i><em style={{ width: `${row.importance}%` }} /></i><strong>{row.performance.toFixed(1)}%</strong></div>)}</article><article className="report-driver-actions">{driverResults.slice(0, 3).map((row) => <div key={row.label}><b>{row.rank}</b><h3>{row.label}</h3><p>{row.action}</p></div>)}</article></div>
        <div className="report-method-line"><span>模型口径</span><p>优先级由跨期标准化系数与当前改善空间共同决定，用于资源排序；不直接表述为实验因果提升。</p></div>
      </section>

      <section className="report-slide report-negative">
        <header><div><p>04 · EXPERIENCE RISK</p><h2>负向内容暴露预测下降，但区间仍宽，需要用本期实际结果确认</h2></div><span>经常 / 非常经常暴露</span></header>
        <div className="report-negative-grid">{negative.map((metric) => <article key={metric.metric_id}><span>{metric.question}</span><h3>{metric.label}</h3><strong>{metric.w6_prediction.toFixed(1)}%</strong><p>W5 {metric.history.W5.toFixed(1)}% <em>{metric.projected_change_pp.toFixed(1)}pts</em></p><i><b style={{ width: `${metric.w6_prediction * 1.7}%` }} /></i><small>预测区间 {metric.prediction_low.toFixed(1)}%–{metric.prediction_high.toFixed(1)}%</small></article>)}</div>
        <div className="report-action-plan"><article><b>01</b><h3>先验证总体恢复来源</h3><p>拆分国家、平台持有结构与使用频率，判断是否存在样本构成影响。</p></article><article><b>02</b><h3>把评论体验列为重点专题</h3><p>结合开放题和定性内容，定位氛围问题的具体触发场景。</p></article><article><b>03</b><h3>保留第六期作为未见验证</h3><p>结果回来前不调整预测；交付后按误差层级更新动态模型。</p></article></div>
      </section>

      <footer className="report-footer"><span>Ipsos × ByteDance Consumer Intelligence</span><p>TT及外部竞品生态满意度调研 · 第六期模型预测</p></footer>
    </main>
  );
}
