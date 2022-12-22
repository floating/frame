import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Outro = ({ onComplete }) => {
  return (
    <Slide>
      <SlideTitle>You're ready to go!</SlideTitle>
      <SlideBody>
        <div>
          Frame is here to help you push the boundaries of web3. We can't wait to embark on your next
          adventure with you!
        </div>
      </SlideBody>
      <SlideProceed onClick={onComplete}>Close</SlideProceed>
    </Slide>
  )
}

export default Outro
