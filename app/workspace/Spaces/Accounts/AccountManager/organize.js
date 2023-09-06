const findRoute = (data, id, route = []) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].id === id) return [...route, i]
    if (data[i].type === 'group') {
      const found = findRoute(data[i].items, id, [...route, i])
      if (found) return found
    }
  }
  return null
}

const removeByRoute = (data, route) => {
  if (route.length === 1) {
    return data.splice(route[0], 1)[0] // Remove and return the item
  } else {
    // Continue down the path
    return removeByRoute(data[route[0]].items, route.slice(1))
  }
}

const addByRoute = (data, route, item, position) => {
  const index = route[route.length - 1]

  // If the route has more than one element, it means the target item is inside a group
  if (route.length > 1) {
    const target = route[0]
    const targetGroup = data[target]
    const remainingRoute = route.slice(1)

    if (!targetGroup.items) {
      console.error('Group has no items')
    }

    addByRoute(targetGroup.items, remainingRoute, item, position)

    // Insert the item at the correct position inside the target group
    // if (position === 'top' || position === 'left') {
    //   targetGroup.items.splice(index, 0, item)
    // } else {
    //   targetGroup.items.splice(index + 1, 0, item)
    // }
  } else {
    // If the route has only one element, the target item is at the top level
    if (position === 'top' || position === 'left') {
      data.splice(index, 0, item)
    } else {
      data.splice(index + 1, 0, item)
    }
  }
}

const insertByGroupRoute = (data, route, item, position) => {
  // const index = route[route.length - 1]

  // If the route has more than one element, it means the target item is inside a group
  if (route.length > 1) {
    const target = route[0]
    const targetGroup = data[target]
    const remainingRoute = route.slice(1)

    if (!targetGroup.items) {
      console.error('something went wrong, group has no items')
    }

    insertByGroupRoute(targetGroup.items, remainingRoute, item, position)
  } else {
    const target = route[0]
    const targetGroup = data[target]
    targetGroup.items.push(item)
    // If the route has only one element, the target item is at the top level
    // if (position === 'top' || position === 'left') {
    //   data.splice(index, 0, item)
    // } else {
    //   data.splice(index + 1, 0, item)
    // }
  }
}

export const moveItem = (data, id, targetId, position) => {
  const route = findRoute(data, id)
  if (!route) {
    console.error(`Could not find item with id ${id}`)
    return data
  }

  // Creating a deep copy of the data
  const tempData = JSON.parse(JSON.stringify(data))

  const item = removeByRoute(tempData, route)

  const targetRoute = findRoute(tempData, targetId)

  if (!targetRoute) {
    console.error(`Could not find target item with id ${targetId}`)
    return data
  }

  // Check if the target item is within the group we're trying to move
  const targetWithinItemRoute = findRoute(item.items || [], targetId)
  if (targetWithinItemRoute) {
    console.error(`Cannot move a group next to an item within the group`)
    return data
  }

  addByRoute(tempData, targetRoute, item, position)

  // Returning the modified data if everything went successful
  return tempData
}

export const insertItemInGroup = (data, id, targetId, position) => {
  const route = findRoute(data, id)
  if (!route) {
    console.error(`Could not find item with id ${id}`)
    return data
  }

  // Creating a deep copy of the data
  const tempData = JSON.parse(JSON.stringify(data))

  const item = removeByRoute(tempData, route)

  const targetRoute = findRoute(tempData, targetId)

  if (!targetRoute) {
    console.error(`Could not find target item with id ${targetId}`)
    return data
  }

  // Check if the target item is within the group we're trying to move
  const targetWithinItemRoute = findRoute(item.items || [], targetId)
  if (targetWithinItemRoute) {
    console.error(`Cannot move a group next to an item within the group`)
    return data
  }

  insertByGroupRoute(tempData, targetRoute, item, position)

  // Returning the modified data if everything went successful
  return tempData
}
