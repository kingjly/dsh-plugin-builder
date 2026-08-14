# UI 与 Conversation Node

官方真源：`docs/cookbook/adding-a-conversation-node.md`。只在用户要改 **Web Chat 业务行** 时读。侧栏/皮肤若只加 CSS 或 slot，不要上 Node 引擎。

## 分工

1. **Host** 先把业务写成可回放 Session 事件（扩展 `SessionEventMap`，带 `@mode`）。
2. **Client** 用 `ConversationNodeDefinition` 把同一 `id` 的事件收成 State，再注册 keyed renderer。

Client 绝不能猜测「最近一个未完成」的节点。每条事件必须自带稳定 id，或能从 payload 独立推出 id。

## 最小义务

- `match(event)` 只看当前事件，返回 `{ id, role: 'start' | 'update' }` 或 `null`。
- 每个 `(kind, id)` 最多一条 start。
- `start` / `update` 返回引擎要采用的 State。按 `seq` 升序回放必须确定。
- 热路径禁止扫描整窗事件、全部 Context、已渲染节点。
- 节点一旦发布，保持同一个 `context.key`；暂时离开用 `visibility: 'hidden'`，不要返回 `null` 撤回。
- renderer 只吃 `node.data` 和受限 Location hook。

`publication`：结构/结束用 `immediate`，高频进度用 `animation-frame`。

## 验证（官方要求的回放矩阵）

1. 完整窗口 replace → 最终 State 正确。
2. 只有 update 的尾窗保持 pending；prepend start 后与完整 replace 一致。
3. 实时 append 与回放合并结果一致。
4. prepend 更早页不替换未变的 keyed node。

## 普通 UI 插件

不需要 Node 时，优先组合 additive slots 和已有 Client Service：

- 全局浮层、状态胶囊、主题控制器 → `shell.overlay`；不要注册 `root`，否则会遮掉整个 AppFrame。
- 会话页头按钮 → `conversation.session.header.actions` / `.utilities`。
- 输入框上方整行面板 → `conversation.input.dock`；输入卡片内部的小控件 → `.left` / `.right`。
- 整体配色 → `ctx.theme.register()` 注册语义 token 主题；不要靠 brittle DOM selector 重涂每个组件。
- 侧栏与详情栏动作 → 调公开的 `ctx.layout`，不要直接改内部 store 或 DOM 宽度。

普通 UI 插件仍应使用 `dsh.client.inject` 等待声明 slot 的 first-party 包。向 `shell.overlay` 这类后声明 slot 注册时，用 `ctx.slots.inject(key, () => ctx.slots.register(...))`，这样加载顺序和卸载级联都正确。

需要会话事件时：听 `session/event`，输入用 `agent.followup()`。这够做通知、状态条、简单面板。
