# 失败分类

| 标签 | 含义 | 修订方向 |
|---|---|---|
| `bad-trigger` | 把写 Skill / MCP server / 架构调研当成做插件 | 收紧 description 与「何时不用」 |
| `skipped-shape-gate` | 未判定形态就生成包 | 强化第 1 步为硬门 |
| `loop-patch` | 改了 agent-loop | SKILL.md 明确拒绝 |
| `duplicate-official-tool` | 再注册 read/bash/web_search | shape-decision 保留名单 |
| `forced-seam-split` | 简单工具拆成三包 | 「不要预防性拆 seam」 |
| `first-party-template` | 树外插件套 monorepo 门禁 | 默认树外 |
| `missing-bundle` | 没有 dsh.bundle，装了不生效 | publish-profile + validator |
| `waterfall-no-next` | 钩子不调用 next() | hook-policy |
| `unsafe-secret` | 密钥进文件 | safety + validator |
| `git-build-myth` | 以为 git add 会跑 build | publish-profile |
| `settings-fantasy` | 以为树外插件能自己出现在 Settings | shape-decision 约束 |
| `source-drift` | 官方预览改了 API | 更新 pin 与 ledger |

优先盯：`skipped-shape-gate`、`duplicate-official-tool`、`unsafe-secret`。
