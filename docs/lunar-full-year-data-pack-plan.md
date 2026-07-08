# 2023 完整年份农历 data-pack 接入计划

## 当前状态

当前农历 data-pack 仍是 `acceptance-seed`，只包含 BZI-005 和 BZI-006 两条验收种子记录。它已经具备以下护栏：

- `manifest.json` 作为 data-pack 总入口。
- `lunarDataPack` 作为读取层。
- `calendarAdapter` 只消费读取结果或结构化错误。
- `scripts/validate-lunar-data-pack.js` 负责 schema、coverage、跨包唯一性、provenance 和 checksum 体检。
- `scripts/validate-bazi-acceptance.js` 先跑 data-pack 体检，再跑八字验收样例。

下一步目标是为 `lunar-conversions-2023-full.json` 做接入边界，不在本轮填充未经确认的全年数据。

## full 包文件边界

建议新增文件：

```text
code/data-packs/lunar/lunar-conversions-2023-full.json
```

full 包必须保持现有 data-pack schema，并额外满足：

- `dataPackId`: 建议为 `lunar-conversions-2023-full`。
- `calendarDataVersion`: 必须升级，不能继续沿用 seed 版本。
- `status`: 建议先用 `draft` 或 `verified-full-year`，由数据负责人确认。
- `coverage.years`: 必须为 `[2023]`。
- `coverage.scope`: 必须说明是完整 2023 农历年转换记录，还是完整公历 2023 年涉及的农历日期范围。
- `coverage.completeLunarCalendar`: 完整年份包上线时必须为 `true`。
- `authoritySource`: 必须指向确认过的权威来源或生成来源。
- `sourceLedger`: 必须记录来源名称、来源版本、获取时间和说明。
- `generatedAt`: 必须是 ISO 时间。
- `generatedBy`: 必须说明生成脚本、人工流程或数据负责人。
- `recordsChecksum`: 必须使用 `sha256`，并只覆盖 `records`。
- `records`: 只放农历转公历记录，不放节气、真太阳时、大运或流派规则。

记录字段继续保持：

```json
{
  "caseId": "LUNAR-2023-001",
  "lunarYear": 2023,
  "lunarMonth": 1,
  "lunarDay": 1,
  "isLeapMonth": false,
  "solarDate": "2023-01-22",
  "sourceNote": "Source and verification note"
}
```

## manifest 替换策略

seed 包和 full 包不能同时 active 覆盖同一农历日期。接入 full 包时必须二选一：

1. 替换策略：从 `manifest.packs` 移除 `lunar-conversions-2023`，新增 `lunar-conversions-2023-full`。
2. 归档策略：保留 seed 文件在仓库中，但不登记到 `manifest.packs`，只作为历史验收参考。

推荐采用替换策略，让运行时只看到 full 包：

```json
{
  "dataPackId": "lunar-conversions-2023-full",
  "path": "lunar-conversions-2023-full.json",
  "years": [2023],
  "completeLunarCalendar": true
}
```

不允许出现：

```text
manifest.packs 同时登记 lunar-conversions-2023 和 lunar-conversions-2023-full
```

原因：现有体检脚本会检查跨包农历日期唯一性，seed 与 full 同时 active 会触发重复记录，也会让运行时读取优先级变得含糊。

## checksum 流程

checksum 继续只覆盖 `records`，不覆盖 `generatedAt`、`generatedBy`、`sourceLedger`、`authoritySource` 等元信息。

规则保持与 `scripts/validate-lunar-data-pack.js` 一致：

```text
canonicalize(records)
JSON.stringify(canonicalRecords)
sha256
```

接入 full 包时，生成流程应是：

1. 生成或整理 `records`。
2. 按体检脚本相同规则计算 `recordsChecksum.value`。
3. 写入 `recordsChecksum`。
4. 运行 `node scripts/validate-lunar-data-pack.js`。
5. 再运行 `node scripts/validate-bazi-acceptance.js`。

## 验收样例扩容规则

BZI-005 和 BZI-006 继续作为 seed 回归样例保留，但 full 包接入时至少新增以下样例：

- 正月初一：验证农历年起点。
- 年末腊月：验证农历年末边界。
- 闰月样例：验证 `isLeapMonth=true`。
- 普通月份边界：验证月初和月末。
- 每季度至少 1 个样例：覆盖全年不同位置。
- full 包外日期样例：确认非覆盖年份仍结构化报错。

每个新增样例必须记录：

- 样例编号。
- 来源。
- 农历年月日。
- 是否闰月。
- 转换后公历日期。
- data-pack 版本。
- 转换来源。
- 期望四柱。
- 复核状态。

验收样例只证明样例覆盖点正确，不单独证明 full 包所有记录权威。完整包仍必须依赖来源追溯、checksum 和数据生成流程。

## 文件禁区

本轮以及 full 包接入前，不应修改：

- `code/utils/mock.js`
- `code/utils/bazi/calendarAdapter.js`
- `code/pages/**`
- `code/utils/baziPlate.js`

full 包接入时，原则上只允许修改：

- `code/data-packs/lunar/manifest.json`
- `code/data-packs/lunar/lunar-conversions-2023-full.json`
- `code/utils/bazi/lunarDataPack.js` 的可加载 JSON 登记
- `scripts/validate-lunar-data-pack.test.js` 的 full 包护栏样例
- `scripts/validate-bazi-acceptance.js` 的新增验收样例
- `docs/**` 的说明和验收记录

## 阻塞点

完整年份包当前被以下事项阻塞：

- 权威来源未确认。
- 数据生成方式未确认。
- 2023 全年记录数量和覆盖定义未确认。
- full 包版本号未确认。
- 新增验收样例的期望四柱需要第二来源复核。

在这些事项确认前，不能填充看似完整的 2023 全年数据。

## 给总指挥建议

PR #18 保持为设计 PR，不生成假 full 包。下一轮可以拆成两个并行任务：

- 数据线程：确认权威来源、生成流程、full 包版本号和样例复核来源。
- 模块线程：在来源确认后接入 `lunar-conversions-2023-full.json`，替换 manifest，补 full 包验收样例。

