import Link from "next/link";
import PlatformBrand from "../components/PlatformBrand";

export default function RetailIndustryPage() {
  return (
    <main className="retail-home">
      <header className="retail-nav">
        <PlatformBrand compact />
        <nav><Link href="/">返回行业赛道</Link></nav>
      </header>

      <section className="retail-hero">
        <div>
          <p>RETAIL INTELLIGENCE</p>
          <h1>零售业消费者洞察与模型平台</h1>
          <span>按品类汇集消费者、商品、渠道和经营结果，并将统一指标转化为可比较的市场机会与决策模型。</span>
        </div>
        <aside><span>行业层级</span><strong>零售业</strong><i>当前数据产品：零食消费与品类决策</i></aside>
      </section>

      <section className="retail-categories">
        <header><div><span>CATEGORY INTELLIGENCE</span><h2>品类数据产品</h2></div><p>围绕消费者需求、产品价格、渠道货架和经营结果，提供持续更新的数据与决策支持。</p></header>
        <Link className="retail-category-card" href="/packaged-food-beverage">
          <div><span>01</span><b>SNACK CONSUMER & MARKET INTELLIGENCE</b></div>
          <h3>零食消费与品类决策</h3>
          <p>以膨化食品为核心量化品类，连接人群需求、产品价格、渠道货架、预测模型和经营结果。</p>
          <dl>
            <div><dt>核心量化</dt><dd>膨化食品</dd></div>
            <div><dt>市场观察</dt><dd>坚果炒货 · 干果蜜饯</dd></div>
          </dl>
          <strong>进入数据平台 <span>→</span></strong>
        </Link>
      </section>
    </main>
  );
}
