import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Intro = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Welcome to Frame!</SlideTitle>
      <SlideBody>
        <div>
          Frame is an always-on, system-wide platform making it easy for any browser, native, or command line
          application to access web3 protocols and accounts.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Let's go!</SlideProceed>
    </Slide>
  )
}

export default Intro
