import { useEffect } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import { Slide, SlideBody, SlideItem, Tag } from '../../styled'

const Extension = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Browser Extension')
    setProceed({ action: 'next', text: 'Next' })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>If you&apos;re using a dapp that doesn&apos;t natively</div>
          <div>connect to Frame, you can inject a connection with</div>
          <div>
            our <Tag>Frame Companion</Tag> browser extension.
          </div>
        </SlideItem>
        <SlideItem>
          <div>Click the links below to visit the extension</div>
          <div>store for your preferred browser:</div>
        </SlideItem>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
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
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() =>
              link.send('tray:openExternal', 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension')
            }
          >
            {svg.firefox(48)}
          </div>
        </div>
      </SlideBody>
    </Slide>
  )
}

export default Extension
