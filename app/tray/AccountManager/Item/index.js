import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'

import { useAccountManager } from '../AccountManagerProvider'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../resources/Components/Cluster'

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

const timers = {}

export const Item = ({ item, floating }) => {
  const [grab, setGrab] = useState(false)
  const [moving, setMoving] = useState(false)
  const {
    dragItem,
    setDrag,
    setDraggingOverItem,
    floatingItemPosition,
    anchorStyle,
    setAnchorStyle,
    unsetting
  } = useAccountManager()

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

  const hide = dragItem && dragItem.id === item.id && !floating && !unsetting

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
    Object.assign(style, { opacity: 0, transition: '0s linear all' })
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
      <ClusterBox style={style} ref={ref} onMouseUp={onMouseUp} onMouseDown={onMouseDown}>
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
          onClick={() => {}}
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
    <ClusterBox style={style} ref={ref} onClick={onClick} onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
      <div style={{ display: 'flex', position: 'relative', padding: '20px' }}>{item.name}</div>
      <Cluster>
        {item?.items?.map((item) => {
          return <Item item={item} />
        })}
      </Cluster>
    </ClusterBox>
  )
}
