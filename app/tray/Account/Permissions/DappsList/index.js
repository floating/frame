import React, { useState, createRef, useEffect } from 'react'
import styled from 'styled-components'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { matchFilter } from '../../../../../resources/utils'
import useStore from '../../../../../resources/Hooks/useStore'

import { OriginToggle } from './styled'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

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

const OriginName = styled.div`
  padding: 20px;
  font-weight: 400;
  font-size: 16px;
`

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

  const updateRequestRate = () => {
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
        <div className='sliceOriginReqs'>
          <div className='sliceOriginReqsNumber'>{averageRequests}</div>
          <div className='sliceOriginReqsLabel'>{'reqs/min'}</div>
        </div>
      </div>
    </div>
  )
}

const OriginItem = ({ moduleId, originId, account, toggleOpen, open, first, last }) => {
  if (!originId) return null
  const permission = useStore('main.permissions', account, originId) || {}
  const origin = useStore('main.origins', originId) || {}
  return (
    <>
      {open && !first && <div style={{ height: '16px' }} />}
      <ClusterRow key={originId}>
        <ClusterValue
          onClick={() => {
            const crumb = {
              view: 'expandedModule',
              data: {
                id: moduleId,
                account: account,
                originId: permission.handlerId,
                title: 'Dapp Settings'
              }
            }
            link.send('nav:forward', 'panel', crumb)
          }}
          active={open}
        >
          <OriginName>{permission.origin}</OriginName>
          <OriginRequests originId={originId} />
        </ClusterValue>
      </ClusterRow>
      {open && (
        <>
          <ClusterRow>
            <ClusterValue allowPointer={true}>
              <OriginPermissions>
                <OriginPermissionTitle>{'Permissions'}</OriginPermissionTitle>
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
          <ClusterRow>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem>{svg.chain(16)}</OriginDrawerMenuItem>
            </ClusterValue>
            <ClusterValue></ClusterValue>
            <ClusterValue width={46} onClick={() => {}}>
              <OriginDrawerMenuItem>{svg.trash(16)}</OriginDrawerMenuItem>
            </ClusterValue>
          </ClusterRow>
        </>
      )}
      {open && !last && <div style={{ height: '16px' }} />}
    </>
  )
}

const OriginsList = ({ moduleId, permissionList, account }) => {
  const [open, setOpen] = useState(-1)
  return (
    <Cluster>
      {permissionList.length === 0 ? (
        <ClusterRow>
          <ClusterValue>
            <div className='signerPermission'>
              <div className='signerPermissionControls'>
                <div className='signerPermissionNoPermissions'>No Permissions Set</div>
              </div>
            </div>
          </ClusterValue>
        </ClusterRow>
      ) : (
        permissionList.map((originId, i) => {
          // useStore('main.origins', originId)
          return (
            <OriginItem
              moduleId={moduleId}
              originId={originId}
              account={account}
              open={open === i}
              first={i === 0}
              last={i === permissionList.length - 1}
              toggleOpen={() => setOpen(open === i ? -1 : i)}
            />
          )
        })
      )}
    </Cluster>
  )
}

export default OriginsList
