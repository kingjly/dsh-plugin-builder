import assert from 'node:assert/strict'
import test from 'node:test'

import { apply } from '../dist/index.js'

function loadGuard(overrides = {}) {
  let guard
  apply({
    tools: {
      guard(listener) {
        guard = listener
        return () => undefined
      },
    },
  }, {
    protectedTools: ['bash', 'pwsh'],
    blockedPatterns: [
      '\\brm\\s+-(?=[^\\s]*r)(?=[^\\s]*f)[^\\s]+\\s+(?:/|~|\\$HOME)(?:\\s|$)',
      '\\bRemove-Item\\b(?=[^\\r\\n]*-Recurse\\b)(?=[^\\r\\n]*-Force\\b)',
    ],
    reason: 'Blocked by test policy.',
    ...overrides,
  })
  assert.equal(typeof guard, 'function')
  return guard
}

test('denies matching bash command', () => {
  const guard = loadGuard()
  const reason = guard({ name: 'bash', arguments: { command: 'rm -rf /' } })
  assert.match(reason, /Blocked by test policy/)
})

test('denies reordered recursive/force flags', () => {
  const guard = loadGuard()
  const reason = guard({ name: 'bash', arguments: { command: 'rm -fr /' } })
  assert.match(reason, /Blocked by test policy/)
})

test('allows safe commands', () => {
  const guard = loadGuard()
  const reason = guard({ name: 'bash', arguments: { command: 'printf safe' } })
  assert.equal(reason, undefined)
})

test('denies command text carried by a composite transport wrapper', () => {
  const guard = loadGuard()
  const reason = guard({ name: 'pwsh', arguments: { input: { command: 'Remove-Item .\\probe -Force -Recurse' } } })
  assert.match(reason, /Blocked by test policy/)
})

test('fails loudly when a configured regex is invalid', () => {
  assert.throws(
    () => loadGuard({ blockedPatterns: ['['] }),
    /not a valid regular expression/,
  )
})
