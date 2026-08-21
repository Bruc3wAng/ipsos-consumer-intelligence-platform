import platformPcJson from "../../../output/lenovo-pc-intelligence/platform-pc-observations.json";

type Observation = (typeof platformPcJson.observations)[number];

type QueryBody = {
  audience?: string;
  productSpace?: string;
  sheet?: string;
  indicatorGroup?: string;
  brand?: string;
  wave?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function matches(row: Observation, body: QueryBody) {
  const audience = clean(body.audience);
  const productSpace = clean(body.productSpace);
  const sheet = clean(body.sheet);
  const indicatorGroup = clean(body.indicatorGroup);
  const brand = clean(body.brand);
  const wave = clean(body.wave);
  return (!audience || audience === "全部受众" || row.audience === audience)
    && (!productSpace || productSpace === "全部产品域" || row.product_space === productSpace)
    && (!sheet || sheet === "全部指标表" || row.sheet === sheet)
    && (!indicatorGroup || indicatorGroup === "全部指标" || row.indicator_group === indicatorGroup)
    && (!brand || brand === "全部品牌/指标项" || row.brand === brand || (!row.brand && row.analysis_item === brand))
    && (!wave || wave === "全部期次" || row.wave === wave);
}

function latestBySeries(rows: Observation[]) {
  const latest = new Map<string, Observation>();
  for (const row of rows) {
    const key = `${row.brand ?? ""}__${row.analysis_item}__${row.indicator_group ?? ""}`;
    const current = latest.get(key);
    if (!current || row.wave_order > current.wave_order) latest.set(key, row);
  }
  return [...latest.values()].sort((a, b) => b.value - a.value);
}

export async function POST(request: Request) {
  let body: QueryBody;
  try {
    body = await request.json() as QueryBody;
  } catch {
    return Response.json({ error: "查询条件格式无效" }, { status: 400 });
  }

  const rows = platformPcJson.observations.filter((row) => matches(row, body));
  const trend = rows
    .slice()
    .sort((a, b) => a.wave_order - b.wave_order || b.value - a.value)
    .slice(-600);
  const latest = latestBySeries(rows).slice(0, 80);
  const bases = rows.map((row) => row.base_unweighted).filter((value): value is number => typeof value === "number");

  return Response.json({
    query: body,
    summary: {
      matched: rows.length,
      series: new Set(rows.map((row) => `${row.brand ?? ""}__${row.analysis_item}__${row.indicator_group ?? ""}`)).size,
      waves: new Set(rows.map((row) => row.wave)).size,
      base_min: bases.length ? Math.min(...bases) : null,
      base_max: bases.length ? Math.max(...bases) : null,
      latest_wave: rows.length ? rows.reduce((best, row) => row.wave_order > best.wave_order ? row : best).wave : null,
    },
    trend,
    latest,
    boundary: platformPcJson.meta.evidence_boundary,
  });
}

export async function GET() {
  return Response.json({ error: "请通过筛选条件查询PC聚合证据" }, { status: 405 });
}
