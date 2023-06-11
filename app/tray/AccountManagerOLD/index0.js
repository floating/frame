import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import link from '../../../resources/link'
import useStore from '../../../resources/hooks/useStore'
import { AccountManagerWrap, AccountManagerMain } from './styled'
import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterColumn,
  ClusterValue
} from '../../../resources/Components/Cluster'

const AccountManagerFloat = styled.div`
  position: absolute;
  inset: 0px;
`

const FloatingItem = styled.div`
  position: absolute;
  top: ${({ pos }) => {
    return pos ? pos.x + 'px' : '0px'
  }};
  left: ${({ pos }) => {
    return pos ? pos.y + 'px' : '0px'
  }};
  width: 100%;
  height: 40px;
`

const Group = styled.div`
  border: 1px solid #ddd;
  margin-bottom: 15px;
  padding: 5px;
`

const GroupTitle = styled.h2`
  margin: 0 0 10px 0;
`

const ListItem = styled.div`
  padding: 20px;
  cursor: pointer;
  opacity: ${(props) => (props.dragging ? 0.5 : 1)};
`

const DropZone = styled.div`
  height: 20px;
  background-color: ${(props) => (props.isOver ? '#aaa' : '#eee')};
`

const Item = () => {
  return <ListItem>Item</ListItem>
}

export const AccountManager = () => {
  const crumb = useStore('windows.panel.nav')[0] || {}

  const [draggingItem, setDraggingItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [initialPosition, setInitialPosition] = useState(null)
  const [currentPosition, setCurrentPosition] = useState(null)

  const [isExiting, setIsExiting] = useState(false)

  const wrapRef = useRef(null)
  const active = crumb.view === 'accountManager'

  useEffect(() => {
    if (!active) {
      setIsExiting(true)
    } else {
      setIsExiting(false)
    }
  }, [active])

  const [list, setList] = useState([
    { id: 'i1', type: 'item', content: 'Item 1' },
    { id: 'i2', type: 'item', content: 'Item 2' },
    {
      id: 'g1',
      type: 'group',
      name: 'Group 1',
      items: [
        { id: 'i3', type: 'item', content: 'Item 3' },
        { id: 'i4', type: 'item', content: 'Item 4' }
      ]
    },
    { id: 'g2', type: 'group', name: 'Group 2', items: [] }
  ])

  const handleMouseDown = (e, parentId, index) => {
    setDraggingItem({ parentId, index })
    setInitialPosition(adjustPosition({ x: e.clientX, y: e.clientY }))
    console.log('handleMouseDown', { parentId, index }, adjustPosition({ x: e.clientX, y: e.clientY }))
  }

  const handleMouseUp = () => {
    const { parentId: overParentId, index: overIndex } = dragOverItem || {}

    if (overParentId !== null && overIndex !== null) {
      const newList = JSON.parse(JSON.stringify(list))
      const { parentId: dragParentId, index: dragIndex } = draggingItem

      let removed
      if (dragParentId === null) {
        ;[removed] = newList.splice(dragIndex, 1)
      } else {
        ;[removed] = newList[dragParentId].items.splice(dragIndex, 1)
      }

      if (overParentId === null) {
        newList.splice(overIndex, 0, removed)
      } else {
        if (!newList[overParentId].items) {
          newList[overParentId].items = []
        }
        newList[overParentId].items.splice(overIndex, 0, removed)
      }

      setList(newList)
    }

    setDraggingItem(null)
    setDragOverItem(null)
  }

  const handleMouseOver = (parentId, index) => {
    console.log('mouseOver', parentId, index)
    setDragOverItem({ parentId, index })
  }

  const adjustPosition = (pos) => {
    if (wrapRef.current) {
      console.log('wrapRef.current', wrapRef.current)
      const { x, y } = wrapRef.current.getBoundingClientRect()
      console.log({ x: pos.x - x, y: pos.y - y })
      return { x: e.clientX, y: e.clientY }
    } else {
      return { x: 0, y: 0 }
    }
  }

  return (
    <AccountManagerWrap
      ref={wrapRef}
      active={active}
      onMouseMove={(e) => {
        if (draggingItem) {
          setCurrentPosition(adjustPosition({ x: e.clientX, y: e.clientY }))
        }
      }}
      onMouseUp={handleMouseUp}
    >
      <AccountManagerMain
        active={active}
        isExiting={isExiting}
        // onClick={() => link.send('nav:back', 'panel')}
      >
        <AccountManagerFloat>
          {draggingItem && <FloatingItem pos={currentPosition}>{'flowting item'}</FloatingItem>}
        </AccountManagerFloat>
        <div style={{ padding: '20px' }}>AccountManager</div>
        <Cluster>
          {list.map((item, index) => (
            <ClusterRow key={item.id}>
              {item.type === 'item' ? (
                <ClusterValue
                  onMouseDown={(e) => handleMouseDown(e, null, index)}
                  onMouseOver={() => handleMouseOver(null, index)}
                >
                  <Item>{item.content}</Item>
                </ClusterValue>
              ) : (
                <ClusterValue style={{ width: '100%' }} onMouseOver={() => handleMouseOver(null, index)}>
                  <Cluster>
                    <ClusterRow>
                      <ClusterColumn>
                        <GroupTitle>{item.name}</GroupTitle>
                        {item.items.map((groupItem, groupIndex) => (
                          <ClusterRow key={groupItem.id}>
                            <ClusterValue
                              onMouseDown={() => handleMouseDown(index, groupIndex)}
                              onMouseOver={() => handleMouseOver(index, groupIndex)}
                            >
                              <Item>{groupItem.content}</Item>
                            </ClusterValue>
                          </ClusterRow>
                        ))}
                      </ClusterColumn>
                    </ClusterRow>
                  </Cluster>
                </ClusterValue>
              )}
            </ClusterRow>
          ))}
        </Cluster>
      </AccountManagerMain>
    </AccountManagerWrap>
  )
}

// import React, { useState } from 'react';
// import styled from 'styled-components';

// const App = () => {

//   // const handleMouseLeave = (parentId, index) => {
//   //   if (dragOverItem.parentId === parentId && dragOverItem.index === index) {
//   //     setDragOverItem({ parentId: null, index: null })
//   //   }
//   // }

//   return (

//   )
// }

// export default App
// {
//   /* <DropZone
//         isOver={dragOverItem.parentId === null && dragOverItem.index === list.length}
//         onMouseOver={() => handleMouseOver(null, list.length)}
//         onMouseLeave={() => handleMouseLeave(null, list.length)}
//       /> */
//
