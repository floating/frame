// Workspaces are rendered based on the state of `windows.workspaces`
// A workspace is a full-sized native window that behaves like a normal app window
// Each workspace has a nav stack and each nav item fully describes the state of the workspace
// A view is a browser view attached to a workspace, views can only run installed dapps
// Workspace and View instances are created based solely on state
// When Workspace and View instances are created, they update their status in the store within `workspacesMeta`

import { app, Menu, MenuItemConstructorOptions } from 'electron'

import log from 'electron-log'
import store from '../../store'

import frameInstances, { FrameInstance } from './frameInstances.js'
import viewInstances from './viewInstances'
import overlayInstances from './overlayInstances'

import { Workspace, Nav, View } from '../workspace/types'

function getFrames(): Record<string, Workspace> {
  return store('windows.workspaces') || {}
}

// const showMenu = () => {
//   const template: MenuItemConstructorOptions[] = [
//     {
//       label: 'File',
//       submenu: [{ role: 'quit' }]
//     }
//   ]

//   const menu = Menu.buildFromTemplate(template)
//   Menu.setApplicationMenu(menu)
// }

// const hideMenu = () => {
//   Menu.setApplicationMenu(null) // Removes the application menu
// }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default class WorkspaceManager {
  private frameInstances: Record<string, FrameInstance> = {}

  start() {
    store.observer(() => {
      const inFocus = store('main.focusedFrame')
      const frames = getFrames()
      this.manageFrames(frames, inFocus)
      this.manageViews(frames)
      this.manageOverlays(frames)
    })
  }

  manageOverlays(frames: Record<string, Workspace>) {
    const frameIds = Object.keys(frames)

    frameIds.forEach((frameId) => {
      const frameInstance = this.frameInstances[frameId]
      if (!frameInstance) return log.error('Instance not found when managing views')

      // Frame definition in the state
      const frame = frames[frameId]

      // Current Nav
      const currentNav = frame?.nav[0]

      if (!frameInstance.overlay) {
        frameInstance.overlay = overlayInstances.create(frameInstance)
      }
      const { width, height } = frameInstance.getBounds()
      if (currentNav?.space === 'dapp' && currentNav?.data.hidden === true) {
        frameInstance.overlay.setBounds({
          y: height - 13,
          x: 0,
          width: width,
          height: 13
        })
      } else {
        frameInstance.overlay.setBounds({
          y: height - 96,
          x: 0,
          width: width,
          height: 96
        })
      }

      // We could track this on the instance to add it only when necessary
      frameInstance.addBrowserView(frameInstance.overlay)
      frameInstance.setTopBrowserView(frameInstance.overlay)
    })
  }

  manageFrames(frames: Record<string, Workspace>, inFocus: string) {
    const frameIds = Object.keys(frames)
    const instanceIds = Object.keys(this.frameInstances)

    // create an instance for each new frame in the store
    frameIds
      .filter((frameId) => !instanceIds.includes(frameId))
      .forEach((frameId) => {
        const frameInstance = frameInstances.create(frames[frameId])

        this.frameInstances[frameId] = frameInstance

        frameInstance.on('closed', () => {
          this.removeFrameInstance(frameId)
          store.removeWorkspace(frameId)
        })

        frameInstance.on('maximize', () => {
          store.updateFrame(frameId, { maximized: true })
        })

        frameInstance.on('unmaximize', () => {
          store.updateFrame(frameId, { maximized: false })
        })

        frameInstance.on('enter-full-screen', () => {
          store.updateFrame(frameId, { fullscreen: true })
        })

        frameInstance.on('leave-full-screen', () => {
          const platform = store('platform')
          // Handle broken linux window events
          if (platform !== 'win32' && platform !== 'darwin' && !frameInstance.isFullScreen()) {
            if (frameInstance.isMaximized()) {
              // Trigger views to reposition
              setTimeout(() => {
                const frame = frames[frameId]
                const currentNav = frame.nav[0]
                if (currentNav.views[0].id) viewInstances.position(frameInstance, currentNav.views[0].id)
              }, 100)
              store.updateFrame(frameId, { maximized: true })
            } else {
              store.updateFrame(frameId, { maximized: false })
            }
          } else {
            store.updateFrame(frameId, { fullscreen: false })
          }
        })

        frameInstance.on('focus', () => {
          // Give focus to current view
          const frame = frames[frameId]
          const currentNav = frame.nav[0]
          const currentView = currentNav?.views[0]?.id
          if (currentView && frameInstance) {
            frameInstance.views = frameInstance.views || {}
            frameInstance.views[currentView]?.webContents?.focus()
          }
          store.updateFrame(frameId, { focused: true })
        })

        frameInstance.on('blur', () => {
          store.updateFrame(frameId, { focused: false })
        })
      })

    // destroy each frame instance that is no longer in the store
    instanceIds
      .filter((instanceId) => !frameIds.includes(instanceId))
      .forEach((instanceId) => {
        this.removeFrameInstance(instanceId)

        // if (frameInstance) {
        //   frameInstance.destroy()
        // }
      })

    if (inFocus) {
      const focusedFrame = this.frameInstances[inFocus] || { isFocused: () => true }

      if (!focusedFrame.isFocused()) {
        focusedFrame.show()
        focusedFrame.focus()
      }
    }
  }

  manageViews(frames: Record<string, Workspace>) {
    const frameIds = Object.keys(frames)

    frameIds.forEach((frameId) => {
      const frameInstance = this.frameInstances[frameId]
      if (!frameInstance) return log.error('Instance not found when managing views')

      // Frame definition in the state
      const frame = frames[frameId]

      // Current Nav
      const currentNav = frame?.nav[0]
      const currentNavViewIds = currentNav?.views?.map((view) => view.id) || []

      // Get all views from the nav
      const frameViewIds = frame.nav.flatMap((nav) => nav.views.map((view) => view.id))
      const frameInstanceViews = frameInstance.views || {}
      const instanceViewIds = Object.keys(frameInstanceViews)

      // For any instance views that are no longer in the nav anywhere, destroy them
      instanceViewIds
        .filter((instanceViewId) => !frameViewIds.includes(instanceViewId))
        .forEach((instanceViewId) => viewInstances.destroy(frameInstance, instanceViewId))

      // For each view in the current nav
      currentNav?.views?.forEach((view) => {
        if (view.id) {
          // Create if needed
          if (!instanceViewIds.includes(view.id)) viewInstances.create(frameInstance, view)
          // Get the view instance
          const viewInstance = frameInstance?.views && frameInstance?.views[view.id]
          if (!viewInstance) return log.error('View instance not found when managing views')

          // Get view stats
          const viewMeta = { ready: true } // TODO: store('workspacesMeta', frame.id, 'views', view.id)
          // Show all in the current nav
          if (viewMeta.ready && currentNavViewIds.includes(view.id)) {
            frameInstance.addBrowserView(viewInstance)
            viewInstances.position(frameInstance, view.id)
            setTimeout(() => {
              if (frameInstance.isFocused()) viewInstance.webContents.focus()
            }, 100)
          } else {
            frameInstance.removeBrowserView(viewInstance)
          }
        }
      })

      instanceViewIds.forEach((instanceViewId) => {
        if (!currentNavViewIds.includes(instanceViewId)) {
          const viewInstance = frameInstance?.views && frameInstance?.views[instanceViewId]
          if (viewInstance) frameInstance.removeBrowserView(viewInstance)
        }
      })
    })
  }

  removeFrameInstance(frameId: string) {
    const frameInstance = this.frameInstances[frameId]

    Object.keys(frameInstance.views || {}).forEach((viewId) => {
      viewInstances.destroy(frameInstance, viewId)
    })

    delete this.frameInstances[frameId]

    if (frameInstance) {
      frameInstance.removeAllListeners('closed')
      frameInstance.destroy()
    }

    if (Object.keys(this.frameInstances).length === 0) {
      app.dock.hide()
    }
  }

  private sendMessageToFrame(frameId: string, channel: string, ...args: any) {
    const frameInstance = this.frameInstances[frameId]

    if (frameInstance && !frameInstance.isDestroyed()) {
      const webContents = frameInstance.webContents
      if (webContents) webContents.send(channel, ...args)
      const overlayWebContents = frameInstance.overlay?.webContents
      if (overlayWebContents) overlayWebContents.send(channel, ...args)
    } else {
      log.error(
        new Error(
          `Tried to send a message to frame with id ${frameId} but it does not exist or has been destroyed`
        )
      )
    }
  }

  broadcast(channel: string, args: any[]) {
    Object.keys(this.frameInstances).forEach((id) => this.sendMessageToFrame(id, channel, ...args))
  }

  reloadFrames() {
    Object.keys(this.frameInstances).forEach((win) => {
      this.frameInstances[win].webContents.reload()
    })
  }

  refocus(id: string) {
    const frameInstance = this.frameInstances[id]
    if (frameInstance) {
      frameInstance.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      frameInstance.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      frameInstance.show()
      frameInstance.focus()
    }
  }

  isFrameShowing() {
    return Object.keys(this.frameInstances).some((win) => this.frameInstances[win].isVisible())
  }
}
