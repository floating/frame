"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.sign = exports.createTransaction = void 0;
var ethereumjs_util_1 = require("ethereumjs-util");
var tx_1 = require("@ethereumjs/tx");
var common_1 = __importDefault(require("@ethereumjs/common"));
// TODO: how do we determine these chain configs in real time?
var chains = {
    1: new common_1["default"]({ chain: 'mainnet', hardfork: 'berlin' }),
    3: new common_1["default"]({ chain: 'ropsten', hardfork: 'london', eips: [1559] }),
    4: new common_1["default"]({ chain: 'rinkeby', hardfork: 'london', eips: [1559] }),
    5: new common_1["default"]({ chain: 'goerli', hardfork: 'london', eips: [1559] })
};
function getChainConfig(chainId, hardfork) {
    if (hardfork === void 0) { hardfork = 'london'; }
    var chainConfig = chains[chainId];
    if (!chainConfig) {
        if (common_1["default"].isSupportedChainId(new ethereumjs_util_1.BN(chainId))) {
            chainConfig = new common_1["default"]({ chain: chainId, hardfork: hardfork });
        }
        else {
            chainConfig = common_1["default"].forCustomChain('mainnet', { chainId: chainId }, hardfork);
        }
    }
    return chainConfig;
}
function createTransaction(rawTx) {
    var chainId = parseInt(rawTx.chainId);
    var chainConfig = getChainConfig(chainId);
    // TODO: maybe pass in block number and use 
    //    chainConfig.hardforkIsActiveOnBlock('london', blockNum)
    return tx_1.TransactionFactory.fromTxData(__assign(__assign({}, rawTx), { type: chainConfig.isActivatedEIP(1559) ? '0x2' : '0x0' }), { common: chainConfig });
}
exports.createTransaction = createTransaction;
var hexPrefix = function (s) { return s.startsWith('0x') ? s : "0x" + s; };
function hexifySignature(_a) {
    var v = _a.v, r = _a.r, s = _a.s;
    console.log({ v: v, hex: v.toString('hex') });
    return {
        v: hexPrefix(v),
        r: hexPrefix(r),
        s: hexPrefix(s)
    };
}
function sign(rawTx, signingFn) {
    return __awaiter(this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            tx = tx_1.TransactionFactory.fromTxData(rawTx);
            return [2 /*return*/, signingFn(tx).then(function (sig) {
                    console.log({ sig: sig });
                    var signature = hexifySignature(sig);
                    return tx_1.Transaction.fromTxData(__assign(__assign({}, rawTx), signature));
                })];
        });
    });
}
exports.sign = sign;
