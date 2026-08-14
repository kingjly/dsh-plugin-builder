# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek_Harness-0.1.0--rc.6-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![Agent Skill](https://img.shields.io/badge/Agent_Skill-Grok%20%7C%20Claude%20%7C%20Codex-0ea5e9)](./SKILL.md)
[![Python](https://img.shields.io/badge/validator-Python_3.10%2B-3776ab?logo=python&logoColor=white)](./scripts/validate_dsh_plugin.py)

[English](./README.md)

一个用来设计、生成、验证和打包 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件的 Agent Skill。

它不会一上来就套脚手架，而是先判断需求应该落到工具、策略钩子、Provider seam、LLM 适配器、Client 节点、协议桥，还是根本不该做插件。确定要做后，生成独立 ESM 包，包含 `dsh.bundle`、开发 overlay、形态决策记录和验证命令。

已在 Windows 上用 `@deepseek-ai/dsh@0.1.0-rc.6` 实测。Harness 仍处于开发者预览，后续可能出现破坏性变更。

## 实测 Showcase

仓库中已经放入三个严格按本 Skill 全流程生成的插件：

| 包 | 形态 | 扩展点 | 展示内容 |
|---|---|---|---|
| [`dsh-greeter`](./showcase/dsh-greeter) | 工具 | `ctx.tools.register()` | 类型化参数、结构化输出、可配置渲染 |
| [`dsh-text-metrics`](./showcase/dsh-text-metrics) | 工具 | `ctx.tools.register()` | 对象输出 schema、输入上限、配置错误响亮失败 |
| [`dsh-command-safety`](./showcase/dsh-command-safety) | 钩子 | `tools/pre-execute` | 放行时调用 `next()`、命中时返回类型化拒绝 |

### DeepSeek Harness Web 真实截图

下图是本机 `web` profile 安装全部三个 showcase bundle 后的真实浏览器截图。已配置的第三方 `opencode-go / DeepSeek V4 Flash` 模型实际调用了 `greet` 和 `text_metrics`，图中的 Tool call 行与结构化结果均来自这次真实会话。

![运行 showcase profile 的 DeepSeek Harness Web 真实截图](./docs/images/deepseek-harness-web.png)

这张图没有经过生成或合成。Tool 和 Hook 插件不会自动获得独立的 Web Settings 卡片；纯策略插件 `dsh-command-safety` 的证据由 smoke tests 和下方验证报告提供。

### 自动生成的验证报告图

下图是自动渲染的报告，不是 Web UI 截图。它的数据来自实际执行的已安装 CLI、三个静态校验、9 个 smoke tests 和 profile bundle 检查。

![三个 dsh 插件的自动生成验证报告](./docs/images/showcase-validation.png)

重新生成：

```powershell
py -3 scripts/render_showcase_validation.py
```

## 安装 Skill

克隆到智能体客户端会扫描的 Skill 目录，文件夹名保持为 `dsh-plugin-builder`：

```powershell
git clone https://github.com/kingjly/dsh-plugin-builder.git "$HOME/.grok/skills/dsh-plugin-builder"
```

常见位置：

```text
~/.grok/skills/dsh-plugin-builder/       # Grok
~/.claude/skills/dsh-plugin-builder/     # Claude Code
.agents/skills/dsh-plugin-builder/       # 项目内 Skill
```

目录根部存在 `SKILL.md` 即可。

## 使用

显式调用：

```text
/dsh-plugin-builder 在 ./dsh-text-metrics 里创建一个模型可调用的文本统计工具，做成可安装 bundle，并先本地测试。
```

直接说「写一个 DeepSeek Harness 插件」也可能自动触发。

提示词最好写清：

- 能力目标和副作用；
- 输出目录；
- 需要本地 `--patch`、可安装 bundle，还是两者都要；
- 凭据对应的环境变量名——生成文件里不要出现真实密钥。

未指定时默认：树外 Host 插件、TypeScript ESM、`web` profile、不改 loop、先本地 overlay 再安装。

## 先决策，再生成

Skill 按第一个命中的规则选择扩展缝：

| 需求 | 处理方式 |
|---|---|
| 给模型新增结构化能力 | 用 `defineTool()` 注册工具 |
| 拦截或拒绝已有工具调用 | `tools/pre-execute` 钩子或 guard |
| 替换文件系统、Shell、搜索、沙箱或子 Agent 后端 | 使用已有 Service Provider seam |
| 新增或路由模型后端 | 优先配置 `dsh-llm-pi-ai`，确有必要才写适配器 |
| 在 Chat 增加可回放业务行 | Host 事件 + Client Conversation Node |
| 接 IM、IDE 或自动化协议 | 基于 `ctx.agents` 的协议桥 |
| 改 `agent-loop`、重复注册 `bash`、重写已有 MCP 工具 | 拒绝，并指出官方扩展点 |

每个生成包都先把选择写入 `plugin-design.md`。

## 运行 Showcase

需要 Node.js 22+、pnpm、Python 3.10+ 和 DeepSeek Harness：

```powershell
pnpm add --global @deepseek-ai/dsh@0.1.0-rc.6
py -3 scripts/render_showcase_overlays.py
cd showcase
pnpm install
pnpm build
pnpm test
```

从源码把三个插件一起挂进 Web profile：

```powershell
dsh web --patch ./cordis.dev.yml
```

浏览器打开 `http://127.0.0.1:3080`。

Windows 的 `cordis.dev.yml` 必须把本地 ESM 入口写成 `file:///C:/...` URL。裸 `C:/...` 会被 Node 当成不支持的 `c:` 协议；POSIX 继续使用普通绝对路径。

`render_showcase_overlays.py` 会按当前检出位置重新生成绝对 import specifier，所以仓库移动或重新克隆后仍可直接运行。

安装到独立 profile 并检查组合层：

```powershell
dsh plugin --profile showcase add ./dsh-greeter ./dsh-text-metrics ./dsh-command-safety
dsh --profile showcase --dump-config
```

编译、静态校验、smoke tests、bundle 安装和配置展开都不需要模型密钥；只有在 Web UI 里做完整模型对话时才需要配置模型。

## 生成包约定

```text
dsh-<slug>/
├── src/index.ts          # name + inject + apply + Schemastery Config
├── test/smoke.test.mjs   # 成功与失败路径
├── cordis.dev.yml        # 源码 overlay；绝对 import specifier
├── cordis.patch.yml      # 安装后的 bundle 层；使用包名
├── plugin-design.md      # 形态决策与验证计划
├── package.json          # ESM + dsh.bundle + 自包含 prepare
├── tsconfig.json
└── README.md
```

默认模板用 `tsc` 构建，不为小插件引入原生 bundler，Git `prepare` 仍能自包含执行。

## 校验插件

```powershell
py -3 scripts/validate_dsh_plugin.py ./showcase/dsh-greeter
```

静态校验覆盖：

- ESM 与 `dsh.bundle.patch` 元数据；
- patch 和插件入口是否存在；
- `name`、`apply` 和 Schemastery `Config`；
- 是否撞上官方工具名；
- 是否疑似硬编码凭据；
- 开发 overlay 是否误用了裸 Windows 绝对路径。

它是快速门禁，不替代编译、smoke tests、实际 overlay 加载与 `--dump-config` 检查。

## 仓库结构

```text
├── SKILL.md                 # 路由与交付契约
├── assets/templates/        # ESM 插件和 bundle 模板
├── references/              # 工具、钩子、适配器、UI、安全、发布规则
├── scripts/                 # 模板、overlay 渲染器、校验器、报告渲染脚本
├── showcase/                # 三个已生成、已测试插件
├── examples/                # 请求样例
└── evals/                   # 评分表、失败分类、评测用例
```

## 重要限制

- DeepSeek Harness 仍在开发者预览；版本变化时要重新核对官方契约。
- 树外插件不会自动出现在 Web Settings 卡片中。
- 挂在 preset 下的插件不适合注册全局 settings 命名空间。
- Git 安装只有在 pnpm 允许构建脚本时才会运行 `prepare`；只信任钉住 commit 的来源，或使用预构建 tarball。
- `dsh-command-safety` 是策略层示例，不是完整 Shell 沙箱。

## 许可证

[MIT](./LICENSE.txt)
