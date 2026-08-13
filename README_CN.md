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
/dsh-plugin-builder 写一个 dsh 插件，给模型一个 greet 工具，能按名字打招呼。
```

Grok 里也可以：`/skills dsh-plugin-builder`。

你没指定时，默认按下面这样理解：独立 npm 包（不写进官方 monorepo）、跑在 Host（agent 进程）、TypeScript ESM、装到 `web` profile、先 `--patch` 再打包。只有这些会改变产物形态时，智能体才应该追问：目标、Host 还是浏览器、有没有密钥、密钥的环境变量名。

提示词里尽量写清这几件事，少返工：

1. 要解决什么问题（不要只说「做个插件」）
2. 插件生成到哪个目录
3. 先本地试跑，还是直接做成可安装包
4. 有密钥的话，环境变量叫什么。不要把真实 token 贴进对话后指望它写进文件——按约定只会写引用名

### 提示词示例

下面每条都可以直接跟在 `/dsh-plugin-builder` 后面。括号里是按 `SKILL.md` 应该得到的结果，不是「可能」。

**做工具（模型要调用一项新能力）**

```text
/dsh-plugin-builder 在 D:/tmp/dsh-greet 写一个 dsh 插件。
给模型一个 greet 工具，传入 name，返回问候语。先用 --patch 试跑。
```

应判定为工具插件：`inject: ['tools']`，`ctx.tools.register(defineTool({ name: 'greet', ... }))`，`execute` 返回规范 JSON，`output.render` 给模型看。目录里至少有 `package.json`（`type: module` 且含 `dsh.bundle.patch`）、`cordis.patch.yml`、`src/index.ts`、`plugin-design.md`，以及开发用的 `cordis.dev.yml`（其中插件 `name` 必须是 `src/index.ts` 的绝对路径）。

**做钩子（拦截已有工具，不要再注册一个 bash）**

```text
/dsh-plugin-builder 不要让模型执行 rm -rf /。
已有官方 bash 工具，不要再注册一个同名工具。
```

应判定为钩子：监听 `tools/pre-execute`，命中则 `{ kind: 'deny', reason: '...' }`，否则必须 `next()`。

**接 OpenAI 兼容网关**

```text
/dsh-plugin-builder 接一个 OpenAI 兼容网关。
API 是 chat completions，密钥在环境变量 OPENAI_API_KEY。
```

应先建议配置官方 `@deepseek-ai/dsh-llm-pi-ai`，不要一上来就新写适配器。只有协议或鉴权这套适配器盖不住时，才写 `ctx.llm.registerAdapter`。密钥只写环境变量名，不写进源码。

**把内部 CLI 包一层给模型用**

```text
/dsh-plugin-builder 把公司内部的天气 CLI 做成 dsh 插件。
命令输出是纯文本，参数很少。生成到 ./dsh-weather。
```

可以做成工具插件，在 `execute` 里起子进程。参数要数组传递，不要拼成一条 shell 字符串。返回给模型的应是规范 JSON，不要把 CLI 原文当 API。

**Chat 里要显示一条业务进度**

```text
/dsh-plugin-builder 在 Web Chat 里显示代码审查进度。
Host 这边现在还没有对应的会话事件。
```

应先要求设计可回放的 Session 事件（扩展 `SessionEventMap`），再写 Client 的 Conversation Node。不能只做浏览器插件、不往日志里落事件。

**不该做成插件的，必须停**

```text
/dsh-plugin-builder 帮我改 dsh 的 agent-loop，失败就自动再跑一轮。
```

应拒绝改 `agent-loop`，不生成改循环的包。重试应挂到 `tools/execute`，或用官方已有的 retry / guard 插件。

```text
/dsh-plugin-builder 再写一个 read 工具，读文件更方便一点。
```

应拒绝再注册名为 `read` 的工具。官方已有 `read` / `write` / `edit`。要改行为就换 `ctx.fs` 提供方，或加 `fs/*` 策略。

```text
/dsh-plugin-builder 我已经有一个 GitHub MCP server，接到 dsh 上。
```

应改用官方 `@deepseek-ai/dsh-mcp-client`（一个 MCP server 对应一个插件），不要把 MCP 工具逐个抄成 `defineTool`。

```text
/dsh-plugin-builder 做个 dsh 插件。
```

信息不够，不能编一个假业务。应只追问会改变产物形态的问题，或做最小的 hello 插件。

### 它会交出来什么

按 `SKILL.md` 的输出约定，做完一次任务应包含：

1. 形态决策：做不做、做成哪一种、为什么不选别的
2. 生成文件的路径（若判定要做插件）
3. 本地加载命令（`--patch` 或 `dsh plugin add`）
4. 自测做了什么、没做什么
5. 已知限制

判定「不做插件」时，只给替代方案和理由，不应生成包。

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
