# 问真锁定规则与验收基线

本文档是当前八字排盘算法的锁定口径。后续算法、测试、前端展示均以本文件和 `scripts/test-cases.js` 为准。

## 锁定规则

```js
const RULES = {
  changeYearBy: 'liching_exact_time',
  changeMonthBy: 'jie_exact_time',
  changeDayBy: 'zi_shi_start_23',
  ziShiRule: 'no_early_late',
  defaultTrueSolarTime: false,
  defaultDST: false,
  defaultEarlyLateZi: false,
  defaultLongitude: 120.0,
  defaultLatitude: 39.0
}
```

## 执行纪律

- 不再通过反向遍历、搜索输入来凑测试结果。
- 不再猜测流派规则。
- 先统一规则和测试基线，再改核心算法。
- 核心算法先通过 `scripts/test-cases.js` 的 11 个问真基线用例，再继续扩展普通样例和前端。

## 当前验收基线

- 基线文件：`scripts/test-cases.js`
- 验证入口：`node scripts/verify.js`
- 覆盖范围：普通日期、夜子时、早子时、立春前后、惊蛰前后、中国夏令时、真太阳时。

## 后续补充

- 追加 19 个 1950-2010 年普通日期样例。
- 普通样例必须覆盖 0-23 点所有时辰。
- 普通样例不能替代 11 个问真锁定边界用例。
