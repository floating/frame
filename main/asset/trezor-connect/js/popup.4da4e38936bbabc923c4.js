(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["TrezorConnect"] = factory();
	else
		root["TrezorConnect"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "./";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 864);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(74);


/***/ }),

/***/ 1:
/***/ (function(module, exports) {

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;

/***/ }),

/***/ 11:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export TrezorError */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w", function() { return invalidParameter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return NO_IFRAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return IFRAME_BLOCKED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return IFRAME_INITIALIZED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return IFRAME_TIMEOUT; });
/* unused harmony export POPUP_TIMEOUT */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return BROWSER_NOT_SUPPORTED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return MANIFEST_NOT_SET; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "q", function() { return NO_TRANSPORT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "v", function() { return WRONG_TRANSPORT_CONFIG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return DEVICE_NOT_FOUND; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return DEVICE_CALL_IN_PROGRESS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return INVALID_PARAMETERS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "s", function() { return POPUP_CLOSED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "r", function() { return PERMISSIONS_NOT_GRANTED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return DEVICE_USED_ELSEWHERE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return INITIALIZATION_FAILED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return CALL_OVERRIDE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return INVALID_STATE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "u", function() { return WRONG_PREVIOUS_SESSION_ERROR_MESSAGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return INVALID_PIN_ERROR_MESSAGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "t", function() { return WEBUSB_ERROR_MESSAGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BACKEND_NO_URL; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return NO_COIN_INFO; });
/* harmony import */ var _babel_runtime_helpers_inheritsLoose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _babel_runtime_helpers_inheritsLoose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_inheritsLoose__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_wrapNativeSuper__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(92);
/* harmony import */ var _babel_runtime_helpers_wrapNativeSuper__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_wrapNativeSuper__WEBPACK_IMPORTED_MODULE_1__);




var TrezorError =
/*#__PURE__*/
function (_Error) {
  _babel_runtime_helpers_inheritsLoose__WEBPACK_IMPORTED_MODULE_0___default()(TrezorError, _Error);

  function TrezorError(code, message) {
    var _this;

    _this = _Error.call(this, message) || this;
    _this.code = code;
    _this.message = message;
    return _this;
  }

  return TrezorError;
}(_babel_runtime_helpers_wrapNativeSuper__WEBPACK_IMPORTED_MODULE_1___default()(Error));
var invalidParameter = function invalidParameter(message) {
  return new TrezorError('Connect_InvalidParameter', message);
}; // level 100 error during initialization

var NO_IFRAME = new TrezorError(100, 'TrezorConnect not yet initialized');
var IFRAME_BLOCKED = new TrezorError('iframe_blocked', 'TrezorConnect iframe was blocked');
var IFRAME_INITIALIZED = new TrezorError(101, 'TrezorConnect has been already initialized');
var IFRAME_TIMEOUT = new TrezorError(102, 'Iframe timeout');
var POPUP_TIMEOUT = new TrezorError(103, 'Popup timeout');
var BROWSER_NOT_SUPPORTED = new TrezorError(104, 'Browser not supported');
var MANIFEST_NOT_SET = new TrezorError(105, 'Manifest not set. Read more at https://github.com/trezor/connect/blob/develop/docs/index.md');
var NO_TRANSPORT = new TrezorError(500, 'Transport is missing');
var WRONG_TRANSPORT_CONFIG = new TrezorError(5002, 'Wrong config response'); // config_signed

var DEVICE_NOT_FOUND = new TrezorError(501, 'Device not found'); // export const DEVICE_CALL_IN_PROGRESS: TrezorError = new TrezorError(502, "Device call in progress.");

var DEVICE_CALL_IN_PROGRESS = new TrezorError(503, 'Device call in progress');
var INVALID_PARAMETERS = new TrezorError(504, 'Invalid parameters');
var POPUP_CLOSED = new Error('Popup closed');
var PERMISSIONS_NOT_GRANTED = new TrezorError(403, 'Permissions not granted');
var DEVICE_USED_ELSEWHERE = new TrezorError(700, 'Device is used in another window');
var INITIALIZATION_FAILED = new TrezorError('Failure_Initialize', 'Initialization failed');
var CALL_OVERRIDE = new TrezorError('Failure_ActionOverride', 'override');
var INVALID_STATE = new TrezorError('Failure_PassphraseState', 'Passphrase is incorrect'); // a slight hack
// this error string is hard-coded
// in both bridge and extension

var WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = 'wrong previous session';
var INVALID_PIN_ERROR_MESSAGE = 'PIN invalid';
var WEBUSB_ERROR_MESSAGE = 'NetworkError: Unable to claim interface.'; // BlockBook

var BACKEND_NO_URL = new TrezorError('Backend_init', 'Url not found');
var NO_COIN_INFO = invalidParameter('Coin not found.');

/***/ }),

/***/ 13:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return cloneCoinInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return getBitcoinNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return getEthereumNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return getMiscNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return getSegwitNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return getBech32Network; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return fixCoinInfoNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return getCoinInfoByHash; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return getCoinInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return getCoinName; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return parseCoinsJson; });
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);


var bitcoinNetworks = [];
var ethereumNetworks = [];
var miscNetworks = [];
var cloneCoinInfo = function cloneCoinInfo(ci) {
  return JSON.parse(JSON.stringify(ci));
};
var getBitcoinNetwork = function getBitcoinNetwork(pathOrName) {
  var networks = cloneCoinInfo(bitcoinNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name || n.label.toLowerCase() === name;
    });
  } else {
    var slip44 = Object(_utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__[/* fromHardened */ "a"])(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};
var getEthereumNetwork = function getEthereumNetwork(pathOrName) {
  var networks = cloneCoinInfo(ethereumNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name;
    });
  } else {
    var slip44 = Object(_utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__[/* fromHardened */ "a"])(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};
var getMiscNetwork = function getMiscNetwork(pathOrName) {
  var networks = cloneCoinInfo(miscNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name;
    });
  } else {
    var slip44 = Object(_utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__[/* fromHardened */ "a"])(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};
/*
* Bitcoin networks
*/

var getSegwitNetwork = function getSegwitNetwork(coin) {
  if (coin.segwit && typeof coin.xPubMagicSegwit === 'number') {
    return _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, coin.network, {
      bip32: _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, coin.network.bip32, {
        public: coin.xPubMagicSegwit
      })
    });
  }

  return null;
};
var getBech32Network = function getBech32Network(coin) {
  if (coin.segwit && typeof coin.xPubMagicSegwitNative === 'number') {
    return _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, coin.network, {
      bip32: _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, coin.network.bip32, {
        public: coin.xPubMagicSegwitNative
      })
    });
  }

  return null;
}; // fix coinInfo network values from path (segwit/legacy)

var fixCoinInfoNetwork = function fixCoinInfoNetwork(ci, path) {
  var coinInfo = cloneCoinInfo(ci);

  if (path[0] === Object(_utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__[/* toHardened */ "m"])(49)) {
    var segwitNetwork = getSegwitNetwork(coinInfo);

    if (segwitNetwork) {
      coinInfo.network = segwitNetwork;
    }
  } else {
    coinInfo.segwit = false;
  }

  return coinInfo;
};

var detectBtcVersion = function detectBtcVersion(data) {
  if (data.subversion == null) {
    return 'btc';
  }

  if (data.subversion.startsWith('/Bitcoin ABC')) {
    return 'bch';
  }

  if (data.subversion.startsWith('/Bitcoin Gold')) {
    return 'btg';
  }

  return 'btc';
};

var getCoinInfoByHash = function getCoinInfoByHash(hash, networkInfo) {
  var networks = cloneCoinInfo(bitcoinNetworks);
  var result = networks.find(function (info) {
    return hash.toLowerCase() === info.hashGenesisBlock.toLowerCase();
  });

  if (!result) {
    throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock);
  }

  if (result.isBitcoin) {
    var btcVersion = detectBtcVersion(networkInfo);
    var fork;

    if (btcVersion === 'bch') {
      fork = networks.find(function (info) {
        return info.name === 'Bcash';
      });
    } else if (btcVersion === 'btg') {
      fork = networks.find(function (info) {
        return info.name === 'Bgold';
      });
    }

    if (fork) {
      return fork;
    } else {
      throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock + ' BTC version:' + btcVersion);
    }
  }

  return result;
};
var getCoinInfo = function getCoinInfo(currency) {
  var coinInfo = getBitcoinNetwork(currency);

  if (!coinInfo) {
    coinInfo = getEthereumNetwork(currency);
  }

  if (!coinInfo) {
    coinInfo = getMiscNetwork(currency);
  }

  return coinInfo;
};
var getCoinName = function getCoinName(path) {
  var slip44 = Object(_utils_pathUtils__WEBPACK_IMPORTED_MODULE_1__[/* fromHardened */ "a"])(path[1]);

  for (var _i = 0; _i < ethereumNetworks.length; _i++) {
    var network = ethereumNetworks[_i];

    if (network.slip44 === slip44) {
      return network.name;
    }
  }

  return 'Unknown coin';
};

var parseBitcoinNetworksJson = function parseBitcoinNetworksJson(json) {
  var coinsObject = json;
  Object.keys(coinsObject).forEach(function (key) {
    var coin = coinsObject[key];
    var shortcut = coin.coin_shortcut;
    var isBitcoin = shortcut === 'BTC' || shortcut === 'TEST';
    var hasTimestamp = shortcut === 'CPC';
    var network = {
      messagePrefix: coin.signed_message_header,
      bech32: coin.bech32_prefix,
      bip32: {
        public: coin.xpub_magic,
        private: coin.xprv_magic
      },
      pubKeyHash: coin.address_type,
      scriptHash: coin.address_type_p2sh,
      wif: 0x80,
      // doesn't matter, for type correctness
      dustThreshold: 0,
      // doesn't matter, for type correctness,
      coin: shortcut.toLowerCase()
    };
    bitcoinNetworks.push({
      type: 'bitcoin',
      // address_type in Network
      // address_type_p2sh in Network
      // bech32_prefix in Network
      // bip115: not used
      bitcore: coin.bitcore,
      blockbook: coin.blockbook,
      blockchainLink: null,
      blocktime: Math.round(coin.blocktime_seconds / 60),
      cashAddrPrefix: coin.cashaddr_prefix,
      label: coin.coin_label,
      name: coin.coin_name,
      shortcut: shortcut,
      // cooldown no used
      curveName: coin.curve_name,
      decred: coin.decred,
      defaultFees: coin.default_fee_b,
      dustLimit: coin.dust_limit,
      forceBip143: coin.force_bip143,
      forkid: coin.fork_id,
      // github not used
      hashGenesisBlock: coin.hash_genesis_block,
      // key not used
      // maintainer not used
      maxAddressLength: coin.max_address_length,
      maxFeeSatoshiKb: coin.maxfee_kb,
      minAddressLength: coin.min_address_length,
      minFeeSatoshiKb: coin.minfee_kb,
      // name: same as coin_label
      segwit: coin.segwit,
      // signed_message_header in Network
      slip44: coin.slip44,
      support: coin.support,
      // uri_prefix not used
      // version_group_id not used
      // website not used
      // xprv_magic in Network
      xPubMagic: coin.xpub_magic,
      xPubMagicSegwitNative: coin.xpub_magic_segwit_native,
      xPubMagicSegwit: coin.xpub_magic_segwit_p2sh,
      // custom
      network: network,
      // bitcoinjs network
      isBitcoin: isBitcoin,
      hasTimestamp: hasTimestamp,
      maxFee: Math.round(coin.maxfee_kb / 1000),
      minFee: Math.round(coin.minfee_kb / 1000),
      // used in backend ?
      blocks: Math.round(coin.blocktime_seconds / 60)
    });
  });
};

var parseEthereumNetworksJson = function parseEthereumNetworksJson(json) {
  var networksObject = json;
  Object.keys(networksObject).forEach(function (key) {
    var network = networksObject[key];
    ethereumNetworks.push({
      type: 'ethereum',
      blockbook: network.blockbook || [],
      bitcore: [],
      // legacy compatibility with bitcoin coinInfo
      blockchainLink: null,
      chain: network.chain,
      chainId: network.chain_id,
      // key not used
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      rskip60: network.rskip60,
      slip44: network.slip44,
      support: network.support,
      // url not used
      network: undefined
    });
  });
};

var parseMiscNetworksJSON = function parseMiscNetworksJSON(json) {
  var networksObject = json;
  Object.keys(networksObject).forEach(function (key) {
    var network = networksObject[key];
    miscNetworks.push({
      type: 'misc',
      blockbook: network.blockbook || [],
      // legacy compatibility with bitcoin coinInfo
      bitcore: [],
      // legacy compatibility with bitcoin coinInfo
      blockchainLink: network.blockchain_link,
      curve: network.curve,
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      slip44: network.slip44,
      support: network.support,
      network: undefined
    });
  });
};

var parseCoinsJson = function parseCoinsJson(json) {
  var coinsObject = json;
  Object.keys(coinsObject).forEach(function (key) {
    switch (key) {
      case 'bitcoin':
        return parseBitcoinNetworksJson(coinsObject[key]);

      case 'eth':
        return parseEthereumNetworksJson(coinsObject[key]);

      case 'misc':
      case 'nem':
        return parseMiscNetworksJSON(coinsObject[key]);
    }
  });
};

/***/ }),

/***/ 135:
/***/ (function(module, exports) {

function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;

/***/ }),

/***/ 136:
/***/ (function(module, exports) {

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

module.exports = _isNativeFunction;

/***/ }),

/***/ 137:
/***/ (function(module, exports, __webpack_require__) {

var setPrototypeOf = __webpack_require__(87);

function isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    module.exports = _construct = Reflect.construct;
  } else {
    module.exports = _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

module.exports = _construct;

/***/ }),

/***/ 15:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DataManager; });
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils_networkUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(27);
/* harmony import */ var _utils_browser__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(47);
/* harmony import */ var _data_ConnectSettings__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(51);
/* harmony import */ var _CoinInfo__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(13);
/* harmony import */ var _FirmwareInfo__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(68);
/* harmony import */ var es6_promise__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(152);
/* harmony import */ var es6_promise__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(es6_promise__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var parse_uri__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(153);
/* harmony import */ var parse_uri__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(parse_uri__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var bowser__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(23);
/* harmony import */ var bowser__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(bowser__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var semver_compare__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(35);
/* harmony import */ var semver_compare__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(semver_compare__WEBPACK_IMPORTED_MODULE_11__);















// TODO: transform json to flow typed object
var parseConfig = function parseConfig(json) {
  var config = json;
  return config;
};

var DataManager =
/*#__PURE__*/
function () {
  function DataManager() {}

  DataManager.load =
  /*#__PURE__*/
  function () {
    var _load = _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()(
    /*#__PURE__*/
    _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(settings) {
      var ts, configUrl, config, isLocalhost, whitelist, knownHost, _iterator, _isArray, _i, _ref, asset, json, _iterator2, _isArray2, _i2, _ref2, protobuf, _json, browserName;

      return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              ts = settings.timestamp;
              configUrl = settings.configSrc + "?r=" + ts;
              _context.prev = 2;
              this.settings = settings;
              _context.next = 6;
              return Object(_utils_networkUtils__WEBPACK_IMPORTED_MODULE_3__[/* httpRequest */ "b"])(configUrl, 'json');

            case 6:
              config = _context.sent;
              this.config = parseConfig(config); // check if origin is localhost or trusted

              isLocalhost = typeof window !== 'undefined' ? window.location.hostname === 'localhost' : true;
              whitelist = DataManager.isWhitelisted(this.settings.origin || '');
              this.settings.trustedHost = (isLocalhost || !!whitelist) && !this.settings.popup; // ensure that popup will be used

              if (!this.settings.trustedHost) {
                this.settings.popup = true;
              } // ensure that debug is disabled


              if (this.settings.debug && !this.settings.trustedHost && !whitelist) {
                this.settings.debug = false;
              }

              this.settings.priority = DataManager.getPriority(whitelist);
              knownHost = DataManager.getHostLabel(this.settings.extension || this.settings.origin || '');

              if (knownHost) {
                this.settings.hostLabel = knownHost.label;
                this.settings.hostIcon = knownHost.icon;
              }

              _iterator = this.config.assets, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();

            case 17:
              if (!_isArray) {
                _context.next = 23;
                break;
              }

              if (!(_i >= _iterator.length)) {
                _context.next = 20;
                break;
              }

              return _context.abrupt("break", 34);

            case 20:
              _ref = _iterator[_i++];
              _context.next = 27;
              break;

            case 23:
              _i = _iterator.next();

              if (!_i.done) {
                _context.next = 26;
                break;
              }

              return _context.abrupt("break", 34);

            case 26:
              _ref = _i.value;

            case 27:
              asset = _ref;
              _context.next = 30;
              return Object(_utils_networkUtils__WEBPACK_IMPORTED_MODULE_3__[/* httpRequest */ "b"])(asset.url + "?r=" + ts, asset.type || 'json');

            case 30:
              json = _context.sent;
              this.assets[asset.name] = json;

            case 32:
              _context.next = 17;
              break;

            case 34:
              _iterator2 = this.config.messages, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();

            case 35:
              if (!_isArray2) {
                _context.next = 41;
                break;
              }

              if (!(_i2 >= _iterator2.length)) {
                _context.next = 38;
                break;
              }

              return _context.abrupt("break", 52);

            case 38:
              _ref2 = _iterator2[_i2++];
              _context.next = 45;
              break;

            case 41:
              _i2 = _iterator2.next();

              if (!_i2.done) {
                _context.next = 44;
                break;
              }

              return _context.abrupt("break", 52);

            case 44:
              _ref2 = _i2.value;

            case 45:
              protobuf = _ref2;
              _context.next = 48;
              return Object(_utils_networkUtils__WEBPACK_IMPORTED_MODULE_3__[/* httpRequest */ "b"])(protobuf.json + "?r=" + ts, 'json');

            case 48:
              _json = _context.sent;
              this.messages[protobuf.name] = _json;

            case 50:
              _context.next = 35;
              break;

            case 52:
              // hotfix webusb + chrome:72, allow webextensions
              if (this.settings.popup && this.settings.webusb && this.settings.env !== 'webextension') {
                browserName = bowser__WEBPACK_IMPORTED_MODULE_10__["name"].toLowerCase();

                if (browserName === 'chrome' || browserName === 'chromium') {
                  if (semver_compare__WEBPACK_IMPORTED_MODULE_11___default()(bowser__WEBPACK_IMPORTED_MODULE_10__["version"], '72') >= 0) {
                    this.settings.webusb = false;
                  }
                }
              } // parse bridge JSON


              this.assets['bridge'] = Object(_utils_browser__WEBPACK_IMPORTED_MODULE_4__[/* parseBridgeJSON */ "b"])(this.assets['bridge']); // parse coins definitions

              Object(_CoinInfo__WEBPACK_IMPORTED_MODULE_6__[/* parseCoinsJson */ "k"])(this.assets['coins']); // parse firmware definitions

              Object(_FirmwareInfo__WEBPACK_IMPORTED_MODULE_7__[/* parseFirmware */ "c"])(this.assets['firmware-t1']);
              Object(_FirmwareInfo__WEBPACK_IMPORTED_MODULE_7__[/* parseFirmware */ "c"])(this.assets['firmware-t2']);
              _context.next = 62;
              break;

            case 59:
              _context.prev = 59;
              _context.t0 = _context["catch"](2);
              throw _context.t0;

            case 62:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[2, 59]]);
    }));

    function load(_x) {
      return _load.apply(this, arguments);
    }

    return load;
  }();

  DataManager.findMessages = function findMessages(model, fw) {
    var messages = this.config.messages.find(function (m) {
      var min = m.range.min[model];
      var max = m.range.max ? m.range.max[model] : fw;
      return semver_compare__WEBPACK_IMPORTED_MODULE_11___default()(fw, min) >= 0 && semver_compare__WEBPACK_IMPORTED_MODULE_11___default()(fw, max) <= 0;
    });
    return this.messages[messages ? messages.name : 'default'];
  };

  DataManager.getMessages = function getMessages(name) {
    return this.messages[name || 'default'];
  };

  DataManager.isWhitelisted = function isWhitelisted(origin) {
    if (!this.config) return null;
    var uri = parse_uri__WEBPACK_IMPORTED_MODULE_9___default()(origin);

    if (uri && typeof uri.host === 'string') {
      var parts = uri.host.split('.');

      if (parts.length > 2) {
        // subdomain
        uri.host = parts.slice(parts.length - 2, parts.length).join('.');
      }

      return this.config.whitelist.find(function (item) {
        return item.origin === origin || item.origin === uri.host;
      });
    }
  };

  DataManager.getPriority = function getPriority(whitelist) {
    if (whitelist) {
      return whitelist.priority;
    }

    return _data_ConnectSettings__WEBPACK_IMPORTED_MODULE_5__[/* DEFAULT_PRIORITY */ "a"];
  };

  DataManager.getHostLabel = function getHostLabel(origin) {
    return this.config.knownHosts.find(function (host) {
      return host.origin === origin;
    });
  };

  DataManager.getSettings = function getSettings(key) {
    if (!this.settings) return null;

    if (typeof key === 'string') {
      return this.settings[key];
    }

    return this.settings;
  };

  DataManager.getDebugSettings = function getDebugSettings(type) {
    return false;
  };

  DataManager.getConfig = function getConfig() {
    return this.config;
  };

  DataManager.getLatestBridgeVersion = function getLatestBridgeVersion() {
    return DataManager.assets.bridge;
  };

  return DataManager;
}();

_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2___default()(DataManager, "assets", {});

_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2___default()(DataManager, "messages", {});



/***/ }),

/***/ 152:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, global) {/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   v4.2.5+7f2b526d
 */

(function (global, factory) {
	 true ? module.exports = factory() :
	undefined;
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  var type = typeof x;
  return x !== null && (type === 'object' || type === 'function');
}

function isFunction(x) {
  return typeof x === 'function';
}



var _isArray = void 0;
if (Array.isArray) {
  _isArray = Array.isArray;
} else {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
}

var isArray = _isArray;

var len = 0;
var vertxNext = void 0;
var customSchedulerFn = void 0;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var vertx = Function('return this')().require('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = void 0;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && "function" === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;


  if (_state) {
    var callback = arguments[_state - 1];
    asap(function () {
      return invokeCallback(_state, child, callback, parent._result);
    });
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(2);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var TRY_CATCH_ERROR = { error: null };

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    TRY_CATCH_ERROR.error = error;
    return TRY_CATCH_ERROR;
  }
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return resolve(promise, value);
    }, function (reason) {
      return reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === TRY_CATCH_ERROR) {
      reject(promise, TRY_CATCH_ERROR.error);
      TRY_CATCH_ERROR.error = null;
    } else if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;


  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = void 0,
      callback = void 0,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = void 0,
      error = void 0,
      succeeded = void 0,
      failed = void 0;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    fulfill(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch (e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

var Enumerator = function () {
  function Enumerator(Constructor, input) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop);

    if (!this.promise[PROMISE_ID]) {
      makePromise(this.promise);
    }

    if (isArray(input)) {
      this.length = input.length;
      this._remaining = input.length;

      this._result = new Array(this.length);

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate(input);
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, validationError());
    }
  }

  Enumerator.prototype._enumerate = function _enumerate(input) {
    for (var i = 0; this._state === PENDING && i < input.length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
    var c = this._instanceConstructor;
    var resolve$$1 = c.resolve;


    if (resolve$$1 === resolve$1) {
      var _then = getThen(entry);

      if (_then === then && entry._state !== PENDING) {
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof _then !== 'function') {
        this._remaining--;
        this._result[i] = entry;
      } else if (c === Promise$1) {
        var promise = new c(noop);
        handleMaybeThenable(promise, entry, _then);
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c(function (resolve$$1) {
          return resolve$$1(entry);
        }), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
    var promise = this.promise;


    if (promise._state === PENDING) {
      this._remaining--;

      if (state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = value;
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
    var enumerator = this;

    subscribe(promise, undefined, function (value) {
      return enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
      return enumerator._settledAt(REJECTED, i, reason);
    });
  };

  return Enumerator;
}();

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {Function} resolver
  Useful for tooling.
  @constructor
*/

var Promise$1 = function () {
  function Promise(resolver) {
    this[PROMISE_ID] = nextId();
    this._result = this._state = undefined;
    this._subscribers = [];

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise ? initializePromise(this, resolver) : needsNew();
    }
  }

  /**
  The primary way of interacting with a promise is through its `then` method,
  which registers callbacks to receive either a promise's eventual value or the
  reason why the promise cannot be fulfilled.
   ```js
  findUser().then(function(user){
    // user is available
  }, function(reason){
    // user is unavailable, and you are given the reason why
  });
  ```
   Chaining
  --------
   The return value of `then` is itself a promise.  This second, 'downstream'
  promise is resolved with the return value of the first promise's fulfillment
  or rejection handler, or rejected if the handler throws an exception.
   ```js
  findUser().then(function (user) {
    return user.name;
  }, function (reason) {
    return 'default name';
  }).then(function (userName) {
    // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    // will be `'default name'`
  });
   findUser().then(function (user) {
    throw new Error('Found user, but still unhappy');
  }, function (reason) {
    throw new Error('`findUser` rejected and we're unhappy');
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
  });
  ```
  If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
   ```js
  findUser().then(function (user) {
    throw new PedagogicalException('Upstream error');
  }).then(function (value) {
    // never reached
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // The `PedgagocialException` is propagated all the way down to here
  });
  ```
   Assimilation
  ------------
   Sometimes the value you want to propagate to a downstream promise can only be
  retrieved asynchronously. This can be achieved by returning a promise in the
  fulfillment or rejection handler. The downstream promise will then be pending
  until the returned promise is settled. This is called *assimilation*.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // The user's comments are now available
  });
  ```
   If the assimliated promise rejects, then the downstream promise will also reject.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // If `findCommentsByAuthor` fulfills, we'll have the value here
  }, function (reason) {
    // If `findCommentsByAuthor` rejects, we'll have the reason here
  });
  ```
   Simple Example
  --------------
   Synchronous Example
   ```javascript
  let result;
   try {
    result = findResult();
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
  findResult(function(result, err){
    if (err) {
      // failure
    } else {
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findResult().then(function(result){
    // success
  }, function(reason){
    // failure
  });
  ```
   Advanced Example
  --------------
   Synchronous Example
   ```javascript
  let author, books;
   try {
    author = findAuthor();
    books  = findBooksByAuthor(author);
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
   function foundBooks(books) {
   }
   function failure(reason) {
   }
   findAuthor(function(author, err){
    if (err) {
      failure(err);
      // failure
    } else {
      try {
        findBoooksByAuthor(author, function(books, err) {
          if (err) {
            failure(err);
          } else {
            try {
              foundBooks(books);
            } catch(reason) {
              failure(reason);
            }
          }
        });
      } catch(error) {
        failure(err);
      }
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findAuthor().
    then(findBooksByAuthor).
    then(function(books){
      // found books
  }).catch(function(reason){
    // something went wrong
  });
  ```
   @method then
  @param {Function} onFulfilled
  @param {Function} onRejected
  Useful for tooling.
  @return {Promise}
  */

  /**
  `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
  as the catch block of a try/catch statement.
  ```js
  function findAuthor(){
  throw new Error('couldn't find that author');
  }
  // synchronous
  try {
  findAuthor();
  } catch(reason) {
  // something went wrong
  }
  // async with promises
  findAuthor().catch(function(reason){
  // something went wrong
  });
  ```
  @method catch
  @param {Function} onRejection
  Useful for tooling.
  @return {Promise}
  */


  Promise.prototype.catch = function _catch(onRejection) {
    return this.then(null, onRejection);
  };

  /**
    `finally` will be invoked regardless of the promise's fate just as native
    try/catch/finally behaves
  
    Synchronous example:
  
    ```js
    findAuthor() {
      if (Math.random() > 0.5) {
        throw new Error();
      }
      return new Author();
    }
  
    try {
      return findAuthor(); // succeed or fail
    } catch(error) {
      return findOtherAuther();
    } finally {
      // always runs
      // doesn't affect the return value
    }
    ```
  
    Asynchronous example:
  
    ```js
    findAuthor().catch(function(reason){
      return findOtherAuther();
    }).finally(function(){
      // author was either found, or not
    });
    ```
  
    @method finally
    @param {Function} callback
    @return {Promise}
  */


  Promise.prototype.finally = function _finally(callback) {
    var promise = this;
    var constructor = promise.constructor;

    if (isFunction(callback)) {
      return promise.then(function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      }, function (reason) {
        return constructor.resolve(callback()).then(function () {
          throw reason;
        });
      });
    }

    return promise.then(callback, callback);
  };

  return Promise;
}();

Promise$1.prototype.then = then;
Promise$1.all = all;
Promise$1.race = race;
Promise$1.resolve = resolve$1;
Promise$1.reject = reject$1;
Promise$1._setScheduler = setScheduler;
Promise$1._setAsap = setAsap;
Promise$1._asap = asap;

/*global self*/
function polyfill() {
  var local = void 0;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }

  var P = local.Promise;

  if (P) {
    var promiseToString = null;
    try {
      promiseToString = Object.prototype.toString.call(P.resolve());
    } catch (e) {
      // silently ignored
    }

    if (promiseToString === '[object Promise]' && !P.cast) {
      return;
    }
  }

  local.Promise = Promise$1;
}

// Strange compat..
Promise$1.polyfill = polyfill;
Promise$1.Promise = Promise$1;

return Promise$1;

})));



//# sourceMappingURL=es6-promise.map

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(33), __webpack_require__(28)))

/***/ }),

/***/ 153:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function parseURI (str, opts) {
  opts = opts || {}

  var o = {
    key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  }

  var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str)
  var uri = {}
  var i = 14

  while (i--) uri[o.key[i]] = m[i] || ''

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}


/***/ }),

/***/ 17:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BOOTSTRAP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return LOADED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return INIT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return EXTENSION_USB_PERMISSIONS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return HANDSHAKE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return CLOSED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return CANCEL_POPUP_REQUEST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return CLOSE_WINDOW; });
var BOOTSTRAP = 'popup-bootstrap'; // Message from popup.js to window.opener, called after "window.onload" event. This is second message from popup to window.opener.

var LOADED = 'popup-loaded'; // Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.

var INIT = 'popup-init'; // Error message from popup to window.opener. Could be thrown during popup initialization process (POPUP.INIT)

var ERROR = 'popup-error'; // Message to webextensions, opens "trezor-usb-permission.html" within webextension

var EXTENSION_USB_PERMISSIONS = 'open-usb-permissions'; // Message called from both [popup > iframe] then [popup > iframe > popup] in this exact order.
// Firstly popup call iframe to resolve popup promise in Core
// Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup

var HANDSHAKE = 'popup-handshake'; // Event emitted from PopupManager at the end of popup closing process.
// Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available

var CLOSED = 'popup-closed'; // Message called from iframe to popup, it means that popup will not be needed (example: Blockchain methods are not using popup at all)
// This will close active popup window and/or clear opening process in PopupManager (maybe popup wasn't opened yet)

var CANCEL_POPUP_REQUEST = 'ui-cancel-popup-request'; // Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event

var CLOSE_WINDOW = 'window.close';

/***/ }),

/***/ 2:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TRANSPORT", function() { return TRANSPORT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BOOTLOADER", function() { return BOOTLOADER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INITIALIZE", function() { return INITIALIZE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SEEDLESS", function() { return SEEDLESS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FIRMWARE_OLD", function() { return FIRMWARE_OLD; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FIRMWARE_OUTDATED", function() { return FIRMWARE_OUTDATED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FIRMWARE_NOT_SUPPORTED", function() { return FIRMWARE_NOT_SUPPORTED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FIRMWARE_NOT_COMPATIBLE", function() { return FIRMWARE_NOT_COMPATIBLE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DEVICE_NEEDS_BACKUP", function() { return DEVICE_NEEDS_BACKUP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BROWSER_NOT_SUPPORTED", function() { return BROWSER_NOT_SUPPORTED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BROWSER_OUTDATED", function() { return BROWSER_OUTDATED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_BROWSER", function() { return RECEIVE_BROWSER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_UI_WINDOW", function() { return REQUEST_UI_WINDOW; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CLOSE_UI_WINDOW", function() { return CLOSE_UI_WINDOW; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_PERMISSION", function() { return REQUEST_PERMISSION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_CONFIRMATION", function() { return REQUEST_CONFIRMATION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_PIN", function() { return REQUEST_PIN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INVALID_PIN", function() { return INVALID_PIN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_PASSPHRASE", function() { return REQUEST_PASSPHRASE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_PASSPHRASE_ON_DEVICE", function() { return REQUEST_PASSPHRASE_ON_DEVICE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INVALID_PASSPHRASE", function() { return INVALID_PASSPHRASE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INVALID_PASSPHRASE_ACTION", function() { return INVALID_PASSPHRASE_ACTION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONNECT", function() { return CONNECT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOADING", function() { return LOADING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SET_OPERATION", function() { return SET_OPERATION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SELECT_DEVICE", function() { return SELECT_DEVICE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SELECT_ACCOUNT", function() { return SELECT_ACCOUNT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SELECT_FEE", function() { return SELECT_FEE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "UPDATE_CUSTOM_FEE", function() { return UPDATE_CUSTOM_FEE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INSUFFICIENT_FUNDS", function() { return INSUFFICIENT_FUNDS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_BUTTON", function() { return REQUEST_BUTTON; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_PERMISSION", function() { return RECEIVE_PERMISSION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_CONFIRMATION", function() { return RECEIVE_CONFIRMATION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_PIN", function() { return RECEIVE_PIN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_PASSPHRASE", function() { return RECEIVE_PASSPHRASE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_DEVICE", function() { return RECEIVE_DEVICE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CHANGE_ACCOUNT", function() { return CHANGE_ACCOUNT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_ACCOUNT", function() { return RECEIVE_ACCOUNT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECEIVE_FEE", function() { return RECEIVE_FEE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CHANGE_SETTINGS", function() { return CHANGE_SETTINGS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CUSTOM_MESSAGE_REQUEST", function() { return CUSTOM_MESSAGE_REQUEST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CUSTOM_MESSAGE_RESPONSE", function() { return CUSTOM_MESSAGE_RESPONSE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOGIN_CHALLENGE_REQUEST", function() { return LOGIN_CHALLENGE_REQUEST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOGIN_CHALLENGE_RESPONSE", function() { return LOGIN_CHALLENGE_RESPONSE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BUNDLE_PROGRESS", function() { return BUNDLE_PROGRESS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ADDRESS_VALIDATION", function() { return ADDRESS_VALIDATION; });
var TRANSPORT = 'ui-no_transport';
var BOOTLOADER = 'ui-device_bootloader_mode';
var INITIALIZE = 'ui-device_not_initialized';
var SEEDLESS = 'ui-device_seedless';
var FIRMWARE_OLD = 'ui-device_firmware_old';
var FIRMWARE_OUTDATED = 'ui-device_firmware_outdated';
var FIRMWARE_NOT_SUPPORTED = 'ui-device_firmware_unsupported';
var FIRMWARE_NOT_COMPATIBLE = 'ui-device_firmware_not_compatible';
var DEVICE_NEEDS_BACKUP = 'ui-device_needs_backup';
var BROWSER_NOT_SUPPORTED = 'ui-browser_not_supported';
var BROWSER_OUTDATED = 'ui-browser_outdated';
var RECEIVE_BROWSER = 'ui-receive_browser';
var REQUEST_UI_WINDOW = 'ui-request_window';
var CLOSE_UI_WINDOW = 'ui-close_window';
var REQUEST_PERMISSION = 'ui-request_permission';
var REQUEST_CONFIRMATION = 'ui-request_confirmation';
var REQUEST_PIN = 'ui-request_pin';
var INVALID_PIN = 'ui-invalid_pin';
var REQUEST_PASSPHRASE = 'ui-request_passphrase';
var REQUEST_PASSPHRASE_ON_DEVICE = 'ui-request_passphrase_on_device';
var INVALID_PASSPHRASE = 'ui-invalid_passphrase';
var INVALID_PASSPHRASE_ACTION = 'ui-invalid_passphrase_action';
var CONNECT = 'ui-connect';
var LOADING = 'ui-loading';
var SET_OPERATION = 'ui-set_operation';
var SELECT_DEVICE = 'ui-select_device';
var SELECT_ACCOUNT = 'ui-select_account';
var SELECT_FEE = 'ui-select_fee';
var UPDATE_CUSTOM_FEE = 'ui-update_custom_fee';
var INSUFFICIENT_FUNDS = 'ui-insufficient_funds';
var REQUEST_BUTTON = 'ui-button';
var RECEIVE_PERMISSION = 'ui-receive_permission';
var RECEIVE_CONFIRMATION = 'ui-receive_confirmation';
var RECEIVE_PIN = 'ui-receive_pin';
var RECEIVE_PASSPHRASE = 'ui-receive_passphrase';
var RECEIVE_DEVICE = 'ui-receive_device';
var CHANGE_ACCOUNT = 'ui-change_account';
var RECEIVE_ACCOUNT = 'ui-receive_account';
var RECEIVE_FEE = 'ui-receive_fee';
var CHANGE_SETTINGS = 'ui-change_settings';
var CUSTOM_MESSAGE_REQUEST = 'ui-custom_request';
var CUSTOM_MESSAGE_RESPONSE = 'ui-custom_response';
var LOGIN_CHALLENGE_REQUEST = 'ui-login_challenge_request';
var LOGIN_CHALLENGE_RESPONSE = 'ui-login_challenge_response';
var BUNDLE_PROGRESS = 'ui-bundle_progress';
var ADDRESS_VALIDATION = 'ui-address_validation';

/***/ }),

/***/ 20:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return CORE_EVENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return UI_EVENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return DEVICE_EVENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return TRANSPORT_EVENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return RESPONSE_EVENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BLOCKCHAIN_EVENT; });


var CORE_EVENT = 'CORE_EVENT';
var UI_EVENT = 'UI_EVENT';
var DEVICE_EVENT = 'DEVICE_EVENT';
var TRANSPORT_EVENT = 'TRANSPORT_EVENT';
var RESPONSE_EVENT = 'RESPONSE_EVENT';
var BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';

/***/ }),

/***/ 212:
/***/ (function(module, exports) {

module.exports = function() {
	throw new Error("define cannot be used indirect");
};


/***/ }),

/***/ 23:
/***/ (function(module, exports, __webpack_require__) {

/*!
 * Bowser - a browser detector
 * https://github.com/ded/bowser
 * MIT License | (c) Dustin Diaz 2015
 */

!function (root, name, definition) {
  if ( true && module.exports) module.exports = definition()
  else if (true) __webpack_require__(212)(name, definition)
  else {}
}(this, 'bowser', function () {
  /**
    * See useragents.js for examples of navigator.userAgent
    */

  var t = true

  function detect(ua) {

    function getFirstMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[1]) || '';
    }

    function getSecondMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[2]) || '';
    }

    var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
      , likeAndroid = /like android/i.test(ua)
      , android = !likeAndroid && /android/i.test(ua)
      , nexusMobile = /nexus\s*[0-6]\s*/i.test(ua)
      , nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua)
      , chromeos = /CrOS/.test(ua)
      , silk = /silk/i.test(ua)
      , sailfish = /sailfish/i.test(ua)
      , tizen = /tizen/i.test(ua)
      , webos = /(web|hpw)(o|0)s/i.test(ua)
      , windowsphone = /windows phone/i.test(ua)
      , samsungBrowser = /SamsungBrowser/i.test(ua)
      , windows = !windowsphone && /windows/i.test(ua)
      , mac = !iosdevice && !silk && /macintosh/i.test(ua)
      , linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua)
      , edgeVersion = getSecondMatch(/edg([ea]|ios)\/(\d+(\.\d+)?)/i)
      , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
      , tablet = /tablet/i.test(ua) && !/tablet pc/i.test(ua)
      , mobile = !tablet && /[^-]mobi/i.test(ua)
      , xbox = /xbox/i.test(ua)
      , result

    if (/opera/i.test(ua)) {
      //  an old Opera
      result = {
        name: 'Opera'
      , opera: t
      , version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
      }
    } else if (/opr\/|opios/i.test(ua)) {
      // a new Opera
      result = {
        name: 'Opera'
        , opera: t
        , version: getFirstMatch(/(?:opr|opios)[\s\/](\d+(\.\d+)?)/i) || versionIdentifier
      }
    }
    else if (/SamsungBrowser/i.test(ua)) {
      result = {
        name: 'Samsung Internet for Android'
        , samsungBrowser: t
        , version: versionIdentifier || getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/Whale/i.test(ua)) {
      result = {
        name: 'NAVER Whale browser'
        , whale: t
        , version: getFirstMatch(/(?:whale)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/MZBrowser/i.test(ua)) {
      result = {
        name: 'MZ Browser'
        , mzbrowser: t
        , version: getFirstMatch(/(?:MZBrowser)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/coast/i.test(ua)) {
      result = {
        name: 'Opera Coast'
        , coast: t
        , version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/focus/i.test(ua)) {
      result = {
        name: 'Focus'
        , focus: t
        , version: getFirstMatch(/(?:focus)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/yabrowser/i.test(ua)) {
      result = {
        name: 'Yandex Browser'
      , yandexbrowser: t
      , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/ucbrowser/i.test(ua)) {
      result = {
          name: 'UC Browser'
        , ucbrowser: t
        , version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/mxios/i.test(ua)) {
      result = {
        name: 'Maxthon'
        , maxthon: t
        , version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/epiphany/i.test(ua)) {
      result = {
        name: 'Epiphany'
        , epiphany: t
        , version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/puffin/i.test(ua)) {
      result = {
        name: 'Puffin'
        , puffin: t
        , version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
      }
    }
    else if (/sleipnir/i.test(ua)) {
      result = {
        name: 'Sleipnir'
        , sleipnir: t
        , version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/k-meleon/i.test(ua)) {
      result = {
        name: 'K-Meleon'
        , kMeleon: t
        , version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (windowsphone) {
      result = {
        name: 'Windows Phone'
      , osname: 'Windows Phone'
      , windowsphone: t
      }
      if (edgeVersion) {
        result.msedge = t
        result.version = edgeVersion
      }
      else {
        result.msie = t
        result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/msie|trident/i.test(ua)) {
      result = {
        name: 'Internet Explorer'
      , msie: t
      , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
      }
    } else if (chromeos) {
      result = {
        name: 'Chrome'
      , osname: 'Chrome OS'
      , chromeos: t
      , chromeBook: t
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    } else if (/edg([ea]|ios)/i.test(ua)) {
      result = {
        name: 'Microsoft Edge'
      , msedge: t
      , version: edgeVersion
      }
    }
    else if (/vivaldi/i.test(ua)) {
      result = {
        name: 'Vivaldi'
        , vivaldi: t
        , version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
      }
    }
    else if (sailfish) {
      result = {
        name: 'Sailfish'
      , osname: 'Sailfish OS'
      , sailfish: t
      , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/seamonkey\//i.test(ua)) {
      result = {
        name: 'SeaMonkey'
      , seamonkey: t
      , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/firefox|iceweasel|fxios/i.test(ua)) {
      result = {
        name: 'Firefox'
      , firefox: t
      , version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
      }
      if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
        result.firefoxos = t
        result.osname = 'Firefox OS'
      }
    }
    else if (silk) {
      result =  {
        name: 'Amazon Silk'
      , silk: t
      , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/phantom/i.test(ua)) {
      result = {
        name: 'PhantomJS'
      , phantom: t
      , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/slimerjs/i.test(ua)) {
      result = {
        name: 'SlimerJS'
        , slimer: t
        , version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
      result = {
        name: 'BlackBerry'
      , osname: 'BlackBerry OS'
      , blackberry: t
      , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
      }
    }
    else if (webos) {
      result = {
        name: 'WebOS'
      , osname: 'WebOS'
      , webos: t
      , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
      };
      /touchpad\//i.test(ua) && (result.touchpad = t)
    }
    else if (/bada/i.test(ua)) {
      result = {
        name: 'Bada'
      , osname: 'Bada'
      , bada: t
      , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
      };
    }
    else if (tizen) {
      result = {
        name: 'Tizen'
      , osname: 'Tizen'
      , tizen: t
      , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/qupzilla/i.test(ua)) {
      result = {
        name: 'QupZilla'
        , qupzilla: t
        , version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
      }
    }
    else if (/chromium/i.test(ua)) {
      result = {
        name: 'Chromium'
        , chromium: t
        , version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
      }
    }
    else if (/chrome|crios|crmo/i.test(ua)) {
      result = {
        name: 'Chrome'
        , chrome: t
        , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    }
    else if (android) {
      result = {
        name: 'Android'
        , version: versionIdentifier
      }
    }
    else if (/safari|applewebkit/i.test(ua)) {
      result = {
        name: 'Safari'
      , safari: t
      }
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if (iosdevice) {
      result = {
        name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
      }
      // WTF: version is not part of user agent in web apps
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if(/googlebot/i.test(ua)) {
      result = {
        name: 'Googlebot'
      , googlebot: t
      , version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
      }
    }
    else {
      result = {
        name: getFirstMatch(/^(.*)\/(.*) /),
        version: getSecondMatch(/^(.*)\/(.*) /)
     };
   }

    // set webkit or gecko flag for browsers based on these engines
    if (!result.msedge && /(apple)?webkit/i.test(ua)) {
      if (/(apple)?webkit\/537\.36/i.test(ua)) {
        result.name = result.name || "Blink"
        result.blink = t
      } else {
        result.name = result.name || "Webkit"
        result.webkit = t
      }
      if (!result.version && versionIdentifier) {
        result.version = versionIdentifier
      }
    } else if (!result.opera && /gecko\//i.test(ua)) {
      result.name = result.name || "Gecko"
      result.gecko = t
      result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i)
    }

    // set OS flags for platforms that have multiple browsers
    if (!result.windowsphone && (android || result.silk)) {
      result.android = t
      result.osname = 'Android'
    } else if (!result.windowsphone && iosdevice) {
      result[iosdevice] = t
      result.ios = t
      result.osname = 'iOS'
    } else if (mac) {
      result.mac = t
      result.osname = 'macOS'
    } else if (xbox) {
      result.xbox = t
      result.osname = 'Xbox'
    } else if (windows) {
      result.windows = t
      result.osname = 'Windows'
    } else if (linux) {
      result.linux = t
      result.osname = 'Linux'
    }

    function getWindowsVersion (s) {
      switch (s) {
        case 'NT': return 'NT'
        case 'XP': return 'XP'
        case 'NT 5.0': return '2000'
        case 'NT 5.1': return 'XP'
        case 'NT 5.2': return '2003'
        case 'NT 6.0': return 'Vista'
        case 'NT 6.1': return '7'
        case 'NT 6.2': return '8'
        case 'NT 6.3': return '8.1'
        case 'NT 10.0': return '10'
        default: return undefined
      }
    }

    // OS version extraction
    var osVersion = '';
    if (result.windows) {
      osVersion = getWindowsVersion(getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i))
    } else if (result.windowsphone) {
      osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
    } else if (result.mac) {
      osVersion = getFirstMatch(/Mac OS X (\d+([_\.\s]\d+)*)/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (iosdevice) {
      osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (android) {
      osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
    } else if (result.webos) {
      osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
    } else if (result.blackberry) {
      osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
    } else if (result.bada) {
      osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
    } else if (result.tizen) {
      osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
    }
    if (osVersion) {
      result.osversion = osVersion;
    }

    // device type extraction
    var osMajorVersion = !result.windows && osVersion.split('.')[0];
    if (
         tablet
      || nexusTablet
      || iosdevice == 'ipad'
      || (android && (osMajorVersion == 3 || (osMajorVersion >= 4 && !mobile)))
      || result.silk
    ) {
      result.tablet = t
    } else if (
         mobile
      || iosdevice == 'iphone'
      || iosdevice == 'ipod'
      || android
      || nexusMobile
      || result.blackberry
      || result.webos
      || result.bada
    ) {
      result.mobile = t
    }

    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if (result.msedge ||
        (result.msie && result.version >= 10) ||
        (result.yandexbrowser && result.version >= 15) ||
		    (result.vivaldi && result.version >= 1.0) ||
        (result.chrome && result.version >= 20) ||
        (result.samsungBrowser && result.version >= 4) ||
        (result.whale && compareVersions([result.version, '1.0']) === 1) ||
        (result.mzbrowser && compareVersions([result.version, '6.0']) === 1) ||
        (result.focus && compareVersions([result.version, '1.0']) === 1) ||
        (result.firefox && result.version >= 20.0) ||
        (result.safari && result.version >= 6) ||
        (result.opera && result.version >= 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
        (result.blackberry && result.version >= 10.1)
        || (result.chromium && result.version >= 20)
        ) {
      result.a = t;
    }
    else if ((result.msie && result.version < 10) ||
        (result.chrome && result.version < 20) ||
        (result.firefox && result.version < 20.0) ||
        (result.safari && result.version < 6) ||
        (result.opera && result.version < 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
        || (result.chromium && result.version < 20)
        ) {
      result.c = t
    } else result.x = t

    return result
  }

  var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')

  bowser.test = function (browserList) {
    for (var i = 0; i < browserList.length; ++i) {
      var browserItem = browserList[i];
      if (typeof browserItem=== 'string') {
        if (browserItem in bowser) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get version precisions count
   *
   * @example
   *   getVersionPrecision("1.10.3") // 3
   *
   * @param  {string} version
   * @return {number}
   */
  function getVersionPrecision(version) {
    return version.split(".").length;
  }

  /**
   * Array::map polyfill
   *
   * @param  {Array} arr
   * @param  {Function} iterator
   * @return {Array}
   */
  function map(arr, iterator) {
    var result = [], i;
    if (Array.prototype.map) {
      return Array.prototype.map.call(arr, iterator);
    }
    for (i = 0; i < arr.length; i++) {
      result.push(iterator(arr[i]));
    }
    return result;
  }

  /**
   * Calculate browser version weight
   *
   * @example
   *   compareVersions(['1.10.2.1',  '1.8.2.1.90'])    // 1
   *   compareVersions(['1.010.2.1', '1.09.2.1.90']);  // 1
   *   compareVersions(['1.10.2.1',  '1.10.2.1']);     // 0
   *   compareVersions(['1.10.2.1',  '1.0800.2']);     // -1
   *
   * @param  {Array<String>} versions versions to compare
   * @return {Number} comparison result
   */
  function compareVersions(versions) {
    // 1) get common precision for both versions, for example for "10.0" and "9" it should be 2
    var precision = Math.max(getVersionPrecision(versions[0]), getVersionPrecision(versions[1]));
    var chunks = map(versions, function (version) {
      var delta = precision - getVersionPrecision(version);

      // 2) "9" -> "9.0" (for precision = 2)
      version = version + new Array(delta + 1).join(".0");

      // 3) "9.0" -> ["000000000"", "000000009"]
      return map(version.split("."), function (chunk) {
        return new Array(20 - chunk.length).join("0") + chunk;
      }).reverse();
    });

    // iterate in reverse order by reversed chunks array
    while (--precision >= 0) {
      // 4) compare: "000000009" > "000000010" = false (but "9" > "10" = true)
      if (chunks[0][precision] > chunks[1][precision]) {
        return 1;
      }
      else if (chunks[0][precision] === chunks[1][precision]) {
        if (precision === 0) {
          // all version chunks are same
          return 0;
        }
      }
      else {
        return -1;
      }
    }
  }

  /**
   * Check if browser is unsupported
   *
   * @example
   *   bowser.isUnsupportedBrowser({
   *     msie: "10",
   *     firefox: "23",
   *     chrome: "29",
   *     safari: "5.1",
   *     opera: "16",
   *     phantom: "534"
   *   });
   *
   * @param  {Object}  minVersions map of minimal version to browser
   * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
   * @param  {String}  [ua] user agent string
   * @return {Boolean}
   */
  function isUnsupportedBrowser(minVersions, strictMode, ua) {
    var _bowser = bowser;

    // make strictMode param optional with ua param usage
    if (typeof strictMode === 'string') {
      ua = strictMode;
      strictMode = void(0);
    }

    if (strictMode === void(0)) {
      strictMode = false;
    }
    if (ua) {
      _bowser = detect(ua);
    }

    var version = "" + _bowser.version;
    for (var browser in minVersions) {
      if (minVersions.hasOwnProperty(browser)) {
        if (_bowser[browser]) {
          if (typeof minVersions[browser] !== 'string') {
            throw new Error('Browser version in the minVersion map should be a string: ' + browser + ': ' + String(minVersions));
          }

          // browser version and min supported version.
          return compareVersions([version, minVersions[browser]]) < 0;
        }
      }
    }

    return strictMode; // not found
  }

  /**
   * Check if browser is supported
   *
   * @param  {Object} minVersions map of minimal version to browser
   * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
   * @param  {String}  [ua] user agent string
   * @return {Boolean}
   */
  function check(minVersions, strictMode, ua) {
    return !isUnsupportedBrowser(minVersions, strictMode, ua);
  }

  bowser.isUnsupportedBrowser = isUnsupportedBrowser;
  bowser.compareVersions = compareVersions;
  bowser.check = check;

  /*
   * Set our detect method to the main bowser object so we can
   * reuse it to test other user agents.
   * This is needed to implement future tests.
   */
  bowser._detect = detect;

  /*
   * Set our detect public method to the main bowser object
   * This is needed to implement bowser in server side
   */
  bowser.detect = detect;
  return bowser
});


/***/ }),

/***/ 256:
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ 27:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return httpRequest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return getOrigin; });
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var whatwg_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67);





var httpRequest =
/*#__PURE__*/
function () {
  var _ref = _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()(
  /*#__PURE__*/
  _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(url, type) {
    var response, txt;
    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (type === void 0) {
              type = 'text';
            }

            _context.next = 3;
            return fetch(url, {
              credentials: 'same-origin'
            });

          case 3:
            response = _context.sent;

            if (!response.ok) {
              _context.next = 23;
              break;
            }

            if (!(type === 'json')) {
              _context.next = 12;
              break;
            }

            _context.next = 8;
            return response.text();

          case 8:
            txt = _context.sent;
            return _context.abrupt("return", JSON.parse(txt));

          case 12:
            if (!(type === 'binary')) {
              _context.next = 18;
              break;
            }

            _context.next = 15;
            return response.arrayBuffer();

          case 15:
            return _context.abrupt("return", _context.sent);

          case 18:
            _context.next = 20;
            return response.text();

          case 20:
            return _context.abrupt("return", _context.sent);

          case 21:
            _context.next = 24;
            break;

          case 23:
            throw new Error("httpRequest error: " + url + " " + response.statusText);

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function httpRequest(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var getOrigin = function getOrigin(url) {
  if (url.indexOf('file://') === 0) return 'file://'; // eslint-disable-next-line no-irregular-whitespace, no-useless-escape

  var parts = url.match(/^.+\:\/\/[^\/]+/);
  return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};

/***/ }),

/***/ 28:
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ 3:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return UiMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return DeviceMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return TransportMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return ResponseMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BlockchainMessage; });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);



var UiMessage = function UiMessage(type, payload) {
  return {
    event: _constants__WEBPACK_IMPORTED_MODULE_0__[/* UI_EVENT */ "f"],
    type: type,
    payload: payload
  };
};
var DeviceMessage = function DeviceMessage(type, payload) {
  return {
    event: _constants__WEBPACK_IMPORTED_MODULE_0__[/* DEVICE_EVENT */ "c"],
    type: type,
    payload: payload
  };
};
var TransportMessage = function TransportMessage(type, payload) {
  return {
    event: _constants__WEBPACK_IMPORTED_MODULE_0__[/* TRANSPORT_EVENT */ "e"],
    type: type,
    payload: payload
  };
};
var ResponseMessage = function ResponseMessage(id, success, payload) {
  if (payload === void 0) {
    payload = null;
  }

  return {
    event: _constants__WEBPACK_IMPORTED_MODULE_0__[/* RESPONSE_EVENT */ "d"],
    type: _constants__WEBPACK_IMPORTED_MODULE_0__[/* RESPONSE_EVENT */ "d"],
    id: id,
    success: success,
    payload: payload
  };
};
var BlockchainMessage = function BlockchainMessage(type, payload) {
  return {
    event: _constants__WEBPACK_IMPORTED_MODULE_0__[/* BLOCKCHAIN_EVENT */ "a"],
    type: type,
    payload: payload
  };
};

/***/ }),

/***/ 33:
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 35:
/***/ (function(module, exports) {

module.exports = function cmp (a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};


/***/ }),

/***/ 47:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return state; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return checkBrowser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return parseBridgeJSON; });
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var bowser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23);
/* harmony import */ var bowser__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(bowser__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _data_DataManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);





var state = {
  name: 'unknown',
  osname: 'unknown',
  supported: false,
  outdated: false,
  mobile: false
};
var checkBrowser = function checkBrowser() {
  if (typeof window === 'undefined') {
    state.name = 'nodejs';
    state.supported = true;
    return state;
  }

  var supported = _data_DataManager__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"].getConfig().supportedBrowsers;
  state.name = bowser__WEBPACK_IMPORTED_MODULE_1__["name"] + ": " + bowser__WEBPACK_IMPORTED_MODULE_1__["version"] + "; " + bowser__WEBPACK_IMPORTED_MODULE_1__["osname"] + ": " + bowser__WEBPACK_IMPORTED_MODULE_1__["osversion"] + ";";
  state.mobile = bowser__WEBPACK_IMPORTED_MODULE_1__["mobile"];
  state.osname = bowser__WEBPACK_IMPORTED_MODULE_1__["osname"];

  if (bowser__WEBPACK_IMPORTED_MODULE_1__["mobile"] && typeof navigator.usb === 'undefined') {
    state.supported = false;
  } else {
    var isSupported = supported[bowser__WEBPACK_IMPORTED_MODULE_1__["name"].toLowerCase()];

    if (isSupported) {
      state.supported = true;
      state.outdated = isSupported.version > parseInt(bowser__WEBPACK_IMPORTED_MODULE_1__["version"], 10);
    }
  }

  return state;
}; // Parse JSON loaded from config.assets.bridge
// Find preferred platform using bowser and userAgent

var parseBridgeJSON = function parseBridgeJSON(json) {
  var osname = bowser__WEBPACK_IMPORTED_MODULE_1__["osname"] ? bowser__WEBPACK_IMPORTED_MODULE_1__["osname"].toLowerCase() : 'default';
  var preferred = '';

  switch (osname) {
    case 'linux':
      {
        var agent = navigator.userAgent;
        var isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/) ? 'rpm' : 'deb';
        var is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';
        preferred = "" + isRpm + is64x;
      }
      break;

    case 'macos':
      preferred = 'mac';
      break;

    case 'windows':
      preferred = 'win';
      break;

    default:
      break;
  } // $FlowIssue indexer property is missing in `JSON`


  var latest = json[0];
  var version = latest.version.join('.');
  latest.packages = latest.packages.map(function (p) {
    return _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, p, {
      url: "" + latest.directory + p.url,
      signature: p.signature ? "" + latest.directory + p.signature : null,
      preferred: p.platform.indexOf(preferred) >= 0
    });
  });
  latest.changelog = latest.changelog.replace(/\n/g, '').split('* ');
  latest.changelog.splice(0, 1);
  return JSON.parse(JSON.stringify(latest).replace(/{version}/g, version));
};

/***/ }),

/***/ 5:
/***/ (function(module, exports) {

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;

/***/ }),

/***/ 51:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DEFAULT_PRIORITY; });
/* unused harmony export getEnv */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return parse; });
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__);


/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */
var VERSION = '7.0.2';
var versionN = VERSION.split('.').map(function (s) {
  return parseInt(s);
});
var DIRECTORY = "" + versionN[0] + (versionN[1] > 0 ? "." + versionN[1] : '') + "/";
var DEFAULT_DOMAIN = "https://connect.trezor.io/" + DIRECTORY;
var DEFAULT_PRIORITY = 2;
var initialSettings = {
  configSrc: 'data/config.json',
  // constant
  version: VERSION,
  // constant
  debug: false,
  origin: null,
  priority: DEFAULT_PRIORITY,
  trustedHost: false,
  connectSrc: DEFAULT_DOMAIN,
  iframeSrc: DEFAULT_DOMAIN + "iframe.html",
  popup: true,
  popupSrc: DEFAULT_DOMAIN + "popup.html",
  webusbSrc: DEFAULT_DOMAIN + "webusb.html",
  transportReconnect: false,
  webusb: true,
  pendingTransportEvent: true,
  supportedBrowser: typeof navigator !== 'undefined' ? !/Trident|MSIE/.test(navigator.userAgent) : true,
  extension: null,
  manifest: null,
  env: 'web',
  lazyLoad: false,
  timestamp: new Date().getTime()
};
var currentSettings = initialSettings;

var parseManifest = function parseManifest(manifest) {
  if (typeof manifest.email !== 'string') {
    return null;
  }

  if (typeof manifest.appUrl !== 'string') {
    return null;
  }

  return {
    email: manifest.email,
    appUrl: manifest.appUrl
  };
};

var getEnv = function getEnv() {
  // $FlowIssue: chrome is not declared outside the project
  if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.onConnect !== 'undefined') {
    return 'webextension';
  }

  if (typeof process !== 'undefined' && process.versions.hasOwnProperty('electron')) {
    return 'electron';
  }

  return 'web';
};
var parse = function parse(input) {
  if (!input) return currentSettings;

  var settings = _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, currentSettings);

  if (input.hasOwnProperty('debug')) {
    if (Array.isArray(input)) {// enable log with prefix
    }

    if (typeof input.debug === 'boolean') {
      settings.debug = input.debug;
    } else if (typeof input.debug === 'string') {
      settings.debug = input.debug === 'true';
    }
  }

  if (typeof input.connectSrc === 'string') {
    // TODO: escape string, validate url
    settings.connectSrc = input.connectSrc;
  } else if (typeof window !== 'undefined' && typeof window.__TREZOR_CONNECT_SRC === 'string') {
    settings.connectSrc = window.__TREZOR_CONNECT_SRC;
  }

  settings.iframeSrc = settings.connectSrc + "iframe.html";
  settings.popupSrc = settings.connectSrc + "popup.html";
  settings.webusbSrc = settings.connectSrc + "webusb.html";

  if (typeof input.transportReconnect === 'boolean') {
    settings.transportReconnect = input.transportReconnect;
  }

  if (typeof input.webusb === 'boolean') {
    settings.webusb = input.webusb;
  }

  if (typeof input.popup === 'boolean') {
    settings.popup = input.popup;
  }

  if (typeof input.lazyLoad === 'boolean') {
    settings.lazyLoad = input.lazyLoad;
  }

  if (typeof input.pendingTransportEvent === 'boolean') {
    settings.pendingTransportEvent = input.pendingTransportEvent;
  } // local files


  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    settings.origin = "file://" + window.location.pathname;
    settings.webusb = false;
  }

  if (typeof input.extension === 'string') {
    settings.extension = input.extension;
  } // $FlowIssue chrome is not declared outside


  if (typeof input.env === 'string') {
    settings.env = input.env;
  } else {
    settings.env = getEnv();
  }

  if (typeof input.timestamp === 'number') {
    settings.timestamp = input.timestamp;
  }

  if (typeof input.manifest === 'object') {
    settings.manifest = parseManifest(input.manifest);
  }

  currentSettings = settings;
  console.log('SETTING', settings, input);
  return currentSettings;
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(33)))

/***/ }),

/***/ 55:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return formatAmount; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return formatTime; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return btckb2satoshib; });


var currencyUnits = 'mbtc2'; // TODO: chagne currency units

var formatAmount = function formatAmount(n, coinInfo) {
  var amount = n / 1e8;

  if (coinInfo.isBitcoin && currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {
    var _s = (n / 1e5).toString();

    return _s + " mBTC";
  }

  var s = amount.toString();
  return s + " " + coinInfo.shortcut;
};
var formatTime = function formatTime(n) {
  var hours = Math.floor(n / 60);
  var minutes = n % 60;
  if (!n) return 'No time estimate';
  var res = '';

  if (hours !== 0) {
    res += hours + ' hour';

    if (hours > 1) {
      res += 's';
    }

    res += ' ';
  }

  if (minutes !== 0) {
    res += minutes + ' minutes';
  }

  return res;
};
var btckb2satoshib = function btckb2satoshib(n) {
  return Math.round(n * 1e5);
};

/***/ }),

/***/ 67:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Headers", function() { return Headers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Request", function() { return Request; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Response", function() { return Response; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DOMException", function() { return DOMException; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fetch", function() { return fetch; });
var support = {
  searchParams: 'URLSearchParams' in self,
  iterable: 'Symbol' in self && 'iterator' in Symbol,
  blob:
    'FileReader' in self &&
    'Blob' in self &&
    (function() {
      try {
        new Blob()
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in self,
  arrayBuffer: 'ArrayBuffer' in self
}

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ]

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
    throw new TypeError('Invalid character in header field name')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value)
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift()
      return {done: value === undefined, value: value}
    }
  }

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    }
  }

  return iterator
}

function Headers(headers) {
  this.map = {}

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value)
    }, this)
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      this.append(header[0], header[1])
    }, this)
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name])
    }, this)
  }
}

Headers.prototype.append = function(name, value) {
  name = normalizeName(name)
  value = normalizeValue(value)
  var oldValue = this.map[name]
  this.map[name] = oldValue ? oldValue + ', ' + value : value
}

Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)]
}

Headers.prototype.get = function(name) {
  name = normalizeName(name)
  return this.has(name) ? this.map[name] : null
}

Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
}

Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value)
}

Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this)
    }
  }
}

Headers.prototype.keys = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push(name)
  })
  return iteratorFor(items)
}

Headers.prototype.values = function() {
  var items = []
  this.forEach(function(value) {
    items.push(value)
  })
  return iteratorFor(items)
}

Headers.prototype.entries = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push([name, value])
  })
  return iteratorFor(items)
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true
}

function fileReaderReady(reader) {
  return new Promise(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result)
    }
    reader.onerror = function() {
      reject(reader.error)
    }
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  reader.readAsArrayBuffer(blob)
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  reader.readAsText(blob)
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf)
  var chars = new Array(view.length)

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i])
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false

  this._initBody = function(body) {
    this._bodyInit = body
    if (!body) {
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString()
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer)
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer])
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = body = Object.prototype.toString.call(body)
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8')
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type)
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      }
    }
  }

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    }

    this.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
      } else {
        return this.blob().then(readBlobAsArrayBuffer)
      }
    }
  }

  this.text = function() {
    var rejected = consumed(this)
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  }

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    }
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  }

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

function normalizeMethod(method) {
  var upcased = method.toUpperCase()
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request(input, options) {
  options = options || {}
  var body = options.body

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url
    this.credentials = input.credentials
    if (!options.headers) {
      this.headers = new Headers(input.headers)
    }
    this.method = input.method
    this.mode = input.mode
    this.signal = input.signal
    if (!body && input._bodyInit != null) {
      body = input._bodyInit
      input.bodyUsed = true
    }
  } else {
    this.url = String(input)
  }

  this.credentials = options.credentials || this.credentials || 'same-origin'
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers)
  }
  this.method = normalizeMethod(options.method || this.method || 'GET')
  this.mode = options.mode || this.mode || null
  this.signal = options.signal || this.signal
  this.referrer = null

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body)
}

Request.prototype.clone = function() {
  return new Request(this, {body: this._bodyInit})
}

function decode(body) {
  var form = new FormData()
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
    var parts = line.split(':')
    var key = parts.shift().trim()
    if (key) {
      var value = parts.join(':').trim()
      headers.append(key, value)
    }
  })
  return headers
}

Body.call(Request.prototype)

function Response(bodyInit, options) {
  if (!options) {
    options = {}
  }

  this.type = 'default'
  this.status = options.status === undefined ? 200 : options.status
  this.ok = this.status >= 200 && this.status < 300
  this.statusText = 'statusText' in options ? options.statusText : 'OK'
  this.headers = new Headers(options.headers)
  this.url = options.url || ''
  this._initBody(bodyInit)
}

Body.call(Response.prototype)

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
}

Response.error = function() {
  var response = new Response(null, {status: 0, statusText: ''})
  response.type = 'error'
  return response
}

var redirectStatuses = [301, 302, 303, 307, 308]

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
}

var DOMException = self.DOMException
try {
  new DOMException()
} catch (err) {
  DOMException = function(message, name) {
    this.message = message
    this.name = name
    var error = Error(message)
    this.stack = error.stack
  }
  DOMException.prototype = Object.create(Error.prototype)
  DOMException.prototype.constructor = DOMException
}

function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest()

    function abortXhr() {
      xhr.abort()
    }

    xhr.onload = function() {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      }
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
      var body = 'response' in xhr ? xhr.response : xhr.responseText
      resolve(new Response(body, options))
    }

    xhr.onerror = function() {
      reject(new TypeError('Network request failed'))
    }

    xhr.ontimeout = function() {
      reject(new TypeError('Network request failed'))
    }

    xhr.onabort = function() {
      reject(new DOMException('Aborted', 'AbortError'))
    }

    xhr.open(request.method, request.url, true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }

    if ('responseType' in xhr && support.blob) {
      xhr.responseType = 'blob'
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value)
    })

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr)

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr)
        }
      }
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
  })
}

fetch.polyfill = true

if (!self.fetch) {
  self.fetch = fetch
  self.Headers = Headers
  self.Request = Request
  self.Response = Response
}


/***/ }),

/***/ 68:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return parseFirmware; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return checkFirmware; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return getLatestRelease; });
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0__);

var releases = [];
var parseFirmware = function parseFirmware(json) {
  var obj = json;
  Object.keys(obj).forEach(function (key) {
    var release = obj[key];
    releases.push(_babel_runtime_helpers_objectSpread__WEBPACK_IMPORTED_MODULE_0___default()({}, release));
  });
};
var checkFirmware = function checkFirmware(fw) {
  // find all releases for device model
  var modelFirmware = releases.filter(function (r) {
    return r.version[0] === fw[0];
  }); // find latest firmware for this model

  var latestFirmware = modelFirmware.filter(function (r) {
    return r.version[1] > fw[1] || r.version[1] === fw[1] && r.version[2] > fw[2];
  });

  if (latestFirmware.length > 0) {
    // check if any of releases is required
    var requiredFirmware = latestFirmware.find(function (r) {
      return r.required;
    });

    if (requiredFirmware) {
      return 'required';
    } else {
      return 'outdated';
    }
  }

  return 'valid';
};
var getLatestRelease = function getLatestRelease(fw) {
  // find all releases for device model
  var modelFirmware = releases.filter(function (r) {
    return r.version[0] === fw[0];
  }); // find latest firmware for this model

  return modelFirmware.find(function (r) {
    return r.version[1] > fw[1] || r.version[1] === fw[1] && r.version[2] > fw[2];
  });
};

/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

var defineProperty = __webpack_require__(5);

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      defineProperty(target, key, source[key]);
    });
  }

  return target;
}

module.exports = _objectSpread;

/***/ }),

/***/ 73:
/***/ (function(module, exports) {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);


/***/ }),

/***/ 74:
/***/ (function(module, exports, __webpack_require__) {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = __webpack_require__(73);

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}


/***/ }),

/***/ 8:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export HD_HARDENED */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return toHardened; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return fromHardened; });
/* unused harmony export getHDPath */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return isMultisigPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return isSegwitPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return isBech32Path; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return getScriptType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return getOutputScriptType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return validatePath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return getSerializedPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return getPathFromIndex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return getIndexFromPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return getAccountLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return getPublicKeyLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return getLabel; });
/* harmony import */ var _data_CoinInfo__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(13);
/* harmony import */ var _constants_errors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);




var HD_HARDENED = 0x80000000;
var toHardened = function toHardened(n) {
  return (n | HD_HARDENED) >>> 0;
};
var fromHardened = function fromHardened(n) {
  return (n & ~HD_HARDENED) >>> 0;
};
var PATH_NOT_VALID = Object(_constants_errors__WEBPACK_IMPORTED_MODULE_1__[/* invalidParameter */ "w"])('Not a valid path.');
var PATH_NEGATIVE_VALUES = Object(_constants_errors__WEBPACK_IMPORTED_MODULE_1__[/* invalidParameter */ "w"])('Path cannot contain negative values.');
var getHDPath = function getHDPath(path) {
  var parts = path.toLowerCase().split('/');
  if (parts[0] !== 'm') throw PATH_NOT_VALID;
  return parts.filter(function (p) {
    return p !== 'm' && p !== '';
  }).map(function (p) {
    var hardened = false;

    if (p.substr(p.length - 1) === "'") {
      hardened = true;
      p = p.substr(0, p.length - 1);
    }

    var n = parseInt(p);

    if (isNaN(n)) {
      throw PATH_NOT_VALID;
    } else if (n < 0) {
      throw PATH_NEGATIVE_VALUES;
    }

    if (hardened) {
      // hardened index
      n = toHardened(n);
    }

    return n;
  });
};
var isMultisigPath = function isMultisigPath(path) {
  return Array.isArray(path) && path[0] === toHardened(48);
};
var isSegwitPath = function isSegwitPath(path) {
  return Array.isArray(path) && path[0] === toHardened(49);
};
var isBech32Path = function isBech32Path(path) {
  return Array.isArray(path) && path[0] === toHardened(84);
};
var getScriptType = function getScriptType(path) {
  if (!Array.isArray(path) || path.length < 1) return;
  var p1 = fromHardened(path[0]);

  switch (p1) {
    case 44:
      return 'SPENDADDRESS';

    case 48:
      return 'SPENDMULTISIG';

    case 49:
      return 'SPENDP2SHWITNESS';

    case 84:
      return 'SPENDWITNESS';

    default:
      return;
  }
};
var getOutputScriptType = function getOutputScriptType(path) {
  if (!Array.isArray(path) || path.length < 1) return;
  var p = fromHardened(path[0]);

  switch (p) {
    case 44:
      return 'PAYTOADDRESS';

    case 48:
      return 'PAYTOMULTISIG';

    case 49:
      return 'PAYTOP2SHWITNESS';

    case 84:
      return 'PAYTOWITNESS';

    default:
      return;
  }
};
var validatePath = function validatePath(path, length, base) {
  if (length === void 0) {
    length = 0;
  }

  if (base === void 0) {
    base = false;
  }

  var valid;

  if (typeof path === 'string') {
    valid = getHDPath(path);
  } else if (Array.isArray(path)) {
    valid = path.map(function (p) {
      var n = parseInt(p);

      if (isNaN(n)) {
        throw PATH_NOT_VALID;
      } else if (n < 0) {
        throw PATH_NEGATIVE_VALUES;
      }

      return n;
    });
  }

  if (!valid) throw PATH_NOT_VALID;
  if (length > 0 && valid.length < length) throw PATH_NOT_VALID;
  return base ? valid.splice(0, 3) : valid;
};
var getSerializedPath = function getSerializedPath(path) {
  return 'm/' + path.map(function (i) {
    var s = (i & ~HD_HARDENED).toString();

    if (i & HD_HARDENED) {
      return s + "'";
    } else {
      return s;
    }
  }).join('/');
};
var getPathFromIndex = function getPathFromIndex(bip44purpose, bip44cointype, index) {
  return [toHardened(bip44purpose), toHardened(bip44cointype), toHardened(index)];
};
var getIndexFromPath = function getIndexFromPath(path) {
  if (path.length < 3) {
    throw Object(_constants_errors__WEBPACK_IMPORTED_MODULE_1__[/* invalidParameter */ "w"])("getIndexFromPath: invalid path length " + path.toString());
  }

  return fromHardened(path[2]);
};
var getAccountLabel = function getAccountLabel(path, coinInfo) {
  var coinLabel = coinInfo.label;
  var p1 = fromHardened(path[0]);
  var account = fromHardened(path[2]);
  var realAccountId = account + 1;
  var prefix = 'Export info of';
  var accountType = '';

  if (p1 === 48) {
    accountType = coinLabel + " multisig";
  } else if (p1 === 44 && coinInfo.segwit) {
    accountType = coinLabel + " legacy";
  } else {
    accountType = coinLabel;
  }

  return prefix + " " + accountType + " <span>account #" + realAccountId + "</span>";
};
var getPublicKeyLabel = function getPublicKeyLabel(path, coinInfo) {
  var hasSegwit = false;
  var coinLabel = 'Unknown coin';

  if (coinInfo) {
    coinLabel = coinInfo.label;
    hasSegwit = coinInfo.segwit;
  } else {
    coinLabel = Object(_data_CoinInfo__WEBPACK_IMPORTED_MODULE_0__[/* getCoinName */ "g"])(path);
  }

  var p1 = fromHardened(path[0]);
  var account = path.length >= 3 ? fromHardened(path[2]) : -1;
  var realAccountId = account + 1;
  var prefix = 'Export public key';
  var accountType = ''; // Copay id

  if (p1 === 45342) {
    var p2 = fromHardened(path[1]);
    account = fromHardened(path[3]);
    realAccountId = account + 1;
    prefix = 'Export Copay ID of';

    if (p2 === 48) {
      accountType = 'multisig';
    } else if (p2 === 44) {
      accountType = 'legacy';
    }
  } else if (p1 === 48) {
    accountType = coinLabel + " multisig";
  } else if (p1 === 44 && hasSegwit) {
    accountType = coinLabel + " legacy";
  } else if (p1 === 84 && hasSegwit) {
    accountType = coinLabel + " native segwit";
  } else {
    accountType = coinLabel;
  }

  if (realAccountId > 0) {
    return prefix + " of " + accountType + " <span>account #" + realAccountId + "</span>";
  } else {
    return prefix;
  }
};
var getLabel = function getLabel(label, coinInfo) {
  if (coinInfo) {
    return label.replace('#NETWORK', coinInfo.label);
  }

  return label.replace('#NETWORK', '');
};

/***/ }),

/***/ 864:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(0);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/asyncToGenerator.js
var asyncToGenerator = __webpack_require__(1);
var asyncToGenerator_default = /*#__PURE__*/__webpack_require__.n(asyncToGenerator);

// EXTERNAL MODULE: ./src/js/constants/popup.js
var popup = __webpack_require__(17);

// EXTERNAL MODULE: ./src/js/constants/ui.js
var ui = __webpack_require__(2);

// EXTERNAL MODULE: ./src/js/message/index.js
var js_message = __webpack_require__(93);

// EXTERNAL MODULE: ./src/js/message/builder.js
var builder = __webpack_require__(3);

// EXTERNAL MODULE: ./src/js/data/DataManager.js
var DataManager = __webpack_require__(15);

// EXTERNAL MODULE: ./src/js/utils/networkUtils.js
var networkUtils = __webpack_require__(27);

// CONCATENATED MODULE: ./src/js/popup/view/common.js


var header = document.getElementsByTagName('header')[0];
var common_container = document.getElementById('container');
var views = document.getElementById('views');
var iframe; // TODO: Window type

var channel = new MessageChannel(); // used in direct element communication (iframe.postMessage)

var broadcast = null;
var common_setOperation = function setOperation(operation) {
  var infoPanel = document.getElementsByClassName('info-panel')[0];
  var operationEl = infoPanel.getElementsByClassName('operation')[0];
  var originEl = infoPanel.getElementsByClassName('origin')[0];
  operationEl.innerHTML = operation;
  originEl.innerText = DataManager["a" /* default */].getSettings('hostLabel') || DataManager["a" /* default */].getSettings('origin');
  var icon = DataManager["a" /* default */].getSettings('hostIcon');

  if (icon) {
    var iconContainers = document.getElementsByClassName('service-info');

    for (var i = 0; i < iconContainers.length; i++) {
      iconContainers[i].innerHTML = "<img src=\"" + icon + "\" alt=\"\" />";
    }
  }
};
var createTooltip = function createTooltip(text) {
  var tooltip = document.createElement('div');
  tooltip.setAttribute('tooltip', text);
  tooltip.setAttribute('tooltip-position', 'bottom');
  return tooltip;
};
var clearView = function clearView() {
  common_container.innerHTML = '';
};
var showView = function showView(className) {
  clearView();
  var view = views.getElementsByClassName(className);

  if (view) {
    var viewItem = view.item(0);

    if (viewItem) {
      common_container.innerHTML = viewItem.outerHTML;
    }
  } else {
    var unknown = views.getElementsByClassName('unknown-view');
    var unknownItem = unknown.item(0);

    if (unknownItem) {
      common_container.innerHTML = unknownItem.outerHTML;
    }
  }

  return common_container;
};
var getIframeElement = function getIframeElement() {
  // try find iframe in opener window
  if (!window.opener) return null;
  var frames = window.opener.frames;
  if (!frames) return null; // electron will return undefined

  for (var i = 0; i < frames.length; i++) {
    try {
      // try to get iframe origin, this action will not fail ONLY if the origins of iframe and popup are the same
      if (frames[i].location.host === window.location.host) {
        iframe = frames[i];
      }
    } catch (error) {// do nothing, try next entry
    }
  }

  return iframe;
}; // initialize message channel with iframe element

var initMessageChannel = function initMessageChannel(id, handler) {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcast = new BroadcastChannel(id);
    broadcast.onmessage = handler;
    return;
  }

  if (!getIframeElement()) {
    throw new Error('unable to establish connection with iframe');
  }

  channel.port1.onmessage = handler;
}; // this method can be used from anywhere

var common_postMessage = function postMessage(message) {
  if (!broadcast && !iframe) {
    throw new Error('unable to postMessage to iframe');
  }

  if (broadcast) {
    broadcast.postMessage(message);
    return;
  } // First message to iframe, MessageChannel port needs to set here


  if (message.type && message.type === popup["g" /* HANDSHAKE */]) {
    iframe.postMessage(message, window.location.origin, [channel.port2]);
    return;
  }

  iframe.postMessage(message, window.location.origin);
};
var postMessageToParent = function postMessageToParent(message) {
  if (window.opener) {
    // post message to parent and wait for POPUP.INIT message
    window.opener.postMessage(message, '*');
  } else {
    // webextensions doesn't have "window.opener" reference and expect this message in "content-script" above popup [see: ./src/webextension/trezor-content-script.js]
    // future communication channel with webextension iframe will be "ChromePort"
    // and electron (electron which uses connect hosted outside)
    // https://github.com/electron/electron/issues/7228
    window.postMessage(message, window.location.origin);
  }
};
// CONCATENATED MODULE: ./src/js/popup/view/pin.js






var pin_isSubmitButtonDisabled = function isSubmitButtonDisabled(isDisabled) {
  var submitButton = common_container.getElementsByClassName('submit')[0];

  if (isDisabled) {
    submitButton.setAttribute('disabled', 'true');
  } else {
    submitButton.removeAttribute('disabled');
  }
};

var pin_submit = function submit() {
  var button = common_container.getElementsByClassName('submit')[0];
  button.click();
};

var pin_addPin = function addPin(val) {
  var input = common_container.getElementsByClassName('pin-input')[0];
  var maxInputLength = 9;

  if (input.value.length < maxInputLength) {
    input.value += val;

    if (input.value.length > 0) {
      pin_isSubmitButtonDisabled(false);
    }
  }
};

var pin_backspacePin = function backspacePin() {
  var input = common_container.getElementsByClassName('pin-input')[0];
  var pin = input.value;
  input.value = pin.substring(0, pin.length - 1);

  if (!input.value) {
    pin_isSubmitButtonDisabled(true);
  }
};

var pinKeyboardHandler = function pinKeyboardHandler(event) {
  event.preventDefault();

  switch (event.keyCode) {
    case 13:
      // enter,
      pin_submit();
      break;
    // backspace

    case 8:
      pin_backspacePin();
      break;
    // numeric and numpad

    case 49:
    case 97:
      pin_addPin(1);
      break;

    case 50:
    case 98:
      pin_addPin(2);
      break;

    case 51:
    case 99:
      pin_addPin(3);
      break;

    case 52:
    case 100:
      pin_addPin(4);
      break;

    case 53:
    case 101:
      pin_addPin(5);
      break;

    case 54:
    case 102:
      pin_addPin(6);
      break;

    case 55:
    case 103:
      pin_addPin(7);
      break;

    case 56:
    case 104:
      pin_addPin(8);
      break;

    case 57:
    case 105:
      pin_addPin(9);
      break;
  }
};

var pin_initPinView = function initPinView(payload) {
  showView('pin');
  var deviceName = common_container.getElementsByClassName('device-name')[0];
  var input = common_container.getElementsByClassName('pin-input')[0];
  var enter = common_container.getElementsByClassName('submit')[0];
  var backspace = common_container.getElementsByClassName('pin-backspace')[0];
  var buttons = common_container.querySelectorAll('[data-value]');
  deviceName.innerText = payload.device.label;

  for (var i = 0; i < buttons.length; i++) {
    buttons.item(i).addEventListener('click', function (event) {
      if (event.target instanceof HTMLElement) {
        var val = event.target.getAttribute('data-value');

        if (val) {
          pin_addPin(+val);
        }
      }
    });
  }

  backspace.addEventListener('click', pin_backspacePin);
  enter.addEventListener('click', function (event) {
    if (input.value.length > 0) {
      window.removeEventListener('keydown', pinKeyboardHandler, false);
      showView('loader');
      common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_PIN"], input.value));
    }
  });
  window.addEventListener('keydown', pinKeyboardHandler, false);
};
// CONCATENATED MODULE: ./src/js/popup/view/passphrase.js





var passphrase_initPassphraseView = function initPassphraseView(payload) {
  showView('passphrase');
  var view = common_container.getElementsByClassName('passphrase')[0];
  var deviceNameSpan = common_container.getElementsByClassName('device-name')[0];
  var input1 = common_container.getElementsByClassName('pass')[0];
  var input2 = common_container.getElementsByClassName('pass-check')[0];
  var toggle = common_container.getElementsByClassName('show-passphrase')[0];
  var enter = common_container.getElementsByClassName('submit')[0];
  var inputType = 'password';
  deviceNameSpan.innerText = payload.device.label;
  /* Functions */

  var validation = function validation() {
    if (input1.value !== input2.value) {
      enter.disabled = true;
      view.classList.add('not-valid');
    } else {
      enter.disabled = false;
      view.classList.remove('not-valid');
    }
  };

  var toggleInputFontStyle = function toggleInputFontStyle(input) {
    if (inputType === 'text') {
      // input.classList.add('text');
      input.setAttribute('type', 'text'); // Since passphrase is visible there's no need to force user to fill the passphrase twice
      // - disable input2
      // - write automatically into input2 as the user is writing into input1 (listen to input event)

      input2.disabled = true;
      input2.value = input1.value;
      validation();
    } else if (inputType === 'password') {
      // input.classList.remove('text');
      input.setAttribute('type', 'password');
      input2.disabled = false;
      input2.value = '';
      validation();
    }
  };

  var handleToggleClick = function handleToggleClick() {
    inputType = inputType === 'text' ? 'password' : 'text';
    toggleInputFontStyle(input1);
    toggleInputFontStyle(input2);
  };

  var handleEnterClick = function handleEnterClick() {
    input1.blur();
    input2.blur(); // eslint-disable-next-line no-use-before-define

    window.removeEventListener('keydown', handleWindowKeydown);
    showView('loader');
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_PASSPHRASE"], {
      save: true,
      value: input1.value
    }));
  };

  var handleWindowKeydown = function handleWindowKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      enter.click();
    }
  };
  /* Functions: END */


  input1.addEventListener('input', function () {
    validation();

    if (inputType === 'text') {
      input2.value = input1.value;
      validation();
    }
  }, false);
  input2.addEventListener('input', validation, false);
  toggle.addEventListener('click', handleToggleClick);
  enter.addEventListener('click', handleEnterClick);
  window.addEventListener('keydown', handleWindowKeydown, false);
  input1.focus();
};
// CONCATENATED MODULE: ./src/js/popup/view/invalidPassphrase.js





var invalidPassphrase_initInvalidPassphraseView = function initInvalidPassphraseView(payload) {
  showView('invalid-passphrase');
  var confirmButton = common_container.getElementsByClassName('confirm')[0];
  var cancelButton = common_container.getElementsByClassName('cancel')[0];

  confirmButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["INVALID_PASSPHRASE_ACTION"], false));
    showView('loader');
  };

  cancelButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["INVALID_PASSPHRASE_ACTION"], true));
    showView('loader');
  };
};
// CONCATENATED MODULE: ./src/js/popup/view/selectDevice.js










var selectDevice_initWebUsbButton = function initWebUsbButton(webusb, showLoader) {
  if (!webusb) return;
  var webusbContainer = common_container.getElementsByClassName('webusb')[0];
  webusbContainer.style.display = 'flex';
  var button = webusbContainer.getElementsByTagName('button')[0];

  if (!iframe) {
    button.innerHTML = '<span class="plus"></span><span class="text">Pair devices</span>';
  }

  button.onclick =
  /*#__PURE__*/
  asyncToGenerator_default()(
  /*#__PURE__*/
  regenerator_default.a.mark(function _callee() {
    var usb;
    return regenerator_default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (iframe) {
              _context.next = 3;
              break;
            }

            window.postMessage({
              type: popup["f" /* EXTENSION_USB_PERMISSIONS */]
            }, window.location.origin);
            return _context.abrupt("return");

          case 3:
            usb = iframe.clientInformation.usb;
            _context.prev = 4;
            _context.next = 7;
            return usb.requestDevice({
              filters: DataManager["a" /* default */].getConfig().webusb
            });

          case 7:
            if (showLoader) {
              showView('loader');
            }

            _context.next = 12;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context["catch"](4);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 10]]);
  }));
};

var selectDevice_selectDevice = function selectDevice(payload) {
  if (!payload) return;

  if (!payload.devices || !Array.isArray(payload.devices) || payload.devices.length === 0) {
    // No device connected
    showView('connect');
    selectDevice_initWebUsbButton(payload.webusb, true);
    return;
  }

  showView('select-device');
  selectDevice_initWebUsbButton(payload.webusb, false); // If only 'remember device for now' toggle and no webusb button is available
  // show it right under the table

  if (!payload.webusb) {
    var wrapper = common_container.getElementsByClassName('wrapper')[0];
    wrapper.style.justifyContent = 'normal';
  } // Populate device list


  var deviceList = common_container.getElementsByClassName('select-device-list')[0]; // deviceList.innerHTML = '';

  var rememberCheckbox = common_container.getElementsByClassName('remember-device')[0]; // Show readable devices first

  payload.devices.sort(function (d1, d2) {
    if (d1.type === 'unreadable' && !d2.type !== 'unreadable') {
      return 1;
    } else if (d1.type !== 'unreadable' && d2.type === 'unreadable') {
      return -1;
    }

    return 0;
  });
  payload.devices.forEach(function (device) {
    var deviceButton = document.createElement('button');
    deviceButton.className = 'list';

    if (device.type !== 'unreadable') {
      deviceButton.addEventListener('click', function () {
        common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_DEVICE"], {
          remember: rememberCheckbox && rememberCheckbox.checked,
          device: device
        }));
        showView('loader');
      });
    }

    var deviceIcon = document.createElement('span');
    deviceIcon.className = 'icon';

    if (device.features) {
      if (device.features.major_version === 2) {
        deviceIcon.classList.add('model-t');
      }
    }

    var deviceName = document.createElement('span');
    deviceName.className = 'device-name';
    deviceName.textContent = device.label;
    var wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    wrapper.appendChild(deviceIcon);
    wrapper.appendChild(deviceName);
    deviceButton.appendChild(wrapper); // device {
    //     status: 'available' | 'occupied' | 'used';
    //     type: 'acquired' | 'unacquired' | 'unreadable';
    // }
    // if (device.status !== 'available') {

    if (device.type !== 'acquired' || device.status === 'occupied') {
      deviceButton.classList.add('device-explain');
      var explanation = document.createElement('div');
      explanation.className = 'explain';
      var htmlUnreadable = 'Please install <a href="https://wallet.trezor.io" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Bridge</a> to use Trezor device.';
      var htmlUnacquired = 'Click to activate. This device is used by another application.';

      if (device.type === 'unreadable') {
        deviceButton.disabled = true;
        deviceIcon.classList.add('unknown');
        deviceName.textContent = 'Unrecognized device';
        explanation.innerHTML = htmlUnreadable;
      }

      if (device.type === 'unacquired' || device.status === 'occupied') {
        deviceName.textContent = 'Inactive device';
        deviceButton.classList.add('unacquired');
        explanation.classList.add('unacquired');
        explanation.innerHTML = htmlUnacquired;

        if (device.type === 'acquired') {
          deviceName.textContent = device.label;
        }
      }

      deviceButton.appendChild(explanation);
    }

    deviceList.appendChild(deviceButton);
  });
};
// EXTERNAL MODULE: ./src/js/utils/formatUtils.js
var formatUtils = __webpack_require__(55);

// CONCATENATED MODULE: ./src/js/popup/view/selectAccount.js






var selectAccount_selectAccount = function selectAccount(payload) {
  if (!payload || !Array.isArray(payload.accounts)) return; // first render
  // configure buttons

  if (payload.start) {
    showView('select-account');

    if (payload.coinInfo.segwit) {
      (function () {
        var tabs = common_container.getElementsByClassName('tabs')[0];
        tabs.style.display = 'flex';
        var selectAccountContainer = common_container.getElementsByClassName('select-account')[0];
        var buttons = tabs.getElementsByClassName('tab-selection');
        var button;

        var _loop = function _loop() {
          if (_isArray) {
            if (_i >= _iterator.length) return "break";
            button = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) return "break";
            button = _i.value;
          }

          var type = button.getAttribute('data-tab');

          if (type) {
            button.onclick = function (event) {
              selectAccountContainer.className = 'select-account ' + type;
            };
          }
        };

        for (var _iterator = buttons, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ret = _loop();

          if (_ret === "break") break;
        }
      })();
    }
  } // set header


  var h3 = common_container.getElementsByTagName('h3')[0];
  h3.innerHTML = payload.complete ? "Select " + payload.coinInfo.label + " account" : "Loading " + payload.coinInfo.label + " accounts...";
  var buttonsContainer = common_container.querySelectorAll('.select-account-list.normal')[0];
  var legacyButtonsContainer = common_container.querySelectorAll('.select-account-list.legacy')[0];

  var handleClick = function handleClick(event) {
    if (event.currentTarget instanceof HTMLElement) {
      common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_ACCOUNT"], event.currentTarget.getAttribute('data-index')));
    }

    buttonsContainer.style.pointerEvents = 'none';
  };

  var removeEmptyButton = function removeEmptyButton(buttonContainer) {
    var defaultButton = buttonContainer.querySelectorAll('.account-default')[0];

    if (defaultButton) {
      buttonContainer.removeChild(defaultButton);
    }
  };

  var updateButtonValue = function updateButtonValue(button, account) {
    if (button.innerHTML.length < 1) {
      button.innerHTML = "\n                <span class=\"account-title\"></span>\n                <span class=\"account-status\"></span>";
    }

    var title = button.getElementsByClassName('account-title')[0];
    var status = button.getElementsByClassName('account-status')[0];
    title.innerHTML = account.label; // TODO: Disable button once an account is fully loaded and its balance is 0

    if (account.balance < 0) {
      status.innerHTML = account.transactions ? account.transactions + " transactions" : 'Loading...';
      button.disabled = true;
    } else {
      status.innerHTML = account.transactions === 0 ? 'New account' : Object(formatUtils["b" /* formatAmount */])(account.balance, payload.coinInfo);

      if (payload.checkBalance) {
        button.disabled = account.transactions === 0 || account.balance === 0;
      } else {
        button.disabled = false;
      }

      if (!button.disabled) {
        button.onclick = handleClick;
      }
    }
  };

  for (var _iterator2 = payload.accounts.entries(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
    var _ref;

    if (_isArray2) {
      if (_i2 >= _iterator2.length) break;
      _ref = _iterator2[_i2++];
    } else {
      _i2 = _iterator2.next();
      if (_i2.done) break;
      _ref = _i2.value;
    }

    var _ref2 = _ref,
        index = _ref2[0],
        account = _ref2[1];
    var existed = common_container.querySelectorAll("[data-index=\"" + index + "\"]")[0];

    if (!existed) {
      var button = document.createElement('button');
      button.className = 'list';
      button.setAttribute('data-index', index.toString());
      updateButtonValue(button, account); // add to proper container

      if (payload.coinInfo.segwit && !account.coinInfo.segwit) {
        removeEmptyButton(legacyButtonsContainer);
        legacyButtonsContainer.appendChild(button);
      } else {
        removeEmptyButton(buttonsContainer);
        buttonsContainer.appendChild(button);
      }
    } else {
      updateButtonValue(existed, account);
    }
  }
};
// CONCATENATED MODULE: ./src/js/popup/view/selectFee.js






var fees = []; // reference to currently selected button

var selectedFee;
/*
 * Update custom fee view.
 */

var selectFee_updateCustomFee = function updateCustomFee(payload) {
  var custom = common_container.getElementsByClassName('custom-fee')[0];
  var opener = common_container.getElementsByClassName('opener')[0];
  var customFeeLabel = opener.getElementsByClassName('fee-info')[0];

  if (custom.className.indexOf('active') < 0) {
    return;
  }

  var lastFee = fees[fees.length - 1];

  if (lastFee.name === 'custom') {
    fees[fees.length - 1] = payload.level;
  } else {
    fees.push(payload.level);
  }

  if (payload.level.fee) {
    customFeeLabel.innerHTML = Object(formatUtils["b" /* formatAmount */])(payload.level.fee, payload.coinInfo);
  } else {
    customFeeLabel.innerHTML = 'Insufficient funds';
  } // eslint-disable-next-line no-use-before-define


  selectFee_validation(payload.coinInfo);
};

var selectFee_validation = function validation(coinInfo) {
  if (selectedFee) {
    var selectedName = selectedFee.getAttribute('data-fee') || 'custom';
    var selectedValue = fees.find(function (f) {
      return f.name === selectedName;
    });
    var sendButton = common_container.getElementsByClassName('send-button')[0];

    if (selectedValue && selectedValue.fee !== 0) {
      sendButton.removeAttribute('disabled');
      sendButton.innerHTML = "Send " + Object(formatUtils["b" /* formatAmount */])(selectedValue.total, coinInfo);
    } else {
      sendButton.setAttribute('disabled', 'disabled');
      sendButton.innerHTML = 'Send';
    }
  }
};
/*
 * Show select fee view.
 */


var selectFee_selectFee = function selectFee(data) {
  if (!data || !Array.isArray(data.feeLevels)) return; // TODO: back to accounts?

  showView('select-fee'); // remove old references

  selectedFee = null;
  fees.splice(0, fees.length); // add new fees from message

  fees.push.apply(fees, data.feeLevels); // build innerHTML string with fee buttons

  var feesComponents = [];
  fees.forEach(function (level, index) {
    // ignore custom
    if (level.name === 'custom') return;
    var feeName = level.name;

    if (level.name === 'normal' && level.fee) {
      feeName = "<span>" + level.name + "</span>\n                <span class=\"fee-subtitle\">recommended</span>";
    }

    if (level.fee) {
      feesComponents.push("\n                <button data-fee=\"" + level.name + "\" class=\"list\">\n                    <span class=\"fee-title\">" + feeName + "</span>\n                    <span class=\"fee-info\">\n                        <span class=\"fee-amount\">" + Object(formatUtils["b" /* formatAmount */])(level.fee, data.coinInfo) + "</span>\n                        <span class=\"fee-time\">" + Object(formatUtils["c" /* formatTime */])(level.minutes) + "</span>\n                    </span>\n                </button>\n            ");
    } else {
      feesComponents.push("\n                <button disabled class=\"list\">\n                    <span class=\"fee-title\">" + feeName + "</span>\n                    <span class=\"fee-info\">Insufficient funds</span>\n                </button>\n            ");
    }
  });
  var feeList = common_container.getElementsByClassName('select-fee-list')[0]; // append custom fee button

  feesComponents.push(feeList.innerHTML); // render all buttons

  feeList.innerHTML = feesComponents.join(''); // references to html elements

  var sendButton = common_container.getElementsByClassName('send-button')[0];
  var opener = common_container.getElementsByClassName('opener')[0];
  var custom = common_container.getElementsByClassName('custom-fee')[0];
  var customFeeLabel = opener.getElementsByClassName('fee-info')[0];

  var onFeeSelect = function onFeeSelect(event) {
    if (event.currentTarget instanceof HTMLElement) {
      if (selectedFee) {
        selectedFee.classList.remove('active');
      }

      selectedFee = event.currentTarget;
      selectedFee.classList.add('active');
      selectFee_validation(data.coinInfo);
    }
  }; // find all buttons excluding custom fee button


  var feeButtons = feeList.querySelectorAll('[data-fee]');

  for (var i = 0; i < feeButtons.length; i++) {
    feeButtons.item(i).addEventListener('click', onFeeSelect); // Select normal fee on default

    if (feeButtons.item(i).dataset.fee === 'normal') {
      feeButtons.item(i).click();
    }
  } // custom fee button logic


  var composingTimeout = 0;

  opener.onclick = function () {
    if (custom.className.indexOf('active') >= 0) return;

    if (selectedFee) {
      selectedFee.classList.remove('active');
    }

    var composedCustomFee = fees.find(function (f) {
      return f.name === 'custom';
    });
    var customFeeDefaultValue = 0;

    if (!composedCustomFee) {
      if (selectedFee) {
        var selectedName = selectedFee.getAttribute('data-fee');
        var selectedValue = fees.find(function (f) {
          return f.name === selectedName;
        });

        if (selectedValue && selectedValue.fee !== 0) {
          customFeeDefaultValue = selectedValue.feePerByte;
        }
      }

      if (!customFeeDefaultValue) {
        customFeeDefaultValue = 1; // TODO: get normal
      }
    } else if (composedCustomFee.fee) {
      customFeeDefaultValue = composedCustomFee.feePerByte;
    }

    custom.classList.add('active');
    selectedFee = custom; // eslint-disable-next-line no-use-before-define

    focusInput(customFeeDefaultValue);
  };

  var focusInput = function focusInput(defaultValue) {
    var input = common_container.getElementsByTagName('input')[0];
    setTimeout(function () {
      // eslint-disable-next-line no-use-before-define
      input.oninput = handleCustomFeeChange;

      if (defaultValue) {
        input.value = defaultValue.toString();
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        input.dispatchEvent(event);
      }

      input.focus();
    }, 1);
  };

  var minFee = data.coinInfo.minFeeSatoshiKb / 1000;
  var maxFee = data.coinInfo.maxFeeSatoshiKb / 1000;

  var handleCustomFeeChange = function handleCustomFeeChange(event) {
    window.clearTimeout(composingTimeout);
    sendButton.setAttribute('disabled', 'disabled'); // $FlowIssue value not found on Event target

    var value = event.currentTarget.value;
    var valueNum = parseInt(value);

    if (isNaN(valueNum)) {
      if (value.length > 0) {
        customFeeLabel.innerHTML = 'Incorrect fee';
      } else {
        customFeeLabel.innerHTML = 'Missing fee';
      }
    } else if (valueNum < minFee) {
      customFeeLabel.innerHTML = 'Fee is too low';
    } else if (valueNum > maxFee) {
      customFeeLabel.innerHTML = 'Fee is too big';
    } else {
      customFeeLabel.innerHTML = 'Composing...';

      var composeCustomFeeTimeoutHandler = function composeCustomFeeTimeoutHandler() {
        common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_FEE"], {
          type: 'compose-custom',
          value: valueNum
        })); // updateCustomFee({
        //     fee: {
        //         name: "custom",
        //         minutes: 10,
        //         fee: 123,
        //         bytes: 200,
        //         feePerByte: 30
        //     },
        //     coinInfo: data.coinInfo,
        // })
      };

      composingTimeout = window.setTimeout(composeCustomFeeTimeoutHandler, 800);
    }
  };

  var changeAccountButton = common_container.getElementsByClassName('back-button')[0];

  changeAccountButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_FEE"], {
      type: 'change-account'
    }));
    showView('loader');
  };

  sendButton.onclick = function () {
    if (!selectedFee) return;
    var selectedName = selectedFee.getAttribute('data-fee');
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_FEE"], {
      type: 'send',
      value: selectedName || 'custom'
    }));
  };
};
// CONCATENATED MODULE: ./src/js/popup/view/requestButton.js



var toastTimeout;

var requestButton_showToast = function showToast() {
  var toast = common_container.querySelectorAll('.toast')[0];

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(function () {
    toast.classList.remove('visible');
  }, 3000);
  toast.classList.add('visible');
};

var requestButton_showAddressValidation = function showAddressValidation(payload) {
  showView('check-address');
  var data = payload.data;
  var dataContainer = common_container.querySelectorAll('.button-request-data')[0];

  if (!data || data.type !== 'address') {
    if (dataContainer.parentNode) {
      dataContainer.parentNode.removeChild(dataContainer);
    }

    return;
  }

  var path = common_container.querySelectorAll('.path-value')[0];
  var address = common_container.querySelectorAll('.address-value')[0];
  var clipboard = common_container.querySelectorAll('.clipboard-button')[0];
  path.innerText = data.serializedPath;
  address.innerText = data.address;

  clipboard.onclick = function () {
    var el = document.createElement('textarea');
    el.value = data.address;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    dataContainer.appendChild(el);
    el.select();
    document.execCommand('copy');
    dataContainer.removeChild(el);
    requestButton_showToast();
  };
};

var requestButton_requestButton = function requestButton(payload) {
  if (payload.code === 'ButtonRequest_Address') {
    requestButton_showAddressValidation(payload);
  } else if (payload.code === 'ButtonRequest_ConfirmOutput') {
    showView('confirm-output');
  } else {
    showView('follow-device');
  }
};
// CONCATENATED MODULE: ./src/js/popup/view/permissions.js







var getPermissionText = function getPermissionText(permissionType, deviceName) {
  var text = '';

  switch (permissionType) {
    case 'read':
      text = 'Read public keys from Trezor device';
      break;

    case 'read-meta':
      text = 'Read metadata from Trezor device';
      break;

    case 'write':
      text = 'Prepare Trezor device for transaction and data signing';
      break;

    case 'write-meta':
      text = 'Write metadata to Trezor device';
      break;

    case 'management':
      text = 'Modify device settings';
      break;

    case 'custom-message':
      text = 'Run custom operations';
      break;
  }

  return text;
};

var getPermissionTooltipText = function getPermissionTooltipText(permissionType) {
  var text = '';

  switch (permissionType) {
    case 'read':
      text = 'Permission needed to load public information from your device.';
      break;

    case 'write':
      text = 'Permission needed to execute operations, such as composing a transaction, after your confirmation.';
      break;

    case 'management':
      text = 'Permission needed to change device settings, such as PIN, passphrase, label or seed.';
      break;

    case 'custom-message':
      text = 'Development tool. Use at your own risk. Allows service to send arbitrary data to your Trezor device.';
      break;
  }

  return text;
};

var permissions_createPermissionItem = function createPermissionItem(permissionText, tooltipText) {
  var permissionItem = document.createElement('div');
  permissionItem.className = 'permission-item'; // Tooltip

  if (tooltipText !== '') {
    var tooltip = createTooltip(tooltipText);
    permissionItem.appendChild(tooltip);
  } //
  // Permission content (icon & text)


  var contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  var infoIcon = document.createElement('span');
  infoIcon.className = 'info-icon';
  var permissionTextSpan = document.createElement('span');
  permissionTextSpan.innerText = permissionText;
  contentDiv.appendChild(infoIcon);
  contentDiv.appendChild(permissionTextSpan);
  permissionItem.appendChild(contentDiv); //

  return permissionItem;
};

var permissions_initPermissionsView = function initPermissionsView(payload) {
  showView('permissions');
  var h3 = common_container.getElementsByTagName('h3')[0];
  var hostName = h3.getElementsByClassName('host-name')[0];
  var permissionsList = common_container.getElementsByClassName('permissions-list')[0];
  var confirmButton = common_container.getElementsByClassName('confirm')[0];
  var cancelButton = common_container.getElementsByClassName('cancel')[0];
  var rememberCheckbox = common_container.getElementsByClassName('remember-permissions')[0];
  hostName.innerText = DataManager["a" /* default */].getSettings('hostLabel') || DataManager["a" /* default */].getSettings('origin');

  if (payload && Array.isArray(payload.permissions)) {
    payload.permissions.forEach(function (p) {
      var permissionText = getPermissionText(p, payload.device.label);
      var tooltipText = getPermissionTooltipText(p);
      var permissionItem = permissions_createPermissionItem(permissionText, tooltipText);
      permissionsList.appendChild(permissionItem);
    });
  }

  confirmButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_PERMISSION"], {
      remember: rememberCheckbox && rememberCheckbox.checked,
      granted: true
    }));
    showView('loader');
  };

  cancelButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_PERMISSION"], {
      remember: rememberCheckbox && rememberCheckbox.checked,
      granted: false
    }));
    showView('loader');
  };

  rememberCheckbox.onchange = function (e) {
    confirmButton.innerText = e.target.checked ? 'Always allow for this service' : 'Allow once for this session';
  };
};
// CONCATENATED MODULE: ./src/js/popup/view/confirmation.js





var confirmation_initConfirmationView = function initConfirmationView(data) {
  // Confirmation views:
  // - export xpub
  // - export account info
  // - no backup
  // TODO: Check if correct class names for HTML views
  showView(data.view);
  var h3 = common_container.getElementsByTagName('h3')[0];
  var confirmButton = common_container.getElementsByClassName('confirm')[0];
  var cancelButton = common_container.getElementsByClassName('cancel')[0];
  var label = data.label,
      customConfirmButton = data.customConfirmButton,
      customCancelButton = data.customCancelButton;

  if (customConfirmButton) {
    confirmButton.innerText = customConfirmButton.label;
    confirmButton.classList.add(customConfirmButton.className);
  }

  if (customCancelButton) {
    confirmButton.innerText = customCancelButton.label;
    confirmButton.classList.add(customCancelButton.className);
  }

  if (label) {
    h3.innerHTML = label;
  }

  confirmButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_CONFIRMATION"], true));
    showView('loader');
  };

  cancelButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_CONFIRMATION"], false));
    showView('loader');
  };
};
// CONCATENATED MODULE: ./src/js/popup/view/browser.js



var browser_initBrowserView = function initBrowserView(payload) {
  showView(!payload.supported && payload.mobile ? 'smartphones-not-supported' : 'browser');
  var h3 = common_container.getElementsByTagName('h3')[0];
  var p = common_container.getElementsByTagName('p')[0];

  if (!payload.supported && !payload.mobile) {
    h3.innerText = 'Unsupported browser';
    p.innerText = 'Please use one of the supported browsers.';
  } else if (payload.outdated) {
    h3.innerText = 'Outdated browser';
    p.innerText = 'Please update your browser.';
  }
};
// CONCATENATED MODULE: ./src/js/popup/view/passphraseOnDevice.js



var passphraseOnDevice_passphraseOnDeviceView = function passphraseOnDeviceView(payload) {
  showView('passphrase-on-device');
  var deviceName = common_container.getElementsByClassName('device-name')[0];
  deviceName.innerText = payload.device.label;
};
// CONCATENATED MODULE: ./src/js/popup/view/firmwareRequiredUpdate.js

var firmwareRequiredUpdate_firmwareRequiredUpdate = function firmwareRequiredUpdate(device) {
  var view = showView('firmware-update');
  if (!device.features) return;
  var release = device.firmwareRelease;
  if (!release) return;
  var button = view.getElementsByClassName('confirm')[0];
  var url = release.channel === 'beta' ? 'https://beta-wallet.trezor.io/' : 'https://wallet.trezor.io/';
  var version = release.version.join('.');
  button.setAttribute('href', url + "?fw=" + version);
};
// CONCATENATED MODULE: ./src/js/popup/view/firmwareNotSupported.js

var firmwareNotSupported_firmwareNotSupported = function firmwareNotSupported(device) {
  var view = showView('firmware-not-supported');
  if (!device.features) return;
  var features = device.features;
  var h3 = view.getElementsByTagName('h3')[0];
  h3.innerHTML = (features.major_version === 1 ? 'Trezor One' : 'Trezor T') + " is not supported";
};
// CONCATENATED MODULE: ./src/js/popup/view/firmwareNotCompatible.js




var firmwareNotCompatible_firmwareNotCompatible = function firmwareNotCompatible(device) {
  var view = showView('firmware-not-compatible');
  if (!device.features) return;
  var features = device.features;
  var fwVersion = view.getElementsByClassName('fw-version')[0];
  var identity = view.getElementsByClassName('fw-identity');
  var developer = DataManager["a" /* default */].getSettings('hostLabel') || DataManager["a" /* default */].getSettings('origin') || 'this application';
  var confirmButton = view.getElementsByClassName('confirm')[0];
  var cancelButton = view.getElementsByClassName('cancel')[0]; // h3.innerHTML = `${features.major_version === 1 ? 'Trezor One' : 'Trezor TTTT'} is not supported`;

  fwVersion.innerHTML = features.major_version + "." + features.minor_version + "." + features.patch_version;

  for (var i = 0; i < identity.length; i++) {
    identity[i].innerText = developer;
  }

  confirmButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_CONFIRMATION"], true));
    showView('loader');
  };

  cancelButton.onclick = function () {
    common_postMessage(new builder["e" /* UiMessage */](ui["RECEIVE_CONFIRMATION"], false));
    showView('loader');
  };
};
// CONCATENATED MODULE: ./src/js/popup/view/index.js















// CONCATENATED MODULE: ./src/js/popup/view/notification.js

var notification_showFirmwareUpdateNotification = function showFirmwareUpdateNotification(device) {
  var container = document.getElementsByClassName('notification')[0];
  var warning = container.querySelector('.firmware-update-notification');

  if (warning) {
    // already exists
    return;
  }

  if (!device.features) return;
  var release = device.firmwareRelease;
  if (!release) return;
  var view = views.getElementsByClassName('firmware-update-notification');
  var notification = document.createElement('div');
  notification.className = 'firmware-update-notification notification-item';
  var viewItem = view.item(0);

  if (viewItem) {
    notification.innerHTML = viewItem.innerHTML;
  }

  var button = notification.getElementsByClassName('notification-button')[0];
  var url = release.channel === 'beta' ? 'https://beta-wallet.trezor.io/' : 'https://wallet.trezor.io/';
  var version = release.version.join('.');
  button.setAttribute('href', url + "?fw=" + version);
  container.appendChild(notification);
  var close = notification.querySelector('.close-icon');

  if (close) {
    close.addEventListener('click', function () {
      container.removeChild(notification);
    });
  }
};
var notification_showBridgeUpdateNotification = function showBridgeUpdateNotification() {
  var container = document.getElementsByClassName('notification')[0];
  var warning = container.querySelector('.bridge-update-notification');

  if (warning) {
    // already exists
    return;
  }

  var view = views.getElementsByClassName('bridge-update-notification');
  var notification = document.createElement('div');
  notification.className = 'bridge-update-notification notification-item';
  var viewItem = view.item(0);

  if (viewItem) {
    notification.innerHTML = viewItem.innerHTML;
  }

  container.appendChild(notification);
  var close = notification.querySelector('.close-icon');

  if (close) {
    close.addEventListener('click', function () {
      container.removeChild(notification);
    });
  }
};
var notification_showBackupNotification = function showBackupNotification(device) {
  var container = document.getElementsByClassName('notification')[0];
  var warning = container.querySelector('.backup-notification');

  if (warning) {
    // already exists
    return;
  }

  var view = views.getElementsByClassName('backup-notification');
  var notification = document.createElement('div');
  notification.className = 'backup-notification notification-item';
  var viewItem = view.item(0);

  if (viewItem) {
    notification.innerHTML = viewItem.innerHTML;
  }

  container.appendChild(notification);
  var close = notification.querySelector('.close-icon');

  if (close) {
    close.addEventListener('click', function () {
      container.removeChild(notification);
    });
  }
};
// EXTERNAL MODULE: ./src/styles/popup.less
var styles_popup = __webpack_require__(256);

// CONCATENATED MODULE: ./src/js/popup/popup.js











// eslint-disable-next-line no-unused-vars
 // handle messages from window.opener and iframe

var popup_handleMessage = function handleMessage(event) {
  console.warn('HANDLE MESSAGE IN POPUP', event);
  var data = event.data;
  if (!data) return; // This is message from the window.opener

  if (data.type === popup["h" /* INIT */]) {
    init(data.payload); // eslint-disable-line no-use-before-define

    return;
  } // ignore messages from origin other then parent.window or whitelisted


  var isMessagePort = event.target instanceof MessagePort || event.target instanceof BroadcastChannel;
  if (!isMessagePort && Object(networkUtils["a" /* getOrigin */])(event.origin) !== Object(networkUtils["a" /* getOrigin */])(document.referrer) && !DataManager["a" /* default */].isWhitelisted(event.origin)) return; // catch first message from iframe

  if (data.type === popup["g" /* HANDSHAKE */]) {
    handshake(data.payload); // eslint-disable-line no-use-before-define

    return;
  }

  var message = Object(js_message["a" /* parseMessage */])(event.data);

  switch (message.type) {
    case ui["LOADING"]:
    case ui["REQUEST_UI_WINDOW"]:
      showView('loader');
      break;

    case ui["SET_OPERATION"]:
      if (typeof message.payload === 'string') {
        common_setOperation(message.payload);
      }

      break;

    case ui["TRANSPORT"]:
      showView('transport');
      break;

    case ui["SELECT_DEVICE"]:
      selectDevice_selectDevice(message.payload);
      break;

    case ui["SELECT_ACCOUNT"]:
      selectAccount_selectAccount(message.payload);
      break;

    case ui["SELECT_FEE"]:
      selectFee_selectFee(message.payload);
      break;

    case ui["UPDATE_CUSTOM_FEE"]:
      selectFee_updateCustomFee(message.payload);
      break;

    case ui["INSUFFICIENT_FUNDS"]:
      showView('insufficient-funds');
      break;

    case ui["REQUEST_BUTTON"]:
      requestButton_requestButton(message.payload);
      break;

    case ui["BOOTLOADER"]:
      showView('bootloader');
      break;

    case ui["INITIALIZE"]:
      showView('initialize');
      break;

    case ui["SEEDLESS"]:
      showView('seedless');
      break;

    case ui["FIRMWARE_OLD"]:
      firmwareRequiredUpdate_firmwareRequiredUpdate(message.payload);
      break;

    case ui["FIRMWARE_NOT_SUPPORTED"]:
      firmwareNotSupported_firmwareNotSupported(message.payload);
      break;

    case ui["FIRMWARE_NOT_COMPATIBLE"]:
      firmwareNotCompatible_firmwareNotCompatible(message.payload);
      break;

    case ui["FIRMWARE_OUTDATED"]:
      notification_showFirmwareUpdateNotification(message.payload);
      break;

    case ui["DEVICE_NEEDS_BACKUP"]:
      notification_showBackupNotification(message.payload);
      break;

    case ui["BROWSER_NOT_SUPPORTED"]:
    case ui["BROWSER_OUTDATED"]:
      browser_initBrowserView(message.payload);
      break;

    case ui["REQUEST_PERMISSION"]:
      permissions_initPermissionsView(message.payload);
      break;

    case ui["REQUEST_CONFIRMATION"]:
      confirmation_initConfirmationView(message.payload);
      break;

    case ui["REQUEST_PIN"]:
      pin_initPinView(message.payload);
      break;

    case ui["INVALID_PIN"]:
      showView('invalid-pin');
      break;

    case ui["REQUEST_PASSPHRASE"]:
      passphrase_initPassphraseView(message.payload);
      break;

    case ui["REQUEST_PASSPHRASE_ON_DEVICE"]:
      passphraseOnDevice_passphraseOnDeviceView(message.payload);
      break;

    case ui["INVALID_PASSPHRASE"]:
      invalidPassphrase_initInvalidPassphraseView(message.payload);
      break;
  }
}; // handle POPUP.INIT message from window.opener


var init =
/*#__PURE__*/
function () {
  var _ref = asyncToGenerator_default()(
  /*#__PURE__*/
  regenerator_default.a.mark(function _callee(payload) {
    var broadcastID;
    return regenerator_default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (payload) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return");

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return DataManager["a" /* default */].load(payload.settings);

          case 5:
            // initialize message channel
            broadcastID = payload.settings.env + "-" + payload.settings.timestamp;
            initMessageChannel(broadcastID, popup_handleMessage); // reset loading hash

            window.location.hash = ''; // handshake with iframe

            common_postMessage(new builder["e" /* UiMessage */](popup["g" /* HANDSHAKE */]));
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](2);
            postMessageToParent(new builder["e" /* UiMessage */](popup["e" /* ERROR */], {
              error: _context.t0.message || _context.t0
            }));

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 11]]);
  }));

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
}(); // handle POPUP.HANDSHAKE message from iframe


var handshake =
/*#__PURE__*/
function () {
  var _ref2 = asyncToGenerator_default()(
  /*#__PURE__*/
  regenerator_default.a.mark(function _callee2(payload) {
    return regenerator_default.a.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (payload) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt("return");

          case 2:
            common_setOperation(payload.method || '');

            if (payload.transport && payload.transport.outdated) {
              notification_showBridgeUpdateNotification();
            } // postMessage(new UiMessage(POPUP.HANDSHAKE));


          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function handshake(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var popup_onLoad = function onLoad() {
  console.log('OPENER ' + window.opener + ' ref: ' + window.parent); // unsupported browser, this hash was set in parent app (PopupManager)
  // display message and do not continue

  if (window.location.hash === '#unsupported') {
    browser_initBrowserView({
      name: '',
      osname: '',
      outdated: false,
      supported: false,
      mobile: false
    });
    return;
  }

  postMessageToParent(new builder["e" /* UiMessage */](popup["i" /* LOADED */]));
};

window.addEventListener('load', popup_onLoad, false);
window.addEventListener('message', popup_handleMessage, false); // global method used in html-inline elements

window.closeWindow = function () {
  setTimeout(function () {
    window.postMessage({
      type: popup["d" /* CLOSE_WINDOW */]
    }, window.location.origin);
    window.close();
  }, 100);
};

/***/ }),

/***/ 87:
/***/ (function(module, exports) {

function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;

/***/ }),

/***/ 9:
/***/ (function(module, exports) {

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

module.exports = _inheritsLoose;

/***/ }),

/***/ 92:
/***/ (function(module, exports, __webpack_require__) {

var getPrototypeOf = __webpack_require__(135);

var setPrototypeOf = __webpack_require__(87);

var isNativeFunction = __webpack_require__(136);

var construct = __webpack_require__(137);

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  module.exports = _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return construct(Class, arguments, getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

module.exports = _wrapNativeSuper;

/***/ }),

/***/ 93:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return parseMessage; });


// parse MessageEvent .data into CoreMessage
var parseMessage = function parseMessage(messageData) {
  var message = {
    event: messageData.event,
    type: messageData.type,
    payload: messageData.payload
  };

  if (typeof messageData.id === 'number') {
    message.id = messageData.id;
  }

  if (typeof messageData.success === 'boolean') {
    message.success = messageData.success;
  }

  return message;
};

/***/ })

/******/ })["default"];
});