# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![Skill](https://img.shields.io/badge/Agent_Skill-0.1.0-111827)](./SKILL.md)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](./scripts/validate_dsh_plugin.py)

**[English](./README.md)**

把一项能力做成**可安装的 DeepSeek Harness（`dsh`）插件** 的 Agent Skill。

它先判定插件形态（工具、钩子、提供方、LLM 适配器、UI 节点、协议桥），再生成带 `dsh.bundle` 的树外 ESM 包，并说明如何用 `--patch` 或 `dsh plugin add` 加载。

要的是真正的运行时插件，不是改两句提示词，也不是去改 `agent-loop`。

## 功能

- **先过形态门再写代码** — 拒绝改 loop、拒绝重复官方工具（`read` / `bash` / `web_search`）、把该做 Skill 或 MCP 的活挡回去
- **默认树外** — 产出 `dsh-<slug>` npm 包，不是往官方 monorepo 里塞 `@deepseek-ai/dsh-*`
- **只走官方缝** — `defineTool`、waterfall 钩子、`ctx.llm`、`ctx.web` / `ctx.fs` 提供方、Conversation Node
- **脚手架模板** — hello、工具、钩子、`cordis.patch.yml`、开发 overlay、设计记录
- **静态检查** — `validate_dsh_plugin.py` 查 `dsh.bundle`、`apply` 导出、官方工具名冲突、明显密钥
- **评测集** — 10 条：greet 工具、拒绝钩子、拒绝改 loop、git 安装陷阱

## 何时使用

- 「做 dsh 插件 / 写 DeepSeek Harness 插件」
- 提到 `dsh plugin add`、`cordis.yml`、`defineTool`、`dsh.bundle`、`dsh-plugin`
- 要给官方 seam 换提供方（`ctx.llm`、`ctx.web`、`ctx.fs`、`ctx.subagents`）

**不要用本 skill：**

- 改 `agent-loop`
- 写 Claude / Grok 的 `SKILL.md`（用 skill-factory）
- 单独做 MCP server（用 mcp-factory，再用官方 `dsh-mcp-client` 接入）

## 技术栈

| 部分 | 选择 |
|---|---|
| Skill 格式 | Agent Skill（`SKILL.md` + references） |
| 目标运行时 | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，底层 Cordis |
| 生成的插件 | TypeScript ESM，Schemastery `Config` |
| 校验脚本 | Python 3.10+，只用标准库 |
| 文档钉扎 | `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`（`dsh@0.1.0-rc.5`） |

## 快速开始

### 安装 skill

克隆到 agent 会加载的 skills 根目录：

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # 项目内
```

然后直接说：

```text
写一个 dsh 插件，给模型 greet 工具。
拦截 bash，拒绝 rm -rf /。
接一个 OpenAI 兼容网关。
```

客户端若列出 skill，可用 `/dsh-plugin-builder`。

### 检查本 skill 包

```sh
py -3 path/to/skill-factory/scripts/validate_skill_package.py ./dsh-plugin-builder
```

### 检查生成出来的插件

```sh
py -3 scripts/validate_dsh_plugin.py /path/to/your-plugin
```

合格的最小树：

```text
dsh-hello/
├── package.json          # type: module，dsh.bundle.patch
├── cordis.patch.yml      # dsh plugin add 插入的层
├── src/index.ts          # name + inject + apply
└── tsconfig.json
```

开发期加载（overlay 里必须是绝对路径）：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

装进 profile：

```sh
dsh plugin --profile web add ./dsh-hello
dsh --profile web --dump-config
```

## 工作流程

1. **Intake** — 一句话目标、Host / Client、密钥
2. **形态门** — 停止或选缝（`references/shape-decision.md`）
3. **脚手架** — 渲染 `assets/templates/`
4. **实现** — 只做选定的那一种形态
5. **校验** — 静态脚本；有 dsh 再 `--patch`
6. **发布说明** — `dsh.bundle`、git 的 `prepare` + `allowBuilds`，或 npm / tarball

## 项目结构

```text
dsh-plugin-builder/
├── SKILL.md                 # 精简流程
├── README.md                # 英文
├── README_CN.md             # 中文
├── LICENSE.txt
├── CHANGELOG.md
├── agents/openai.yaml
├── references/              # 按需加载
│   ├── shape-decision.md
│   ├── tool-plugin.md
│   ├── hook-policy.md
│   ├── llm-adapter.md
│   ├── ui-node.md
│   ├── publish-profile.md
│   ├── safety.md
│   ├── first-party-monorepo.md
│   └── source-ledger.md
├── assets/templates/
├── scripts/
│   ├── render_template.py
│   └── validate_dsh_plugin.py
├── evals/
└── examples/
```

## 脚本

```sh
py -3 scripts/render_template.py assets/templates/plugin-tool.template.ts PACKAGE_NAME=dsh-hello -o out.ts
py -3 scripts/validate_dsh_plugin.py /path/to/plugin
```

不联网，也不启动 dsh。

## 局限

- DSH 仍是开发者预览，API 会破。生成后请对照当时官方文档复核。
- 校验脚本只做静态检查，不会打开 Web UI。
- 树外插件默认不会出现在 Web Settings，除非改 Host 白名单。
- Agent preset 里的插件不能注册 settings 命名空间。

## 贡献

欢迎 Issue 和 PR。`SKILL.md` 保持短，细节放 `references/`。改形态门时请补或改一条 eval。

## 许可证

[MIT](./LICENSE.txt)

---

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，由 [kingjly](https://github.com/kingjly) 整理。
