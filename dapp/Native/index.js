import React from 'react'
import Restore from 'react-restore'
import link from '../link'

class Title extends React.Component {
  handleClose = () => {
    link.send('window:close')
    // ipcRenderer.send('frame:close')
  }

  handleMin = () => {
    // ipcRenderer.send('frame:minimize')
  }

  handleFull = () => {
    // ipcRenderer.send('frame:full')
  }

  render () {
    return (
      <div className='macTitle'>
        <div className='macTitleButton' onMouseDown={() => this.handleClose()}>
          <div className='titleClose' />
        </div>
        <div className='macTitleButton' onMouseDown={() => this.handleClose()}>
          <div className='titleMin' />
        </div>
        <div className='macTitleButton' onMouseDown={() => this.handleClose()}>
          <div className='titleFull' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Title)
