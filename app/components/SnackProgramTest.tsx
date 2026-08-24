"use client";

import { useMemo, useState } from "react";
import { publicAssetPath } from "../lib/publicRuntime";

const TEST_CASES = [
  { id: "PT-01", name: "合格样本主路径", input: "25–34岁；近3个月购买过膨化食品", expected: "通过甄别并进入主问卷", fields: "S1=2 · S4=1 · STATUS=MAIN" },
  { id: "PT-02", name: "甄别终止路径", input: "近3个月未购买膨化食品", expected: "按S4逻辑终止，不进入主问卷", fields: "S4=2 · STATUS=SCREENOUT" },
  { id: "PT-03", name: "概念随机分组", input: "固定测试种子 PROGRAM-V2-R1-03", expected: "进入概念B组，页面与Raw组别一致", fields: "CELL=B · PJT_CONCEPT_01=B" },
  { id: "PT-04", name: "完成与字段回传", input: "完成全部必答题并提交", expected: "生成完成状态及核心字段", fields: "STATUS=COMPLETE · Q1/Q8/Q9/Q10非空" },
] as const;

export default function SnackProgramTest() {
  const [passed, setPassed] = useState<string[]>([]);
  const passedCount = passed.length;
  const allPassed = passedCount === TEST_CASES.length;
  const status = useMemo(() => allPassed ? "4/4 测试通过" : `${passedCount}/4 已验证`, [allPassed, passedCount]);
  const runCase = (id: string) => setPassed((current) => current.includes(id) ? current : [...current, id]);

  return <main className="program-test-shell">
    <header className="program-test-topbar">
      <a href={publicAssetPath("/packaged-food-beverage/")}>Ipsos Consumer Intelligence</a>
      <span>PROGRAM TEST · PROGRAM-V2-R1</span>
    </header>
    <section className="program-test-hero">
      <div><span>固定程序测试入口</span><h1>中国薄脆饼干新品概念与定价研究</h1><p>逐项验证甄别、跳转、随机分组和完成回传；本入口不计入正式回收。</p></div>
      <aside className={allPassed ? "passed" : ""}><small>测试状态</small><strong>{status}</strong><em>{allPassed ? "可返回执行工作台进入DE检查" : "运行四个固定案例后确认程序测试"}</em></aside>
    </section>
    <section className="program-test-version">
      <article><span>设计版本</span><strong>V2-R1</strong></article>
      <article><span>问卷版本</span><strong>FINAL-R1</strong></article>
      <article><span>配额方式</span><strong>核心交叉配额</strong></article>
      <article><span>目标样本</span><strong>N=5,000</strong></article>
    </section>
    <section className="program-test-board">
      <header><div><span>TEST MATRIX</span><h2>程序测试案例</h2></div><button type="button" onClick={() => setPassed(TEST_CASES.map((item) => item.id))}>运行全部固定案例</button></header>
      <div className="program-test-table">
        <div className="head"><span>案例</span><span>测试输入</span><span>预期结果</span><span>字段核对</span><span>状态</span></div>
        {TEST_CASES.map((item) => {
          const isPassed = passed.includes(item.id);
          return <div key={item.id} className={isPassed ? "passed" : ""}>
            <span><b>{item.id}</b><strong>{item.name}</strong></span>
            <span>{item.input}</span><span>{item.expected}</span><code>{item.fields}</code>
            <button type="button" onClick={() => runCase(item.id)}>{isPassed ? "通过" : "执行测试"}</button>
          </div>;
        })}
      </div>
      <footer><button type="button" onClick={() => setPassed([])}>重新测试</button><a href={publicAssetPath("/packaged-food-beverage/")}>返回项目执行工作台</a></footer>
    </section>
  </main>;
}
