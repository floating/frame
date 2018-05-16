const Web3 = require('web3')
const getProvider = require('./getProvider')

const React = require('react')
const ReactDOM = require('react-dom')
const Restore = require('react-restore')
const { CSSTransitionGroup } = require('react-transition-group')

const svg = require('./svg')

let state = {
  ws: false,
  slide: {
    mode: 'intro',
    direction: '>'
  },
  accounts: [],
  netId: 4,
  notice: '',
  txs: {},
  balance: '',
  recentBalance: false
}

let connectSlide = 4
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
        if (slide.mode === 'intro') slide.direction = '>'
        if (slide.mode === 'test') slide.direction = '<'
        slide.mode = 'connect'
        return slide
      })
    }
    u('ws', ws => connected)
  },
  setPending: u => {
    u('notice', _ => 'pending')
  },
  insertTransaction: (u, tx) => u('txs', txs => {
    txs[tx.hash] = {status: 'pending', hash: tx.hash, confirmations: 0}
    return txs
  }),
  updateTransaction: (u, tHash, update) => u('txs', tHash, tx => Object.assign({}, tx, update)),
  updateConfirmations: (u, txHash, confirmations) => {
    u('txs', txHash, 'confirmations', _ => confirmations)
  },
  nextSlide: (u, connected) => {
    if (!slideTime()) return
    u('slide.direction', _ => '>')
    u('slide.index', i => {
      if (!connected && i >= connectSlide) return connectSlide
      if (i === lastSlide) return lastSlide
      return ++i
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
  },
  setBalance: (u, balance) => {
    u('balance', _ => balance)
    u('recentBalance', _ => true)
    setTimeout(_ => u('recentBalance', _ => false), 2000)
  },
  setMode: (u, mode) => {
    u('slide.mode', _ => mode)
  }
}

const store = Restore.create(state, actions)

setTimeout(() => {
  store.setMode('connect')
}, 1700)

store.observer(() => {
  let mode = store('slide.mode')
  let ws = store('ws')
  if (mode === 'connect' && ws) {
    setTimeout(() => {
      store.setMode('test')
    }, 900)
  }
})

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
    this.getBalance = () => {
      this.web3.eth.getBalance(this.store('accounts', 0)).then(res => {
        let balance = Web3.utils.fromWei(res)
        if (store('balance') !== balance) this.store.setBalance(balance)
      }).catch(err => {
        if (err) return console.log('getBalance Error ', err)
      })
    }
    this.provider.on('open', () => {
      if (!store('ws')) store.ws(true)
      console.log('Connect in Dapp')
      this.web3.eth.getAccounts((err, accounts) => {
        if (err) return console.log('getAccounts Error ', err)
        this.store.accounts(accounts)
        this.getBalance()
      })
      this.web3.eth.net.getId((err, netId) => {
        if (err) return console.log('getNetwork Error ', err)
        this.store.netId(netId)
      })
    })
    this.provider.on('close', () => {
      if (store('ws')) store.ws(false)
    })
  }
  openTx = hash => {
    window.open('http://rinkeby.etherscan.io/tx/' + hash)
  }
  testTransaction = () => {
    let tx = {
      value: Web3.utils.toHex(Math.round(100000000000000000 * Math.random())),
      to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
      from: this.store('accounts', 0)
    }
    this.store.setPending()
    this.web3.eth.sendTransaction(tx).on('transactionHash', hash => {
      this.getBalance()
      this.store.insertTransaction({hash})
      this.store.notice(`tx_success`)
    }).on('error', err => {
      this.store.notice(err.message)
    }).on('confirmation', (confirmationNumber, receipt) => {
      this.getBalance()
      this.store.updateConfirmations(receipt.transactionHash, confirmationNumber)
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

  test = () => {
    return (
      <div className='titleSlide'>
        {this.store('notice') ? (
          <div className='accountNotice'>{(_ => {
            if (this.store('notice') === 'tx_success') {
              return (
                <div key={'success'} className='noticeStatusInner bounceIn'>
                  <div className='check'>
                    {svg.octicon('check', {height: '60px'})}
                  </div>
                  <div className='noticeStatusText'>{'Transaction Successful'}</div>
                </div>
              )
            } else if (this.store('notice') === 'user declined transaction') {
              return (
                <div key={'decline'} className='noticeStatusInner bounceIn'>
                  <div className='check'>
                    {svg.octicon('circle-slash', {height: '80px'})}
                  </div>
                  <div className='noticeStatusText'>{'Transaction Declined'}</div>
                </div>
              )
            } else if (this.store('notice') === 'pending') {
              return (
                <div key={'pending'} className='noticeStatusInner bounceIn'>
                  <div className='check'>
                    <div className='loader' />
                  </div>
                  <div className='noticeStatusText'>{'Transaction Pending'}</div>
                </div>
              )
            } else {
              return <div className='noticeStatusText'>{this.store('notice')}</div>
            }
          })()}</div>
        ) : (
          <div className='accountNotice'>
            <div key={'pending'} className='noticeStatusInner bounceIn'>
              <div className='check'>
                {svg.logo(40)}
              </div>
              <div className='noticeStatusText'>{'Account Info'}</div>
            </div>
          </div>
        )}
        <div className='accountMain'>
          <div className={this.store('recentBalance') ? 'accountBalance bounceIn' : 'accountBalance'}>{'Ξ ' + parseFloat(this.store('balance')).toFixed(4)}</div>
          <div className='accountSubtitle'>{'balance'}</div>
          <div className='accountAddress'>{this.store('accounts', 0)}</div>
          <div className='accountSubtitle'>{'address'}</div>
        </div>
        {Object.keys(this.store('txs')).length > 0 ? (
          <div className='txWrap'>
            {Object.keys(this.store('txs')).map(txHash => {
              return (
                <div key={txHash} className='txItem' onClick={() => this.openTx(txHash)}>
                  <div className='txItemConfirms'>{this.store('txs', txHash, 'confirmations')}</div>
                  <div className='txItemHash'>{txHash.substring(0, 14)} {svg.octicon('kebab-horizontal', {height: '20px'})} {txHash.substr(txHash.length - 14)}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='txWrap'>
            <div className='noTxs'>
              <div>{'No Recent Transactions'}</div>
            </div>
          </div>
        )}
        <div className='buttonWrap'>
          <div className='button' onClick={this.testTransaction}>{'Send Test Transaction'}</div>
        </div>
      </div>
    )
  }

  connect = () => {
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

  intro = () => {
    return (
      <div className='titleSlide'>
        {svg.logo(140)}
        <div className='logoTitle'>{'Frame'}</div>
        <div>{'A cross-platform ethereum provider interface'}</div>
      </div>
    )
  }

  render () {
    let slideMode = this.store('slide.mode')
    let direction = this.store('slide.direction')
    let slide = this[slideMode]
    return (
      <div id='dapp'>
        <Restore.DevTools />
        <CSSTransitionGroup style={{width: '100%'}} transitionName={direction === '>' ? 'slideUp' : 'slideDown'} transitionEnterTimeout={320} transitionLeaveTimeout={320}>
          <div id='slide' key={'slide' + slideMode}>
            <div className='slideWrap'>
              {slide ? slide() : `Slide ${slideMode} not found.`}
            </div>
          </div>
        </CSSTransitionGroup>
      </div>
    )
  }
}

let Frame = Restore.connect(App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
