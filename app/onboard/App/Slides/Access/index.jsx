import React, { useState, useEffect } from 'react'

import { Slide, SlideBody, SlideItem, Shortcut } from '../../styled'

import link from '../../../../../resources/link'

const Access = ({ setTitle, setProceed, platform }) => {
  const keyboardShortcut = platform === 'darwin' ? 'Option + /' : 'Alt + /'
  const [shortcutActivated, setShortcutActivated] = useState(false)
  const [trayOpen, setTrayOpen] = useState(store('tray.open'))

  useEffect(() => {
    const handler = (event) => {
      if (event === 'shortcutActivated') setShortcutActivated(true)
    }

    link.send('tray:action', 'navDash', { view: 'settings', data: {} })
    link.on('flex', handler)

    const obs = store.observer(() => {
      setTrayOpen(store('tray.open'))
    })

    return () => {
      link.off('flex', handler)
      obs.remove()
    }
  }, [])

  useEffect(() => {
    if (trayOpen && !shortcutActivated) {
      setTitle(`Let's get started...`)
      setProceed({ action: 'skip', text: 'skip this step' })
    } else if (!trayOpen) {
      setTitle('Summon Frame')
      setProceed({ action: 'skip', text: 'skip this step' })
    } else {
      setTitle('Auto-hide')
      setProceed({ action: 'next', text: 'Next' })
    }
  }, [trayOpen, shortcutActivated])

  return (
    <Slide>
      {trayOpen && !shortcutActivated ? (
        <SlideBody>
          <SlideItem>{`You can quickly summon and dismiss Frame using the keyboard shortcut.`}</SlideItem>
          <SlideItem>
            <span>{'Dismiss Frame now using '}</span>
            <Shortcut>{keyboardShortcut}</Shortcut>
          </SlideItem>
        </SlideBody>
      ) : !trayOpen ? (
        <SlideBody>
          <SlideItem>
            <span>{'You can summon Frame the same way '}</span>
            <Shortcut>{keyboardShortcut}</Shortcut>
          </SlideItem>
        </SlideBody>
      ) : (
        <SlideBody>
          <SlideItem>
            You can also set Frame to automatically hide when not in use, so it's out of the way but still
            easily accessible when you need it.
          </SlideItem>
        </SlideBody>
      )}
    </Slide>
  )
}

export default Access
