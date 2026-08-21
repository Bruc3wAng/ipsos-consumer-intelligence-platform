"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import workbenchJson from "../../output/packaged-food-beverage/snack-project-workbench.json";
import { buildSnackProjectPreview } from "../lib/snackProjectGenerator";

type Locale = "zh" | "en";
type Objective = "concept" | "pricing" | "channel" | "tracking";
type TeamId = "research" | "consulting" | "combined";
type OutputTab = "questionnaire" | "collection" | "kpi" | "model" | "insight";

const CHART_DIMENSION = { width: 800, height: 320 };
const SAMPLE_OPTIONS = [2000, 5000, 10000];
const CATEGORY_OPTIONS = ["薄脆饼干", "膨化食品", "坚果炒货", "多品类零食"];
const MARKET_OPTIONS = ["中国", "中国 + 海外重点市场", "海外重点市场"];

const OBJECTIVE_EN: Record<Objective, string> = {
  concept: "Concept & positioning",
  pricing: "Pricing & configuration",
  channel: "Channel & shelf",
  tracking: "Consumer tracking",
};

function tr(locale: Locale, zh: string, en: string) {
  return locale === "zh" ? zh : en;
}

function fmt(value: number, digits = 1) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function downloadPlan(payload: object) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "零食项目研究方案-案例.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadQuestionnaire(rows: Array<{ id: string; layer: string; question: string; kpi: string; modelRole: string }>) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [
    ["题号", "层级", "题目", "进入指标", "进入模型"],
    ...rows.map((row) => [row.id, row.layer, row.question, row.kpi, row.modelRole]),
  ].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "零食项目问卷结构-案例.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SnackProjectWorkbench({ locale }: { locale: Locale }) {
  const [category, setCategory] = useState("薄脆饼干");
  const [market, setMarket] = useState("中国");
  const [objective, setObjective] = useState<Objective>("concept");
  const [sampleN, setSampleN] = useState(5000);
  const [teamId, setTeamId] = useState<TeamId>("combined");
  const [expertId, setExpertId] = useState("EXP-RW");
  const [outputTab, setOutputTab] = useState<OutputTab>("questionnaire");

  const objectiveConfig = workbenchJson.custom_modules.find((row) => row.objective === objective) ?? workbenchJson.custom_modules[0];
  const team = workbenchJson.service_teams.find((row) => row.team_id === teamId) ?? workbenchJson.service_teams[0];
  const expert = workbenchJson.experts.find((row) => row.expert_id === expertId) ?? workbenchJson.experts[0];
  const poolAfter = workbenchJson.sample_pool.before_project_n + sampleN;
  const projectShare = sampleN / poolAfter * 100;
  const buyerBase = Math.round(sampleN * workbenchJson.sample_pool.buyer_effective_base / workbenchJson.sample_pool.project_contribution_n);
  const choiceTasks = sampleN * objectiveConfig.dce_tasks_per_person;
  const sampleLadder = useMemo(() => workbenchJson.model_results.sample_ladder.map((row) => ({
    ...row,
    sample: `N=${row.project_n.toLocaleString()}`,
    项目独立模型: row.project_only_auc * 100,
    通用先验与项目专属: row.common_plus_custom_auc * 100,
  })), []);
  const activeModel = workbenchJson.model_results.comparison[2];
  const activeRegistry = workbenchJson.case_registry.map((row) => row.case_id === "SIM-CRACKER-CONCEPT" ? { ...row, sample_n: sampleN, name: `${category}${objectiveConfig.name}` } : row);

  const generatedPlan = {
    data_status: "模拟项目方案",
    category,
    market,
    objective: objectiveConfig.name,
    sample_n: sampleN,
    common_metric_coverage: `${objectiveConfig.common_metrics}/16`,
    custom_variables: objectiveConfig.custom_variables,
    choice_tasks: choiceTasks,
    primary_model: objectiveConfig.primary_model,
    service_team: team.name,
    selected_expert: expert.name,
    deliverables: team.deliverables,
    boundary: workbenchJson.meta.boundary,
  };
  const projectPreview = useMemo(() => buildSnackProjectPreview({
    category,
    market,
    objective,
    sampleN,
    commonMetricCount: objectiveConfig.common_metrics,
    customVariables: objectiveConfig.custom_variables,
    dceTasksPerPerson: objectiveConfig.dce_tasks_per_person,
    primaryModel: objectiveConfig.primary_model,
  }), [category, market, objective, sampleN, objectiveConfig]);

  return <div className="project-workbench-shell">
    <section className="project-workbench-hero">
      <div>
        <span>COMMON MODEL × CUSTOM PROJECT</span>
        <h1>{tr(locale, "通用样本扩大模型基础，项目专属研究回答产品问题", "A shared sample base strengthens models; custom research answers the product question")}</h1>
        <p>{tr(locale, "通用核心题形成跨项目可比样本，专属题目与实验变量匹配产品定位。两者在同一项目方案中组合，但数据口径和使用边界保持清晰。", "Shared core questions create comparable samples across projects, while custom questions and experiments fit the product proposition. Both work in one plan with clear boundaries.")}</p>
      </div>
      <aside>
        <span>{tr(locale, "通用样本池", "Common sample pool")}</span>
        <strong>N={poolAfter.toLocaleString()}</strong>
        <small>{workbenchJson.sample_pool.case_count_before + 1} {tr(locale, "个案例项目", "case projects")}</small>
      </aside>
    </section>

    <section className="project-configurator">
      <header>
        <div><span>PROJECT CONFIGURATOR</span><h2>{tr(locale, "配置一个项目，立即看到样本、模型与服务方案", "Configure a project and see its sample, model and service plan")}</h2></div>
        <b>{tr(locale, "案例预览", "Case preview")}</b>
      </header>
      <div className="project-config-grid">
        <label><span>{tr(locale, "品类", "Category")}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>{tr(locale, "市场", "Market")}</span><select value={market} onChange={(event) => setMarket(event.target.value)}>{MARKET_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>{tr(locale, "研究任务", "Research task")}</span><select value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>{workbenchJson.custom_modules.map((item) => <option key={item.objective} value={item.objective}>{locale === "zh" ? item.name : OBJECTIVE_EN[item.objective as Objective]}</option>)}</select></label>
        <div className="project-sample-control"><span>{tr(locale, "项目样本", "Project sample")}</span><div>{SAMPLE_OPTIONS.map((value) => <button key={value} className={sampleN === value ? "active" : ""} onClick={() => setSampleN(value)}>N={value.toLocaleString()}</button>)}</div></div>
      </div>
    </section>

    <section className="project-contribution-strip">
      <article><span>{tr(locale, "原有通用样本", "Existing common sample")}</span><strong>{workbenchJson.sample_pool.before_project_n.toLocaleString()}</strong><small>{workbenchJson.sample_pool.case_count_before} {tr(locale, "个案例项目", "case projects")}</small></article>
      <article className="active"><span>{tr(locale, "本项目贡献", "Project contribution")}</span><strong>+{sampleN.toLocaleString()}</strong><small>{fmt(projectShare)}% {tr(locale, "更新后样本占比", "of the updated pool")}</small></article>
      <article><span>{tr(locale, "通用指标覆盖", "Common metric coverage")}</span><strong>{objectiveConfig.common_metrics}/16</strong><small>{tr(locale, "统一ID、Base与口径", "aligned ID, base and definition")}</small></article>
      <article><span>{tr(locale, "购买者有效Base", "Buyer effective base")}</span><strong>{buyerBase.toLocaleString()}</strong><small>{tr(locale, "进入频次与渠道模型", "enters frequency and channel models")}</small></article>
      <article><span>{tr(locale, "选择任务贡献", "Choice-task contribution")}</span><strong>{choiceTasks.toLocaleString()}</strong><small>{objectiveConfig.dce_tasks_per_person ? `${objectiveConfig.dce_tasks_per_person} ${tr(locale, "组/人", "tasks/person")}` : tr(locale, "本任务不调用DCE", "DCE not used")}</small></article>
    </section>

    <section className="project-pool-card">
      <header><div><span>SAMPLE POOL</span><h3>{tr(locale, "每个项目如何构成通用样本基础", "How each project contributes to the common sample base")}</h3></div><b>N={poolAfter.toLocaleString()} · {tr(locale, "案例池", "case pool")}</b></header>
      <div className="project-pool-band">{activeRegistry.map((row, index) => <div key={row.case_id} style={{ width: `${row.sample_n / poolAfter * 100}%` }} className={index === activeRegistry.length - 1 ? "current" : ""}><span>{row.sample_n.toLocaleString()}</span></div>)}</div>
      <div className="project-pool-legend">{activeRegistry.map((row, index) => <div key={row.case_id}><i className={index === activeRegistry.length - 1 ? "current" : ""} /><span>{row.name}</span><b>N={row.sample_n.toLocaleString()}</b></div>)}</div>
      <footer>{tr(locale, "通用池只保留统一核心字段；产品概念、配方和项目专属变量不进入跨项目明细池。", "Only aligned core fields enter the common pool; proprietary concepts, formulations and custom variables stay in the project space.")}</footer>
    </section>

    <section className="project-grid two">
      <article className="project-chart-panel">
        <header><div><span>SAMPLE × MODEL</span><h3>{tr(locale, "通用先验在小样本阶段降低波动", "The common prior reduces volatility at smaller project samples")}</h3><p>{tr(locale, "薄脆饼干案例固定30%留出；纵轴为AUC（%）", "Cracker case with a fixed 30% holdout; y-axis is AUC (%)")}</p></div></header>
        <div className="project-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={CHART_DIMENSION}><BarChart data={sampleLadder} margin={{ top: 18, right: 20, bottom: 16, left: 8 }}><CartesianGrid stroke="#e4e8ef" vertical={false} /><XAxis dataKey="sample" tick={{ fontSize: 9 }} /><YAxis domain={[65, 72]} unit="%" tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="项目独立模型" fill="#9ba6bb" /><Bar dataKey="通用先验与项目专属" fill="#263aa5" /></BarChart></ResponsiveContainer></div>
        <footer>{tr(locale, `N=300时，组合模型AUC为${fmt(sampleLadder[0].通用先验与项目专属)}%，重复抽样波动从${fmt(workbenchJson.model_results.sample_ladder[0].project_only_sd * 100)}降至${fmt(workbenchJson.model_results.sample_ladder[0].common_plus_custom_sd * 100)}个百分点。项目样本扩大后，专属数据逐步主导。`, `At N=300, the combined model reaches ${fmt(sampleLadder[0].通用先验与项目专属)}% AUC and reduces repeated-sample volatility. Custom project evidence increasingly dominates as N grows.`)}</footer>
      </article>

      <article className="project-model-readout">
        <header><span>MODEL OUTPUT</span><h3>{tr(locale, "通用层提供起点，专属层完成产品校准", "The common layer provides the starting point; the custom layer calibrates the product")}</h3></header>
        <div>{workbenchJson.model_results.comparison.map((row, index) => <article key={row.model} className={index === 2 ? "active" : ""}><span>0{index + 1}</span><h4>{row.model}</h4><strong>AUC {fmt(row.auc, 3)}</strong><b>Brier {fmt(row.brier, 3)}</b><p>{row.inputs}</p></article>)}</div>
        <footer><b>{tr(locale, "本项目模型", "Project model")}</b><strong>{activeModel.model}</strong><p>{objectiveConfig.primary_model}</p></footer>
      </article>
    </section>

    <section className="project-module-system">
      <header><div><span>QUESTIONNAIRE & METRIC SYSTEM</span><h3>{tr(locale, "通用核心保持可比，项目专属匹配产品定位", "Shared core stays comparable; custom modules fit the product proposition")}</h3></div><aside><b>{objectiveConfig.common_metrics} {tr(locale, "项通用指标", "common metrics")}</b><b>{objectiveConfig.custom_questions} {tr(locale, "道专属问题", "custom questions")}</b></aside></header>
      <div className="project-module-columns">
        <article><h4>{tr(locale, "通用核心", "Shared core")}</h4>{workbenchJson.common_modules.map((row) => <div key={row.module}><span>{row.module}</span><b>{row.questions}</b><p>{row.sample_role}</p></div>)}</article>
        <article className="custom"><h4>{tr(locale, `${category} · ${objectiveConfig.name}`, `${category} · ${OBJECTIVE_EN[objective]}`)}</h4><div className="custom-model"><span>{tr(locale, "主模型", "Primary model")}</span><strong>{objectiveConfig.primary_model}</strong></div>{objectiveConfig.custom_variables.map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b><p>{tr(locale, "只用于本项目产品定位与情景测试", "Used only for this project's positioning and scenarios")}</p></div>)}</article>
      </div>
    </section>

    <section className="project-output-system">
      <header>
        <div><span>PROJECT OUTPUT</span><h3>{tr(locale, "当前配置直接生成问卷、样本结构、KPI、模型与决策输出", "The current configuration generates the questionnaire, sample structure, KPIs, model and decision output")}</h3></div>
        <b>{tr(locale, "案例产品配置", "Case product configuration")}</b>
      </header>
      <nav>{([
        ["questionnaire", tr(locale, "01 问卷", "01 Questionnaire")],
        ["collection", tr(locale, "02 样本回收", "02 Fieldwork")],
        ["kpi", "03 KPI"],
        ["model", tr(locale, "04 模型", "04 Model")],
        ["insight", tr(locale, "05 决策输出", "05 Decision output")],
      ] as Array<[OutputTab, string]>).map(([id, label]) => <button key={id} className={outputTab === id ? "active" : ""} onClick={() => setOutputTab(id)}>{label}</button>)}</nav>

      {outputTab === "questionnaire" && <div className="project-questionnaire-output">
        <div className="head"><span>{tr(locale, "题号 / 层级", "ID / layer")}</span><span>{tr(locale, "题目", "Question")}</span><span>{tr(locale, "进入指标", "KPI linkage")}</span><span>{tr(locale, "进入模型", "Model role")}</span></div>
        {projectPreview.questionnaire.map((row) => <div key={row.id}><span><b>{row.id}</b><small>{row.layer}</small></span><p>{row.question}</p><span>{row.kpi}</span><span>{row.modelRole}</span></div>)}
        <footer><span>{projectPreview.questionnaire.length} {tr(locale, "个题组；随上方项目配置同步变化", "question blocks; synchronized with the project configuration")}</span><button onClick={() => downloadQuestionnaire(projectPreview.questionnaire)}>{tr(locale, "下载当前问卷结构", "Download questionnaire structure")}</button></footer>
      </div>}

      {outputTab === "collection" && <div className="project-collection-output">
        <article><span>{tr(locale, "完成样本", "Completed sample")}</span><strong>N={projectPreview.collection.completedN.toLocaleString()}</strong><small>{market}</small></article>
        <article><span>{tr(locale, "购买者有效Base", "Buyer effective base")}</span><strong>{projectPreview.collection.buyerBase.toLocaleString()}</strong><small>59.3% {tr(locale, "购买者发生率", "buyer incidence")}</small></article>
        <article><span>{tr(locale, "选择任务记录", "Choice-task rows")}</span><strong>{projectPreview.collection.dceChoiceRows.toLocaleString()}</strong><small>{objectiveConfig.dce_tasks_per_person || 0} {tr(locale, "组/人", "tasks/person")}</small></article>
        <article><span>95% {tr(locale, "总体抽样误差参考", "overall sampling-error reference")}</span><strong>±{projectPreview.collection.marginOfError95Pp} pp</strong><small>{tr(locale, "简单随机抽样上限参考", "simple-random-sample reference")}</small></article>
        <footer>{tr(locale, "当前案例用于验证数据结构、Base和模型接口；正式项目需接入配额、加权、质量控制与实际回收数据。", "This case validates structure, bases and model interfaces; a live study requires quotas, weighting, quality control and observed responses.")}</footer>
      </div>}

      {outputTab === "kpi" && <div className="project-kpi-output">
        {projectPreview.kpis.map((row, index) => <article key={row.name}><span>0{index + 1}</span><h4>{row.name}</h4><strong>{row.value}</strong><p>{row.definition}</p></article>)}
        <footer><b>{tr(locale, "案例值", "Case values")}</b><span>{tr(locale, "指标名称、Base和口径与当前研究任务对应；正式项目由实际问卷数据计算。", "Metric name, base and definition follow the current task; live values are calculated from observed survey data.")}</span></footer>
      </div>}

      {outputTab === "model" && <div className="project-generated-model">
        <aside><span>{tr(locale, "推荐主模型", "Recommended primary model")}</span><h4>{projectPreview.model.name}</h4><b>{tr(locale, "目标变量", "Target")}</b><p>{projectPreview.model.target}</p></aside>
        <main><div><span>{tr(locale, "留出集AUC", "Holdout AUC")}</span><strong>{fmt(projectPreview.model.simulatedHoldoutAuc, 3)}</strong><small>30% holdout</small></div><article><span>{tr(locale, "模型回答什么", "What the model answers")}</span><p>{projectPreview.model.answer}</p></article></main>
        <footer>{projectPreview.model.evidence.map((item) => <b key={item}>{item}</b>)}</footer>
      </div>}

      {outputTab === "insight" && <div className="project-decision-output">
        <div><span>{tr(locale, "本次可交付论点", "Decision statement")}</span><h3>{projectPreview.decision.headline}</h3><p>{projectPreview.model.answer}</p></div>
        <article><span>{tr(locale, "下一步验证", "Next validation")}</span><strong>{projectPreview.decision.nextAction}</strong></article>
        <footer>{projectPreview.decision.boundary}</footer>
      </div>}
    </section>

    <section className="project-service-system">
      <header><div><span>TEAM & EXPERT SERVICE</span><h3>{tr(locale, "团队和专家直接进入项目节点", "Teams and experts join specific project stages")}</h3></div><button onClick={() => downloadPlan({ ...generatedPlan, project_output: projectPreview })}>{tr(locale, "下载项目方案", "Download project plan")}</button></header>
      <div className="project-service-grid">
        <aside>{workbenchJson.service_teams.map((row) => <button key={row.team_id} className={teamId === row.team_id ? "active" : ""} onClick={() => setTeamId(row.team_id as TeamId)}><span>{row.name}</span><p>{row.best_for}</p></button>)}</aside>
        <main>
          <div className="team-summary"><span>{team.name}</span><strong>{team.roles.join(" · ")}</strong><p>{team.deliverables.join("、")}</p></div>
          <div className="expert-selector"><span>{tr(locale, "项目专家", "Project expert")}</span><select value={expertId} onChange={(event) => setExpertId(event.target.value)}>{workbenchJson.experts.map((row) => <option key={row.expert_id} value={row.expert_id}>{row.name}</option>)}</select></div>
          <article className="expert-profile">
            <div className="expert-avatar">{expert.expert_id === "EXP-RW" ? "RW" : "EX"}</div>
            <div><span>{expert.title}</span><h4>{expert.name}</h4><p>{expert.focus.join(" · ")}</p><b>{expert.status}</b></div>
          </article>
          <div className="expert-evidence"><article><span>{tr(locale, "相关研究经验", "Relevant experience")}</span>{expert.experience.map((item) => <b key={item}>{item}</b>)}</article><article><span>{tr(locale, "参与节点", "Touchpoints")}</span>{expert.touchpoints.map((item) => <b key={item}>{item}</b>)}</article></div>
        </main>
      </div>
    </section>

    <section className="project-workflow">
      <header><span>DELIVERY WORKFLOW</span><h3>{tr(locale, "从业务问题到模型与产品建议", "From business question to model-backed product action")}</h3></header>
      <div>{workbenchJson.workflow.map((row, index) => <article key={row.stage}><span>0{index + 1}</span><h4>{row.stage}</h4><b>{row.owner}</b><p>{row.output}</p></article>)}</div>
      <footer><div>{workbenchJson.delivery_package.map((item) => <b key={item}>✓ {item}</b>)}</div><a href="/downloads/snack-project-workbench.json" download>{tr(locale, "下载体系数据", "Download system data")}</a><a href="/downloads/snack-common-simulated-pool.csv" download>{tr(locale, "下载通用案例样本池", "Download common case pool")}</a></footer>
    </section>
  </div>;
}
