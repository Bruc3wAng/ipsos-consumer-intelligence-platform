# Ipsos Consumer Intelligence Platform

面向持续市场研究的消费者洞察与模型平台原型。平台将行业通用数据、客户项目与研究交付串联为一条可追踪链路：

`01 项目启动 → 02 问卷与样本设计 → 03 执行与进度 → 04 数据、Table 与模型 → 05 洞察与交付`

## 当前原型

- 全球行业入口与 TMT 客户项目空间
- 零食消费者与品类决策平台
- 通用 KPI、人群诊断、价格曲线与选择模型
- 可交互问卷工作台：Screener、主问卷、选项、Base 与程序逻辑
- 锁定版本的问卷、配额表与 DP Spec 独立生成
- 回收进度、最终 Raw Data、Count / No sig / Sig Table、模型验证与洞察输出

## 本地运行

需要 Node.js 22.13+ 与 pnpm。

```bash
pnpm install
pnpm dev
```

默认访问：`http://127.0.0.1:3000/packaged-food-beverage`

## 数据范围

仓库只包含原型运行所需的公开校准、聚合指标与案例数据。客户 Raw Data、合同金额文件、本地数据库、质检日志和研究存档不进入仓库。
