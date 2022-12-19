import React from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

const Intro = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Welcome to Frame!</SlideTitle>
      <SlideBody>
        <div>
          Frame is always-on system-wide wallet and platform making it easy for any browser, native, or
          command line dapp to access web3 protocols and accounts.
        </div>
        <div>We build Frame with a focus on privacy, security, decentralization and user experience.</div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Let's go!</SlideProceed>
    </Slide>
  )
}

export default Intro
