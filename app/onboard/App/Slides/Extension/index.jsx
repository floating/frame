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
        <div>
          If you're using a dapp that doesn't natively integrate with Frame, you can still connect using our
          `Frame Companion` browser extension.
        </div>
        <div>
          To install the extension, simply click the links below to visit the extension store for your
          preferred browser:
        </div>
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
