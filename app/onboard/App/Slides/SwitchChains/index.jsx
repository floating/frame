import { useEffect } from 'react'

import chainSwitch from 'url:./chainswitch.mp4'
import { Slide, SlideBody, SlideItem, SlideVideo } from '../../styled'

const SwitchChainsSlide = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Extension Chain Selector')
    setProceed({ action: 'next', text: 'Next' })
  }, [])

  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <SlideVideo>
            <video loop autoPlay>
              <source src={chainSwitch} type='video/mp4' />
            </video>
          </SlideVideo>
          <div style={{ fontSize: '13px', lineHeight: '20px' }}>
            Legacy dapp not switching chains automatically?
          </div>
          <div style={{ fontSize: '13px', lineHeight: '20px', paddingBottom: '15px' }}>
            Switch chains for any dapp via the browser extension.
          </div>
        </SlideItem>
      </SlideBody>
    </Slide>
  )
}

export default SwitchChainsSlide
