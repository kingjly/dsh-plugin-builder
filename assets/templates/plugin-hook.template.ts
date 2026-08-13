import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = '{{PLUGIN_NAME}}'
export const inject = ['tools']

export interface Config {
  denyToolName: string
  reason: string
}

export const Config: Schema<Config> = Schema.object({
  denyToolName: Schema.string().default('{{DENY_TOOL_NAME}}'),
  reason: Schema.string().default('Denied by policy.'),
})

export function apply(ctx: Context, config: Config) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (exec.name === config.denyToolName) {
      return { kind: 'deny', reason: config.reason }
    }
    return next()
  })
}
