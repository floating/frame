import React, { useEffect } from 'react'

import link from '../../../../../resources/link'

import { Body, Item, Title, PylonConfirm, PylonConfirmButton, PylonConfirmButtonSub } from '../../styled'

const MoveToPylon = () => {
  return (
    <>
      <Title>{'Chain preset updates'}</Title>
      <Body>
        <Item>
          <div>We are retiring our open Infura and Alchemy endpoints.</div>
        </Item>
        <Item>
          <div>Chains that use our built-in Infura and Alchemy presets will</div>
          <div>be migrated to our new JSON-RPC proxy called Pylon.</div>
        </Item>
        <Item>
          <div>Pylon gives us greater control over the quality and </div>
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
