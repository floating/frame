import React from 'react'
import styled from 'styled-components'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../resources/Components/Cluster'

import { AccountManagerProvider, useAccountManager } from './AccountManagerProvider'

import { AccountManagerWrap, AccountManagerMain } from './styled'

import { Item } from './Item'
import { FloatingItem } from './FloatingItem'

const Debug = styled.div`
  position: absolute;
  z-index: 9999999999;
  pointer-events: none;
  background: black;
  * {
    pointer-events: none;
  }
`

export const AccountManagerController = () => {
  const {
    dragItem,
    active,
    state,
    unsetDrag,
    setDragCurrentMousePosition,
    dragInitialMousePosition,
    floatActive,
    setFloatActive
  } = useAccountManager()

  return (
    <AccountManagerWrap active={active}>
      {/* <Debug>
        {dragOver && (
          <>
            <div>
              <span>{dragOver.overItem.id}</span>
              <span>{dragOver.location}</span>
            </div>
            <div>{JSON.stringify(floatingItemPosition, null, 4)}</div>
          </>
        )}
      </Debug> */}
      <FloatingItem />
      <AccountManagerMain
        active={active}
        grabbing={floatActive}
        onMouseMove={(e) => {
          if (dragItem && dragInitialMousePosition) {
            const newPosX = e.clientX
            const newPosY = e.clientY
            const dx = Math.abs(newPosX - dragInitialMousePosition.x)
            const dy = Math.abs(newPosY - dragInitialMousePosition.y)
            if (floatActive || dx >= 5 || dy >= 5) {
              setDragCurrentMousePosition({ x: newPosX, y: newPosY })
              setFloatActive(true)
            }
          }
        }}
        onMouseUp={(e) => {
          unsetDrag()
        }}
      >
        <div style={{ height: '60px' }}></div>
        {state.map((item) => {
          return <Item item={item} />
        })}
        <div style={{ height: '60px' }}></div>

        <Cluster>
          <ClusterRow>
            <ClusterValue onClick={() => {}}>
              <div style={{ height: '40px', pointerEvents: 'none' }}>add group</div>
            </ClusterValue>
            <ClusterValue onClick={() => {}}>
              <div style={{ height: '40px', pointerEvents: 'none' }}>add account</div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>

        <div style={{ height: '60px' }}></div>
      </AccountManagerMain>
    </AccountManagerWrap>
  )
}

export const AccountManager = () => {
  return (
    <AccountManagerProvider>
      <AccountManagerController />
    </AccountManagerProvider>
  )
}
