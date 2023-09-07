import React from 'react'
import styled from 'styled-components'

import { useFluid } from '../FluidProvider'

const AccountManagerFloat = styled.div`
  position: absolute;
  inset: 0px;
  z-index: 9999999;
  pointer-events: none !important;
  transition: none !important;
  animation: none !important;
  * {
    animation: none !important;
    pointer-events: none !important;
    transition: none !important;
  }
`

const Wrap = styled.div`
  pointer-events: none !important;
  transition: none !important;
  * {
    pointer-events: none !important;
    transition: none !important;
  }
`

export const FloatingValue = () => {
  const { dragItem, movePosition, dragItemBounds, floatActive, clone } = useFluid()
  if (!dragItem || !floatActive) {
    return null
  } else if (dragItemBounds) {
    const style = {
      left: dragItemBounds.left + movePosition.x,
      top: dragItemBounds.top + movePosition.y,
      width: dragItemBounds.width,
      height: dragItemBounds.height,
      position: 'relative',
      pointerEvents: 'none'
      // WebkitAppRegion: 'no-drag',
      // transition: 'none',
      // transform: 'translate3d(0, 0, 0)',
      // fontFamily: 'MainFont',
      // display: 'flow-root',
      // padding: '0px',
      // textAlign: 'center'
    }
    return <Wrap style={style} dangerouslySetInnerHTML={{ __html: clone.outerHTML }} />
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
