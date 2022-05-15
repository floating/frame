import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Command extends React.Component {
  render () {
    return (
      <div className='command'>
        {this.store('dash.panel') !== 'default' ? (
          <div 
            className='commandItem commandItemBack cardShow'
            onClick={() => {
              link.send('tray:action', 'setDash', 'default')
            }}
          >
            {svg.chevronLeft(16)}
          </div>
        ) : null}
        
        {/* <div 
          className='commandInput'
        >
          <input />
        </div> */}

        <div 
          className='commandItem commandItemClose'
          onClick={() => {
            link.send('tray:action', 'closeDash')
          }}
        >
          {svg.x(16)}
        </div>
      </div>
    ) 
  }
}

export default Restore.connect(Command)
