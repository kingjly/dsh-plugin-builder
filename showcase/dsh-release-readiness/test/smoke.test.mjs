import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { apply, calculateReadiness } from '../lib/index.js'

function loadTool(maxChecks = 24) {
  const tools = []
  apply({
    tools: {
      register(definition) {
        tools.push(definition)
        return () => undefined
      },
    },
  }, { maxChecks })
  assert.equal(tools.length, 1)
  return tools[0]
}

function execution() {
  return {
    callId: 'release-probe-1',
    signal: new AbortController().signal,
  }
}

const checks = [
  { name: 'Build', category: 'CI', status: 'pass', detail: 'TypeScript compiled.' },
  { name: 'Docs', category: 'Documentation', status: 'warn', detail: 'Registry publishing is optional.' },
]

test('calculates an at-risk score and separates findings', () => {
  assert.deepEqual(calculateReadiness(' v0.2.0 ', checks, 24), {
    releaseName: 'v0.2.0',
    status: 'at-risk',
    score: 75,
    counts: { pass: 1, warn: 1, fail: 0 },
    passed: [{ name: 'Build', category: 'CI', detail: 'TypeScript compiled.' }],
    warnings: [{ name: 'Docs', category: 'Documentation', detail: 'Registry publishing is optional.' }],
    blockers: [],
    recommendation: 'Resolve or explicitly accept 1 warning before release.',
  })
})

test('tool stores the replayable dashboard in core tool-result metadata', async () => {
  const tool = loadTool()
  assert.equal(tool.name, 'release_readiness')
  const result = await tool.execute({ releaseName: 'v0.2.0', checks }, execution())
  assert.equal(result.status, 'at-risk')
  assert.deepEqual(tool.output.presentationMeta({}, result), {
    kind: 'release-readiness',
    version: 1,
    result,
  })
})

test('rejects blank, duplicate, empty, and oversized gates', () => {
  assert.throws(() => calculateReadiness(' ', checks, 24), /must not be blank/)
  assert.throws(() => calculateReadiness('v1', [], 24), /at least one/)
  assert.throws(() => calculateReadiness('v1', [...checks, { ...checks[0], name: 'build' }], 24), /duplicate/)
  assert.throws(() => calculateReadiness('v1', checks, 1), /exceeds maxChecks/)
  assert.throws(() => loadTool(0), /positive integer/)
})

test('ships a browser entry registered with the DSH module loader', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /__ModuleLoader__\.load/)
  assert.match(bundle, /release-readiness/)
  assert.match(bundle, /tool\/result/)
  assert.match(bundle, /RELEASE READINESS/)
})
