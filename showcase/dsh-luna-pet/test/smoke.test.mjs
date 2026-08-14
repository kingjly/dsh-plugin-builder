import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { apply as applyHost } from '../lib/types/index.js'
import {
  ANIMATIONS,
  LUNA_POSITION_STORAGE_KEY,
  PET_ATLAS,
  PET_CELL,
  apply as applyClient,
} from '../lib/types/client/index.js'

test('Host bundle exposes a loadable no-op plugin', () => {
  assert.doesNotThrow(() => applyHost({}))
})

test('Client registers Luna through the additive shell overlay', () => {
  let registration
  const context = {
    slots: {
      inject(key, setup) {
        assert.equal(key, 'shell.overlay')
        setup()
        return () => undefined
      },
      register(options, component) {
        registration = { options, component }
        return () => undefined
      },
    },
  }
  applyClient(context)
  assert.deepEqual(registration.options, {
    name: 'shell.overlay', id: 'luna-desktop-pet', order: 70,
  })
  assert.equal(typeof registration.component, 'function')
})

test('atlas metadata covers every hatch-pet state', () => {
  assert.deepEqual(PET_CELL, { width: 192, height: 208 })
  assert.deepEqual(PET_ATLAS, { columns: 8, rows: 9, width: 1536, height: 1872 })
  assert.deepEqual(Object.keys(ANIMATIONS), [
    'idle', 'running-right', 'running-left', 'waving', 'jumping',
    'failed', 'waiting', 'running', 'review',
  ])
})

test('browser bundle embeds the validated WebP atlas', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load/)
  assert.match(bundle, /shell\.overlay/)
  assert.match(bundle, /data:image\/webp;base64,UklGR/)
  assert.ok(bundle.length > 50_000)
})

test('browser bundle supports persistent pointer dragging', async () => {
  assert.equal(LUNA_POSITION_STORAGE_KEY, 'dsh-luna-pet.position.v1')
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /setPointerCapture/)
  assert.match(bundle, /localStorage/)
  assert.match(bundle, /dsh-luna-pet\.position\.v1/)
})
