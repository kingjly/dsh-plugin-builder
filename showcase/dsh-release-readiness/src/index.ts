import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import type {
  ReleaseCheckStatus,
  ReleaseFinding,
  ReleaseReadinessResult,
} from './types.js'

export const name = 'showcase-release-readiness'
export const inject = ['tools']

export interface Config {
  maxChecks: number
}

export const Config: Schema<Config> = Schema.object({
  maxChecks: Schema.number().default(24),
})

interface InputCheck {
  readonly name: string
  readonly category?: string
  readonly status: ReleaseCheckStatus
  readonly detail?: string
}

export function calculateReadiness(
  releaseNameInput: string,
  checks: readonly InputCheck[],
  maxChecks: number,
): ReleaseReadinessResult {
  const releaseName = releaseNameInput.trim()
  if (!releaseName) throw new Error('releaseName must not be blank')
  if (checks.length === 0) throw new Error('checks must contain at least one release gate')
  if (checks.length > maxChecks) throw new Error(`checks exceeds maxChecks (${maxChecks})`)

  const seen = new Set<string>()
  const groups: Record<ReleaseCheckStatus, ReleaseFinding[]> = { pass: [], warn: [], fail: [] }
  for (const [index, check] of checks.entries()) {
    const itemName = check.name.trim()
    if (!itemName) throw new Error(`checks[${index}].name must not be blank`)
    const key = itemName.toLocaleLowerCase()
    if (seen.has(key)) throw new Error(`duplicate check name: ${itemName}`)
    seen.add(key)
    groups[check.status].push({
      name: itemName,
      category: check.category?.trim() || 'General',
      detail: check.detail?.trim() || '',
    })
  }

  const weighted = groups.pass.length + groups.warn.length * 0.5
  const score = Math.round(weighted / checks.length * 100)
  const status = groups.fail.length > 0
    ? 'blocked'
    : groups.warn.length > 0 ? 'at-risk' : 'ready'
  const recommendation = status === 'ready'
    ? 'All release gates passed. The release can proceed.'
    : status === 'at-risk'
      ? `Resolve or explicitly accept ${groups.warn.length} warning${groups.warn.length === 1 ? '' : 's'} before release.`
      : `Stop the release and clear ${groups.fail.length} blocker${groups.fail.length === 1 ? '' : 's'} first.`

  return {
    releaseName,
    status,
    score,
    counts: {
      pass: groups.pass.length,
      warn: groups.warn.length,
      fail: groups.fail.length,
    },
    passed: groups.pass,
    warnings: groups.warn,
    blockers: groups.fail,
    recommendation,
  }
}

export function apply(ctx: Context, config: Config) {
  if (!Number.isInteger(config.maxChecks) || config.maxChecks <= 0) {
    throw new Error('maxChecks must be a positive integer')
  }

  ctx.tools.register(defineTool({
    name: 'release_readiness',
    description: 'Evaluate explicit release gates deterministically and publish a visual, replayable readiness dashboard in DeepSeek Harness Web.',
    parameters: {
      releaseName: {
        type: 'string',
        required: true,
        description: 'Human-readable release or milestone name.',
      },
      checks: {
        type: 'array',
        required: true,
        description: 'Release gates with evidence-backed pass, warning, or failure status.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', required: true, description: 'Unique gate name.' },
            category: { type: 'string', description: 'Gate category such as Build, Tests, Docs, or Distribution.' },
            status: {
              type: 'string',
              enum: ['pass', 'warn', 'fail'],
              required: true,
              description: 'Evidence-backed gate outcome.',
            },
            detail: { type: 'string', description: 'Short evidence or remediation detail.' },
          },
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          releaseName: { type: 'string', required: true },
          status: { type: 'string', enum: ['ready', 'at-risk', 'blocked'], required: true },
          score: { type: 'integer', required: true },
          counts: {
            type: 'object',
            required: true,
            additionalProperties: false,
            properties: {
              pass: { type: 'integer', required: true },
              warn: { type: 'integer', required: true },
              fail: { type: 'integer', required: true },
            },
          },
          passed: { type: 'array', required: true, items: findingSchema() },
          warnings: { type: 'array', required: true, items: findingSchema() },
          blockers: { type: 'array', required: true, items: findingSchema() },
          recommendation: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: renderForModel(value),
      }],
      presentationMeta: (_args, value) => ({
        kind: 'release-readiness',
        version: 1,
        result: value,
      }),
    },
    presentCall: args => ({
      card: 'generic',
      kind: 'other',
      title: `Evaluate release readiness · ${args.releaseName}`,
      rawInput: { releaseName: args.releaseName, gates: args.checks.length },
    }),
    presentResult: args => ({
      card: 'generic',
      title: `Release readiness · ${args.releaseName}`,
    }),
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      return calculateReadiness(args.releaseName, args.checks, config.maxChecks)
    },
  }))

  console.log('[dsh-release-readiness] registered tool and replayable dashboard: release_readiness')
}

function findingSchema() {
  return {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      name: { type: 'string' as const, required: true as const },
      category: { type: 'string' as const, required: true as const },
      detail: { type: 'string' as const, required: true as const },
    },
  }
}

function renderForModel(value: ReleaseReadinessResult): string {
  const label = value.status === 'ready' ? 'READY' : value.status === 'at-risk' ? 'AT RISK' : 'BLOCKED'
  const lines = [
    `**${value.releaseName}** — ${label} (${value.score}/100)`,
    `Gates: ${value.counts.pass} passed, ${value.counts.warn} warnings, ${value.counts.fail} blockers.`,
  ]
  if (value.blockers.length > 0) {
    lines.push(`Blockers: ${value.blockers.map(item => `${item.name}${item.detail ? ` — ${item.detail}` : ''}`).join('; ')}`)
  }
  if (value.warnings.length > 0) {
    lines.push(`Warnings: ${value.warnings.map(item => `${item.name}${item.detail ? ` — ${item.detail}` : ''}`).join('; ')}`)
  }
  lines.push(`Recommendation: ${value.recommendation}`)
  return lines.join('\n')
}
