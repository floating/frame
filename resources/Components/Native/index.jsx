import React from 'react'
import Restore from 'react-restore'
import link from '../../link'

class Title extends React.Component {
  handleClose() {
    link.send('frame:close')
  }

  handleMin() {
    link.send('frame:min')
  }

  handleMax() {
    link.send('frame:max')
  }

  handleUnmax() {
    link.send('frame:unmax')
  }

  handleFull() {
    link.send('frame:full')
  }

  handleUnfull() {
    link.send('frame:unfull')
  }

  render() {
    const platform = this.store('platform')
    const { fullscreen, maximized } = this.store('main.frames', window.frameId)
    return (
      <div className='nativeControls'>
        {platform === 'darwin' ? (
          <>
            <div className='macGrab' />
            <div className='macControls'></div>
          </>
        ) : platform === 'win32' ? (
          <>
            <div className='windowsGrab' />
            <div className='windowsControls'>
              <div className='windowsControlsButton' onClick={this.handleMin}>
                <svg width='11' height='1' viewBox='0 0 11 1'>
                  <path d='m11 0v1h-11v-1z' />
                </svg>
              </div>
              {maximized || fullscreen ? (
                <div className='windowsControlsButton' onClick={this.handleUnmax}>
                  <svg width='11' height='11' viewBox='0 0 11 11'>
                    <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                  </svg>
                </div>
              ) : (
                <div className='windowsControlsButton' onClick={this.handleMax}>
                  <svg width='10' height='10' viewBox='0 0 10 10'>
                    <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                  </svg>
                </div>
              )}
              <div className='windowsControlsButton' onClick={this.handleClose}>
                <svg width='12' height='12' viewBox='0 0 12 12'>
                  <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className='linuxGrab' />
            <div className='linuxControls'>
              <div className='linuxControlsButton' onClick={this.handleMin}>
                <svg className='linuxControlsMin' width='11' height='1' viewBox='0 0 11 1'>
                  <path d='m11 0v1h-11v-1z' />
                </svg>
              </div>
              {maximized || fullscreen ? (
                <div className='linuxControlsButton' onClick={this.handleUnmax}>
                  <svg className='linuxControlsMax' width='11' height='11' viewBox='0 0 11 11'>
                    <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                  </svg>
                </div>
              ) : (
                <div className='linuxControlsButton' onClick={this.handleMax}>
                  <svg className='linuxControlsMax' width='10' height='10' viewBox='0 0 10 10'>
                    <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                  </svg>
                </div>
              )}
              <div className='linuxControlsButton' onClick={this.handleClose}>
                <svg className='linuxControlsClose' width='12' height='12' viewBox='0 0 12 12'>
                  <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
}

export default Restore.connect(Title)
