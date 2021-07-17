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
exports.__esModule = true;
var coingecko_1 = __importDefault(require("../coingecko"));
var electron_log_1 = __importDefault(require("electron-log"));
function byMarketCap(coin1, coin2) {
    return coin2.market_cap - coin1.market_cap;
}
function loadCoinData(allCoins, symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var defaultMarket, ids, referenceData, sorted, coin, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaultMarket = {
                        symbol: symbol,
                        id: symbol.toLowerCase(),
                        name: symbol.toUpperCase(),
                        image: undefined,
                        current_price: 0,
                        price_change_percentage_24h: 0
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    ids = allCoins
                        .filter(function (coin) { return coin.symbol.toLowerCase() === symbol.toLowerCase(); })
                        .map(function (coin) { return coin.id; });
                    if (!(ids.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, coingecko_1["default"].listMarkets(ids)];
                case 2:
                    referenceData = _a.sent();
                    sorted = referenceData.sort(byMarketCap);
                    coin = sorted.length > 0 ? sorted[0] : defaultMarket;
                    if (coin.name === 'Ethereum')
                        coin.name = 'Ether';
                    return [2 /*return*/, coin];
                case 3: return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    electron_log_1["default"].error("could not load coin data for " + symbol, e_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, defaultMarket];
            }
        });
    });
}
function load(symbols) {
    return __awaiter(this, void 0, void 0, function () {
        var data, allCoins, _i, symbols_1, symbol, coinData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = {};
                    return [4 /*yield*/, coingecko_1["default"].listCoins()];
                case 1:
                    allCoins = _a.sent();
                    _i = 0, symbols_1 = symbols;
                    _a.label = 2;
                case 2:
                    if (!(_i < symbols_1.length)) return [3 /*break*/, 5];
                    symbol = symbols_1[_i];
                    return [4 /*yield*/, loadCoinData(allCoins, symbol)];
                case 3:
                    coinData = _a.sent();
                    data[symbol] = {
                        icon: coinData.image,
                        name: coinData.name,
                        usd: {
                            price: coinData.current_price || 0,
                            change24hr: coinData.price_change_percentage_24h || 0
                        }
                    };
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, data];
            }
        });
    });
}
exports["default"] = load;
