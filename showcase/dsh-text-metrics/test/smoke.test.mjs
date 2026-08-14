import assert from 'node:assert/strict'
import test from 'node:test'

import { apply } from '../dist/index.js'

function loadTool(maxCharacters = 10_000) {
  const tools = []
  apply({
    tools: {
      register(definition) {
        tools.push(definition)
        return () => undefined
      },
    },
  }, { maxCharacters })
  assert.equal(tools.length, 1)
  return tools[0]
}

const exec = { signal: new AbortController().signal }

test('returns structured text metrics', async () => {
  const tool = loadTool()
  assert.equal(tool.name, 'text_metrics')
  assert.deepEqual(await tool.execute({ text: 'Hello 世界\nfrom DSH' }, exec), {
    characters: 17,
    utf8Bytes: 21,
    words: 4,
    lines: 2,
    nonEmptyLines: 2,
  })
})

test('rejects missing and oversized input', async () => {
  await assert.rejects(() => loadTool().execute({}, exec))
  await assert.rejects(
    () => loadTool(3).execute({ text: 'four' }, exec),
    /exceeds maxCharacters/,
  )
})

test('fails loudly on invalid configuration', () => {
  assert.throws(() => loadTool(0), /positive integer/)
})
