import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { apply as applyHost } from '../lib/types/index.js'
import { AURORA_THEME, AURORA_THEME_ID, apply as applyClient } from '../lib/types/client/index.js'

test('Host bundle exposes a loadable no-op plugin', () => {
  assert.doesNotThrow(() => applyHost({}))
})

test('Client registers and activates an additive Aurora overlay', () => {
  const calls = []
  const disposers = []
  let activeId = 'dark'
  let registeredTheme
  let overlay

  const context = {
    theme: {
      getTheme: () => ({
        preference: activeId === AURORA_THEME_ID ? AURORA_THEME_ID : 'dark',
        active: { id: activeId, colorScheme: 'dark', tokens: {} },
        themes: [],
        revision: calls.length,
      }),
      register(definition) {
        registeredTheme = definition
        calls.push(['register-theme', definition.id])
        return () => calls.push(['dispose-theme', definition.id])
      },
      setTheme(id) {
        activeId = id
        calls.push(['set-theme', id])
      },
    },
    effect(setup) {
      disposers.push(setup())
    },
    slots: {
      inject(key, setup) {
        assert.equal(key, 'shell.overlay')
        setup()
        return () => undefined
      },
      register(options, component) {
        overlay = { options, component }
        return () => undefined
      },
    },
    layout: {
      toggleSidebar() {},
      openDetails() {},
      closeDetails() {},
    },
    on() {
      return () => undefined
    },
  }

  applyClient(context)
  assert.equal(registeredTheme.id, AURORA_THEME_ID)
  assert.equal(registeredTheme.colorScheme, 'dark')
  assert.ok(Object.keys(registeredTheme.tokens).length >= 30)
  assert.deepEqual(overlay.options, {
    name: 'shell.overlay', id: 'aurora-workbench-controls', order: 80,
  })
  assert.equal(typeof overlay.component, 'function')
  assert.equal(activeId, AURORA_THEME_ID)

  disposers[0]()
  assert.equal(activeId, 'dark')
  assert.deepEqual(calls.at(-1), ['dispose-theme', AURORA_THEME_ID])
})

test('browser bundle is loadable by DSH and contains the intended UI seams', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load/)
  assert.match(bundle, /shell\.overlay/)
  assert.match(bundle, /aurora-workbench/)
  assert.match(bundle, /auroraRequested/)
  assert.equal(AURORA_THEME.tokens['--dsw-alias-bg-base'], '#060914')
})
