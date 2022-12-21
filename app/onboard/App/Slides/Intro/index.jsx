import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Intro = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Welcome to Frame!</SlideTitle>
      <SlideBody>
        <div>
          Frame is an always-on, system-wide wallet and platform making it easy for any browser, native, or
          command line dapp to access web3 protocols and accounts.
        </div>
        <div>Frame with a focus on privacy, security, decentralization and user experience.</div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Let's go!</SlideProceed>
    </Slide>
  )
}

export default Intro
