# 八字排盘引擎 v0.3.1 版本补丁说明

发布日期：2026-07-04  
版本基准：基于 v0.3.0 稳定状态（边界回归增强补丁）

## 迭代目标

- 增加固定边界样本集合（按问真八字对齐）
- 增加边界自动化验证脚本
- 将边界回归纳入主测试链路（`npm test`）

## 已完成项

1. 新增 `scripts/edge-cases.js`
   - 固定 30 条边界样本（不再做反向搜索/反推输入）
   - 按场景分组：`solar-term-year`、`solar-term-month`、`day-hour`、`summer-time`、`true-solar`
   - `expect` 使用四柱（年/月/日/时）作为验收标准，完全固定化

2. 新增 `scripts/verify-edge.js`
   - 独立执行边界集对照验收，不走兼容分支
   - 输出每条边界用例 PASS/FAIL 与差异明细

3. 更新测试链路 `package.json`
   - `test` 统一跑：
     - `node scripts/unit-test.js`
     - `node scripts/verify.js`
     - `node scripts/verify-edge.js`
     - `node scripts/test-liunian.js`
   - 保留专项脚本：
     - `test:unit`
     - `test:verify`
     - `test:edge`
     - `test:liunian`
     - `test:dayun`

## 验收结果（本次执行）

- Unit Test：66 / 66 通过
- Baseline（`scripts/verify.js`）：42 / 42 通过
- 边界套件（`scripts/verify-edge.js`）：30 / 30 通过
- 流年套件（`scripts/test-liunian.js`）：11 / 11 通过
- 大运套件（`scripts/test-dayun.js`）：通过
- 全部链路无失败用例（0 FAIL）

## 变更风险/关注项

- 边界 `expect` 口径固定于问真八字基线，若上游口径更新，需同步更新样本与版本说明
- 边界样本默认使用精确节气数据包，若未来切换数据源或版本，须全量重放 30 边界 + 42 基线 + 66 单元
- 夏令时、真太阳时、早晚子时、立春/节气边界仍属于高敏感参数，前端开关映射需保持与后端映射完全一致

## 下一步

- 将本次边界套件归档到 `version-tags` 版本目录，便于后续回滚比对
- 继续新增极端年份样本（1900-2100区间内更多高频节气边缘点）并保持同一采样框架
