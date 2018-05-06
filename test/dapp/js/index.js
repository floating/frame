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
    index: 0,
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
  },
  setBalance: (u, balance) => {
    u('balance', _ => balance)
    u('recentBalance', _ => true)
    setTimeout(_ => u('recentBalance', _ => false), 2000)
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
      chainId: Web3.utils.toHex(4),
      gas: Web3.utils.toHex(110000), // gas === gasLimit
      value: Web3.utils.toHex(Math.round(100000000000000000 * Math.random())),
      data: '0x',
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
          <div className='listItem'>{'Prebuilt app versions will be available for each platform very soon, along with a browser extension to inject Frame\'s provider into web dapps'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Local Node Management'}</div>
          <div className='listItem'>{'Adding the option for users to run their own full node or light client rather than using a remote connection'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Payload Recognition'}</div>
          <div className='listItem'>{'Develop UI patterns around different kinds of payloads to help users clearly understand what they\'re signing and what effects signing of those payloads is likely to have'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Aragon Nest'}</div>
          <div className='listItem'>{'Frame was recently awarded a grant by the Aragon foundation through their Aragon Nest program!'}</div>
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

  slide5 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'Permissions'}</div>
        <div className='listItem'>{'Until a dapp is given permission by the user it will not be able to connect to the provider or see any information about your account'}</div>
        <div className='listItem'>{'Permissions are granted on a dapp by dapp basis and can be revoked at any time by the user'}</div>
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
        <div className='defaultTitle'>{'Features'}</div>
        <div className='list'>
          <div className='listHead'>{'First-class Hardware Support'}</div>
          <div className='listItem'>{'Support for hardware signers is a top priority'}</div>
          <div className='listItem'>{'Use your Ledger or Trezor with any dapp!'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Permissions'}</div>
          <div className='listItem'>{'The user has full control over which dapps have permission to access their provider and can monitor what requests dapps are making'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Node Management'}</div>
          <div className='listItem'>{'Frame will provide users with a simple way to run a full node or light client and is able to seamlessly switch between local and remote nodes'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Menu Bar Support'}</div>
          <div className='listItem'>{'Frame stays out of the way as much as possible, it will sit quietly in your menu bar until it\'s needed'}</div>
        </div>
        <div className='list'>
          <div className='listHead'>{'Cross Platform'}</div>
          <div className='listItem'>{'macOS, Windows and Linux!'}</div>
        </div>
      </div>
    )
  }

  slide2= () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'How does it work?'}</div>
        <div className='listItem'>{'Frame monitors signer availability, currently supported are Ledger and Trezor hardware signers but in the future any secure hardware or software signer can be supported'}</div>
        <div className='listItem'>{'From the list of available signers, the user select which they would like use to interact with the network'}</div>
        <div className='listItem'>{'Frame connects to a local or remote Ethereum node based on the selected account\'s preferences'}</div>
        <div className='listItem'>{'Frame then creates a local websocket provider interface that any dapp (web, native, cli) can connect to'}</div>
        <div className='listItem'>{'Frame routes dapp payloads to the user and their selected signer or selected node'}</div>
      </div>
    )
  }

  slide1 = () => {
    return (
      <div className='defaultSlide'>
        <div className='defaultTitle'>{'What is Frame?'}</div>
        <div className='listItem'>{'Frame is an cross-platform Ethereum provider that lets you use standalone signers (such as a Ledger or Trezor) to securely and transparently interact with dapps and the Ethereum network'}</div>
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
