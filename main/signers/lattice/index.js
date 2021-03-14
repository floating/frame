const log = require('electron-log')
const flex = require('../../flex')
const windows = require('../../windows')
const LatticeDevice = require('./Lattice')

module.exports = (signers) => ({
    close: (device) => {
        if (signers[device.deviceID]) signers[device.deviceID].close()
        delete signers[device.deviceID]
    },
    open: (device, cb) => {
        const signer = new LatticeDevice(device);

        signer.open((accounts, isPaired) => {

            signers.signers[device.deviceID] = signer;
            signers.add(signer);
            cb(accounts, isPaired)
        });

    }
})
//flex.on('ready', () => {
//     flex.on('lattice:connect', device => {
//       log.info(':: lattice Scan - Connected Device')
//       close(device)
//       signers[device.id] = new LatticeDevice(device, api)
//     })
//     flex.on('lattice:disconnect', device => {
//       log.info(':: lattice Scan - Disconnected Device')
//       close(device)
//     })
//     flex.on('lattice:update', device => {
//       log.info(':: lattice Scan - Updated Device')
//       if (signers[device.id]) signers[device.id].update(device)
//     })
//   })
// module.exports = (signers, api) => {
//   log.info(' ')
//   log.info('lattice BLE Scaner Started...')
//   flex.on('lattice:scan:failed', err => {
//     if (err) log.error(err)
//     setTimeout(() => {
//       flex.synthetic('lattice.scan', (err, res) => console.log(err, res))
//     }, 5000)
//   })
//   // ipcMain.on('bluetooth-select-device', (devices) => {
//   //   console.log('bluetooth-select-device')
//   //   console.log(devices)
//   // })
//   const scan = () => {
//     log.info('lattice BLE Scan Started')
//     flex.rpc('lattice.current', (err, current) => {
//       if (err) return log.error(err)
//       console.log('lattice.current')
//       log.info('We found some BLE signers...', current)
//
//       // Remove all signers no longer connected
//       Object.keys(signers).forEach(id => {
//         if (signers.type === 'latticeBLE' && !current[id]) {
//           log.info('Removing BLE lattice: ', id)
//           signers[id].close()
//           delete signers[id]
//         }
//       })
//       // Add all newly added signers
//       Object.keys(current).forEach(id => {
//         if (signers[id]) {
//           signers[id].deviceStatus()
//           return log.info('Updating lattice: ', id)
//         }
//         let lattice
//         log.info('Adding New lattice: ', id)
//         try {
//           lattice = new lattice(current[id], api)
//         } catch (e) {
//           return log.error(e)
//         }
//         log.info('  > lattice Created: ', id)
//         signers[id] = lattice
//       })
//       log.info(' ')
//     })
//   }
//
//   // Do initial pair in chome and then use noble?
//
//   flex.on('ready', () => {
//     flex.synthetic('lattice.scan', (err, res) => console.log(err, res))
//     flex.on('lattice:device:added', scan)
//     flex.on('lattice:device:removed', scan)
//     scan()
//   })
// }
