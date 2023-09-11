import { URL } from 'url'
import log from 'electron-log'

import { FrameInstance } from './frameInstances'
import store from '../../store'
import server from '../../dapps/server'
import { createViewInstance } from '../window'

import type { Nav, View } from '../../windows/workspace/types'

interface Extract {
  session: string
  ens: string
}

const extract = (l: string): Extract => {
  const url = new URL(l)
  const session = url.searchParams.get('session') || ''
  const ens = url.port === '8421' ? url.hostname.replace('.localhost', '') || '' : ''
  return { session, ens }
}

export default {
  // Create a view instance on a frame
  create: (frameInstance: FrameInstance, view: View) => {
    const viewInstance = createViewInstance(view.ens)
    const { session } = extract(view.url)

    viewInstance.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
      if (!details || !details.frame) return cb({ cancel: true }) // Reject the request\

      const appUrl = details.frame.url

      if (
        // Initial request for app
        details.resourceType === 'mainFrame' &&
        details.url === view.url &&
        !appUrl
      ) {
        return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
      } else if (
        // devtools:// request
        details.url.startsWith('devtools://')
      ) {
        return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
      } else if (
        // Reqest from app
        appUrl === view.url
      ) {
        const { ens, session } = extract(appUrl)
        if (ens !== view.ens || !server.sessions.verify(ens, session)) {
          return cb({ cancel: true })
        } else {
          details.requestHeaders['Origin'] = view.ens
          return cb({ requestHeaders: details.requestHeaders })
        }
      } else {
        return cb({ cancel: true }) // Reject the request
      }
    })

    const { fullscreen } = store('windows.workspaces', frameInstance.frameId)

    const { width, height } = frameInstance.getBounds()

    frameInstance.addBrowserView(viewInstance)

    const dappBackground = store('main.dapps', view.dappId, 'colors', 'background')
    // if (dappBackground) frameInstance.setBackgroundColor(dappBackground)

    viewInstance.webContents.setVisualZoomLevelLimits(1, 3)

    frameInstance.removeBrowserView(viewInstance)

    // viewInstance.webContents.openDevTools({ mode: 'detach' })

    viewInstance.webContents.session.cookies
      .set({
        url: view.url,
        name: '__frameSession',
        value: session
      })
      .then(
        () => {
          viewInstance.webContents.loadURL(view.url)
        },
        (error) => log.error(error)
      )

    // TODO: Metadata avout a view needs a home in the store
    // viewInstance.webContents.on('did-finish-load', () => {
    //   store.updateFrameView(frameInstance.frameId, view.id, { ready: true })
    // })

    // Keep reference to view on frame instance
    frameInstance.views = { ...(frameInstance.views || {}), [view.id]: viewInstance }
  },
  // Destroy a view instance on a frame
  destroy: (frameInstance: FrameInstance, viewId: string) => {
    const views = frameInstance.views || {}
    const { frameId } = frameInstance

    const workspace = store('windows.workspaces', frameId)
    workspace.nav.forEach((nav: Nav) => {
      nav.views.forEach((view: View) => {
        const { ens, session } = extract(view.url)
        server.sessions.remove(ens, session)
        //TODO: Ensure session is removed for all views
      })
    })

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
      // viewInstance.setBounds({
      //   x: 0,
      //   y: fullscreen ? 0 : 32,
      //   width: width,
      //   height: fullscreen ? height : height - 32
      // })
      viewInstance.setBounds({
        x: 8,
        y: 80 + 24,
        width: width - 16,
        height: height - 80 - 32 - 16
      })
      // viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      // viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}
