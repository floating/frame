import React, { useState, useEffect } from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

import link from '../../../../../resources/link'

const Access = ({ nextSlide, prevSlide, platform }) => {
  const keyboardShortcut = platform === 'darwin' ? 'Option + /' : 'Alt + /'
  const [shortcutActivated, setShortcutActivated] = useState(false)
  link.send('tray:action', 'navDash', { view: 'settings', data: {} })

  useEffect(() => {
    const handler = (event) => {
      if (event === 'shortcutActivated') setShortcutActivated(true)
    }

    link.on('flex', handler)

    return () => link.off('flex', handler)
  }, [])

  return (
    <Slide>
      <SlideTitle>Let's get started...</SlideTitle>
      <SlideBody>
        <div>
          {`You can quickly summon and hide Frame using the keyboard shortcut ${keyboardShortcut}. Give it a try!`}
        </div>
      </SlideBody>

      {shortcutActivated && (
        <SlideBody>
          <div>
            You can also set Frame to automatically hide when not in use, so it's out of the way but still
            easily accessible when you need it.
          </div>
        </SlideBody>
      )}
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Access
