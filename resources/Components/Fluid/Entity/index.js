import React, { useEffect, useState, useRef } from 'react'

import { useFluid } from '../FluidProvider'

export const Entity = ({ item, floating, onClick, onOver, children }) => {
  const [grab, setGrab] = useState(false)
  const [moving, setMoving] = useState(false)
  const { dragItem, setDrag, floatingItemPosition, floatActive, setClone, scrollTrigger } = useFluid()

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
  }, [floatingItemPosition.y, scrollTrigger])

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

  const copyComputedStyles = (computedStyle, style) => {
    for (let key of computedStyle) {
      style[key] = computedStyle[key]
    }
  }

  const copyWithStyles = (sourceNode, targetNode) => {
    const computedStyle = window.getComputedStyle(sourceNode)
    copyComputedStyles(computedStyle, targetNode.style)

    // Copy styles for children
    let sourceChildren = sourceNode.children
    let targetChildren = targetNode.children
    for (let i = 0; i < sourceChildren.length; i++) {
      copyWithStyles(sourceChildren[i], targetChildren[i])
    }
  }

  const clone = async (e) => {
    try {
      let clonedNode = ref.current.cloneNode(true)
      // Remove all classes from the cloned node
      clonedNode.className = ''
      // Copy styles recursively
      copyWithStyles(ref.current, clonedNode)
      setClone(clonedNode)
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
