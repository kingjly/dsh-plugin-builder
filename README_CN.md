# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

[English](./README.md)

给智能体用的 Skill，用来写可安装的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件。

你说明要补什么。它会先对照官方扩展点判断：该做成工具、钩子、适配器，还是根本不该做插件。该做的话，在你指定的目录生成独立 npm 包（`package.json` 里要有 `dsh.bundle`），并告诉你怎么 `--patch` 试跑、怎么 `dsh plugin add` 装进 profile。类型怎么选，见仓库里的 `SKILL.md`。

对照文档钉在 `dsh@0.1.0-rc.5`（`47f943859bef60e4160492346772ded9b24f765a`）。dsh 还在开发者预览，接口会变。

## 安装

把本仓库放到客户端会扫描的 skills 目录。文件夹名必须是 `dsh-plugin-builder`，里面要有 `SKILL.md`：

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # 当前项目
```

## 怎么用

强制走这份 Skill：

```text
/dsh-plugin-builder 按官方教程写一个 greet 工具，放到 ./dsh-greet。
```

也可以直接说「写个 dsh 插件……」，客户端可能按 description 自动启用。Grok 里还可以 `/skills dsh-plugin-builder`。

提示词里写清这些，少返工：

- 要补什么（不要只说「做个插件」）
- 文件放哪
- 先本地试跑，还是直接做成可安装包
- 有密钥的话，只写环境变量名，不要把 token 贴进对话再指望写进文件

没指定时按：独立包、跑在 Host、TypeScript ESM、`web` profile、先 `--patch`。

## 示例

**工具**（官方入门教程）

```text
/dsh-plugin-builder 按官方教程写一个 greet 工具，放到 ./dsh-greet。
```

目录里应有带 `dsh.bundle` 的包。启动 Web 后说「用 greet 跟 Ada 打招呼」，模型要能调到 `greet`。

**钩子**（拦已有工具，不要再注册一个 bash）

```text
/dsh-plugin-builder bash 命令里出现 rm -rf / 就拒绝。官方 bash 已经在了，别再做一个。
```

普通命令还能跑。危险命令被拒，模型能看见原因。

**接模型**（先配现成的）

```text
/dsh-plugin-builder 推理走 OpenAI 兼容接口 https://api.example.com/v1，密钥在 OPENAI_API_KEY。能配官方 dsh-llm-pi-ai 就别新写适配器。
```

应改配置，不要新建适配器包。文件里不能出现密钥正文。

**接 MCP**

```text
/dsh-plugin-builder 本机已经在跑 GitHub 的 MCP server，接到 dsh 上。
```

应挂官方 `@deepseek-ai/dsh-mcp-client`，一个 server 一个插件。不要把 MCP 工具再手写一遍。

**不要做成插件**

```text
/dsh-plugin-builder 改 agent-loop，失败就自动再跑一轮。
```

应拒绝，不生成包。重试走工具执行上的包装，或官方已有的 retry / guard。

## 生成之后

开发时用 overlay。`cordis.dev.yml` 里的插件路径必须是绝对路径：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

用的是发布版 CLI、不是仓库源码时，把 `pnpm dsh` 换成 `dsh` 或 `npx @deepseek-ai/dsh`。

装进 profile：

```sh
dsh plugin --profile web add ./dsh-greet
dsh --profile web --dump-config
```

本仓库的 `scripts/validate_dsh_plugin.py` 只做静态检查，不会打开网页。

## 不要用它

- 改 `agent-loop`
- 写 Claude / Grok 的 `SKILL.md`
- 单独做 MCP server（接到 dsh 用官方客户端）
- 往 `deepseek-ai/deepseek-harness` 的 `packages/` 里加官方包

## 许可证

[MIT](./LICENSE.txt)
