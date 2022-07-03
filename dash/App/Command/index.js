import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Command extends React.Component {
  render() {
    const { view, data } = this.store('dash.nav')[0] || { view: '', data: {} }
    return (
      <div className='command'>
        {this.store('dash.nav').length ? (
          <div
            className='commandItem commandItemBack cardShow'
            onClick={() => {
              link.send('tray:action', 'backDash')
            }}
          >
            {svg.chevronLeft(16)}
          </div>
        ) : null}
        <div key={view} className='commandTitle cardShow'>
          {view}
        </div>

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
