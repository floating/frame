import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Chains')
    setProceed({ action: 'next', text: 'Next' })
    link.send('tray:action', 'navDash', { view: 'chains', data: {} })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Next, let's set up the chains you want to use.</div>
        </SlideItem>
        <SlideItem>
          <div>Frame includes many popular chains out of the</div>
          <div>box -- to start using a chain just toggle it on!</div>
        </SlideItem>
        <SlideItem>
          <div>You can also add new chains by clicking the button</div>
          <div>at the bottom of the panel or by using a dapp</div>
          <div>that adds chains for you, such as chainlist.org.</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Chains
