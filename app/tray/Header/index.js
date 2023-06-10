import React from 'react'
import styled from 'styled-components'

import useStore from '../../../resources/Hooks/useStore'

export const HeaderWrap = styled.div`
  position: absolute;
  animation: cardShow 400ms linear both;
  left: 8px;
  right: 8px;
  top: 58px;
  height: 80px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  -webkit-app-region: no-drag;
  z-index: 1000000000;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
`

export const Header = () => {
  const crumb = useStore('windows.panel.nav')[0] || {}
  const accounts = useStore('main.accounts')
  const currentAccount = Object.values(accounts).find((acct) => acct.active) || {}

  if (crumb.view === 'accountManager') {
    return <HeaderWrap key={'accountManager'}>{'Account Manager'}</HeaderWrap>
  } else {
    const { address, ensName } = currentAccount
    return (
      <HeaderWrap key={'accountInfo'}>
        <div>
          <div>{ensName}</div>
          <div>{`${address.substr(0, 6)}...${address.substr(address.length - 4, address.length)}`}</div>
        </div>
      </HeaderWrap>
    )
  }
}
