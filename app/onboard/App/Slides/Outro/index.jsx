import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Outro = ({ onComplete }) => {
  return (
    <Slide>
      <SlideTitle>You're ready to go!</SlideTitle>
      <SlideBody>
        <div>
          We're dedicated to pushing the boundaries of web3. We encourage you to continue exploring the
          endless possibilities of dapps and the web3 ecosystem -- Frame will be here to assist you along the
          way.
        </div>
      </SlideBody>
      <SlideProceed onClick={onComplete}>Close</SlideProceed>
    </Slide>
  )
}

export default Outro
