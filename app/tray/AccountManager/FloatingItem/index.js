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
          left: rect.left - 3 + movePosition.x,
          top: rect.top - 3 + movePosition.y,
          width: rect.width + 6,
          height: rect.height + 6,
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
          padding: '1px 0px 1px 0px',
          textAlign: 'center'
          // background: 'var(--ghostB05)',
          // backdropFilter: 'blur(2px)'
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
