"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var ethereumjs_util_1 = require("ethereumjs-util");
var tx_1 = require("@ethereumjs/tx");
var common_1 = __importDefault(require("@ethereumjs/common"));
// TODO: how do we determine these chain configs in real time?
var chains = {
    1: new common_1["default"]({ chain: 'mainnet', hardfork: 'berlin' }),
    3: new common_1["default"]({ chain: 'ropsten', hardfork: 'london', eips: [1559] }),
    4: new common_1["default"]({ chain: 'ropsten', hardfork: 'london', eips: [1559] })
};
function getChainConfig(chainId, hardfork) {
    if (hardfork === void 0) { hardfork = 'london'; }
    var chainConfig = chains[chainId];
    if (!chainConfig) {
        if (common_1["default"].isSupportedChainId(new ethereumjs_util_1.BN(chainId))) {
            chainConfig = new common_1["default"]({ chain: chainId, hardfork: hardfork });
        }
        else {
            chainConfig = common_1["default"].forCustomChain('mainnet', { chainId: chainId });
        }
    }
    return chainConfig;
}
function createTransaction(rawTx) {
    var chainId = parseInt(rawTx.chainId);
    var chainConfig = getChainConfig(chainId);
    var tx = tx_1.TransactionFactory.fromTxData(rawTx, { common: chainConfig });
    if (tx.supports(tx_1.Capability.EIP1559FeeMarket)) {
        // TODO: do we need to do anything here?
    }
    return tx;
}
exports["default"] = createTransaction;
