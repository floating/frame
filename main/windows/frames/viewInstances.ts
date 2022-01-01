import { BrowserView }  from 'electron'
import path from 'path'
import { URL } from 'url'

import { FrameInstance } from './frameInstances'

import store from '../../store'
import webPreferences from '../webPreferences'

import server from '../../dapps/server'

export default {
  // Create a view instance on a frame
  create: (frameInstance: FrameInstance, view: ViewMetadata) => {
    const viewInstance = new BrowserView({ 
      webPreferences: Object.assign({ 
        preload: path.resolve('./main/windows/viewPreload.js') ,
        partition: 'persist:' + view.ens
      }, webPreferences)
    })
  
    viewInstance.webContents.on('will-navigate', e => e.preventDefault())
    viewInstance.webContents.on('will-attach-webview', e => e.preventDefault())
    viewInstance.webContents.on('new-window', e => e.preventDefault())

    viewInstance.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
      if (!details || !details.frame) return cb({ cancel: true }) // Reject the request

      // Initial request for app
      if (details.resourceType === 'mainFrame' && details.url === view.url) {
        return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
      }

      const currentURL = details.frame.url
      if (currentURL !== view.url) return cb({ cancel: true }) // Reject the request

      // Parse the requesting url to get ens name and session
      const url = new URL(currentURL)
      const session = url.searchParams.get('session')
      const ens = url.hostname.replace('.localhost', '')

      // Check that parsed ens name is the same as the ens name used to create this view
      if (!ens || !session || ens !== view.ens) return cb({ cancel: true }) // Reject the request

      // Check that the parsed ens name has a valid session
      if (!server.sessions.verify(ens, session)) return cb({ cancel: true }) // Reject the request

      // Set the origin of this request as the views ens name
      details.requestHeaders['Origin'] = view.ens

      // Return updated headers 
      return cb({ requestHeaders: details.requestHeaders })
    })

    frameInstance.addBrowserView(viewInstance)
    // viewInstance.setBackgroundColor('#0fff')

    viewInstance.setAutoResize({ width: true, height: true })
  
    viewInstance.webContents.loadURL(view.url)
    viewInstance.webContents.setVisualZoomLevelLimits(1, 3)
  
    frameInstance.removeBrowserView(viewInstance)

    // viewInstance.webContents.openDevTools({ mode: 'detach' })

    viewInstance.webContents.on('did-finish-load', () => {
      store.updateFrameView(frameInstance.frameId, view.id, { ready: true })
    })
  
    // Keep reference to view on frame instance
    frameInstance.views = { ...(frameInstance.views || {}), [view.id]: viewInstance }
  },
  // Destroy a view instance on a frame
  destroy: (frameInstance: FrameInstance, viewId: string) => {
    const views = frameInstance.views || {}

    frameInstance.removeBrowserView(views[viewId])

    const webcontents = (views[viewId].webContents as any)
    webcontents.destroy()

    delete views[viewId]
  },
  position: (frameInstance: FrameInstance, viewId: string) => {
    const viewInstance = (frameInstance.views || {})[viewId]
    if (viewInstance) {
      const { width, height } = frameInstance.getBounds()
      viewInstance.setBounds({ x: 0, y: 32, width: width, height: height - 32 })
      // viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}
