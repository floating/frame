import React, { useState } from 'react'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
import useStore from '../../../../resources/Hooks/useStore.js'
import styled from 'styled-components'

import React from 'react'
import styled from 'styled-components'

import useStore from '../../../../resources/Hooks/useStore'
import { icons, list } from '../../../../resources/svg/new'

const AccountWrap = styled.div`
  position: absolute;
  top: 12px;
  height: ${({ expanded }) => (expanded ? '140px' : '32px')};
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
  font-size: 14px;
  font-family: 'Fira Code';
  left: 50%;
  margin-left: -120px;
  background: var(--ghostAZ);
  border-radius: 16px;
  box-shadow: 0px 1px 1px var(--ghostX);
  z-index: 10000000;
  overflow: hidden;
`

const StyledDiv = styled.div`
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  border-left: 1px solid var(--ghostY);
  cursor: pointer;
  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostA);
  }
`
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0px 16px;
  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostA);
  }
`

const InnerDiv = styled.div`
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 12px 0px 0px;
`

const Account = () => {
  const accounts = useStore('main.accounts')
  const currentAccount = Object.values(accounts).find((acct) => acct.active) || {}

  const { address, ensName } = currentAccount
  const clippedAddress =
    address && `${address.substr(0, 6)}...${address.substr(address.length - 4, address.length)}`

  const ribbon = useStore('windows.workspaces', window.frameId, 'ribbon') || {}

  console.log('ribbon.expanded', ribbon.expanded)

  return (
    <AccountWrap
      expanded={ribbon.expanded}
      onMouseLeave={() => {
        link.send('workspace:ribbon', window.frameId, { expanded: false })
      }}
    >
      <Container
        onClick={() => {
          link.send('workspace:nav', window.frameId, 'command', { station: 'command' })
        }}
      >
        <InnerDiv>{list[Math.floor(Math.random() * list.length)].icon(16)}</InnerDiv>
        <div>{clippedAddress}</div>
      </Container>
      <StyledDiv
        onClick={() => {
          link.send('workspace:ribbon', window.frameId, { expanded: true })
        }}
      >
        {svg.switch(14)}
      </StyledDiv>
    </AccountWrap>
  )
}

export default Account
