# 八字排盘引擎 v0.3.1 版本交付说明

**交付日期**：2026-07-04
**版本性质**：v0.3.0 后的小修复版本

## 修复内容

1. 修复前端适配层农历模式保持问题：当页面只传 `calendarType: 'lunar'` 或 `calendarMode: 'lunar'` 时，仍会稳定走农历转换路径。
2. 修复 `scripts/test-cases.js` 中四柱期望值乱码，保证干净拉取仓库后验证结果可读、可复核。
3. 新增适配层回归测试，锁定农历输入不会被错误降级为公历输入。

## 验证结果

- `npm.cmd test`：58/58 单元测试通过，42/42 主验证通过。
- `node scripts/test-liunian.js`：11/11 流年流月硬验证通过。
- `node scripts/test-dayun.js`：大运硬验证通过。
- `node scripts/validate-bazi-acceptance.js`：农历输入验收通过。
- `node scripts/validate-lunar-data-pack.js`：1901-2100 农历数据包 73028 条记录通过。

## 边界说明

本版本不新增命理分析功能，只修复 v0.3.0 交付后的适配与验证口径问题。前端同事应拉取最新 `main`，以 v0.3.1 作为当前测试基线。
