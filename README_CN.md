# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![Skill](https://img.shields.io/badge/Agent_Skill-0.1.0-111827)](./SKILL.md)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

[English](./README.md)

给智能体用的 Skill，用来写 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件。

你说清楚要补什么能力。智能体会先判断该做成工具、钩子、提供方、模型适配器、界面节点，还是协议桥；不该做成插件的，会停下来说明替代办法。该做的话，会在你指定的目录里生成一个独立 npm 包（`package.json` 里带 `dsh.bundle`），并告诉你怎么用 `--patch` 试跑、怎么用 `dsh plugin add` 装进 profile。

对照的官方文档版本是 `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`（`dsh@0.1.0-rc.5`）。dsh 还在开发者预览，接口会变，生成结果不能当成长期稳定的 API。

## 安装

把本仓库放到智能体已经会扫描的 skills 目录，文件夹名必须是 `dsh-plugin-builder`，且目录里有 `SKILL.md`：

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

常见位置：

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # 当前项目
```

装好后一般不用重启。有的客户端几秒内会刷新技能列表。

## 怎么用

### 怎么唤起

两种写法效果一样。斜杠用来强制走这份 Skill；直接描述任务时，客户端也可能按 `SKILL.md` 里的 description 自动启用。

```text
/dsh-plugin-builder
```

然后补任务。或者一行写完：

```text
/dsh-plugin-builder 按官方教程写一个 greet 工具，放到 ./dsh-greet。
```

Grok 里也可以：`/skills dsh-plugin-builder`。

你没指定时，默认按下面这样理解：独立 npm 包（不写进官方 monorepo）、跑在 Host（agent 进程）、TypeScript ESM、装到 `web` profile、先 `--patch` 再打包。只有这些会改变产物形态时，智能体才应该追问：目标、Host 还是浏览器、有没有密钥、密钥的环境变量名。

提示词里尽量写清这几件事，少返工：

1. 要解决什么问题（不要只说「做个插件」）
2. 插件生成到哪个目录
3. 先本地试跑，还是直接做成可安装包
4. 有密钥的话，环境变量叫什么。不要把真实 token 贴进对话后指望它写进文件——按约定只会写引用名

### 提示词示例

官方把扩展分成这几类（见 [architecture](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/architecture.zh.md) 和 [extension-cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/cookbook/extension-cookbook.zh.md)）。一份提示词对应一类，不要混着提。

**工具插件**（`ctx.tools`，官方入门就是这个）

```text
/dsh-plugin-builder 按官方教程写一个 greet 工具，放到 ./dsh-greet。
启动后我对模型说「用 greet 跟 Ada 打招呼」，它要能调到。
```

应生成独立包：`package.json` 带 `dsh.bundle`，`src/index.ts` 里 `defineTool({ name: 'greet' })`。不是钩子，也不要去改 `bash`。

**钩子**（拦已有工具，官方权限门禁就是这个）

```text
/dsh-plugin-builder 模型调用 bash 时，命令里有 rm -rf / 就拒绝。
官方 bash 已经在了，别再注册一个 bash。
```

应监听 `tools/pre-execute`。普通命令继续跑，危险命令被拒，模型能看见原因。

**模型适配器**（`ctx.llm`）

```text
/dsh-plugin-builder 推理走 OpenAI 兼容接口，base URL 是 https://api.example.com/v1，
密钥在 OPENAI_API_KEY。能配官方 dsh-llm-pi-ai 就别新写适配器。
```

应先改 `dsh-llm-pi-ai` 的配置。协议对不上才允许新写 `LlmAdapter`。文件里不能出现密钥正文。

**Web 提供方**（`ctx.web`，模型仍只看见 `web_search` / `web_fetch`）

```text
/dsh-plugin-builder 给官方 web_search 加一个我们自己的搜索后端。
模型那边工具名不要变。
```

应注册 `ctx.web` 的搜索实现，不要再做一个叫 `my_search` 的工具。

**文件系统 / 沙箱提供方**（`ctx.fs` / `ctx.subprocess` / `ctx.sandbox`）

```text
/dsh-plugin-builder 读写文件改走远程沙箱，不要再做一套 read / write / bash。
```

应换提供方。模型继续用官方的 `read`、`write`、`bash`。

**用户命令**（`ctx.commands`，不经过模型一轮）

```text
/dsh-plugin-builder 加一个 /compact 之外的用户命令 /status，敲了直接出当前会话状态，不要再走模型。
```

应注册到 `ctx.commands`，不是 `defineTool`。

**Chat 节点**（浏览器插件，事件要进会话日志）

```text
/dsh-plugin-builder 网页对话里给计划加一块可折叠卡片。刷新之后还要在。
```

应先有 Host 写入的会话事件，再写 Client 的 Conversation Node。只改前端、日志里没有对应事件，刷新会丢。

**协议桥**（接到 `ctx.agents`）

```text
/dsh-plugin-builder 用 Telegram 跟这个 agent 说话，消息当用户输入喂进去。
```

应听 `session/event`、用 `followup()` 送输入。这是协议桥，不是新工具。

**MCP**（官方已经有客户端）

```text
/dsh-plugin-builder 本机已经在跑 GitHub 的 MCP server，接到 dsh 上。
```

应挂 `@deepseek-ai/dsh-mcp-client`，一个 server 一个插件。不要把 MCP 工具再手写成 `defineTool`。

**不要做成插件**

```text
/dsh-plugin-builder 改 agent-loop，失败就自动再跑一轮。
```

应拒绝，不生成包。重试走 `tools/execute` 或官方 retry / guard。

```text
/dsh-plugin-builder 官方 read 不好用，再写一个 read。
```

应拒绝。`read` / `write` / `edit` 已经占用。要改行为就换 `ctx.fs` 或加 `fs/*` 钩子。

```text
/dsh-plugin-builder 做个 dsh 插件。
```

应先问要补哪一类能力，不能自己编一个业务出来。

做完一轮，回复里还应有：属于上面哪一类、文件路径（如果做了）、怎么启动、测了什么。判定不做时只给替代办法。

## 生成出来的插件怎么跑

开发期用 overlay。`cordis.dev.yml` 里的 `name` 必须是绝对路径，相对路径会加载失败：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

如果你装的是发布版 CLI，而不是仓库源码，把前面的 `pnpm dsh` 换成 `dsh` 或 `npx @deepseek-ai/dsh`。`--patch` 是 dsh 自己的参数。

装进 `web` profile：

```sh
dsh plugin --profile web add ./dsh-hello
dsh --profile web --dump-config
```

`dump-config` 里应能看到对应 bundle 那一层。从 git 装 TypeScript 源码仓时，包必须自带可独立运行的 `prepare`；用户还要在该 profile 的 `pnpm-workspace.yaml` 里写 `allowBuilds`。更省事的是 `pnpm pack` 出 tarball，或发已经构建好的 npm 包。

本仓库的静态检查（不启动 dsh、不访问网络）：

```sh
py -3 scripts/validate_dsh_plugin.py /path/to/your-plugin
```

Windows 上 Python 启动器按 `py -3` 写。工具插件至少要能证明：schema 注册上了、一次调用成功、缺必填参数时失败而不是把进程打崩。钩子至少要有拒绝和放行两条路径。

## 不要用这份 Skill 做的事

- 改 `agent-loop`，或自己写一套循环
- 写 Claude / Grok 的 `SKILL.md`（那是另一份 Skill 的工作）
- 单独实现一个 MCP server
- 只调研 dsh 生态、并不打算写插件
- 往 `deepseek-ai/deepseek-harness` 仓库的 `packages/` 里加官方包（那是 first-party 流程，见 `references/first-party-monorepo.md`）

## 限制

- 生成的 TypeScript 要对应当时的 dsh 类型，预览期升级后可能编不过。
- 校验脚本只看文件，不会替你打开 `http://127.0.0.1:3080`。
- 独立安装的插件默认不会出现在 Web「设置」里，曝光名单在 Host 的 apiproxy，不是插件自己能声明的。
- 写在 agent preset 里的插件不能注册 settings 命名空间，多开会撞车。配置写在 preset 的 `cordis.yml` 里。

## 仓库里有什么

智能体真正执行的是 `SKILL.md`。`references/` 按任务再读，不必一次全看。`assets/templates/` 是脚手架，`evals/` 和 `examples/` 是评测用例。

## 许可证

[MIT](./LICENSE.txt)
