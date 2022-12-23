import React, { useEffect } from 'react'

import { Slide, SlideBody } from '../../styled'

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
        <div>With Frame, you can easily manage multiple accounts and signers in a single location.</div>
        <div>To set up your first account, click "Add New Account" at the bottom of the Accounts panel.</div>
      </SlideBody>
    </Slide>
  )
}

export default Chains
