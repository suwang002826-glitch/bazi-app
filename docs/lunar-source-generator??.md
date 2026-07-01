# 农历 data-pack 来源与生成器说明

## 当前目标

先建立完整农历数据包的“来源清单 + dry-run 生成器”骨架，后续再导入真实权威数据并生成正式记录。

## 当前边界

- 只校验来源清单，不生成运行时 records。
- 来源清单必须声明 `manifestKind: "source-scaffold"`。
- 只允许 `status: "draft"`。
- `writesPack` 必须是 `false`。
- `targetRuntimeEnabled` 必须是 `false`。
- 至少需要两份来源记录。
- 每份来源都必须有 `dataProvider`、`datasetName`、`sourceRole`、`resourceFormat`、`landingPageUrl`、`sourceUrl`、`byteLength` 和 `rawSourceChecksum`。
- `rawSourceChecksum.algorithm` 必须是 `sha256`。
- `reviewPolicy.runtimeEnabled` 必须是 `false`。
- `outputPolicy.requiresRecordsChecksum` 必须是 `true`。
- `outputPolicy.requiresRuntimeMirrors` 必须是 `true`。
- `outputPolicy.requiresManualReviewBeforeRuntime` 必须是 `true`。
- 如果来源是同一机构的多格式文件，必须声明 `sourceReviewBoundary.sourceIndependence: "same-provider-multi-format"`，并保持 `independentReviewRequired: true`、`independentReviewStatus: "pending"`。

## 校验命令

```bash
node scripts/generate-lunar-data-pack.js --check --source code/data-packs/lunar/sources/lunar-2023-full-draft.source-manifest.json
```

如果已经下载原始 HKO CSV，可以在 dry-run 中追加原始来源文件：

```bash
node scripts/generate-lunar-data-pack.js --check --source code/data-packs/lunar/sources/lunar-2023-full-draft.source-manifest.json --raw-source hko-open-data-calendar-2023-csv=path/to/nongli_calendar_2023.csv
```

这个模式只会校验原始文件的 `byteLength` / `sha256`，并输出记录数、日期范围、闰月摘要和候选 records checksum，不会写入 data-pack records，也不会注册到运行时。

## 后续步骤

1. 增加原始资料校验和采集记录。
2. 生成完整农历 / 闰月 records。
3. 生成 `.json` 与 `.js` 镜像文件。
4. 通过人工复核后再允许进入运行时 manifest。
