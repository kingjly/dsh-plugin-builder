# 钩子与策略

官方示例：`docs/cookbook/extension-cookbook.md` 的权限门禁。原生钩子就是普通 Cordis 插件，不必走 Claude/Codex 的 `hooks.json`。要把已有 hooks 文件接进来，用官方 `dsh-hooks-claude-code` / `dsh-hooks-codex`。

## 选哪个点

| 点 | 用途 | 返回 |
|---|---|---|
| `tools/pre-execute` | 允许 / 拒绝 / 询问用户 | 类型化决策，或 `next()` |
| `ctx.tools.guard()` | 最终单调拒绝，后面不能翻案 | 守卫 |
| `tools/execute` | 超时、重试、指标；可替换 `exec.signal` | 包一层再 `next()` |
| `tools/post-execute` | 改展示、改返回值、附加模型可见上下文 | 变换后的决策 |
| `tools/result` | 只观察不可变最终结果 | 不要改 |
| `agent/pre-step` | 改写或拒绝本步将进入模型的消息 | waterfall，必须 `next()` 才能委托 |
| `agent/request` | 拦截即将发出的模型请求 | waterfall |
| `agent/turn-stopping` | 停轮次；可 steer 触发下一步 | serial，没有 `next()` |
| `fs/*` | 读前写、版本守卫等 FS 策略 | 按官方 fs 门禁 |

Waterfall：**必须调用 `next()`** 才能交给下游。不调用就是短路。

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

准备三条路径：放行、拒绝、（若实现了）询问。拒绝必须留下模型或用户能看见的原因。
