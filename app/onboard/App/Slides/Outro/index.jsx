import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const Outro = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle(`You're ready to go!`)
    setProceed({ action: 'complete', text: 'Done' })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Frame is here to help you</div>
          <div>push the boundaries of web3.</div>
        </SlideItem>
        <SlideItem>
          <div>We can't wait to embark on your</div>
          <div>next adventure with you!</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Outro
