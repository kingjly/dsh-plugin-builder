import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = 'dsh-command-safety'
export const inject = ['tools']

export interface Config {
  protectedTools: string[]
  blockedPatterns: string[]
  reason: string
}

export const Config: Schema<Config> = Schema.object({
  protectedTools: Schema.array(Schema.string()).default(['bash', 'pwsh']),
  blockedPatterns: Schema.array(Schema.string()).default([
    '\\brm\\s+-(?=[^\\s]*r)(?=[^\\s]*f)[^\\s]+\\s+(?:/|~|\\$HOME)(?:\\s|$)',
    '\\bRemove-Item\\b(?=[^\\r\\n]*\\b-Recurse\\b)(?=[^\\r\\n]*\\b-Force\\b)',
  ]),
  reason: Schema.string().default('Blocked by the command-safety policy.'),
})

export function apply(ctx: Context, config: Config) {
  const rules = config.blockedPatterns.map((source, index) => {
    try {
      return { source, regex: new RegExp(source, 'iu') }
    } catch (error) {
      throw new Error(`blockedPatterns[${index}] is not a valid regular expression`, { cause: error })
    }
  })
  const protectedTools = new Set(config.protectedTools)

  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (!protectedTools.has(exec.name)) return next()

    const command = commandOf(exec)
    const matched = rules.find(rule => rule.regex.test(command))
    if (!matched) return next()

    return {
      kind: 'deny',
      reason: `${config.reason} Matched policy pattern: /${matched.source}/iu`,
    }
  })

  console.log(`[dsh-command-safety] protecting tools: ${[...protectedTools].join(', ')}`)
}

function commandOf(exec: ToolExecution): string {
  const args = exec.arguments
  if (!args || typeof args !== 'object') return ''
  for (const key of ['command', 'cmd', 'script'] as const) {
    if (key in args) return String((args as Record<string, unknown>)[key] ?? '')
  }
  return ''
}
