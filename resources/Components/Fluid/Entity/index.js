import React, { useEffect, useState, useRef } from 'react'

import { useFluid } from '../FluidProvider'

export const Entity = ({ item, floating, onClick, onOver, children }) => {
  const [grab, setGrab] = useState(false)
  const [moving, setMoving] = useState(false)
  const { dragItem, setDrag, floatingItemPosition, floatActive, setClone } = useFluid()

  const ref = useRef(null)

  useEffect(() => {
    if (!dragItem || !ref || !ref.current) return
    const itemOverEmptyGroup = item.type === 'group' && dragItem.type === 'item' && item.items.length === 0
    if (item.type !== dragItem.type && !itemOverEmptyGroup) return
    const boundingRect = ref.current.getBoundingClientRect()
    if (item.id === dragItem.id) {
      // clone() // TODO: remove this once reclone is implemented
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
        const reClone = onOver && onOver(dragItem, position)
        // if (reclone) clone the dragging entity again
      }
    }
  }, [floatingItemPosition.y])

  const hide = dragItem && dragItem.id === item.id && !floating && floatActive

  let style = {}

  if ((dragItem && dragItem.type !== item.type) || floating) {
    Object.assign(style, { pointerEvents: 'none' })
  }
  if (hide) {
    Object.assign(style, { opacity: 0.3, pointerEvents: 'none' })
  }

  const onMouseUp = (e) => {
    if (!moving && !floating && dragItem?.id === item.id) {
      if (Math.abs(e.clientX - grab.x) < 10 && Math.abs(e.clientY - grab.y) < 10) {
        if (onClick) onClick()
      }
    }
    setGrab(false)
    setMoving(false)
  }

  function copyWithStyles(sourceNode, top = false) {
    // Create a clone of the source node
    let clonedNode = sourceNode.cloneNode(true)

    // Copy the computed styles of the source node to the clone
    copyComputedStyles(window.getComputedStyle(sourceNode), clonedNode.style, top)

    // Do the same for all children
    let sourceChildren = sourceNode.children
    let clonedChildren = clonedNode.children
    for (let i = 0; i < sourceChildren.length; i++) {
      copyWithStyles(sourceChildren[i], clonedChildren[i])
    }

    return clonedNode
  }

  function copyComputedStyles(computedStyle, style, top) {
    for (let key of computedStyle) {
      style[key] = computedStyle[key]
    }

    if (top) {
      style.opacity = '1'
    }
  }

  const clone = async (e) => {
    try {
      setClone(copyWithStyles(ref.current, true))
    } catch (e) {
      console.error(e)
    }
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setGrab({ x: e.clientX, y: e.clientY })
    const boundingRect = ref.current.getBoundingClientRect()
    const initialPosition = { x: e.clientX, y: e.clientY }
    setDrag(item, boundingRect, initialPosition)
    clone()
  }

  return React.cloneElement(children, {
    ref: ref,
    style: style,
    onMouseDown: onMouseDown,
    onMouseUp: onMouseUp
  })
}
