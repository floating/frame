import { useEffect } from 'react'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import { getShortcutFromKeyEvent, getDisplayShortcut, isShortcutKey } from '../../keyboard'

const KeyboardShortcutConfigurator = ({ actionText = '', platform, shortcut, shortcutName }) => {
  const { modifierKeys, shortcutKey } = getDisplayShortcut(platform, shortcut)

  const EnterShortcut = () => {
    useEffect(() => {
      hotkeys('*', { capture: true }, (event) => {
        event.preventDefault()

        const allowedModifierKeys = ['Meta', 'Alt', 'AltGr', 'Control', 'Command']
        const isModifierKey = allowedModifierKeys.includes(event.key)

        // ignore modifier key solo keypresses and disabled keys
        if (!isModifierKey && isShortcutKey(event)) {
          const newShortcut = getShortcutFromKeyEvent(event, hotkeys.getPressedKeyCodes(), platform)
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
      <div style={{ display: 'flex' }}>
        <label id={labelId}>Enter new keyboard shortcut!</label>
        <div className='loaderWrap'>
          <div className='loader' />
        </div>
      </div>
    )
  }

  const DisplayShortcut = () => {
    const labelId = `shortcut-${shortcutName.toLowerCase()}-display`
    return (
      <>
        <label id={labelId}>To {actionText} press</label>

        <span className='keyCommand' aria-labelledby={labelId}>
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
