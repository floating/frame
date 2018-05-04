const Web3 = require('web3')
const getProvider = require('./getProvider')

const React = require('react')
const ReactDOM = require('react-dom')
const Restore = require('react-restore')
const { CSSTransitionGroup } = require('react-transition-group')

const svg = require('./svg')
// const Transactions = require('./Transactions')

let state = {
  ws: false,
  transactions: {},
  slide: {
    index: 0,
    direction: '>'
  },
  accounts: [],
  netId: 4,
  notice: ''
}

let connectSlide = 4
let pendingSlide = 0
let lastSlide = 9

let lastTime = Date.now()
let slideTime = () => {
  let nowTime = Date.now()
  if (nowTime - lastTime < 350) return false
  lastTime = nowTime
  return true
}

let actions = {
  ws: (u, connected) => {
    if (!connected) {
      u('slide', slide => {
        if (slide.index > connectSlide) {
          pendingSlide = slide.index
          slide.index = connectSlide
          slide.direction = '<'
        }
        return slide
      })
    } else if (pendingSlide > connectSlide) {
      u('slide', slide => {
        slide.index = pendingSlide
        slide.direction = '>'
        return slide
      })
    }
    u('ws', ws => connected)
  },
  insertTransaction: (u, tx) => u('transactions', transactions => {
    transactions[tx.hash] = {status: 'pending', data: tx}
    return transactions
  }),
  updateTransaction: (u, tHash, update) => u('transactions', tHash, tx => Object.assign({}, tx, update)),
  nextSlide: (u, connected) => {
    if (!slideTime()) return
    u('slide.direction', _ => '>')
    u('slide.index', i => {
      if (!connected && i >= connectSlide) return connectSlide
      if (i === lastSlide) return lastSlide
      return ++i
    })
  },
  lastSlide: u => {
    if (!slideTime()) return
    pendingSlide = 0
    u('slide.direction', _ => '<')
    u('slide.index', i => {
      if (i > 0) --i
      return i
    })
  },
  accounts: (u, accounts) => {
    u('accounts', _ => accounts)
  },
  netId: (u, netId) => {
    u('netId', _ => netId)
  },
  notice: (u, notice) => {
    u('notice', _ => notice)
    setTimeout(_ => u('notice', _ => ''), 2000)
  }
}
const store = Restore.create(state, actions)

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      accounts: [],
      showTransactions: false,
      currentTransaction: '',
      providerError: ''
    }
    this.setupProvider()
  }
  setupProvider () {
    this.web3 = new Web3(getProvider())
    this.provider = this.web3.currentProvider
    this.provider.on('open', () => {
      if (!store('ws')) store.ws(true)
      console.log('Connect in Dapp')
      this.web3.eth.getAccounts((err, accounts) => {
        if (err) return console.log('getAccounts Error ', err)
        this.store.accounts(accounts)
      })
      this.web3.eth.net.getId((err, netId) => {
        if (err) return console.log('getNetwork Error ', err)
        this.store.netId(netId)
      })
    })
    this.provider.on('close', () => { if (store('ws')) store.ws(false) })
  }
  testTransaction = () => {
    let tx = {
      chainId: Web3.utils.toHex(4),
      gas: Web3.utils.toHex(110000), // gas === gasLimit
      value: Web3.utils.toHex(Math.round(10000000000000000 * Math.random())),
      data: '0x',
      to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
      from: this.store('accounts', 0)
    }
    this.web3.eth.sendTransaction(tx).on('transactionHash', hash => {
      this.store.insertTransaction({hash})
      // setTimeout(() => {
      //   this.store.updateTransaction(hash, {status: 'verified'})
      // }, 10000)
      this.store.notice(`Successful Transaction: ${hash}`)
    }).on('error', err => {
      this.store.notice(err.message)
    }).on('receipt', receipt => {
      console.log('receipt', receipt)
    }).on('confirmation', (confirmationNumber, receipt) => {
      console.log('confirmation', confirmationNumber, receipt)
    })
  }
  getBalance = () => {
    this.web3.eth.getBalance(this.store('accounts', 0)).then(res => {
      this.store.notice(`Balance: ${Web3.utils.fromWei(res)}`)
    }).catch(err => {
      this.store.notice(err.message)
    })
  }
  getGasPrice = () => {
    this.web3.eth.getGasPrice().then(res => {
      this.store.notice(`Gas price: ${Web3.utils.fromWei(res)}`)
    }).catch(err => {
      this.store.notice(err.message)
    })
  }
  setCurrentTransaction = (tHash) => e => {
    this.setState({currentTransaction: this.store('transactions', tHash, 'data')})
  }
  // startPoll (txHash) {
  //   this[txHash] = setInterval(() => {
  //     if (Object.keys(this.store('transactions')).length > 0) {
  //       let pendingMap = Object.keys(this.store('transactions')).reduce((acc, tHash) => {
  //         if (this.store('transactions')[tHash].status === 'pending') {
  //           acc[tHash] = this.store('transactions')[tHash]
  //         }
  //         return acc
  //       }, {})
  //       if (Object.keys(pendingMap).length > 0) {
  //         Promise.all(Object.keys(pendingMap).map(tHash => this.web3.eth.getTransaction(tHash))).then(res => {
  //           res.forEach(newTx => { this.store.updateTransaction(newTx.hash, {data: newTx}) })
  //         }).catch(err => {
  //           console.log('polling getTransaction err ', err)
  //           this.setState({txMessage: 'Error: ' + err.message})
  //         })
  //       } else if (this[txHash]) {
  //         clearInterval(this[txHash])
  //       }
  //     } else if (this[txHash]) {
  //       clearInterval(this[txHash])
  //     }
  //   }, 2500)
  // }
  // toggleTransactions = (resetCurrent) => e => {
  //   if (resetCurrent) {
  //     this.setState({currentTransaction: ''})
  //   } else if (!this.state.showTransactions) { // about to view transactions
  //     this.setState({showTransactions: true, currentTransaction: ''})
  //   } else {
  //     this.setState({showTransactions: false, currentTransaction: ''})
  //   }
  // }
  // renderOld () {
  //   if (this.state.showTransactions) {
  //     return (
  //       <Transactions
  //         transactions={this.store('transactions')}
  //         toggleTransactions={this.toggleTransactions}
  //         setCurrentTransaction={this.setCurrentTransaction}
  //         currentTransaction={this.state.currentTransaction} />
  //     )
  //   } else {
  //     return (
  //       <div id='dapp'>
  //         <Restore.DevTools />
  //         {this.store('ws') ? (
  //           this.store('accounts').length > 0 ? (
  //             this.state.txMessage ? (
  //               <div className='current'>
  //                 <div className='account'>{this.state.txMessage}</div>
  //               </div>
  //             ) : (
  //               <div className='current'>
  //                 <div className='account'>{'Current Account:'}</div>
  //                 <div className='address'>{this.store('accounts')}</div>
  //                 <div className='button-wrap'>
  //                   <div className='button' onClick={this.testTransaction}>{'Send Test Transaction'}</div>
  //                   <div className='button' onClick={this.getBalance}>{'View Balance'}</div>
  //                   <div className='button' onClick={this.getGasPrice}>{'View Gas Price'}</div>
  //                   <div className='button' onClick={this.toggleTransactions(false)}>
  //                     {`View Transactions (${Object.keys(this.store('transactions')).length})`}
  //                   </div>
  //                 </div>
  //               </div>
  //             )
  //           ) : (
  //             <div className='errorMessage'>
  //               {this.state.providerError || 'No Account Selected'}
  //               <div className='providerErrorSub'>
  //                 <span>{svg.logo(20)}</span>
  //                 <span>{'in menu bar to view accounts'}</span>
  //               </div>
  //             </div>
  //           )
  //         ) : (
  //           <div className='errorMessage'>
  //             {'Trying to connect to provider...'}
  //             <div className='providerErrorSub'>
  //               <span>{''}</span>
  //             </div>
  //           </div>
  //         )}
  //       </div>
  //     )
  //   }
  // }
  componentDidMount () {
    document.onkeydown = e => {
      if (e.key === 'ArrowRight') return this.store.nextSlide(this.store('ws'))
      if (e.key === 'ArrowLeft') return this.store.lastSlide()
    }
  }
  slide9 = () => {
    return (
      <div className='titleSlide'>
        {svg.logo(100)}
        <div className='logoTitle'>{'Frame'}</div>
        <div>{'github.com/floating/frame'}</div>
      </div>
    )
  }
  slide8 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'What\'s Next?'}</div>
        <div className='list'>
          <div className='listHead'>{'Prebuilt Apps'}</div>
          <div className='listItem'>{'App version for each platform will be available soon along with a browser extension to inject Frame into web dapps'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Node Management'}</div>
          <div className='listItem'>{'More options for running a full node or light client rather than a remote connection'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Payload Typing'}</div>
          <div className='listItem'>{'Developing UI patterns around types of requests so users can clearly understand what they\'re signing'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Security Audits'}</div>
          <div className='listItem'>{'Frame will be undergoing a round of security audits soon'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Special Thanks to Aragon Nest'}</div>
          <div className='listItem'>{'Frame was recently awarded a grant by the Aragon foundation!'}</div>
        </div>
      </div>
    )
  }
  slide7 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'Run Frame'}</div>
        <div className='codeBox'>
          <div style={{opacity: 0.5}}>{'# Clone Frame'}</div>
          <div>{'› git clone https://github.com/floating/frame'}</div>
          <div>{' '}</div>
          <div style={{opacity: 0.5}}>{'# Build Frame'}</div>
          <div>{'› npm run build'}</div>
          <div>{' '}</div>
          <div style={{opacity: 0.5}}>{'# Run Frame'}</div>
          <div>{'› npm run alpha'}</div>
        </div>
      </div>
    )
  }
  slide6 = () => {
    this.web3.eth.getAccounts((err, accounts) => {
      if (err) return console.log('getAccounts Error ', err)
      this.store.accounts(accounts)
    })
    return (
      <div className='titleSlide'>
        {this.store('notice') ? (
          <div>{this.store('notice')}</div>
        ) : (
          <React.Fragment>
            <div>{'Our Account:'}</div>
            <div>{this.store('accounts', 0)}</div>
          </React.Fragment>
        )}
        <div className='buttonWrap'>
          <div className='button' onClick={this.getBalance}>{'View Balance'}</div>
          <div className='button' onClick={this.testTransaction}>{'Send Test Transaction'}</div>
        </div>
      </div>
    )
  }
  slide5 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'Permissions'}</div>
        <div className='listItem'>{'Website can\'t see any infromation about your account'}</div>
        <div className='listItem'>{'Until an app is given permission it will not be able to connect to the provider'}</div>
        <div className='listItem'>{'Permissions is granted per app and can be revoked at any time by the user'}</div>
      </div>
    )
  }

  slide4 = () => {
    let ws = this.store('ws')
    return (
      <div className='titleSlide'>
        <div className='connectionStatus'>
          <CSSTransitionGroup transitionName={'slideUp'} transitionEnterTimeout={320} transitionLeaveTimeout={320}>
            {ws ? (
              <div key={'socket' + ws} className='connectionStatusInner bounceIn'>
                <div className='check'>
                  {svg.octicon('check', {height: '60px'})}
                </div>
              </div>
            ) : (
              <div key={'socket' + ws} className='connectionStatusInner bounceIn'>
                <div className='loader' />
              </div>
            )}
          </CSSTransitionGroup>
        </div>
        <div>{ws ? 'Provider found, connected to Frame!' : 'Looking for Frame provider...'}</div>
      </div>
    )
  }

  slide3 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'How does it work?'}</div>
        <div className='listItem'>{'Frame scans for hardware signers like a Ledger or Trezor'}</div>
        <div className='listItem'>{'Users select which account they would like use'}</div>
        <div className='listItem'>{'Frame creates a local websocket provider that any web, native or cli dapp can use'}</div>
        <div className='listItem'>{'Frame routes signature related dapp requests to the user selected signer'}</div>
      </div>
    )
  }

  slide2 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'Features'}</div>
        <div className='list'>
          <div className='listHead'>{'First-class Hardware Support'}</div>
          <div className='listItem'>{'Use your Ledger and Trezor devices with any dapp!'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Permissions'}</div>
          <div className='listItem'>{'Control which dapps have permission to access your provider and monitor with full transparency what requests dapps are making'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Node Management'}</div>
          <div className='listItem'>{'Simple administration of your full node or light client, seamlessly switch from local to remote on the fly'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Menu Bar Support'}</div>
          <div className='listItem'>{'Frame stays out of the way and sits quietly in your menu bar until it\'s needed'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Cross Platform'}</div>
          <div className='listItem'>{'macOS, Windows and Linux!'}</div>
        </div>
      </div>
    )
  }

  slide1 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'What is Frame?'}</div>
        <div className='listItem'>{'Frame interfaces with your signers (such as your Ledger or Trezor) and your Ethereum node to create a provider for dapps'}</div>
        <div className='listItem'>{'It\'s a user-friendly way to securely and transparently interact with dapps and the Ethereum network'}</div>
        <div className='listItem'>{'It lowers barrier for users that want to participate while creating a seamless provider interface for dapps to consume'}</div>
      </div>
    )
  }
  slide0 = () => {
    return (
      <div className='titleSlide'>
        {svg.logo(140)}
        <div className='logoTitle'>{'Frame'}</div>
        <div>{'A cross-platform ethereum provider interface'}</div>
      </div>
    )
  }
  render () {
    let slideIndex = this.store('slide.index')
    let direction = this.store('slide.direction')
    let slide = this['slide' + slideIndex]
    return (
      <div id='dapp'>
        <Restore.DevTools />
        <CSSTransitionGroup style={{width: '100%'}} transitionName={direction === '>' ? 'slideUp' : 'slideDown'} transitionEnterTimeout={320} transitionLeaveTimeout={320}>
          <div id='slide' key={'slide' + slideIndex}>
            <div className='slideWrap'>
              {slide ? slide() : `Slide ${slideIndex} not found :(`}
            </div>
          </div>
        </CSSTransitionGroup>
        <div id='slideIndex'>{this.store('slide.index')}</div>
      </div>
    )
  }
}

let Frame = Restore.connect(App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
