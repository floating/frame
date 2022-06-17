const {
  default: TrezorConnect,
  UI_EVENT,
  DEVICE_EVENT,
  CORE_EVENT,
  TRANSPORT_EVENT,
  BLOCKCHAIN_EVENT,
  UI
} = require('trezor-connect')

const readline = require('readline')

async function getInput () {
  return new Promise(resolve => {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    reader.on('line', line => {
      console.log('INPUT', line)
      resolve(line.trim())
    })
  })
}

function timeElapsed(start, end) {
  const diff = end - start

  if (diff < (1000 * 60)) {
    return `${Math.ceil(diff / 1000)}s`
  }

  const mins = Math.floor(diff/(1000*60))
  const secs = Math.ceil((diff%(60*1000)/1000))

  return `${mins}m ${secs}s`
}

async function connect () {
  const startTime = new Date()
  const manifest = { email: 'jordan@frame.sh', appUrl: 'https://frame.sh' }
  const config = { manifest, popup: false, webusb: false, debug: false, lazyLoad: false }
  TrezorConnect.on(CORE_EVENT, e => {
    try {
      console.debug(`[${timeElapsed(startTime, new Date())}] Trezor core event`, e)
    } catch (err) {
      console.error('ERROR', err)
    }
  })
  TrezorConnect.on(BLOCKCHAIN_EVENT, e => {
    try {
      console.debug(`[${timeElapsed(startTime, new Date())}] Trezor blockchain event`, e)
    } catch (err) {
      console.error('ERROR', err)
    }
  })
  TrezorConnect.on(TRANSPORT_EVENT, e => {
    try {
      console.debug(`[${timeElapsed(startTime, new Date())}] Trezor transport event`, e)
    } catch (err) {
      console.error('ERROR', err)
    }
  })

  TrezorConnect.on(DEVICE_EVENT, e => {
    try {
      const { type, event, payload } = e
      const { type: payloadType, status, state, mode } = payload
      console.debug(`[${timeElapsed(startTime, new Date())}] Trezor device event`, { event, type, payloadType, status, state, mode })
    } catch (err) {
      console.error('ERROR', err)
    }
  })

  TrezorConnect.on(UI_EVENT, async e => {
    try {
      const { event, type, payload } = e
      const { type: payloadType, status, state, mode } = (payload || {}).device || {}
      console.debug(`[${timeElapsed(startTime, new Date())}] Trezor UI event`, { event, type, payloadType, status, state, mode })

      if (e.type === UI.REQUEST_PIN) {
        console.log('input pin:')
        const pin = await getInput()

        console.log({ pin })

        TrezorConnect.uiResponse({
          type: UI.RECEIVE_PIN,
          payload: pin
        })
      }
      
      if (e.type === UI.REQUEST_PASSPHRASE) {
        console.log('input passphrase:')
        const phrase = await getInput()

        TrezorConnect.uiResponse({
          type: UI.RECEIVE_PASSPHRASE,
          payload: { value: phrase }
        })
        // const device = this.devices[e.payload.device.path]

        // if (device) {
        //   const capabilities = (device.device.features || {}).capabilities || []

          //if (capabilities.includes('Capability_PassphraseEntry')) {
            
      }
    } catch (err) {
      console.error('ERROR', err)
    }
  })
   await TrezorConnect.init(config)

  //const features = await TrezorConnect.getFeatures()
  //console.log({ features })


  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  reader.on('line', line => {
    const command = line.trim() || ''
    if (command.toLowerCase() === 'address') {
      console.log('*** GETTING ADDRESS ***')
      TrezorConnect.ethereumGetAddress({ path: "m/44'/1'/0'/0/0", showOnTrezor: false }).then(address => console.log({ address }))
    }
  })

  //console.log('ENTER PIN: ')
  //const pin = await getInput()

  //TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin })
}

connect()
