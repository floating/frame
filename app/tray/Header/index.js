import React from 'react'
import styled from 'styled-components'

import useStore from '../../../resources/Hooks/useStore'

export const HeaderWrap = styled.div`
  position: absolute;
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
`

export const Header = () => {
  const crumb = useStore('windows.panel.nav')[0] || {}
  const accounts = useStore('main.accounts')
  const currentAccount = Object.values(accounts).find((acct) => acct.active) || {}

  if (crumb.view === 'accountManager') {
    return <HeaderWrap>{'account maanger'}</HeaderWrap>
  } else {
    return <HeaderWrap>{currentAccount.address}</HeaderWrap>
  }
}
