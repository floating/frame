const IPFS = require('ipfs-http-client')

const run = async () => {
  const ipfs = IPFS('localhost', '5001')
  const result = await ipfs.get('/ipfs/Qmb3YhQqgvZ49AqK9LkbsQaMm5uJTBgZYcV4sW8eBCehdY/index.html')
  console.log(result)
}

run()
