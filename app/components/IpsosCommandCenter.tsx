import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { tenantCatalog } from "../lib/tenants";

const platformMetrics = [
  { label: "客户", value: "2", detail: "联想 · 字节跳动" },
  { label: "业务域", value: "4", detail: "广告效果 · AI PC · 生态满意度 · 搜索心智" },
  { label: "项目", value: "4", detail: "按项目与波次持续积累" },
  { label: "模型", value: "4", detail: "广告倾向 · 市场预测 · 品牌选择 · 数字孪生" },
];

const modelRegistry = [
  {
    name: "Campaign 认知倾向模型",
    client: "联想",
    decision: "识别更容易形成广告记忆的人群",
    data: "世界杯 Campaign 中期 raw · N=1,000",
    validation: "5 折交叉验证 AUC 0.717",
    tone: "validated",
  },
  {
    name: "广告增量与购买预测",
    client: "联想",
    decision: "比较投放与 Holdout 的 90 天购买差异",
    data: "30,000 名合成消费者",
    validation: "随机化模拟 · 95% 区间估计",
    tone: "simulation",
  },
  {
    name: "AI PC 贝叶斯渗透率预测",
    client: "联想",
    decision: "预测未来 3 年渗透率及不确定性",
    data: "待接入市场销量、装机与宏观数据",
    validation: "贝叶斯情景模型",
    tone: "design",
  },
  {
    name: "Choice Model 与 Consumer Digital Twin",
    client: "联想",
    decision: "模拟品牌选择、购买概率、功能与价格接受度",
    data: "待接入 Conjoint 与真实购买结果",
    validation: "可交互模拟器",
    tone: "design",
  },
];

const dataFoundation = [
  { source: "问卷与 Raw Data", current: "联想 Campaign：中期 N=1,000；最终报告 N=2,000", use: "认知、态度、触达、人群与跨波次指标" },
  { source: "定性访谈与开放题", current: "按项目进入客户数据域", use: "需求、语言、场景与阻碍因素编码" },
  { source: "媒体与市场数据", current: "待接入周度投放、竞争与市场数据", use: "曝光、频次、趋势与外部环境校准" },
  { source: "商业结果", current: "待接入 SKU、销量、转化与份额", use: "增量、购买预测、ROI 与模型回测" },
];

export default function IpsosCommandCenter() {
  const clients = Object.values(tenantCatalog);

  return (
    <main className="command-shell">
      <aside className="command-rail">
        <PlatformBrand compact />
        <nav aria-label="平台导航">
          <a className="active" href="#clients">客户与项目</a>
          <a href="#models">模型</a>
          <a href="#data">数据</a>
        </nav>
      </aside>

      <section className="command-main">
        <header className="command-header">
          <div>
            <p>TMT</p>
            <h1>消费者洞察与模型平台</h1>
          </div>
          <div className="command-path">行业&nbsp;&nbsp;/&nbsp;&nbsp;客户&nbsp;&nbsp;/&nbsp;&nbsp;业务域&nbsp;&nbsp;/&nbsp;&nbsp;项目&nbsp;&nbsp;/&nbsp;&nbsp;模型</div>
        </header>

        <section className="command-summary" aria-label="平台范围">
          {platformMetrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="command-section" id="clients">
          <div className="command-section-title">
            <div><p>TMT</p><h2>客户与项目</h2></div>
            <span>客户数据与项目权限分别管理</span>
          </div>
          <div className="account-grid">
            {clients.map((client) => (
              <article className="account-card" key={client.slug}>
                <div className="account-head">
                  <img
                    className={`account-logo account-logo-${client.slug}`}
                    src={client.slug === "lenovo" ? "/lenovo-logo.svg" : "/bytedance-logo.svg"}
                    alt={client.name}
                  />
                  <div>
                    <h3>{client.chineseName}</h3>
                    <span>{client.name}</span>
                  </div>
                </div>
                <div className="account-domains">
                  {client.domains.map((domain) => <span key={domain}>{domain}</span>)}
                </div>
                <div className="account-projects">
                  {client.projects.map((project, index) => (
                    <div key={project}>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      <p>{project}</p>
                    </div>
                  ))}
                </div>
                <Link href={client.portalPath}>进入{client.chineseName}项目空间 <span>→</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="command-section" id="models">
          <div className="command-section-title"><div><p>联想</p><h2>模型与验证状态</h2></div></div>
          <div className="model-table-wrap">
            <table className="model-table">
              <thead><tr><th>模型</th><th>支持的决策</th><th>当前数据</th><th>验证状态</th></tr></thead>
              <tbody>
                {modelRegistry.map((model) => (
                  <tr key={model.name}>
                    <td><strong>{model.name}</strong><small>{model.client}</small></td>
                    <td>{model.decision}</td>
                    <td>{model.data}</td>
                    <td><span className={`model-status ${model.tone}`}>{model.validation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="command-section" id="data">
          <div className="command-section-title"><div><p>数据</p><h2>模型所需的数据底座</h2></div></div>
          <div className="data-foundation-grid">
            {dataFoundation.map((item, index) => (
              <article key={item.source}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <h3>{item.source}</h3>
                <p>{item.current}</p>
                <span>{item.use}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
