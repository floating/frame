import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'

import link from '../../../../resources/link'

import { useAccountManager } from '../AccountManagerProvider'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../resources/Components/Cluster'
import svg from '../../../../resources/svg'

import ethAddressToColor from '../AccountColor'

import AccountAvatar from '../AccountAvatar'

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

const GroupHeader = styled.div`
  display: flex;
  position: relative;
  padding: 16px 16px;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: -8px;
  align-items: center;
`

const GroupExpand = styled.div`
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: var(--standard);
  transform: ${({ expanded }) => (expanded ? 'rotate(180deg)' : 'rotate(90deg)')};
  * {
    pointer-events: none;
  }
`

const Group = ({ item, style, onMouseUp, onMouseDown, _ref }) => {
  const [expanded, setExpanded] = useState(true)
  return (
    <ClusterBox style={style} ref={_ref} onMouseUp={onMouseUp} onMouseDown={onMouseDown}>
      <GroupHeader>
        <GroupExpand
          expanded={expanded}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {svg.chevron(20)}
        </GroupExpand>
        <div style={{ marginLeft: '8px', fontWeight: '600' }}>{item.name}</div>
      </GroupHeader>
      {item?.items?.length > 0 && expanded ? (
        <Cluster>
          {item?.items?.map((item) => {
            return <Item item={item} />
          })}
        </Cluster>
      ) : (
        <div style={{ height: '8px' }} />
      )}
    </ClusterBox>
  )
}

const Account = ({ item, style, onMouseUp, onMouseDown, _ref }) => {
  // const [accountColor, setAccountColor] = useState('transparent')
  // useEffect(() => {
  //   const getColor = async () => {
  //     const color = await ethAddressToColor(item.address)
  //     console.log(color)
  //     setAccountColor(color)
  //   }
  //   getColor()
  // }, [item.address])

  return (
    <ClusterRow>
      <ClusterValue
        onClick={() => {}}
        style={style}
        ref={_ref}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
      >
        <div
          style={{
            fontWeight: '400',
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '10px',
              width: '40px',
              height: '40px',
              marginRight: '16px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--ghostB)',
              boxShadow: '0px 1px 4px 0px var(--ghostY)'
            }}
          >
            {/* <AccountAvatar address={item.address} /> */}
          </div>

          <div>
            <div>{item.ensName}</div>
            <div>{`${item.address.substr(0, 6)}...${item.address.substr(
              item.address.length - 4,
              item.address.length
            )}`}</div>
          </div>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

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
    floatActive
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
  }, [floatingItemPosition.y])

  const hide = dragItem && dragItem.id === item.id && !floating && floatActive

  let style = { flexDirection: 'column' }

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
    Object.assign(style, { opacity: 0.3, pointerEvents: 'none' })
  }

  const onMouseUp = (onClick) => {
    return (e) => {
      if (!moving && !floating && dragItem?.id === item.id) {
        console.log(moving)
        if (Math.abs(e.clientX - grab.x) < 10 && Math.abs(e.clientY - grab.y) < 10) {
          onClick()
        }
      }
      setGrab(false)
      setMoving(false)
    }
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchor()
    const boundingRect = ref.current.getBoundingClientRect()
    const initialPosition = { x: e.clientX, y: e.clientY }
    setDrag(item, boundingRect, initialPosition)
    setGrab({ x: e.clientX, y: e.clientY })
  }

  if (item.type === 'group') {
    const onClick = () => {}
    return (
      <Group
        key={item.id}
        _ref={ref}
        item={item}
        style={style}
        onMouseUp={onMouseUp(onClick)}
        onMouseDown={onMouseDown}
      />
    )
  } else if (item.type === 'item') {
    const onClick = () => {
      link.rpc('setSigner', item.address, (err) => {
        if (err) return console.log(err)
      })
      link.send('nav:back', 'panel')
    }
    return (
      <Account
        key={item.address}
        _ref={ref}
        item={item}
        style={style}
        onMouseUp={onMouseUp(onClick)}
        onMouseDown={onMouseDown}
      />
    )
  }
}
