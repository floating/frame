import React, { useEffect } from 'react'

import link from '../../../../../resources/link'

import {
  SlideBody,
  SlideItem,
  SlideTitle,
  PylonConfirm,
  PylonConfirmButton,
  PylonConfirmButtonSub
} from '../../styled'

const MoveToPylon = () => {
  return (
    <>
      <SlideTitle>{'Chain preset updates'}</SlideTitle>
      <SlideBody>
        <SlideItem>
          <div>Chains using our built-in Infura & Alchemy presets will</div>
          <div>be migrated to our JSON-RPC proxy called Pylon.</div>
        </SlideItem>
        <SlideItem>
          <div>Pylon allows us to have more control over the quality and</div>
          <div>privacy of the default connections we offer in Frame.</div>
        </SlideItem>
        <SlideItem>
          <div>To continue using Infura or Alchemy directly, visit them</div>
          <div>to create an account and use the "custom" preset.</div>
        </SlideItem>
      </SlideBody>
      <PylonConfirm>
        <PylonConfirmButton
          onClick={() => {
            link.send('tray:action', 'migrateToPylonConnections')
            link.send('tray:action', 'mutePylonMigrationNotice')
            link.send('frame:close')
          }}
        >
          {'Got It'}
        </PylonConfirmButton>
        <PylonConfirmButtonSub
          onClick={() => {
            link.send('tray:action', 'mutePylonMigrationNotice')
            link.send('frame:close')
          }}
        >
          {'Use Custom Preset'}
        </PylonConfirmButtonSub>
      </PylonConfirm>
    </>
  )
}

export default MoveToPylon
