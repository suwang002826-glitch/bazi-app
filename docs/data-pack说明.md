# data-pack 说明

本文件记录历法数据包的边界和维护规则。

## 当前版本

- 当前数据包版本：`lunar-data-pack@2026.07.01`
- 当前状态：`acceptance-seed`
- 当前范围：只包含已进入验收脚本的农历/闰月种子样例。
- 当前文件：`code/data-packs/lunar/lunar-conversions-2023.json`

## 当前边界

当前 data-pack 是基础版，不是完整农历库。

它解决的问题是：把农历/闰月转换记录从 `calendarAdapter` 代码白名单中移出，放到独立、可版本化、可追溯的数据文件里。

它暂时不解决：

- 1900-2100 全量农历转换。
- 完整闰月表。
- 权威天文历法数据自动生成。
- 多来源差异比对。
- 真太阳时、节气时刻、大运起运等非农历转换问题。

## 数据记录要求

每条转换记录至少包含：

- `caseId`
- `lunarYear`
- `lunarMonth`
- `lunarDay`
- `isLeapMonth`
- `solarDate`
- `sourceNote`

每个数据包至少包含：

- `dataPackId`
- `calendarDataVersion`
- `source`
- `status`
- `coverage`
- `records`

## 维护规则

- 不再往 `calendarAdapter` 里新增农历白名单。
- 新增农历/闰月样例时，先补 data-pack 记录，再补验收脚本。
- 未经复核的记录必须标记为 seed 或 draft，不能宣传为完整权威数据。
- 当 data-pack 升级为完整年份数据时，必须更新 `coverage.completeLunarCalendar` 和版本号。
