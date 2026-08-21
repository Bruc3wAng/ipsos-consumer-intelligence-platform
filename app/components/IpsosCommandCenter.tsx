import Link from "next/link";
import PlatformBrand from "./PlatformBrand";
import { tenantCatalog } from "../lib/tenants";

const modelRouting = [
  {
    type: "Tracking 类项目",
    input: "多期问卷 · Raw Data · Table · 国家与人群标签",
    models: "分层动态模型 · 跨期留出验证 · KPI Nowcast",
    output: "下一期 KPI 区间、变化驱动、国家与人群差异",
  },
  {
    type: "广告效果项目",
    input: "前后测 · 曝光与未曝光样本 · 创意评价 · 品牌指标",
    models: "倾向得分与增量模型 · 影响因子 · 人群异质性",
    output: "广告增量、创意说服路径、重点人群与优化动作",
  },
  {
    type: "品牌与 Social 项目",
    input: "BHT 指标 · Social 话题与情绪 · 时间节点 · Subgroup",
    models: "动态基线 · 驱动模型 · 领先滞后关系 · 异常识别",
    output: "品牌变化预警、话题解释、Subgroup 差异与后续追踪",
  },
] as const;

const modelLineage = [
  ["01", "锁定题号与目标", "生态满意度 Q3；搜索项目 Q15_4。预测对象先于模型选择。"],
  ["02", "读取问卷与 Raw Data", "保留题干、选项、Base、国家、平台、期次和受访者级记录。"],
  ["03", "Raw Data 对账 Table", "搜索项目 Q14/Q15/Q16 共24项 KPI 已逐项核对通过。"],
  ["04", "生成建模表并验证", "训练期与验证期分开，报告 AUC、Brier、校准和分市场表现。"],
  ["05", "输出预测并回收结果", "输出 W6 预测值；W6 实际值回来后直接检验误差并更新模型。"],
] as const;

export default function IpsosCommandCenter() {
  const clients = Object.values(tenantCatalog);

  return (
    <main className="research-shell">
      <aside className="research-rail">
        <PlatformBrand compact />
        <nav aria-label="平台导航">
          <Link href="/">行业赛道</Link>
          <a className="active" href="#clients">客户项目空间</a>
          <a href="#models">研究模型</a>
          <a href="#lineage">数据链路</a>
        </nav>
      </aside>

      <section className="research-main">
        <header className="research-header">
          <div><span>TMT</span><h1>消费者洞察与模型平台</h1></div>
          <p>Ipsos&nbsp;&nbsp;/&nbsp;&nbsp;行业赛道&nbsp;&nbsp;/&nbsp;&nbsp;TMT</p>
        </header>

        <section className="research-hero model-overview-hero">
          <div>
            <p>TMT 消费者研究</p>
            <h2>先进入客户项目空间，再选择具体研究项目与模型</h2>
          </div>
          <p>客户资料、项目模型与研究结果按客户空间隔离。行业层只负责进入客户空间和说明模型生产方法，不展示其他客户的具体项目结果。</p>
        </section>

        <section className="tmt-industry-data" id="industry-data">
          <div className="research-section-title"><span>INDUSTRY DATA PRODUCT</span><h2>行业消费者数据库</h2></div>
          <Link className="tmt-industry-product" href="/tmt/consumer-electronics">
            <div><span>数码3C</span><h3>数码3C行业消费者数据库与预测</h3><p>每季度投入 N=10,000，持续追踪中国与七个出海市场；按产品、国家、年龄、性别、地区和收入查看需求、AI态度、价格接受与人群机会。</p></div>
            <dl><div><dt>产品</dt><dd>PC · 手机 · 平板 · 相机 · 穿戴 · 音频 · 智能家居</dd></div><div><dt>模型</dt><dd>分层预测 · 离散选择 · 价格弹性 · 购买倾向</dd></div></dl>
            <strong>进入行业大盘 <span>→</span></strong>
          </Link>
        </section>

        <section className="research-clients tmt-client-entry" id="clients">
          <div className="research-section-title"><span>CLIENT WORKSPACES</span><h2>选择客户项目空间</h2></div>
          <div className="research-client-grid">
            {clients.map((client) => (
              <article key={client.slug}>
                <div className="research-client-head">
                  <img className={`account-logo account-logo-${client.slug}`} src={client.slug === "lenovo" ? "/lenovo-logo.svg" : "/bytedance-logo.svg"} alt={client.name} />
                  <div><strong>{client.chineseName}</strong><span>{client.name}</span></div>
                </div>
                <div className="client-space-summary">
                  <div><strong>{client.projects.length}</strong><span>项研究项目</span></div>
                  <p>{client.domains.join(" · ")}</p>
                </div>
                <Link href={client.portalPath}>进入{client.chineseName}项目空间 <span>→</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="model-routing-section" id="models">
          <div className="research-section-title"><span>MODEL ROUTING</span><h2>根据研究设计选择模型</h2></div>
          <div className="model-routing-grid">
            {modelRouting.map((item, index) => (
              <article key={item.type}>
                <header><b>{String(index + 1).padStart(2, "0")}</b><h3>{item.type}</h3></header>
                <dl>
                  <div><dt>读取数据</dt><dd>{item.input}</dd></div>
                  <div><dt>推荐模型</dt><dd>{item.models}</dd></div>
                  <div><dt>项目输出</dt><dd>{item.output}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="model-lineage-section" id="lineage">
          <div className="research-section-title"><span>DATA → MODEL → RESULT</span><h2>问卷、Raw Data、Table 与模型如何联动</h2></div>
          <div className="model-lineage-track">
            {modelLineage.map(([number, title, detail], index) => (
              <div className="model-lineage-step" key={number}>
                <article><b>{number}</b><h3>{title}</h3><p>{detail}</p></article>
                {index < modelLineage.length - 1 && <i>→</i>}
              </div>
            ))}
          </div>
        </section>

      </section>
    </main>
  );
}
