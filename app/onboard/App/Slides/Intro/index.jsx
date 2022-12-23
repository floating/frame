import React from 'react'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Intro = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Welcome to Frame!</SlideTitle>
      <SlideBody>
        <div>
          Frame is an always-on, system-wide wallet platform that directly integrates with any browser, native
          application, or command line interface to provide secure and convenient access to web3 protocols and
          accounts.
        </div>
        <div>
          With a focus on privacy, security, decentralization, and user experience, Frame empowers users to
          interact with dapps in a secure, intuitive way. Whether you're a developer building a dapp or a user
          seeking to get started with web3, Frame has you covered.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Let's go!</SlideProceed>
    </Slide>
  )
}

export default Intro
