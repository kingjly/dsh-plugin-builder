# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![Skill](https://img.shields.io/badge/Agent_Skill-0.1.0-111827)](./SKILL.md)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](./scripts/validate_dsh_plugin.py)

[English](./README.md)

这是一份给智能体用的 Skill，用来写 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件。

你告诉它要补什么能力，它会先判断该做成工具、钩子、提供方、模型适配器、界面节点，还是协议桥。然后生成一个独立的 ESM 包（带 `dsh.bundle`），并告诉你怎么用 `--patch` 试跑、怎么用 `dsh plugin add` 装进 profile。

适合已经决定「要写插件」的时候用。只是改提示词，或者想改 `agent-loop`，别走这套。

## 它会做什么

- 动手写代码之前，先判断该不该做插件、做成哪一种。官方已经有的 `read`、`bash`、`web_search` 不会再注册一遍；该写成 Skill 或 MCP 服务的，会直接挡回去。
- 默认做成仓库外的 npm 包，名字类似 `dsh-天气` 这种 `dsh-<名字>`，不会往官方 monorepo 里塞 `@deepseek-ai/dsh-*`。
- 只往官方扩展点上挂：`defineTool`、瀑布式钩子、`ctx.llm`，以及 `ctx.web` / `ctx.fs` 这类提供方。
- 自带模板：最小插件、工具、钩子、`cordis.patch.yml`、开发用 overlay、设计记录。
- `validate_dsh_plugin.py` 做静态检查：有没有 `dsh.bundle`、有没有导出 `apply`、有没有撞上官方工具名、有没有把密钥写进文件。
- `evals/` 里有 10 个评测例子，覆盖打招呼工具、拒绝危险命令、拒绝改 loop、从 git 安装时的坑。

## 什么时候用

提到下面这些就可以启用：

- 「做个 dsh 插件」「写 DeepSeek Harness 插件」
- `dsh plugin add`、`cordis.yml`、`defineTool`、`dsh.bundle`、`dsh-plugin`
- 给现成能力换后端，比如换 `ctx.llm`、`ctx.web`、`ctx.fs`、`ctx.subagents` 的实现

下面这些不要用这份 Skill：

- 去改 `agent-loop`
- 写 Claude / Grok 的 `SKILL.md`（用 skill-factory）
- 单独做 MCP 服务（用 mcp-factory；接到 dsh 上再用官方的 `dsh-mcp-client`）

## 技术栈

| 项目 | 说明 |
|---|---|
| Skill 格式 | 标准 Agent Skill：入口是 `SKILL.md`，细则在 `references/` |
| 目标环境 | DeepSeek Harness，底层是 Cordis |
| 生成结果 | TypeScript ESM，配置用 Schemastery |
| 检查脚本 | Python 3.10 及以上，只用标准库 |
| 对照文档 | `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`（`dsh@0.1.0-rc.5`） |

## 安装

克隆到智能体已经会扫描的 skills 目录：

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

常见位置：

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # 当前项目
```

装好之后可以直接说：

```text
写一个 dsh 插件，给模型一个 greet 工具。
拦截 bash，命令里有 rm -rf / 就拒绝。
接一个 OpenAI 兼容网关。
```

客户端如果支持斜杠命令，可以用 `/dsh-plugin-builder`。

## 自检

检查这份 Skill 包本身（需要本机也有 skill-factory）：

```sh
py -3 path/to/skill-factory/scripts/validate_skill_package.py ./dsh-plugin-builder
```

检查生成出来的插件：

```sh
py -3 scripts/validate_dsh_plugin.py /path/to/your-plugin
```

一个能装上的最小目录大概是这样：

```text
dsh-hello/
├── package.json          # type: module，且声明 dsh.bundle.patch
├── cordis.patch.yml      # dsh plugin add 时插入的配置层
├── src/index.ts          # 导出 name、inject、apply
└── tsconfig.json
```

开发时用 overlay 加载。注意 `name` 必须写成插件文件的绝对路径：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

确认没问题再装进 profile：

```sh
dsh plugin --profile web add ./dsh-hello
dsh --profile web --dump-config
```

## 工作顺序

1. 问清目标：做什么、跑在 Host 还是浏览器、有没有密钥。
2. 判断形态：该停就停，该做就选定扩展点。细则见 `references/shape-decision.md`。
3. 用 `assets/templates/` 搭目录。
4. 只实现上一步选定的那一种形态。
5. 先跑静态检查；本机有 dsh 的话，再用 `--patch` 试一次。
6. 交代怎么发布：`dsh.bundle`、git 安装需要的 `prepare` 和 `allowBuilds`，或者直接发 npm / tarball。

## 目录

```text
dsh-plugin-builder/
├── SKILL.md                 # 智能体入口，流程写在这里
├── README.md                # 英文说明
├── README_CN.md             # 中文说明
├── LICENSE.txt
├── CHANGELOG.md
├── agents/openai.yaml
├── references/              # 按需再读，不必一次塞进上下文
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

这两个脚本不访问网络，也不会启动 dsh。

## 已知限制

- dsh 还在开发者预览，接口随时可能改。生成完插件，最好再对一下当时的官方文档。
- 校验脚本只看文件，不会打开 Web 界面。
- 仓库外的插件默认不会出现在 Web 的「设置」页，除非改 Host 白名单。
- 写在 agent preset 里的插件，不能注册 settings 命名空间。

## 参与

欢迎提 Issue 和 PR。`SKILL.md` 尽量写短，细节放到 `references/`。如果改了「先判断形态」这条规则，请同步改一条评测用例。

## 许可证

[MIT](./LICENSE.txt)

---

整理自 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 官方文档。[kingjly](https://github.com/kingjly)
