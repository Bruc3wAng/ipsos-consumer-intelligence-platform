export type ResearchRouteObjective = "tracking" | "concept" | "pricing" | "channel";

export const RESEARCH_ROUTE_ANCHORS: Record<ResearchRouteObjective, string[]> = {
  tracking: ["追踪", "季度", "跨期", "变化", "趋势", "下一期", "波次", "监测", "预测"],
  concept: ["新品", "概念", "产品组合", "口味", "包装", "规格", "属性", "配置", "上市"],
  pricing: ["定价", "价格", "接受", "支付", "溢价", "弹性", "促销", "价格带"],
  channel: ["渠道", "货架", "上架", "商超", "电商", "门店", "分销", "场景", "触达"],
};

export function knowledgeTokens(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ");
  const result = new Set(normalized.match(/[a-z0-9][a-z0-9_+.-]*/g) ?? []);
  for (const run of normalized.match(/[\u4e00-\u9fff]+/g) ?? []) {
    for (let index = 0; index < Math.max(1, run.length - 1); index += 1) result.add(run.slice(index, index + 2));
    if (run.length <= 4) result.add(run);
  }
  return result;
}

export function routeResearchBrief(query: string, profileQueries: Record<ResearchRouteObjective, string>) {
  const text = query.trim();
  const queryTokens = knowledgeTokens(text);
  const rows = (Object.keys(RESEARCH_ROUTE_ANCHORS) as ResearchRouteObjective[]).map((objective) => {
    const profileTokens = knowledgeTokens(profileQueries[objective]);
    const anchorTokens = knowledgeTokens(RESEARCH_ROUTE_ANCHORS[objective].join(" "));
    const profileHits = [...queryTokens].filter((token) => profileTokens.has(token));
    const anchorHits = [...queryTokens].filter((token) => anchorTokens.has(token));
    const matchedAnchors = RESEARCH_ROUTE_ANCHORS[objective].filter((anchor) => text.includes(anchor));
    const raw = anchorHits.length * 2.4 + profileHits.length + matchedAnchors.length * 5;
    return { objective, raw, matchedTerms: [...new Set([...matchedAnchors, ...anchorHits, ...profileHits])].slice(0, 6) };
  });
  if (rows.every((row) => row.raw === 0)) rows.find((row) => row.objective === "concept")!.raw = 1;
  const total = rows.reduce((sum, row) => sum + row.raw, 0);
  const scored = rows.map((row) => {
    const exactScore = row.raw / total * 100;
    return { ...row, exactScore, score: Math.floor(exactScore) };
  });
  let remainder = 100 - scored.reduce((sum, row) => sum + row.score, 0);
  for (const row of [...scored].sort((a, b) => (b.exactScore - b.score) - (a.exactScore - a.score))) {
    if (remainder <= 0) break;
    row.score += 1;
    remainder -= 1;
  }
  const ranked = scored.map(({ exactScore: _exactScore, ...row }) => row).sort((a, b) => b.score - a.score);
  return { ranked, primary: ranked[0].objective, needsReview: ranked[0].score < 40 || ranked[0].score - ranked[1].score < 12 };
}
