import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const MoveToPylon = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle(`An update to chain presets`)
    // setProceed({ action: 'next', text: "Let's go!" })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Chains using our built-in Infura & Alchemy presets will</div>
          <div>be migrated to our JSON-RPC proxy called Pylon.</div>
        </SlideItem>
        <SlideItem>
          <div>This will allow us to have more control over the privacy and</div>
          <div>quality of the default connections we offer in Frame.</div>
        </SlideItem>
        <SlideItem>
          <div>To continue using Infura or Alchemy directly, you can sign up</div>
          <div>for an account with them and use the "custom" preset.</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default MoveToPylon
