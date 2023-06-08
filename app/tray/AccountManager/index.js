import React, { useEffect, useState, useRef, useCallback } from 'react'
import styled from 'styled-components'

import { AccountManagerProvider, useAccountManager } from './AccountManagerProvider'

import link from '../../../resources/link'
import useStore from '../../../resources/hooks/useStore'
import svg from '../../../resources/svg'

import { findRoute, removeByRoute, addByRoute, moveItem } from './organize'

import { AccountManagerWrap, AccountManagerMain } from './styled'

import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterColumn,
  ClusterValue
} from '../../../resources/Components/Cluster'

const Debug = styled.div`
  position: absolute;
  z-index: 9999999999;
  pointer-events: none;
  background: black;
  * {
    pointer-events: none;
  }
`

const AccountManagerFloat = styled.div`
  position: absolute;
  inset: 0px;
  z-index: 10000000000;
  pointer-events: none;
  * {
    pointer-events: none;
  }
`

const Grab = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  cursor: grab;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  &:active {
    cursor: grabbing;
  }
  * {
    pointer-events: none;
  }
`

const Copy = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  cursor: pointer;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
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

const timers = {}

const Item = ({ item, floating }) => {
  const [grab, setGrab] = useState(false)
  const [moving, setMoving] = useState(false)
  const { dragItem, setDrag, setDraggingOverItem, floatingItemPosition, anchorStyle, setAnchorStyle } =
    useAccountManager()

  const ref = useRef(null)

  const setAnchor = () => {
    if (ref && ref.current) {
      const computedStyle = window.getComputedStyle(ref.current)
      setAnchorStyle({
        borderTopLeftRadius: computedStyle.borderTopLeftRadius,
        borderTopRightRadius: computedStyle.borderTopRightRadius,
        borderBottomLeftRadius: computedStyle.borderBottomLeftRadius,
        borderBottomRightRadius: computedStyle.borderBottomRightRadius
      })
    }
  }

  useEffect(() => {
    if (!dragItem || !ref || !ref.current) return
    const itemOverEmptyGroup = item.type === 'group' && dragItem.type === 'item' && item.items.length === 0
    if (item.type !== dragItem.type && !itemOverEmptyGroup) return
    const boundingRect = ref.current.getBoundingClientRect()
    if (item.id === dragItem.id) {
      setAnchor()
    } else {
      const isOverCurrentItem =
        floatingItemPosition.x >= boundingRect.left &&
        floatingItemPosition.x <= boundingRect.left + boundingRect.width &&
        floatingItemPosition.y >= boundingRect.top &&
        floatingItemPosition.y <= boundingRect.top + boundingRect.height

      if (isOverCurrentItem) {
        const distances = {
          top: Math.abs(floatingItemPosition.y - boundingRect.top),
          bottom: Math.abs(floatingItemPosition.y - (boundingRect.top + boundingRect.height))
        }
        const minDistance = Math.min(distances.top, distances.bottom)
        const position = Object.keys(distances).find((key) => distances[key] === minDistance)
        setDraggingOverItem(item, position, itemOverEmptyGroup)
      }
    }
  }, [floatingItemPosition.y]) // Depend on floatingItemPosition

  const hide = dragItem && dragItem.id === item.id && !floating

  let style = { flexDirection: 'column' }

  if (floating && anchorStyle) {
    Object.assign(style, anchorStyle)
  }

  if (floating) {
    if (anchorStyle) Object.assign(style, anchorStyle)
    if (item.type === 'group') {
      Object.assign(style, { background: 'var(--ghostA)' })
    } else if (item.type === 'item') {
      Object.assign(style, { background: 'var(--ghostB)' })
    }
  }

  if ((dragItem && dragItem.type !== item.type) || floating) {
    Object.assign(style, { pointerEvents: 'none' })
  }
  if (hide) {
    Object.assign(style, { opacity: 0 })
  }

  const onMouseUp = (e) => {
    clearTimeout(timers[item.id])
    // console.log('onMouseUp', moving && floating && dragItem.id === item.id)
    if (!moving && !floating && dragItem.id === item.id) {
      console.log(moving)
      if (Math.abs(e.clientX - grab.x) < 10 && Math.abs(e.clientY - grab.y) < 10) {
        console.log('click item ' + item.id)
      }
    }
    setGrab(false)
    setMoving(false)
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchor()
    clearTimeout(timers[item.id])
    const boundingRect = ref.current.getBoundingClientRect()
    const initialPosition = { x: e.clientX, y: e.clientY }
    setDrag(item, boundingRect, initialPosition)
    setGrab({ x: e.clientX, y: e.clientY })
    timers[item.id] = setTimeout(() => {
      setMoving(true)
    }, 400)
  }

  if (item.type === 'group') {
    return (
      <ClusterBox
        // transparent={dragItem && dragItem.id === item.id}
        style={style}
        ref={ref}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
      >
        <div style={{ display: 'flex', position: 'relative', padding: '20px' }}>{item.name}</div>
        {item?.items?.length > 0 && (
          <Cluster>
            {item?.items?.map((item) => {
              return <Item item={item} />
            })}
          </Cluster>
        )}
      </ClusterBox>
    )
  } else if (item.type === 'item') {
    return (
      <ClusterRow>
        <ClusterValue
          // transparent={dragItem && dragItem.id === item.id}
          style={style}
          ref={ref}
          onMouseUp={onMouseUp}
          onMouseDown={onMouseDown}
        >
          <div style={{ display: 'flex', position: 'relative', padding: '20px' }}>{item.id}</div>
        </ClusterValue>
      </ClusterRow>
    )
  }

  return (
    <ClusterBox
      transparent={floating}
      style={style}
      ref={ref}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    >
      <div style={{ display: 'flex', position: 'relative', padding: '20px' }}>{item.name}</div>
      <Cluster>
        {item?.items?.map((item) => {
          return <Item item={item} />
        })}
      </Cluster>
    </ClusterBox>
  )
}

const Dot = ({ pos }) => {
  if (!pos) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: '32px',
        height: '16px',
        marginTop: '-8px',
        background: 'red',
        zIndex: 999999999999999,
        borderRadius: '8px'
      }}
    ></div>
  )
}

export const AccountManagerController = () => {
  const { dragItem, active, state, unsetDrag, setDragCurrentMousePosition, dragOver, floatingItemPosition } =
    useAccountManager()

  return (
    <AccountManagerWrap active={active}>
      {/* <Dot pos={floatingItemPosition} /> */}
      <Debug>
        {dragOver && (
          <>
            <div>
              <span>{dragOver.overItem.id}</span>
              <span>{dragOver.location}</span>
            </div>
            <div>{JSON.stringify(floatingItemPosition, null, 4)}</div>
          </>
        )}
      </Debug>
      <AccountManagerFloat>
        <FloatingValue />
      </AccountManagerFloat>
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
