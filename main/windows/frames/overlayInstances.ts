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
    const overlayInstance = frameInstance?.overlays?.dock
    if (frameInstance && !frameInstance.isDestroyed() && overlayInstance)
      frameInstance.removeBrowserView(overlayInstance)
  },
  show: (frameInstance: FrameInstance) => {
    const overlayInstance = frameInstance?.overlays?.dock
    if (frameInstance && !frameInstance.isDestroyed() && overlayInstance) {
      frameInstance.addBrowserView(overlayInstance)
      frameInstance.setTopBrowserView(overlayInstance)
    }
  },
  // Create a view instance on a frame
  create: (frameInstance: FrameInstance) => {
    const ribbonInstance = createOverlayInstance()
    frameInstance.addBrowserView(ribbonInstance)
    ribbonInstance.webContents.setVisualZoomLevelLimits(1, 1)
    ribbonInstance.webContents.loadURL(
      isDev
        ? 'http://localhost:1234/workspaceRibbon/index.dev.html'
        : `file://${process.env.BUNDLE_LOCATION}/workspaceRibbon.html`
    )

    // ribbonInstance.webContents.openDevTools({ mode: 'detach' })

    const dockInstance = createOverlayInstance()
    frameInstance.addBrowserView(dockInstance)
    dockInstance.webContents.setVisualZoomLevelLimits(1, 1)
    dockInstance.webContents.loadURL(
      isDev
        ? 'http://localhost:1234/workspaceDock/index.dev.html'
        : `file://${process.env.BUNDLE_LOCATION}/workspaceDock.html`
    )

    // Keep reference to overlays on frame instance
    return { dock: dockInstance, ribbon: ribbonInstance }
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
        y: 42,
        x: 4,
        width: width - 4 - 4,
        height: height - 42 - 16
      })
      // viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      // viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}
