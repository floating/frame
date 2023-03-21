import { useState, useEffect } from 'react'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import { getShortcutFromKeyEvent, getDisplayShortcut, isShortcutKey } from '../../../resources/app'

const KeyboardShortcutConfigurator = ({ actionText = '', platform, shortcut, shortcutName }) => {
  const [configuring, setConfiguring] = useState(false)
  const [shortcutEnabled, setShortcutEnabled] = useState(shortcut.enabled)

  useEffect(() => {
    hotkeys.unbind()
    if (configuring) {
      // disable existing shortcut whilst configuring a new one
      link.send('tray:action', 'setShortcut', shortcutName, {
        ...shortcut,
        enabled: false
      })
      hotkeys('*', { capture: true }, (event) => {
        event.preventDefault()
        const allowedModifierKeys = ['Meta', 'Alt', 'Control', 'Command']
        const isModifierKey = allowedModifierKeys.includes(event.key)

        // ignore modifier key solo keypresses and disabled keys
        if (!isModifierKey && isShortcutKey(event)) {
          setConfiguring(false)
          const newShortcut = getShortcutFromKeyEvent(event)
          // enable new shortcut
          link.send('tray:action', 'setShortcut', shortcutName, { ...newShortcut, enabled: true })
          setShortcutEnabled(true)
        }

        return false
      })
    }
  }, [configuring])

  const { modifierKeys, shortcutKey } = getDisplayShortcut(platform, shortcut)

  return (
    <span>
      {configuring ? (
        <>
          Enter keyboard shortcut:
          <span
            className='keyCommand keyCommandCancel'
            onClick={() => {
              setConfiguring(false)
              // revert shortcut enabled state
              link.send('tray:action', 'setShortcut', shortcutName, { ...shortcut, enabled: shortcutEnabled })
            }}
          >
            Cancel
          </span>
        </>
      ) : (
        <>
          {actionText} by pressing
          <span
            className='keyCommand'
            onClick={() => {
              setConfiguring(true)
            }}
          >
            {[...modifierKeys, shortcutKey].map((displayKey, index, displayKeys) =>
              index === displayKeys.length - 1 ? (
                displayKey
              ) : (
                <span key={index}>
                  {displayKey}
                  <span style={{ padding: '0px 3px' }}>+</span>
                </span>
              )
            )}
          </span>
        </>
      )}
    </span>
  )
}

export default KeyboardShortcutConfigurator
