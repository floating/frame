import React, { useState, useEffect } from 'react'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import { getShortcutFromKeyEvent, getDisplayShortcut, isShortcutKey } from '../../../resources/app'

const KeyboardShortcutConfigurator = ({ actionText = '', platform, shortcut, shortcutName }) => {
  const [configuring, setConfiguring] = useState(false)

  useEffect(() => {
    hotkeys.unbind()
    if (configuring) {
      // set configuring so existing shortcut keypresses can be temporarily ignored
      link.send('tray:action', 'setShortcut', shortcutName, {
        ...shortcut,
        configuring: true
      })
      hotkeys('*', { capture: true }, (event) => {
        event.preventDefault()
        const allowedModifierKeys = ['Meta', 'Alt', 'Control', 'Command']
        const isModifierKey = allowedModifierKeys.includes(event.key)

        // ignore modifier key solo keypresses and disabled keys
        if (!isModifierKey && isShortcutKey(event)) {
          setConfiguring(false)
          const newShortcut = getShortcutFromKeyEvent(event)
          // enable the new shortcut
          link.send('tray:action', 'setShortcut', shortcutName, {
            ...newShortcut,
            configuring: false,
            enabled: true
          })
        }

        return false
      })
    }
  }, [configuring])

  const { modifierKeys, shortcutKey } = getDisplayShortcut(platform, shortcut)

  const EnterShortcut = () => {
    const labelId = `shortcut-${shortcutName.toLowerCase()}-configure`
    return (
      <>
        <label id={labelId}>Enter keyboard shortcut:</label>
        <span
          className='keyCommand keyCommandCancel'
          aria-labelledby={labelId}
          onClick={() => {
            setConfiguring(false)
            // revert shortcut enabled state
            link.send('tray:action', 'setShortcut', shortcutName, {
              ...shortcut,
              configuring: false
            })
          }}
        >
          Cancel
        </span>
      </>
    )
  }

  const DisplayShortcut = () => {
    const labelId = `shortcut-${shortcutName.toLowerCase()}-display`
    return (
      <>
        <label id={labelId}>{actionText} by pressing</label>
        <span
          className='keyCommand'
          aria-labelledby={labelId}
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
    )
  }

  return <span>{configuring ? <EnterShortcut /> : <DisplayShortcut />}</span>
}

export default KeyboardShortcutConfigurator
