import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const Intro = ({ setTitle, setProceed, version }) => {
  useEffect(() => {
    setTitle(`Welcome to Frame v${version}!`)
    setProceed({ action: 'next', text: "Let's go!" })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Frame is a web3 platform that creates a secure</div>
          <div>system-wide interface to your chains and accounts.</div>
        </SlideItem>
        <SlideItem>
          <div>Now any browser, command-line, or native</div>
          <div>application has the ability to access to web3.</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Intro
