import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = 'dsh-greeter'
export const inject = ['tools']

export interface Config {
  greeting: string
  punctuation: string
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello, '),
  punctuation: Schema.string().default('!'),
})

export function apply(ctx: Context, config: Config) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet a person by name with the configured greeting style.',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'The person to greet.',
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          recipient: { type: 'string', required: true },
          message: { type: 'string', required: true },
        },
        additionalProperties: false,
      },
      render: (_args, value) => [{ type: 'text', text: value.message }],
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      const recipient = args.name.trim()
      if (!recipient) throw new Error('name must not be blank')
      return {
        recipient,
        message: `${config.greeting}${recipient}${config.punctuation}`,
      }
    },
  }))

  console.log('[dsh-greeter] registered tool: greet')
}
