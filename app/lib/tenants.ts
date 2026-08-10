export type TenantSlug = "lenovo" | "bytedance";

export const tenantCatalog = {
  lenovo: {
    slug: "lenovo",
    name: "Lenovo",
    chineseName: "联想",
    industry: "TMT",
    accent: "#e2231a",
    portalPath: "/clients/lenovo",
    domains: ["广告效果", "AI PC 消费者模型"],
    projects: ["2026 FIFA 世界杯 Campaign 后测", "AI PC Adoption Tracker"],
  },
  bytedance: {
    slug: "bytedance",
    name: "ByteDance",
    chineseName: "字节跳动",
    industry: "TMT",
    accent: "#2f80ed",
    portalPath: "/clients/bytedance",
    domains: ["生态满意度", "搜索心智"],
    projects: ["生态合作伙伴满意度追踪", "Search Mindset Tracker"],
  },
} as const;

export function getTenant(slug: TenantSlug) {
  return tenantCatalog[slug];
}

