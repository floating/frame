import React, { useEffect, useState, useRef, useCallback } from 'react'
import styled from 'styled-components'

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
  /* height: 100px; */
  /* width: 100%; */
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

let currentDraggingItemRef = null
let currentDraggingItemRefRect = null

export const FloatingValue = ({ movePosition, draggingItem }) => {
  const valueRef = currentDraggingItemRef
  const rect = currentDraggingItemRefRect
  const posId = `${movePosition.x}-${movePosition.y}`

  const floatingRef = useRef(null)

  useEffect(() => {
    if (floatingRef && floatingRef.current && valueRef && valueRef.current) {
      const computedStyle = window.getComputedStyle(valueRef.current)

      // copy only the actual style properties
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i]
        floatingRef.current.style[prop] = computedStyle.getPropertyValue(prop)
      }

      // set pointer-events to none
      floatingRef.current.style.pointerEvents = 'none'
      floatingRef.current.style.opacity = 1
      floatingRef.current.style.position = 'absolute'
      floatingRef.current.style.transition = 'none'
      floatingRef.current.style.left = rect.left + movePosition.x
      floatingRef.current.style.top = rect.top - 2 + movePosition.y
      floatingRef.current.style.boxShadow = '0px 4px 16px 0px var(--ghostX)'
      floatingRef.current.style.background = 'var(--ghostB)'
    }
  }, [posId])

  if (valueRef && valueRef.current) {
    return (
      <div
        style={{
          left: rect.left + movePosition.x,
          top: rect.top - 2 + movePosition.y
        }}
        ref={floatingRef}
      >
        <ListItem
          item={draggingItem}
          index={0}
          parentId={0}
          draggingItem={() => {}}
          setDraggingItem={() => {}}
          setInitialPosition={() => {}}
          setCurrentPosition={() => {}}
          setDraggingOverItem={() => {}}
          floating={true}
        />
      </div>
    )
  } else {
    return null
  }
}

// const renderListItem = (
//   item,
//   index,
//   draggingItem,
//   setDraggingItem,
//   setInitialPosition,
//   setCurrentPosition,
//   setDraggingOverItem
// ) => {
//   if (item.type === 'group') {
//     return (
//       <Group key={item.id}>
//         <GroupTitle>{item.title}</GroupTitle>
//         {item.items.map((item, index) =>
//           renderListItem(
//             item,
//             index,
//             draggingItem,
//             setDraggingItem,
//             setInitialPosition,
//             setCurrentPosition,
//             setDraggingOverItem
//           )
//         )}
//       </Group>
//     )
//   }
// }
const Item = () => {}
const Group = ({
  item,
  index,
  parentId = null,
  draggingItem,
  setDraggingItem,
  setInitialPosition,
  setCurrentPosition,
  setDraggingOverItem,
  stack,
  floating
}) => {
  const ref = useRef(null)
  let animationFrame
  return (
    <ClusterBox
      transparent={floating}
      onClick={item.type === 'group' || draggingItem ? null : () => {}}
      style={
        draggingItem && draggingItem.id === item.id
          ? { opacity: 0, flexDirection: 'column' }
          : { flexDirection: 'column' }
      }
      ref={ref}
      onMouseEnter={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (e.target === e.currentTarget) stack.push(item.id)
      }}
      onMouseLeave={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (e.target === e.currentTarget) stack.remove(item.id)
      }}
      onMouseMove={(e) => {
        if (!draggingItem) return
        if (draggingItem && draggingItem.type !== item.type) return
        if (animationFrame) {
          // cancel the previous frame if it's not yet executed
          cancelAnimationFrame(animationFrame)
        }

        animationFrame = requestAnimationFrame(() => {
          if (!ref || !ref.current || !draggingItem || item.id !== stack.current()) return
          // if (e.target !== e.currentTarget) {
          //   return console.log('The mousemove event was bubbled from ', e.target)
          // }
          const boundingRect = ref.current.getBoundingClientRect()
          const mouseX = e.clientX
          const mouseY = e.clientY

          const distances = {
            top: Math.abs(mouseY - boundingRect.top),
            right: Math.abs(mouseX - (boundingRect.left + boundingRect.width)),
            bottom: Math.abs(mouseY - (boundingRect.top + boundingRect.height)),
            left: Math.abs(mouseX - boundingRect.left)
          }

          const minDistance = Math.min(distances.top, distances.right, distances.bottom, distances.left)
          const mousePosition = Object.keys(distances).find((key) => distances[key] === minDistance)

          setDraggingOverItem(item, mousePosition)
        })
      }}
    >
      <div style={{ display: 'flex', position: 'relative', padding: '20px' }}>
        <Grab
          onMouseOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            currentDraggingItemRef = ref
            currentDraggingItemRefRect = ref.current.getBoundingClientRect()
            setDraggingItem(item)
            setInitialPosition({ x: e.clientX, y: e.clientY })
            setCurrentPosition({ x: e.clientX, y: e.clientY })
          }}
        >
          {svg.grab(30)}
        </Grab>
        {'group ' + item.id}
      </div>
      <Cluster>
        {renderItems(
          item.items,
          index,
          draggingItem,
          setDraggingItem,
          setInitialPosition,
          setCurrentPosition,
          setDraggingOverItem,
          stack
        )}
      </Cluster>
    </ClusterBox>
  )
}

const ListItem = ({
  item,
  index,
  parentId = null,
  draggingItem,
  setDraggingItem,
  setInitialPosition,
  setCurrentPosition,
  setDraggingOverItem,
  stack,
  floating
}) => {
  if (!stack && !floating) return null
  const ref = useRef(null)
  if (item.id === draggingItem?.id) currentDraggingItemRef = ref

  let animationFrame

  if (item.type === 'group') {
    return (
      <Group
        item={item}
        index={index}
        parentId={parentId}
        draggingItem={draggingItem}
        setDraggingItem={setDraggingItem}
        setInitialPosition={setInitialPosition}
        setCurrentPosition={setCurrentPosition}
        setDraggingOverItem={setDraggingOverItem}
        stack={stack}
        floatin={floating}
      />
    )
  } else {
    return (
      <ClusterRow style={floating ? { width: '100%', height: '100%' } : {}}>
        <ClusterValue
          transparent={floating}
          onClick={item.type === 'group' || draggingItem ? null : () => {}}
          style={{
            opacity: draggingItem && draggingItem.id === item.id ? 0 : 1
          }}
          ref={ref}
          onMouseEnter={(e) => {
            e.stopPropagation()
            e.preventDefault()
            stack.push(item.id)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            e.preventDefault()
            stack.remove(item.id)
          }}
          onMouseMove={(e) => {
            if (!draggingItem) return
            if (draggingItem && draggingItem.type !== item.type) return
            if (animationFrame) {
              // cancel the previous frame if it's not yet executed
              cancelAnimationFrame(animationFrame)
            }

            animationFrame = requestAnimationFrame(() => {
              if (!ref || !ref.current || !draggingItem || item.id !== stack.current()) return
              // if (e.target !== e.currentTarget) {
              //   return console.log('The mousemove event was bubbled from ', e.target)
              // }
              const boundingRect = ref.current.getBoundingClientRect()
              const mouseX = e.clientX
              const mouseY = e.clientY

              const distances = {
                top: Math.abs(mouseY - boundingRect.top),
                right: Math.abs(mouseX - (boundingRect.left + boundingRect.width)),
                bottom: Math.abs(mouseY - (boundingRect.top + boundingRect.height)),
                left: Math.abs(mouseX - boundingRect.left)
              }

              const minDistance = Math.min(distances.top, distances.right, distances.bottom, distances.left)
              const mousePosition = Object.keys(distances).find((key) => distances[key] === minDistance)

              setDraggingOverItem(item, mousePosition)
            })
          }}
        >
          <style jsx>{`
            * {
              pointer-events: ${draggingItem ? 'none' : 'auto'};
            }
          `}</style>
          <Copy
            onClick={(e) => {
              // e.preventDefault()
              // e.stopPropagation()
            }}
          >
            {svg.copy(14)}
          </Copy>
          <Grab
            onMouseOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              currentDraggingItemRef = ref
              currentDraggingItemRefRect = currentDraggingItemRef.current.getBoundingClientRect()
              setDraggingItem(item)
              setInitialPosition({ x: e.clientX, y: e.clientY })
              setCurrentPosition({ x: e.clientX, y: e.clientY })
            }}
          >
            {svg.grab(30)}
          </Grab>
          <div style={{ padding: '20px' }}>{'item ' + item.id}</div>
        </ClusterValue>
      </ClusterRow>
    )
  }
}

const renderItems = (
  items,
  parentId = null,
  draggingItem,
  setDraggingItem,
  setInitialPosition,
  setCurrentPosition,
  setDraggingOverItem,
  stack
) => {
  return items.map((item, index) => {
    return (
      <ListItem
        item={item}
        index={index}
        parentId={parentId}
        draggingItem={draggingItem}
        setDraggingItem={setDraggingItem}
        setInitialPosition={setInitialPosition}
        setCurrentPosition={setCurrentPosition}
        setDraggingOverItem={setDraggingOverItem}
        stack={stack}
      />
    )
  })
}

const locateItem = (items, id, route = []) => {
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) {
    route.push(index)
    return route
  } else {
    for (const [index, item] of items.entries()) {
      if (item.items) {
        route.push(index)
        const result = locateItem(item.items, id, route)
        if (result) return result
      }
    }
  }

  return null
}

export const AccountManager = () => {
  const crumb = useStore('windows.panel.nav')[0] || {}

  const [draggingItem, setDraggingItem] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [initialPosition, setInitialPosition] = useState(null)
  const [currentPosition, setCurrentPosition] = useState(null)

  const movePosition =
    initialPosition && currentPosition
      ? { x: currentPosition.x - initialPosition.x, y: currentPosition.y - initialPosition.y }
      : { x: 0, y: 0 }

  const setDraggingOverItem = (overItem, location) => {
    console.log('setDraggingOverItem', overItem, location)
    if (!draggingItem || draggingItem.id === overItem.id) return

    setDragOver({ overItem, location })

    setList((currentList) => {
      let newList = currentList
      if (draggingItem.id && overItem.id) {
        newList = moveItem(newList, draggingItem.id, overItem.id, location)
      }
      return newList
    })
  }

  const active = crumb.view === 'accountManager'

  const addresses = {
    '0x1': {
      address: '0x1',
      name: 'Account 1'
    },
    '0x2': {
      address: '0x2',
      name: 'Account 2'
    },
    '0x3': {
      address: '0x3',
      name: 'Account 3'
    },
    '0x4': {
      address: '0x4',
      name: 'Account 4'
    },
    '0x5': {
      address: '0x5',
      name: 'Account 5'
    }
  }

  const groups = [
    {
      id: 'g1',
      type: 'group',
      name: 'Group 1',
      addresses: ['0x1', '0x2'],
      items: [
        { id: 'i3', type: 'item', content: 'Item 3' },
        { id: 'i4', type: 'item', content: 'Item 4' },
        { id: 'i1', type: 'item', content: 'Item 1' },
        { id: 'i2', type: 'item', content: 'Item 2' }
      ]
    },
    {
      id: 'g2',
      type: 'group',
      name: 'Group 2',
      items: [
        // {
        //   id: 'g4',
        //   type: 'group',
        //   name: 'Group 4',
        //   items: [
        //     { id: 'i12', type: 'item', content: 'Item 3' },
        //     { id: 'i5', type: 'item', content: 'Item 4' }
        //   ]
        // },
        { id: 'i126', type: 'item', name: '', content: 'Item 13' },
        { id: 'i124', type: 'item', name: '', content: 'Item 24' }
      ]
    },
    {
      id: 'g3',
      type: 'group',
      name: 'Group 3',
      items: [
        { id: 'i6', type: 'item', content: 'Item 6' },
        { id: 'i7', type: 'item', content: 'Item 7' }
      ]
    }
  ]

  const [list, setList] = useState([
    {
      id: 'g1',
      type: 'group',
      name: 'Group 1',
      items: [
        { id: 'i3', type: 'item', content: 'Item 3' },
        { id: 'i4', type: 'item', content: 'Item 4' }
      ]
    },
    {
      id: 'g2',
      type: 'group',
      name: 'Group 2',
      items: [
        // {
        //   id: 'g4',
        //   type: 'group',
        //   name: 'Group 4',
        //   items: [
        //     { id: 'i12', type: 'item', content: 'Item 3' },
        //     { id: 'i5', type: 'item', content: 'Item 4' }
        //   ]
        // },
        { id: 'i126', type: 'item', name: '', content: 'Item 13' },
        { id: 'i124', type: 'item', name: '', content: 'Item 24' }
      ]
    },
    {
      id: 'g3',
      type: 'group',
      name: 'Group 3',
      items: [
        { id: 'i6', type: 'item', content: 'Item 6' },
        { id: 'i7', type: 'item', content: 'Item 7' }
      ]
    },

    {
      id: 'g4',
      type: 'group',
      name: 'Group 4',
      items: [
        { id: 'i123', type: 'item', content: 'Item 123' },
        { id: 'i1234', type: 'item', content: 'Item 1234' }
      ]
    }
  ])

  const [stackArray, setStack] = useState([])

  const stack = {
    push: (item) => setStack((prevStack) => [item, ...prevStack]),
    remove: () => setStack((prevStack) => prevStack.slice(1)),
    current: () => stackArray[0]
  }

  return (
    <AccountManagerWrap active={active}>
      <Debug>
        {dragOver && (
          <>
            <span>{dragOver.overItem.id}</span>
            <span>{dragOver.location}</span>
          </>
        )}
      </Debug>
      <AccountManagerFloat>
        {draggingItem && <FloatingValue movePosition={movePosition} draggingItem={draggingItem} />}
      </AccountManagerFloat>
      <AccountManagerMain
        active={active}
        onMouseMove={(e) => {
          console.log('onMouseMove')
          if (draggingItem) {
            setCurrentPosition({ x: e.clientX, y: e.clientY })
          }
        }}
        onMouseUp={(e) => {
          currentDraggingItemRef = null
          setDraggingItem(null)
          setInitialPosition(null)
          setCurrentPosition(null)
          setDragOver(null)
        }}
      >
        {renderItems(
          list,
          null,
          draggingItem,
          setDraggingItem,
          setInitialPosition,
          setCurrentPosition,
          setDraggingOverItem,
          stack
        )}
      </AccountManagerMain>
    </AccountManagerWrap>
  )
}
