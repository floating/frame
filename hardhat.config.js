require("@nomiclabs/hardhat-waffle");

const { utils } = require('ethers')


 task("send-test-tx", "send a test transaction", async (taskArgs, hre) => {
  // const tx = {
  //   nonce: utils.parseUnits('276', 'wei').toHexString(),
  //   value: utils.parseEther('.0002').toHexString(),
  //   from: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
  //   to: '0xc2b7414087311645b586517a4860c404a7104301',
  //   data: '0x',
  //   gasLimit: '0x5208',
  //   chainId: '0x4',
  //   type: '0x2',
  // }
  
  // const signer = await hre.ethers.getSigner('0x22dd63c3619818fdbc262c78baee43cb61e9cccf');

  // console.log(signer)

  // const result = await signer.sendTransaction(tx)

  // console.log(({ result }))
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, world!");
  await greeter.deployed();
});

module.exports = {
  defaultNetwork: "arbitrum",
  networks: {
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
