import Link from "next/link";
import DataGlobe from "./DataGlobe";
import PlatformBrand from "./PlatformBrand";

const industries = [
  {
    code: "01",
    name: "TMT",
    chinese: "科技 · 媒体 · 通信",
    description: "消费者洞察、品牌与广告、内容生态、搜索心智及 AI PC 模型。",
    href: "/tmt",
  },
  {
    code: "02",
    name: "Automotive",
    chinese: "汽车与出行",
    description: "品牌迁移、车型选择、价格敏感度与新能源消费决策。",
  },
  {
    code: "03",
    name: "Financial Services",
    chinese: "金融服务",
    description: "客户分层、产品选择、流失风险与体验驱动因素。",
  },
  {
    code: "04",
    name: "Retail",
    chinese: "零售业",
    description: "商品、消费者、渠道与货架决策；进入行业后再选择具体品类。",
    href: "/retail",
  },
  {
    code: "05",
    name: "Healthcare",
    chinese: "医疗健康",
    description: "患者旅程、需求分层、治疗选择与健康行为研究。",
  },
  {
    code: "06",
    name: "Public Affairs",
    chinese: "公共事务与社会研究",
    description: "公众态度、社会议题、政策影响与长期趋势追踪。",
  },
];

export default function GlobalIndustryHome() {
  return (
    <main className="global-home">
      <section className="global-hero">
        <header className="global-nav">
          <PlatformBrand />
          <nav aria-label="首页导航">
            <a href="#industries">行业赛道</a>
          </nav>
        </header>

        <div className="global-hero-grid">
          <div className="global-hero-copy">
            <p className="global-eyebrow">IPSOS CONSUMER INTELLIGENCE</p>
            <h1>全球消费者洞察与模型平台</h1>
            <p className="global-lead">
              从全球研究现场出发，将跨市场、跨行业、跨期的一手数据，转化为可验证的洞察、预测与决策支持。
            </p>
            <div className="global-actions">
              <a className="global-primary-action" href="#industries">
                选择行业赛道 <span>↓</span>
              </a>
            </div>
            <div className="global-principles" aria-label="平台核心维度">
              <span>CONSUMER</span>
              <i />
              <span>MARKET</span>
              <i />
              <span>TIME</span>
              <i />
              <span>OUTCOME</span>
            </div>
          </div>
          <DataGlobe />
        </div>

        <a className="global-scroll-cue" href="#industries" aria-label="向下查看行业赛道">
          <span>INDUSTRY INTELLIGENCE</span><i>↓</i>
        </a>
      </section>

      <section className="industry-space" id="industries">
        <div className="global-section-heading">
          <div><span>INDUSTRY INTELLIGENCE</span><h2>行业赛道</h2></div>
          <p>先选择同层级行业，再进入行业内部的品类、行业数据产品或客户项目。</p>
        </div>
        <div className="industry-space-grid">
          {industries.map((industry) => {
            const content = (
              <>
                <div className="industry-card-index"><span>{industry.code}</span><b>{industry.name}</b></div>
                <h3>{industry.chinese}</h3>
                <p>{industry.description}</p>
                {industry.href && <strong>进入行业平台 <span>→</span></strong>}
              </>
            );
            return industry.href ? (
              <Link className="industry-space-card active" href={industry.href} key={industry.code}>{content}</Link>
            ) : (
              <article className="industry-space-card" key={industry.code}>{content}</article>
            );
          })}
        </div>
      </section>

      <footer className="global-footer">
        <PlatformBrand compact />
        <p>Consumer data · Research intelligence · Decision models</p>
      </footer>
    </main>
  );
}
