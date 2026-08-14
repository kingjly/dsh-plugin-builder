import type { Context } from '@deepseek-ai/cordis'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = 'showcase-command-safety'
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
    '\\bRemove-Item\\b(?=[^\\r\\n]*-Recurse\\b)(?=[^\\r\\n]*-Force\\b)',
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

  ctx.tools.guard((exec) => {
    if (!protectedTools.has(exec.name)) return undefined
    const command = commandOf(exec)
    const matched = rules.find(rule => rule.regex.test(command))
    if (!matched) return undefined

    return `${config.reason} Matched policy pattern: /${matched.source}/iu`
  })

  console.log(`[dsh-command-safety] protecting tools: ${[...protectedTools].join(', ')}`)
}

function commandOf(exec: ToolExecution): string {
  const args = exec.arguments
  if (typeof args === 'string') return args
  if (!args || typeof args !== 'object') return ''
  const record = args as Record<string, unknown>
  for (const key of ['command', 'cmd', 'script'] as const) {
    if (key in record) return String(record[key] ?? '')
  }
  // Composite transports may wrap a native tool's parsed arguments. Matching
  // the lossless JSON fallback keeps the policy transport-agnostic without
  // mutating or reinterpreting the call.
  return JSON.stringify(args)
}
