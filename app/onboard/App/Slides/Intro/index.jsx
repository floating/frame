import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const Intro = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Welcome to Frame!')
    setProceed({ action: 'next', text: "Let's go!" })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          Frame is a web3 platform that creates a secure system-wide interface to your chains and accounts.
        </SlideItem>
        <SlideItem>
          Now any browser, command-line, or native application has the ability to access to web3.
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Intro
