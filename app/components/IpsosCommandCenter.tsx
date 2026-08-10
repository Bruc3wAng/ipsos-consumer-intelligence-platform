import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { tenantCatalog } from "../lib/tenants";

const industries = [
  { name: "TMT", detail: "科技 · 媒体 · 通信", clients: 2, projects: 4, state: "active" },
  { name: "Automotive", detail: "汽车与出行", clients: 0, projects: 0, state: "ready" },
  { name: "FMCG", detail: "快消与零售", clients: 0, projects: 0, state: "ready" },
  { name: "Finance", detail: "金融与保险", clients: 0, projects: 0, state: "ready" },
  { name: "Healthcare", detail: "健康与医药", clients: 0, projects: 0, state: "ready" },
  { name: "Beauty", detail: "美妆与个护", clients: 0, projects: 0, state: "ready" },
];

const modelFactory = [
  { step: "01", name: "数据底座", detail: "统一消费者、品牌、产品、市场与时间口径" },
  { step: "02", name: "行业模型", detail: "广告、新品、选择、趋势、因果与文本模型" },
  { step: "03", name: "客户适配", detail: "接入客户 CRM、销售、媒体与渠道结果做校准" },
  { step: "04", name: "结果回流", detail: "持续验证预测、监控漂移并更新版本" },
];

export default function IpsosCommandCenter() {
  const clients = Object.values(tenantCatalog);

  return (
    <main className="internal-shell">
      <aside className="internal-rail">
        <PlatformBrand compact />
        <nav className="rail-nav" aria-label="中台导航">
          <a className="active" href="#overview"><span>01</span>经营总览</a>
          <a href="#industries"><span>02</span>行业模型</a>
          <a href="#clients"><span>03</span>客户空间</a>
          <a href="#factory"><span>04</span>模型工厂</a>
          <a href="#governance"><span>05</span>数据治理</a>
        </nav>
        <div className="rail-access">
          <span>INTERNAL ACCESS</span>
          <strong>Ipsos TMT Team</strong>
          <small>跨客户管理视图</small>
        </div>
      </aside>

      <section className="internal-main">
        <header className="top-command" id="overview">
          <div>
            <div className="kicker">IPSOS CONSUMER MODEL OPERATING SYSTEM</div>
            <h1>把一次性研究，变成持续更新的决策资产。</h1>
            <p>内部中台统一管理行业模型、客户数据空间、项目证据和真实结果回流；每个客户只访问自己的隔离门户。</p>
          </div>
          <div className="system-state"><i />System ready <b>10 Aug 2026</b></div>
        </header>

        <section className="command-metrics" aria-label="平台概览">
          <article><span>行业空间</span><strong>6</strong><small>1 active · 5 ready</small></article>
          <article><span>TMT 客户</span><strong>2</strong><small>Lenovo · ByteDance</small></article>
          <article><span>在管项目</span><strong>4</strong><small>广告 · AI PC · 满意度 · 搜索</small></article>
          <article><span>模型族</span><strong>7</strong><small>预测 · 选择 · 因果 · 文本等</small></article>
        </section>

        <section className="section-block" id="industries">
          <div className="section-heading">
            <div><span>1 + N + M ARCHITECTURE</span><h2>行业模型空间</h2></div>
            <p>一套公司级底座，向下复制到行业与客户；模型口径共享，客户数据物理与逻辑隔离。</p>
          </div>
          <div className="industry-grid">
            {industries.map((industry, index) => (
              <article className={`industry-card ${industry.state}`} key={industry.name}>
                <div className="industry-index">0{index + 1}</div>
                <div>
                  <h3>{industry.name}</h3>
                  <p>{industry.detail}</p>
                </div>
                <div className="industry-stats">
                  <span>{industry.clients} 客户</span><span>{industry.projects} 项目</span>
                </div>
                <small>{industry.state === "active" ? "已启用" : "结构已预留"}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block" id="clients">
          <div className="section-heading compact-heading">
            <div><span>TMT / CLIENT WORKSPACES</span><h2>客户空间</h2></div>
            <div className="scope-rule">默认拒绝跨租户查询</div>
          </div>
          <div className="client-grid">
            {clients.map((client) => (
              <article className="client-card" key={client.slug} style={{ "--client-accent": client.accent } as React.CSSProperties}>
                <div className="client-card-top">
                  <div className="client-monogram">{client.name.slice(0, 1)}</div>
                  <div><span>{client.industry} CLIENT</span><h3>{client.chineseName} <em>{client.name}</em></h3></div>
                  <div className="live-pill"><i />ACTIVE</div>
                </div>
                <div className="client-domain-list">
                  {client.domains.map((domain) => <span key={domain}>{domain}</span>)}
                </div>
                <div className="project-list">
                  {client.projects.map((project, index) => (
                    <div key={project}><b>0{index + 1}</b><span>{project}</span><em>{index === 0 ? "更新中" : "模型准备"}</em></div>
                  ))}
                </div>
                <Link className="client-link" href={client.portalPath}>进入独立客户门户 <span>↗</span></Link>
              </article>
            ))}
          </div>
          <div className="access-explainer" id="governance">
            <div><b>内部中台</b><span>可看行业 / 客户 / 项目全景</span></div>
            <i>→</i>
            <div><b>身份与租户映射</b><span>SSO 登录后绑定 tenant_id</span></div>
            <i>→</i>
            <div><b>客户独立链接</b><span>仅查询所属租户的数据与模型</span></div>
            <i>→</i>
            <div><b>审计与授权</b><span>字段权限、下载权限、操作日志</span></div>
          </div>
        </section>

        <section className="section-block" id="factory">
          <div className="section-heading">
            <div><span>MODEL PRODUCTION SYSTEM</span><h2>模型生产闭环</h2></div>
            <p>模型必须有明确预测对象、历史输入、真实结果标签与样本外验证；大模型负责检索与解释，不替代统计验证。</p>
          </div>
          <div className="factory-flow">
            {modelFactory.map((item) => (
              <article key={item.step}><span>{item.step}</span><h3>{item.name}</h3><p>{item.detail}</p></article>
            ))}
          </div>
        </section>

        <footer className="product-footer">
          <span>IPSOS INTELLIGENCE FOUNDRY</span>
          <p>当前原型已实现页面与数据域隔离；生产环境仍需接入 SSO、行级权限与审计服务。</p>
        </footer>
      </section>
    </main>
  );
}

