import React from 'react'
import Restore from 'react-restore'
import link from '../../link'

class Title extends React.Component {
  handleClose () {
    link.send('frame:close')
  }

  handleMin () {
    link.send('frame:min')
  }

  handleMax () {
    link.send('frame:max')
  }

  render () {
    const platform = this.store('platform')
    const maximized = false
    return (
      <div className='nativeControls'>
        {platform === 'darwin' ? (
          <>
            <div className='macGrab' />
            <div className='macControls'>
            </div>
          </>
        ) : platform === 'win32' ? (
          <>
            <div className='windowsGrab' />
            <div className='windowsControls'>
              <div 
                className='windowsControlsButton'
                onClick={this.handleMin}
              >
                <svg width='11' height='1' viewBox='0 0 11 1'>
                  <path d='m11 0v1h-11v-1z' />
                </svg>
              </div>
              {maximized ? (
                <div 
                  className='windowsControlsButton'
                  onClick={this.handleMax}
                >
                  <svg width='11' height='11' viewBox='0 0 11 11'>
                    <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                  </svg>
                </div>
              ) : (
                <div 
                  className='windowsControlsButton'
                  onClick={this.handleMax}
                >
                  <svg width='10' height='10' viewBox='0 0 10 10'>
                    <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                  </svg>
                </div>
              )}
              <div 
                className='windowsControlsButton'
                onClick={this.handleClose}
              >
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
              <div 
                className='linuxControlsButton'
                onClick={this.handleClose}
              >
                <svg className='linuxControlsClose' viewBox='0 0 352 512'>
                  <path fill='currentColor' d='M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z' />
                </svg>
              </div>
              <div 
                className='linuxControlsButton'
                onClick={this.handleMin}
              >
                <svg className='linuxControlsMin' viewBox='0 0 448 512'>
                  <path fill='currentColor' d='M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z' />
                </svg>
              </div>
              {maximized ? (
                <div 
                  className='linuxControlsButton'
                  onClick={this.handleMax}
                >
                  <svg className='linuxControlsMax' viewBox='0 0 448 512'>
                    <path fill='currentColor' d='M212.686 315.314L120 408l32.922 31.029c15.12 15.12 4.412 40.971-16.97 40.971h-112C10.697 480 0 469.255 0 456V344c0-21.382 25.803-32.09 40.922-16.971L72 360l92.686-92.686c6.248-6.248 16.379-6.248 22.627 0l25.373 25.373c6.249 6.248 6.249 16.378 0 22.627zm22.628-118.628L328 104l-32.922-31.029C279.958 57.851 290.666 32 312.048 32h112C437.303 32 448 42.745 448 56v112c0 21.382-25.803 32.09-40.922 16.971L376 152l-92.686 92.686c-6.248 6.248-16.379 6.248-22.627 0l-25.373-25.373c-6.249-6.248-6.249-16.378 0-22.627z' />
                  </svg>
                </div>
              ) : (
                <div 
                  className='linuxControlsButton'
                  onClick={this.handleMax}
                >
                  <svg className='linuxControlsMax' viewBox='0 0 448 512'>
                    <path fill='currentColor' d='M212.686 315.314L120 408l32.922 31.029c15.12 15.12 4.412 40.971-16.97 40.971h-112C10.697 480 0 469.255 0 456V344c0-21.382 25.803-32.09 40.922-16.971L72 360l92.686-92.686c6.248-6.248 16.379-6.248 22.627 0l25.373 25.373c6.249 6.248 6.249 16.378 0 22.627zm22.628-118.628L328 104l-32.922-31.029C279.958 57.851 290.666 32 312.048 32h112C437.303 32 448 42.745 448 56v112c0 21.382-25.803 32.09-40.922 16.971L376 152l-92.686 92.686c-6.248 6.248-16.379 6.248-22.627 0l-25.373-25.373c-6.249-6.248-6.249-16.378 0-22.627z' />
                  </svg>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }
}

export default Restore.connect(Title)
