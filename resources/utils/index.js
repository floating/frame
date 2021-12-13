"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gweiToWeiHex = exports.weiHexToGweiInt = exports.hexToInt = exports.intToHex = exports.gweiToHex = exports.gweiToWei = exports.weiToHex = exports.weiToGwei = exports.capitalize = exports.randomLetters = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
Object.defineProperty(exports, "intToHex", { enumerable: true, get: function () { return ethereumjs_util_1.intToHex; } });
const weiToGwei = (wei) => wei / 1e9;
exports.weiToGwei = weiToGwei;
const weiToHex = (wei) => (0, ethereumjs_util_1.addHexPrefix)(wei.toString(16));
exports.weiToHex = weiToHex;
const gweiToWei = (gwei) => gwei * 1e9;
exports.gweiToWei = gweiToWei;
const gweiToHex = (gwei) => weiToHex(gwei * 1e9);
exports.gweiToHex = gweiToHex;
const hexToInt = (hexStr) => parseInt(hexStr, 16);
exports.hexToInt = hexToInt;
const weiHexToGweiInt = (weiHex) => hexToInt(weiHex) / 1e9;
exports.weiHexToGweiInt = weiHexToGweiInt;
const gweiToWeiHex = (gwei) => (0, ethereumjs_util_1.intToHex)(gweiToWei(gwei));
exports.gweiToWeiHex = gweiToWeiHex;
function randomLetters(num) {
    return [...Array(num)].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
}
exports.randomLetters = randomLetters;
function capitalize(s) {
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
}
exports.capitalize = capitalize;
