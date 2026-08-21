import researchIndexJson from "../../../output/lenovo-pc-intelligence/research-answer-index.json";
import platformPcJson from "../../../output/lenovo-pc-intelligence/platform-pc-observations.json";

type Evidence = { label: string; value: string; source: string };
type Answer = { title: string; answer: string; points: string[]; sources: string[]; boundary: string; evidence: Evidence[]; matchedBy: string };

const index = researchIndexJson;

function waveOrder(value: string) {
  return platformPcJson.observations.find((item) => item.wave === value)?.wave_order ?? 0;
}

function platformMetricAnswer(query: string): Answer | null {
  const audience = requestedAudience(query);
  const wantsAiPc = /AI\s*PC|AIPC/i.test(query);
  const wantsNotebook = /笔记本/.test(query);
  const wantsDesktop = /台式/.test(query);
  const wantsProcurement = /采购考虑|采购因素|选型因素/.test(query);
  if (!audience && !wantsAiPc && !wantsNotebook && !wantsDesktop && !wantsProcurement) return null;

  let rows = platformPcJson.observations.filter((row) => !audience || row.audience === audience);
  if (wantsAiPc) rows = rows.filter((row) => row.product_space === "AI PC");
  else if (wantsNotebook || wantsProcurement) rows = rows.filter((row) => row.product_space === "笔记本电脑");
  else if (wantsDesktop) rows = rows.filter((row) => row.product_space === "台式电脑");
  if (wantsProcurement) rows = rows.filter((row) => /采购考虑因素/.test(row.sheet));
  if (/无提示/.test(query)) rows = rows.filter((row) => row.indicator_group === "无提示总认知");
  else if (/提示后/.test(query)) rows = rows.filter((row) => row.indicator_group === "提示后总认知");
  else if (/美誉/.test(query)) rows = rows.filter((row) => row.indicator_group === "品牌美誉度");
  if (/联想/.test(query)) rows = rows.filter((row) => row.brand === "联想" || /联想/.test(String(row.brand_series ?? "")));
  if (/ThinkPad/i.test(query)) rows = rows.filter((row) => row.brand === "ThinkPad");
  if (!rows.length) return null;

  if (wantsProcurement) {
    const latestWave = rows.reduce((best, row) => row.wave_order > waveOrder(best) ? row.wave : best, rows[0].wave);
    const latest = rows.filter((row) => row.wave === latestWave).sort((a, b) => b.value - a.value).slice(0, 5);
    return {
      title: `${audience ?? "当前受众"}${latestWave}商用笔记本采购考虑因素`,
      answer: `首要因素为${latest[0].analysis_item}，${latest[0].value.toFixed(1)}%，Base N=${latest[0].base_unweighted?.toLocaleString() ?? "—"}。`,
      points: latest.slice(1).map((row) => `${row.analysis_item} ${row.value.toFixed(1)}%`),
      sources: [`${latest[0].source_file} · ${latest[0].sheet}`],
      boundary: "多选声明比例不是控制其他变量后的独立驱动效应；连接个体Raw与采购结果后才能进入驱动模型。",
      evidence: latest.map((row) => ({ label: row.analysis_item, value: `${row.value.toFixed(1)}%`, source: `${latestWave} · N=${row.base_unweighted?.toLocaleString() ?? "—"}` })),
      matchedBy: "platform_pc:procurement_factors",
    };
  }

  const grouped = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.audience}__${row.product_space}__${row.brand ?? row.analysis_item}__${row.indicator_group ?? ""}__${row.wave}`;
    if (!grouped.has(key)) grouped.set(key, row);
  }
  const series = [...grouped.values()].sort((a, b) => a.wave_order - b.wave_order);
  const latest = series.at(-1)!;
  const first = series[0];
  return {
    title: `${latest.audience} · ${latest.product_space} · ${latest.indicator_group ?? latest.sheet}`,
    answer: `${latest.brand ?? latest.analysis_item}在${latest.wave}为 ${latest.value.toFixed(1)}%，Base N=${latest.base_unweighted?.toLocaleString() ?? "—"}${series.length > 1 ? `；较${first.wave}变化 ${signed(latest.value - first.value)} pts。` : "。"}`,
    points: series.slice(-6).map((row) => `${row.wave} ${row.value.toFixed(1)}%（N=${row.base_unweighted?.toLocaleString() ?? "—"}）`),
    sources: Array.from(new Set(series.map((row) => `${row.source_file} · ${row.sheet}`))),
    boundary: platformPcJson.meta.evidence_boundary,
    evidence: series.slice(-5).map((row) => ({ label: row.wave, value: `${row.value.toFixed(1)}%`, source: `${row.brand ?? row.analysis_item} · N=${row.base_unweighted?.toLocaleString() ?? "—"}` })),
    matchedBy: "platform_pc:longitudinal_aggregate",
  };
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function decisionAnswer(decisionId: string): Answer {
  const item = index.decision_outputs.find((candidate) => candidate.decision_id === decisionId)!;
  return {
    title: item.question,
    answer: item.conclusion,
    points: [item.rationale, `建议动作：${item.action}`, `下一期验证：${item.next_validation}`],
    sources: Array.from(new Set(item.evidence.map((row) => `${row.question} · ${item.wave} · N=${row.base_unweighted.toLocaleString()}`))),
    boundary: item.outcome_boundary,
    evidence: item.evidence.map((row) => ({ label: `${row.question} · ${row.item}`, value: `${row.value.toFixed(1)}%`, source: `${row.metric} · N=${row.base_unweighted.toLocaleString()}` })),
    matchedBy: `decision_output:${decisionId}`,
  };
}

function driftAnswer(): Answer {
  const later = index.tracking_validation.find((row) => row.validation_role === "comparability_gate")!;
  const historical = index.tracking_validation.filter((row) => row.validation_role === "historical_parameter_tuning");
  const mae = historical.reduce((sum, row) => sum + Number(row.absolute_error ?? 0), 0) / historical.length;
  return {
    title: "FY25 Q4 Q14先触发样本可比性警报，不能直接判断需求下降",
    answer: `历史模型冻结预测为 ${later.prediction?.toFixed(1)}%，FY25 Q4样本读数为 ${later.actual.toFixed(1)}%；但该期现有/潜在用户配额固定为1:1，Q14笔记本潜在购买者也恰为500/1000，因此 ${signed(later.actual - Number(later.prediction))} pts 不能直接解释为自然需求变化。`,
    points: [
      `历史三个滚动调优点的平均绝对误差为 ${mae.toFixed(2)} pts；这不是后一期独立样本外验证。`,
      "题号与选项代码一致，不代表样本框、配额和权重自动可比。",
      "应先按固定目标总体重算各期加权Q14，再锁定下一期预测并回填误差。",
    ],
    sources: ["Q14 · FY25 Q4 Raw · N=1,000", "FY25 Q4正式问卷与配额表 · 潜在用户N=500", "Q14动态模型验证登记"],
    boundary: "预测对象是问卷样本占比，不是实际购买、销量或市场份额。",
    evidence: [
      { label: "历史冻结预测", value: `${later.prediction?.toFixed(1)}%`, source: "2023Q1–2024Q2动态模型" },
      { label: "FY25 Q4样本读数", value: `${later.actual.toFixed(1)}%`, source: "Q14 · N=1,000" },
      { label: "潜在用户配额", value: "N=500", source: "正式问卷与配额表" },
    ],
    matchedBy: "tracking_comparability_gate:q14",
  };
}

function segmentAnswer(): Answer {
  const eligible = index.model_subgroup_validation.filter((row) => row.n >= 100);
  const highest = eligible.reduce((best, row) => row.observed > best.observed ? row : best, eligible[0]);
  const lowest = eligible.reduce((best, row) => row.observed < best.observed ? row : best, eligible[0]);
  return {
    title: `${highest.holdout_wave}购买意向最高的已登记细分是${highest.dimension}：${highest.segment}`,
    answer: `该细分实际购买意向 ${highest.observed.toFixed(1)}%，N=${highest.n.toLocaleString()}；N≥100细分中最低为${lowest.dimension}：${lowest.segment}，${lowest.observed.toFixed(1)}%。`,
    points: [
      `模型对最高细分预测 ${highest.predicted.toFixed(1)}%，偏差 ${signed(highest.gap)} pts。`,
      "分群实际值与预测偏差来自同一时间留出样本。",
      "细分排序用于下一轮招募与验证优先级，不解释为人口属性的因果作用。",
    ],
    sources: [`Q14 · ${highest.holdout_wave}时间留出样本 · N=${index.model_subgroup_validation.reduce((sum, row) => row.dimension === highest.dimension ? sum + row.n : sum, 0).toLocaleString()}`],
    boundary: "N<100不进入最高/最低排序；购买意向不等于实际购买。",
    evidence: [
      { label: `${highest.dimension} · ${highest.segment}`, value: `${highest.observed.toFixed(1)}%`, source: `实际 · N=${highest.n.toLocaleString()}` },
      { label: "模型预测", value: `${highest.predicted.toFixed(1)}%`, source: `偏差 ${signed(highest.gap)} pts` },
      { label: `${lowest.dimension} · ${lowest.segment}`, value: `${lowest.observed.toFixed(1)}%`, source: `实际 · N=${lowest.n.toLocaleString()}` },
    ],
    matchedBy: "model_subgroup_validation:q14",
  };
}

function brandAnswer(): Answer {
  const awareness = index.historical_observations.filter((row) => row.metric_key === "pc_brand_awareness_total");
  const waves = Array.from(new Set(awareness.map((row) => row.wave))).sort();
  const latestWave = waves.at(-1)!;
  const latest = awareness.filter((row) => row.wave === latestWave).sort((a, b) => b.value - a.value);
  const intent = index.historical_observations.find((row) => row.metric_key === "pc_purchase_intent_12m" && row.wave === latestWave)!;
  const lenovo = latest.find((row) => row.segment_value === "联想")!;
  return {
    title: "联想笔记本认知保持领先，但品类购买意向需要单独判断",
    answer: `${latestWave}联想笔记本品牌认知度为 ${lenovo.value.toFixed(0)}%，同一期未来12个月笔记本购买意向为 ${intent.value.toFixed(0)}%。`,
    points: [
      `同一期华为 ${latest.find((row) => row.segment_value === "华为")?.value.toFixed(0)}%，戴尔 ${latest.find((row) => row.segment_value === "戴尔")?.value.toFixed(0)}%。`,
      "品牌认知和品类购买意向是不同指标，不能用前者替代后者。",
      "品牌动作应看认知/美誉，需求动作应看Q14、换机与后续真实购买。",
    ],
    sources: [`消费-笔记本品牌认知度 · ${latestWave} · N=${lenovo.base_unweighted?.toLocaleString()}`, `Q14 · ${latestWave} · N=${intent.base_unweighted?.toLocaleString()}`],
    boundary: "品牌认知与问卷购买意向均不是市场份额或销量。",
    evidence: latest.slice(0, 3).map((row) => ({ label: `${row.segment_value}品牌认知`, value: `${row.value.toFixed(0)}%`, source: `${latestWave} · N=${row.base_unweighted?.toLocaleString()}` })),
    matchedBy: "historical_observations:brand_and_intent",
  };
}

function priceAnswer(): Answer {
  const rows = index.historical_observations.filter((row) => row.metric_key === "acceptable_pc_price");
  const latestWave = Array.from(new Set(rows.map((row) => row.wave))).sort().at(-1)!;
  const latest = rows.filter((row) => row.wave === latestWave).sort((a, b) => b.value - a.value);
  return {
    title: "现有数据可以回答预算分布，不能直接回答价格弹性",
    answer: `${latestWave}的可接受价格题有效Base为 N=${latest[0].base_unweighted?.toLocaleString()}；占比最高的价格带为${latest[0].segment_value}，${latest[0].value.toFixed(1)}%。`,
    points: ["预算题是受访者声明的可承受区间。", "价格弹性需要不同价格与配置下的真实选择任务。", "收入、城市、设备档位和换机紧迫度可作为后续选择模型的交叉变量。"],
    sources: [`可接受PC价格 · ${latestWave} · N=${latest[0].base_unweighted?.toLocaleString()}`],
    boundary: "不会用单题预算分布推导价格弹性、最优售价或需求曲线。",
    evidence: latest.slice(0, 4).map((row) => ({ label: row.segment_value, value: `${row.value.toFixed(1)}%`, source: `${latestWave} · N=${row.base_unweighted?.toLocaleString()}` })),
    matchedBy: "historical_observations:acceptable_pc_price",
  };
}

function modelAnswer(): Answer {
  const intent = index.model_validation.find((row) => row.model_id === "behavioral")!;
  const store = index.project_model_validation[0];
  return {
    title: "两个真实模型回答不同问题，均保留明确使用边界",
    answer: `BHT Q14时间留出模型AUC=${intent.auc.toFixed(4)}，仅作诊断；AIPC门店B5体验模型重复交叉验证AUC=${store.experience_auc.toFixed(4)}，用于识别与自报购买意愿提升相关的体验因素。`,
    points: [intent.recommended_use, `AIPC模型共识别${store.stable_driver_count}个95%方向稳定因素。`, `下一期：${store.next_validation}`],
    sources: ["联想BHT历史Raw · Q14 · 2023Q1–2024Q2", `AIPC进店用户调研（第二期） · B5 · N=${store.sample_n}`],
    boundary: `${intent.outcome_boundary}；${store.outcome_boundary}。`,
    evidence: [
      { label: "BHT Q14时间留出AUC", value: intent.auc.toFixed(4), source: `${intent.model_id} · Brier ${intent.brier.toFixed(4)}` },
      { label: "AIPC画像模型AUC", value: store.profile_auc.toFixed(4), source: `B5 · N=${store.sample_n}` },
      { label: "AIPC体验模型AUC", value: store.experience_auc.toFixed(4), source: `95%区间 ${store.experience_auc_low.toFixed(4)}–${store.experience_auc_high.toFixed(4)}` },
    ],
    matchedBy: "model_validation:registered_models",
  };
}

function requestedAudience(query: string) {
  if (/SMB|中小企业/i.test(query)) return "SMB";
  if (/政企|大客户|企业级/.test(query)) return "政企大客户";
  if (/大众|消费者|个人/.test(query)) return "大众消费者";
  return null;
}

function metricDefinitionAnswer(query: string): Answer | null {
  const question = query.match(/\bQ\d+[A-Z]?(?:_\d+)?\b/i)?.[0].toUpperCase();
  const audience = requestedAudience(query);
  let definitions = index.metric_definitions.filter((item) => !question || item.question?.toUpperCase() === question);
  if (audience) definitions = definitions.filter((item) => item.audience === audience);
  if (!question) {
    const normalized = query.replace(/联想|目前|具体|数值|情况|趋势|如何|多少|什么|查看|查询/g, "");
    definitions = definitions
      .map((item) => ({ item, score: [item.name, item.official_question_text ?? "", item.domain].reduce((sum, text) => sum + (text.includes(normalized) || normalized.includes(item.name) ? 10 : 0), 0) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }
  if (!definitions.length) return null;
  if (question && !audience && definitions.length > 1) {
    return {
      title: `${question}在不同研究受众中含义不同`,
      answer: `当前指标库找到${definitions.length}个${question}定义，需要指定大众消费者、SMB或政企大客户后才能返回对应数值。`,
      points: definitions.map((item) => `${item.audience}：${item.name}（${item.wave_count ?? 0}期）`),
      sources: Array.from(new Set(definitions.map((item) => `${item.source_project} · ${item.question}`))),
      boundary: "同一题号在不同研究总体中不能自动合并，Base也不能相加。",
      evidence: definitions.map((item) => ({ label: item.audience ?? "未限定", value: item.name, source: `${item.wave_count ?? 0}期 · ${item.model_readiness_note ?? "按定义使用"}` })),
      matchedBy: `metric_definition_ambiguous:${question}`,
    };
  }
  const definition = definitions[0];
  const observations = index.historical_observations.filter((row) => row.metric_key === definition.metric_key);
  if (!observations.length) {
    return {
      title: `${definition.question ?? "指标"} · ${definition.name}`,
      answer: `${definition.audience ?? "当前研究总体"}已登记该指标定义，覆盖${definition.wave_count ?? 0}期；目前证据索引尚无可直接展示的聚合数值。`,
      points: [`正式题意：${definition.official_question_text ?? definition.definition}`, `模型用途：${definition.model_readiness_note ?? "按指标定义使用"}`, `可交叉维度：${definition.cross_tabs.join(" · ")}`],
      sources: [`${definition.source_project} · ${definition.question ?? definition.metric_key}`],
      boundary: definition.blocked_uses.join("；") || "没有聚合观测时不补写数值。",
      evidence: [],
      matchedBy: `metric_definition:${definition.metric_key}`,
    };
  }
  const waves = Array.from(new Set(observations.map((row) => row.wave))).sort();
  const latestWave = waves.at(-1)!;
  const latest = observations.filter((row) => row.wave === latestWave).sort((a, b) => b.value - a.value);
  const lenovoSeries = observations.filter((row) => /联想|Lenovo/i.test(row.segment_value)).sort((a, b) => a.wave.localeCompare(b.wave));
  const headline = lenovoSeries.length
    ? `${latestWave}联想为 ${lenovoSeries.at(-1)!.value.toFixed(1)}%；跨期为${lenovoSeries.map((row) => `${row.wave} ${row.value.toFixed(1)}%`).join("、")}。`
    : `${latestWave}占比最高的选项为${latest[0].segment_value}，${latest[0].value.toFixed(1)}%。`;
  return {
    title: `${definition.question} · ${definition.name}`,
    answer: `${definition.audience}：${headline}`,
    points: [
      `最新一期Base N=${latest[0].base_unweighted?.toLocaleString()}；指标覆盖${definition.wave_count}期。`,
      ...latest.slice(0, 4).map((row) => `${row.segment_value} ${row.value.toFixed(1)}%`),
      `模型用途：${definition.model_readiness_note ?? "按指标定义使用"}`,
    ],
    sources: [`${definition.source_project} · ${definition.question} · ${waves.join(" / ")}`],
    boundary: [...definition.blocked_uses, "跨期解释前仍需核对样本框、配额、权重与选项变化。"].join("；"),
    evidence: latest.slice(0, 5).map((row) => ({ label: row.segment_value, value: `${row.value.toFixed(1)}%`, source: `${latestWave} · N=${row.base_unweighted?.toLocaleString()}` })),
    matchedBy: `historical_metric:${definition.metric_key}`,
  };
}

function genericMetricAnswer(query: string): Answer | null {
  const terms = query.replace(/[，。？！、]/g, " ").split(/\s+/).filter((term) => term.length >= 2);
  const matches = index.aipc_overall_aggregates
    .map((row) => ({ row, score: terms.reduce((sum, term) => sum + (`${row.option_label}${row.metric_key}`.includes(term) ? term.length : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.row.value - a.row.value)
    .slice(0, 5);
  if (!matches.length) return null;
  const first = matches[0].row;
  return {
    title: `已找到与问题相关的${matches.length}条W2聚合证据`,
    answer: `${first.option_label}为 ${first.value.toFixed(1)}%，未加权Base N=${first.base_unweighted.toLocaleString()}。`,
    points: matches.slice(1).map(({ row }) => `${row.option_label} ${row.value.toFixed(1)}%（N=${row.base_unweighted.toLocaleString()}）`),
    sources: Array.from(new Set(matches.map(({ row }) => `${row.project} · ${row.wave} · ${row.metric_key}`))),
    boundary: "这是总体未加权问卷比例；如需因果、销量或人群外推，需要相应研究设计、权重和真实结果。",
    evidence: matches.map(({ row }) => ({ label: row.option_label, value: `${row.value.toFixed(1)}%`, source: `${row.wave} · N=${row.base_unweighted.toLocaleString()} · ${row.analysis_unit}` })),
    matchedBy: "aggregate_keyword_retrieval",
  };
}

function answer(query: string): Answer {
  const q14NeedsComparabilityDiagnosis = /Q14/i.test(query) && /为什么|配额|跨期|可比|50%|需求下降|样本结构|样本框|预测/.test(query);
  if (q14NeedsComparabilityDiagnosis || (!/\bQ\d+/i.test(query) && /配额|跨期可比|样本结构|样本框/.test(query))) return driftAnswer();
  const metricDefinition = metricDefinitionAnswer(query);
  if (/\bQ\d+/i.test(query) && metricDefinition) return metricDefinition;
  const platformMetric = platformMetricAnswer(query);
  if (platformMetric && /AI\s*PC|AIPC|采购考虑|采购因素|选型因素|FY26|26 Jun/i.test(query)) return platformMetric;
  if (/下一期|W3|tracking|Tracking|验证设计|怎么验证/.test(query)) return decisionAnswer("aipc_next_wave_design");
  if (/线上|线下|渠道|电商|进店/.test(query)) return decisionAnswer("aipc_channel_role");
  if (/门店|销售|讲解|转化|体验改进|先改/.test(query)) return decisionAnswer("aipc_store_conversion");
  if (/功能|产品表达|突出什么|演示|AI信息处理/.test(query)) return decisionAnswer("aipc_product_story");
  if (/价格|预算|弹性|售价|接受/.test(query)) return priceAnswer();
  if (/人群|年龄|性别|收入|城市|细分|哪类/.test(query)) return segmentAnswer();
  if (/模型|预测|准确|AUC|驱动|因素/.test(query)) return modelAnswer();
  if (/认知|美誉|品牌|联想|华为|戴尔/.test(query)) return brandAnswer();
  return metricDefinition ?? genericMetricAnswer(query) ?? {
    title: "当前证据库没有足够信息回答这个问题",
    answer: "请把问题落到已登记的市场、品牌、人群、产品功能、价格、渠道、门店体验或下一期验证对象。",
    points: ["例如：门店转化先改什么？", "Q14为什么不能直接跨期预测？", "哪类人群购买意向更高？"],
    sources: ["PC / AI PC指标字典", "研究证据索引"],
    boundary: "系统不会在未检索到证据时补写数字或结论。",
    evidence: [],
    matchedBy: "no_supported_evidence",
  };
}

export async function POST(request: Request) {
  let query = "";
  try {
    const body = await request.json() as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  } catch {
    return Response.json({ error: "请求内容不是有效JSON" }, { status: 400 });
  }
  if (!query) return Response.json({ error: "请输入研究问题" }, { status: 400 });
  return Response.json({ mode: "local-evidence-retrieval", query, answer: answer(query), index: index.meta });
}
