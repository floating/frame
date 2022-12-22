import React from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import { SlideProceed } from '../../Components'
import { Slide, SlideTitle, SlideBody } from '../../styled'

const Extension = ({ nextSlide }) => {
  return (
    <Slide>
      <SlideTitle>Browser Extension</SlideTitle>
      <SlideBody>
        <div>Using a dapp that doesn't connect natively?</div>
        <div>Inject a connection with our browser extension.</div>
        <div
          style={{
            display: 'flex',
            paddingTop: '10px',
            alignItems: 'center'
          }}
        >
          <div
            style={{ padding: '0px', marginRight: '20px', cursor: 'pointer' }}
            onClick={() =>
              link.send(
                'tray:openExternal',
                'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf'
              )
            }
          >
            {svg.chrome(48)}
          </div>
          <div
            style={{ padding: '0px', cursor: 'pointer' }}
            onClick={() =>
              link.send('tray:openExternal', 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension')
            }
          >
            {svg.firefox(48)}
          </div>
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Next</SlideProceed>
    </Slide>
  )
}

export default Extension
