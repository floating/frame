import React, { useState, useEffect } from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

import link from '../../../../../resources/link'

const Access = ({ nextSlide, prevSlide, platform }) => {
  const [shortcutActivated, setShortcutActivated] = useState(false)
  link.send('tray:action', 'navDash', { view: 'settings', data: {} })
  // useEffect(() => {
  //   setTimeout(() => {
  //     setShortcutActivated(true)
  //   }, 2000)
  // })
  return (
    <Slide>
      <SlideTitle>Let's get started...</SlideTitle>
      <SlideBody>
        <div>
          {`You can quickly summon and hide Frame using the keyboard shortcut ${
            platform === 'darwin' ? 'Option + /' : 'Alt + /'
          }, try it now.`}
        </div>
        <div>
          You can also set Frame to auto-hide when not in use, so it's out of the way but still easily
          accessible when you need it.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Access
