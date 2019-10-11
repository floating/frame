const express = require('express')
const ipfs = require('../../clients/Ipfs')

const app = express()

app.get('/ipfs/*', async (req, res) => {
  const path = req.params[0]
  console.log('Servering', path)
  const result = await ipfs.api.get(path)
  res.write(result[0].content)
  res.end()
})

app.listen(8421)
