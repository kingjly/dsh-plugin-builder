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
/dsh-plugin-builder 模型查不了我们内部工单。给它一个工具，传入工单号，返回状态和处理人。
```

Grok 里也可以：`/skills dsh-plugin-builder`。

你没指定时，默认按下面这样理解：独立 npm 包（不写进官方 monorepo）、跑在 Host（agent 进程）、TypeScript ESM、装到 `web` profile、先 `--patch` 再打包。只有这些会改变产物形态时，智能体才应该追问：目标、Host 还是浏览器、有没有密钥、密钥的环境变量名。

提示词里尽量写清这几件事，少返工：

1. 要解决什么问题（不要只说「做个插件」）
2. 插件生成到哪个目录
3. 先本地试跑，还是直接做成可安装包
4. 有密钥的话，环境变量叫什么。不要把真实 token 贴进对话后指望它写进文件——按约定只会写引用名

### 提示词示例

每条都可以直接发给 `/dsh-plugin-builder`。下面写的是「你怎么说」和「做对了你该看到什么」，不是内部实现清单。

**查内部工单**

你说：

```text
/dsh-plugin-builder
模型现在查不了我们的工单。接口是 GET https://tickets.corp.example/api/tickets/{id}，
鉴权头用环境变量 TICKET_TOKEN。给它一个 lookup_ticket 工具：传入工单号，
返回状态和当前处理人。文件写到 D:/work/dsh-ticket，先 --patch 跑起来。
```

做对了的话：`D:/work/dsh-ticket/` 里会有 `src/index.ts`、`package.json`（含 `dsh.bundle`）、`cordis.patch.yml`、`cordis.dev.yml`、`plugin-design.md`。决策应写成「工具插件」，不是钩子，也不是再包一层 `bash` 去 curl。`cordis.dev.yml` 里插件路径是 `src/index.ts` 的绝对路径。启动 Web 之后，对模型说「T-1024 现在谁在跟」，它应调用 `lookup_ticket`，而不是自己拼 curl。源码里只能出现 `TICKET_TOKEN` 这个名字，不能出现真实 token。

**拦住误删整个磁盘**

你说：

```text
/dsh-plugin-builder
模型清理仓库时老把整盘 rm -rf / 掉。官方 bash 已经有了，
不要再做一个 bash 工具。命中这种命令就拒绝，并告诉它为什么。
```

做对了的话：生成的是钩子，不是第二个 `bash`。`ls`、普通 `git status` 应放行；`rm -rf /` 应被拒绝，模型能看到拒绝原因。实现上是听 `tools/pre-execute`，放行时必须把调用交给后面的插件，不能吞掉。

**公司有一台 OpenAI 兼容网关**

你说：

```text
/dsh-plugin-builder
我们不直连 OpenAI，走 https://llm.corp.example/v1，
协议是 chat completions，密钥在 OPENAI_API_KEY。
先看现成适配器能不能配，别一上来自己写一套。
```

做对了的话：先给你改 `@deepseek-ai/dsh-llm-pi-ai` 的配置（`baseURL` + `apiKeyEnv: OPENAI_API_KEY`），而不是新建一个 `llm-mycompany` 包。只有网关协议跟这套对不上，才允许新写适配器。仓库里不能出现密钥正文。

**运维有个值班命令**

你说：

```text
/dsh-plugin-builder
机器上有命令 oncall-status shanghai，标准输出一行：ok 3 people。
想让模型用工具查谁值班，别让它自己在 bash 里拼命令。写到 ./dsh-oncall。
```

做对了的话：`./dsh-oncall` 里是一个工具（例如 `oncall_status`），`execute` 里用参数数组拉起 `oncall-status`，不会写成 `oncall-status ${city}` 这种拼进 shell 的字符串。返回给模型的是字段（是否正常、人数），不是整段 stdout 当 API。你在对话里说「上海现在几个值班」时，应走到这个工具。

**对话里要看到审查进度，刷新还在**

你说：

```text
/dsh-plugin-builder
审查跑起来以后，网页对话里想看到「已审 3/10 个文件」，刷新页面数字还在。
现在 Host 还没往会话日志里写这类事件。
```

做对了的话：它应先补 Host 侧可回放的会话事件（带着稳定的审查 id），再写浏览器里的那一行 UI。如果只丢一个前端组件、日志里什么都没有，就是做错了——刷新后进度会丢。

**这几句不该生成插件**

「失败就自动再跑一轮，帮我改 agent-loop。」  
应拒绝改循环，不生成包。告诉你重试挂在工具执行上，或用官方现成的 retry / guard。

「官方 read 不好用，再写一个更好用的 read。」  
应拒绝再注册名为 `read` 的工具。文件读写已经有 `read` / `write` / `edit`。

「GitHub 的 MCP server 我已经跑着了，接到 dsh 上。」  
应让你挂官方 `@deepseek-ai/dsh-mcp-client`，一个 MCP server 对应一个插件。不应把 list issues、create issue 再手写一遍。

「做个 dsh 插件。」  
信息不够。应问你要解决什么问题、文件放哪，不能自己编一个天气或工单出来。

做完一轮，回复里还应有：形态判断、文件路径（如果做了）、怎么启动、测了什么、没测什么。判定不做时，只给替代办法，不要甩出一个空包。

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
