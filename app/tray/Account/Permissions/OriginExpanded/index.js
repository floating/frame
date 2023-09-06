import React, { useState } from 'react'
import link from '../../../../../resources/link'
import styled, { css } from 'styled-components'

import { OriginToggle } from './styled'

import svg from '../../../../../resources/svg'
import useStore from '../../../../../resources/Hooks/useStore'
// import { matchFilter } from '../../../../../resources/utils'

import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterValue,
  ClusterBoxHeader
} from '../../../../../resources/Components/Cluster'
// import CollectionList from '../CollectionList'

const OriginPermissions = styled.div`
  width: 100%;
`

const OriginPermissionName = styled.div`
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 300;
  font-size: 16px;
`

const OriginDrawerMenuItem = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const OriginDrawerPermission = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px 8px;
  padding: 8px;
  box-sizing: border-box;
`

const OriginExpanded = ({ expandedData, moduleId, account }) => {
  const { originId } = expandedData || {}

  const permission = useStore('main.permissions', account, originId) || {}

  return (
    <div className='accountViewScroll'>
      <ClusterBox>
        <ClusterBoxHeader>
          <span>{svg.window(14)}</span>
          <span>{permission.origin}</span>
        </ClusterBoxHeader>
        <Cluster>
          <ClusterRow>
            <ClusterValue allowPointer={true}>
              <OriginPermissions>
                {/* <OriginPermissionTitle>{'Permissions'}</OriginPermissionTitle> */}
                <OriginDrawerPermission>
                  <OriginPermissionName>{'Account Access'}</OriginPermissionName>
                  <OriginToggle
                    isOn={permission.provider}
                    isLocked={false}
                    onClick={() => link.send('tray:action', 'toggleAccess', account, originId)}
                  />
                </OriginDrawerPermission>
              </OriginPermissions>
            </ClusterValue>
          </ClusterRow>
        </Cluster>
        <Cluster>
          <ClusterRow>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem></OriginDrawerMenuItem>
            </ClusterValue>
            <ClusterValue>
              {svg.chain(16)}
              {'Default Chain'}
            </ClusterValue>
            <ClusterValue>{'Mainnet'}</ClusterValue>
          </ClusterRow>
        </Cluster>
        <Cluster>
          <ClusterRow>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem></OriginDrawerMenuItem>
            </ClusterValue>
            <ClusterValue>
              {svg.trash(16)}
              {'Remove Dapp'}
            </ClusterValue>
          </ClusterRow>
        </Cluster>
      </ClusterBox>
    </div>
  )
}

export default OriginExpanded
