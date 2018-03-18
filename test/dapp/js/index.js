const Web3 = require('web3')
const requestProvider = require('./requestProvider')

const React = require('react')
const ReactDOM = require('react-dom')
const Restore = require('react-restore')

const svg = require('../../../app/svg')
const Transactions = require('./Transactions')

let state = {ws: true, transactions: {}}
let actions = {
  ws: (u, connected) => u('ws', ws => connected),
  insertTransaction: (u, tx) => u('transactions', transactions => {
    transactions[tx.hash] = {status: 'pending', data: tx}
    return transactions
  }),
  updateTransaction: (u, tHash, update) => u('transactions', tHash, tx => Object.assign({}, tx, update))
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
  testTransaction = () => {
    let tx = {
      chainId: Web3.utils.toHex(4),
      gas: Web3.utils.toHex(110000), // gas === gasLimit
      value: Web3.utils.toHex(10000),
      data: '0x',
      to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
      from: this.state.accounts[0]
    }
    this.web3.eth.sendTransaction(tx).then(res => {
      this.store.insertTransaction({hash: res.transactionHash})
      setTimeout(() => {
        this.store.updateTransaction(res.transactionHash, {status: 'verified'})
      }, 10000)
      this.setState({txMessage: `Successful Transaction: ${res.transactionHash}`})
      this.startPoll(res.transactionHash)
    }).catch(err => {
      console.log('sendTranction err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  getBalance = () => {
    this.web3.eth.getBalance(this.state.accounts[0]).then(res => {
      this.setState({txMessage: `Balance: ${Web3.utils.fromWei(res)}`})
    }).catch(err => {
      console.log('getBalance err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  getGasPrice = () => {
    this.web3.eth.getGasPrice().then(res => {
      this.setState({txMessage: `Gas price: ${Web3.utils.fromWei(res)}`})
    }).catch(err => {
      console.log('getGasPrice err:', err)
      this.setState({txMessage: 'Error: ' + err.message})
    }).finally(_ => {
      setTimeout(() => {
        this.setState({txMessage: ''})
      }, 3700)
    })
  }
  setCurrentTransaction = (tHash) => e => {
    this.setState({currentTransaction: this.store('transactions', tHash, 'data')})
  }
  startPoll (txHash) {
    this[txHash] = setInterval(() => {
      if (Object.keys(this.store('transactions')).length > 0) {
        let pendingMap = Object.keys(this.store('transactions')).reduce((acc, tHash) => {
          if (this.store('transactions')[tHash].status === 'pending') {
            acc[tHash] = this.store('transactions')[tHash]
          }
          return acc
        }, {})
        if (Object.keys(pendingMap).length > 0) {
          Promise.all(Object.keys(pendingMap).map(tHash => this.web3.eth.getTransaction(tHash))).then(res => {
            res.forEach(newTx => { this.store.updateTransaction(newTx.hash, {data: newTx}) })
          }).catch(err => {
            console.log('polling getTransaction err:', err)
            this.setState({txMessage: 'Error: ' + err.message})
          })
        } else if (this[txHash]) {
          clearInterval(this[txHash])
        }
      } else if (this[txHash]) {
        clearInterval(this[txHash])
      }
    }, 2500)
  }
  toggleTransactions = (resetCurrent) => e => {
    if (resetCurrent) {
      this.setState({currentTransaction: ''})
    } else if (!this.state.showTransactions) { // about to view transactions
      this.setState({showTransactions: true, currentTransaction: ''})
    } else { // going back to main view
      this.setState({showTransactions: false, currentTransaction: ''})
    }
  }
  render () {
    if (this.state.showTransactions) {
      return (
        <Transactions
          transactions={this.store('transactions')}
          toggleTransactions={this.toggleTransactions}
          setCurrentTransaction={this.setCurrentTransaction}
          currentTransaction={this.state.currentTransaction} />
      )
    } else {
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
                    <div className='button' onClick={this.testTransaction}>
                      {'Send Test Transaction'}
                    </div>
                    <div className='button' onClick={this.getBalance}>
                      {'View Balance'}
                    </div>
                    <div className='button' onClick={this.getGasPrice}>
                      {'View Gas Price'}
                    </div>
                    <div className='button' onClick={this.toggleTransactions(false)}>
                      {`View Transactions (${Object.keys(this.store('transactions')).length})`}
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
}

let Frame = Restore.connect(App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
