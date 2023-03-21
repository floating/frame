import React, { useEffect } from 'react'

import link from '../../../../../resources/link'

import { Body, Item, Title, PylonConfirm, PylonConfirmButton, PylonConfirmButtonSub } from '../../styled'

const MoveToPylon = () => {
  return (
    <>
      <Title>{'Chain preset updates'}</Title>
      <Body>
        <Item>
          <div>We're retiring open access to our Infura & Alchemy endpoints.</div>
        </Item>
        <Item>
          <div>Chains using our built-in Infura & Alchemy presets will be</div>
          <div>migrated to our new JSON-RPC proxy called Pylon.</div>
        </Item>
        <Item>
          <div>Pylon allows us to have more control over the quality and</div>
          <div>privacy of the default connections we offer in Frame.</div>
        </Item>
        <Item>
          <div>To continue using Infura or Alchemy directly, please visit their</div>
          <div>website to create an account and use the "custom" preset.</div>
        </Item>
      </Body>
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
