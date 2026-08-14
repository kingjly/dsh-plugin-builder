import { createElement as h, type CSSProperties } from 'react'
import type {
  ChatConversationViewNode,
  ClientContext,
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import type { ReleaseFinding, ReleaseReadinessResult, ReleaseStatus } from '../types.js'

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ChatNodeDataMap {
    'release-readiness': ReleaseReadinessResult
  }
}

const definition: ConversationNodeDefinition<ReleaseReadinessResult> = {
  kind: 'release-readiness',
  target: 'chat',
  match: event => releaseReadinessResultOf(event) === null
    ? null
    : { id: String(event.seq), role: 'start' },
  start: (_context, match) => {
    const result = releaseReadinessResultOf(match.event)
    if (result === null) throw new Error('release-readiness requires tool/result presentation metadata')
    return result
  },
  update: context => context.state,
  publication: () => 'immediate',
  buildViewNode: (context): ChatConversationViewNode | null => {
    if (context.start === undefined || context.state === undefined) return null
    return {
      key: context.key,
      kind: 'release-readiness',
      id: context.id,
      target: 'chat',
      anchorSeq: context.start.event.seq,
      location: context.start.location,
      visibility: 'visible',
      data: context.state,
    }
  },
}

function releaseReadinessResultOf(event: SessionEvent): ReleaseReadinessResult | null {
  if (event.type !== 'tool/result') return null
  const meta = event.data.meta
  if (!isRecord(meta) || meta.kind !== 'release-readiness' || meta.version !== 1) return null
  const result = meta.result
  if (!isRecord(result) || typeof result.releaseName !== 'string' || typeof result.score !== 'number') return null
  if (result.status !== 'ready' && result.status !== 'at-risk' && result.status !== 'blocked') return null
  if (!isRecord(result.counts) || !Array.isArray(result.passed) || !Array.isArray(result.warnings) || !Array.isArray(result.blockers)) return null
  if (typeof result.recommendation !== 'string') return null
  return result as unknown as ReleaseReadinessResult
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const panel: CSSProperties = {
  margin: '14px 0',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid rgba(99, 102, 241, 0.35)',
  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.16), rgba(14, 165, 233, 0.08))',
  boxShadow: '0 12px 36px rgba(15, 23, 42, 0.12)',
  color: 'var(--fg-primary, inherit)',
}

const statusColor: Record<ReleaseStatus, string> = {
  ready: '#16a34a',
  'at-risk': '#d97706',
  blocked: '#dc2626',
}

const statusLabel: Record<ReleaseStatus, string> = {
  ready: 'READY',
  'at-risk': 'AT RISK',
  blocked: 'BLOCKED',
}

function CountTile({ color, count, label }: { color: string; count: number; label: string }) {
  return h('div', {
    style: {
      minWidth: '88px', padding: '10px 12px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(148,163,184,0.28)',
    },
  },
  h('div', { style: { color, fontSize: '22px', fontWeight: 750, lineHeight: 1.1 } }, String(count)),
  h('div', { style: { marginTop: '4px', fontSize: '11px', letterSpacing: '.08em', opacity: 0.7 } }, label))
}

function FindingList({ color, heading, items }: {
  color: string
  heading: string
  items: readonly ReleaseFinding[]
}) {
  if (items.length === 0) return null
  return h('div', { style: { marginTop: '14px' } },
    h('div', { style: { color, fontSize: '12px', fontWeight: 750, letterSpacing: '.08em' } }, heading),
    h('ul', { style: { margin: '7px 0 0', paddingLeft: '20px' } },
      ...items.map(item => h('li', { key: `${heading}:${item.name}`, style: { margin: '5px 0', lineHeight: 1.45 } },
        h('strong', null, item.name),
        h('span', { style: { opacity: 0.68 } }, ` · ${item.category}`),
        item.detail ? h('span', null, ` — ${item.detail}`) : null,
      )),
    ),
  )
}

interface ReleaseReadinessCardProps {
  readonly node: {
    readonly data: ReleaseReadinessResult
  }
}

function ReleaseReadinessCard({ node }: ReleaseReadinessCardProps) {
  const data = node.data
  const color = statusColor[data.status]
  return h('section', {
    'aria-label': `Release readiness dashboard for ${data.releaseName}`,
    'data-release-readiness': data.status,
    style: panel,
  },
  h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px' } },
    h('div', null,
      h('div', { style: { fontSize: '11px', fontWeight: 750, letterSpacing: '.11em', opacity: 0.58 } }, 'RELEASE READINESS'),
      h('h3', { style: { margin: '5px 0 0', fontSize: '18px', lineHeight: 1.25 } }, data.releaseName),
      h('span', {
        style: {
          display: 'inline-block', marginTop: '9px', padding: '4px 9px', borderRadius: '999px',
          color, background: `${color}18`, border: `1px solid ${color}55`, fontSize: '11px', fontWeight: 800,
        },
      }, statusLabel[data.status]),
    ),
    h('div', { style: { textAlign: 'right', minWidth: '92px' } },
      h('div', { style: { color, fontSize: '36px', fontWeight: 820, lineHeight: 1 } }, String(data.score)),
      h('div', { style: { marginTop: '3px', fontSize: '11px', opacity: 0.6 } }, 'SCORE / 100'),
    ),
  ),
  h('div', { style: { height: '7px', margin: '16px 0', overflow: 'hidden', borderRadius: '999px', background: 'rgba(148,163,184,0.22)' } },
    h('div', { style: { width: `${data.score}%`, height: '100%', borderRadius: 'inherit', background: color } }),
  ),
  h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '9px' } },
    h(CountTile, { color: '#16a34a', count: data.counts.pass, label: 'PASSED' }),
    h(CountTile, { color: '#d97706', count: data.counts.warn, label: 'WARNINGS' }),
    h(CountTile, { color: '#dc2626', count: data.counts.fail, label: 'BLOCKERS' }),
  ),
  h(FindingList, { color: '#dc2626', heading: 'BLOCKERS', items: data.blockers }),
  h(FindingList, { color: '#d97706', heading: 'WARNINGS', items: data.warnings }),
  h('div', {
    style: {
      marginTop: '15px', padding: '11px 13px', borderRadius: '11px',
      background: 'rgba(15, 23, 42, 0.06)', fontSize: '13px', lineHeight: 1.45,
    },
  }, h('strong', null, 'Recommendation: '), data.recommendation))
}

export const inject = ['conversationEvents', 'slots']

export function apply(ctx: ClientContext): void {
  ctx.conversationEvents.register(definition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'release-readiness',
  }, ReleaseReadinessCard))
}
