import React, { useState, useEffect } from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody, Shortcut, Skip } from '../../styled'

import link from '../../../../../resources/link'

const Access = ({ nextSlide, platform }) => {
  const keyboardShortcut = platform === 'darwin' ? 'Option + /' : 'Alt + /'
  const [shortcutActivated, setShortcutActivated] = useState(false)
  const [trayOpen, setTrayOpen] = useState(store('tray.open'))

  useEffect(() => {
    link.send('tray:action', 'navDash', { view: 'settings', data: {} })
    const handler = (event) => {
      if (event === 'shortcutActivated') setShortcutActivated(true)
    }
    link.on('flex', handler)

    const obs = store.observer(() => {
      setTrayOpen(store('tray.open'))
    })

    return () => {
      link.off('flex', handler)
      obs.remove()
    }
  }, [])

  return (
    <Slide>
      {trayOpen && !shortcutActivated ? (
        <>
          <SlideTitle>Let's get started...</SlideTitle>
          <SlideBody>
            <div>{`You can quickly summon and dismiss Frame using the keyboard shortcut.`}</div>
            <div>
              <span>{'Dismiss Frame now using '}</span>
              <Shortcut>{keyboardShortcut}</Shortcut>
            </div>
          </SlideBody>
        </>
      ) : !trayOpen ? (
        <>
          <SlideTitle>Summon Frame</SlideTitle>
          <SlideBody>
            <div>
              <span>{'You can summon the same way '}</span>
              <Shortcut>{keyboardShortcut}</Shortcut>
            </div>
          </SlideBody>
        </>
      ) : (
        <>
          <SlideTitle>Auto hide</SlideTitle>
          <SlideBody>
            <div>
              You can also set Frame to automatically hide when not in use, so it's out of the way but still
              easily accessible when you need it.
            </div>
          </SlideBody>
        </>
      )}
      {trayOpen && shortcutActivated ? (
        <SlideProceed onClick={nextSlide}>Next</SlideProceed>
      ) : (
        <Skip onClick={nextSlide}>Skip This Step</Skip>
      )}
    </Slide>
  )
}

export default Access
