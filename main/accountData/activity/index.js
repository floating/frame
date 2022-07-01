// or

// https://api.etherscan.io/api?module=account&action=txlistinternal&address=0x2c1ba59d6f58433fb1eaee7d20b26ed83bda51a3&startblock=0&endblock=2702578&page=1&offset=10&sort=asc&apikey=YourApiKeyToken
// (To get paginated results use page=<page number> and offset=<max records to return>)

// Get "Internal Transactions" by Transaction Hash
// https://api.etherscan.io/api?module=account&action=txlistinternal&txhash=0x40eb908387324f2b575b4879cd9d7188f69c8fc9d87c901b9e2daaea4b442170&apikey=YourApiKeyToken
// (Returned 'isError' values: 0=Ok, 1=Rejected/Cancelled)

// (Returns a maximum of 10000 records only)

// Get "Internal Transactions" by Block Range
// https://api.etherscan.io/api?module=account&action=txlistinternal&startblock=0&endblock=2702578&page=1&offset=10&sort=asc&apikey=YourApiKeyToken
// (Returns a maximum of 10000 records only)

// Get a list of "ERC20 - Token Transfer Events" by Address
// [Optional Parameters] startblock: starting blockNo to retrieve results, endblock: ending blockNo to retrieve results

// (Returns a maximum of 10000 records only)

// or

// https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2&page=1&offset=100&sort=asc&apikey=YourApiKeyToken
// (To get paginated results use page=<page number> and offset=<max records to return>)

// or

// https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2&address=0x4e83362442b8d1bec281594cea3050c8eb01311c&page=1&offset=100&sort=asc&apikey=YourApiKeyToken
// (To get transfer events for a specific token contract, include the contractaddress parameter)

// Get a list of "ERC721 - Token Transfer Events" by Address
// [Optional Parameters] startblock: starting blockNo to retrieve results, endblock: ending blockNo to retrieve results

// https://api.etherscan.io/api?module=account&action=tokennfttx&address=0x6975be450864c02b4613023c2152ee0743572325&startblock=0&endblock=999999999&sort=asc&apikey=YourApiKeyToken
// (Returns a maximum of 10000 records only)

// or

// https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=0x06012c8cf97bead5deae237070f9587f8e7a266d&page=1&offset=100&sort=asc&apikey=YourApiKeyToken
// (To get paginated results use page=<page number> and offset=<max records to return>)

// or

// https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=0x06012c8cf97bead5deae237070f9587f8e7a266d&address=0x6975be450864c02b4613023c2152ee0743572325&page=1&offset=100&sort=asc&apikey=YourApiKeyToken
// (To get transfer events for a specific token contract, include the contractaddress parameter)

const apiKey = ''

const getNormalTransactions = (address) => {
  fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
  )
}

const getInternalTransactions = (address) => {
  fetch(
    `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
  )
}

const getERC20TransferEvents = (address) => {
  fetch(
    `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`
  )
}

const getERC721TransferEvents = (address) => {
  fetch(
    `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`
  )
}
