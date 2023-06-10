import React from 'react'
import Restore from 'react-restore'

import Account from './Account'

class Main extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      accountFilter: ''
    }
  }

  render() {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const currentAccount = accounts[current]
    if (!currentAccount) return null

    return <Account key={current} {...currentAccount} index={1} />
  }
}

export default Restore.connect(Main)
