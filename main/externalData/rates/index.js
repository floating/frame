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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var electron_log_1 = __importDefault(require("electron-log"));
var coingecko_1 = require("../coingecko");
var FETCH_BATCH_SIZE = 200;
// { symbol: coinId }
var allCoins;
// { chainId: platformId }
var allPlatforms;
function createRate(quote) {
    return {
        usd: {
            price: new bignumber_js_1.default(quote.usd || 0),
            change24hr: new bignumber_js_1.default(quote.usd_24h_change || 0)
        }
    };
}
function coins() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, allCoins || loadCoins()];
        });
    });
}
function assetPlatforms() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, allPlatforms || loadPlatforms()];
        });
    });
}
function loadCoins() {
    return __awaiter(this, void 0, void 0, function () {
        var coins_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    return [4 /*yield*/, coingecko_1.listCoins()];
                case 1:
                    coins_1 = _a.sent();
                    allCoins = coins_1.reduce(function (coinMapping, coin) {
                        coinMapping[coin.symbol.toLowerCase()] = coin.id;
                        return coinMapping;
                    }, {});
                    return [2 /*return*/, allCoins];
                case 2:
                    e_1 = _a.sent();
                    electron_log_1.default.error('unable to load coin data', e_1);
                    return [3 /*break*/, 4];
                case 3:
                    setTimeout(loadCoins, 60 * 1000);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function loadPlatforms() {
    return __awaiter(this, void 0, void 0, function () {
        var platforms, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    return [4 /*yield*/, coingecko_1.listAssetPlatforms()];
                case 1:
                    platforms = _a.sent();
                    allPlatforms = platforms.reduce(function (platformMapping, platform) {
                        var _a;
                        if (platform.chain_identifier) {
                            var chainId = platform.chain_identifier.toString();
                            return __assign(__assign({}, platformMapping), (_a = {}, _a[chainId] = platform.id, _a));
                        }
                        return platformMapping;
                    }, {});
                    return [2 /*return*/, allPlatforms];
                case 2:
                    e_2 = _a.sent();
                    electron_log_1.default.error('unable to load asset platform data', e_2);
                    return [3 /*break*/, 4];
                case 3:
                    setTimeout(loadPlatforms, 60 * 1000);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchRates(fetch, ids, params) {
    if (params === void 0) { params = []; }
    return __awaiter(this, void 0, void 0, function () {
        var batches, responses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    batches = Object.keys(__spreadArray([], Array(Math.ceil(ids.length / FETCH_BATCH_SIZE))))
                        .map(function (batch) {
                        var batchNumber = Number(batch);
                        return ids.slice((batchNumber * FETCH_BATCH_SIZE), (batchNumber * FETCH_BATCH_SIZE) + FETCH_BATCH_SIZE);
                    });
                    return [4 /*yield*/, Promise.all(batches.map(function (batch) { return fetch.apply(void 0, __spreadArray([batch], params)); }))];
                case 1:
                    responses = _a.sent();
                    return [2 /*return*/, Object.assign.apply(Object, __spreadArray([{}], responses))];
            }
        });
    });
}
var fetchPrices = function (ids) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, fetchRates(coingecko_1.coinPrices, ids)];
}); }); };
var fetchTokenPrices = function (addresses, platform) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, fetchRates(coingecko_1.tokenPrices, addresses, [platform])];
}); }); };
function loadRates(ids, chainId) {
    return __awaiter(this, void 0, void 0, function () {
        var platforms, coinMapping, lookupIds, symbolQuotes, tokenQuotes, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, assetPlatforms()];
                case 1:
                    platforms = _a.sent();
                    return [4 /*yield*/, coins()
                        // lookupIds: { symbols: { [id]: symbol }, contracts: [address, ...] }
                    ];
                case 2:
                    coinMapping = _a.sent();
                    lookupIds = ids.reduce(function (lookups, rawId) {
                        var _a;
                        // if id is a known symbol, use the CoinGecko id, otherwise it's
                        // a contract address and can be looked up directly
                        var id = rawId.toLowerCase();
                        var symbolId = coinMapping[id];
                        if (symbolId) {
                            lookups.symbols = __assign(__assign({}, lookups.symbols), (_a = {}, _a[symbolId] = id, _a));
                        }
                        else {
                            lookups.contracts = __spreadArray(__spreadArray([], lookups.contracts), [id]);
                        }
                        return lookups;
                    }, { contracts: [], symbols: {} });
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, fetchPrices(Object.keys(lookupIds.symbols))];
                case 4:
                    symbolQuotes = _a.sent();
                    return [4 /*yield*/, fetchTokenPrices(lookupIds.contracts, platforms[chainId.toString()] || 'ethereum')];
                case 5:
                    tokenQuotes = _a.sent();
                    return [2 /*return*/, Object.entries(__assign(__assign({}, symbolQuotes), tokenQuotes)).reduce(function (rates, _a) {
                            var lookupId = _a[0], quote = _a[1];
                            var originalId = lookupIds.symbols[lookupId] || lookupId; // could be symbol or contract address
                            rates[originalId] = createRate(quote);
                            return rates;
                        }, {})];
                case 6:
                    e_3 = _a.sent();
                    throw new Error("unable to load latest rates: " + e_3.message);
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.default = loadRates;
