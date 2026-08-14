---
name: dsh-plugin-builder
description: 构建、修改、验证和管理 DeepSeek Harness（dsh）树外插件。覆盖插件形态决策、官方扩展点选择、TypeScript ESM 与 bundle 生成、已有插件增量修改、本地 --patch 验证、dsh plugin 安装，以及已安装插件的来源识别、热启用和热停用。用于用户提到 dsh 插件、DeepSeek Harness 插件、defineTool、Cordis 插件、dsh.bundle、cordis.yml、cordis.patch.yml、dsh plugin add/remove、插件已启用/已停用、热加载、热卸载或想控制现有插件状态时。不用于修改 agent-loop、编写 Agent Skill，或单独构建 MCP server。
---

# DSH 插件构建与维护

把用户要的能力做成**树外可安装组合包**（`dsh.bundle` + `dsh plugin add`），或安全地修改、启停已经安装的插件。默认不要往 `deepseek-harness` 仓库里加 first-party 包。

DSH 处于开发者预览，**会破兼容**。生成物必须能对照当前官方文档复核，不要把本 skill 里的 API 当成永久契约。

## 工作原则

- **形态先行**：先判定插件形态和扩展点，再写代码。选错缝比写错函数更贵。
- **不改循环**：新行为挂已文档化的扩展点。改 `agent-loop` 不在本 skill 范围。
- **树外优先**：用户插件是独立 npm 包，不是 `packages/<group>/<pkg>`。
- **注册即副作用**：工具、监听、定时器走 `ctx.effect()` / `ctx.on()` / `register()`；卸载必须可逆。
- **生命周期分层**：`cordis.patch.yml` 控制已安装条目的运行状态；依赖和 bundle 清单变更属于安装层，通常需要重启。
- **密钥不进仓库**：凭据走环境变量或 `ctx.credentials`，配置里只写引用名。
- **渐进披露**：本文件只放流程；细节按任务读 `references/`。

## 职责边界

- 改 agent loop、fork 官方循环实现 → 拒绝，改挂扩展点。
- 写 Agent Skill / SKILL.md → 用 skill-factory。
- 单独做 MCP server → 用 mcp-factory；接入 dsh 时用官方 `@deepseek-ai/dsh-mcp-client`。
- 只调研生态、不写插件 → 直接回答，不必走本流程。
- 给 first-party monorepo 加包，且用户明确在贡献 `deepseek-ai/deepseek-harness` → 读 `references/first-party-monorepo.md`，不要套树外 bundle 模板。

## 输入与假设

开始前抓住这些（缺了会改变产物形态的才追问）：

1. **要解决的事**：一句话目标，不是「写个插件」。
2. **任务模式**：新建 / 修改 / 启用 / 停用 / 安装 / 卸载。
3. **形态偏好**：工具 / 钩子 / 提供方 / UI / 协议桥 / 未定。
4. **加载面**：Host（默认，agent 进程）还是 Client（浏览器）。
5. **运行位置**：实际 `DSH_HOME`、profile 名和服务进程；不要默认使用 `~/.dsh`。
6. **交付方式**：本地 `--patch` 试跑，还是可安装 bundle。
7. **密钥**：有哪些，环境变量名是什么。

新建任务未指定时默认：树外 Host 插件、TypeScript ESM、Web profile、先 `--patch` 再打包。生命周期任务先查明正在运行的 home/profile，不猜路径。

## 工作流

> 括号里是按需读取的 reference。不要一次读完。

### 第 0 步 · Intake

写成一行 brief：目标 + 任务模式 + 形态假设 + Host/Client + home/profile + 密钥。

### 生命周期分支 · 已有插件的识别、启停与卸载

任务是识别来源、启用、停用、安装或卸载已有插件时，**先读 `references/plugin-lifecycle.md`**：

1. 锁定运行服务真正使用的 `DSH_HOME` 与 profile；同时检查 profile manifest、profile/home 两级用户 patch 和实时 inventory。
2. 区分运行状态与安装状态：已安装条目的启停写 profile 的 `cordis.patch.yml`；依赖增删走 `dsh plugin`。
3. 热启停只修改精确 raw entry id 的 `disabled` 覆盖，不改 bundle 源文件，不删除依赖。
4. 先验证 Host inventory；Client 插件在已打开页面里可能要刷新一次才会加载或卸载 UI。
5. 安装、卸载或修改 `dsh.profile.bundles` 后重启服务，并复核使用了同一个 `DSH_HOME`。

只做生命周期操作时完成该分支后直接按输出契约交付，不进入脚手架。需要修改插件代码时，先审计已有包并保留包名、entry id、配置键和持久化数据语义，再继续第 1 步。

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
| 要改整套 Web UI / 加 Shell 控件 | Client 插件 + 语义主题 + additive shell slot |
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
- 只做最终拒绝的单调策略优先用 `ctx.tools.guard()`；需要审批、改写或与其他处理器串联时再用 waterfall，放行必须调用 `next()`。
- 抵达模型的内容必须能从会话日志重建。
- 部署会变的值必须是 `Config` 字段，用 Schemastery 导出，不要普通对象。
- 无效配置在加载时响亮失败。

### 第 3 步 · 脚手架

仅新建插件时，在用户指定目录生成最小包（默认包名 `dsh-<slug>`）。已有插件只增量修改目标文件，不重新铺脚手架：

```text
<pkg>/
├── package.json              # dsh.bundle.patch
├── cordis.patch.yml          # 安装后插入的层
├── src/index.ts              # name + inject + apply + Config
├── tsconfig.json
└── README.md
```

用 `assets/templates/` + `scripts/render_template.py`。开发期另给一份绝对 import specifier 的 `cordis.dev.yml`，供：

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

`cordis.patch.yml` 里的 `name` 用包名；`--patch` 开发文件里的 `name` 用绝对 import specifier。POSIX 使用绝对路径；Windows 必须转换成 `file:///C:/.../src/index.ts` URL，不能直接写 `C:/...`，否则 Node ESM 会把 `c:` 当作不支持的协议。

### 第 4 步 · 实现

只实现第 1 步选中的那一种形态。常见最小实现：

- 工具：`ctx.tools.register(defineTool({...}))`，`execute` 返回规范 JSON，`output.render` 面向模型。
- 最终拒绝策略：`ctx.tools.guard(exec => reason | undefined)`；审批、改写或串联：`ctx.on('tools/pre-execute', async (exec, next) => ...)`。
- 适配器：`ctx.llm.registerAdapter(['route'], adapter)`。
- Chat UI：注册 `ConversationNodeDefinition` + keyed renderer；Host 先落可回放事件。
- 整体 Web UI：优先注册语义主题并追加 additive slot；不覆盖 `root` / `sidebar` / `conversation` single slot。

密钥只引用环境变量名。不要把用户给的 token 写入任何生成文件。

### 第 5 步 · 验证

1. 跑 `py -3 scripts/validate_dsh_plugin.py <pkg>`。
2. 能从源码跑 dsh 时：`--patch` 启动，确认加载日志，再让模型走一条成功路径。
3. 工具插件至少证明：schema 出现、一次成功调用、一次非法参数失败。
4. 策略插件至少证明：拒绝路径和放行路径；guard 还要覆盖实际 transport 的参数形状。
5. Client 插件至少证明：新页面加载成功、卸载副作用可逆；若做生命周期操作，同时验证 inventory 状态和刷新后的 UI。
6. 自测失败先修，再交付。

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

生命周期任务改为返回：实际 home/profile、目标 entry id、修改的 patch、Host inventory 前后状态、是否重启、Client 是否需要刷新，以及恢复原状态的方法。

判定「不做插件」时，只返回替代方案和理由。

## 质量门

- [ ] 第 1 步决策已写进 `plugin-design.md`；该停止时没有生成包。
- [ ] 没有改 `agent-loop`，没有预防性拆三包 seam。
- [ ] `package.json` 含 `type: module` 与 `dsh.bundle.patch`；patch 能对上入口。
- [ ] `validate_dsh_plugin.py` 通过；无硬编码密钥。
- [ ] 工具有规范 `output.schema`；guard 的放行返回 `undefined`，waterfall 的放行调用 `next()`。
- [ ] 可调参数在 `Config`；误配会在加载失败。
- [ ] 生命周期操作命中了实际运行的 `DSH_HOME` / profile，没有根据默认目录猜测。
- [ ] 热启停写用户 `cordis.patch.yml`，没有把 `package.json` 或 `dsh plugin remove` 当成热停用。
- [ ] 已验证 Host inventory；Client 插件另验证刷新后的 UI，且未误伤其他插件。

## 渐进式引用

| 任务 | 读取 |
|---|---|
| 形态 / 替代方案 / 何时拆 seam | `references/shape-decision.md` |
| 写 defineTool / UI 卡片 / 后台 job | `references/tool-plugin.md` |
| 写 pre-execute / execute 包装 | `references/hook-policy.md` |
| 接新模型厂 | `references/llm-adapter.md` |
| Chat 节点 / Client 插件 | `references/ui-node.md` |
| bundle / profile / git prepare | `references/publish-profile.md` |
| 已有插件来源、热启停、卸载、UI 刷新 | `references/plugin-lifecycle.md` |
| 密钥、审批、危险能力 | `references/safety.md` |
| 给官方仓库加包 | `references/first-party-monorepo.md` |
| 查证来源 | `references/source-ledger.md` |
