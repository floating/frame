import { z } from 'zod'

const supportedModifierKey = z.enum(['Alt', 'Control', 'Meta', 'Super', 'CommandOrCtrl'])

const supportedShortcutKey = z.enum([
  'Comma',
  'Period',
  'Forwardslash',
  'Slash',
  'Tab',
  'Space',
  'Enter',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'Digit9',
  'Digit8',
  'Digit7',
  'Digit6',
  'Digit5',
  'Digit4',
  'Digit3',
  'Digit2',
  'Digit1',
  'Digit0',
  'KeyA',
  'KeyB',
  'KeyC',
  'KeyD',
  'KeyE',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyI',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyM',
  'KeyN',
  'KeyO',
  'KeyP',
  'KeyQ',
  'KeyR',
  'KeyS',
  'KeyT',
  'KeyU',
  'KeyV',
  'KeyW',
  'KeyX',
  'KeyY',
  'KeyZ',
  'NumpadDivide',
  'NumpadMultiply',
  'NumpadSubtract',
  'NumpadAdd',
  'NumpadDecimal',
  'Numpad9',
  'Numpad8',
  'Numpad7',
  'Numpad6',
  'Numpad5',
  'Numpad4',
  'Numpad3',
  'Numpad2',
  'Numpad1',
  'Numpad0'
])

const ShortcutSchema = z.object({
  modifierKeys: z.array(supportedModifierKey).default([]),
  shortcutKey: supportedShortcutKey,
  enabled: z.boolean().default(true),
  configuring: z.boolean().default(false)
})

const v37 = z.object({
  summon: ShortcutSchema
})

const defaultSummonShortcut = {
  modifierKeys: ['Alt' as const],
  shortcutKey: 'Slash' as const,
  enabled: true,
  configuring: false
}

const latest = v37.catch({ summon: defaultSummonShortcut }).default({ summon: defaultSummonShortcut })

export { v37, latest }

export type ModifierKey = z.infer<typeof supportedModifierKey>
export type ShortcutKey = z.infer<typeof supportedShortcutKey>
export type Shortcut = z.infer<typeof ShortcutSchema>
