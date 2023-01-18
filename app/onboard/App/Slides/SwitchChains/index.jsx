import React, { useEffect } from 'react'

import extensionScreenshot from './extension.png'
import { Slide, SlideBody, SlideItem, Tag } from '../../styled'

const SwitchChainsSlide = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Omnichain')
    setProceed({ action: 'next', text: 'Next' })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Dapp not switching chains automatically? You can still</div>
          <div>manually switch chains for any dapp using the</div>
          <div>
            <Tag>Frame Companion</Tag> extension.
          </div>
        </SlideItem>
        <SlideItem>
          <img src={extensionScreenshot} />
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default SwitchChainsSlide
