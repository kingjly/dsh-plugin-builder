---
name: dsh-plugin-builder
description: 把一项能力做成可安装的 DeepSeek Harness（dsh）插件。覆盖全流程：判定插件形态 → 选官方扩展点 → 生成 ESM 插件与 bundle → 本地 --patch 验证 → dsh plugin add 安装。用于：写 dsh 工具/钩子/LLM 适配器/UI 节点/提供方、制作 dsh-plugin、写 cordis.yml / cordis.patch.yml、打包 profile 组合包。触发词包括「做 dsh 插件」「写 DeepSeek Harness 插件」「dsh plugin add」「defineTool」「一切皆插件」「Cordis 插件」。不用于：改 agent-loop、写 Claude/Grok Skill、单独封装 MCP server（先走 mcp-factory，再用官方 mcp-client 接入）。
license: MIT
compatibility: Agent Skills clients such as Grok, Claude Code, and Codex. Optional: Node.js 22+, dsh CLI, Python 3.10+ for local validators.
metadata:
  version: "0.1.0"
  generated_on: "2026-08-13"
  source_mode: "web"
  language: "zh-CN"
  dsh_pin: "deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a (dsh@0.1.0-rc.5)"
---

# DSH 插件制作

把用户要的能力做成**树外可安装组合包**（`dsh.bundle` + `dsh plugin add`）。默认不要往 `deepseek-harness` 仓库里加 first-party 包。

DSH 处于开发者预览，**会破兼容**。生成物必须能对照当前官方文档复核，不要把本 skill 里的 API 当成永久契约。

## 工作原则

- **形态先行**：先判定插件形态和扩展点，再写代码。选错缝比写错函数更贵。
- **不改循环**：新行为挂已文档化的扩展点。改 `agent-loop` 不在本 skill 范围。
- **树外优先**：用户插件是独立 npm 包，不是 `packages/<group>/<pkg>`。
- **注册即副作用**：工具、监听、定时器走 `ctx.effect()` / `ctx.on()` / `register()`；卸载必须可逆。
- **密钥不进仓库**：凭据走环境变量或 `ctx.credentials`，配置里只写引用名。
- **渐进披露**：本文件只放流程；细节按任务读 `references/`。

## 何时使用

- 用户要把搜索、审批、通知、浏览器、记忆、IM 桥、皮肤、侧栏等做成 dsh 插件。
- 用户提到 `dsh plugin add`、`cordis.yml`、`defineTool`、`dsh.bundle`、`dsh-plugin`。
- 用户要给现有官方 seam 换提供方（`ctx.llm` / `ctx.web` / `ctx.fs` / `ctx.subagents`）。

## 何时不用

- 改 agent loop、fork 官方循环实现 → 拒绝，改挂扩展点。
- 写 Agent Skill / SKILL.md → 用 skill-factory。
- 单独做 MCP server → 用 mcp-factory；接入 dsh 时用官方 `@deepseek-ai/dsh-mcp-client`。
- 只调研生态、不写插件 → 直接回答，不必走本流程。
- 给 first-party monorepo 加包，且用户明确在贡献 `deepseek-ai/deepseek-harness` → 读 `references/first-party-monorepo.md`，不要套树外 bundle 模板。

## 输入与假设

开始前抓住这些（缺了会改变产物形态的才追问）：

1. **要解决的事**：一句话目标，不是「写个插件」。
2. **形态偏好**：工具 / 钩子 / 提供方 / UI / 协议桥 / 未定。
3. **加载面**：Host（默认，agent 进程）还是 Client（浏览器）。
4. **交付方式**：本地 `--patch` 试跑，还是可安装 bundle。
5. **密钥**：有哪些，环境变量名是什么。

未指定时默认：树外 Host 插件、TypeScript ESM、Web profile、先 `--patch` 再打包。

## 工作流

> 括号里是按需读取的 reference。不要一次读完。

### 第 0 步 · Intake

写成一行 brief：目标 + 形态假设 + Host/Client + 密钥。

### 第 1 步 · 形态决策门（不可跳过）

**读 `references/shape-decision.md`。** 判定并记录：

| 判定 | 若命中则 |
|---|---|
| 其实该改提示词 / 加 skill 文件 / 配 MCP | **停止生成插件**，给替代方案 |
| 官方已有同名工具（`bash`/`read`/`web_search`…） | 换提供方或加策略，不要再注册同名工具 |
| 需要拦截已有工具 | 钩子插件，不要包一层假工具 |
| 需要换模型厂 / 网关 | LLM 适配器或配置 `dsh-llm-pi-ai` |
| 需要换搜索 / 沙箱 / 子 agent 后端 | 现有 seam 的 Service Provider |
| 模型要调用新能力 | 工具插件（默认同包，不要预防性拆 seam） |
| 要改 Web Chat 展示 | Client 插件 + Conversation Node |
| 要接 IM / IDE / ACP | 协议桥，驱动 `ctx.agents` |
| 用户坚持改 loop | **拒绝**，指出对应扩展点 |

输出一份 `plugin-design.md`（模板在 `assets/templates/plugin-design.template.md`）。判定为「不做插件」时只交替代方案，停止。

### 第 2 步 · 选扩展点与依赖

按形态读对应 reference：

| 形态 | 读取 |
|---|---|
| 工具 | `references/tool-plugin.md` |
| 钩子 / 权限 / 超时 / 审计 | `references/hook-policy.md` |
| LLM 适配器 | `references/llm-adapter.md` |
| Chat 节点 / 侧栏 / 皮肤 | `references/ui-node.md` |
| 打包安装 / profile | `references/publish-profile.md` |
| 密钥、危险工具、git prepare | `references/safety.md` |

硬约束（细节在各 reference，此处只列门闩）：

- 扩展插件只依赖 **Service Definition**，不依赖具体提供方。
- Waterfall 监听必须调用 `next()`，除非你要短路。
- 抵达模型的内容必须能从会话日志重建。
- 部署会变的值必须是 `Config` 字段，用 Schemastery 导出，不要普通对象。
- 无效配置在加载时响亮失败。

### 第 3 步 · 脚手架

在用户指定目录生成最小包（默认包名 `dsh-<slug>`）：

```text
<pkg>/
├── package.json              # dsh.bundle.patch
├── cordis.patch.yml          # 安装后插入的层
├── src/index.ts              # name + inject + apply + Config
├── tsconfig.json
└── README.md
```

用 `assets/templates/` + `scripts/render_template.py`。开发期另给一份绝对路径的 `cordis.dev.yml`，供：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

`cordis.patch.yml` 里的 `name` 用包名；`--patch` 开发文件里的 `name` 用**绝对路径**。

### 第 4 步 · 实现

只实现第 1 步选中的那一种形态。常见最小实现：

- 工具：`ctx.tools.register(defineTool({...}))`，`execute` 返回规范 JSON，`output.render` 面向模型。
- 钩子：`ctx.on('tools/pre-execute', async (exec, next) => ...)`。
- 适配器：`ctx.llm.registerAdapter(['route'], adapter)`。
- UI：注册 `ConversationNodeDefinition` + keyed renderer；Host 先落可回放事件。

密钥只引用环境变量名。不要把用户给的 token 写入任何生成文件。

### 第 5 步 · 验证

1. 跑 `py -3 scripts/validate_dsh_plugin.py <pkg>`。
2. 能从源码跑 dsh 时：`--patch` 启动，确认加载日志，再让模型走一条成功路径。
3. 工具插件至少证明：schema 出现、一次成功调用、一次非法参数失败。
4. 钩子插件至少证明：拒绝路径和放行路径。
5. 自测失败先修，再交付。

### 第 6 步 · 打包安装

**读 `references/publish-profile.md`。** 按用户需要选一种：

```sh
dsh plugin --profile web add ./<pkg>
dsh --profile web --dump-config
```

Git 安装必须有自包含 `prepare`，用户还要在 profile 的 `pnpm-workspace.yaml` 里 `allowBuilds`。更稳的是 `pnpm pack` 出 tarball 或发 npm。

仓库打上 GitHub topic `dsh-plugin`。

## 输出契约

必须返回：

1. **形态决策记录**（做 / 不做 + 选了哪条缝 + 为什么不选其他）。
2. **交付树**和每个文件路径。
3. **本地加载命令**（`--patch` 或 `dsh plugin add`）。
4. **自测结果**（做了什么、没做什么）。
5. **已知局限**（预览破兼容、Settings 白名单、preset 不能注册 settings 命名空间等）。

判定「不做插件」时，只返回替代方案和理由。

## 质量门

- [ ] 第 1 步决策已写进 `plugin-design.md`；该停止时没有生成包。
- [ ] 没有改 `agent-loop`，没有预防性拆三包 seam。
- [ ] `package.json` 含 `type: module` 与 `dsh.bundle.patch`；patch 能对上入口。
- [ ] `validate_dsh_plugin.py` 通过；无硬编码密钥。
- [ ] 工具有规范 `output.schema`；钩子 waterfall 调用 `next()`。
- [ ] 可调参数在 `Config`；误配会在加载失败。

## 渐进式引用

| 任务 | 读取 |
|---|---|
| 形态 / 替代方案 / 何时拆 seam | `references/shape-decision.md` |
| 写 defineTool / UI 卡片 / 后台 job | `references/tool-plugin.md` |
| 写 pre-execute / execute 包装 | `references/hook-policy.md` |
| 接新模型厂 | `references/llm-adapter.md` |
| Chat 节点 / Client 插件 | `references/ui-node.md` |
| bundle / profile / git prepare | `references/publish-profile.md` |
| 密钥、审批、危险能力 | `references/safety.md` |
| 给官方仓库加包 | `references/first-party-monorepo.md` |
| 查证来源 | `references/source-ledger.md` |
