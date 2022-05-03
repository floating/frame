module.exports = {
  "testTimeout": 100,
  "roots": [
    "test"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "<rootDir>/test/e2e/",
    "<rootDir>/test/main/signers/ledger/adapter"    
  ],
  "testTimeout": 15000,
}
