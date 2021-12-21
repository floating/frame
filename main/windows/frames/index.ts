// Frames are the windows that run dapps and other functionality
// They are rendered based on the state of `main.frames`

import log from 'electron-log'
import store from '../../store'

import frameInstances, { FrameInstance } from './frameInstances.js'
import viewInstances from './viewInstances'

// Existing window instances for each frame

interface MainFrames {
  [id: string]: Frame
}

function getFrames (): MainFrames {
  return store('main.frames')
}

export default (instances: { [id: string]: FrameInstance }) => {
  // Create and destroy frames based on state
  const manageFrames = (frames: MainFrames) => {
    const frameIds = Object.keys(frames)
    const instanceIds = Object.keys(instances)
  
    // For each frame in the store that does not have an instance create one
    frameIds
      .filter(frameId => !instanceIds.includes(frameId))
      .forEach(frameId => frameInstances.create(instances, frames[frameId]))

    // For each frame instance that is no longer in the store destory it
    instanceIds
      .filter(instanceId => !frameIds.includes(instanceId))
      .forEach(instanceId => frameInstances.destroy(instances, instanceId))
  }
  
  // Create, destroy, show, hide views for each frame based on state
  const manageViews = (frames: MainFrames) => {
    const frameIds = Object.keys(frames)
  
    frameIds.forEach(frameId => {
      const frameInstance = instances[frameId]
      if (!frameInstance) return log.error('Instance not found when managing views')
  
      const frame = frames[frameId]
      const frameInstanceViews = frameInstance.views || {}
      const frameViewIds = Object.keys(frame.views)
      const instanceViewIds = Object.keys(frameInstanceViews)
    
      instanceViewIds
        .filter(instanceViewId => !frameViewIds.includes(instanceViewId))
        .forEach(instanceViewId => viewInstances.destroy(frameInstance, instanceViewId))
  
      // For each view in the store that belongs to this frame
      frameViewIds.forEach(frameViewId => {
        const viewData = frame.views[frameViewId] || {}
        const viewInstance = frameInstanceViews[frameViewId] || {}

        // Create them
        if (!instanceViewIds.includes(frameViewId)) viewInstances.create(frameInstance, viewData)
        
        // Show the correct one
        if (frame.currentView === frameViewId && viewData.ready) {
          frameInstance.addBrowserView(viewInstance)
          viewInstances.position(frameInstance, frameViewId)
        } else {
          frameInstance.removeBrowserView(viewInstance)
        }
      })
    })
  }
  
  // Dapp Frame Observer
  store.observer(() => {
    const frames = getFrames()

    manageFrames(frames)
    manageViews(frames)
    // manageOverlays(frames)
  })
}


// Test actions