import React, { useEffect } from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ nextSlide, prevSlide }) => {
  useEffect(() => {
    link.send('tray:action', 'navDash', { view: 'chains', data: {} })
  })
  return (
    <Slide>
      <SlideTitle>Chains</SlideTitle>
      <SlideBody>
        <div>Now let's set up the chains you want to use.</div>
        <div>Toggle on the chains you want to use in the settings panel. </div>
        <div>With Frame's Omnichain routing, you can seamlessly use multiple chains at the same time.</div>
        <div>
          Omnichain allows dapps to operate across multiple chains simultaneously creating truly multichain
          experiences.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Chains
