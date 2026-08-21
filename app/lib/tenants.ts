export type TenantSlug = "lenovo" | "bytedance";

export const tenantCatalog = {
  lenovo: {
    slug: "lenovo",
    name: "Lenovo",
    chineseName: "联想",
    industry: "TMT",
    accent: "#e2231a",
    portalPath: "/clients/lenovo",
    domains: ["广告效果", "AI PC 消费者模型", "品牌健康追踪"],
    projects: ["2026 FIFA 世界杯 Campaign 后测", "AI PC Adoption Tracker", "Lenovo BHT + Social Dashboard"],
  },
  bytedance: {
    slug: "bytedance",
    name: "ByteDance",
    chineseName: "字节跳动",
    industry: "TMT",
    accent: "#2f80ed",
    portalPath: "/clients/bytedance",
    domains: ["内容生态满意度", "搜索认知"],
    projects: ["TT及外部竞品生态满意度调研", "TikTok Search Awareness Tracking"],
  },
} as const;

export function getTenant(slug: TenantSlug) {
  return tenantCatalog[slug];
}
