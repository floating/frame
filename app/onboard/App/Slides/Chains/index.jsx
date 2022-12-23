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
        <SlideItem>Next let's set up the chains you want to use.</SlideItem>
        <SlideItem>
          Frame includes many popular chains out of the box -- just turn them on to start using them!
        </SlideItem>
        <SlideItem>
          You can also add new chains with the button at the bottom of the panel or by using a dapp that adds
          chains for you such as chainlist.org.
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Chains
