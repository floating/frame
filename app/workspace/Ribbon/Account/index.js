import React from 'react'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
import useStore from '../../../../resources/Hooks/useStore.js'
import styled from 'styled-components'

import React from 'react'
import styled from 'styled-components'

import useStore from '../../../../resources/Hooks/useStore'
import { icons, list } from '../../../../resources/svg/new'

const AccountWrap = styled.div`
  height: 100%;
  padding: 0px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
  font-size: 14px;
  font-family: 'Fira Code';
  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostA);
  }
`

// import { Cluster, ClusterRow, ClusterValue } from '../../../resources/Components/Cluster'

export const HeaderWrap = styled.div`
  position: absolute;
  animation: cardShow 400ms linear both;
  left: 8px;
  right: 8px;
  top: 48px;
  height: 86px;
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

const Account = () => {
  const accounts = useStore('main.accounts')
  const currentAccount = Object.values(accounts).find((acct) => acct.active) || {}
  const { address, ensName } = currentAccount

  return (
    <AccountWrap
      onClick={() => {
        link.send('workspace:nav', window.frameId, 'command')
      }}
    >
      <div>
        <div
          style={{
            paddingRight: '16px',
            height: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {list[Math.floor(Math.random() * list.length)].icon(16)}
        </div>
      </div>
      <div>
        {/* <div>{ensName}</div> */}
        <div>{`${address.substr(0, 6)}...${address.substr(address.length - 4, address.length)}`}</div>
      </div>
    </AccountWrap>
  )
}

export default Account
