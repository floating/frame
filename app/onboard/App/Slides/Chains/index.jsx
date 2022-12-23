import React, { useEffect, useState } from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

import link from '../../../../../resources/link'

const Chains = ({ nextSlide }) => {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    link.send('tray:action', 'navDash', { view: 'chains', data: {} })
  }, [])

  return (
    <Slide>
      <SlideTitle>Chains</SlideTitle>
      {stage === 0 ? (
        <SlideBody>
          <div>Next let's set up the chains you want to use.</div>
          <div>
            Frame includes many popular chains out of the box -- just turn them on to start using them!
          </div>
        </SlideBody>
      ) : stage === 1 ? (
        <SlideBody>
          <div>
            You can also add new chains with the button at the bottom of the panel or by using a dapp that
            adds chains for you such as chainlist.org.
          </div>
        </SlideBody>
      ) : stage === 2 ? (
        <SlideBody>
          <div>
            With Frame's Omnichain routing, dapps can seamlessly use multiple chains at the same time,
            creating truly multichain experiences.
          </div>
        </SlideBody>
      ) : null}
      <SlideProceed onClick={stage === 2 ? nextSlide : () => setStage(stage + 1)}>Next</SlideProceed>
    </Slide>
  )
}

export default Chains
