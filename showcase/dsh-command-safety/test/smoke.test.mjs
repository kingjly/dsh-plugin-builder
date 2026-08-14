import assert from 'node:assert/strict'
import test from 'node:test'

import { apply } from '../dist/index.js'

function loadHook(overrides = {}) {
  let handler
  apply({
    on(event, listener) {
      assert.equal(event, 'tools/pre-execute')
      handler = listener
      return () => undefined
    },
  }, {
    protectedTools: ['bash', 'pwsh'],
    blockedPatterns: [
      '\\brm\\s+-(?=[^\\s]*r)(?=[^\\s]*f)[^\\s]+\\s+(?:/|~|\\$HOME)(?:\\s|$)',
      '\\bRemove-Item\\b(?=[^\\r\\n]*\\b-Recurse\\b)(?=[^\\r\\n]*\\b-Force\\b)',
    ],
    reason: 'Blocked by test policy.',
    ...overrides,
  })
  assert.equal(typeof handler, 'function')
  return handler
}

test('denies matching bash command without delegating', async () => {
  const hook = loadHook()
  let delegated = false
  const decision = await hook(
    { name: 'bash', arguments: { command: 'rm -rf /' } },
    async () => {
      delegated = true
      return { kind: 'allow' }
    },
  )
  assert.equal(decision.kind, 'deny')
  assert.match(decision.reason, /Blocked by test policy/)
  assert.equal(delegated, false)
})

test('denies reordered recursive/force flags', async () => {
  const hook = loadHook()
  const decision = await hook(
    { name: 'bash', arguments: { command: 'rm -fr /' } },
    async () => ({ kind: 'allow' }),
  )
  assert.equal(decision.kind, 'deny')
})

test('allows safe commands through next()', async () => {
  const hook = loadHook()
  let delegated = false
  const decision = await hook(
    { name: 'bash', arguments: { command: 'printf safe' } },
    async () => {
      delegated = true
      return { kind: 'allow' }
    },
  )
  assert.deepEqual(decision, { kind: 'allow' })
  assert.equal(delegated, true)
})

test('fails loudly when a configured regex is invalid', () => {
  assert.throws(
    () => loadHook({ blockedPatterns: ['['] }),
    /not a valid regular expression/,
  )
})
