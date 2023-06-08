import React from 'react'
import styled from 'styled-components'

import { useAccountManager } from '../AccountManagerProvider'

import { Item } from '../Item'

const AccountManagerFloat = styled.div`
  position: absolute;
  inset: 0px;
  z-index: 10000000000;
  pointer-events: none;
  * {
    pointer-events: none;
  }
`

export const FloatingValue = () => {
  const { dragItem, movePosition, dragItemBounds: rect, anchorStyle } = useAccountManager()
  if (!dragItem) {
    return null
  } else if (rect) {
    return (
      <div
        style={{
          left: rect.left - 3 + movePosition.x,
          top: rect.top - 1 + movePosition.y,
          width: rect.width + 6,
          height: rect.height + 6,
          position: 'absolute',
          pointerEvents: 'none'
        }}
      >
        {dragItem.type === 'group' ? (
          <Item item={dragItem} floating={true} anchorStyle={anchorStyle} />
        ) : (
          <Item item={dragItem} floating={true} anchorStyle={anchorStyle} />
        )}
      </div>
    )
  } else {
    return null
  }
}

export const FloatingItem = () => {
  return (
    <AccountManagerFloat>
      <FloatingValue />
    </AccountManagerFloat>
  )
}
