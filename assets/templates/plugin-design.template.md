# {{PLUGIN_DISPLAY_NAME}} 设计

## 形态决策

- 目标：{{GOAL}}
- 做插件：是
- 树外 / first-party：树外
- 形态：{{SHAPE}}
- 挂载点：{{MOUNT_POINT}}
- 不选其他形态的原因：{{WHY_NOT_OTHER}}
- 拆 seam：否

## 契约

- 包名：`{{PACKAGE_NAME}}`
- 插件 `name`：`{{PLUGIN_NAME}}`
- Loader 行 id：`{{ENTRY_ID}}`
- inject：{{INJECT}}
- 模型可见名称（若有）：`{{TOOL_NAME}}`
- 密钥引用：{{CREDENTIAL_ENV}}

## 配置字段

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| {{CONFIG_FIELD}} | {{CONFIG_TYPE}} | {{CONFIG_DEFAULT}} | {{CONFIG_HELP}} |

## 验证计划

- [ ] `--patch` 能加载
- [ ] 成功路径
- [ ] 失败 / 拒绝路径
- [ ] 无硬编码密钥
