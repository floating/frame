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
          Using a dapp that doesn't natively connect to Frame yet? Inject a connection with our browser
          extension.
        </div>
        <div>
          Frame's companion browser extension makes it easy for a dapp running in your browser to connect to
          Frame.
        </div>
        <div>
          To install simply vist the extension store for your preferred Browser
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: 0,
              margin: 'auto',
              width: '60%'
            }}
          >
            <div
              style={{ padding: 0, cursor: 'pointer' }}
              onClick={() =>
                link.send(
                  'tray:openExternal',
                  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf'
                )
              }
            >
              {svg.chrome(28)}
            </div>
            <div
              style={{ padding: 0, cursor: 'pointer' }}
              onClick={() =>
                link.send(
                  'tray:openExternal',
                  'https://addons.mozilla.org/en-US/firefox/addon/frame-extension'
                )
              }
            >
              {svg.firefox(28)}
            </div>
            {/* <div 
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconSafari'
              >
                {svg.safari(28)}
              </div> */}
          </div>
        </div>
      </SlideBody>
      <SlideProceed onClick={nextSlide}>Done</SlideProceed>
    </Slide>
  )
}

export default Extension
