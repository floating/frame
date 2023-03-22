<<<<<<< HEAD
import { useEffect } from 'react'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import { getShortcutFromKeyEvent, getDisplayShortcut, isShortcutKey } from '../../keyboard'
=======
import React, { useEffect } from 'react'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import { getShortcutFromKeyEvent, getDisplayShortcut, isShortcutKey } from '../../../resources/app'
>>>>>>> Choose summon keybinding (#1494)

const KeyboardShortcutConfigurator = ({ actionText = '', platform, shortcut, shortcutName }) => {
  const { modifierKeys, shortcutKey } = getDisplayShortcut(platform, shortcut)

  const EnterShortcut = () => {
    useEffect(() => {
      hotkeys('*', { capture: true }, (event) => {
        event.preventDefault()

        const allowedModifierKeys = ['Meta', 'Alt', 'Control', 'Command']
        const isModifierKey = allowedModifierKeys.includes(event.key)

        // ignore modifier key solo keypresses and disabled keys
        if (!isModifierKey && isShortcutKey(event)) {
<<<<<<< HEAD
          const newShortcut = getShortcutFromKeyEvent(event, hotkeys.getPressedKeyCodes(), platform)
=======
          const newShortcut = getShortcutFromKeyEvent(event)
>>>>>>> Choose summon keybinding (#1494)
          // enable the new shortcut
          link.send('tray:action', 'setShortcut', shortcutName, {
            ...newShortcut,
            configuring: false,
            enabled: true
          })
        }

        return false
      })

      return () => hotkeys.unbind()
    })

    const labelId = `shortcut-${shortcutName.toLowerCase()}-configure`
    return (
<<<<<<< HEAD
      <div style={{ display: 'flex' }}>
        <label id={labelId}>Enter new keyboard shortcut!</label>
        <div className='loaderWrap'>
          <div className='loader' />
        </div>
      </div>
=======
      <>
        <label id={labelId}>Enter keyboard shortcut:</label>
        <span
          className='keyCommand keyCommandCancel'
          aria-labelledby={labelId}
          onClick={() => {
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
>>>>>>> Choose summon keybinding (#1494)
    )
  }

  const DisplayShortcut = () => {
    const labelId = `shortcut-${shortcutName.toLowerCase()}-display`
    return (
      <>
<<<<<<< HEAD
        <label id={labelId}>To {actionText} press</label>

        <span className='keyCommand' aria-labelledby={labelId}>
=======
        <label id={labelId}>{actionText} by pressing</label>
        <span
          className='keyCommand'
          aria-labelledby={labelId}
          onClick={() => {
            link.send('tray:action', 'setShortcut', shortcutName, {
              ...shortcut,
              configuring: true
            })
          }}
        >
>>>>>>> Choose summon keybinding (#1494)
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

  return <span>{shortcut.configuring ? <EnterShortcut /> : <DisplayShortcut />}</span>
}

export default KeyboardShortcutConfigurator
