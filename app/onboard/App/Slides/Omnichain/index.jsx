import React, { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const Chains = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Omnichain')
    setProceed({ action: 'next', text: 'Next' })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          With Frame's Omnichain routing dapps can seamlessly use multiple chains at the same time, enabling
          truly multichain experiences.
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default Chains
