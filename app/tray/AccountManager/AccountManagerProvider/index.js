import React, { createContext, useState, useContext, useRef } from 'react'

import useStore from '../../../../resources/hooks/useStore'

import { moveItem, insertItemInGroup } from '../organize'

const AccountManagerContext = createContext()

const initialState = [
  {
    id: 'g1',
    type: 'group',
    name: 'Primary Accounts',
    items: [
      { id: 'i3', type: 'item', content: 'Item 3' },
      { id: 'i4', type: 'item', content: 'Item 4' }
    ]
  },
  {
    id: 'g2',
    type: 'group',
    name: 'Hidden Accounts',
    items: [
      { id: 'i126', type: 'item', name: '', content: 'Item 13' },
      { id: 'i124', type: 'item', name: '', content: 'Item 24' }
    ]
  },
  {
    id: 'g3',
    type: 'group',
    name: 'Other Accounts',
    items: [
      { id: 'i6', type: 'item', content: 'Item 6' },
      { id: 'i7', type: 'item', content: 'Item 7' },
      { id: 'i001', type: 'item', content: 'Item 001' },
      { id: 'i003', type: 'item', content: 'Item 003' }
    ]
  },

  {
    id: 'g4',
    type: 'group',
    name: 'Testnet Accounts',
    items: [
      { id: 'i123', type: 'item', content: 'Item 123' },
      { id: 'i1234', type: 'item', content: 'Item 1234' }
    ]
  }
]

// Provider Component
let lastMovePosition = {}
let direction = 'down'

export const AccountManagerProvider = ({ children }) => {
  const crumb = useStore('windows.panel.nav')[0] || {}

  // Set Item Details
  const [dragItem, setDragItem] = useState(null)

  // Set Initial Position of Dragging Mouse
  const [dragInitialMousePosition, setDragInitialMousePosition] = useState(null)

  // Set Current Position of Dragging Mouse
  const [dragCurrentMousePosition, setDragCurrentMousePosition] = useState(null)

  // Set Initial Position of Dragging Item
  const [dragInitialItemPosition, setDragInitialItemPosition] = useState(null)

  // Set Bounds of Dragging Item
  const [dragItemBounds, setDragItemBounds] = useState(null)

  // Set Anchor style Dragging Item
  const [anchorStyle, setAnchorStyle] = useState(null)

  // Set Drag Over
  const [dragOver, setDragOver] = useState(null)

  // Set Unsetting
  const [unsetting, setUnsetting] = useState(false)

  const [state, setState] = useState(initialState) // initial state for your list

  const movePosition =
    dragInitialMousePosition && dragCurrentMousePosition
      ? {
          x: dragCurrentMousePosition.x - dragInitialMousePosition.x,
          y: dragCurrentMousePosition.y - dragInitialMousePosition.y
        }
      : { x: 0, y: 0 }

  if (lastMovePosition.y !== movePosition.y) {
    direction = lastMovePosition.y > movePosition.y ? 'up' : 'down'
  }

  lastMovePosition = movePosition

  // Uses the top or bottom edge of the item to determine poition, depding on direction
  const floatingItemPosition =
    dragInitialItemPosition && movePosition
      ? {
          x: dragInitialItemPosition.x + movePosition.x,
          y:
            direction === 'down'
              ? dragInitialItemPosition.y + movePosition.y + dragItemBounds.height / 2
              : dragInitialItemPosition.y + movePosition.y - dragItemBounds.height / 2
        }
      : { x: 0, y: 0 }

  const setDraggingOverItem = (overItem, location, itemOverEmptyGroup) => {
    if (!dragItem || dragItem.id === overItem.id) return
    setDragOver({ overItem, location })
    setState((currentState) => {
      let newState = currentState
      if (itemOverEmptyGroup) {
        newState = insertItemInGroup(newState, dragItem.id, overItem.id, location)
      } else if (dragItem.id && overItem.id) {
        newState = moveItem(newState, dragItem.id, overItem.id, location)
      }
      return newState
    })
  }

  const setDrag = (item, boundingRect, initialPosition) => {
    setDragItem(item)
    setDragInitialMousePosition(initialPosition)
    setDragCurrentMousePosition(initialPosition)
    setDragInitialItemPosition({
      x: boundingRect.left + boundingRect.width / 2,
      y: boundingRect.top + boundingRect.height / 2
    })
    setDragItemBounds(boundingRect)
  }

  const unsetDrag = () => {
    setUnsetting(true)
    setTimeout(() => {
      setDragItem(null)
      setDragInitialMousePosition(null)
      setDragCurrentMousePosition(null)
      setDragInitialItemPosition(null)
      setDragItemBounds(null)
      setDragOver(null)
      setAnchorStyle(null)
      setUnsetting(false)
    }, 50)
  }

  const active = crumb.view === 'accountManager'

  // Provide the state and updater functions
  return (
    <AccountManagerContext.Provider
      value={{
        dragItem,
        setDrag,
        unsetDrag,
        setDraggingOverItem,
        floatingItemPosition,
        movePosition,
        active,
        state,
        setDragCurrentMousePosition,
        dragItemBounds,
        dragOver,
        anchorStyle,
        setAnchorStyle,
        unsetting
      }}
    >
      {children}
    </AccountManagerContext.Provider>
  )
}

// useAccountManager Hook
export const useAccountManager = () => useContext(AccountManagerContext)
