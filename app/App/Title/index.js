import React from 'react'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

class Title extends React.Component {
  close = () => {
    ipcRenderer.send('frame:close')
  }
  min = () => {
    ipcRenderer.send('frame:minimize')
  }
  full = () => {
    ipcRenderer.send('frame:full')
  }
  render () {
    return (
      <div className='macTitle'>
        <div className='titleClose' onClick={this.close} />
        <div className='titleMin' onClick={this.min} />
        <div className='titleFull' onClick={this.full} />
      </div>
    )
  }
}

export default Restore.connect(Title)
