// Frames are the windows that run dapps and other functionality
// They are rendered based on the state of `main.frames`

const log = require('electron-log')
const crypto = require('crypto')

const store = require('../../store')

// Existing window instances for each frame
const instances = {}

import frameInstances from './frameInstances'
import viewInstances from './viewInstances'

// Create and destroy frames based on state
const manageFrames = (frames) => {
  const frameIds = Object.keys(frames)
  const instanceIds = Object.keys(instances)

  // For each frame in the store that does not have an instance create one
  frameIds.forEach(frameId => {
    if (!instanceIds.includes(frameId)) frameInstances.create(instances, frames[frameId])
  })

  // For each frame instance that is no longer in the store destory it
  instanceIds.forEach(instanceId => {
    if (!frameIds.includes(instanceId)) frameInstances.destroy(instances, instanceId)
  })
}

// Create, destroy, show, hide views for each frame based on state
const manageViews = (frames) => {
  const frameIds = Object.keys(frames)

  frameIds.forEach(frameId => {
    const frameInstance = instances[frameId]
    if (!frameInstance) return log.error('Instance not found when managing views')

    const frame = frames[frameId]
    const frameViewIds = Object.keys(frame.views)
    const instanceViewIds = Object.keys(frameInstance.views)
  
    instanceViewIds.forEach(instanceViewId => {
      if (!frameViewIds.includes(instanceViewId)) viewInstances.destroy(frameInstance, frameViewId)
    })

    // For each view in the store that belongs to this frame
    frameViewIds.forEach(frameViewId => {
      // Create them
      if (!instanceViewIds.includes(frameViewId)) viewInstances.create(frameInstance, frame.views[frameViewId])
      // Show the correct one
      if (frame.views[frameViewId].show && frame.views[frameViewId].ready) {
        frameInstance.addBrowserView(frameInstance.views[frameViewId])
        viewInstances.position(frameInstance, frameViewId)
      } else {
        frameInstance.removeBrowserView(frameInstance.views[frameViewId])
      }
    })
  })
}

// Dapp Frame Observer
store.observer(() => {
  const frames = store('main.frames')
  console.log('FRAMES FOMR WINDOWS MODULE', JSON.stringify(frames, null, 4))
  manageFrames(frames)
  manageViews(frames)
  // manageOverlays(frames)
})

// Test actions

setInterval(() => {
  const frame = {
    id: crypto.randomBytes(6).toString('hex'),
    views: {}
  }
  store.addFrame(frame)

  const view = {
    id: crypto.randomBytes(6).toString('hex'),
    show: true,
    ready: false,
    url: 'https://app.uniswap.org'
  }
  const view2 = {
    id: crypto.randomBytes(6).toString('hex'),
    show: true,
    ready: false,
    url: 'https://curve.fi'
  }
  const view3 = {
    id: crypto.randomBytes(6).toString('hex'),
    show: true,
    ready: false,
    url: 'https://frame.sh'
  }
  const view4 = {
    id: crypto.randomBytes(6).toString('hex'),
    show: true,
    ready: false,
    url: 'https://app.aave.com'
  }

  setTimeout(() => {
    store.addFrameView(frame.id, view)
  }, 3000)

  setTimeout(() => {
    store.addFrameView(frame.id, view2)
  }, 6000)

  setTimeout(() => {
    store.addFrameView(frame.id, view3)
  }, 9000)

  setTimeout(() => {
    store.addFrameView(frame.id, view4)
  }, 12000)

  setInterval(() => {
    store.removeFrame(frame.id)
  }, 15000)

}, 30 * 1000)
