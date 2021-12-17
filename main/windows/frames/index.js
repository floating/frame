// Frames are the windows that run dapps and other functionality
// They are rendered based on the state of `main.frames`

const log = require('electron-log')
const crypto = require('crypto')

import store from '../../store'

import frameInstances from './frameInstances.js'
import viewInstances from './viewInstances'

// Existing window instances for each frame

export default (instances) => {
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
        if (frame.currentView === frameViewId && frame.views[frameViewId].ready) {
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
    manageFrames(frames)
    manageViews(frames)
    // manageOverlays(frames)
  })
}


// Test actions