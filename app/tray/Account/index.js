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
    const currentAccount = Object.values(accounts).find((acct) => acct.active) || {}
    if (!currentAccount.id) return null
    return <Account key={currentAccount.id} {...currentAccount} index={1} />
  }
}

export default Restore.connect(Main)
