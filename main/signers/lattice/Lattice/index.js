const log = require('electron-log')
const utils = require('web3-utils')
const Client = require('gridplus-sdk').Client;
const EthereumTx = require('ethereumjs-tx')
const store = require('../../../store')
const Signer = require('../../Signer')
const crypto = require('crypto');
const {v5: uuid} = require('uuid')
const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const clientConfig = {
    name: 'Frame',
    crypto: crypto,
    privKey: null
}

const networks = {
    1: "mainnet",
    3: "ropsten",
    4: "rinkeby",
    42: "kovan",
    5: "goerli"
}

class Lattice extends Signer {
    constructor(device, api) {
        super()

        log.info('Setting up Lattice device')
        this.device = device
        this.id = this.getId()
        this.needsPair = true;
        this.baseUrl = store('main.lattice.endpoint');
        clientConfig['baseUrl'] = device.baseUrl;
        let password = store('main.lattice.password')
        if (!password) {
            password = crypto.randomBytes(32).toString('hex');
            store.setLatticePassword(password);
        }
        clientConfig['privKey'] = password;
        this.config = clientConfig;
        this.type = 'Lattice'
        this.status = 'loading'
        this.accounts = []
        this.index = 0
        this.hardwareDerivation = store('main.hardwareDerivation')
        this.pairCode = null
        this.client = null;
        this.basePath = () => this.hardwareDerivation;
        this.getPath = (i = this.index) => this.basePath() + i
        this.handlers = {}

        // this.networkObserver = store.observer(() => {
        //     if (this.network !== store('main.currentNetwork.id')) {
        //         this.network = store('main.currentNetwork.id')
        //         this.status = 'loading'
        //         this.accounts = []
        //         this.update()
        //         if (this.network) this.deviceStatus()
        //     }
        // })
        // this.hardwareDerivationObserver = store.observer(() => {
        //     if (this.hardwareDerivation !== store('main.hardwareDerivation')) {
        //         this.hardwareDerivation = store('main.hardwareDerivation')
        //         this.reset()
        //         this.deviceStatus()
        //     }
        // })
    }

    getId() {
        return this.fingerprint() || uuid('Lattice' + this.devicePath, ns)
    }

    setPin = (pin, cb) => {
        this.client.pair(pin, (err, hasActiveWallet) => {
            if (err) {
                cb(err, null)
            } else {
                if (!hasActiveWallet) {
                    console.log('hmm, not setup')
                }
                this.status = 'ok'
                this.update()
                this.getDeviceAddress((address) => {
                    this.addresses = [address];
                    cb(null, this.addresses);
                });
            }
        })
    }

    open(cb) {
        if (this.client == null) {
            this.client = new Client(this.config);
        }
        if (this.device.deviceID) {
            this.client.connect(this.device.deviceID, (err, isPaired) => {
                if (err) {
                    if (cb) {
                        cb(err, null)
                    } else {
                        console.log(err);
                    }
                }

                if (isPaired) {
                    this.needsPair = false
                    this.status = 'ok'
                    this.update()
                    this.getDeviceAddress((address) => {
                        this.addresses = [address];
                        if (cb) cb(this.addresses, true);
                    });
                } else {
                    if (cb) cb(this.addresses, false);
                }
            });
        }
    }

    close() {
        clearTimeout(this.interval)
        // this.networkObserver.remove()
        // this.hardwareDerivationObserver.remove()
        this.closed = true
        super.close()
    }

    getDeviceAddress(cb = () => {
    }) {
        try {
            const HARDENED_OFFSET = 0x80000000;
            const req = {
                startPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0],
                n: 1,
                skipCache: true
            };

            this.client.getAddresses(req, (err, result) => {
                if (err) cb(err)
                cb(result[0]);
            });
        } catch (err) {
            cb(err)
        }
    }

    // This verifyAddress signature is no longer current
    // verifyAddress(display = false, attempt = 0) {
    //     log.info('Verify Address, attempt: ' + attempt)
    //     flex.rpc('Lattice.ethereumGetAddress', this.id, this.getPath(), display, (err, result) => {
    //         if (err) {
    //             if (err === 'Lattice Device is busy (lock getAddress)' && attempt < 15) {
    //                 setTimeout(() => this.verifyAddress(display, ++attempt), 1000)
    //             } else {
    //                 log.info('Verify Address Error: ')
    //                 // TODO: Error Notification
    //                 log.error(err)
    //                 // this.api.unsetSigner()
    //             }
    //         } else {
    //             const address = result.address ? result.address.toLowerCase() : ''
    //             const current = this.accounts[this.index].toLowerCase()
    //             log.info('Frame has the current address as: ' + current)
    //             log.info('Trezor is reporting: ' + address)
    //             if (address !== current) {
    //                 // TODO: Error Notification
    //                 log.error(new Error('Address does not match device'))
    //                 // this.api.unsetSigner()
    //             } else {
    //                 log.info('Address matches device')
    //             }
    //         }
    //     })
    // }

    // setIndex(i, cb) {
    //     this.index = i
    //     this.requests = {} // TODO Decline these requests before clobbering them
    //     windows.broadcast('main:action', 'updateSigner', this.summary())
    //     cb(null, this.summary())
    //     this.verifyAddress()
    // }

    // lookupAccounts(cb) {
    //     const HARDENED_OFFSET = 0x80000000;
    //
    //     const req = {
    //         // -- m/49'/0'/0'/0/0, i.e. first BTC address
    //         startPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0],
    //         n: 4
    //     };
    //     this.client.getAddresses(req, (err, result) => {
    //         if (err) return cb(err);
    //         this.deriveHDAccounts(result.publicKey, result.chainCode, cb);
    //     })
    // }

    update() {
        // if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
        // const id = this.getId()
        // if (this.id !== id) { // Singer address representation changed
        //     store.removeSigner(this.id)
        //     this.id = id
        // }
        // store.updateSigner(this.summary())
    }

    // deviceStatus() {
    //     this.lookupAccounts((err, accounts) => {
    //         if (err) {
    //             if (err === 'Lattice Device is busy (lock getAddress)') {
    //                 this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
    //             } else {
    //                 this.status = 'loading'
    //                 this.accounts = []
    //                 this.index = 0
    //                 this.update()
    //             }
    //         } else if (accounts && accounts.length) {
    //             if (accounts[0] !== this.coinbase || this.status !== 'ok') {
    //                 this.coinbase = accounts[0]
    //                 this.accounts = accounts
    //                 if (this.index > accounts.length - 1) this.index = 0
    //                 this.deviceStatus()
    //             }
    //             if (accounts.length > this.accounts.length) this.accounts = accounts
    //             this.status = 'ok'
    //             this.update()
    //         } else {
    //             this.status = 'Unable to find accounts'
    //             this.accounts = []
    //             this.index = 0
    //             this.update()
    //         }
    //     })
    // }

    // deviceStatus (deep, limit = 15) {
    //   if (this.status === 'Invalid sequence') return
    //   this.pollStatus()
    //   if (this.pause) return
    //   this.lookupAccounts((err, accounts) => {
    //     let last = this.status
    //     if (err) {
    //       if (err.message.startsWith('cannot open device with path')) { // Device is busy, try again
    //         clearTimeout(this._deviceStatus)
    //         if (++this.busyCount > 10) {
    //           this.busyCount = 0
    //           return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
    //         } else {
    //           this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
    //           log.info('>>>>>>> Busy: cannot open device with path, will try again (deviceStatus)')
    //         }
    //       } else {
    //         this.status = err.message
    //         if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Lattice'
    //         if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Lattice'
    //         if (err.statusCode === 26625 || err.statusCode === 26628) {
    //           this.pollStatus(3000)
    //           this.status = 'Confirm your Lattice is not asleep and is running firmware v1.4.0+'
    //         }
    //         if (err.message === 'Cannot write to HID device') {
    //           this.status = 'loading'
    //           log.error('Device Status: Cannot write to HID device')
    //         }
    //         if (err.message === 'Invalid channel') {
    //           this.status = 'Set browser support to "NO"'
    //           log.error('Device Status: Invalid channel -> Make sure browser support is set to OFF')
    //         }
    //         if (err.message === 'Invalid sequence') this.invalid = true
    //         this.accounts = []
    //         this.index = 0
    //         if (this.status !== last) {
    //           this.update()
    //         }
    //       }
    //     } else if (accounts && accounts.length) {
    //       this.busyCount = 0
    //       if (accounts[0] !== this.coinbase || this.status !== 'ok') {
    //         this.coinbase = accounts[0]
    //         this.accounts = accounts
    //         if (this.index > accounts.length - 1) this.index = 0
    //         this.deviceStatus(true)
    //       }
    //       if (accounts.length > this.accounts.length) this.accounts = accounts
    //       this.status = 'ok'
    //       this.update()
    //     } else {
    //       this.busyCount = 0
    //       this.status = 'Unable to find accounts'
    //       this.accounts = []
    //       this.index = 0
    //       this.update()
    //     }
    //   })
    // }
    normalize(hex) {
        if (hex == null) return ''
        if (hex.startsWith('0x')) hex = hex.substring(2)
        if (hex.length % 2 !== 0) hex = '0' + hex
        return hex
    }

    hexToBuffer(hex) {
        return Buffer.from(this.normalize(hex), 'hex')
    }

    // Standard Methods
    signMessage(message, cb) {

        const data = {
            protocol: 'signPersonal',
            payload: message,
            signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0], //setup for other deviations
        }
        const signOpts = {
            currency: 'ETH_MSG',
            data: data,
        }

        client.sign(signOpts, (err, result) => {
            if (err) {
                log.error('signMessage Error')
                log.error(err)
                if (err.message === 'Unexpected message') err = new Error('Consult the lattice errors')
                cb(err)
            } else {
                cb(null, '0x' + result.signature)
            }
        })
    }

    signTransaction(rawTx, cb) {


        if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
        const unsignedTxn = {
            nonce: this.normalize(rawTx.nonce),
            gasPrice: this.normalize(rawTx.gasPrice),
            gasLimit: this.normalize(rawTx.gas),
            to: this.normalize(rawTx.to),
            value: this.normalize(rawTx.value),
            data: this.normalize(rawTx.data),
            chainId: networks[utils.hexToNumber(rawTx.chainId)], //might have to
            useEIP155: true,
            signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0],
        }

        const signOpts = {
            currency: 'ETH',
            data: unsignedTxn,
        }

        this.client.sign(signOpts, (err, result) => {
            console.log(`Signed Txn Error:`);
            console.log(err);
            if (err) return cb(err.message)
            const tx = new EthereumTx({
                nonce: this.hexToBuffer(rawTx.nonce),
                gasPrice: this.hexToBuffer(rawTx.gasPrice),
                gasLimit: this.hexToBuffer(rawTx.gas),
                to: this.hexToBuffer(rawTx.to),
                value: this.hexToBuffer(rawTx.value),
                data: this.hexToBuffer(rawTx.data),
                v: this.hexToBuffer(result.v),
                r: this.hexToBuffer(result.r),
                s: this.hexToBuffer(result.s)
            }, {chain: parseInt(rawTx.chainId)})
            cb(null, '0x' + tx.serialize().toString('hex'))
        })
    }
}

module.exports = Lattice
