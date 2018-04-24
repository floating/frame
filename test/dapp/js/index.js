const Web3 = require('web3')
const getProvider = require('./getProvider')

const React = require('react')
const ReactDOM = require('react-dom')
const Restore = require('react-restore')

const svg = require('../../../app/svg')
const Transactions = require('./Transactions')

let state = {ws: false, transactions: {}}
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
    this.web3 = new Web3(getProvider())
    this.provider = this.web3.currentProvider
    this.provider.on('open', () => {
      store.ws(true)
      console.log('Connect in Dapp')
      this.web3.eth.getAccounts((err, accounts) => {
        if (err) return console.log('getAccounts Error ', err)
        this.setState({accounts})
      })
    })
    this.provider.on('close', () => store.ws(false))
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
    this.web3.eth.sendTransaction(tx).on('transactionHash', hash => {
      this.store.insertTransaction({hash})
      setTimeout(() => {
        this.store.updateTransaction(hash, {status: 'verified'})
      }, 10000)
      this.setState({txMessage: `Successful Transaction: ${hash}`})
      setTimeout(() => { this.setState({txMessage: ''}) }, 3700)
    }).on('error', err => {
      this.setState({txMessage: err.message})
      setTimeout(() => { this.setState({txMessage: ''}) }, 3700)
    })
    // .on('receipt', receipt => {
    //   console.log('receipt', receipt)
    // }).on('confirmation', (confirmationNumber, receipt) => {
    //   console.log('confirmation', confirmationNumber, receipt)
    // })
  }
  getBalance = () => {
    this.web3.eth.getBalance(this.state.accounts[0]).then(res => {
      this.setState({txMessage: `Balance: ${Web3.utils.fromWei(res)}`})
    }).catch(err => {
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
            console.log('polling getTransaction err ', err)
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
    } else {
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
          <Restore.DevTools />
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
                    <div className='button' onClick={this.testTransaction}>{'Send Test Transaction'}</div>
                    <div className='button' onClick={this.getBalance}>{'View Balance'}</div>
                    <div className='button' onClick={this.getGasPrice}>{'View Gas Price'}</div>
                    <div className='button' onClick={this.toggleTransactions(false)}>
                      {`View Transactions (${Object.keys(this.store('transactions')).length})`}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className='errorMessage'>
                {this.state.providerError || 'No Account Selected'}
                <div className='providerErrorSub'>
                  <span>{svg.logo(20)}</span>
                  <span>{'in menu bar to view accounts'}</span>
                </div>
              </div>
            )
          ) : (
            <div className='errorMessage'>
              {'Trying to connect to provider...'}
              <div className='providerErrorSub'>
                <span>{''}</span>
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
