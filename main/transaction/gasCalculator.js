"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var ethereumjs_util_1 = require("ethereumjs-util");
var electron_log_1 = __importDefault(require("electron-log"));
var oneGwei = 1e9;
function rpcPayload(method, params, id) {
    if (id === void 0) { id = 1; }
    return {
        method: method,
        params: params,
        id: id,
        jsonrpc: '2.0'
    };
}
var GasCalculator = /** @class */ (function () {
    function GasCalculator(connection /* Chains */, defaultGasLevel) {
        this.connection = connection;
        this.defaultGasLevel = defaultGasLevel;
    }
    GasCalculator.prototype.getGasPrice = function (rawTx) {
        return this.defaultGasLevel;
    };
    GasCalculator.prototype.getGasEstimate = function (rawTx) {
        return __awaiter(this, void 0, void 0, function () {
            var targetChain;
            var _this = this;
            return __generator(this, function (_a) {
                targetChain = {
                    type: 'ethereum',
                    id: rawTx.chainId
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var payload = rpcPayload('eth_estimateGas', [rawTx]);
                        _this.connection.send(payload, function (response) {
                            if (response.error) {
                                reject(response.error);
                            }
                            else {
                                resolve(response.result);
                            }
                        }, targetChain);
                    })];
            });
        });
    };
    GasCalculator.prototype._getFeeHistory = function (numBlocks, rewardPercentiles, newestBlock) {
        if (newestBlock === void 0) { newestBlock = 'latest'; }
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            var _this = this;
            return __generator(this, function (_a) {
                payload = rpcPayload('eth_feeHistory', [numBlocks, newestBlock, rewardPercentiles]);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.connection.send(payload, function (response) {
                            if (response.error)
                                return reject();
                            var feeHistoryBlocks = response.result.baseFeePerGas.map(function (baseFee, i) {
                                return {
                                    baseFee: parseInt(baseFee, 16),
                                    gasUsedRatio: response.result.gasUsedRatio[i],
                                    rewards: (response.result.reward[i] || []).map(function (reward) { return parseInt(reward, 16); })
                                };
                            });
                            resolve(feeHistoryBlocks);
                        });
                    })];
            });
        });
    };
    GasCalculator.prototype.getFeePerGas = function () {
        return __awaiter(this, void 0, void 0, function () {
            var blocks, nextBlockFee, calculatedFee, eligibleRewardsBlocks, medianReward, e_1, defaultGas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._getFeeHistory(10, [10])
                            // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
                        ];
                    case 1:
                        blocks = _a.sent();
                        nextBlockFee = blocks[blocks.length - 1].baseFee // base fee for next block
                        ;
                        calculatedFee = Math.ceil(nextBlockFee * 1.125 * 1.125);
                        eligibleRewardsBlocks = blocks.filter(function (block) { return block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9; }).map(function (block) { return block.rewards[0]; });
                        medianReward = eligibleRewardsBlocks.sort()[Math.floor(eligibleRewardsBlocks.length / 2)] || oneGwei;
                        return [2 /*return*/, {
                                maxBaseFeePerGas: ethereumjs_util_1.intToHex(calculatedFee),
                                maxPriorityFeePerGas: ethereumjs_util_1.intToHex(medianReward)
                            }];
                    case 2:
                        e_1 = _a.sent();
                        defaultGas = { maxBaseFeePerGas: this.defaultGasLevel, maxPriorityFeePerGas: ethereumjs_util_1.intToHex(oneGwei) };
                        electron_log_1.default.warn('could not load fee history, using default', defaultGas);
                        return [2 /*return*/, defaultGas];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return GasCalculator;
}());
exports.default = GasCalculator;
