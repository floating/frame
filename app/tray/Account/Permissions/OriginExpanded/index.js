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

const OriginDrawerMenu = styled.div`
  display: flex;
`

const OriginDrawerMenuItem = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background: var(--ghostA); */
  /* padding-top: 1px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--ghostZ);
  box-shadow: 0px 1px 4px var(--ghostX); */
  /* margin-right: 12px; */
  /* display: flex;
  justify-content: center;
  align-items: center; */
  /* border-radius: 12px; */
  /* cursor: pointer;
  * {
    pointer-events: none;
  } */
  /* &:hover {
    transform: translateY(-1px);
    box-shadow: 0px 2px 8px var(--ghostX);
    background: var(--ghostB);
    color: var(--outerspace);
  }
  &:active {
    transform: translateY(0px);
    box-shadow: 0px 1px 2px var(--ghostX);
    background: var(--ghostB);
    color: var(--outerspace);
  } */
`

// .signerBalanceButton
//   height 40px
//   margin-left 13px
//   background var(--ghostA)
//   border-bottom 2px solid var(--ghostZ)
//   box-shadow 0px 1px 4px var(--ghostX)
//   border-radius 20px
//   box-sizing border-box
//   cursor pointer
//   z-index 4000
//   display flex
//   justify-content center
//   align-items center
//   font-size 11px
//   font-weight 500
//   letter-spacing 1px
//   text-transform uppercase
//   padding 1px 20px 0px 21px

//   *
//     pointer-events none
//     margin-left 2px

// .signerBalanceButton:hover
//   background var(--ghostB)
//   color var(--outerspace)
//   // color var(--good)

const OriginPermissionList = styled.div`
  /* background: blue; */
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
  // console.log('origin', origin)

  // const permission = useStore('main.permissions', account, originId) || {}
  const origin = useStore('main.origins', originId) || {}
  if (!origin || !origin.session) return null
  const connected =
    (origin.session.startedAt && !origin.session.endedAt) || origin.session.startedAt > origin.session.endedAt

  const updateRequestRate = () => {
    const now = new Date().getTime()
    const sessionLength = now - origin.session.startedAt
    const sessionLengthSeconds = sessionLength / Math.min(sessionLength, 1000)
    // console.log()
    // console.log('origin', origin, (origin.session.requests / sessionLengthSeconds).toFixed(2))
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
      <div
        className='sliceOrigin'
        // onClick={() => {
        //   link.send('tray:action', 'navDash', { view: 'Origins', data: { OriginDetails: origin.id } })
        // }}
      >
        {/* <Indicator key={origin.session.lastUpdatedAt} connected={connected} /> */}
        {/* <div className='sliceOriginTitle'>{origin.name}</div> */}
        <div className='sliceOriginReqs'>
          <div className='sliceOriginReqsNumber'>{averageRequests}</div>
          <div className='sliceOriginReqsLabel'>{'reqs/min'}</div>
        </div>
      </div>
      {/* {expanded ? <div>{'origin quick menu'}</div> : null} */}
    </div>
  )
}

const OriginExpanded = ({ expandedData, moduleId, account }) => {
  const [collectionFilter, setCollectionFilter] = useState('')
  const currentOrigin = useStore('main.hiddenCollections') || []

  const { originId } = expandedData || {}

  console.log('originId', originId)

  const origins = useStore('main.origins') || {}

  console.log('origins', origins)

  const origin = useStore('main.origins', originId) || {}

  const accountOrigin = useStore('main.permissions', account, originId) || {}

  const permission = useStore('main.permissions', account, originId) || {}

  console.log('accountOrigin', accountOrigin)

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
        {/* <Cluster>
          <ClusterRow>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem>{svg.chain(16)}</OriginDrawerMenuItem>
            </ClusterValue>
            <ClusterValue></ClusterValue>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem>{svg.trash(16)}</OriginDrawerMenuItem>
            </ClusterValue>
          </ClusterRow>
        </Cluster> */}
        {/* <pre>{JSON.stringify(accountOrigin, null, 4)}</pre> */}
      </ClusterBox>
    </div>
  )
}

export default OriginExpanded
