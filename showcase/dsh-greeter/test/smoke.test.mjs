import assert from 'node:assert/strict'
import test from 'node:test'

import { apply } from '../dist/index.js'

function loadTool() {
  const tools = []
  apply({
    tools: {
      register(definition) {
        tools.push(definition)
        return () => undefined
      },
    },
  }, { greeting: 'Hello, ', punctuation: '!' })
  assert.equal(tools.length, 1)
  return tools[0]
}

const exec = { signal: new AbortController().signal }

test('registers greet and returns canonical output', async () => {
  const tool = loadTool()
  assert.equal(tool.name, 'greet')
  assert.deepEqual(await tool.execute({ name: ' Ada ' }, exec), {
    recipient: 'Ada',
    message: 'Hello, Ada!',
  })
})

test('rejects missing and blank names', async () => {
  const tool = loadTool()
  await assert.rejects(() => tool.execute({}, exec))
  await assert.rejects(() => tool.execute({ name: '   ' }, exec), /must not be blank/)
})
