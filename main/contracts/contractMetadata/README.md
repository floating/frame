# Contract Metadata

A collection of contract metadata to extract NatSpec from.

_Note:_ This folder should be migrated into an own repository or a fully
    decentralised solution like https://github.com/aragonone/metadata-dao

## Folder structure:

`/contractMetadata/${projectName}/${contractName}.json`

For example:

`/contractMetadata/openzeppelin-contracts/ERC20Detailed.json`

or:

`/contractMetadata/aragonOS/AragonApp.json`

## File structure:

It is one file per contract with the following content (minimal):

```json
{
    "contractName": "FooBar",
    "abi": [],
    "userdoc": {
        "methods": {
            "myMethod(address,uint256)": {
                "notice": "Some RadSpec expression"
            }
        }
    }
}
```

It is probably what `truffle compile` gives you anyways.

## Network-Address-Mapping

To actually find the according metadata file, there is a `mapping.json` file. 

_Hint:_ `truffle compile` adds a `networks` key into the metadata JSON. But we
ignore it, because it is possible to map multiple contracts in the same network
to the same contract/metadata. E.g. All ERC20 contracts should match the
`ERC20Detailed.json` metadata.