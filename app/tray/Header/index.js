import React from 'react'
import styled from 'styled-components'

import useStore from '../../../resources/Hooks/useStore'

import { icons, list } from '../../../resources/svg/new'

import { Cluster, ClusterRow, ClusterValue } from '../../../resources/Components/Cluster'

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
    return <HeaderWrap key={'accountManager'}>{'Accounts'}</HeaderWrap>
  } else {
    const { address, ensName } = currentAccount
    return (
      <HeaderWrap key={'accountInfo'}>
        <div
          style={{
            position: 'absolute',
            left: '2px',
            top: '12px'
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
          <Cluster>
            <ClusterRow>
              <ClusterValue>
                <div
                  style={{
                    width: '50px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {list[Math.floor(Math.random() * list.length)].icon(21)}
                </div>
              </ClusterValue>
            </ClusterRow>
          </Cluster>
        </div>
        <div>
          <div>{ensName}</div>
          <div>{`${address.substr(0, 6)}...${address.substr(address.length - 4, address.length)}`}</div>
        </div>
      </HeaderWrap>
    )
  }
}
