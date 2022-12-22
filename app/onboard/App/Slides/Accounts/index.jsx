import React, { useEffect } from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ nextSlide }) => {
  useEffect(() => {
    link.send('tray:action', 'navDash', { view: 'accounts', data: {} })
  }, [])

  return (
    <Slide>
      <SlideTitle>Accounts</SlideTitle>
      <SlideBody>
        <div>Frame makes it easy to manage many accounts and signers all in one place.</div>
        <div>
          To add your first account, simply click the "Add Account" button at the bottom of the Accounts
          panel.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Next</SlideProceed>
    </Slide>
  )
}

export default Chains
