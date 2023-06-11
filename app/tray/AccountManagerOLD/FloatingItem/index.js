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
  const { dragItem, movePosition, dragItemBounds: rect, anchorStyle, floatActive } = useAccountManager()
  if (!dragItem || !floatActive) {
    return null
  } else if (rect) {
    return (
      <div
        style={{
          // TODO: Make this placement more generic
          left: dragItem?.type === 'item' ? rect.left - 3 + movePosition.x : rect.left - 6 + movePosition.x,
          top: dragItem?.type === 'item' ? rect.top - 3 + movePosition.y : rect.top - 6 + movePosition.y,
          width: dragItem?.type === 'item' ? rect.width + 6 : rect.width + 12,
          height: dragItem?.type === 'item' ? rect.height + 6 : rect.height + 12,
          position: 'relative',
          pointerEvents: 'none',
          fontSize: '17px',
          fontWeight: 400,
          borderRadius: '20px',
          WebkitAppRegion: 'no-drag',
          transition: 'none',
          transform: 'translate3d(0, 0, 0)',
          fontFamily: 'MainFont',
          display: 'flow-root',
          padding: dragItem?.type === 'item' ? '1px 0px 1px 0px' : '0px',
          textAlign: 'center'
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
