import React, { useState } from 'react'
import styled from 'styled-components'

import svg from '../../../resources/svg'

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

export const AccountManagerFilter = () => {
  const [accountModuleFilter, setAccountModuleFilter] = useState('')

  return (
    <div className='panelFilterAccount'>
      <div className='panelFilterIcon'>{svg.search(12)}</div>
      <div className='panelFilterInput'>
        <input
          tabIndex='-1'
          type='text'
          spellCheck='false'
          onChange={(e) => {
            const value = e.target.value
            setAccountModuleFilter(value)
          }}
          value={accountModuleFilter}
        />
      </div>
      {accountModuleFilter ? (
        <div
          className='panelFilterClear'
          onClick={() => {
            setAccountModuleFilter('')
          }}
        >
          {svg.close(12)}
        </div>
      ) : null}
    </div>
  )
}

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
        <AccountManagerFilter />
        {state.map((item) => {
          return <Item item={item} />
        })}
        <div style={{ height: '40px' }}></div>

        <Cluster>
          <ClusterRow>
            <ClusterValue onClick={() => {}}>
              <div
                style={{
                  height: '40px',
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                add group
              </div>
            </ClusterValue>
            <ClusterValue onClick={() => {}}>
              <div
                style={{
                  height: '40px',
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                add account
              </div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>

        <div style={{ height: '40px' }}></div>
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
