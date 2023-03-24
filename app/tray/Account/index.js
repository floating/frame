/* eslint-disable react/no-find-dom-node */
import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Account from './Account'

let firstScroll = true

class Main extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      accountFilter: ''
    }
  }

  reportScroll() {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll() {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  render() {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const open = this.store('selected.open')
    if (!open) return

    const currentAccount = accounts[current]
    if (!currentAccount) return null

    return (
      <>
        <Account
          key={current}
          {...currentAccount}
          index={1}
          reportScroll={() => this.reportScroll()}
          resetScroll={() => this.resetScroll()}
        />
      </>
    )
  }
}

export default Restore.connect(Main)
