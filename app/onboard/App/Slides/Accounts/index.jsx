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
        <div>With Frame, you can easily manage multiple accounts and signers in a single location.</div>
        <div>
          To set up your first account, simply click "Add New Account" at the bottom of the Accounts panel.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Next</SlideProceed>
    </Slide>
  )
}

export default Chains
