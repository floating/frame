require("@nomiclabs/hardhat-waffle");

const { utils } = require('ethers')
const ethProvider = require('eth-provider')


task("send-eip1559-tx", "send a test EIP-1559 transaction", async (taskArgs, hre) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('request timed out!')), 10 * 1000)

    const eth = ethProvider()
  
    const tx = {
      value: utils.parseEther('.0002').toHexString(),
      from: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
      to: '0x5837ec9a54f71B6be9a304115CcDE7a07b666438',
      data: '0x',
      gasLimit: '0x5208',
      chainId: '0x4',
      type: '0x2',
    }
    
    resolve(eth.request({ method: 'eth_sendTransaction', params: [tx], id: 2 })).then(txHash => {
      console.log(`success! tx hash: ${txHash}`)
      return txHash
    })
  })
});

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {

    },
    arbitrum: {
      url: 'http://localhost:1248',
      gasPrice: 0,
    },
  },
  // networks: {
  //   hardhat: {
  //   },
  //   rinkeby: {
  //     httpHeaders: {origin: 'hardhat'},
  //     //url: "https://rinkeby.infura.io/v3/3bdcf18b1c0d4aa19b258a6f2b975a75",
  //     url: 'http://localhost:1248',
  //     accounts: ['b438238ec6636570363031396d6f6f8cdb21581ba6c3c68bfc7525b527c0bc73'],
  //     gasPrice: 0
  //   }
  // },
  solidity: "0.8.4",
}
