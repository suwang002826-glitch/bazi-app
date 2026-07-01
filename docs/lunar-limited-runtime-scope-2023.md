# 2023 HKO 受限农历 runtime 范围设计

## 当前结论

本文件只定义受限 runtime 的边界，不代表正式启用。

当前状态：

- 受限范围：2023-01-01 至 2023-12-31。
- 数据来源：HKO / 香港天文台 2023 农历开放数据草案包。
- 完整农历能力：否。
- runtime 是否启用：否。
- 是否允许本 PR 注册 manifest：否。

## 为什么不能直接开放完整农历排盘

现在已有的是 2023 公历年范围的数据包、样例复核和审批评审，并不是完整农历历法能力。完整能力至少还需要补齐更多年份、闰月规则、来源记录、独立复核和越界行为。

为了保证排盘系统精准、稳定、专业，本阶段不能把样例级通过说成完整支持。

## 如果后续开放预览，必须显示的用户提示

> 当前仅为 2023 年 HKO / 香港天文台农历数据预览，非完整农历历法能力；超出 2023 年范围的农历输入不会计算。

这句话必须在入口或结果页中可见，不能藏在说明文档里。

## 越界错误要求

超出 2023 年范围时，不允许静默计算，也不允许回退到不明来源算法。

错误码：

```text
LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE
```

错误内容必须至少包含：

```text
inputDate
supportedStartDate
supportedEndDate
completeLunarCalendar
calendarDataVersion
```

## 下一步准入条件

只有满足以下条件，才允许另开 PR 注册受限 runtime：

1. 明确审批结论改为 `approved-for-runtime`。
2. manifest 注册必须单独 PR 审查。
3. UI 提示文案已经准备好。
4. 越界错误结构已经有自动化验证。
5. 仍然明确 `completeLunarCalendar=false`。

## 禁止事项

1. 不得宣称完整农历支持。
2. 不得宣称完整历史转换支持。
3. 不得继续在 `calendarAdapter` 里堆白名单。
4. 不得在本阶段修改正式排盘入口。
5. 不得在没有单独审批的情况下注册 runtime manifest。
