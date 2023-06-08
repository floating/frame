import React from 'react'
import styled from 'styled-components'

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
  const { dragItem, active, state, unsetDrag, setDragCurrentMousePosition, dragOver, floatingItemPosition } =
    useAccountManager()

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
        onMouseMove={(e) => {
          if (dragItem) {
            setDragCurrentMousePosition({ x: e.clientX, y: e.clientY })
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
