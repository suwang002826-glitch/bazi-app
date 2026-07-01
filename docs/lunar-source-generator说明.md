# 农历 data-pack 来源与生成器说明

## 当前目标

先建立完整农历数据包的“来源清单 + dry-run 生成器”骨架，后续再导入真实权威数据并生成正式记录。

## 当前边界

- 只校验来源清单，不生成运行时 records。
- 只允许 `status: "draft"`。
- 至少需要两份来源记录。
- 每份来源都必须有 `sourceUrl` 和 `rawSourceChecksum`。
- `rawSourceChecksum.algorithm` 必须是 `sha256`。
- `reviewPolicy.runtimeEnabled` 必须是 `false`。

## 校验命令

```bash
node scripts/generate-lunar-data-pack.js --check --source code/data-packs/lunar/sources/lunar-2023-full-draft.source-manifest.json
```

## 后续步骤

1. 替换示例来源为确认过的权威来源。
2. 增加原始资料校验和采集记录。
3. 生成完整农历 / 闰月 records。
4. 生成 `.json` 与 `.js` 镜像文件。
5. 通过人工复核后再允许进入运行时 manifest。
