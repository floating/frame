import React, { useEffect } from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ nextSlide, prevSlide }) => {
  useEffect(() => {
    link.send('tray:action', 'navDash', { view: 'accounts', data: {} })
  })
  return (
    <Slide>
      <SlideTitle>Accounts</SlideTitle>
      <SlideBody>
        <div>Frame makes it easy to manage many accounts and signers at the same time all in one place.</div>
        <div>
          To add and set up your first account, simply click the "Add Account" button at the bottom of the
          Accounts panel.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Chains
