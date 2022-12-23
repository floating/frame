import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Intro = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Welcome to Frame!</SlideTitle>
      <SlideBody>
        <div>
          Frame is an always-on, system-wide platform that directly integrates with any browser, command line
          interface, or native application to provide secure and convenient access to web3 protocols and
          accounts.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Let's go!</SlideProceed>
    </Slide>
  )
}

export default Intro
