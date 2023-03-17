import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const MoveToPylon = ({ setTitle, setProceed }) => {
  return (
    <SlideBody>
      <SlideItem>
        <div>Chains using our built-in Infura & Alchemy presets will</div>
        <div>be migrated to our JSON-RPC proxy called Pylon.</div>
      </SlideItem>
      <SlideItem>
        <div>Pylon will allow us to have control over the privacy and</div>
        <div>quality of the default connections we offer in Frame.</div>
      </SlideItem>
      <SlideItem>
        <div>To continue using Infura or Alchemy directly, create</div>
        <div>an account with them and use the "custom" preset.</div>
      </SlideItem>
    </SlideBody>
  )
}

export default MoveToPylon
