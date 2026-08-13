import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = '{{PLUGIN_NAME}}'

export interface Config {
  greeting: string
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
})

export function apply(_ctx: Context, config: Config) {
  console.log(`[{{PLUGIN_NAME}}] plugin loaded! ${config.greeting}`)
}
