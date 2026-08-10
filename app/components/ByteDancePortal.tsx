import Link from "next/link";
import PlatformBrand from "./PlatformBrand";

export default function ByteDancePortal() {
  return (
    <main className="client-portal bytedance-portal">
      <header className="client-header">
        <div className="client-brandline">
          <PlatformBrand compact />
          <span className="brand-divider" />
          <div className="byte-wordmark">ByteDance</div>
          <div><strong>Consumer Intelligence</strong><small>China · TMT client workspace</small></div>
        </div>
        <div className="client-header-actions"><span className="scope-chip"><i />BYTEDANCE SCOPE ONLY</span><Link href="/">返回 Ipsos 中台</Link></div>
      </header>
      <section className="placeholder-portal">
        <span className="kicker">CLIENT-SCOPED WORKSPACE</span>
        <h1>字节跳动消费者洞察空间</h1>
        <p>这个链接只承载字节项目与数据域；联想项目不会进入页面数据包、查询上下文或导出权限。</p>
        <div className="placeholder-projects">
          <article><span>01</span><h2>生态满意度</h2><p>合作伙伴体验 · 驱动因素 · 留存风险 · 行动优先级</p><b>结构已预留</b></article>
          <article><span>02</span><h2>搜索心智</h2><p>搜索入口 · 需求场景 · 品牌心智 · 跨波次 tracking</p><b>结构已预留</b></article>
        </div>
        <section className="tenant-contract"><div><b>URL scope</b><span>/clients/bytedance</span></div><div><b>Data scope</b><span>tenant_id = bytedance</span></div><div><b>Export scope</b><span>ByteDance projects only</span></div></section>
      </section>
    </main>
  );
}

