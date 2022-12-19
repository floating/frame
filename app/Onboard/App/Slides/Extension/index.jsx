import React from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

const Extension = ({ nextSlide, prevSlide }) => {
  return (
    <Slide>
      <SlideTitle>Browser Extension</SlideTitle>
      <SlideBody>
        <div>
          Using a dapp that doesn't natively connect to Frame yet? Inject a connection with our browser
          extension.
        </div>
        <div>
          Frame's companion browser extension makes it easy to inject a connection to Frame into dapps.
        </div>
        <div>To install simply vist the extension store for your preferred browser: links</div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Extension
