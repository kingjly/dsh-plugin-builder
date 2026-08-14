# 钩子与策略

官方示例：`docs/cookbook/extension-cookbook.md` 的权限门禁。原生钩子就是普通 Cordis 插件，不必走 Claude/Codex 的 `hooks.json`。要把已有 hooks 文件接进来，用官方 `dsh-hooks-claude-code` / `dsh-hooks-codex`。

## 选哪个点

| 点 | 用途 | 返回 |
|---|---|---|
| `ctx.tools.guard()` | 只做最终拒绝的单调策略 | 返回拒绝原因；放行返回 `undefined` |
| `tools/pre-execute` | 允许 / 拒绝 / 询问用户、改写或串联 | 类型化决策，或 `next()` |
| `tools/execute` | 超时、重试、指标；可替换 `exec.signal` | 包一层再 `next()` |
| `tools/post-execute` | 改展示、改返回值、附加模型可见上下文 | 变换后的决策 |
| `tools/result` | 只观察不可变最终结果 | 不要改 |
| `agent/pre-step` | 改写或拒绝本步将进入模型的消息 | waterfall，必须 `next()` 才能委托 |
| `agent/request` | 拦截即将发出的模型请求 | waterfall |
| `agent/turn-stopping` | 停轮次；可 steer 触发下一步 | serial，没有 `next()` |
| `fs/*` | 读前写、版本守卫等 FS 策略 | 按官方 fs 门禁 |

Waterfall：**必须调用 `next()`** 才能交给下游。不调用就是短路。

## 最终拒绝 guard

当策略只有“命中就拒绝，否则不干预”两种结果时，优先注册 guard。它是单调约束，不会因为忘记 `next()` 而吞掉正常执行：

```ts
export function apply(ctx: Context) {
  ctx.tools.guard((exec) => {
    if (exec.name !== 'bash') return undefined
    const command = String((exec.arguments as Record<string, unknown>)?.command ?? '')
    return /\brm\s+-rf\s+\//u.test(command)
      ? '拒绝删除根目录'
      : undefined
  })
}
```

真实 transport 可能直接传对象、字符串，或把原生参数包在复合对象中。实现与测试必须覆盖实际参数形状，不能只测理想化 `{ command }`。

## 权限门禁

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

export const name = 'permission-gate'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (exec.name === 'bash' && /\brm\s+-rf\s+\//.test(commandOf(exec))) {
      return { kind: 'deny', reason: 'Refusing destructive root delete.' }
    }
    return next()
  })
}

function commandOf(exec: ToolExecution): string {
  const args = exec.arguments
  if (args && typeof args === 'object' && 'command' in args) {
    return String((args as { command: unknown }).command)
  }
  return ''
}
```

需要人点头时，按官方工具流水线从 `pre-execute` 返回 `ask`，经 `ctx.approval` 应答。不要自己弹一个绕过审批缝的对话框。

## 不要做的事

- 用钩子冒充新工具。模型需要新能力就注册工具。
- 在 `tools/result` 里改值。
- 静默吞掉错误或静默跳过缺失依赖。
- 把策略写死在某个 `dsh-tool-*` 提供方里，导致换提供方后策略消失。

## 验证

准备三条路径：放行、拒绝、（若实现了）询问。拒绝必须留下模型或用户能看见的原因。guard 还要验证直传对象、字符串和实际复合 transport 参数中至少会用到的形态。
