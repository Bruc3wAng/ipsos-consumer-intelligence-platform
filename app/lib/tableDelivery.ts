import type { ProductionBannerGroup, ProductionCell, ProductionMetricDefinition, RawProductionResult } from "./rawDataProduction";

export type TableFamily = "count" | "no_sig" | "sig";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[=+@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function row(values: Array<string | number>) {
  return values.map(csvCell).join(",");
}

export function valueForFamily(cell: ProductionCell | undefined, metric: ProductionMetricDefinition, family: TableFamily) {
  if (!cell) return "—";
  if (family === "count") return metric.statistic === "proportion" ? cell.positiveN : cell.baseN;
  const rawValue = metric.statistic === "proportion" ? cell.percent : metric.statistic === "mean" ? cell.mean : cell.median;
  if (rawValue == null) return "—";
  const formatted = metric.statistic === "proportion" ? `${rawValue.toFixed(metric.decimalPlaces)}%` : rawValue.toFixed(metric.decimalPlaces);
  return family === "sig" && cell.sigHigherThan.length ? `${formatted} ${cell.sigHigherThan.join("")}` : formatted;
}

export function buildTableCsv(result: RawProductionResult, bannerKey: string, family: TableFamily, locale: "zh" | "en" = "zh", metricGroupKey?: string) {
  const banner = result.table.bannerGroups.find((item) => item.key === bannerKey) ?? result.table.bannerGroups[0];
  if (!banner) throw new Error(locale === "zh" ? "当前数据没有可用Banner" : "No banner is available for the current data");
  const familyLabel = family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig";
  const metricGroup = metricGroupKey ? result.table.metricGroups.find((item) => item.key === metricGroupKey) : undefined;
  const metricKeys = metricGroup ? new Set(metricGroup.metricKeys) : null;
  const metrics = result.table.metricDefinitions.filter((metric) => !metricKeys || metricKeys.has(metric.key));
  const columns = banner.rows.map((item) => `${item.letter ?? banner.totalLetter} ${item.label}`);
  const lines = [
    row([locale === "zh" ? "Table family" : "Table family", familyLabel]),
    row([locale === "zh" ? "分析Banner" : "Banner", locale === "zh" ? banner.labelZh : banner.labelEn]),
    row([locale === "zh" ? "输出模块" : "Output module", metricGroup ? locale === "zh" ? metricGroup.labelZh : metricGroup.labelEn : locale === "zh" ? "全部已生产指标" : "All produced metrics"]),
    row([locale === "zh" ? "显著性路线" : "Significance route", locale === "zh" ? "互斥独立样本 · 双侧95%" : "Mutually exclusive independent samples · two-sided 95%"]),
    "",
    row([locale === "zh" ? "题号 / 指标" : "Question / metric", ...columns]),
    row(["Base", ...banner.rows.map((item) => item.baseN)]),
    ...metrics.map((metric) => row([
      `${metric.questionId} ${locale === "zh" ? metric.labelZh : metric.labelEn}`,
      ...banner.rows.map((item) => valueForFamily(item.metrics[metric.key], metric, family)),
    ])),
    "",
    row([locale === "zh" ? "说明" : "Note", family === "sig"
      ? locale === "zh" ? "字母表示该列比例或均值显著高于对应列；比例使用加权比例，均值使用加权均值，均采用Kish有效样本量。Median只展示数值，不附显著性字母。" : "Letters mark a weighted proportion or mean significantly above the referenced column using Kish effective bases. Medians are shown without significance letters."
      : locale === "zh" ? "Count对比例指标显示未加权正例数，对Mean/Median显示有效Base；No sig显示加权比例或加权统计量。" : "Count shows unweighted positives for proportions and valid bases for means/medians; No sig shows weighted proportions or weighted statistics."]),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function buildGridCsv(result: RawProductionResult, gridKey: string, family: TableFamily, locale: "zh" | "en" = "zh") {
  const grid = result.table.grids.find((item) => item.key === gridKey) ?? result.table.grids[0];
  if (!grid) throw new Error(locale === "zh" ? "当前数据没有可用Grid" : "No grid is available for the current data");
  const metricByKey = new Map(result.table.metricDefinitions.map((metric) => [metric.key, metric]));
  const metrics = grid.metricKeys.flatMap((key) => {
    const metric = metricByKey.get(key);
    return metric ? [metric] : [];
  });
  const familyLabel = family === "count" ? "Count" : family === "no_sig" ? "No sig" : "Sig";
  const lines = [
    row(["Table family", familyLabel]),
    row(["Grid", locale === "zh" ? grid.labelZh : grid.labelEn]),
    row([locale === "zh" ? "显著性路线" : "Significance route", locale === "zh" ? "年龄与性别分别进行互斥独立样本双侧95%检验" : "Two-sided 95% independent-sample tests are run within age and gender groups"]),
    "",
    row([locale === "zh" ? "题号 / 指标" : "Question / metric", ...grid.columns.map((column) => `${column.letter} ${column.label}`)]),
    row(["Base", ...grid.columns.map((column) => column.baseN)]),
    ...metrics.map((metric) => row([
      `${metric.questionId} ${locale === "zh" ? metric.labelZh : metric.labelEn}`,
      ...grid.columns.map((column) => valueForFamily(column.metrics[metric.key], metric, family)),
    ])),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function tableCsvFileName(banner: ProductionBannerGroup, family: TableFamily, locale: "zh" | "en" = "zh", groupLabel?: string) {
  const familyLabel = family === "count" ? "Count" : family === "no_sig" ? "No_sig" : "Sig";
  const groupSuffix = groupLabel ? `_${groupLabel.replaceAll(/[\\/:*?"<>|\s]+/g, "_")}` : "";
  return locale === "zh"
    ? `中国薄脆饼干新品概念与定价研究_${banner.labelZh}${groupSuffix}_${familyLabel}.csv`
    : `China_cracker_concept_pricing_${banner.key}${groupSuffix}_${familyLabel}.csv`;
}

export function gridCsvFileName(family: TableFamily, locale: "zh" | "en" = "zh") {
  const familyLabel = family === "count" ? "Count" : family === "no_sig" ? "No_sig" : "Sig";
  return locale === "zh"
    ? `中国薄脆饼干新品概念与定价研究_Grid101_${familyLabel}.csv`
    : `China_cracker_concept_pricing_Grid101_${familyLabel}.csv`;
}
