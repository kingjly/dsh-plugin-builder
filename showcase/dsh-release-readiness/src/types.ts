export type ReleaseCheckStatus = 'pass' | 'warn' | 'fail'
export type ReleaseStatus = 'ready' | 'at-risk' | 'blocked'

export interface ReleaseFinding {
  readonly name: string
  readonly category: string
  readonly detail: string
}

export interface ReleaseReadinessResult {
  readonly releaseName: string
  readonly status: ReleaseStatus
  readonly score: number
  readonly counts: {
    readonly pass: number
    readonly warn: number
    readonly fail: number
  }
  readonly passed: ReleaseFinding[]
  readonly warnings: ReleaseFinding[]
  readonly blockers: ReleaseFinding[]
  readonly recommendation: string
}
