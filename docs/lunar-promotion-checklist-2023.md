# 2023 农历草案晋级 checklist

本文件说明 `lunar-conversions-2023-full-draft` 从草案走向正式运行数据包前必须满足的条件。

当前结论：样本人工复核已完成，但仍不能晋级 runtime。

原因：

- `runtimeApproval` 仍为 `false`。
- `approvedForRuntime` 仍为 `blocked`。

## 晋级门

| 门 | 当前状态 | 说明 |
| --- | --- | --- |
| source draft data-pack | present | 2023 HKO 草案数据包已存在 |
| review matrix | present | 9 个关键样本已建立 |
| human review ledger | passed | 9 个矩阵样本已按 HKO 2023 CSV 复核通过 |
| approved for runtime | blocked | 未批准进入正式运行 |

## 人工复核台账字段

每个样本必须记录：

- `caseId`
- `reviewStatus`
- `reviewer`
- `reviewedAt`
- `conclusion`
- `evidenceNote`

允许的 `reviewStatus`：

- `pending-human-review`
- `passed`
- `failed`
- `needs-follow-up`

## 晋级规则

只有同时满足以下条件，才允许考虑把草案转为 runtime data-pack：

- 复核矩阵中所有样本都有台账记录。
- 所有样本 `reviewStatus` 都是 `passed`。
- checklist 的 `runtimeApproval` 为 `true`。
- checklist 的 `gates.approvedForRuntime` 为 `passed`。
- 不存在 `pending-human-review`、`failed` 或 `needs-follow-up`。

在此之前，不能向用户承诺完整农历排盘能力。
