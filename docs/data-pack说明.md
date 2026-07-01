# data-pack 说明

本文件记录历法数据包的边界和维护规则。

## 当前版本

- 当前数据包版本：`lunar-data-pack@2026.07.01`
- 当前状态：`acceptance-seed`
- 当前范围：只包含已进入验收脚本的农历/闰月种子样例。
- 当前入口：`code/data-packs/lunar/manifest.json`
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
- `authoritySource`
- `sourceLedger`
- `generatedAt`
- `generatedBy`
- `recordsChecksum`
- `records`

## data-pack 体检脚本

新增或修改农历 data-pack 后，必须运行：

```bash
node scripts/validate-lunar-data-pack.js
```

该脚本会检查：

- `manifest.json` 是否包含版本、状态、包列表和 warnings。
- manifest 登记的每个包文件是否存在。
- 包内 `dataPackId` 和 `calendarDataVersion` 是否与 manifest 对齐。
- 每条记录是否包含必填字段。
- 农历年月日是否为正整数。
- `isLeapMonth` 是否为布尔值。
- `solarDate` 是否为 `YYYY-MM-DD` 且是真实日期。
- 同一个包内是否存在重复农历日期。
- 全部包之间是否存在重复农历日期。
- 全部包之间是否存在重复 `caseId`。
- `manifest.packs[].years` 是否与数据包 `coverage.years` 一致。
- `manifest.packs[].years` 和数据包 `coverage.years` 是否只包含整数年份。
- `manifest.packs[].completeLunarCalendar` 是否与数据包 `coverage.completeLunarCalendar` 一致。
- 数据包 `coverage.completeLunarCalendar` 是否明确写成布尔值。
- 每条记录的 `lunarYear` 是否落在该包声明的 `coverage.years` 内。
- `manifest.packs[].dataPackId` 是否重复。
- `authoritySource` 是否存在。
- `sourceLedger` 是否为非空数组，且每条来源记录包含 `sourceName`、`sourceVersion`、`retrievedAt`、`note`。
- `generatedAt` 和 `sourceLedger[].retrievedAt` 是否为 ISO 时间。
- `generatedBy` 是否存在。
- `recordsChecksum.algorithm` 是否为 `sha256`，且 `recordsChecksum.value` 是否匹配当前 `records` 内容。
- 当数据包 `coverage.completeLunarCalendar` 为 `true` 时，必须额外检查：
  - `sourceLedger` 至少包含两个独立来源。
  - 每条 `sourceLedger` 记录必须包含 `sourceUrl` 和 `rawSourceChecksum`。
  - `rawSourceChecksum.algorithm` 必须为 `sha256`，`rawSourceChecksum.value` 必须为 64 位 sha256 十六进制摘要。
  - `generator` 必须包含 `name`、`version` 和 `inputChecksum`。
  - `reviewLedger` 必须为非空数组，每条记录必须包含复核人、复核时间、复核范围和备注。

当前脚本只负责结构体检，不负责证明数据来源权威。完整年份包上线前，还需要补来源记录、交叉复核和验收样例。

## manifest 注册规则

`manifest.json` 是农历 data-pack 的总入口。新增年份包或样例包时，必须先把包加入 `manifest.packs`，再由 `lunarDataPack` 读取。

`manifest.packs[].runtimeEnabled` 用来控制小程序运行时是否加载该包：

- `runtimeEnabled: true` 或未设置：允许运行时加载。
- `runtimeEnabled: false`：只允许体检、生成、复核，不允许小程序运行时加载。
- `status: draft` 的数据包必须设置 `runtimeEnabled: false`，避免草稿完整包被误当作稳定能力。

当前小程序运行环境仍需要在 `lunarDataPack` 内登记可加载的 JSON 文件路径，但这只是运行时加载限制，不允许把农历记录重新写回 `calendarAdapter`。

验收脚本必须检查：

- `lunarDataPack` 暴露的 coverage 摘要与 `manifest.json` 一致。
- draft 包不能运行时启用。
- 包外农历输入会抛出结构化错误。
- 错误里必须带 `calendarDataVersion`、`status`、`completeLunarCalendar` 和可用包列表。

## 维护规则

- 不再往 `calendarAdapter` 里新增农历白名单。
- 新增农历/闰月样例时，先补 data-pack 记录，再补验收脚本。
- 未经复核的记录必须标记为 seed 或 draft，不能宣传为完整权威数据。
- 当 data-pack 升级为完整年份数据时，必须更新 `coverage.completeLunarCalendar` 和版本号。
- 完整年份包必须先通过来源台账门禁，不能只有 `recordsChecksum`，也不能只有单一来源。
- data-pack 外的农历日期不能静默回退为公历输入，必须明确报错。
