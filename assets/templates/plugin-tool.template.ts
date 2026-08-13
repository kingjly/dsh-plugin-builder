import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = '{{PLUGIN_NAME}}'
export const inject = ['tools']

export interface Config {
  {{CONFIG_FIELD}}: {{CONFIG_TS_TYPE}}
}

export const Config: Schema<Config> = Schema.object({
  {{CONFIG_FIELD}}: Schema.{{CONFIG_SCHEMA}}().default({{CONFIG_DEFAULT_TS}}),
})

export function apply(ctx: Context, config: Config) {
  ctx.tools.register(defineTool({
    name: '{{TOOL_NAME}}',
    description: '{{TOOL_DESCRIPTION}}',
    parameters: {
      {{PARAM_NAME}}: {
        type: 'string',
        required: true,
        description: '{{PARAM_DESCRIPTION}}',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      return `${config.{{CONFIG_FIELD}}}${args.{{PARAM_NAME}}}`
    },
  }))
}
