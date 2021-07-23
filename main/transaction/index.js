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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = exports.populate = void 0;
var ethereumjs_util_1 = require("ethereumjs-util");
var tx_1 = require("@ethereumjs/tx");
var config_1 = require("../../main/chains/config");
function toBN(hexStr) {
    return new ethereumjs_util_1.BN(ethereumjs_util_1.stripHexPrefix(hexStr), 'hex');
}
function populate(rawTx, chainConfig, gasCalculator) {
    return __awaiter(this, void 0, void 0, function () {
        var txData, _a, _b, e_1, maxPriorityFee, maxBaseFee, _c, maxFee, gasPrice;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    txData = __assign(__assign({}, rawTx), { maxFee: '' });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    _a = txData;
                    _b = txData.gasLimit;
                    if (_b) return [3 /*break*/, 3];
                    return [4 /*yield*/, gasCalculator.getGasEstimate(rawTx)];
                case 2:
                    _b = (_d.sent());
                    _d.label = 3;
                case 3:
                    _a.gasLimit = _b;
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _d.sent();
                    txData.gasLimit = '0x0';
                    txData.warning = e_1.message;
                    return [3 /*break*/, 5];
                case 5:
                    if (!chainConfig.isActivatedEIP(1559)) return [3 /*break*/, 7];
                    console.log('london hardfork active!');
                    txData.type = '0x2';
                    maxPriorityFee = toBN(gasCalculator.getMaxPriorityFeePerGas(rawTx));
                    _c = toBN;
                    return [4 /*yield*/, gasCalculator.getMaxBaseFeePerGas(rawTx)];
                case 6:
                    maxBaseFee = _c.apply(void 0, [_d.sent()]);
                    maxFee = maxPriorityFee.add(maxBaseFee);
                    txData.maxPriorityFeePerGas = ethereumjs_util_1.bnToHex(maxPriorityFee);
                    txData.maxFeePerGas = ethereumjs_util_1.bnToHex(maxFee);
                    txData.maxFee = txData.maxFeePerGas;
                    return [3 /*break*/, 8];
                case 7:
                    console.log('london hardfork NOT active!');
                    txData.type = '0x0';
                    gasPrice = toBN(gasCalculator.getGasPrice(rawTx));
                    txData.gasPrice = ethereumjs_util_1.bnToHex(gasPrice);
                    txData.maxFee = ethereumjs_util_1.bnToHex(toBN(txData.gasLimit).mul(gasPrice));
                    _d.label = 8;
                case 8: return [2 /*return*/, txData];
            }
        });
    });
}
exports.populate = populate;
function hexifySignature(_a) {
    var v = _a.v, r = _a.r, s = _a.s;
    return {
        v: ethereumjs_util_1.addHexPrefix(v),
        r: ethereumjs_util_1.addHexPrefix(r),
        s: ethereumjs_util_1.addHexPrefix(s)
    };
}
function sign(rawTx, signingFn) {
    return __awaiter(this, void 0, void 0, function () {
        var common, tx;
        return __generator(this, function (_a) {
            common = config_1.chainConfig(rawTx.chainId, parseInt(rawTx.type) === 2 ? 'london' : 'berlin');
            tx = tx_1.TransactionFactory.fromTxData(rawTx, { common: common });
            return [2 /*return*/, signingFn(tx).then(function (sig) {
                    var signature = hexifySignature(sig);
                    return tx_1.Transaction.fromTxData(__assign(__assign({}, rawTx), signature), 
                    // @ts-ignore
                    { common: common });
                })];
        });
    });
}
exports.sign = sign;
