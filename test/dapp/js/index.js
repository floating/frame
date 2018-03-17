const Web3 = require('web3')
const requestProvider = require('./requestProvider')

const React = require('react')
const ReactDOM = require('react-dom')
const Restore = require('react-restore')

const svg = require('../../../app/svg')

let state = {ws: true}
let actions = {ws: (u, connected) => u('ws', ws => connected)}
const store = Restore.create(state, actions)

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {accounts: [], providerError: ''}
    this.setupProvider()
  }
  setupProvider () {
    requestProvider(store, (err, provider) => {
      this.provider = provider
      if (err || !provider) {
        this.setState({providerError: 'No Frame Provider Found'})
        setTimeout(this.setupProvider, 500)
        return
      }
      this.web3 = new Web3(provider)
      setInterval(() => { // Replace with provider broadcast
        this.web3.eth.getAccounts((err, accounts) => {
          if (err || accounts.length === 0) return this.setState({accounts: [], providerError: JSON.parse(err.message) || 'Frame Provier has No Accounts'})
          if (accounts[0] !== this.state.accounts[0]) this.setState({accounts})
        })
      }, 500)
    })
  }
  testTransaction () {
    let tx = {
      chainId: Web3.utils.toHex(4),
      gas: Web3.utils.toHex(110000), // gas === gasLimit
      value: Web3.utils.toHex(10000),
      data: '0x',
      to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
      from: this.state.accounts[0]
    }
    this.web3.eth.sendTransaction(tx).then(res => {
      this.setState({txMessage: `Successful Transaction: ${res.transactionHash}`})
    }).catch(err => {
      console.log(err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  getBalance () {
    this.web3.eth.getBalance(this.state.accounts[0]).then(res => {
      this.setState({txMessage: `Balance: ${this.web3.utils.fromWei(res)}`})
    }).catch(err => {
      console.log('getBalance err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  getGasPrice () {
    this.web3.eth.getGasPrice().then(res => {
      this.setState({txMessage: `Gas price: ${this.web3.utils.fromWei(res)}`})
    }).catch(err => {
      console.log('getGasPrice err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  getTransactionCount () {
    this.web3.eth.getTransactionCount(this.state.accounts[0]).then(res => {
      this.setState({txMessage: `Transactions sent: ${res}`})
    }).catch(err => {
      console.log('getTransactionCount err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  render () {
    return (
      <div id='dapp'>
        {this.store('ws') ? (
          this.state.accounts.length > 0 ? (
            this.state.txMessage ? (
              <div className='current'>
                <div className='account'>{this.state.txMessage}</div>
              </div>
            ) : (
              <div className='current'>
                <div className='account'>{'Current Account:'}</div>
                <div className='address'>{this.state.accounts}</div>
                <div className='button-wrap'>
                  <div className='button' onClick={() => this.testTransaction()}>
                    {'Send Test Transaction'}
                  </div>
                  <div className='button' onClick={() => this.getBalance()}>
                    {'View Balance'}
                  </div>
                  <div className='button' onClick={() => this.getGasPrice()}>
                    {'View Gas Price'}
                  </div>
                  <div className='button' onClick={() => this.getTransactionCount()}>
                    {'View Transaction Count'}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className='errorMessage'>
              {this.state.providerError || 'Loading'}
              {this.state.providerError === 'No Account Selected' ? (
                <div className='providerErrorSub'>
                  <span>{svg.logo(20)}</span>
                  <span>{'in menubar to view accounts'}</span>
                </div>
              ) : null}
            </div>
          )
        ) : (
          <div className='errorMessage'>
            {'You were disconnected from the Frame provider'}
            <div className='providerErrorSub'>
              <span>{'This demo does not currently include reconnection functionality'}</span>
            </div>
          </div>
        )}
      </div>
    )
  }
}

let Frame = Restore.connect(App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
