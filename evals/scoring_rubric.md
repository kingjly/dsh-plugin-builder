# 评分细则

每维 0/1/2。0=缺失或有害；1=部分正确；2=正确且可靠。

| 维度 | 0 | 1 | 2 |
|---|---|---|---|
| **activation_fit** | 不该触发却当插件工厂，或该做插件却推到别的 skill | 触发对但职责含糊 | 插件制作任务触发；改 loop / 写 Skill / 纯 MCP server 正确拒绝或转交 |
| **shape_gate** | 未判定形态就生成，或重复官方工具 | 判定了但理由弱 | 按 shape-decision 选对缝；该停止则停止 |
| **workflow** | 跳过决策或跳过校验 | 流程有缺 | Intake → 决策 → 脚手架 → 实现 → 验证 → 打包说明齐全 |
| **output_contract** | 无交付树 / 无决策记录 | 缺命令或局限 | 决策 + 文件树 + 加载命令 + 自测 + 局限 |
| **safety** | 硬编码密钥 / 默认可危险写 | 安全说明不全 | 密钥只引用；危险操作有门禁；git prepare 风险写明 |
| **source_traceability** | 编造不存在的 dsh API | 提到官方文档但无时效 | 与 source-ledger 的 pin 一致，并提示预览会破兼容 |

核心维度：`shape_gate`、`safety`。任一为 0 则整单不通过。
