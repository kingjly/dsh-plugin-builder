# 形态决策

第 1 步必读。先判定「做不做插件」和「做哪种」，再生成文件。

## 先问：这是不是插件问题

| 用户其实要的 | 不要做的 | 替代 |
|---|---|---|
| 给模型一份操作手册 | 插件 | 官方 `ctx.skills` / 工作区 `SKILL.md` |
| 接已有 MCP server | 重写全部工具 | 官方 `@deepseek-ai/dsh-mcp-client`，一 server 一插件 |
| 换 OpenAI/Anthropic/兼容网关 | 新适配器（先确认） | 先配官方 `@deepseek-ai/dsh-llm-pi-ai` |
| 改系统提示一两句 | 新包 | `ctx.systemPrompt.section()` 或 preset |
| 改 agent-loop / 自己写 ReAct | 任何 loop 补丁 | 挂 `agent/*` 或 `tools/*` |
| 封装任意 SaaS 成 MCP | 本 skill | mcp-factory，再用 mcp-client 接入 dsh |
| 写 Claude/Grok Skill | 本 skill | skill-factory |

只有「运行时要注册能力、拦截事件、换提供方、或改 Web UI」时才做插件。

## 树外 vs first-party

| | 树外（默认） | First-party |
|---|---|---|
| 何时 | 用户自己的插件 | 明确在贡献 `deepseek-ai/deepseek-harness` |
| 包名 | `dsh-<slug>` | `@deepseek-ai/dsh-<pkg>` |
| 位置 | 独立目录 | `packages/<group>/<pkg>/` |
| 分发 | `dsh.bundle` + `dsh plugin add` | monorepo 门禁 + 官方 bundle |
| 模板 | 本 skill 默认模板 | `references/first-party-monorepo.md` |

## 选形态

按第一个命中的规则走。

1. **拦截或改写已有工具调用** → 钩子。事件：`tools/pre-execute`（允许/拒绝/询问）、`ctx.tools.guard()`（最终拒绝）、`tools/execute`（超时/重试）、`tools/post-execute`（改结果）、`tools/result`（只观察）。
2. **换执行世界**（远程沙箱、另一套 FS/进程） → 为已有 seam 写 Provider（`ctx.fs` / `ctx.subprocess` / `ctx.shell` / `ctx.sandbox`）。不要再做一套 `read`/`bash`。
3. **换搜索/抓取后端** → `ctx.web` Provider。模型仍只看见 `web_search` / `web_fetch`。
4. **换/加模型路由** → 先试 `dsh-llm-pi-ai` 配置；协议或鉴权它盖不住再写 `LlmAdapter`。
5. **换子 agent 后端** → `ctx.subagents` Provider + 已有 `dsh-tool-subagent`。
6. **模型需要新的结构化能力** → 工具插件。默认同一个包。
7. **人在 Chat 里要看见新业务行** → Client Conversation Node；Host 必须先写可回放 Session 事件。
8. **人要不经过模型发命令** → `ctx.commands`。
9. **接 Telegram/飞书/IDE** → 协议桥：听 `session/event`，输入走 `agent.followup()`。
10. **一组能力要一起安装** → bundle（patch 层），里面再挂上面这些插件。

## 不要预防性拆 seam

官方规则：只有 Service Definition / Provider / Consumer **需要独立演进**时才拆三包。简单工具一个包同时注册工具即可。

拆分信号：已经有两个后端，或明确要让别人换后端而不改工具名。  
不拆：第一次做 `weather` / `notify` / `csv_preview`。

若拆分：Consumer 和 Provider **只依赖 Definition**，彼此不依赖。

## 不要重复官方工具

已占用的模型可见名称（默认配置，部署可改名）包括：

`read` `write` `edit` `read_image` `glob` `grep` `bash` `pwsh` `web_search` `web_fetch` `skill` `subagent` `subagent_fork` `todo_write` `ask_user_question` `workflow` `ralph` `lsp` `job_list` `job_output` `job_kill` `run_code` `exit_plan_mode`

重复这些名称会冲突。要改行为就换 Provider 或加钩子。

## Client vs Host

- **Host**：工具、钩子、LLM、FS、MCP、协议桥。默认。
- **Client**：只跑在浏览器。Chat 节点、侧栏 Tab、皮肤。需要 `dsh.client` 约定；没有 Host 事件就不要只做 Client。

## Settings 现实约束

- 树外插件默认**进不了** Web Settings 卡片；曝光是 Host `apiproxy` 白名单，不是插件自己声明。
- Agent preset 里挂的插件不能注册 settings 命名空间（多会话会撞车）。配置写进 preset 的 `cordis.yml`。
- 用户覆盖用 profile 的 `cordis.patch.yml`。你的 patch 按 id 整行替换 config，不深度合并。

## 决策记录格式

```markdown
## 形态决策
- 目标：
- 做插件：是 / 否（否的话替代方案：）
- 树外 / first-party：
- 形态：工具 / 钩子 / 提供方 / LLM / UI / 协议桥 / bundle
- 挂载点：ctx.xxx 或 event
- 不选其他形态的原因：
- 拆 seam：否 / 是（理由）
```
