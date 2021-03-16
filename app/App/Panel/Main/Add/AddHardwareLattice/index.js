import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'
import svg from '../../../../../svg'
import gridLogo from "./grid.png";
const {v5: uuid} = require('uuid')
const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'
class AddHardwareLattice extends React.Component {
    constructor(...args) {
        super(...args)
        this.state = {
            adding: false,
            index: 0,
            status: '',
            error: false,
            deviceID: '',
            pairCode: '',
        }
        this.forms = [React.createRef(), React.createRef(), React.createRef()]
    }

    onChange(key, e) {
        e.preventDefault()
        const update = {}
        update[key] = (e.target.value || '') // .replace(/\W/g, '')
        this.setState(update)
    }

    onBlur(key, e) {
        e.preventDefault()
        const update = {}
        update[key] = this.state[key] || ''
        this.setState(update)
    }

    onFocus(key, e) {
        e.preventDefault()
        if (this.state[key] === '') {
            const update = {}
            update[key] = ''
            this.setState(update)
        }
    }

    currentForm() {
        return this.forms[this.state.index]
    }

    blurActive() {
        const formInput = this.currentForm()
        if (formInput) formInput.current.blur()
    }

    focusActive() {
        setTimeout(() => {
            const formInput = this.currentForm()
            if (formInput) formInput.current.focus()
        }, 500)
    }

    next() {
        this.blurActive()
        this.setState({index: ++this.state.index})
        this.focusActive()
    }


    addAccounts(accounts) {
        link.rpc('addLatticeAccount', this.state.deviceID, accounts, (err, status) => {
            if (err) {
                this.setState({status: err, error: true})
            } else {
                this.setState({status: status.status, error: false})
                setTimeout(() => {
                    this.store.toggleAddAccount()
                }, 2000)
            }
        });
    }

    connectToLattice() {
        link.rpc('latticeConnect', {
            deviceID: this.state.deviceID,
        }, (err, response = []) => {

            const [accounts, isPaired] = response;
            if (!isPaired) {
                this.next();
                this.setState({status: 'Pairing Device', error: false})
            } else if (accounts && accounts.length > 0) {
                this.setState({status: 'Adding Accounts', index: 2, error: false})
                this.addAccounts(accounts);
            } else if (!err && isPaired === typeof 'undefined') {
                this.setState({status: 'ok', index: 2, error: true})
            }
        });
    }


    pairToLattice() {
        link.rpc('latticePair', this.state.deviceID, this.state.pairCode, (err, accounts) => {
            if (err) {
                this.setState({status: err, error: true})
            } else if(accounts.length > 0) {
                this.setState({status: 'Adding Accounts', index:2, error: false})
                this.addAccounts(accounts)
            }
        })
    }

    capitalize(s) {
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    }


    accountSort(a, b) {
        const accounts = this.store('main.accounts')
        a = accounts[a].created
        b = accounts[b].created
        if (a === -1 && b !== -1) return -1
        if (a !== -1 && b === -1) return 1
        if (a > b) return -1
        if (a < b) return 1
        return 0
    }

    // accountFilter(id) {
    //     // Need to migrate accounts to use network type
    //     const network = this.store('main.currentNetwork.id')
    //     const account = this.store('main.accounts', id)
    //     return account.network === network
    // }

    restart() {
        this.setState({adding: false, index: 0, pairCode: ''})
        setTimeout(() => {
            this.setState({status: '', error: false})
        }, 500)
        this.focusActive()
    }

    adding() {
        this.setState({adding: true})
        this.focusActive()
    }

    render() {
        let itemClass = 'addAccountItem addAccountItemSmart'
        if (this.state.adding) itemClass += ' addAccountItemAdding'
        return (
            <div className={itemClass} style={{transitionDelay: (0.64 * this.props.index / 4) + 's'}}>
                <div className='addAccountItemBar'/>
                <div className='addAccountItemWrap'>
                    <div className='addAccountItemTop'>
                        <div className='addAccountItemIcon'>
                            <div className='addAccountItemIconType addAccountItemIconSmart'
                                 style={{paddingTop: '6px'}}>{<img src={gridLogo} height={30} width={30}/>}</div>
                            <div className='addAccountItemIconHex addAccountItemIconHexSmart'/>
                        </div>
                        <div className='addAccountItemTopTitle'>Lattice</div>
                        <div className='addAccountItemTopTitle'/>
                    </div>
                    <div className='addAccountItemSummary'>Unlock your Lattice to get started</div>
                    <div className='addAccountItemOption'>
                        <div className='addAccountItemOptionIntro' onMouseDown={() => this.adding()}>
                            <div className='addAccountItemDeviceTitle'>Add Lattice</div>
                        </div>
                        <div className='addAccountItemOptionSetup'
                             style={{transform: `translateX(-${100 * this.state.index}%)`}}>
                            <div className='addAccountItemOptionSetupFrames'>
                                <div className='addAccountItemOptionSetupFrame'>
                                    <div className='addAccountItemOptionTitle'>enter device id</div>
                                    <div className='addAccountItemOptionInputPhrase'>
                                        <input tabIndex='-1' ref={this.forms[0]} value={this.state.deviceID}
                                               onChange={e => this.onChange('deviceID', e)}
                                               onFocus={e => this.onFocus('deviceID', e)}
                                               onBlur={e => this.onBlur('deviceID', e)} onKeyPress={e => {
                                            if (e.key === 'Enter') this.connectToLattice()
                                        }}/>
                                    </div>
                                    <div className='addAccountItemOptionSubmit'
                                         onMouseDown={() => this.connectToLattice()}>Next
                                    </div>
                                </div>
                                <div className='addAccountItemOptionSetupFrame'>
                                    <div className='addAccountItemOptionTitle'>enter generated passcode</div>
                                    <div className='addAccountItemOptionInputPhrase'>
                                        <input tabIndex='1' ref={this.forms[1]} value={this.state.pairCode}
                                               onChange={e => this.onChange('pairCode', e)}
                                               onFocus={e => this.onFocus('pairCode', e)}
                                               onBlur={e => this.onBlur('pairCode', e)} onKeyPress={e => {
                                            if (e.key === 'Enter') this.pairToLattice()
                                        }}/>
                                    </div>
                                    <div className='addAccountItemOptionSubmit'
                                         onMouseDown={() => this.pairToLattice()}>Pair
                                    </div>
                                </div>
                                <div className='addAccountItemOptionSetupFrame'>
                                    <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                                    {this.state.error ? <div className='addAccountItemOptionSubmit'
                                                             onMouseDown={() => this.restart()}>try again</div> : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Restore.connect(AddHardwareLattice)
