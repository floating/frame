import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Accounts')
    setProceed({ action: 'next', text: 'Next' })
    link.send('tray:action', 'navDash', { view: 'accounts', data: {} })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>With Frame, you can easily manage multiple</div>
          <div>accounts and signers in a single location.</div>
        </SlideItem>
        <SlideItem>
          <div>To set up your first account, click "Add New Account"</div>
          <div>at the bottom of the Accounts panel.</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Chains
