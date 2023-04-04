import { useEffect } from 'react'

import { Slide, SlideBody, SlideItem } from '../../styled'

const OmnichainSlide = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Omnichain')
    setProceed({ action: 'next', text: 'Next' })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>With Frame&apos;s Omnichain routing dapps can</div>
          <div>seamlessly use multiple chains at the same time,</div>
          <div>enabling truly multichain experiences.</div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default OmnichainSlide
