const windows = require('../../../windows')
const log = require('electron-log')
const utils = require('web3-utils')
const Client = require('gridplus-sdk').Client;
const EthereumTx = require('ethereumjs-tx')
const store = require('../../../store')
const Signer = require('../../Signer')
const crypto = require('crypto');
const promisify = require('util').promisify;
const HARDENED_OFFSET = 0x80000000;
const clientConfig = {
    name: 'Frame',
    crypto: crypto,
    privKey: null,
    timeout: 30000
}
function humanReadable(str) {
    for (let i = 0; i < str.length; i++)
        if (str.charCodeAt(i) < 0x0020 || str.charCodeAt(i) > 0x007f)
            return false;
    return true;
}

class Lattice extends Signer {
    constructor(device, signers) {
        super()
        this.signers = signers;
        log.info('Setting up Lattice device')
        this.device = device
        this.id = this.getId();
        this.accountLimit = store('main.lattice.accountLimit')
        clientConfig['baseUrl'] = store('main.lattice.endpoint');
        const frameSuffix = store('main.lattice.suffix');
        if (frameSuffix) clientConfig['name'] = `Frame-${frameSuffix}`;

        let password = store('main.lattice.password')
        if (!password) {
            password = crypto.randomBytes(32).toString('hex');
            store.setLatticePassword(password);
        }
        clientConfig['privKey'] = password;

        this.client = new Client(clientConfig);
        this.type = 'lattice'
        this.network = store('main.currentNetwork.id')
        this.status = 'loading'
        this.index = 0

        this.varObserver = store.observer(() => {
            if (
                this.network !== store('main.currentNetwork.id')
            ) {
                this.reset()
            }
        })

        this.deviceStatus()

    }

    getId() {
        return this.fingerprint() || 'Lattice-' + this.device.deviceID
    }

    async setPin(pin) {
        try {

            const clientPair = promisify(this.client.pair).bind(this.client);

            const hasActiveWallet = await clientPair(pin);

            if (hasActiveWallet) {
                await this.deriveAddresses();
                store.setLatticeDeviceID(this.device.deviceID);
            }
            return this.addresses;
        } catch (err) {
            return new Error(err);
        }
    }

    async open() {
        try {
            if (this.device.deviceID) {

                const clientConnect = promisify(this.client.connect).bind(this.client);

                const isPaired = await clientConnect(this.device.deviceID);

                if (isPaired) {
                    await this.deriveAddresses();
                }
                return [this.addresses, isPaired];
            }
        } catch (err) {
            return new Error(err);
        }
    }

    close() {
        if (this._pollStatus) clearTimeout(this._pollStatus)
        this.varObserver.remove()
        this.closed = true
        store.removeSigner(this.id)
        super.close()
    }
    async wait (time) {
        return new Promise(resolve => setTimeout(resolve, time))
    }
    async deriveAddresses() {

        try {
            const req = {
                currency: 'ETH',
                startPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0],
                n: this.accountLimit,
                skipCache: true
            };
            const getAddresses = promisify(this.client.getAddresses).bind(this.client);

            const result = await getAddresses(req);
            this.status = 'ok';
            this.addresses = result;
            this.update()
            return result;
        } catch (err) {
            //no active wallet return nothing
            return [];
        }

    }


    pollStatus (interval = 21 * 1000) { // Detect sleep/wake
        clearTimeout(this._pollStatus)
        this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
    }

    async deviceStatus () {
        this.pollStatus()
        if (this.deviceStatusActive || this.verifyActive) return
        this.deviceStatusActive = true
        try {
            // If signer has no addresses, try deriving them
            await this.deriveAddresses()
            this.deviceStatusActive = false
        } catch (err) {
            this.deviceStatusActive = false
        }
    }




    // This verifyAddress signature is no longer current
    async verifyAddress(index, current, display, cb = () => {
    }) {
        if (this.verifyActive) {
            log.info('verifyAddress Called but it\'s already active')
            return cb(new Error('verifyAddress Called but it\'s already active'))
        }
        if (this.pause) {
            log.info('Device access is paused')
            return cb(new Error('Device access is paused'))
        }
        this.verifyActive = true
        try {
            const result = await this.deriveAddresses()
            if (result && !result.length) {
                return cb(null, false)
            }
            const address = result[index].toLowerCase();
            current = current.toLowerCase()
            if (address !== current) {
                log.error(new Error('Address does not match device'))
                this.reset();
                this.signers.remove(this.id)
                cb(new Error('Address does not match device'))
            } else {
                log.info('Address matches device')
                cb(null, true)
            }
            this.verifyActive = false
        } catch (err) {
            log.error('Verify Address Error')
            log.error(err)
            this.signers.remove(this.id)
            cb(new Error('Verify Address Error'))
            this.verifyActive = false
        }
    }

    setIndex(i, cb) {
        this.index = i
        this.requests = {} // TODO Decline these requests before clobbering them
        windows.broadcast('main:action', 'updateSigner', this.summary())
        cb(null, this.summary())
        this.deriveAddresses()
    }

    update() {
        const id = this.getId();
        if (this.id !== id) { // Singer address representation changed
            store.removeSigner(this.id)
            this.id = id
        }
        store.updateSigner(this.summary())
    }

    async reset () {
        this.network = store('main.currentNetwork.id')
        this.status = 'loading'
        this.addresses = []
        windows.broadcast('main:action', 'updateSigner', this.summary())
        await this.deriveAddresses()
    }

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
    async signMessage(index, message, cb) {

        const asciiMessage = utils.hexToAscii(message)
        if (humanReadable(asciiMessage)) {
            message = asciiMessage;
        }

        try {
            const data = {
                protocol: 'signPersonal',
                payload: message,
                signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index], //setup for other deviations
            }
            const signOpts = {
                currency: 'ETH_MSG',
                data: data,
            }
            const clientSign = promisify(this.client.sign).bind(this.client);

            const result = await clientSign(signOpts);
            let v = result.sig.v.toString(16)
            if (v.length < 2) v = '0' + v
            const signature = '0x' + result.sig.r + result.sig.s + v

            return cb(null, signature);
        } catch (err) {
            return cb(new Error(err));
        }
    }

    async signTransaction(index, rawTx, cb) {
        try {
            if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
            const unsignedTxn = {
                nonce: utils.hexToNumber(rawTx.nonce),
                gasPrice: utils.hexToNumber(rawTx.gasPrice),
                gasLimit: utils.hexToNumber(rawTx.gas),
                to: rawTx.to,
                value: rawTx.value,
                data: rawTx.data || "0x",
                chainId: rawTx.chainId,
                useEIP155: true,
                signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index],
            }

            const signOpts = {
                currency: 'ETH',
                data: unsignedTxn,
            }
            const clientSign = promisify(this.client.sign).bind(this.client);
            const result = await clientSign(signOpts);

            const tx = new EthereumTx({
                nonce: this.hexToBuffer(rawTx.nonce),
                gasPrice: this.hexToBuffer(rawTx.gasPrice),
                gasLimit: this.hexToBuffer(rawTx.gas),
                to: this.hexToBuffer(rawTx.to),
                value: this.hexToBuffer(rawTx.value),
                data: this.hexToBuffer(rawTx.data),
                v: result.sig.v[0],
                r: this.hexToBuffer(result.sig.r),
                s: this.hexToBuffer(result.sig.s)
            }, {chain: parseInt(rawTx.chainId)})
            return cb(null, '0x' + tx.serialize().toString('hex'))
        } catch (err) {
            return cb(new Error(err));
        }
    }
}

module.exports = Lattice
