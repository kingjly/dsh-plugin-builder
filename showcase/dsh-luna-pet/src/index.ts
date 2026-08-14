import type { Context } from '@deepseek-ai/cordis'

export const name = 'showcase-luna-pet'

export function apply(_ctx: Context): void {
  console.log('[dsh-luna-pet] Host bundle mounted; animated pet is provided by ./client')
}
