import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

export const name = 'dsh-text-metrics'
export const inject = ['tools']

export interface Config {
  maxCharacters: number
}

export const Config: Schema<Config> = Schema.object({
  maxCharacters: Schema.number().default(10_000),
})

export function apply(ctx: Context, config: Config) {
  if (!Number.isInteger(config.maxCharacters) || config.maxCharacters <= 0) {
    throw new Error('maxCharacters must be a positive integer')
  }

  ctx.tools.register(defineTool({
    name: 'text_metrics',
    description: 'Count characters, UTF-8 bytes, words, lines, and non-empty lines in supplied text.',
    parameters: {
      text: {
        type: 'string',
        required: true,
        description: 'Text to analyze without reading from the filesystem.',
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          characters: { type: 'integer', required: true },
          utf8Bytes: { type: 'integer', required: true },
          words: { type: 'integer', required: true },
          lines: { type: 'integer', required: true },
          nonEmptyLines: { type: 'integer', required: true },
        },
        additionalProperties: false,
      },
      render: (_args, value) => [{
        type: 'text',
        text: `${value.characters} characters, ${value.words} words, ${value.lines} lines (${value.utf8Bytes} UTF-8 bytes).`,
      }],
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      const characters = [...args.text].length
      if (characters > config.maxCharacters) {
        throw new Error(`text exceeds maxCharacters (${config.maxCharacters})`)
      }
      const lineValues = args.text === '' ? [] : args.text.split(/\r\n|\r|\n/u)
      return {
        characters,
        utf8Bytes: new TextEncoder().encode(args.text).length,
        words: args.text.trim() === '' ? 0 : args.text.trim().split(/\s+/u).length,
        lines: lineValues.length,
        nonEmptyLines: lineValues.filter(line => line.trim() !== '').length,
      }
    },
  }))

  console.log('[dsh-text-metrics] registered tool: text_metrics')
}
