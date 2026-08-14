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
| `wrong-dsh-home` | 修改了默认 profile，但服务运行在另一个 home/profile | 生命周期入口必须先锁定运行目录 |
| `manifest-toggle-myth` | 修改 `package.json` 或 remove 后声称已热停用 | 区分安装层与运行时 patch |
| `effective-id-patch` | 未确认就把 inventory 的完整 Loader 路径写进 patch | 从 bundle/dump 找 raw id |
| `inventory-mutation-fantasy` | 假设官方 Settings inventory 提供启停 API | 明确 inventory 只读 |
| `client-unload-assumption` | Host 已停用就声称已有页面 UI 会立即消失 | Client 插件必须补刷新验证 |
| `shadowed-user-patch` | 只改 profile patch，忽略更晚的 home 级同 id 覆盖 | 启停前检查两个用户层与优先级 |

优先盯：`skipped-shape-gate`、`duplicate-official-tool`、`unsafe-secret`、`wrong-dsh-home`、`manifest-toggle-myth`。
