const provider = require('eth-provider')
const frame = provider('frame')

test('Failing Transaction (Mainnet)', async () => {
  try {
    await frame.request({
      method: 'eth_sendTransaction',
      params: [
        {
          value: '0x341a0691d617740',
          from: (await frame.request({ method: 'eth_requestAccounts' }))[0],
          to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          data: '0xfb3bdb41000000000000000000000000000000000000000000000001158e460913d000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000b120c885f1527394c78d50e7c7da57defb24f612000000000000000000000000000000000000000000000000000000006020d2560000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984',
          chainId: '0x1',
          gasPrice: '0x2a9ba66600'
        }
      ]
    })
    frame.close()
    return false
  } catch (e) {
    frame.close()
    return Boolean(e)
  }
})
