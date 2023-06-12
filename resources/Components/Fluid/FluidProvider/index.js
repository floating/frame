import React, { createContext, useState, useContext, useRef } from 'react'
import styled, { css } from 'styled-components'
import { FloatingItem } from '../FluidFloating'

export const FluidWrap = styled.div`
  ${(props) => {
    return (
      props.grabbing &&
      css`
        cursor: grabbing !important;
        * {
          cursor: grabbing !important;
        }
      `
    )
  }};
`

const FluidContext = createContext()

// Fluid Dragging
// Any item wrapped in this can register itself as draggable
// Anything that is draggable is an entity
// Enties can be dragged in relation to other entities of the same type
// Entities define valid drop types
// when an entity is dropped the item is is dropped on is notified
// it is up to the item being dropped on to decide what to do with the item
// a group accepting and item may decide to move the item inside of it
// the entity will also arrive with a position array relative to the item it was dropped on
// depending on what the entity wants to do it can see what the most valid position is

// Provider Component
let lastMovePosition = {}
let direction = 'down'

export const Fluid = ({ children }) => {
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

  // Set Clone
  const [clone, setClone] = useState(null)

  // Set Float Active
  const [floatActive, setFloatActive] = useState(null)

  // Track when Fluid is scrolling
  const [scrollTrigger, _setScrollTrigger] = React.useState(null)

  // TODO make this more comprehensive based on scroll direction to set over trigger
  const setScrollTrigger = (value) => {
    if (!floatActive) return
    _setScrollTrigger(value)
  }

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

  // const setDraggingOverItem = (overItem, location, itemOverEmptyGroup) => {
  //   if (!dragItem || dragItem.id === overItem.id) return
  //   setDragOver({ overItem, location })
  //   setState((currentState) => {
  //     let newState = currentState
  //     if (itemOverEmptyGroup) {
  //       newState = insertItemInGroup(newState, dragItem.id, overItem.id, location)
  //     } else if (dragItem.id && overItem.id) {
  //       newState = moveItem(newState, dragItem.id, overItem.id, location)
  //     }
  //     return newState
  //   })
  // }

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
    setDragItem(null)
    setDragInitialMousePosition(null)
    setDragCurrentMousePosition(null)
    setDragInitialItemPosition(null)
    setDragItemBounds(null)
    setFloatActive(false)
  }

  return (
    <FluidContext.Provider
      value={{
        dragItem,
        setDrag,
        unsetDrag,
        floatingItemPosition,
        movePosition,
        dragInitialMousePosition,
        setDragCurrentMousePosition,
        dragItemBounds,
        floatActive,
        setFloatActive,
        clone,
        setClone,
        scrollTrigger,
        setScrollTrigger
      }}
    >
      <FluidWrap
        grabbing={floatActive}
        onMouseMove={(e) => {
          if (dragItem && dragInitialMousePosition) {
            const newPosX = e.clientX
            const newPosY = e.clientY
            const dx = Math.abs(newPosX - dragInitialMousePosition.x)
            const dy = Math.abs(newPosY - dragInitialMousePosition.y)
            if (floatActive || dx >= 5 || dy >= 5) {
              setDragCurrentMousePosition({ x: newPosX, y: newPosY })
              setFloatActive(true)
            }
          }
        }}
        onMouseUp={(e) => {
          unsetDrag()
        }}
      >
        <FloatingItem />
        {children}
      </FluidWrap>
    </FluidContext.Provider>
  )
}

// useFluid Hook
export const useFluid = () => useContext(FluidContext)
