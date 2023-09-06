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

function bySessionStartTime(a, b) {
  return b.session.startedAt - a.session.startedAt
}

function byLastUpdated(a, b) {
  return b.session.lastUpdatedAt - a.session.lastUpdatedAt
}

const originFilter = ['frame-internal', 'frame-extension']

function getOriginsForChain(chain) {
  const origins = useStore('main.origins')
  Objec
  const { connectedOrigins, disconnectedOrigins } = Object.entries(origins).reduce(
    (acc, [id, origin]) => {
      if (origin.chain.id === chain.id && !originFilter.includes(origin.name)) {
        acc[connected ? 'connectedOrigins' : 'disconnectedOrigins'].push({ ...origin, id })
      }

      return acc
    },
    { connectedOrigins: [], disconnectedOrigins: [] }
  )

  return {
    connected: connectedOrigins.sort(bySessionStartTime),
    disconnected: disconnectedOrigins
      .sort(byLastUpdated)
      .filter((origin) => Date.now() - origin.session.lastUpdatedAt < 60 * 60 * 1000)
  }
}

const OriginModule = styled.div`
  width: 100%;
`

const OriginName = styled.div`
  /* font-family: 'VCR'; */
  padding: 20px;
  font-weight: 400;
  font-size: 16px;
`

const OriginPermissions = styled.div`
  width: 100%;
`

const OriginRequestss = styled.div`
  font-family: 'VCR';
  padding: 20px;
  border-bottom: 2px solid var(--ghostZ);
`

const OriginPermission = styled.div`
  font-family: 'VCR';
  padding: 20px;
  border-bottom: 2px solid var(--ghostZ);
`

const OriginDrawer = styled.div`
  width: 100%;
`

const OriginDrawerFooter = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: space-between;
  padding: 8px;
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

const OriginPermissionTitle = styled.div`
  text-transform: uppercase;
  padding: 8px;
  font-size: 10px;
  font-weight: 500;
  width: calc(100% - 16px);
  margin: 0px 8px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--ghostY);
`

const OriginDrawerPermission = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px 8px;
  padding: 8px;
  box-sizing: border-box;
`

const OriginRequests = ({ originId }) => {
  const [averageRequests, setRequests] = React.useState('0.0')
  const origin = useStore('main.origins', originId) || {}
  if (!origin || !origin.session) return null
  const connected =
    (origin.session.startedAt && !origin.session.endedAt) || origin.session.startedAt > origin.session.endedAt

  const updateRequestRate = () => {
    const now = new Date().getTime()
    const sessionLength = now - origin.session.startedAt
    const sessionLengthSeconds = sessionLength / Math.min(sessionLength, 1000)
    setRequests(origin.session.requests.toFixed(2))
  }

  useEffect(() => {
    const requestUpdates = setInterval(() => {
      updateRequestRate()
    }, 1000)
    return () => {
      clearInterval(requestUpdates)
    }
  })

  return (
    <div>
      <div className='sliceOrigin'>
        {/* <Indicator key={origin.session.lastUpdatedAt} connected={connected} /> */}
        <div className='sliceOriginReqs'>
          <div className='sliceOriginReqsNumber'>{averageRequests}</div>
          <div className='sliceOriginReqsLabel'>{'reqs/min'}</div>
        </div>
      </div>
    </div>
  )
}

const OriginExpanded = ({ expandedData, moduleId, account }) => {
  const [collectionFilter, setCollectionFilter] = useState('')
  const currentOrigin = useStore('main.hiddenCollections') || []

  const { originId } = expandedData || {}

  const origins = useStore('main.origins') || {}

  const origin = useStore('main.origins', originId) || {}

  const accountOrigin = useStore('main.permissions', account, originId) || {}

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
