import type { Context } from '@deepseek-ai/cordis'

export const name = 'showcase-aurora-ui'

export function apply(_ctx: Context): void {
  console.log('[dsh-aurora-ui] Host bundle mounted; Web theme is provided by ./client')
}
