import * as Sentry from '@sentry/electron'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import Workspace from './Workspace'

import link from '../../resources/link'
import appStore from '../store'

import { StoreContext } from '../../resources/Hooks/useStore'

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

document.addEventListener('dragover', (e) => e.preventDefault())
document.addEventListener('drop', (e) => e.preventDefault())

// Function to be called when the mouse exits the top or bottom edge
function handleMouseExit(direction) {
  if (direction === 'top') {
    console.log('Mouse exited from the top edge')
  } else if (direction === 'bottom') {
    console.log('Mouse exited from the bottom edge')
  }
}

document.addEventListener('mousemove', (event) => {
  console.log('mouse move event: ', event)
  const mouseY = event.clientY
  const windowHeight = window.innerHeight

  if (mouseY <= 0) {
    handleMouseExit('top')
  } else if (mouseY >= windowHeight) {
    handleMouseExit('bottom')
  }
})

if (process.env.NODE_ENV !== 'development') {
  window.eval = global.eval = () => {
    throw new Error(`This app does not support window.eval()`)
  } // eslint-disable-line
}

function AppComponent({ store }) {
  return (
    <StoreContext.Provider value={store}>
      <Workspace frameId={frameId} />
    </StoreContext.Provider>
  )
}

link.rpc('getFrameId', (err, frameId) => {
  if (err) return console.error('Could not get frameId from main', err)
  window.frameId = frameId
  link.rpc('getState', (err, state) => {
    if (err) return console.error('Could not get initial state from main')
    const store = appStore(state)
    window.store = store
    store.observer(() => {
      document.body.classList.remove('dark', 'light')
      document.body.classList.add('clip', store('main.colorway'))
      setTimeout(() => {
        document.body.classList.remove('clip')
      }, 100)
    })
    const root = createRoot(document.getElementById('workspace'))
    const Workspace = Restore.connect(AppComponent, store)
    root.render(<Workspace store={store} />)
  })
})

document.addEventListener('contextmenu', (e) => link.send('*:contextmenu', e.clientX, e.clientY))
