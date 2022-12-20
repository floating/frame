import React from 'react'
import { Slide, SlideTitle, SlideBody, SlideProceed } from '../../styled'

const Transactions = ({ nextSlide, prevSlide }) => {
  return (
    <Slide>
      <SlideTitle>Transactions</SlideTitle>
      <SlideBody>
        <div>Frame includes powerful tools to help you decode the details of your transactions.</div>
        <div>
          Transaction simulation lets you test and simulate transactions before signing them, so you can
          identify any potential issues before they occur.
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Transactions
