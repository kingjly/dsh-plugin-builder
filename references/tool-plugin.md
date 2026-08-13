# 工具插件

官方真源：`docs/cookbook/adding-a-tool.md` 与 `docs/user/develop/basic/tool.md`。本页只保留树外插件会用到的约定。

## 最小形态

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

`inject: ['tools']` 等到注册表就绪。`register()` 返回 disposer，插件卸载即注销。schema 自动进入系统提示词。

## execute 规则

- `defineTool` 先按 schema 校验再进 `execute`。仍要检查非空、正数、跨字段规则。
- 返回**规范 JSON 值**，不要返回 UI 内容块。`output.render(args, value)` 才是模型可见文本。
- 抛异常或返回不合 schema 的值 → `isError`。领域上的「失败」（例如进程非零退出）应写进规范值，由 render 解释。
- 遵守 `exec.signal`；取消时停掉进行中的工作。
- 异步通知：`exec.agent.inject({ content, source: { kind: 'plugin', plugin: name } })`。这不会唤醒空闲 agent。dispose 后的 agent 要 try/catch。
- 注册后不要改 schema 或替换回调。热替换：dispose 所属 effect，再注册新工具。

## 输出设计

把 `output.schema` 当成程序 API：返回 id、字段、句柄。给人看的句子放 `render`。Code Mode 里工具是 `await tools.<name>(args)`，拿到的是规范值不是卡片。

## 后台工作

需要 `run_in_background` 时用 `ctx.jobs.start({ kind, label, owner: exec.agent, run })`。成功分支返回 `{ kind: 'background', jobId }`，不要让模型靠解析自然语言拿 id。发布 job 之后用任务自己的取消信号，不要继续绑 `exec.signal`。

## UI 卡片（有 Chat 时一并设计）

`presentCall` / `presentResult` 必须是纯函数，回放时也会跑：禁止 I/O、读会话、用时钟。

- `generic`：默认
- `terminal`：本身是命令
- `diff`：创建或改文件
- `search` / `web`：结果期卡片，数据放 `presentationMeta`

UI 格式不要进规范值。展示失败应回退通用卡片，不能让回放崩溃。

## 配置

部署会变的超时、端点、开关做成 Schemastery `Config`。不要 `const TIMEOUT = 30000`。

```ts
import Schema from '@deepseek-ai/schemastery'

export interface Config {
  timeoutMs: number
}

export const Config: Schema<Config> = Schema.object({
  timeoutMs: Schema.number().default(30_000),
})
```

不要导出普通对象当 `Config`。

## 依赖

树外工具插件的 peer：`@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools`。用配置时再加 `@deepseek-ai/schemastery`。版本对齐用户已装的 dsh，不要锁死一份过期 rc。

## 验证

- `--patch` 启动后终端出现加载日志。
- 模型能点名调用；成功返回规范值。
- 缺必填参数时工具失败，插件不崩溃。
- 若声明了 signal：取消路径可中止。
