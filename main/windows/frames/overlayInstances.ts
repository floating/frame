import { URL } from 'url'
import log from 'electron-log'

import { FrameInstance } from './frameInstances'
import store from '../../store'
import server from '../../dapps/server'
import { createViewInstance, createOverlayInstance } from '../window'

import type { Nav, View } from '../workspace/types'

const isDev = process.env.NODE_ENV === 'development'

export default {
  hide: (frameInstance: FrameInstance) => {
    const overlayInstance = frameInstance.overlay
    if (frameInstance && !frameInstance.isDestroyed() && overlayInstance)
      frameInstance.removeBrowserView(overlayInstance)
  },
  show: (frameInstance: FrameInstance) => {
    const overlayInstance = frameInstance.overlay
    if (frameInstance && !frameInstance.isDestroyed() && overlayInstance) {
      frameInstance.addBrowserView(overlayInstance)
      frameInstance.setTopBrowserView(overlayInstance)
    }
  },
  // Create a view instance on a frame
  create: (frameInstance: FrameInstance) => {
    const overlayInstance = createOverlayInstance()
    frameInstance.addBrowserView(overlayInstance)
    overlayInstance.webContents.setVisualZoomLevelLimits(1, 1)

    overlayInstance.webContents.loadURL(
      isDev
        ? 'http://localhost:1234/workspaceDock/index.dev.html'
        : `file://${process.env.BUNDLE_LOCATION}/workspaceDock.html`
    )

    const { width, height } = frameInstance.getBounds()
    overlayInstance.setBounds({
      y: height - 72,
      x: 0,
      width: width,
      height: 72
    })

    return overlayInstance

    // frameInstance.removeBrowserView(viewInstance)
    // viewInstance.webContents.openDevTools({ mode: 'detach' })

    // Keep reference to view on frame instance
    // frameInstance.overlays = { ...(frameInstance.overlays || {}), [overlay.id]: overlayInstance }
  },
  // Destroy a view instance on a frame
  destroy: (frameInstance: FrameInstance, viewId: string) => {
    const views = frameInstance.views || {}
    const { frameId } = frameInstance

    if (frameInstance && !frameInstance.isDestroyed()) frameInstance.removeBrowserView(views[viewId])

    const webcontents = views[viewId].webContents as any
    webcontents.destroy()

    delete views[viewId]
  },
  position: (frameInstance: FrameInstance, viewId: string) => {
    const { frameId } = frameInstance
    const { fullscreen } = store('windows.workspaces', frameId)
    const viewInstance = (frameInstance.views || {})[viewId]

    if (viewInstance) {
      const { width, height } = frameInstance.getBounds()
      viewInstance.setBounds({
        x: 0,
        y: 64,
        width: width,
        height: height - 96
      })
      // viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      // viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}
