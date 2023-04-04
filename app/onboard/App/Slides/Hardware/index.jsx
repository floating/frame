import { useEffect } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import { Slide, SlideBody, SlideItem } from '../../styled'

const Extension = ({ setTitle, setProceed }) => {
  useEffect(() => {
    setTitle('Harware Signers')
    setProceed({ action: 'next', text: 'Next' })
  }, [])
  return (
    <Slide>
      <SlideBody>
        <SlideItem>
          <div>Frame supports many hardware signers including</div>
          <div>Ledger, GridPlus, Trezor and more on the way!</div>
        </SlideItem>
        <SlideItem>
          <div>For high value accounts be sure to use a hardware signer</div>
          <div>and verify all transaction details on your device.</div>
        </SlideItem>
        <SlideItem>
          <div>Need a hardware signer?</div>
        </SlideItem>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() => link.send('tray:openExternal', '<>')}
          >
            {svg.ledger(48)}
          </div>
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() => link.send('tray:openExternal', '<>')}
          >
            {svg.trezor(48)}
          </div>
        </div>
      </SlideBody>
    </Slide>
  )
}

export default Extension
