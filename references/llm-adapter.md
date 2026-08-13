# LLM 适配器

官方真源：`docs/cookbook/adding-an-llm-adapter.md`。树外插件先确认官方 `@deepseek-ai/dsh-llm-pi-ai` 配不了：它已经能挂 OpenAI/Anthropic/DeepSeek catalog 和手写 OpenAI 兼容网关。

只有这些情况才新写适配器：非兼容协议、特殊鉴权、pi-ai 声明盖不住的流形。

## 形态

```ts
export const name = 'llm-myprovider'
export const inject = ['llm']

export function apply(ctx: Context, config: Config) {
  ctx.llm.registerAdapter(['my-provider'], new MyAdapter(config))
}
```

每个提供方路由只能有一个适配器。重复注册抛错。多路由必须全部成功或全部失败。

密钥：Schemastery 字段 + `!!js process.env.MY_KEY`，或 `ctx.credentials` 引用。不要读自创密钥文件。

## stream() 义务

- `usage` 必须在 `finish` 之前；`finish` 之后禁止再 yield。
- 工具调用 `arguments` 全程是原始 JSON **字符串**；流式用 `argumentsDelta`。提供方若给对象，在 `block-end` 再 stringify。
- 同一块的 delta 复用首次分配的 `index`。
- 传输/协议故障：抛 `LlmError`。提供方带内失败：`finish { kind: 'error' | 'aborted' }`。
- 遵守 `options.signal`。
- 不支持的 `GenerateOptions` 字段抛 `UNSUPPORTED`，不要静默丢弃。
- 需要原生回放元数据时放 `finish.replayState`。不要靠提供方名字猜回放。

实现 `resolveModel()`，返回身份和可选 `context` / `reasoning`。推理档位用适配器给出的不透明 ID，不要把线上协议拼写暴露给选择器。

参考布局：`packages/llm/llm-deepseek`（HTTP+SSE）和 `packages/llm/llm-pi-ai`（封装库）。
