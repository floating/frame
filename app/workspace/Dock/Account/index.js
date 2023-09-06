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
  position: absolute;
  top: 0px;
  right: 8px;
  left: 8px;
  z-index: 9999;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--ghostAZ);
  border-radius: 8px;
  box-shadow: 2px 2px 4px var(--ghostZ), -2px -2px 4px var(--ghostA);
  cursor: pointer;
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
  /* border-bottom: 2px solid var(--ghostY); */
  /* background: var(--ghostZ05); */
  /* backdrop-filter: blur(16px); */
  background: var(--ghostAZ);
  border-radius: 24px;
  box-shadow: 2px 3px 9px 0px var(--ghostY);
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
      <div
        style={{
          position: 'absolute',
          left: '8px',
          top: '16px'
          // width: '40px',
          // height: '40px',
          // marginRight: '16px',
          // borderRadius: '12px',
          // overflow: 'hidden',
          // border: '2px solid var(--ghostZ)',
          // boxShadow: '0px 1px 2px 0px var(--ghostZ)',
          // display: 'flex',
          // justifyContent: 'center',
          // alignItems: 'center'
          // borderRadius: '30px'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {list[Math.floor(Math.random() * list.length)].icon(21)}
        </div>
      </div>
      <div>
        <div>{ensName}</div>
        <div>{`${address.substr(0, 6)}...${address.substr(address.length - 4, address.length)}`}</div>
      </div>
    </AccountWrap>
  )
}

export default Account
