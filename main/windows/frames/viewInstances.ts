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

    if (!viewInstance) return

    // const animationSpeed = 8 // Pixels per frame

    // let intervalId: any // To keep a reference to the interval so we can clear it

    // function animateToBounds(targetBounds: { x: number; y: number; width: number; height: number }) {
    //   // Function to animate the position and size
    //   const animatePosition = () => {
    //     const currentBounds = viewInstance.getBounds()

    //     const deltaX = Math.sign(targetBounds.x - currentBounds.x) * animationSpeed
    //     const deltaY = Math.sign(targetBounds.y - currentBounds.y) * animationSpeed
    //     const deltaWidth = Math.sign(targetBounds.width - currentBounds.width) * animationSpeed
    //     const deltaHeight = Math.sign(targetBounds.height - currentBounds.height) * animationSpeed

    //     const newX = currentBounds.x + deltaX
    //     const newY = currentBounds.y + deltaY
    //     const newWidth = currentBounds.width + deltaWidth
    //     const newHeight = currentBounds.height + deltaHeight

    //     viewInstance.setBounds({
    //       x: newX,
    //       y: newY,
    //       width: currentBounds.width,
    //       height: currentBounds.height
    //     })
    //     // setTimeout(() => {
    //     //   viewInstance.setBounds({
    //     //     x: newX,
    //     //     y: newY,
    //     //     width: newWidth,
    //     //     height: newHeight
    //     //   })
    //     // }, 0)

    //     // Check if we're close enough to the target to finalize the move
    //     if (
    //       Math.abs(targetBounds.x - newX) <= animationSpeed &&
    //       Math.abs(targetBounds.y - newY) <= animationSpeed // &&
    //       // Math.abs(targetBounds.width - newWidth) <= animationSpeed &&
    //       // Math.abs(targetBounds.height - newHeight) <= animationSpeed
    //     ) {
    //       clearInterval(intervalId)
    //       viewInstance.setBounds(targetBounds) // Set the final bounds to ensure precision
    //     }
    //   }

    //   // Start the position animation
    //   intervalId = setInterval(animatePosition, 8)
    // }

    // let testInterval: any
    // let count = 0
    // testInterval = setInterval(function () {
    //   if (!frameInstance) return clearInterval(testInterval)
    //   count++
    //   if (count % 3 === 0) {
    //     const { x, y, width, height } = frameInstance.getBounds()
    //     animateToBounds({
    //       y: 16,
    //       x: 4,
    //       width: width - 4 - 4,
    //       height: height - 16 - 16
    //     })
    //   } else if (count % 2 === 0) {
    //     const { x, y, width, height } = frameInstance.getBounds()
    //     animateToBounds({
    //       y: 16 - 64,
    //       x: 4,
    //       width: width - 4 - 4,
    //       height: height - 16 - 16
    //     })
    //   } else {
    //     const { width, height } = frameInstance.getBounds()
    //     animateToBounds({
    //       y: 64,
    //       x: 4,
    //       width: width - 4 - 4,
    //       height: height - 16 - 16
    //     })
    //   }
    // }, 5000)

    // TODO: Add this back to enforce ens origin and make sure requests are coming from the app
    // viewInstance.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
    //   if (!details || !details.frame) return cb({ cancel: true }) // Reject the request\

    //   const appUrl = details.frame.url

    //   if (
    //     // Initial request for app
    //     details.resourceType === 'mainFrame' &&
    //     details.url === view.url &&
    //     !appUrl
    //   ) {
    //     return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
    //   } else if (
    //     // devtools:// request
    //     details.url.startsWith('devtools://')
    //   ) {
    //     return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
    //   } else if (
    //     // Reqest from app
    //     appUrl === view.url
    //   ) {
    //     const { ens, session } = extract(appUrl)
    //     if (ens !== view.ens || !server.sessions.verify(ens, session)) {
    //       return cb({ cancel: true })
    //     } else {
    //       details.requestHeaders['Origin'] = view.ens
    //       return cb({ requestHeaders: details.requestHeaders })
    //     }
    //   } else {
    //     return cb({ cancel: true }) // Reject the request
    //   }
    // })

    const { fullscreen } = store('windows.workspaces', frameInstance.frameId)

    const { width, height } = frameInstance.getBounds()

    frameInstance.addBrowserView(viewInstance)

    const dappBackground = store('main.dapps', view.dappId, 'colors', 'background')
    // if (dappBackground) frameInstance.setBackgroundColor(dappBackground)

    viewInstance.webContents.setVisualZoomLevelLimits(1, 3)

    frameInstance.removeBrowserView(viewInstance)

    // viewInstance.webContents.openDevTools({ mode: 'detach' })

    const testDapps = [
      'https://app.aave.com',
      'https://app.uniswap.org/swap',
      'https://curve.fi/#/ethereum/swap',
      'https://app.ens.domains',
      'https://swap.cow.fi/#/1/swap/ETH',
      'https://app.safe.global'
    ]

    viewInstance.webContents.session.cookies
      .set({
        url: view.url,
        name: '__frameSession',
        value: session
      })
      .then(
        () => {
          viewInstance.webContents.loadURL(testDapps[Math.round(Math.random() * 5)]) // view.url
        },
        (error) => log.error(error)
      )

    // TODO: Metadata avout a view needs a home in the store
    viewInstance.webContents.on('did-finish-load', () => {})

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
      viewInstance.setBounds({
        y: 56,
        x: 4,
        width: width - 4 - 4,
        height: height - 128 - 16
      })
    }
  }
}
