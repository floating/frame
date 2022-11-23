// Frames are the windows that run dapps and other functionality
// They are rendered based on the state of `main.frames`

import { screen } from 'electron'
import log from 'electron-log'
import store from '../../store'

import frameInstances, { FrameInstance } from './frameInstances.js'
import viewInstances from './viewInstances'

function getFrames (): Record<string, Frame> {
  return store('main.frames')
}

export default class FrameManager {
  private frameInstances: Record<string, FrameInstance> = {}

  start () {
    store.observer(() => {
      const inFocus = store('main.focusedFrame')

      const frames = getFrames()

      this.manageFrames(frames, inFocus)
      this.manageViews(frames)
      // manageOverlays(frames)
    })
  }

  manageFrames (frames: Record<string, Frame>, inFocus: string) {
    const frameIds = Object.keys(frames)
    const instanceIds = Object.keys(this.frameInstances)
  
    // create an instance for each new frame in the store
    frameIds
      .filter(frameId => !instanceIds.includes(frameId))
      .forEach(frameId => {
        const frameInstance = frameInstances.create(frames[frameId])

        this.frameInstances[frameId] = frameInstance

        frameInstance.on('closed', () => {
          this.removeFrameInstance(frameId)
          store.removeFrame(frameId)
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
                viewInstances.position(frameInstance, frame.currentView)
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
          const { currentView } = frames[frameId]
          if (currentView && frameInstance) {
            frameInstance.views = frameInstance.views || {}
            frameInstance.views[currentView].webContents.focus()
          } 
        })
      })

    // destroy each frame instance that is no longer in the store
    instanceIds
      .filter(instanceId => !frameIds.includes(instanceId))
      .forEach(instanceId => {
        const frameInstance = this.removeFrameInstance(instanceId)

        if (frameInstance) {
          frameInstance.destroy()
        }
      })

    if (inFocus) {
      const focusedFrame = this.frameInstances[inFocus] || { isFocused: () => true }

      if (!focusedFrame.isFocused()) {
        focusedFrame.show()
        focusedFrame.focus()
      }
    }
  }

  manageViews (frames: Record<string, Frame>) {
    const frameIds = Object.keys(frames)
  
    frameIds.forEach(frameId => {
      const frameInstance = this.frameInstances[frameId]
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
        if (frame.currentView === frameViewId && viewData.ready && frameInstance.showingView !== frameViewId) {
          frameInstance.addBrowserView(viewInstance)
          frameInstance.showingView = frameViewId
          viewInstances.position(frameInstance, frameViewId)
          setTimeout(() => {
            if (frameInstance.isFocused()) viewInstance.webContents.focus()
          }, 100)
        } else if (frame.currentView !== frameViewId && frameInstance.showingView === frameViewId) {
          frameInstance.removeBrowserView(viewInstance)
          frameInstance.showingView = ''
        }
      })
    })
  }

  removeFrameInstance (frameId: string) {
    const frameInstance = this.frameInstances[frameId]

    Object.keys(frameInstance.views || {}).forEach(viewId => {
      viewInstances.destroy(frameInstance, viewId)
    })

    delete this.frameInstances[frameId]

    if (frameInstance) {
      frameInstance.removeAllListeners('closed')
    }

    return frameInstance
  }

  private sendMessageToFrame (frameId: string, channel: string, ...args: any) {
    const frameInstance = this.frameInstances[frameId]

    if (frameInstance && !frameInstance.isDestroyed()) {
      const webContents = frameInstance.webContents
      webContents.send(channel, ...args)
    } else {
      log.error(new Error(`Tried to send a message to frame with id ${frameId} but it does not exist or has been destroyed`))
    }
  }

  broadcast (channel: string, args: any[]) {
    Object.keys(this.frameInstances).forEach(id => this.sendMessageToFrame(id, channel, ...args))
  }

  reloadFrames (style?: string) {
    if (style) {
      Object.keys(this.frameInstances).forEach(win => {
        this.frameInstances[win].webContents.send('main:reload:style', style)
      })
    } else {
      Object.keys(this.frameInstances).forEach(win => {
        this.frameInstances[win].webContents.reload()
      })
    }
  }

  refocus (id: string) {
    const frameInstance = this.frameInstances[id]
    if (frameInstance) {
      frameInstance.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
      frameInstance.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true, skipTransformProcessType: true })
      frameInstance.show()
      frameInstance.focus()
    }
  }

  isFrameShowing () {
    return Object.keys(this.frameInstances).some(win => this.frameInstances[win].isVisible())
  }
}
