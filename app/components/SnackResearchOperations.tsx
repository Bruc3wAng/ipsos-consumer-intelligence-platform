"use client";

import { useState } from "react";

type OperationsView = "fieldwork" | "qc" | "data" | "production";

const views: Array<{ id: OperationsView; label: string }> = [
  { id: "fieldwork", label: "01 回收与配额" },
  { id: "qc", label: "02 Raw Data QC" },
  { id: "data", label: "03 清洗与版本" },
  { id: "production", label: "04 Table与模型生产" },
];

const qcRows = [
  ["QC01", "主键重复", "project_id + wave_id + respondent_id唯一", "标记后复核"],
  ["QC02", "访问时长", "按预测试分布与真实路径设置阈值", "多证据判断"],
  ["QC03", "必答与路由", "有效路径必答且不存在跨路径多答", "冲突阻断生产"],
  ["QC04", "互斥与上限", "code99互斥；最多选N不超限", "修正或剔除"],
  ["QC05", "Grid与开放题", "异常同选、无意义文本与重复回答", "人工抽检"],
  ["QC06", "价格与跨题一致性", "价格单调；购买、频次、品牌逻辑一致", "模型前强制处理"],
];

export default function SnackResearchOperations() {
  const [view, setView] = useState<OperationsView>("qc");
  return <main className="research-ops-shell">
    <header className="research-ops-header"><div><span>RESEARCH OPERATIONS</span><h1>中国零食消费者研究</h1><p>研究团队工作区</p></div><aside><strong>V1</strong><span>目标样本 N=5,000</span></aside></header>
    <nav className="research-ops-nav">{views.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
    {view === "fieldwork" && <section className="research-ops-content"><header><span>FIELDWORK CONTROL</span><h2>配额进度与补样动作</h2></header><div className="ops-kpis"><article><span>完成量</span><strong>3,842</strong><small>目标 5,000</small></article><article><span>当前有效</span><strong>3,656</strong><small>待复核 186</small></article><article><span>最低配额单元</span><strong>61.4%</strong><small>45–54岁 · 华中</small></article><article><span>今日补样</span><strong>+214</strong><small>按缺口排序</small></article></div></section>}
    {view === "qc" && <section className="research-ops-content"><header><div><span>RAW DATA QC</span><h2>规则命中、复核与最终纳入</h2></div><a href="/api/research-operations/qc-workbook" download>下载QC工作簿</a></header><div className="ops-qc-table"><header><span>Rule</span><span>检查对象</span><span>判定口径</span><span>处理</span></header>{qcRows.map((row) => <div key={row[0]}><b>{row[0]}</b><strong>{row[1]}</strong><p>{row[2]}</p><span>{row[3]}</span></div>)}</div></section>}
    {view === "data" && <section className="research-ops-content"><header><span>DATA VERSIONING</span><h2>清洗记录与唯一生产版本</h2></header><div className="ops-version-chain"><article><b>raw_v1</b><span>原始回收文件</span><small>只读归档</small></article><i>→</i><article><b>clean_v1</b><span>规则处理与人工复核</span><small>保留变更记录</small></article><i>→</i><article><b>final_v1</b><span>最终纳入样本</span><small>唯一进入Table与模型</small></article></div></section>}
    {view === "production" && <section className="research-ops-content"><header><span>TABLE & MODEL PRODUCTION</span><h2>从final_v1生成Table、KPI与模型输入</h2></header><div className="ops-production-grid"><article><b>01</b><strong>Count</strong><p>未加权Base与人数</p></article><article><b>02</b><strong>No sig</strong><p>百分比、均值、Net与指数</p></article><article><b>03</b><strong>Sig</strong><p>独立、重叠、配对与加权路线</p></article><article><b>04</b><strong>KPI Output</strong><p>通用与项目专项指标</p></article><article><b>05</b><strong>Model Input</strong><p>通用与项目专项字段分流</p></article></div></section>}
  </main>;
}
