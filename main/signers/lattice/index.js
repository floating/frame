const windows = require("../../windows");

const store = require('../../store')
const LatticeDevice = require('./Lattice')

const openConnect = async (device, signers) => {
    const signer = new LatticeDevice(device, signers);
    // signers.signers[`Lattice-${device.deviceID}`] = signer;
    windows.broadcast('main:action', 'addSigner', signer.summary())
    const response = await signer.open();
    signers.add(signer);
    return response;
}

module.exports = (signers) => ({
    scan: () => {
        const deviceID = store('main.lattice.deviceID');
        if (deviceID) {
            openConnect({deviceID}, signers)
        }
    },
    pair: async () => {

    },
    open: async (device) => {
        return await openConnect(device, signers)

    }
})
