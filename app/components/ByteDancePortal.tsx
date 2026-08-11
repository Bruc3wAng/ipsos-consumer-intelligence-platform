import Link from "next/link";
import PlatformBrand from "./PlatformBrand";

const projects = [
  {
    name: "生态合作伙伴满意度追踪",
    domain: "生态满意度",
    questions: ["总体满意度如何变化", "哪些体验因素影响满意度与留存", "不同合作伙伴需要怎样的改善动作"],
    models: ["关键驱动模型", "结构方程模型", "流失风险模型"],
  },
  {
    name: "Search Mindset Tracker",
    domain: "搜索心智",
    questions: ["消费者在什么场景启动搜索", "不同入口如何争夺首选心智", "跨波次的心智迁移如何发生"],
    models: ["时间序列", "品牌迁移模型", "需求场景分群"],
  },
];

export default function ByteDancePortal() {
  return (
    <main className="client-portal bytedance-portal">
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <img className="client-logo bytedance-logo" src="/bytedance-logo.svg" alt="ByteDance" />
          <div><strong>消费者洞察与模型平台</strong></div>
        </div>
        <div className="client-header-actions"><Link href="/">返回 Ipsos 平台</Link></div>
      </header>

      <section className="byte-content">
        <header className="byte-intro">
          <p>字节跳动&nbsp;&nbsp;/&nbsp;&nbsp;消费者研究</p>
          <h1>生态体验与搜索心智</h1>
        </header>

        <section className="byte-project-grid">
          {projects.map((project, index) => (
            <article key={project.name}>
              <div className="byte-project-head"><b>{String(index + 1).padStart(2, "0")}</b><span>{project.domain}</span></div>
              <h2>{project.name}</h2>
              <div className="byte-question-list">
                {project.questions.map((question) => <p key={question}>{question}</p>)}
              </div>
              <div className="byte-models">{project.models.map((model) => <span key={model}>{model}</span>)}</div>
            </article>
          ))}
        </section>

        <section className="byte-data-line">
          <div><span>项目资料</span><strong>问卷 · Raw Data · Table · 报告 · 定性文本</strong></div>
          <i>→</i>
          <div><span>模型输出</span><strong>趋势 · 驱动因素 · 人群分层 · 风险预测</strong></div>
          <i>→</i>
          <div><span>决策应用</span><strong>优先级 · 改善动作 · 跨波次追踪</strong></div>
        </section>
      </section>
    </main>
  );
}
