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
        <SlideItem>Frame is here to help you push the boundaries of web3.</SlideItem>
        <SlideItem>We can't wait to embark on your next adventure with you!</SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Outro
