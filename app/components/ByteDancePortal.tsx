import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { publicAssetPath } from "../lib/publicRuntime";

const projects = [
  {
    name: "TT及外部竞品生态满意度调研",
    domain: "内容生态满意度",
    questions: ["总体内容满意度的跨期变化", "内容质量、评论区与时间价值的影响", "不同国家与平台的表现差异"],
    models: ["跨期逻辑回归", "贝叶斯分层有序模型", "Tracking 校准"],
    href: "/clients/bytedance/ecosystem",
  },
  {
    name: "TikTok Search Awareness Tracking",
    domain: "搜索认知",
    questions: ["Q14 搜索功能认知", "Q15 过去 30 天搜索使用", "Q16 最常使用搜索平台"],
    models: ["W4 逻辑回归", "七国搜索漏斗", "跨期 Tracking 验证"],
    href: "/clients/bytedance/search-awareness",
  },
];

export default function ByteDancePortal() {
  return (
    <main className="client-portal bytedance-portal">
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <img className="client-logo bytedance-logo" src={publicAssetPath("/bytedance-logo.svg")} alt="ByteDance" />
          <div><strong>字节跳动项目空间</strong><span>消费者洞察与模型平台</span></div>
        </div>
        <div className="client-header-actions"><Link href="/">返回 Ipsos 平台</Link></div>
      </header>

      <section className="byte-content">
        <header className="byte-intro">
          <p>Ipsos&nbsp;&nbsp;/&nbsp;&nbsp;TMT&nbsp;&nbsp;/&nbsp;&nbsp;字节跳动项目空间</p>
          <h1>选择研究项目</h1>
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
              {project.href && <Link className="byte-project-link" href={project.href}>进入项目模型 <span>→</span></Link>}
            </article>
          ))}
        </section>

        <section className="byte-data-line">
          <div><span>项目资料</span><strong>问卷 · Raw Data · Table · 报告 · 定性文本</strong></div>
          <i>→</i>
          <div><span>模型输出</span><strong>趋势 · 驱动因素 · 人群分层 · 风险预测</strong></div>
          <i>→</i>
          <div><span>决策应用</span><strong>优先级 · 改善动作 · 跨期追踪</strong></div>
        </section>
      </section>
    </main>
  );
}
