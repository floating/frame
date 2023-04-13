import React from 'react'
import Restore from 'react-restore'

// ipcRenderer.on('getSharedObject', (event) => {
//   const sharedObject = ipcRenderer.sendSync('getSharedObject')
//   console.log(sharedObject.someValue) // "Hello World!"
// })

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

class Balances extends React.Component {
  render() {
    return this.props.expanded ? <BalancesExpanded {...this.props} /> : <BalancesPreview {...this.props} />
  }
}

export default Restore.connect(Balances)
