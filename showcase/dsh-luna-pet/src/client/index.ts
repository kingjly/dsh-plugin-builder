import {
  createElement as h,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'

declare const __LUNA_SPRITE_DATA_URL__: string

export const inject = ['slots']

export type PetState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review'

export interface AnimationDefinition {
  row: number
  durations: readonly number[]
  label: string
  message: string
}

export const PET_CELL = { width: 192, height: 208 } as const
export const PET_ATLAS = { columns: 8, rows: 9, width: 1536, height: 1872 } as const

export const ANIMATIONS: Record<PetState, AnimationDefinition> = {
  idle: { row: 0, durations: [280, 110, 110, 140, 140, 320], label: 'IDLE', message: 'Luna is guarding the workspace' },
  'running-right': { row: 1, durations: [120, 120, 120, 120, 120, 120, 120, 220], label: 'PATROL →', message: 'Luna is checking the right flank' },
  'running-left': { row: 2, durations: [120, 120, 120, 120, 120, 120, 120, 220], label: '← PATROL', message: 'Luna is checking the left flank' },
  waving: { row: 3, durations: [140, 140, 140, 280], label: 'PETTED', message: 'Luna accepts the head pat' },
  jumping: { row: 4, durations: [140, 140, 140, 140, 280], label: 'CONTENT', message: 'Luna looks very pleased' },
  failed: { row: 5, durations: [140, 140, 140, 140, 140, 140, 140, 240], label: 'OOPS', message: 'Something needs attention' },
  waiting: { row: 6, durations: [150, 150, 150, 150, 150, 260], label: 'WAITING', message: 'Waiting for your input' },
  running: { row: 7, durations: [120, 120, 120, 120, 120, 220], label: 'WORKING', message: 'Processing the current task' },
  review: { row: 8, durations: [150, 150, 150, 150, 150, 280], label: 'REVIEW', message: 'Inspecting the result' },
}

const SCALE = 0.72
const VIEW_WIDTH = PET_CELL.width * SCALE
const VIEW_HEIGHT = PET_CELL.height * SCALE

function spriteDataUrl(): string {
  return typeof __LUNA_SPRITE_DATA_URL__ === 'string'
    ? __LUNA_SPRITE_DATA_URL__
    : 'data:image/webp;base64,'
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function usePetFrame(state: PetState): number {
  const [frame, setFrame] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    setFrame(0)
    if (reduced) return
    const animation = ANIMATIONS[state]
    let current = 0
    let timer = 0
    const advance = () => {
      timer = window.setTimeout(() => {
        current = (current + 1) % animation.durations.length
        setFrame(current)
        advance()
      }, animation.durations[current])
    }
    advance()
    return () => window.clearTimeout(timer)
  }, [reduced, state])
  return frame
}

const shellStyle: CSSProperties = {
  position: 'fixed',
  right: '276px',
  bottom: '22px',
  zIndex: 999,
  width: '232px',
  padding: '10px 11px 11px',
  color: '#e6fbff',
  border: '1px solid rgba(94, 234, 212, .28)',
  borderRadius: '20px',
  background: 'linear-gradient(150deg, rgba(5, 18, 34, .95), rgba(30, 22, 58, .92))',
  boxShadow: '0 20px 70px rgba(0, 0, 0, .40), inset 0 1px 0 rgba(255, 255, 255, .07)',
  backdropFilter: 'blur(18px)',
  pointerEvents: 'auto',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
}

const controlStyle: CSSProperties = {
  minHeight: '29px',
  padding: '0 8px',
  color: '#dffcff',
  border: '1px solid rgba(125, 211, 252, .18)',
  borderRadius: '9px',
  background: 'rgba(15, 23, 42, .70)',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 750,
}

function createPetOverlay() {
  return function LunaOverlay() {
    const [selected, setSelected] = useState<PetState>('idle')
    const [transient, setTransient] = useState<PetState | null>(null)
    const [compact, setCompact] = useState(false)
    const [patrolDirection, setPatrolDirection] = useState<'running-right' | 'running-left'>('running-right')
    const transientTimer = useRef(0)
    const state = transient ?? selected
    const frame = usePetFrame(state)
    const animation = ANIMATIONS[state]

    useEffect(() => () => window.clearTimeout(transientTimer.current), [])

    const playTransient = (next: PetState, duration: number) => {
      window.clearTimeout(transientTimer.current)
      setTransient(next)
      transientTimer.current = window.setTimeout(() => setTransient(null), duration)
    }
    const patrol = () => {
      setSelected(patrolDirection)
      setPatrolDirection(patrolDirection === 'running-right' ? 'running-left' : 'running-right')
    }

    const petStyle: CSSProperties = {
      width: `${VIEW_WIDTH}px`,
      height: `${VIEW_HEIGHT}px`,
      margin: compact ? '0 auto' : '-8px auto -3px',
      border: 0,
      backgroundColor: 'transparent',
      backgroundImage: `url(${spriteDataUrl()})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${PET_ATLAS.width * SCALE}px ${PET_ATLAS.height * SCALE}px`,
      backgroundPosition: `${-frame * VIEW_WIDTH}px ${-animation.row * VIEW_HEIGHT}px`,
      cursor: 'pointer',
      imageRendering: 'auto',
      filter: 'drop-shadow(0 11px 12px rgba(0, 0, 0, .28))',
    }

    return h('aside', {
      style: { ...shellStyle, width: compact ? '164px' : shellStyle.width },
      'aria-label': 'Luna pet controls',
    },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
        h('div', null,
          h('div', { style: { fontSize: '11px', fontWeight: 900, letterSpacing: '.10em' } }, '露娜 · LUNA'),
          h('div', { style: { marginTop: '1px', color: '#7dd3fc', fontSize: '9px', fontWeight: 750 } }, animation.label),
        ),
        h('button', {
          type: 'button',
          style: { ...controlStyle, minHeight: '24px', padding: '0 7px' },
          title: compact ? 'Show Luna controls' : 'Keep only Luna visible',
          onClick: () => setCompact(value => !value),
        }, compact ? 'EXPAND' : 'COMPACT'),
      ),
      h('button', {
        type: 'button',
        style: petStyle,
        title: 'Click Luna to make her happy; hover to pet her',
        'aria-label': `Luna is ${animation.label.toLowerCase()}`,
        onClick: () => playTransient('jumping', 1100),
        onMouseEnter: () => playTransient('waving', 900),
        onMouseLeave: () => setTransient(null),
      }),
      compact ? null : h('div', null,
        h('div', {
          style: {
            minHeight: '28px', margin: '0 2px 8px', color: '#b9d7e8',
            textAlign: 'center', fontSize: '10px', lineHeight: 1.35,
          },
        }, animation.message),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' } },
          h('button', { type: 'button', style: controlStyle, onClick: () => setSelected('idle') }, 'Idle'),
          h('button', { type: 'button', style: controlStyle, onClick: () => setSelected('running') }, 'Work'),
          h('button', { type: 'button', style: controlStyle, onClick: () => setSelected('waiting') }, 'Wait'),
          h('button', { type: 'button', style: controlStyle, onClick: () => setSelected('review') }, 'Review'),
          h('button', { type: 'button', style: { ...controlStyle, gridColumn: 'span 2' }, onClick: patrol }, 'Patrol ↔'),
          h('button', { type: 'button', style: { ...controlStyle, gridColumn: 'span 2' }, onClick: () => setSelected('failed') }, 'Oops'),
        ),
      ),
    )
  }
}

export function apply(ctx: ClientContext): void {
  const PetOverlay = createPetOverlay()
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'luna-desktop-pet',
    order: 70,
  }, PetOverlay))
}
