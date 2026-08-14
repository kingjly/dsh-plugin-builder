import {
  Fragment,
  createElement as h,
  useEffect,
  useState,
  type CSSProperties,
} from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { ThemeDefinition, ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'

export const inject = ['slots', 'theme', 'layout']

export const AURORA_THEME_ID = 'aurora-workbench'

export const AURORA_THEME: ThemeDefinition = {
  id: AURORA_THEME_ID,
  colorScheme: 'dark',
  tokens: {
    '--dsw-alias-bg-base': '#060914',
    '--dsw-alias-bg-layer-1': 'rgba(8, 14, 28, 0.94)',
    '--dsw-alias-bg-layer-2': 'rgba(14, 24, 43, 0.96)',
    '--dsw-alias-bg-layer-3': '#182744',
    '--dsw-alias-bg-overlay': '#15213a',
    '--dsw-alias-border-l1': 'rgba(103, 232, 249, 0.12)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(103, 232, 249, 0.16)',
    '--dsw-alias-border-l2': 'rgba(103, 232, 249, 0.24)',
    '--dsw-alias-border-l3': 'rgba(167, 139, 250, 0.34)',
    '--dsw-alias-border-l4': 'rgba(244, 114, 182, 0.42)',
    '--dsw-alias-brand-primary': '#67e8f9',
    '--dsw-alias-brand-primary-invert': '#07111f',
    '--dsw-alias-brand-text': '#a78bfa',
    '--dsw-alias-button-primary-fill': '#22d3ee',
    '--dsw-alias-button-primary-hover': '#67e8f9',
    '--dsw-alias-button-primary-dimmed': '#164e63',
    '--dsw-alias-label-primary': '#f8fafc',
    '--dsw-alias-label-primary-foreground': '#06111a',
    '--dsw-alias-label-primary-inverted': '#06111a',
    '--dsw-alias-label-primary-bluish': '#a5f3fc',
    '--dsw-alias-label-secondary': '#cbd5e1',
    '--dsw-alias-label-tertiary': '#94a3b8',
    '--dsw-alias-label-caption': '#7dd3fc',
    '--dsw-alias-interactive-bg-active': 'rgba(34, 211, 238, 0.17)',
    '--dsw-alias-interactive-bg-hover': 'rgba(167, 139, 250, 0.12)',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(34, 211, 238, 0.2)',
    '--dsw-alias-interactive-bg-hover-solid': '#1e3152',
    '--dsw-alias-markdown-code-block': '#081120',
    '--dsw-alias-markdown-code-block-banner': '#101c31',
    '--dsw-alias-markdown-inline-code': '#162641',
    '--dsw-alias-scrollbar-bg-l1': 'rgba(103, 232, 249, 0.28)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(167, 139, 250, 0.32)',
    '--dsw-alias-scrollbar-hover-l1': 'rgba(103, 232, 249, 0.5)',
    '--dsw-alias-scrollbar-hover-l2': 'rgba(244, 114, 182, 0.52)',
    '--dsw-alias-state-business-primary': '#67e8f9',
    '--dsw-alias-state-business-tertiary': '#164e63',
    '--dsw-alias-tooltip-bg': '#17233c',
    '--dsw-alias-toast-bg': '#17233c',
  },
}

const GLOBAL_CSS = `
body[data-dsh-aurora-ui="on"] {
  background:
    radial-gradient(circle at 18% 12%, rgba(34, 211, 238, .10), transparent 30%),
    radial-gradient(circle at 82% 8%, rgba(167, 139, 250, .12), transparent 34%),
    radial-gradient(circle at 66% 88%, rgba(244, 114, 182, .07), transparent 30%),
    #060914;
}
body[data-dsh-aurora-ui="on"] [data-conversation-scroll] {
  background:
    linear-gradient(rgba(6, 9, 20, .40), rgba(6, 9, 20, .62)),
    radial-gradient(circle at 50% -8%, rgba(34, 211, 238, .10), transparent 43%);
}
body[data-dsh-aurora-ui="on"] textarea {
  caret-color: #67e8f9;
}
body[data-dsh-aurora-ui="on"] ::selection {
  color: #f8fafc;
  background: rgba(139, 92, 246, .48);
}
body[data-dsh-aurora-ui="on"] button,
body[data-dsh-aurora-ui="on"] [role="button"] {
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease;
}
@media (prefers-reduced-motion: no-preference) {
  .dsh-aurora-live-dot { animation: dsh-aurora-pulse 2.2s ease-in-out infinite; }
}
@keyframes dsh-aurora-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(103, 232, 249, .20); }
  50% { box-shadow: 0 0 0 7px rgba(103, 232, 249, 0); }
}
`

const controllerStyle: CSSProperties = {
  position: 'fixed',
  right: '22px',
  bottom: '22px',
  zIndex: 1000,
  width: '230px',
  padding: '12px',
  pointerEvents: 'auto',
  color: '#f8fafc',
  border: '1px solid rgba(103, 232, 249, .28)',
  borderRadius: '18px',
  background: 'linear-gradient(145deg, rgba(13, 22, 42, .94), rgba(20, 31, 56, .90))',
  boxShadow: '0 20px 70px rgba(0, 0, 0, .42), inset 0 1px 0 rgba(255, 255, 255, .06)',
  backdropFilter: 'blur(18px)',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
}

const buttonStyle: CSSProperties = {
  appearance: 'none',
  minHeight: '34px',
  padding: '0 10px',
  color: '#dbeafe',
  border: '1px solid rgba(148, 163, 184, .22)',
  borderRadius: '10px',
  background: 'rgba(15, 23, 42, .72)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 650,
}

function createAuroraOverlay(ctx: ClientContext, fallbackTheme: string) {
  return function AuroraOverlay() {
    const [snapshot, setSnapshot] = useState<ThemeSnapshot>(() => ctx.theme.getTheme())
    const [auroraRequested, setAuroraRequested] = useState(true)
    const auroraActive = snapshot.active.id === AURORA_THEME_ID

    useEffect(() => {
      const dispose = ctx.on('theme/change', next => setSnapshot(next))
      return () => { dispose() }
    }, [])
    useEffect(() => {
      // Host-backed built-in preference hydration can finish after this Client
      // plugin mounts. Reassert Aurora only while the user still wants it;
      // clicking "Use original" turns this ownership loop off.
      if (auroraRequested && !auroraActive) ctx.theme.setTheme(AURORA_THEME_ID)
    }, [auroraActive, auroraRequested])
    useEffect(() => {
      if (auroraActive) document.body.dataset.dshAuroraUi = 'on'
      else delete document.body.dataset.dshAuroraUi
      return () => { delete document.body.dataset.dshAuroraUi }
    }, [auroraActive])

    return h(Fragment, null,
      h('style', null, GLOBAL_CSS),
      h('aside', { style: controllerStyle, 'aria-label': 'Aurora Web UI controls' },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } },
            h('span', {
              className: 'dsh-aurora-live-dot',
              style: {
                width: '9px', height: '9px', borderRadius: '50%',
                background: auroraActive ? '#67e8f9' : '#64748b',
              },
            }),
            h('div', null,
              h('div', { style: { fontSize: '12px', fontWeight: 800, letterSpacing: '.08em' } }, 'AURORA UI'),
              h('div', { style: { marginTop: '2px', fontSize: '10px', color: '#94a3b8' } }, auroraActive ? 'WORKBENCH ACTIVE' : 'BUILT-IN THEME'),
            ),
          ),
          h('span', {
            style: {
              padding: '3px 7px', borderRadius: '999px', color: '#a5f3fc',
              background: 'rgba(34, 211, 238, .10)', border: '1px solid rgba(34, 211, 238, .20)',
              fontSize: '9px', fontWeight: 800,
            },
          }, 'LIVE'),
        ),
        h('div', { style: { height: '1px', margin: '11px 0', background: 'linear-gradient(90deg, rgba(103,232,249,.32), rgba(167,139,250,.18), transparent)' } }),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' } },
          h('button', {
            type: 'button',
            style: {
              ...buttonStyle,
              color: auroraActive ? '#06111a' : '#dbeafe',
              borderColor: auroraActive ? '#67e8f9' : 'rgba(148, 163, 184, .22)',
              background: auroraActive ? 'linear-gradient(135deg, #67e8f9, #a78bfa)' : 'rgba(15, 23, 42, .72)',
            },
            title: auroraActive ? `Restore ${fallbackTheme} theme` : 'Activate Aurora theme',
            onClick: () => {
              setAuroraRequested(!auroraActive)
              ctx.theme.setTheme(auroraActive ? fallbackTheme : AURORA_THEME_ID)
            },
          }, auroraActive ? 'Use original' : 'Use Aurora'),
          h('button', {
            type: 'button', style: buttonStyle, title: 'Toggle the workspace sidebar',
            onClick: () => ctx.layout.toggleSidebar(),
          }, 'Toggle sidebar'),
          h('button', {
            type: 'button', style: { ...buttonStyle, gridColumn: '1 / -1' }, title: 'Close the current details panel',
            onClick: () => ctx.layout.closeDetails(),
          }, 'Close details · focus on conversation'),
        ),
      ),
    )
  }
}

export function apply(ctx: ClientContext): void {
  const fallbackTheme = ctx.theme.getTheme().preference
  const Overlay = createAuroraOverlay(ctx, fallbackTheme)

  ctx.effect(() => {
    const disposeTheme = ctx.theme.register(AURORA_THEME)
    ctx.theme.setTheme(AURORA_THEME_ID)
    return () => {
      if (ctx.theme.getTheme().active.id === AURORA_THEME_ID) ctx.theme.setTheme(fallbackTheme)
      disposeTheme()
    }
  })

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'aurora-workbench-controls',
    order: 80,
  }, Overlay))
}
