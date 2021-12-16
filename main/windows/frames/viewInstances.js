import { BrowserView }  from 'electron'

import webPrefrences from './webPrefrences'

const store = require('../../store')

export default {
  // Create a view instance on a frame
  create: (frameInstance, view) => {
    const viewInstance = new BrowserView({ webPrefrences })
  
    frameInstance.addBrowserView(viewInstance)
    viewInstance.setBackgroundColor('#0fff')

    const { width, height } = frameInstance.getBounds()
    viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
    viewInstance.setAutoResize({ width: true, height: true })
  
    viewInstance.webContents.loadURL(view.url)
    viewInstance.webContents.setVisualZoomLevelLimits(1, 3)
  
    frameInstance.removeBrowserView(viewInstance)

    viewInstance.webContents.on('did-finish-load', () => {
      const show = store('main.frames', frameInstance.frameId, 'views', view.id, 'show')
      if (show) frameInstance.addBrowserView(viewInstance)
      store.updateFrameView(frameInstance.frameId, view.id, { ready: true })
    })
  
    // Keep reference to view on frame instance
    frameInstance.views[view.id] = viewInstance
  },
  // Destroy a view instance on a frame
  destroy: (frameInstance, view) => {
    frameInstance.removeBrowserView(frameInstance.views[view.id])
    frameInstance.views[view.id].destory()
    delete frameInstance.views[view.id]
  },
  position: (frameInstance, viewId) => {
    const viewInstance = frameInstance.views[viewId]
    if (viewInstance) {
      const { width, height } = frameInstance.getBounds()
      viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}
