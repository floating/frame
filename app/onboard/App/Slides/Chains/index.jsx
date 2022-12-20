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
        <div>
          Frame comes with presets for a few of the most popular chains. Turn them on and off or update the
          RPC you want to use for each in the Chains panel.{' '}
        </div>
        <div>
          Add new chains with the button at the bottom of the panel or by using a dapp that adds chains for
          you such as chainlist.org.{' '}
        </div>
        <div>
          With Frame's Omnichain routing, you can seamlessly use multiple chains at the same time, creating
          truly multichain experiences by allowing dapps to operate across multiple chains simultaneously.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Chains
