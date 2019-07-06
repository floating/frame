/******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = 68);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable node/no-deprecated-api */
var buffer = __webpack_require__(6)
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var ERRORS = __webpack_require__(44)
var NATIVE = __webpack_require__(19)

// short-hand
var tfJSON = ERRORS.tfJSON
var TfTypeError = ERRORS.TfTypeError
var TfPropertyTypeError = ERRORS.TfPropertyTypeError
var tfSubError = ERRORS.tfSubError
var getValueTypeName = ERRORS.getValueTypeName

var TYPES = {
  arrayOf: function arrayOf (type) {
    type = compile(type)

    function _arrayOf (array, strict) {
      if (!NATIVE.Array(array)) return false

      return array.every(function (value, i) {
        try {
          return typeforce(type, value, strict)
        } catch (e) {
          throw tfSubError(e, i)
        }
      })
    }
    _arrayOf.toJSON = function () { return '[' + tfJSON(type) + ']' }

    return _arrayOf
  },

  maybe: function maybe (type) {
    type = compile(type)

    function _maybe (value, strict) {
      return NATIVE.Nil(value) || type(value, strict, maybe)
    }
    _maybe.toJSON = function () { return '?' + tfJSON(type) }

    return _maybe
  },

  map: function map (propertyType, propertyKeyType) {
    propertyType = compile(propertyType)
    if (propertyKeyType) propertyKeyType = compile(propertyKeyType)

    function _map (value, strict) {
      if (!NATIVE.Object(value, strict)) return false
      if (NATIVE.Nil(value, strict)) return false

      for (var propertyName in value) {
        try {
          if (propertyKeyType) {
            typeforce(propertyKeyType, propertyName, strict)
          }
        } catch (e) {
          throw tfSubError(e, propertyName, 'key')
        }

        try {
          var propertyValue = value[propertyName]
          typeforce(propertyType, propertyValue, strict)
        } catch (e) {
          throw tfSubError(e, propertyName)
        }
      }

      return true
    }

    if (propertyKeyType) {
      _map.toJSON = function () {
        return '{' + tfJSON(propertyKeyType) + ': ' + tfJSON(propertyType) + '}'
      }
    } else {
      _map.toJSON = function () { return '{' + tfJSON(propertyType) + '}' }
    }

    return _map
  },

  object: function object (uncompiled) {
    var type = {}

    for (var typePropertyName in uncompiled) {
      type[typePropertyName] = compile(uncompiled[typePropertyName])
    }

    function _object (value, strict) {
      if (!NATIVE.Object(value)) return false
      if (NATIVE.Nil(value)) return false

      var propertyName

      try {
        for (propertyName in type) {
          var propertyType = type[propertyName]
          var propertyValue = value[propertyName]

          typeforce(propertyType, propertyValue, strict)
        }
      } catch (e) {
        throw tfSubError(e, propertyName)
      }

      if (strict) {
        for (propertyName in value) {
          if (type[propertyName]) continue

          throw new TfPropertyTypeError(undefined, propertyName)
        }
      }

      return true
    }
    _object.toJSON = function () { return tfJSON(type) }

    return _object
  },

  oneOf: function oneOf () {
    var types = [].slice.call(arguments).map(compile)

    function _oneOf (value, strict) {
      return types.some(function (type) {
        try {
          return typeforce(type, value, strict)
        } catch (e) {
          return false
        }
      })
    }
    _oneOf.toJSON = function () { return types.map(tfJSON).join('|') }

    return _oneOf
  },

  quacksLike: function quacksLike (type) {
    function _quacksLike (value) {
      return type === getValueTypeName(value)
    }
    _quacksLike.toJSON = function () { return type }

    return _quacksLike
  },

  tuple: function tuple () {
    var types = [].slice.call(arguments).map(compile)

    function _tuple (values, strict) {
      return types.every(function (type, i) {
        try {
          return typeforce(type, values[i], strict)
        } catch (e) {
          throw tfSubError(e, i)
        }
      }) && (!strict || values.length === arguments.length)
    }
    _tuple.toJSON = function () { return '(' + types.map(tfJSON).join(', ') + ')' }

    return _tuple
  },

  value: function value (expected) {
    function _value (actual) {
      return actual === expected
    }
    _value.toJSON = function () { return expected }

    return _value
  }
}

function compile (type) {
  if (NATIVE.String(type)) {
    if (type[0] === '?') return TYPES.maybe(compile(type.slice(1)))

    return NATIVE[type] || TYPES.quacksLike(type)
  } else if (type && NATIVE.Object(type)) {
    if (NATIVE.Array(type)) return TYPES.arrayOf(compile(type[0]))

    return TYPES.object(type)
  } else if (NATIVE.Function(type)) {
    return type
  }

  return TYPES.value(type)
}

function typeforce (type, value, strict, surrogate) {
  if (NATIVE.Function(type)) {
    if (type(value, strict)) return true

    throw new TfTypeError(surrogate || type, value)
  }

  // JIT
  return typeforce(compile(type), value, strict)
}

// assign types to typeforce function
for (var typeName in NATIVE) {
  typeforce[typeName] = NATIVE[typeName]
}

for (typeName in TYPES) {
  typeforce[typeName] = TYPES[typeName]
}

var EXTRA = __webpack_require__(73)
for (typeName in EXTRA) {
  typeforce[typeName] = EXTRA[typeName]
}

// async wrapper
function __async (type, value, strict, callback) {
  // default to falsy strict if using shorthand overload
  if (typeof strict === 'function') return __async(type, value, false, strict)

  try {
    typeforce(type, value, strict)
  } catch (e) {
    return callback(e)
  }

  callback()
}

typeforce.async = __async
typeforce.compile = compile
typeforce.TfTypeError = TfTypeError
typeforce.TfPropertyTypeError = TfPropertyTypeError

module.exports = typeforce


/***/ }),
/* 2 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var bip66 = __webpack_require__(42)
var pushdata = __webpack_require__(43)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var scriptNumber = __webpack_require__(45)

var OPS = __webpack_require__(5)
var REVERSE_OPS = __webpack_require__(74)
var OP_INT_BASE = OPS.OP_RESERVED // OP_1 - 1

function isOPInt (value) {
  return types.Number(value) &&
    ((value === OPS.OP_0) ||
    (value >= OPS.OP_1 && value <= OPS.OP_16) ||
    (value === OPS.OP_1NEGATE))
}

function isPushOnlyChunk (value) {
  return types.Buffer(value) || isOPInt(value)
}

function isPushOnly (value) {
  return types.Array(value) && value.every(isPushOnlyChunk)
}

function asMinimalOP (buffer) {
  if (buffer.length === 0) return OPS.OP_0
  if (buffer.length !== 1) return
  if (buffer[0] >= 1 && buffer[0] <= 16) return OP_INT_BASE + buffer[0]
  if (buffer[0] === 0x81) return OPS.OP_1NEGATE
}

function compile (chunks) {
  // TODO: remove me
  if (Buffer.isBuffer(chunks)) return chunks

  typeforce(types.Array, chunks)

  var bufferSize = chunks.reduce(function (accum, chunk) {
    // data chunk
    if (Buffer.isBuffer(chunk)) {
      // adhere to BIP62.3, minimal push policy
      if (chunk.length === 1 && asMinimalOP(chunk) !== undefined) {
        return accum + 1
      }

      return accum + pushdata.encodingLength(chunk.length) + chunk.length
    }

    // opcode
    return accum + 1
  }, 0.0)

  var buffer = Buffer.allocUnsafe(bufferSize)
  var offset = 0

  chunks.forEach(function (chunk) {
    // data chunk
    if (Buffer.isBuffer(chunk)) {
      // adhere to BIP62.3, minimal push policy
      var opcode = asMinimalOP(chunk)
      if (opcode !== undefined) {
        buffer.writeUInt8(opcode, offset)
        offset += 1
        return
      }

      offset += pushdata.encode(buffer, chunk.length, offset)
      chunk.copy(buffer, offset)
      offset += chunk.length

    // opcode
    } else {
      buffer.writeUInt8(chunk, offset)
      offset += 1
    }
  })

  if (offset !== buffer.length) throw new Error('Could not decode chunks')
  return buffer
}

function decompile (buffer) {
  // TODO: remove me
  if (types.Array(buffer)) return buffer

  typeforce(types.Buffer, buffer)

  var chunks = []
  var i = 0

  while (i < buffer.length) {
    var opcode = buffer[i]

    // data chunk
    if ((opcode > OPS.OP_0) && (opcode <= OPS.OP_PUSHDATA4)) {
      var d = pushdata.decode(buffer, i)

      // did reading a pushDataInt fail? empty script
      if (d === null) return []
      i += d.size

      // attempt to read too much data? empty script
      if (i + d.number > buffer.length) return []

      var data = buffer.slice(i, i + d.number)
      i += d.number

      // decompile minimally
      var op = asMinimalOP(data)
      if (op !== undefined) {
        chunks.push(op)
      } else {
        chunks.push(data)
      }

    // opcode
    } else {
      chunks.push(opcode)

      i += 1
    }
  }

  return chunks
}

function toASM (chunks) {
  if (Buffer.isBuffer(chunks)) {
    chunks = decompile(chunks)
  }

  return chunks.map(function (chunk) {
    // data?
    if (Buffer.isBuffer(chunk)) {
      var op = asMinimalOP(chunk)
      if (op === undefined) return chunk.toString('hex')
      chunk = op
    }

    // opcode!
    return REVERSE_OPS[chunk]
  }).join(' ')
}

function fromASM (asm) {
  typeforce(types.String, asm)

  return compile(asm.split(' ').map(function (chunkStr) {
    // opcode?
    if (OPS[chunkStr] !== undefined) return OPS[chunkStr]
    typeforce(types.Hex, chunkStr)

    // data!
    return Buffer.from(chunkStr, 'hex')
  }))
}

function toStack (chunks) {
  chunks = decompile(chunks)
  typeforce(isPushOnly, chunks)

  return chunks.map(function (op) {
    if (Buffer.isBuffer(op)) return op
    if (op === OPS.OP_0) return Buffer.allocUnsafe(0)

    return scriptNumber.encode(op - OP_INT_BASE)
  })
}

function isCanonicalPubKey (buffer) {
  if (!Buffer.isBuffer(buffer)) return false
  if (buffer.length < 33) return false

  switch (buffer[0]) {
    case 0x02:
    case 0x03:
      return buffer.length === 33
    case 0x04:
      return buffer.length === 65
  }

  return false
}

function isDefinedHashType (hashType) {
  var hashTypeMod = hashType & ~0x80

// return hashTypeMod > SIGHASH_ALL && hashTypeMod < SIGHASH_SINGLE
  return hashTypeMod > 0x00 && hashTypeMod < 0x04
}

function isCanonicalSignature (buffer) {
  if (!Buffer.isBuffer(buffer)) return false
  if (!isDefinedHashType(buffer[buffer.length - 1])) return false

  return bip66.check(buffer.slice(0, -1))
}

module.exports = {
  compile: compile,
  decompile: decompile,
  fromASM: fromASM,
  toASM: toASM,
  toStack: toStack,

  number: __webpack_require__(45),

  isCanonicalPubKey: isCanonicalPubKey,
  isCanonicalSignature: isCanonicalSignature,
  isPushOnly: isPushOnly,
  isDefinedHashType: isDefinedHashType
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var typeforce = __webpack_require__(1)

var UINT31_MAX = Math.pow(2, 31) - 1
function UInt31 (value) {
  return typeforce.UInt32(value) && value <= UINT31_MAX
}

function BIP32Path (value) {
  return typeforce.String(value) && value.match(/^(m\/)?(\d+'?\/)*\d+'?$/)
}
BIP32Path.toJSON = function () { return 'BIP32 derivation path' }

var SATOSHI_MAX = 21 * 1e14
function Satoshi (value) {
  return typeforce.UInt53(value) && value <= SATOSHI_MAX
}

// external dependent types
var BigInt = typeforce.quacksLike('BigInteger')
var ECPoint = typeforce.quacksLike('Point')

// exposed, external API
var ECSignature = typeforce.compile({ r: BigInt, s: BigInt })
var Network = typeforce.compile({
  messagePrefix: typeforce.oneOf(typeforce.Buffer, typeforce.String),
  bip32: {
    public: typeforce.UInt32,
    private: typeforce.UInt32
  },
  pubKeyHash: typeforce.UInt16,
  scriptHash: typeforce.UInt16,
  wif: typeforce.UInt8
})

// extend typeforce types with ours
var types = {
  BigInt: BigInt,
  BIP32Path: BIP32Path,
  Buffer256bit: typeforce.BufferN(32),
  ECPoint: ECPoint,
  ECSignature: ECSignature,
  Hash160bit: typeforce.BufferN(20),
  Hash256bit: typeforce.BufferN(32),
  Network: Network,
  Satoshi: Satoshi,
  UInt31: UInt31
}

for (var typeName in typeforce) {
  types[typeName] = typeforce[typeName]
}

module.exports = types


/***/ }),
/* 5 */
/***/ (function(module) {

module.exports = {"OP_FALSE":0,"OP_0":0,"OP_PUSHDATA1":76,"OP_PUSHDATA2":77,"OP_PUSHDATA4":78,"OP_1NEGATE":79,"OP_RESERVED":80,"OP_TRUE":81,"OP_1":81,"OP_2":82,"OP_3":83,"OP_4":84,"OP_5":85,"OP_6":86,"OP_7":87,"OP_8":88,"OP_9":89,"OP_10":90,"OP_11":91,"OP_12":92,"OP_13":93,"OP_14":94,"OP_15":95,"OP_16":96,"OP_NOP":97,"OP_VER":98,"OP_IF":99,"OP_NOTIF":100,"OP_VERIF":101,"OP_VERNOTIF":102,"OP_ELSE":103,"OP_ENDIF":104,"OP_VERIFY":105,"OP_RETURN":106,"OP_TOALTSTACK":107,"OP_FROMALTSTACK":108,"OP_2DROP":109,"OP_2DUP":110,"OP_3DUP":111,"OP_2OVER":112,"OP_2ROT":113,"OP_2SWAP":114,"OP_IFDUP":115,"OP_DEPTH":116,"OP_DROP":117,"OP_DUP":118,"OP_NIP":119,"OP_OVER":120,"OP_PICK":121,"OP_ROLL":122,"OP_ROT":123,"OP_SWAP":124,"OP_TUCK":125,"OP_CAT":126,"OP_SUBSTR":127,"OP_LEFT":128,"OP_RIGHT":129,"OP_SIZE":130,"OP_INVERT":131,"OP_AND":132,"OP_OR":133,"OP_XOR":134,"OP_EQUAL":135,"OP_EQUALVERIFY":136,"OP_RESERVED1":137,"OP_RESERVED2":138,"OP_1ADD":139,"OP_1SUB":140,"OP_2MUL":141,"OP_2DIV":142,"OP_NEGATE":143,"OP_ABS":144,"OP_NOT":145,"OP_0NOTEQUAL":146,"OP_ADD":147,"OP_SUB":148,"OP_MUL":149,"OP_DIV":150,"OP_MOD":151,"OP_LSHIFT":152,"OP_RSHIFT":153,"OP_BOOLAND":154,"OP_BOOLOR":155,"OP_NUMEQUAL":156,"OP_NUMEQUALVERIFY":157,"OP_NUMNOTEQUAL":158,"OP_LESSTHAN":159,"OP_GREATERTHAN":160,"OP_LESSTHANOREQUAL":161,"OP_GREATERTHANOREQUAL":162,"OP_MIN":163,"OP_MAX":164,"OP_WITHIN":165,"OP_RIPEMD160":166,"OP_SHA1":167,"OP_SHA256":168,"OP_HASH160":169,"OP_HASH256":170,"OP_CODESEPARATOR":171,"OP_CHECKSIG":172,"OP_CHECKSIGVERIFY":173,"OP_CHECKMULTISIG":174,"OP_CHECKMULTISIGVERIFY":175,"OP_NOP1":176,"OP_NOP2":177,"OP_CHECKLOCKTIMEVERIFY":177,"OP_NOP3":178,"OP_CHECKSEQUENCEVERIFY":178,"OP_NOP4":179,"OP_NOP5":180,"OP_NOP6":181,"OP_NOP7":182,"OP_NOP8":183,"OP_NOP9":184,"OP_NOP10":185,"OP_PUBKEYHASH":253,"OP_PUBKEY":254,"OP_INVALIDOPCODE":255};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(71)
var ieee754 = __webpack_require__(72)
var isArray = __webpack_require__(41)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7)))

/***/ }),
/* 7 */
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
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/

var pna = __webpack_require__(16);
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = __webpack_require__(14);
util.inherits = __webpack_require__(2);
/*</replacement>*/

var Readable = __webpack_require__(54);
var Writable = __webpack_require__(27);

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var BigInteger = __webpack_require__(65)

//addons
__webpack_require__(118)

module.exports = BigInteger

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var createHash = __webpack_require__(50)

function ripemd160 (buffer) {
  return createHash('rmd160').update(buffer).digest()
}

function sha1 (buffer) {
  return createHash('sha1').update(buffer).digest()
}

function sha256 (buffer) {
  return createHash('sha256').update(buffer).digest()
}

function hash160 (buffer) {
  return ripemd160(sha256(buffer))
}

function hash256 (buffer) {
  return sha256(sha256(buffer))
}

module.exports = {
  hash160: hash160,
  hash256: hash256,
  ripemd160: ripemd160,
  sha1: sha1,
  sha256: sha256
}


/***/ }),
/* 11 */
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
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer

// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = Buffer.alloc(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = Buffer.from(data, enc)
  }

  var block = this._block
  var blockSize = this._blockSize
  var length = data.length
  var accum = this._len

  for (var offset = 0; offset < length;) {
    var assigned = accum % blockSize
    var remainder = Math.min(length - offset, blockSize - assigned)

    for (var i = 0; i < remainder; i++) {
      block[assigned + i] = data[offset + i]
    }

    accum += remainder
    offset += remainder

    if ((accum % blockSize) === 0) {
      this._update(block)
    }
  }

  this._len += length
  return this
}

Hash.prototype.digest = function (enc) {
  var rem = this._len % this._blockSize

  this._block[rem] = 0x80

  // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
  // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
  this._block.fill(0, rem + 1)

  if (rem >= this._finalSize) {
    this._update(this._block)
    this._block.fill(0)
  }

  var bits = this._len * 8

  // uint32
  if (bits <= 0xffffffff) {
    this._block.writeUInt32BE(bits, this._blockSize - 4)

  // uint64
  } else {
    var lowBits = (bits & 0xffffffff) >>> 0
    var highBits = (bits - lowBits) / 0x100000000

    this._block.writeUInt32BE(highBits, this._blockSize - 8)
    this._block.writeUInt32BE(lowBits, this._blockSize - 4)
  }

  this._update(this._block)
  var hash = this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

// https://en.bitcoin.it/wiki/List_of_address_prefixes
// Dogecoin BIP32 is a proposed standard: https://bitcointalk.org/index.php?topic=409731
var coins = __webpack_require__(63)

module.exports = {
  bitcoin: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    coin: coins.BTC
  },
  testnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    coin: coins.BTC
  },
  litecoin: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
    coin: coins.LTC
  },
  dash: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x4c, // https://dash-docs.github.io/en/developer-reference#opcodes
    scriptHash: 0x10,
    wif: 0xcc,
    coin: coins.DASH
  },
  dashTest: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x8c, // https://dash-docs.github.io/en/developer-reference#opcodes
    scriptHash: 0x13,
    wif: 0xef, // https://github.com/dashpay/godashutil/blob/master/wif.go#L72
    coin: coins.DASH
  },
  zcash: {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x1cb8,
    scriptHash: 0x1cbd,
    wif: 0x80,
    // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
    // dummy value.
    consensusBranchId: {
      1: 0x00,
      2: 0x00,
      3: 0x5ba81b19,
      4: 0x76b809bb
    },
    coin: coins.ZEC
  },
  zcashTest: {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x1d25,
    scriptHash: 0x1cba,
    wif: 0xef,
    consensusBranchId: {
      1: 0x00,
      2: 0x00,
      3: 0x5ba81b19,
      4: 0x76b809bb
    },
    coin: coins.ZEC
  },
  capricoin: {
    messagePrefix: '\x18Capricoin Signed Message:\n',
    bech32: null,
    bip32: {
      public: 76067358,
      private: 76066276
    },
    pubKeyHash: 28,
    scriptHash: 35,
    wif: 0xef,
    coin: coins.CAPRICOIN
  }
}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var script = __webpack_require__(3)

var templates = __webpack_require__(20)
for (var key in templates) {
  script[key] = templates[key]
}

module.exports = {
  bufferutils: __webpack_require__(49), // TODO: remove in 4.0.0

  Block: __webpack_require__(90),
  ECPair: __webpack_require__(31),
  ECSignature: __webpack_require__(34),
  HDNode: __webpack_require__(125),
  Transaction: __webpack_require__(30),
  TransactionBuilder: __webpack_require__(126),

  address: __webpack_require__(32),
  crypto: __webpack_require__(10),
  networks: __webpack_require__(13),
  opcodes: __webpack_require__(5),
  script: script
}


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(11)))

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var createHash = __webpack_require__(50)
var bs58checkBase = __webpack_require__(111)

// SHA256(SHA256(buffer))
function sha256x2 (buffer) {
  var tmp = createHash('sha256').update(buffer).digest()
  return createHash('sha256').update(tmp).digest()
}

module.exports = bs58checkBase(sha256x2)


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deferred = deferred;

function deferred() {
  // ignoring coverage on functions that are just for
  // type correctness

  /* istanbul ignore next */
  var outResolve = function outResolve() {};
  /* istanbul ignore next */


  var outReject = function outReject() {};

  var promise = new Promise(function (resolve, reject) {
    outResolve = resolve;
    outReject = reject;
  });
  return {
    promise: promise,
    resolve: outResolve,
    reject: outReject
  };
}

/***/ }),
/* 19 */
/***/ (function(module, exports) {

var types = {
  Array: function (value) { return value !== null && value !== undefined && value.constructor === Array },
  Boolean: function (value) { return typeof value === 'boolean' },
  Function: function (value) { return typeof value === 'function' },
  Nil: function (value) { return value === undefined || value === null },
  Number: function (value) { return typeof value === 'number' },
  Object: function (value) { return typeof value === 'object' },
  String: function (value) { return typeof value === 'string' },
  '': function () { return true }
}

// TODO: deprecate
types.Null = types.Nil

for (var typeName in types) {
  types[typeName].toJSON = function (t) {
    return t
  }.bind(null, typeName)
}

module.exports = types


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var decompile = __webpack_require__(3).decompile
var multisig = __webpack_require__(21)
var nullData = __webpack_require__(76)
var pubKey = __webpack_require__(22)
var pubKeyHash = __webpack_require__(23)
var scriptHash = __webpack_require__(81)
var witnessPubKeyHash = __webpack_require__(84)
var witnessScriptHash = __webpack_require__(86)
var witnessCommitment = __webpack_require__(88)

var types = {
  MULTISIG: 'multisig',
  NONSTANDARD: 'nonstandard',
  NULLDATA: 'nulldata',
  P2PK: 'pubkey',
  P2PKH: 'pubkeyhash',
  P2SH: 'scripthash',
  P2WPKH: 'witnesspubkeyhash',
  P2WSH: 'witnessscripthash',
  WITNESS_COMMITMENT: 'witnesscommitment'
}

function classifyOutput (script) {
  if (witnessPubKeyHash.output.check(script)) return types.P2WPKH
  if (witnessScriptHash.output.check(script)) return types.P2WSH
  if (pubKeyHash.output.check(script)) return types.P2PKH
  if (scriptHash.output.check(script)) return types.P2SH

  // XXX: optimization, below functions .decompile before use
  var chunks = decompile(script)
  if (multisig.output.check(chunks)) return types.MULTISIG
  if (pubKey.output.check(chunks)) return types.P2PK
  if (witnessCommitment.output.check(chunks)) return types.WITNESS_COMMITMENT
  if (nullData.output.check(chunks)) return types.NULLDATA

  return types.NONSTANDARD
}

function classifyInput (script, allowIncomplete) {
  // XXX: optimization, below functions .decompile before use
  var chunks = decompile(script)

  if (pubKeyHash.input.check(chunks)) return types.P2PKH
  if (scriptHash.input.check(chunks, allowIncomplete)) return types.P2SH
  if (multisig.input.check(chunks, allowIncomplete)) return types.MULTISIG
  if (pubKey.input.check(chunks)) return types.P2PK

  return types.NONSTANDARD
}

function classifyWitness (script, allowIncomplete) {
  // XXX: optimization, below functions .decompile before use
  var chunks = decompile(script)

  if (witnessPubKeyHash.input.check(chunks)) return types.P2WPKH
  if (witnessScriptHash.input.check(chunks, allowIncomplete)) return types.P2WSH

  return types.NONSTANDARD
}

module.exports = {
  classifyInput: classifyInput,
  classifyOutput: classifyOutput,
  classifyWitness: classifyWitness,
  multisig: multisig,
  nullData: nullData,
  pubKey: pubKey,
  pubKeyHash: pubKeyHash,
  scriptHash: scriptHash,
  witnessPubKeyHash: witnessPubKeyHash,
  witnessScriptHash: witnessScriptHash,
  witnessCommitment: witnessCommitment,
  types: types
}


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(75),
  output: __webpack_require__(46)
}


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(77),
  output: __webpack_require__(78)
}


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(79),
  output: __webpack_require__(80)
}


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var Buffer = __webpack_require__(0).Buffer

// Number.MAX_SAFE_INTEGER
var MAX_SAFE_INTEGER = 9007199254740991

function checkUInt53 (n) {
  if (n < 0 || n > MAX_SAFE_INTEGER || n % 1 !== 0) throw new RangeError('value out of range')
}

function encode (number, buffer, offset) {
  checkUInt53(number)

  if (!buffer) buffer = Buffer.allocUnsafe(encodingLength(number))
  if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance')
  if (!offset) offset = 0

  // 8 bit
  if (number < 0xfd) {
    buffer.writeUInt8(number, offset)
    encode.bytes = 1

  // 16 bit
  } else if (number <= 0xffff) {
    buffer.writeUInt8(0xfd, offset)
    buffer.writeUInt16LE(number, offset + 1)
    encode.bytes = 3

  // 32 bit
  } else if (number <= 0xffffffff) {
    buffer.writeUInt8(0xfe, offset)
    buffer.writeUInt32LE(number, offset + 1)
    encode.bytes = 5

  // 64 bit
  } else {
    buffer.writeUInt8(0xff, offset)
    buffer.writeUInt32LE(number >>> 0, offset + 1)
    buffer.writeUInt32LE((number / 0x100000000) | 0, offset + 5)
    encode.bytes = 9
  }

  return buffer
}

function decode (buffer, offset) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance')
  if (!offset) offset = 0

  var first = buffer.readUInt8(offset)

  // 8 bit
  if (first < 0xfd) {
    decode.bytes = 1
    return first

  // 16 bit
  } else if (first === 0xfd) {
    decode.bytes = 3
    return buffer.readUInt16LE(offset + 1)

  // 32 bit
  } else if (first === 0xfe) {
    decode.bytes = 5
    return buffer.readUInt32LE(offset + 1)

  // 64 bit
  } else {
    decode.bytes = 9
    var lo = buffer.readUInt32LE(offset + 1)
    var hi = buffer.readUInt32LE(offset + 5)
    var number = hi * 0x0100000000 + lo
    checkUInt53(number)

    return number
  }
}

function encodingLength (number) {
  checkUInt53(number)

  return (
    number < 0xfd ? 1
  : number <= 0xffff ? 3
  : number <= 0xffffffff ? 5
  : 9
  )
}

module.exports = { encode: encode, decode: decode, encodingLength: encodingLength }


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = $getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    ReflectApply(this.listener, this.target, args);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(54);
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = __webpack_require__(27);
exports.Duplex = __webpack_require__(8);
exports.Transform = __webpack_require__(57);
exports.PassThrough = __webpack_require__(97);


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



/*<replacement>*/

var pna = __webpack_require__(16);
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = __webpack_require__(14);
util.inherits = __webpack_require__(2);
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(96)
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(55);
/*</replacement>*/

/*<replacement>*/

var Buffer = __webpack_require__(0).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = __webpack_require__(56);

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || __webpack_require__(8);

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || __webpack_require__(8);

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(11), __webpack_require__(94).setImmediate, __webpack_require__(7)))

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var Buffer = __webpack_require__(0).Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var Transform = __webpack_require__(53).Transform
var StringDecoder = __webpack_require__(28).StringDecoder
var inherits = __webpack_require__(2)

function CipherBase (hashMode) {
  Transform.call(this)
  this.hashMode = typeof hashMode === 'string'
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest
  } else {
    this.final = this._finalOrDigest
  }
  if (this._final) {
    this.__final = this._final
    this._final = null
  }
  this._decoder = null
  this._encoding = null
}
inherits(CipherBase, Transform)

CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = Buffer.from(data, inputEnc)
  }

  var outData = this._update(data)
  if (this.hashMode) return this

  if (outputEnc) {
    outData = this._toString(outData, outputEnc)
  }

  return outData
}

CipherBase.prototype.setAutoPadding = function () {}
CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
}

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
}

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
}

CipherBase.prototype._transform = function (data, _, next) {
  var err
  try {
    if (this.hashMode) {
      this._update(data)
    } else {
      this.push(this._update(data))
    }
  } catch (e) {
    err = e
  } finally {
    next(err)
  }
}
CipherBase.prototype._flush = function (done) {
  var err
  try {
    this.push(this.__final())
  } catch (e) {
    err = e
  }

  done(err)
}
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this.__final() || Buffer.alloc(0)
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true)
  }
  return outData
}

CipherBase.prototype._toString = function (value, enc, fin) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc)
    this._encoding = enc
  }

  if (this._encoding !== enc) throw new Error('can\'t switch encodings')

  var out = this._decoder.write(value)
  if (fin) {
    out += this._decoder.end()
  }

  return out
}

module.exports = CipherBase


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var bcrypto = __webpack_require__(10)
var blake2b = __webpack_require__(107)
var bscript = __webpack_require__(3)
var bufferutils = __webpack_require__(49)
var opcodes = __webpack_require__(5)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var varuint = __webpack_require__(24)
var networks = __webpack_require__(13)
var coins = __webpack_require__(63)

function varSliceSize (someScript) {
  var length = someScript.length

  return varuint.encodingLength(length) + length
}

function vectorSize (someVector) {
  var length = someVector.length

  return varuint.encodingLength(length) + someVector.reduce(function (sum, witness) {
    return sum + varSliceSize(witness)
  }, 0)
}

function Transaction (network) {
  this.version = 3
  this.locktime = 0
  this.timestamp = 0 // capricoin specific
  this.network = network || networks.zcash
  this.ins = []
  this.outs = []
  this.joinsplits = [] // zcash specific
  this.versionGroupId = '0x03c48270' // zcash specific
  this.expiry = 0 // zcash specific
  this.spendDescs = []; // zcash specific
  this.outputDescs = []; // zcash specific
  this.dashType = 0 // dash specific
  this.dashPayload = 0 // dash specific
  this.invalidTransaction = false;
}

Transaction.DEFAULT_SEQUENCE = 0xffffffff
Transaction.SIGHASH_ALL = 0x01
Transaction.SIGHASH_NONE = 0x02
Transaction.SIGHASH_SINGLE = 0x03
Transaction.SIGHASH_ANYONECANPAY = 0x80
Transaction.ADVANCED_TRANSACTION_MARKER = 0x00
Transaction.ADVANCED_TRANSACTION_FLAG = 0x01

var EMPTY_SCRIPT = Buffer.allocUnsafe(0)
var EMPTY_WITNESS = []
var ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
var ONE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
var VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex')
var BLANK_OUTPUT = {
  script: EMPTY_SCRIPT,
  valueBuffer: VALUE_UINT64_MAX
}

Transaction.ZCASH_OVERWINTER_VERSION = 3
Transaction.ZCASH_SAPLING_VERSION = 4
Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION = 2
Transaction.ZCASH_NUM_JS_INPUTS = 2
Transaction.ZCASH_NUM_JS_OUTPUTS = 2
Transaction.ZCASH_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16

Transaction.ZCASH_G1_PREFIX_MASK = 0x02
Transaction.ZCASH_G2_PREFIX_MASK = 0x0a

Transaction.DASH_NORMAL = 0
Transaction.DASH_PROVIDER_REGISTER = 1
Transaction.DASH_PROVIDER_UPDATE_SERVICE = 2
Transaction.DASH_PROVIDER_UPDATE_REGISTRAR = 3
Transaction.DASH_PROVIDER_UPDATE_REVOKE = 4
Transaction.DASH_COINBASE = 5
Transaction.DASH_QUORUM_COMMITMENT = 6

Transaction.PREVOUTS_HASH_PERSON = new Buffer('ZcashPrevoutHash')
Transaction.SEQUENCE_HASH_PERSON = new Buffer('ZcashSequencHash')
Transaction.OUTPUTS_HASH_PERSON = new Buffer('ZcashOutputsHash')
Transaction.JOINSPLITS_HASH_PERSON = new Buffer('ZcashJSplitsHash')
Transaction.OVERWINTER_HASH_PERSON = Buffer.concat([new Buffer('ZcashSigHash'), Buffer.from('191ba85b', 'hex')])

// Sapling note magic values, copied from src/zcash/Zcash.h
var NOTEENCRYPTION_AUTH_BYTES = 16;
var ZC_NOTEPLAINTEXT_LEADING = 1;
var ZC_V_SIZE = 8;
var ZC_RHO_SIZE = 32;
var ZC_R_SIZE = 32;
var ZC_MEMO_SIZE = 512;
var ZC_DIVERSIFIER_SIZE = 11;
var ZC_JUBJUB_POINT_SIZE = 32;
var ZC_JUBJUB_SCALAR_SIZE = 32;
var ZC_NOTEPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_V_SIZE + ZC_RHO_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_ENCPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_DIVERSIFIER_SIZE + ZC_V_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_OUTPLAINTEXT_SIZE = ZC_JUBJUB_POINT_SIZE + ZC_JUBJUB_SCALAR_SIZE;
var ZC_SAPLING_ENCCIPHERTEXT_SIZE = ZC_SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
var ZC_SAPLING_OUTCIPHERTEXT_SIZE = ZC_SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;

Transaction.fromBuffer = function (buffer, network, __noStrict) {
  var offset = 0
  function readSlice (n) {
    offset += n
    return buffer.slice(offset - n, offset)
  }

  function readUInt8 () {
    var i = buffer.readUInt8(offset)
    offset += 1
    return i
  }

  function readUInt32 () {
    var i = buffer.readUInt32LE(offset)
    offset += 4
    return i
  }

  function readInt32 () {
    var i = buffer.readInt32LE(offset)
    offset += 4
    return i
  }

  function readUInt64 () {
    var i = bufferutils.readUInt64LE(buffer, offset)
    offset += 8
    return i
  }

  function readVarInt () {
    var vi = varuint.decode(buffer, offset)
    offset += varuint.decode.bytes
    return vi
  }

  function readVarSlice () {
    return readSlice(readVarInt())
  }

  function readVector () {
    var count = readVarInt()
    var vector = []
    for (var i = 0; i < count; i++) vector.push(readVarSlice())
    return vector
  }

  function readCompressedG1 () {
    var yLsb = readUInt8() & 1
    var x = readSlice(32)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  function readCompressedG2 () {
    var yLsb = readUInt8() & 1
    var x = readSlice(64)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  // zcash sapling
  function readSpentDesc () {
    var res = {};
    res.cv = readSlice(32);
    res.anchor = readSlice(32);
    res.nullifier = readSlice(32);
    res.rk = readSlice(32);
    res.proof = readSlice(48 + 96 + 48);
    res.spendAuthSig = readSlice(64);
    return res;
  }

  function readOutputDesc () {
    var res = {};
    res.cv = readSlice(32);
    res.cmu = readSlice(32);
    res.ephemeralKey = readSlice(32);
    res.encCipherText = readSlice(ZC_SAPLING_ENCCIPHERTEXT_SIZE);
    res.outCipherText = readSlice(ZC_SAPLING_OUTCIPHERTEXT_SIZE);
    res.proof = readSlice(48 + 96 + 48);
    return res;
  }

  var tx = new Transaction()
  tx.network = network || networks.bitcoin
  tx.version = readInt32()

  if (coins.isZcash(tx.network)) {
    var overwintered = tx.version >>> 31
    tx.version = tx.version & 0x7fffffff
    if (tx.version >= 3) {
      if (!overwintered) {
        throw new Error('zcash tx v3+ not overwintered')
      }
      tx.versionGroupId = readUInt32()
    }
  } else if(coins.isDash(tx.network)) {
    tx.dashType = tx.version >> 16
    tx.version = tx.version & 0xffff
    if (tx.version === 3 && (tx.dashType < Transaction.DASH_NORMAL || tx.dashType > Transaction.DASH_QUORUM_COMMITMENT)) {
      throw new Error('Unsupported Dash transaction type')
    }
  }

  var marker = buffer.readUInt8(offset)
  var flag = buffer.readUInt8(offset + 1)

  var hasWitnesses = false
  if (!coins.isZcash(tx.network)) {
    if (marker === Transaction.ADVANCED_TRANSACTION_MARKER &&
        flag === Transaction.ADVANCED_TRANSACTION_FLAG) {
      offset += 2
      hasWitnesses = true
    }
  }

  if (coins.isCapricoin(tx.network)) {
    tx.timestamp = readUInt32()
  }

  var vinLen = readVarInt()
  for (var i = 0; i < vinLen; ++i) {
    tx.ins.push({
      hash: readSlice(32),
      index: readUInt32(),
      script: readVarSlice(),
      sequence: readUInt32(),
      witness: EMPTY_WITNESS
    })
  }

  var voutLen = readVarInt()
  for (i = 0; i < voutLen; ++i) {
    tx.outs.push({
      value: readUInt64(),
      script: readVarSlice()
    })
  }

  if (hasWitnesses) {
    for (i = 0; i < vinLen; ++i) {
      tx.ins[i].witness = readVector()
    }

    // was this pointless?
    if (!tx.hasWitnesses()) throw new Error('Transaction has superfluous witness data')
  }

  tx.locktime = readUInt32()

  if (tx.isOverwinterCompatible()) {
    tx.expiry = readUInt32()
  }

  if (tx.isSaplingCompatible()) {
    tx.valueBalance = readUInt64();
    var sizeSpendDescs = readVarInt();
    for (var i = 0; i < sizeSpendDescs; i++) {
      var spend = readSpentDesc();
      tx.spendDescs.push(spend);
    }

    var sizeOutputDescs = readVarInt();
    for (var i = 0; i < sizeOutputDescs; i++) {
      var output = readOutputDesc();
      tx.outputDescs.push(output);
    }
  }

  if (tx.supportsJoinSplits()) {
    var jsLen = readVarInt()
    for (i = 0; i < jsLen; ++i) {
      var vpubOld = readUInt64()
      var vpubNew = readUInt64()
      var anchor = readSlice(32)
      var nullifiers = []
      for (var j = 0; j < Transaction.ZCASH_NUM_JS_INPUTS; j++) {
        nullifiers.push(readSlice(32))
      }
      var commitments = []
      for (j = 0; j < Transaction.ZCASH_NUM_JS_OUTPUTS; j++) {
        commitments.push(readSlice(32))
      }
      var ephemeralKey = readSlice(32)
      var randomSeed = readSlice(32)
      var macs = []
      for (j = 0; j < Transaction.ZCASH_NUM_JS_INPUTS; j++) {
        macs.push(readSlice(32))
      }
      var zproof = {};
      if (tx.version <= 3) {
        zproof = {
          gA: readCompressedG1(),
          gAPrime: readCompressedG1(),
          gB: readCompressedG2(),
          gBPrime: readCompressedG1(),
          gC: readCompressedG1(),
          gCPrime: readCompressedG1(),
          gK: readCompressedG1(),
          gH: readCompressedG1()
        }
      } else {
        zproof = {
          sA: readSlice(48),
          sB: readSlice(96),
          sC: readSlice(48)
        }
      }
      var ciphertexts = []
      for (j = 0; j < Transaction.ZCASH_NUM_JS_OUTPUTS; j++) {
        ciphertexts.push(readSlice(Transaction.ZCASH_NOTECIPHERTEXT_SIZE))
      }

      tx.joinsplits.push({
        vpubOld: vpubOld,
        vpubNew: vpubNew,
        anchor: anchor,
        nullifiers: nullifiers,
        commitments: commitments,
        ephemeralKey: ephemeralKey,
        randomSeed: randomSeed,
        macs: macs,
        zproof: zproof,
        ciphertexts: ciphertexts
      })
    }
    if (jsLen > 0) {
      tx.joinsplitPubkey = readSlice(32)
      tx.joinsplitSig = readSlice(64)
    }
    if (tx.isSaplingCompatible() && ((tx.spendDescs.length + tx.outputDescs.length) > 0)) {
      tx.bindingSig = readSlice(64);
    }
  }
  

  if (tx.isDashSpecialTransaction()) {
    tx.dashPayload = readVarSlice()
  }

  if (__noStrict) return tx
  if (offset !== buffer.length) throw new Error('Transaction has unexpected data')

  return tx
}

Transaction.fromHex = function (hex, network) {
  return Transaction.fromBuffer(new Buffer(hex, 'hex'), network)
}

Transaction.isCoinbaseHash = function (buffer) {
  typeforce(types.Hash256bit, buffer)
  for (var i = 0; i < 32; ++i) {
    if (buffer[i] !== 0) return false
  }
  return true
}

Transaction.prototype.isCoinbase = function () {
  return this.ins.length === 1 && Transaction.isCoinbaseHash(this.ins[0].hash)
}

Transaction.prototype.addInput = function (hash, index, sequence, scriptSig) {
  typeforce(types.tuple(
    types.Hash256bit,
    types.UInt32,
    types.maybe(types.UInt32),
    types.maybe(types.Buffer)
  ), arguments)

  if (types.Null(sequence)) {
    sequence = Transaction.DEFAULT_SEQUENCE
  }

  // Add the input and return the input's index
  return (this.ins.push({
    hash: hash,
    index: index,
    script: scriptSig || EMPTY_SCRIPT,
    sequence: sequence,
    witness: EMPTY_WITNESS
  }) - 1)
}

Transaction.prototype.addOutput = function (scriptPubKey, value) {
  typeforce(types.tuple(types.Buffer, types.Satoshi), arguments)

  // Add the output and return the output's index
  return (this.outs.push({
    script: scriptPubKey,
    value: value
  }) - 1)
}

Transaction.prototype.hasWitnesses = function () {
  return this.ins.some(function (x) {
    return x.witness.length !== 0
  })
}

Transaction.prototype.weight = function () {
  var base = this.__byteLength(false)
  var total = this.__byteLength(true)
  return base * 3 + total
}

Transaction.prototype.virtualSize = function () {
  return Math.ceil(this.weight() / 4)
}

Transaction.prototype.byteLength = function () {
  return this.__byteLength(true)
}

Transaction.prototype.joinsplitByteLength = function () {

  var joinSplitsLen = this.joinsplits.length
  var byteLength = 0
  byteLength += bufferutils.varIntSize(joinSplitsLen)  // vJoinSplit

  if (joinSplitsLen > 0) {
    // Both pre and post Sapling JoinSplits are encoded with the following data:
    // 8 vpub_old, 8 vpub_new, 32 anchor, joinSplitsLen * 32 nullifiers, joinSplitsLen * 32 commitments, 32 ephemeralKey
    // 32 ephemeralKey, 32 randomSeed, joinsplit.macs.length * 32 vmacs
    if (this.isSaplingCompatible()) {
      byteLength += 1698 * joinSplitsLen  // vJoinSplit using JSDescriptionGroth16
    } else {
      byteLength += 1802 * joinSplitsLen  // vJoinSplit using JSDescriptionPHGR13
    }
    byteLength += 32  // joinSplitPubKey
    byteLength += 64  // joinSplitSig
  }

  return byteLength
}

Transaction.prototype.spendDescsByteLength = function () {
  var byteLength = 0
  byteLength += varuint.encodingLength(this.spendDescs.length)  // nShieldedSpend
  byteLength += (384 * this.spendDescs.length)  // vShieldedSpend
  return byteLength
}

Transaction.prototype.outputDescsByteLength = function () {
  var byteLength = 0
  byteLength += varuint.encodingLength(this.outputDescs.length)  // nShieldedOutput
  byteLength += (948 * this.outputDescs.length)  // vShieldedOutput
  return byteLength
}

Transaction.prototype.zcashTransactionByteLength = function() {
  if (!coins.isZcash(this.network)) {
    throw new Error('zcashTransactionByteLength can only be called when using Zcash network')
  }
  var byteLength = 0
  byteLength += 4  // Header
  if (this.isOverwinterCompatible()) {
    byteLength += 4  // nVersionGroupId
  }
  byteLength += varuint.encodingLength(this.ins.length)  // tx_in_count
  byteLength += this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0)  // tx_in
  byteLength += varuint.encodingLength(this.outs.length)  // tx_out_count
  byteLength += this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0)  // tx_out
  byteLength += 4  // lock_time
  if (this.isOverwinterCompatible()) {
    byteLength += 4  // nExpiryHeight
  }
  if (this.isSaplingCompatible()) {
    byteLength += 8  // valueBalance
    byteLength += this.spendDescsByteLength()
    byteLength += this.outputDescsByteLength()
  }
  if (this.supportsJoinSplits()) {
    byteLength += this.joinsplitByteLength()
  }
  if (this.isSaplingCompatible() &&
    this.spendDescs.length + this.outputDescs.length > 0) {
    byteLength += 64  // bindingSig
  }
  return byteLength
}

Transaction.prototype.__byteLength = function (__allowWitness) {
  if (coins.isZcash(this.network)) {
    return this.zcashTransactionByteLength();
  }

  var hasWitnesses = __allowWitness && this.hasWitnesses()

  return (
    (hasWitnesses ? 10 : 8) +
    (this.timestamp ? 4 : 0) +
    varuint.encodingLength(this.ins.length) +
    varuint.encodingLength(this.outs.length) +
    this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0) +
    this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0) +
    (this.isDashSpecialTransaction() ? varSliceSize(this.dashPayload) : 0) +
    (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0)
  )
}

// note - this is not updated for sapling and overwinter, do not use anywhere
Transaction.prototype.clone = function () {
  var newTx = new Transaction()
  newTx.version = this.version
  newTx.locktime = this.locktime
  newTx.timestamp = this.timestamp
  newTx.network = this.network
  newTx.dashType = this.dashType
  newTx.dashPayload = this.dashPayload
  newTx.invalidTransaction = this.invalidTransaction
  if (coins.isZcash(newTx.network)) {
    newTx.versionGroupId = this.versionGroupId
    newTx.expiry = this.expiry
  }
  newTx.ins = this.ins.map(function (txIn) {
    return {
      hash: txIn.hash,
      index: txIn.index,
      script: txIn.script,
      sequence: txIn.sequence,
      witness: txIn.witness
    }
  })

  newTx.outs = this.outs.map(function (txOut) {
    return {
      script: txOut.script,
      value: txOut.value
    }
  })

  return newTx
}

/**
 * Hash transaction for signing a specific input.
 *
 * Bitcoin uses a different hash for each signed transaction input.
 * This method copies the transaction, makes the necessary changes based on the
 * hashType, and then hashes the result.
 * This hash can then be used to sign the provided transaction input.
 */
Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number), arguments)

  // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L29
  if (inIndex >= this.ins.length) return ONE

  // ignore OP_CODESEPARATOR
  var ourScript = bscript.compile(bscript.decompile(prevOutScript).filter(function (x) {
    return x !== opcodes.OP_CODESEPARATOR
  }))

  var txTmp = this.clone()

  // SIGHASH_NONE: ignore all outputs? (wildcard payee)
  if ((hashType & 0x1f) === Transaction.SIGHASH_NONE) {
    txTmp.outs = []

    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach(function (input, i) {
      if (i === inIndex) return

      input.sequence = 0
    })

  // SIGHASH_SINGLE: ignore all outputs, except at the same index?
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE) {
    // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
    if (inIndex >= this.outs.length) return ONE

    // truncate outputs after
    txTmp.outs.length = inIndex + 1

    // "blank" outputs before
    for (var i = 0; i < inIndex; i++) {
      txTmp.outs[i] = BLANK_OUTPUT
    }

    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach(function (input, y) {
      if (y === inIndex) return

      input.sequence = 0
    })
  }

  // SIGHASH_ANYONECANPAY: ignore inputs entirely?
  if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
    txTmp.ins = [txTmp.ins[inIndex]]
    txTmp.ins[0].script = ourScript

  // SIGHASH_ALL: only ignore input scripts
  } else {
    // "blank" others input scripts
    txTmp.ins.forEach(function (input) { input.script = EMPTY_SCRIPT })
    txTmp.ins[inIndex].script = ourScript
  }

  // serialize and hash
  var buffer = Buffer.allocUnsafe(txTmp.__byteLength(false) + 4)
  buffer.writeInt32LE(hashType, buffer.length - 4)
  txTmp.__toBuffer(buffer, 0, false)

  return bcrypto.hash256(buffer)
}

Transaction.prototype.hashForZIP143 = function (inIndex, prevOutScript, value, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments)

  var tbuffer, toffset
  function writeSlice (slice) { toffset += slice.copy(tbuffer, toffset) }
  function writeUInt32 (i) { toffset = tbuffer.writeUInt32LE(i, toffset) }
  function writeUInt64 (i) { toffset = bufferutils.writeUInt64LE(tbuffer, i, toffset) }
  function writeVarInt (i) {
    varuint.encode(i, tbuffer, toffset)
    toffset += varuint.encode.bytes
  }
  function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }

  var hashOutputs = ZERO
  var hashPrevouts = ZERO
  var hashSequence = ZERO
  var hashJoinsplits = ZERO
  var h

  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
    tbuffer = Buffer.allocUnsafe(36 * this.ins.length)
    toffset = 0

    this.ins.forEach(function (txIn) {
      writeSlice(txIn.hash)
      writeUInt32(txIn.index)
    })

    h = blake2b(32, null, null, Transaction.PREVOUTS_HASH_PERSON)
    h.update(tbuffer)
    hashPrevouts = Buffer.from(h.digest())
  }

  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
       (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
       (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    tbuffer = Buffer.allocUnsafe(4 * this.ins.length)
    toffset = 0

    this.ins.forEach(function (txIn) {
      writeUInt32(txIn.sequence)
    })

    h = blake2b(32, null, null, Transaction.SEQUENCE_HASH_PERSON)
    h.update(tbuffer)
    hashSequence = Buffer.from(h.digest())
  }

  if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
      (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    var txOutsSize = this.outs.reduce(function (sum, output) {
      return sum + 8 + varSliceSize(output.script)
    }, 0)

    tbuffer = Buffer.allocUnsafe(txOutsSize)
    toffset = 0

    this.outs.forEach(function (out) {
      writeUInt64(out.value)
      writeVarSlice(out.script)
    })

    h = blake2b(32, null, null, Transaction.OUTPUTS_HASH_PERSON)
    h.update(tbuffer)
    hashOutputs = Buffer.from(h.digest())
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
    var output = this.outs[inIndex]

    tbuffer = Buffer.allocUnsafe(8 + varSliceSize(output.script))
    toffset = 0
    writeUInt64(output.value)
    writeVarSlice(output.script)

    h = blake2b(32, null, null, Transaction.OUTPUTS_HASH_PERSON)
    h.update(tbuffer)
    hashOutputs = Buffer.from(h.digest())
  }

  tbuffer = Buffer.allocUnsafe(196 + varSliceSize(prevOutScript))
  toffset = 0

  var input = this.ins[inIndex]
  writeUInt32(this.version + 0x80000000)
  writeUInt32(this.versionGroupId)
  writeSlice(hashPrevouts)
  writeSlice(hashSequence)
  writeSlice(hashOutputs)
  writeSlice(hashJoinsplits)
  writeUInt32(this.locktime)
  writeUInt32(this.expiry)
  writeUInt32(hashType)
  writeSlice(input.hash)
  writeUInt32(input.index)
  writeVarSlice(prevOutScript)
  writeUInt64(value)
  writeUInt32(input.sequence)
  h = blake2b(32, null, null, Transaction.OVERWINTER_HASH_PERSON)
  h.update(tbuffer)
  return Buffer.from(h.digest('hex'), 'hex')
}

Transaction.prototype.hashForWitnessV0 = function (inIndex, prevOutScript, value, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments)

  var tbuffer, toffset
  function writeSlice (slice) { toffset += slice.copy(tbuffer, toffset) }
  function writeUInt32 (i) { toffset = tbuffer.writeUInt32LE(i, toffset) }
  function writeUInt64 (i) { toffset = bufferutils.writeUInt64LE(tbuffer, i, toffset) }
  function writeVarInt (i) {
    varuint.encode(i, tbuffer, toffset)
    toffset += varuint.encode.bytes
  }
  function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }

  var hashOutputs = ZERO
  var hashPrevouts = ZERO
  var hashSequence = ZERO

  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
    tbuffer = Buffer.allocUnsafe(36 * this.ins.length)
    toffset = 0

    this.ins.forEach(function (txIn) {
      writeSlice(txIn.hash)
      writeUInt32(txIn.index)
    })

    hashPrevouts = bcrypto.hash256(tbuffer)
  }

  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
       (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
       (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    tbuffer = Buffer.allocUnsafe(4 * this.ins.length)
    toffset = 0

    this.ins.forEach(function (txIn) {
      writeUInt32(txIn.sequence)
    })

    hashSequence = bcrypto.hash256(tbuffer)
  }

  if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
      (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    var txOutsSize = this.outs.reduce(function (sum, output) {
      return sum + 8 + varSliceSize(output.script)
    }, 0)

    tbuffer = Buffer.allocUnsafe(txOutsSize)
    toffset = 0

    this.outs.forEach(function (out) {
      writeUInt64(out.value)
      writeVarSlice(out.script)
    })

    hashOutputs = bcrypto.hash256(tbuffer)
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
    var output = this.outs[inIndex]

    tbuffer = Buffer.allocUnsafe(8 + varSliceSize(output.script))
    toffset = 0
    writeUInt64(output.value)
    writeVarSlice(output.script)

    hashOutputs = bcrypto.hash256(tbuffer)
  }

  tbuffer = Buffer.allocUnsafe(156 + varSliceSize(prevOutScript))
  toffset = 0

  var input = this.ins[inIndex]
  writeUInt32(this.version)
  writeSlice(hashPrevouts)
  writeSlice(hashSequence)
  writeSlice(input.hash)
  writeUInt32(input.index)
  writeVarSlice(prevOutScript)
  writeUInt64(value)
  writeUInt32(input.sequence)
  writeSlice(hashOutputs)
  writeUInt32(this.locktime)
  writeUInt32(hashType)
  return bcrypto.hash256(tbuffer)
}

Transaction.prototype.getHash = function () {
  return bcrypto.hash256(this.__toBuffer(undefined, undefined, false))
}

Transaction.prototype.getId = function () {
  // transaction hash's are displayed in reverse order
  return this.getHash().reverse().toString('hex')
}

Transaction.prototype.toBuffer = function (buffer, initialOffset) {
  return this.__toBuffer(buffer, initialOffset, true)
}

Transaction.prototype.__toBuffer = function (buffer, initialOffset, __allowWitness) {
  if (!buffer) buffer = Buffer.allocUnsafe(this.__byteLength(__allowWitness))

  var offset = initialOffset || 0
  function writeSlice (slice) { offset += slice.copy(buffer, offset) }
  function writeUInt8 (i) { offset = buffer.writeUInt8(i, offset) }
  function writeUInt32 (i) { offset = buffer.writeUInt32LE(i, offset) }
  function writeInt16 (i) { offset = buffer.writeInt16LE(i, offset) }
  function writeInt32 (i) { offset = buffer.writeInt32LE(i, offset) }
  function writeUInt64 (i) { offset = bufferutils.writeUInt64LE(buffer, i, offset) }
  function writeVarInt (i) {
    varuint.encode(i, buffer, offset)
    offset += varuint.encode.bytes
  }
  function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }
  function writeVector (vector) { writeVarInt(vector.length); vector.forEach(writeVarSlice) }

  function writeCompressedG1 (i) {
    writeUInt8(Transaction.ZCASH_G1_PREFIX_MASK | i.yLsb)
    writeSlice(i.x)
  }

  function writeCompressedG2 (i) {
    writeUInt8(Transaction.ZCASH_G2_PREFIX_MASK | i.yLsb)
    writeSlice(i.x)
  }

  // zcash sapling
  function writeSpentDesc (i) {
    writeSlice(i.cv);
    writeSlice(i.anchor);
    writeSlice(i.nullifier);
    writeSlice(i.rk);
    writeSlice(i.proof);
    writeSlice(i.spendAuthSig);
  }

  function writeOutputDesc (i) {
    writeSlice(i.cv);
    writeSlice(i.cmu);
    writeSlice(i.ephemeralKey);
    writeSlice(i.encCipherText);
    writeSlice(i.outCipherText);
    writeSlice(i.proof);
  }

  if (this.isOverwinterCompatible()) {
    writeInt32(this.version | (1 << 31))
    writeUInt32(this.versionGroupId)
  } else if(this.isDashSpecialTransaction()) {
    writeInt16(this.version)
    writeInt16(this.dashType)
  } else {
    writeInt32(this.version)
  }

  var hasWitnesses = __allowWitness && this.hasWitnesses()

  if (hasWitnesses) {
    writeUInt8(Transaction.ADVANCED_TRANSACTION_MARKER)
    writeUInt8(Transaction.ADVANCED_TRANSACTION_FLAG)
  }

  if (this.timestamp) {
    writeUInt32(this.timestamp)
  }

  writeVarInt(this.ins.length)

  this.ins.forEach(function (txIn) {
    writeSlice(txIn.hash)
    writeUInt32(txIn.index)
    writeVarSlice(txIn.script)
    writeUInt32(txIn.sequence)
  })

  writeVarInt(this.outs.length)
  this.outs.forEach(function (txOut) {
    if (!txOut.valueBuffer) {
      writeUInt64(txOut.value)
    } else {
      writeSlice(txOut.valueBuffer)
    }

    writeVarSlice(txOut.script)
  })

  if (hasWitnesses) {
    this.ins.forEach(function (input) {
      writeVector(input.witness)
    })
  }

  writeUInt32(this.locktime)

  if (this.isOverwinterCompatible()) {
    writeUInt32(this.expiry)
  }

  if (this.isSaplingCompatible()) {
    writeUInt64(this.valueBalance);
    writeVarInt(this.spendDescs.length);
    for (var i = 0; i < this.spendDescs.length; i++) {
      writeSpentDesc(this.spendDescs[i]);
    }
    writeVarInt(this.outputDescs.length);
    for (var i = 0; i < this.outputDescs.length; i++) {
      writeOutputDesc(this.outputDescs[i]);
    }
  }

  if (this.supportsJoinSplits()) {
    writeVarInt(this.joinsplits.length)
    var version = this.version;
    this.joinsplits.forEach(function (joinsplit) {
      writeUInt64(joinsplit.vpubOld)
      writeUInt64(joinsplit.vpubNew)
      writeSlice(joinsplit.anchor)
      joinsplit.nullifiers.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      joinsplit.commitments.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      writeSlice(joinsplit.ephemeralKey)
      writeSlice(joinsplit.randomSeed)
      joinsplit.macs.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      if (version <= 3) {
        writeCompressedG1(joinsplit.zproof.gA)
        writeCompressedG1(joinsplit.zproof.gAPrime)
        writeCompressedG2(joinsplit.zproof.gB)
        writeCompressedG1(joinsplit.zproof.gBPrime)
        writeCompressedG1(joinsplit.zproof.gC)
        writeCompressedG1(joinsplit.zproof.gCPrime)
        writeCompressedG1(joinsplit.zproof.gK)
        writeCompressedG1(joinsplit.zproof.gH)
      } else {
        writeSlice(joinsplit.zproof.sA)
        writeSlice(joinsplit.zproof.sB)
        writeSlice(joinsplit.zproof.sC)
      }
      joinsplit.ciphertexts.forEach(function (ciphertext) {
        writeSlice(ciphertext)
      })
    })
    if (this.joinsplits.length > 0) {
      writeSlice(this.joinsplitPubkey)
      writeSlice(this.joinsplitSig)
    }
    if (this.isSaplingCompatible() && ((this.spendDescs.length + this.outputDescs.length) > 0)) {
      writeSlice(this.bindingSig);
    }
  }

  if (this.isDashSpecialTransaction()) {
    writeVarSlice(this.dashPayload)
  }

  // avoid slicing unless necessary
  if (initialOffset !== undefined) return buffer.slice(initialOffset, offset)
  return buffer
}

Transaction.prototype.toHex = function () {
  return this.toBuffer().toString('hex')
}

Transaction.prototype.setInputScript = function (index, scriptSig) {
  typeforce(types.tuple(types.Number, types.Buffer), arguments)

  this.ins[index].script = scriptSig
}

Transaction.prototype.setWitness = function (index, witness) {
  typeforce(types.tuple(types.Number, [types.Buffer]), arguments)

  this.ins[index].witness = witness
}

Transaction.prototype.getExtraData = function () {
  if (this.supportsJoinSplits()) {
    var buffer = this.toBuffer()
    var joinsplitByteLength = this.joinsplitByteLength()
    var res = buffer.slice(buffer.length - joinsplitByteLength)
    return res
  }
  // if (coins.isDash(this.network) && this.dashPayload) {
  if (this.isDashSpecialTransaction()) {
    var extraDataLength = varuint.encode(this.dashPayload.length)
    return Buffer.concat([extraDataLength, this.dashPayload]);
  }
  return null
}

Transaction.prototype.isZcashTransaction = function () {
  return coins.isZcash(this.network)
}

Transaction.prototype.isSaplingCompatible = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_SAPLING_VERSION
}

Transaction.prototype.isOverwinterCompatible = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION
}

Transaction.prototype.supportsJoinSplits = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION
}

Transaction.prototype.isDashSpecialTransaction = function () {
  return coins.isDash(this.network) && this.version === 3 && this.dashType !== Transaction.DASH_NORMAL
}

module.exports = Transaction


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

var baddress = __webpack_require__(32)
var bcrypto = __webpack_require__(10)
var ecdsa = __webpack_require__(114)
var randomBytes = __webpack_require__(123)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var wif = __webpack_require__(124)

var NETWORKS = __webpack_require__(13)
var BigInteger = __webpack_require__(9)

var ecurve = __webpack_require__(35)
var secp256k1 = ecdsa.__curve

function ECPair (d, Q, options) {
  if (options) {
    typeforce({
      compressed: types.maybe(types.Boolean),
      network: types.maybe(types.Network)
    }, options)
  }

  options = options || {}

  if (d) {
    if (d.signum() <= 0) throw new Error('Private key must be greater than 0')
    if (d.compareTo(secp256k1.n) >= 0) throw new Error('Private key must be less than the curve order')
    if (Q) throw new TypeError('Unexpected publicKey parameter')

    this.d = d
  } else {
    typeforce(types.ECPoint, Q)

    this.__Q = Q
  }

  this.compressed = options.compressed === undefined ? true : options.compressed
  this.network = options.network || NETWORKS.bitcoin
}

Object.defineProperty(ECPair.prototype, 'Q', {
  get: function () {
    if (!this.__Q && this.d) {
      this.__Q = secp256k1.G.multiply(this.d)
    }

    return this.__Q
  }
})

ECPair.fromPublicKeyBuffer = function (buffer, network) {
  var Q = ecurve.Point.decodeFrom(secp256k1, buffer)

  return new ECPair(null, Q, {
    compressed: Q.compressed,
    network: network
  })
}

ECPair.fromWIF = function (string, network) {
  var decoded = wif.decode(string)
  var version = decoded.version

  // list of networks?
  if (types.Array(network)) {
    network = network.filter(function (x) {
      return version === x.wif
    }).pop()

    if (!network) throw new Error('Unknown network version')

  // otherwise, assume a network object (or default to bitcoin)
  } else {
    network = network || NETWORKS.bitcoin

    if (version !== network.wif) throw new Error('Invalid network version')
  }

  var d = BigInteger.fromBuffer(decoded.privateKey)

  return new ECPair(d, null, {
    compressed: decoded.compressed,
    network: network
  })
}

ECPair.makeRandom = function (options) {
  options = options || {}

  var rng = options.rng || randomBytes

  var d
  do {
    var buffer = rng(32)
    typeforce(types.Buffer256bit, buffer)

    d = BigInteger.fromBuffer(buffer)
  } while (d.signum() <= 0 || d.compareTo(secp256k1.n) >= 0)

  return new ECPair(d, null, options)
}

ECPair.prototype.getAddress = function () {
  return baddress.toBase58Check(bcrypto.hash160(this.getPublicKeyBuffer()), this.getNetwork().pubKeyHash)
}

ECPair.prototype.getNetwork = function () {
  return this.network
}

ECPair.prototype.getPublicKeyBuffer = function () {
  return this.Q.getEncoded(this.compressed)
}

ECPair.prototype.sign = function (hash) {
  if (!this.d) throw new Error('Missing private key')

  return ecdsa.sign(hash, this.d)
}

ECPair.prototype.toWIF = function () {
  if (!this.d) throw new Error('Missing private key')

  return wif.encode(this.network.wif, this.d.toBuffer(32), this.compressed)
}

ECPair.prototype.verify = function (hash, signature) {
  return ecdsa.verify(hash, signature, this.Q)
}

module.exports = ECPair


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var bech32 = __webpack_require__(110)
var bs58check = __webpack_require__(17)
var bscript = __webpack_require__(3)
var btemplates = __webpack_require__(20)
var networks = __webpack_require__(13)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)

function fromBase58Check (address) {
  var payload = bs58check.decode(address)

  // TODO: 4.0.0, move to "toOutputScript"
  if (payload.length < 21) throw new TypeError(address + ' is too short')
  if (payload.length > 22) throw new TypeError(address + ' is too long')

  var multibyte = payload.length === 22
  var offset = multibyte ? 2 : 1

  var version = multibyte ? payload.readUInt16BE(0) : payload.readUInt8(0)
  var hash = payload.slice(offset)

  return { version: version, hash: hash }
}

function fromBech32 (address) {
  var result = bech32.decode(address)
  var data = bech32.fromWords(result.words.slice(1))

  return {
    version: result.words[0],
    prefix: result.prefix,
    data: Buffer.from(data)
  }
}

function toBase58Check (hash, version) {
  typeforce(types.tuple(types.Hash160bit, types.UInt16), arguments)

  var multibyte = version > 0xff
  var size = multibyte ? 22 : 21
  var offset = multibyte ? 2 : 1

  var payload = Buffer.allocUnsafe(size)
  multibyte ? payload.writeUInt16BE(version, 0) : payload.writeUInt8(version, 0)
  hash.copy(payload, offset)

  return bs58check.encode(payload)
}

function toBech32 (data, version, prefix) {
  var words = bech32.toWords(data)
  words.unshift(version)

  return bech32.encode(prefix, words)
}

function fromOutputScript (outputScript, network) {
  network = network || networks.bitcoin

  if (btemplates.pubKeyHash.output.check(outputScript)) return toBase58Check(bscript.compile(outputScript).slice(3, 23), network.pubKeyHash)
  if (btemplates.scriptHash.output.check(outputScript)) return toBase58Check(bscript.compile(outputScript).slice(2, 22), network.scriptHash)
  if (btemplates.witnessPubKeyHash.output.check(outputScript)) return toBech32(bscript.compile(outputScript).slice(2, 22), 0, network.bech32)
  if (btemplates.witnessScriptHash.output.check(outputScript)) return toBech32(bscript.compile(outputScript).slice(2, 34), 0, network.bech32)

  throw new Error(bscript.toASM(outputScript) + ' has no matching Address')
}

function toOutputScript (address, network) {
  network = network || networks.bitcoin

  var decode
  try {
    decode = fromBase58Check(address)
  } catch (e) {}

  if (decode) {
    if (decode.version === network.pubKeyHash) return btemplates.pubKeyHash.output.encode(decode.hash)
    if (decode.version === network.scriptHash) return btemplates.scriptHash.output.encode(decode.hash)
  } else {
    try {
      decode = fromBech32(address)
    } catch (e) {}

    if (decode) {
      if (decode.prefix !== network.bech32) throw new Error(address + ' has an invalid prefix')
      if (decode.version === 0) {
        if (decode.data.length === 20) return btemplates.witnessPubKeyHash.output.encode(decode.data)
        if (decode.data.length === 32) return btemplates.witnessScriptHash.output.encode(decode.data)
      }
    }
  }

  throw new Error(address + ' has no matching Script')
}

module.exports = {
  fromBase58Check: fromBase58Check,
  fromBech32: fromBech32,
  fromOutputScript: fromOutputScript,
  toBase58Check: toBase58Check,
  toBech32: toBech32,
  toOutputScript: toOutputScript
}


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = __webpack_require__(119);
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7)))

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var bip66 = __webpack_require__(42)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)

var BigInteger = __webpack_require__(9)

function ECSignature (r, s) {
  typeforce(types.tuple(types.BigInt, types.BigInt), arguments)

  this.r = r
  this.s = s
}

ECSignature.parseCompact = function (buffer) {
  typeforce(types.BufferN(65), buffer)

  var flagByte = buffer.readUInt8(0) - 27
  if (flagByte !== (flagByte & 7)) throw new Error('Invalid signature parameter')

  var compressed = !!(flagByte & 4)
  var recoveryParam = flagByte & 3
  var signature = ECSignature.fromRSBuffer(buffer.slice(1))

  return {
    compressed: compressed,
    i: recoveryParam,
    signature: signature
  }
}

ECSignature.fromRSBuffer = function (buffer) {
  typeforce(types.BufferN(64), buffer)

  var r = BigInteger.fromBuffer(buffer.slice(0, 32))
  var s = BigInteger.fromBuffer(buffer.slice(32, 64))
  return new ECSignature(r, s)
}

ECSignature.fromDER = function (buffer) {
  var decode = bip66.decode(buffer)
  var r = BigInteger.fromDERInteger(decode.r)
  var s = BigInteger.fromDERInteger(decode.s)

  return new ECSignature(r, s)
}

// BIP62: 1 byte hashType flag (only 0x01, 0x02, 0x03, 0x81, 0x82 and 0x83 are allowed)
ECSignature.parseScriptSignature = function (buffer) {
  var hashType = buffer.readUInt8(buffer.length - 1)
  var hashTypeMod = hashType & ~0x80

  if (hashTypeMod <= 0x00 || hashTypeMod >= 0x04) throw new Error('Invalid hashType ' + hashType)

  return {
    signature: ECSignature.fromDER(buffer.slice(0, -1)),
    hashType: hashType
  }
}

ECSignature.prototype.toCompact = function (i, compressed) {
  if (compressed) {
    i += 4
  }

  i += 27

  var buffer = Buffer.alloc(65)
  buffer.writeUInt8(i, 0)
  this.toRSBuffer(buffer, 1)
  return buffer
}

ECSignature.prototype.toDER = function () {
  var r = Buffer.from(this.r.toDERInteger())
  var s = Buffer.from(this.s.toDERInteger())

  return bip66.encode(r, s)
}

ECSignature.prototype.toRSBuffer = function (buffer, offset) {
  buffer = buffer || Buffer.alloc(64)
  this.r.toBuffer(32).copy(buffer, offset)
  this.s.toBuffer(32).copy(buffer, offset + 32)
  return buffer
}

ECSignature.prototype.toScriptSignature = function (hashType) {
  var hashTypeMod = hashType & ~0x80
  if (hashTypeMod <= 0 || hashTypeMod >= 4) throw new Error('Invalid hashType ' + hashType)

  var hashTypeBuffer = Buffer.alloc(1)
  hashTypeBuffer.writeUInt8(hashType, 0)

  return Buffer.concat([this.toDER(), hashTypeBuffer])
}

module.exports = ECSignature

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

var Point = __webpack_require__(66)
var Curve = __webpack_require__(67)

var getCurveByName = __webpack_require__(121)

module.exports = {
  Curve: Curve,
  Point: Point,
  getCurveByName: getCurveByName
}


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license
 * https://github.com/bitcoincashjs/cashaddr
 * Copyright (c) 2017-2018 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */



/**
 * Validation utility.
 *
 * @module validation
 */

/**
 * Error thrown when encoding or decoding fail due to invalid input.
 *
 * @constructor ValidationError
 * @param {string} message Error description.
 */
function ValidationError(message) {
  var error = new Error();
  this.name = error.name = 'ValidationError';
  this.message = error.message = message;
  this.stack = error.stack;
}

ValidationError.prototype = Object.create(Error.prototype);

/**
 * Validates a given condition, throwing a {@link ValidationError} if
 * the given condition does not hold.
 *
 * @static
 * @param {boolean} condition Condition to validate.
 * @param {string} message Error message in case the condition does not hold.
 */
function validate(condition, message) {
  if (!condition) {
    throw new ValidationError(message);
  }
}

module.exports = {
  ValidationError: ValidationError,
  validate: validate,
};


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInputId = getInputId;
exports.objectValues = objectValues;
exports.filterNull = filterNull;

function getInputId(i) {
  var hash = i.hash;
  Array.prototype.reverse.call(hash);
  var res = hash.toString('hex');
  Array.prototype.reverse.call(hash);
  return res;
}

function objectValues(k) {
  return Object.keys(k).map(function (key) {
    return k[key];
  });
}

function filterNull(k, throwErrorOnNull) {
  var res = [];
  k.forEach(function (t) {
    if (t != null) {
      res.push(t);
    } else if (throwErrorOnNull) {
      throw new Error('Unexpected null');
    }
  });
  return res;
}

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lookupSyncStatus = lookupSyncStatus;
exports.lookupBlockHash = lookupBlockHash;
exports.chunkTransactions = chunkTransactions;
exports.returnSuccess = returnSuccess;
exports.returnError = returnError;
exports.startDiscoveryPromise = exports.initPromise = void 0;

var _deferred = __webpack_require__(18);

var _stream = __webpack_require__(39);

// Code for all communication with outside
// There is a mechanism for "sending" Promise from outside here
// - first I send promiseRequest from worker to outside,
// and I either get promiseResponseSuccess or promiseResponseFailure
//
// Similar logic for Stream - I get streamRequest and
// streamResponseUpdate and streamResponseFinish
//
// It's maybe a little overkill :( but it allows me to have multiple streams
var lastId = 0;
var messageEmitter = new _stream.Emitter();

function askPromise(request) {
  var id = lastId + 1;
  lastId++;
  doPostMessage({
    type: 'promiseRequest',
    request: request,
    id: id
  });
  var dfd = (0, _deferred.deferred)();
  messageEmitter.attach(function (message, detach) {
    if (message.id === id) {
      if (message.type === 'promiseResponseSuccess') {
        detach();
        dfd.resolve(message.response.response);
      }

      if (message.type === 'promiseResponseFailure') {
        detach();
        dfd.reject(new Error(message.failure));
      }
    }
  });
  return dfd.promise;
}

function askStream(request) {
  var id = lastId + 1;
  lastId++;
  doPostMessage({
    type: 'streamRequest',
    request: request,
    id: id
  });
  return new _stream.Stream(function (update, finish) {
    var emitterDetach = function emitterDetach() {};

    messageEmitter.attach(function (message, detach) {
      emitterDetach = detach;

      if (message.id === id) {
        if (message.type === 'streamResponseUpdate') {
          update(message.update.response);
        }

        if (message.type === 'streamResponseFinish') {
          detach();
          finish();
        }
      }
    });
    return function () {
      emitterDetach();
    };
  });
}

function lookupSyncStatus() {
  return askPromise({
    type: 'lookupSyncStatus'
  });
}

function lookupBlockHash(height) {
  return askPromise({
    type: 'lookupBlockHash',
    height: height
  });
}

function chunkTransactions(chainId, firstIndex, lastIndex, startBlock, endBlock, pseudoCount, addresses) {
  return askStream({
    type: 'chunkTransactions',
    chainId: chainId,
    firstIndex: firstIndex,
    lastIndex: lastIndex,
    startBlock: startBlock,
    endBlock: endBlock,
    pseudoCount: pseudoCount,
    addresses: addresses
  }).map(function (k) {
    if (typeof k === 'string') {
      return new Error(k);
    }

    return k;
  });
}

function returnSuccess(result) {
  doPostMessage({
    type: 'result',
    result: result
  });
}

function returnError(error) {
  var errorMessage = error instanceof Error ? error.message : error.toString();
  doPostMessage({
    type: 'error',
    error: errorMessage
  });
}

function doPostMessage(data) {
  // eslint-disable-next-line no-undef,no-restricted-globals
  self.postMessage(data);
} // eslint-disable-next-line no-undef,no-restricted-globals


self.onmessage = function (event) {
  var data = event.data;
  messageEmitter.emit(data);
};

var initDfd = (0, _deferred.deferred)();
var initPromise = initDfd.promise;
exports.initPromise = initPromise;
messageEmitter.attach(function (message, detach) {
  if (message.type === 'init') {
    detach();
    initDfd.resolve({
      accountInfo: message.state,
      network: message.network,
      xpub: message.xpub,
      segwit: message.segwit,
      webassembly: message.webassembly,
      cashAddress: message.cashAddress,
      gap: message.gap,
      timeOffset: message.timeOffset
    });
  }
});
var startDiscoveryDfd = (0, _deferred.deferred)();
var startDiscoveryPromise = startDiscoveryDfd.promise;
exports.startDiscoveryPromise = startDiscoveryPromise;
messageEmitter.attach(function (message, detach) {
  if (message.type === 'startDiscovery') {
    detach();
    startDiscoveryDfd.resolve();
  }
});

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamWithEnding = exports.Stream = exports.Emitter = void 0;

var _deferred = __webpack_require__(18);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// making sure that Error from a promise is an Error object
function formatError(error) {
  if (_typeof(error) === 'object' && error != null && error instanceof Error) {
    return error;
  }

  if (_typeof(error) === 'object' && error != null && error.message != null) {
    return new Error(error.message);
  }

  return new Error(JSON.stringify(error));
} // having detach function in the handler is actually very useful
// because we don't have to name the function when attaching emitter


// const MAX_LISTENERS = 50;
var Emitter =
/*#__PURE__*/
function () {
  function Emitter() {
    _classCallCheck(this, Emitter);

    _defineProperty(this, "listeners", []);

    _defineProperty(this, "destroyed", false);
  }

  _createClass(Emitter, [{
    key: "destroy",
    value: function destroy() {
      var _this = this;

      this.listeners.forEach(function (handler) {
        return _this.detach(handler);
      });
      this.listeners = [];
      this.destroyed = true;
    } // `attach` doesn't affect currently running `emit`, so listeners are not
    // modified in place.

  }, {
    key: "attach",
    value: function attach(handler) {
      if (this.destroyed) {
        throw new Error('Attaching on a destroyed emitter');
      } // this is to prevent possible unintended effects
      // (not necessary, remove if you REALLY need to do this)


      this.listeners.forEach(function (oldHandler) {
        if (oldHandler === handler) {
          throw new Error('Cannot attach the same listener twice');
        }
      });
      this.listeners.push(handler);
    }
  }, {
    key: "detach",
    value: function detach(handler) {
      // if destroyed => let it be, let it be
      this.listeners = this.listeners.filter(function (listener) {
        if (listener === handler) {
          return false;
        }

        return true;
      });
    }
  }, {
    key: "emit",
    value: function emit(value) {
      var _this2 = this;

      if (this.destroyed) {
        // if destroyed -> not really throwing error (nothing bad happens), just warn
        console.warn(new Error('Emitting on a destroyed emitter'));
      }

      this.listeners.forEach(function (listener) {
        listener(value, function () {
          _this2.detach(listener);
        });
      });
    }
  }]);

  return Emitter;
}();

exports.Emitter = Emitter;

var Stream =
/*#__PURE__*/
function () {
  _createClass(Stream, null, [{
    key: "fromEmitter",
    // note that this never "finishes"
    // note that dispose does NOT destroy the emitter
    value: function fromEmitter(emitter, dispose) {
      return new Stream(function (update) {
        var disposed = false;

        var handler = function handler(t) {
          // check for disposed not needed, handler is removed
          update(t);
        };

        emitter.attach(handler);
        return function () {
          if (!disposed) {
            disposed = true;
            emitter.detach(handler);
            dispose();
          }
        };
      });
    }
  }, {
    key: "fromEmitterFinish",
    value: function fromEmitterFinish(emitter, finisher, dispose) {
      return new Stream(function (update, finish) {
        var disposed = false;

        var handler = function handler(t) {
          update(t);
        };

        emitter.attach(handler);

        var finishHandler = function finishHandler(nothing, detach) {
          finish();
          detach();
          emitter.detach(handler);
        };

        finisher.attach(finishHandler);
        return function () {
          // TODO - this is why dispose does not make much sense
          // should dispose() be called when finish() has been called? or no?
          // I want to get rid of dispose eventually
          if (!disposed) {
            disposed = true;
            emitter.detach(handler);
            finisher.detach(finishHandler);
            dispose();
          }
        };
      });
    }
  }, {
    key: "empty",
    value: function empty() {
      return new Stream(function (update, finish) {
        var disposed = false;
        setTimeout(function () {
          if (!disposed) {
            finish();
          }
        }, 0);
        return function () {
          disposed = true;
        };
      });
    }
  }, {
    key: "fromPromise",
    value: function fromPromise(promise, ignoreRejectionError) {
      var _ignoreRejectionError = ignoreRejectionError == null ? false : ignoreRejectionError;

      var nstream = new Stream(function (update, finish) {
        var stream_;
        var disposed = false;
        promise.then(function (stream) {
          if (!disposed) {
            if (!stream.disposed) {
              stream.values.attach(function (v) {
                return update(v);
              });
              stream.finish.attach(function () {
                return finish();
              });
              stream_ = stream;
            } else {// uhhh I donno
            }
          }
        }, function (error) {
          if (!disposed) {
            if (!_ignoreRejectionError) {
              update(formatError(error));
            }

            setTimeout(function () {
              if (!disposed) {
                finish();
              }
            }, 10);
          }
        });
        return function () {
          disposed = true;

          if (stream_ != null) {
            stream_.dispose();
          }
        };
      });
      return nstream;
    }
  }, {
    key: "setLater",
    value: function setLater() {
      var df = (0, _deferred.deferred)();
      var set = false;

      var setter = function setter(s) {
        if (set) {
          throw new Error('Setting stream twice.');
        }

        set = true;
        df.resolve(s);
      }; // $FlowIssue the promise is never rejected, so the type can be Stream<T>


      var stream = Stream.fromPromise(df.promise);
      return {
        stream: stream,
        setter: setter
      };
    } // note - when generate() ends with error,
    // the stream emits the error as a value and then finishes
    // note - condition is for CONTINUING
    // the last value will always NOT satisfy the condition

  }, {
    key: "generate",
    value: function generate(initial, _generate, condition) {
      return new Stream(function (update, finish) {
        var disposed = false;

        var iterate = function iterate(state) {
          var promise;

          try {
            // catch error in generate, if it happens
            promise = _generate(state);
          } catch (error) {
            if (disposed) {// stop the iteration
            } else {
              update(formatError(error));
              finish();
            }

            return;
          }

          promise.then(function (nstate) {
            if (disposed) {// stop the iteration
            } else {
              update(nstate);

              if (condition(nstate)) {
                iterate(nstate);
              } else {
                finish();
              }
            }
          }, function (error) {
            if (disposed) {// stop the iteration
            } else {
              update(formatError(error));
              finish();
            }
          });
        };

        setTimeout(function () {
          return iterate(initial);
        }, 1);
        return function () {
          disposed = true;
        };
      });
    }
  }, {
    key: "simple",
    value: function simple(value) {
      var values = new Emitter();
      var finish = new Emitter();
      var stream = Stream.fromEmitterFinish(values, finish, function () {});
      setTimeout(function () {
        values.emit(value);
        setTimeout(function () {
          finish.emit();
        }, 1);
      }, 1);
      return stream;
    }
  }, {
    key: "combineFlat",
    value: function combineFlat(streams) {
      if (streams.length === 0) {
        return Stream.empty();
      }

      return new Stream(function (update, finish) {
        var finished = new Set();
        streams.forEach(function (s, i) {
          s.values.attach(function (v) {
            update(v);
          });
          s.finish.attach(function () {
            finished.add(i);

            if (finished.size >= streams.length) {
              finish();
            }
          });
        });
        return function () {
          streams.forEach(function (s) {
            return s.dispose();
          });
        };
      });
    }
  }, {
    key: "filterError",
    value: function filterError(stream) {
      var res_ = stream.filter(function (v) {
        return !(v instanceof Error);
      }); // $FlowIssue

      var res = res_;
      return res;
    }
  }]);

  function Stream(controller) {
    var _this3 = this;

    _classCallCheck(this, Stream);

    _defineProperty(this, "disposed", false);

    this.values = new Emitter();
    this.finish = new Emitter();
    var controllerDispose = controller(function (value) {
      _this3.values.emit(value);
    }, function () {
      _this3.finish.emit();
    });

    this.dispose = function () {
      controllerDispose();

      _this3.values.destroy();

      _this3.finish.destroy();

      _this3.disposed = true;
    };
  }

  _createClass(Stream, [{
    key: "awaitFirst",
    value: function awaitFirst() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        /* istanbul ignore next */
        var _onFinish = function onFinish() {};

        var onValue = function onValue(value) {
          _this4.values.detach(onValue);

          _this4.finish.detach(_onFinish);

          resolve(value);
        };

        _onFinish = function onFinish() {
          _this4.values.detach(onValue);

          _this4.finish.detach(_onFinish);

          reject(new Error('No first value.'));
        };

        _this4.values.attach(onValue);

        _this4.finish.attach(_onFinish);
      });
    }
  }, {
    key: "awaitFinish",
    value: function awaitFinish() {
      var _this5 = this;

      return new Promise(function (resolve) {
        _this5.finish.attach(function (nothing, detach) {
          detach();
          resolve();
        });
      });
    }
  }, {
    key: "map",
    value: function map(fn) {
      var _this6 = this;

      return new Stream(function (update, finish) {
        _this6.values.attach(function (value) {
          update(fn(value));
        });

        _this6.finish.attach(finish);

        return _this6.dispose;
      });
    } // note: this DOES keep the order
    // note: it does not finish on rejected promise or error in fn
    //       it just emits error and does the next
    // note: even when it does keep order, functions are run as soon as the values come,
    //       but the values are emitted in the same order, no matter how long do the promise takes
    //       so you can depend on RESULT order being the same, but there can be more promises
    //       running at the same time
    // note: calling dispose IMMEDIATELY stops the streaming values

  }, {
    key: "mapPromise",
    value: function mapPromise(fn) {
      var _this7 = this;

      return new Stream(function (update, finish) {
        var previous = Promise.resolve();
        var disposed = false;

        _this7.values.attach(function (value) {
          var previousNow = previous; // Flow idiocy

          var runFn = function () {
            try {
              return fn(value);
            } catch (e) {
              return Promise.reject(e);
            }
          }();

          previous = runFn.then(function (u) {
            return previousNow.then(function () {
              if (!disposed) {
                update(u);
              }
            });
          }, function (error) {
            return previousNow.then(function () {
              if (!disposed) {
                update(error);
              }
            });
          });
        });

        _this7.finish.attach(function () {
          previous.then(function () {
            if (!disposed) {
              finish();
            }
          });
        });

        return function () {
          disposed = true;

          _this7.dispose();
        };
      });
    }
  }, {
    key: "filter",
    value: function filter(fn) {
      var _this8 = this;

      return new Stream(function (update, finish) {
        _this8.values.attach(function (value) {
          if (fn(value)) {
            update(value);
          }
        });

        _this8.finish.attach(finish);

        return _this8.dispose;
      });
    }
  }, {
    key: "reduce",
    value: function reduce(fn, initial) {
      var _this9 = this;

      return new Promise(function (resolve) {
        var state = initial;

        var onValue = function onValue(value) {
          state = fn(state, value);
        };

        _this9.values.attach(onValue);

        _this9.finish.attach(function (nothing, detach) {
          resolve(state);
          detach();

          _this9.values.detach(onValue);
        });
      });
    }
  }]);

  return Stream;
}();

exports.Stream = Stream;

var StreamWithEnding =
/*#__PURE__*/
function () {
  function StreamWithEnding() {
    _classCallCheck(this, StreamWithEnding);
  }

  _createClass(StreamWithEnding, null, [{
    key: "fromStreamAndPromise",
    // ending never resolves before stream finishes
    value: function fromStreamAndPromise(s, ending) {
      // all these empty cathces
      // are to make node.js happy to stop showing stupid errors
      // on unhandled rejections
      ending.catch(function () {});
      var res = new StreamWithEnding();
      res.stream = s;
      var def = (0, _deferred.deferred)();

      res.dispose = function (e) {
        def.reject(e);
        def.promise.catch(function () {});
        s.dispose();
      };

      s.awaitFinish().then(function () {
        def.resolve();
      });
      res.ending = def.promise.then(function () {
        return ending;
      });
      res.ending.catch(function () {});
      return res;
    }
  }, {
    key: "fromPromise",
    value: function fromPromise(p) {
      // $FlowIssue the error thing - flow cannot infer
      var res = new StreamWithEnding(); // the rejection will come to the ending promise
      // but if we use filterError, U can never include error

      var disposed = false;
      res.stream = Stream.fromPromise(p.then(function (s) {
        if (disposed) {
          throw new Error('disposed'); // will be ignored
        } else {
          return s.stream;
        }
      }), true);
      res.ending = p.then(function (s) {
        return s.ending;
      });
      res.ending.catch(function () {});
      var resolved = null;
      p.then(function (s) {
        resolved = s;
      });

      res.dispose = function (e) {
        disposed = true;

        if (resolved != null) {
          resolved.dispose(e);
        }
      };

      return res;
    }
  }]);

  return StreamWithEnding;
}();

exports.StreamWithEnding = StreamWithEnding;

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deriveDateFormats = deriveDateFormats;
exports.recomputeDateFormats = recomputeDateFormats;

// Functions for date formatting
function deriveDateFormats(t, wantedOffset) {
  if (t == null) {
    return {
      timestamp: null,
      dateInfoDayFormat: null,
      dateInfoTimeFormat: null
    };
  }

  var t_ = t;
  var date = new Date((t_ - wantedOffset * 60) * 1000);
  return {
    timestamp: t_,
    dateInfoDayFormat: dateToDayFormat(date),
    dateInfoTimeFormat: dateToTimeFormat(date)
  };
}

function dateToTimeFormat(date) {
  var hh = addZero(date.getUTCHours().toString());
  var mm = addZero(date.getUTCMinutes().toString());
  var ss = addZero(date.getUTCSeconds().toString());
  return "".concat(hh, ":").concat(mm, ":").concat(ss);
}

function dateToDayFormat(date) {
  var yyyy = date.getUTCFullYear().toString();
  var mm = addZero((date.getUTCMonth() + 1).toString()); // getMonth() is zero-based

  var dd = addZero(date.getUTCDate().toString());
  return "".concat(yyyy, "-").concat(mm, "-").concat(dd);
}

function addZero(s) {
  if (s.length === 1) {
    return "0".concat(s);
  }

  return s;
}

function recomputeDateFormats(ts, wantedOffset) {
  ts.forEach(function (t) {
    var r = deriveDateFormats(t.timestamp, wantedOffset); // eslint-disable-next-line no-param-reassign

    t.dateInfoDayFormat = r.dateInfoDayFormat; // eslint-disable-next-line no-param-reassign

    t.dateInfoTimeFormat = r.dateInfoTimeFormat;
  });
}

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

// Reference https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki
// Format: 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
// NOTE: SIGHASH byte ignored AND restricted, truncate before use

var Buffer = __webpack_require__(0).Buffer

function check (buffer) {
  if (buffer.length < 8) return false
  if (buffer.length > 72) return false
  if (buffer[0] !== 0x30) return false
  if (buffer[1] !== buffer.length - 2) return false
  if (buffer[2] !== 0x02) return false

  var lenR = buffer[3]
  if (lenR === 0) return false
  if (5 + lenR >= buffer.length) return false
  if (buffer[4 + lenR] !== 0x02) return false

  var lenS = buffer[5 + lenR]
  if (lenS === 0) return false
  if ((6 + lenR + lenS) !== buffer.length) return false

  if (buffer[4] & 0x80) return false
  if (lenR > 1 && (buffer[4] === 0x00) && !(buffer[5] & 0x80)) return false

  if (buffer[lenR + 6] & 0x80) return false
  if (lenS > 1 && (buffer[lenR + 6] === 0x00) && !(buffer[lenR + 7] & 0x80)) return false
  return true
}

function decode (buffer) {
  if (buffer.length < 8) throw new Error('DER sequence length is too short')
  if (buffer.length > 72) throw new Error('DER sequence length is too long')
  if (buffer[0] !== 0x30) throw new Error('Expected DER sequence')
  if (buffer[1] !== buffer.length - 2) throw new Error('DER sequence length is invalid')
  if (buffer[2] !== 0x02) throw new Error('Expected DER integer')

  var lenR = buffer[3]
  if (lenR === 0) throw new Error('R length is zero')
  if (5 + lenR >= buffer.length) throw new Error('R length is too long')
  if (buffer[4 + lenR] !== 0x02) throw new Error('Expected DER integer (2)')

  var lenS = buffer[5 + lenR]
  if (lenS === 0) throw new Error('S length is zero')
  if ((6 + lenR + lenS) !== buffer.length) throw new Error('S length is invalid')

  if (buffer[4] & 0x80) throw new Error('R value is negative')
  if (lenR > 1 && (buffer[4] === 0x00) && !(buffer[5] & 0x80)) throw new Error('R value excessively padded')

  if (buffer[lenR + 6] & 0x80) throw new Error('S value is negative')
  if (lenS > 1 && (buffer[lenR + 6] === 0x00) && !(buffer[lenR + 7] & 0x80)) throw new Error('S value excessively padded')

  // non-BIP66 - extract R, S values
  return {
    r: buffer.slice(4, 4 + lenR),
    s: buffer.slice(6 + lenR)
  }
}

/*
 * Expects r and s to be positive DER integers.
 *
 * The DER format uses the most significant bit as a sign bit (& 0x80).
 * If the significant bit is set AND the integer is positive, a 0x00 is prepended.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0xff
 *    127 =>     0x7f
 *   -127 =>     0x81
 *    128 =>   0x0080
 *   -128 =>     0x80
 *    255 =>   0x00ff
 *   -255 =>   0xff01
 *  16300 =>   0x3fac
 * -16300 =>   0xc054
 *  62300 => 0x00f35c
 * -62300 => 0xff0ca4
*/
function encode (r, s) {
  var lenR = r.length
  var lenS = s.length
  if (lenR === 0) throw new Error('R length is zero')
  if (lenS === 0) throw new Error('S length is zero')
  if (lenR > 33) throw new Error('R length is too long')
  if (lenS > 33) throw new Error('S length is too long')
  if (r[0] & 0x80) throw new Error('R value is negative')
  if (s[0] & 0x80) throw new Error('S value is negative')
  if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) throw new Error('R value excessively padded')
  if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) throw new Error('S value excessively padded')

  var signature = Buffer.allocUnsafe(6 + lenR + lenS)

  // 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
  signature[0] = 0x30
  signature[1] = signature.length - 2
  signature[2] = 0x02
  signature[3] = r.length
  r.copy(signature, 4)
  signature[4 + lenR] = 0x02
  signature[5 + lenR] = s.length
  s.copy(signature, 6 + lenR)

  return signature
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

var OPS = __webpack_require__(5)

function encodingLength (i) {
  return i < OPS.OP_PUSHDATA1 ? 1
  : i <= 0xff ? 2
  : i <= 0xffff ? 3
  : 5
}

function encode (buffer, number, offset) {
  var size = encodingLength(number)

  // ~6 bit
  if (size === 1) {
    buffer.writeUInt8(number, offset)

  // 8 bit
  } else if (size === 2) {
    buffer.writeUInt8(OPS.OP_PUSHDATA1, offset)
    buffer.writeUInt8(number, offset + 1)

  // 16 bit
  } else if (size === 3) {
    buffer.writeUInt8(OPS.OP_PUSHDATA2, offset)
    buffer.writeUInt16LE(number, offset + 1)

  // 32 bit
  } else {
    buffer.writeUInt8(OPS.OP_PUSHDATA4, offset)
    buffer.writeUInt32LE(number, offset + 1)
  }

  return size
}

function decode (buffer, offset) {
  var opcode = buffer.readUInt8(offset)
  var number, size

  // ~6 bit
  if (opcode < OPS.OP_PUSHDATA1) {
    number = opcode
    size = 1

  // 8 bit
  } else if (opcode === OPS.OP_PUSHDATA1) {
    if (offset + 2 > buffer.length) return null
    number = buffer.readUInt8(offset + 1)
    size = 2

  // 16 bit
  } else if (opcode === OPS.OP_PUSHDATA2) {
    if (offset + 3 > buffer.length) return null
    number = buffer.readUInt16LE(offset + 1)
    size = 3

  // 32 bit
  } else {
    if (offset + 5 > buffer.length) return null
    if (opcode !== OPS.OP_PUSHDATA4) throw new Error('Unexpected opcode')

    number = buffer.readUInt32LE(offset + 1)
    size = 5
  }

  return {
    opcode: opcode,
    number: number,
    size: size
  }
}

module.exports = {
  encodingLength: encodingLength,
  encode: encode,
  decode: decode
}


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

var inherits = __webpack_require__(2)
var native = __webpack_require__(19)

function TfTypeError (type, value, valueTypeName) {
  this.__error = Error.call(this)
  this.__type = type
  this.__value = value
  this.__valueTypeName = valueTypeName

  var message
  Object.defineProperty(this, 'message', {
    enumerable: true,
    get: function () {
      if (message) return message

      valueTypeName = valueTypeName || getValueTypeName(value)
      message = tfErrorString(type, value, valueTypeName)

      return message
    }
  })
}

function TfPropertyTypeError (type, property, label, value, error, valueTypeName) {
  this.__error = error || Error.call(this)
  this.__label = label
  this.__property = property
  this.__type = type
  this.__value = value
  this.__valueTypeName = valueTypeName

  var message
  Object.defineProperty(this, 'message', {
    enumerable: true,
    get: function () {
      if (message) return message
      if (type) {
        valueTypeName = valueTypeName || getValueTypeName(value)
        message = tfPropertyErrorString(type, label, property, value, valueTypeName)
      } else {
        message = 'Unexpected property "' + property + '"'
      }

      return message
    }
  })

  Object.defineProperty(this, 'stack', {
    get: function () {
      return this.__error.stack
    }
  })
}

// inherit from Error
[TfTypeError, TfPropertyTypeError].forEach(function (tfErrorType) {
  inherits(tfErrorType, Error)
})

function tfCustomError (expected, actual) {
  return new TfTypeError(expected, {}, actual)
}

function tfSubError (e, property, label) {
  // sub child?
  if (e instanceof TfPropertyTypeError) {
    property = property + '.' + e.__property
    label = e.__label

    return new TfPropertyTypeError(
      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
    )
  }

  // child?
  if (e instanceof TfTypeError) {
    return new TfPropertyTypeError(
      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
    )
  }

  return e
}

function getTypeName (fn) {
  return fn.name || fn.toString().match(/function (.*?)\s*\(/)[1]
}

function getValueTypeName (value) {
  return native.Nil(value) ? '' : getTypeName(value.constructor)
}

function getValue (value) {
  if (native.Function(value)) return ''
  if (native.String(value)) return JSON.stringify(value)
  if (value && native.Object(value)) return ''
  return value
}

function tfJSON (type) {
  if (native.Function(type)) return type.toJSON ? type.toJSON() : getTypeName(type)
  if (native.Array(type)) return 'Array'
  if (type && native.Object(type)) return 'Object'

  return type !== undefined ? type : ''
}

function tfErrorString (type, value, valueTypeName) {
  var valueJson = getValue(value)

  return 'Expected ' + tfJSON(type) + ', got' +
    (valueTypeName !== '' ? ' ' + valueTypeName : '') +
    (valueJson !== '' ? ' ' + valueJson : '')
}

function tfPropertyErrorString (type, label, name, value, valueTypeName) {
  var description = '" of type '
  if (label === 'key') description = '" with key type '

  return tfErrorString('property "' + tfJSON(name) + description + tfJSON(type), value, valueTypeName)
}

module.exports = {
  TfTypeError: TfTypeError,
  TfPropertyTypeError: TfPropertyTypeError,
  tfCustomError: tfCustomError,
  tfSubError: tfSubError,
  tfJSON: tfJSON,
  getValueTypeName: getValueTypeName
}


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer

function decode (buffer, maxLength, minimal) {
  maxLength = maxLength || 4
  minimal = minimal === undefined ? true : minimal

  var length = buffer.length
  if (length === 0) return 0
  if (length > maxLength) throw new TypeError('Script number overflow')
  if (minimal) {
    if ((buffer[length - 1] & 0x7f) === 0) {
      if (length <= 1 || (buffer[length - 2] & 0x80) === 0) throw new Error('Non-minimally encoded script number')
    }
  }

  // 40-bit
  if (length === 5) {
    var a = buffer.readUInt32LE(0)
    var b = buffer.readUInt8(4)

    if (b & 0x80) return -(((b & ~0x80) * 0x100000000) + a)
    return (b * 0x100000000) + a
  }

  var result = 0

  // 32-bit / 24-bit / 16-bit / 8-bit
  for (var i = 0; i < length; ++i) {
    result |= buffer[i] << (8 * i)
  }

  if (buffer[length - 1] & 0x80) return -(result & ~(0x80 << (8 * (length - 1))))
  return result
}

function scriptNumSize (i) {
  return i > 0x7fffffff ? 5
  : i > 0x7fffff ? 4
  : i > 0x7fff ? 3
  : i > 0x7f ? 2
  : i > 0x00 ? 1
  : 0
}

function encode (number) {
  var value = Math.abs(number)
  var size = scriptNumSize(value)
  var buffer = Buffer.allocUnsafe(size)
  var negative = number < 0

  for (var i = 0; i < size; ++i) {
    buffer.writeUInt8(value & 0xff, i)
    value >>= 8
  }

  if (buffer[size - 1] & 0x80) {
    buffer.writeUInt8(negative ? 0x80 : 0x00, size - 1)
  } else if (negative) {
    buffer[size - 1] |= 0x80
  }

  return buffer
}

module.exports = {
  decode: decode,
  encode: encode
}


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

// m [pubKeys ...] n OP_CHECKMULTISIG

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)
var OP_INT_BASE = OPS.OP_RESERVED // OP_1 - 1

function check (script, allowIncomplete) {
  var chunks = bscript.decompile(script)

  if (chunks.length < 4) return false
  if (chunks[chunks.length - 1] !== OPS.OP_CHECKMULTISIG) return false
  if (!types.Number(chunks[0])) return false
  if (!types.Number(chunks[chunks.length - 2])) return false
  var m = chunks[0] - OP_INT_BASE
  var n = chunks[chunks.length - 2] - OP_INT_BASE

  if (m <= 0) return false
  if (n > 16) return false
  if (m > n) return false
  if (n !== chunks.length - 3) return false
  if (allowIncomplete) return true

  var keys = chunks.slice(1, -2)
  return keys.every(bscript.isCanonicalPubKey)
}
check.toJSON = function () { return 'multi-sig output' }

function encode (m, pubKeys) {
  typeforce({
    m: types.Number,
    pubKeys: [bscript.isCanonicalPubKey]
  }, {
    m: m,
    pubKeys: pubKeys
  })

  var n = pubKeys.length
  if (n < m) throw new TypeError('Not enough pubKeys provided')

  return bscript.compile([].concat(
    OP_INT_BASE + m,
    pubKeys,
    OP_INT_BASE + n,
    OPS.OP_CHECKMULTISIG
  ))
}

function decode (buffer, allowIncomplete) {
  var chunks = bscript.decompile(buffer)
  typeforce(check, chunks, allowIncomplete)

  return {
    m: chunks[0] - OP_INT_BASE,
    pubKeys: chunks.slice(1, -2)
  }
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

// OP_0 {pubKeyHash}

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  var buffer = bscript.compile(script)

  return buffer.length === 22 &&
    buffer[0] === OPS.OP_0 &&
    buffer[1] === 0x14
}
check.toJSON = function () { return 'Witness pubKeyHash output' }

function encode (pubKeyHash) {
  typeforce(types.Hash160bit, pubKeyHash)

  return bscript.compile([OPS.OP_0, pubKeyHash])
}

function decode (buffer) {
  typeforce(check, buffer)

  return buffer.slice(2)
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

// OP_0 {scriptHash}

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  var buffer = bscript.compile(script)

  return buffer.length === 34 &&
    buffer[0] === OPS.OP_0 &&
    buffer[1] === 0x20
}
check.toJSON = function () { return 'Witness scriptHash output' }

function encode (scriptHash) {
  typeforce(types.Hash256bit, scriptHash)

  return bscript.compile([OPS.OP_0, scriptHash])
}

function decode (buffer) {
  typeforce(check, buffer)

  return buffer.slice(2)
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

var pushdata = __webpack_require__(43)
var varuint = __webpack_require__(24)

// https://github.com/feross/buffer/blob/master/index.js#L1127
function verifuint (value, max) {
  if (typeof value !== 'number') throw new Error('cannot write a non-number as a number')
  if (value < 0) throw new Error('specified a negative value for writing an unsigned value')
  if (value > max) throw new Error('RangeError: value out of range')
  if (Math.floor(value) !== value) throw new Error('value has a fractional component')
}

function readUInt64LE (buffer, offset) {
  var a = buffer.readUInt32LE(offset)
  var b = buffer.readUInt32LE(offset + 4)
  b *= 0x100000000

  verifuint(b + a, 0x001fffffffffffff)

  return b + a
}

function writeUInt64LE (buffer, value, offset) {
  verifuint(value, 0x001fffffffffffff)

  buffer.writeInt32LE(value & -1, offset)
  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4)
  return offset + 8
}

// TODO: remove in 4.0.0?
function readVarInt (buffer, offset) {
  var result = varuint.decode(buffer, offset)

  return {
    number: result,
    size: varuint.decode.bytes
  }
}

// TODO: remove in 4.0.0?
function writeVarInt (buffer, number, offset) {
  varuint.encode(number, buffer, offset)
  return varuint.encode.bytes
}

module.exports = {
  pushDataSize: pushdata.encodingLength,
  readPushDataInt: pushdata.decode,
  readUInt64LE: readUInt64LE,
  readVarInt: readVarInt,
  varIntBuffer: varuint.encode,
  varIntSize: varuint.encodingLength,
  writePushDataInt: pushdata.encode,
  writeUInt64LE: writeUInt64LE,
  writeVarInt: writeVarInt
}


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var inherits = __webpack_require__(2)
var MD5 = __webpack_require__(51)
var RIPEMD160 = __webpack_require__(58)
var sha = __webpack_require__(59)
var Base = __webpack_require__(29)

function Hash (hash) {
  Base.call(this, 'digest')

  this._hash = hash
}

inherits(Hash, Base)

Hash.prototype._update = function (data) {
  this._hash.update(data)
}

Hash.prototype._final = function () {
  return this._hash.digest()
}

module.exports = function createHash (alg) {
  alg = alg.toLowerCase()
  if (alg === 'md5') return new MD5()
  if (alg === 'rmd160' || alg === 'ripemd160') return new RIPEMD160()

  return new Hash(sha(alg))
}


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var inherits = __webpack_require__(2)
var HashBase = __webpack_require__(52)
var Buffer = __webpack_require__(0).Buffer

var ARRAY16 = new Array(16)

function MD5 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
}

inherits(MD5, HashBase)

MD5.prototype._update = function () {
  var M = ARRAY16
  for (var i = 0; i < 16; ++i) M[i] = this._block.readInt32LE(i * 4)

  var a = this._a
  var b = this._b
  var c = this._c
  var d = this._d

  a = fnF(a, b, c, d, M[0], 0xd76aa478, 7)
  d = fnF(d, a, b, c, M[1], 0xe8c7b756, 12)
  c = fnF(c, d, a, b, M[2], 0x242070db, 17)
  b = fnF(b, c, d, a, M[3], 0xc1bdceee, 22)
  a = fnF(a, b, c, d, M[4], 0xf57c0faf, 7)
  d = fnF(d, a, b, c, M[5], 0x4787c62a, 12)
  c = fnF(c, d, a, b, M[6], 0xa8304613, 17)
  b = fnF(b, c, d, a, M[7], 0xfd469501, 22)
  a = fnF(a, b, c, d, M[8], 0x698098d8, 7)
  d = fnF(d, a, b, c, M[9], 0x8b44f7af, 12)
  c = fnF(c, d, a, b, M[10], 0xffff5bb1, 17)
  b = fnF(b, c, d, a, M[11], 0x895cd7be, 22)
  a = fnF(a, b, c, d, M[12], 0x6b901122, 7)
  d = fnF(d, a, b, c, M[13], 0xfd987193, 12)
  c = fnF(c, d, a, b, M[14], 0xa679438e, 17)
  b = fnF(b, c, d, a, M[15], 0x49b40821, 22)

  a = fnG(a, b, c, d, M[1], 0xf61e2562, 5)
  d = fnG(d, a, b, c, M[6], 0xc040b340, 9)
  c = fnG(c, d, a, b, M[11], 0x265e5a51, 14)
  b = fnG(b, c, d, a, M[0], 0xe9b6c7aa, 20)
  a = fnG(a, b, c, d, M[5], 0xd62f105d, 5)
  d = fnG(d, a, b, c, M[10], 0x02441453, 9)
  c = fnG(c, d, a, b, M[15], 0xd8a1e681, 14)
  b = fnG(b, c, d, a, M[4], 0xe7d3fbc8, 20)
  a = fnG(a, b, c, d, M[9], 0x21e1cde6, 5)
  d = fnG(d, a, b, c, M[14], 0xc33707d6, 9)
  c = fnG(c, d, a, b, M[3], 0xf4d50d87, 14)
  b = fnG(b, c, d, a, M[8], 0x455a14ed, 20)
  a = fnG(a, b, c, d, M[13], 0xa9e3e905, 5)
  d = fnG(d, a, b, c, M[2], 0xfcefa3f8, 9)
  c = fnG(c, d, a, b, M[7], 0x676f02d9, 14)
  b = fnG(b, c, d, a, M[12], 0x8d2a4c8a, 20)

  a = fnH(a, b, c, d, M[5], 0xfffa3942, 4)
  d = fnH(d, a, b, c, M[8], 0x8771f681, 11)
  c = fnH(c, d, a, b, M[11], 0x6d9d6122, 16)
  b = fnH(b, c, d, a, M[14], 0xfde5380c, 23)
  a = fnH(a, b, c, d, M[1], 0xa4beea44, 4)
  d = fnH(d, a, b, c, M[4], 0x4bdecfa9, 11)
  c = fnH(c, d, a, b, M[7], 0xf6bb4b60, 16)
  b = fnH(b, c, d, a, M[10], 0xbebfbc70, 23)
  a = fnH(a, b, c, d, M[13], 0x289b7ec6, 4)
  d = fnH(d, a, b, c, M[0], 0xeaa127fa, 11)
  c = fnH(c, d, a, b, M[3], 0xd4ef3085, 16)
  b = fnH(b, c, d, a, M[6], 0x04881d05, 23)
  a = fnH(a, b, c, d, M[9], 0xd9d4d039, 4)
  d = fnH(d, a, b, c, M[12], 0xe6db99e5, 11)
  c = fnH(c, d, a, b, M[15], 0x1fa27cf8, 16)
  b = fnH(b, c, d, a, M[2], 0xc4ac5665, 23)

  a = fnI(a, b, c, d, M[0], 0xf4292244, 6)
  d = fnI(d, a, b, c, M[7], 0x432aff97, 10)
  c = fnI(c, d, a, b, M[14], 0xab9423a7, 15)
  b = fnI(b, c, d, a, M[5], 0xfc93a039, 21)
  a = fnI(a, b, c, d, M[12], 0x655b59c3, 6)
  d = fnI(d, a, b, c, M[3], 0x8f0ccc92, 10)
  c = fnI(c, d, a, b, M[10], 0xffeff47d, 15)
  b = fnI(b, c, d, a, M[1], 0x85845dd1, 21)
  a = fnI(a, b, c, d, M[8], 0x6fa87e4f, 6)
  d = fnI(d, a, b, c, M[15], 0xfe2ce6e0, 10)
  c = fnI(c, d, a, b, M[6], 0xa3014314, 15)
  b = fnI(b, c, d, a, M[13], 0x4e0811a1, 21)
  a = fnI(a, b, c, d, M[4], 0xf7537e82, 6)
  d = fnI(d, a, b, c, M[11], 0xbd3af235, 10)
  c = fnI(c, d, a, b, M[2], 0x2ad7d2bb, 15)
  b = fnI(b, c, d, a, M[9], 0xeb86d391, 21)

  this._a = (this._a + a) | 0
  this._b = (this._b + b) | 0
  this._c = (this._c + c) | 0
  this._d = (this._d + d) | 0
}

MD5.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.allocUnsafe(16)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fnF (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + b) | 0
}

function fnG (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + b) | 0
}

function fnH (a, b, c, d, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + b) | 0
}

function fnI (a, b, c, d, m, k, s) {
  return (rotl((a + ((c ^ (b | (~d)))) + m + k) | 0, s) + b) | 0
}

module.exports = MD5


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var Buffer = __webpack_require__(0).Buffer
var Transform = __webpack_require__(53).Transform
var inherits = __webpack_require__(2)

function throwIfNotStringOrBuffer (val, prefix) {
  if (!Buffer.isBuffer(val) && typeof val !== 'string') {
    throw new TypeError(prefix + ' must be a string or a buffer')
  }
}

function HashBase (blockSize) {
  Transform.call(this)

  this._block = Buffer.allocUnsafe(blockSize)
  this._blockSize = blockSize
  this._blockOffset = 0
  this._length = [0, 0, 0, 0]

  this._finalized = false
}

inherits(HashBase, Transform)

HashBase.prototype._transform = function (chunk, encoding, callback) {
  var error = null
  try {
    this.update(chunk, encoding)
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype._flush = function (callback) {
  var error = null
  try {
    this.push(this.digest())
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype.update = function (data, encoding) {
  throwIfNotStringOrBuffer(data, 'Data')
  if (this._finalized) throw new Error('Digest already called')
  if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding)

  // consume data
  var block = this._block
  var offset = 0
  while (this._blockOffset + data.length - offset >= this._blockSize) {
    for (var i = this._blockOffset; i < this._blockSize;) block[i++] = data[offset++]
    this._update()
    this._blockOffset = 0
  }
  while (offset < data.length) block[this._blockOffset++] = data[offset++]

  // update length
  for (var j = 0, carry = data.length * 8; carry > 0; ++j) {
    this._length[j] += carry
    carry = (this._length[j] / 0x0100000000) | 0
    if (carry > 0) this._length[j] -= 0x0100000000 * carry
  }

  return this
}

HashBase.prototype._update = function () {
  throw new Error('_update is not implemented')
}

HashBase.prototype.digest = function (encoding) {
  if (this._finalized) throw new Error('Digest already called')
  this._finalized = true

  var digest = this._digest()
  if (encoding !== undefined) digest = digest.toString(encoding)

  // reset state
  this._block.fill(0)
  this._blockOffset = 0
  for (var i = 0; i < 4; ++i) this._length[i] = 0

  return digest
}

HashBase.prototype._digest = function () {
  throw new Error('_digest is not implemented')
}

module.exports = HashBase


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = __webpack_require__(25).EventEmitter;
var inherits = __webpack_require__(2);

inherits(Stream, EE);
Stream.Readable = __webpack_require__(26);
Stream.Writable = __webpack_require__(98);
Stream.Duplex = __webpack_require__(99);
Stream.Transform = __webpack_require__(100);
Stream.PassThrough = __webpack_require__(101);

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var pna = __webpack_require__(16);
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = __webpack_require__(41);
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = __webpack_require__(25).EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(55);
/*</replacement>*/

/*<replacement>*/

var Buffer = __webpack_require__(0).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = __webpack_require__(14);
util.inherits = __webpack_require__(2);
/*</replacement>*/

/*<replacement>*/
var debugUtil = __webpack_require__(91);
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = __webpack_require__(92);
var destroyImpl = __webpack_require__(56);
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || __webpack_require__(8);

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = __webpack_require__(28).StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || __webpack_require__(8);

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = __webpack_require__(28).StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7), __webpack_require__(11)))

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(25).EventEmitter;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*<replacement>*/

var pna = __webpack_require__(16);
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;

var Duplex = __webpack_require__(8);

/*<replacement>*/
var util = __webpack_require__(14);
util.inherits = __webpack_require__(2);
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var Buffer = __webpack_require__(6).Buffer
var inherits = __webpack_require__(2)
var HashBase = __webpack_require__(52)

var ARRAY16 = new Array(16)

var zl = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]

var zr = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]

var sl = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]

var sr = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]

var hl = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
var hr = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

function RIPEMD160 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0
}

inherits(RIPEMD160, HashBase)

RIPEMD160.prototype._update = function () {
  var words = ARRAY16
  for (var j = 0; j < 16; ++j) words[j] = this._block.readInt32LE(j * 4)

  var al = this._a | 0
  var bl = this._b | 0
  var cl = this._c | 0
  var dl = this._d | 0
  var el = this._e | 0

  var ar = this._a | 0
  var br = this._b | 0
  var cr = this._c | 0
  var dr = this._d | 0
  var er = this._e | 0

  // computation
  for (var i = 0; i < 80; i += 1) {
    var tl
    var tr
    if (i < 16) {
      tl = fn1(al, bl, cl, dl, el, words[zl[i]], hl[0], sl[i])
      tr = fn5(ar, br, cr, dr, er, words[zr[i]], hr[0], sr[i])
    } else if (i < 32) {
      tl = fn2(al, bl, cl, dl, el, words[zl[i]], hl[1], sl[i])
      tr = fn4(ar, br, cr, dr, er, words[zr[i]], hr[1], sr[i])
    } else if (i < 48) {
      tl = fn3(al, bl, cl, dl, el, words[zl[i]], hl[2], sl[i])
      tr = fn3(ar, br, cr, dr, er, words[zr[i]], hr[2], sr[i])
    } else if (i < 64) {
      tl = fn4(al, bl, cl, dl, el, words[zl[i]], hl[3], sl[i])
      tr = fn2(ar, br, cr, dr, er, words[zr[i]], hr[3], sr[i])
    } else { // if (i<80) {
      tl = fn5(al, bl, cl, dl, el, words[zl[i]], hl[4], sl[i])
      tr = fn1(ar, br, cr, dr, er, words[zr[i]], hr[4], sr[i])
    }

    al = el
    el = dl
    dl = rotl(cl, 10)
    cl = bl
    bl = tl

    ar = er
    er = dr
    dr = rotl(cr, 10)
    cr = br
    br = tr
  }

  // update state
  var t = (this._b + cl + dr) | 0
  this._b = (this._c + dl + er) | 0
  this._c = (this._d + el + ar) | 0
  this._d = (this._e + al + br) | 0
  this._e = (this._a + bl + cr) | 0
  this._a = t
}

RIPEMD160.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.alloc ? Buffer.alloc(20) : new Buffer(20)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  buffer.writeInt32LE(this._e, 16)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fn1 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + e) | 0
}

function fn2 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + e) | 0
}

function fn3 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b | (~c)) ^ d) + m + k) | 0, s) + e) | 0
}

function fn4 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + e) | 0
}

function fn5 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ (c | (~d))) + m + k) | 0, s) + e) | 0
}

module.exports = RIPEMD160


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = __webpack_require__(102)
exports.sha1 = __webpack_require__(103)
exports.sha224 = __webpack_require__(104)
exports.sha256 = __webpack_require__(60)
exports.sha384 = __webpack_require__(105)
exports.sha512 = __webpack_require__(61)


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = __webpack_require__(2)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = Buffer.allocUnsafe(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

var inherits = __webpack_require__(2)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = Buffer.allocUnsafe(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512


/***/ }),
/* 62 */
/***/ (function(module, exports) {

assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

// Coins supported by bitgo-bitcoinjs-lib
const typeforce = __webpack_require__(1)

const coins = {
  BCH: 'bch',
  BSV: 'bsv',
  BTC: 'btc',
  BTG: 'btg',
  LTC: 'ltc',
  ZEC: 'zec',
  DASH: 'dash',
  DIGIBYTE: 'dgb',
  DOGECOIN: 'doge',
  NAMECOIN: 'nmc',
  VERTCOIN: 'vtc',
  CAPRICOIN: 'cpc'
}

coins.isBitcoin = function (network) {
  return typeforce.value(coins.BTC)(network.coin)
}

coins.isBitcoinCash = function (network) {
  return typeforce.value(coins.BCH)(network.coin)
}

coins.isBitcoinSV = function (network) {
  return typeforce.value(coins.BSV)(network.coin)
}

coins.isBitcoinGold = function (network) {
  return typeforce.value(coins.BTG)(network.coin)
}

coins.isLitecoin = function (network) {
  return typeforce.value(coins.LTC)(network.coin)
}

coins.isZcash = function (network) {
  return typeforce.value(coins.ZEC)(network.coin)
}

coins.isDash = function (network) {
  return typeforce.value(coins.DASH)(network.coin)
}

coins.isCapricoin = function (network) {
  return typeforce.value(coins.CAPRICOIN)(network.coin)
}

coins.isValidCoin = typeforce.oneOf(
  coins.isBitcoin,
  coins.isBitcoinCash,
  coins.isBitcoinSV,
  coins.isBitcoinGold,
  coins.isLitecoin,
  coins.isZcash,
  coins.isDash,
  coins.isCapricoin
)

module.exports = coins


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var inherits = __webpack_require__(2)
var Legacy = __webpack_require__(115)
var Base = __webpack_require__(29)
var Buffer = __webpack_require__(0).Buffer
var md5 = __webpack_require__(116)
var RIPEMD160 = __webpack_require__(58)

var sha = __webpack_require__(59)

var ZEROS = Buffer.alloc(128)

function Hmac (alg, key) {
  Base.call(this, 'digest')
  if (typeof key === 'string') {
    key = Buffer.from(key)
  }

  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

  this._alg = alg
  this._key = key
  if (key.length > blocksize) {
    var hash = alg === 'rmd160' ? new RIPEMD160() : sha(alg)
    key = hash.update(key).digest()
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = this._ipad = Buffer.allocUnsafe(blocksize)
  var opad = this._opad = Buffer.allocUnsafe(blocksize)

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }
  this._hash = alg === 'rmd160' ? new RIPEMD160() : sha(alg)
  this._hash.update(ipad)
}

inherits(Hmac, Base)

Hmac.prototype._update = function (data) {
  this._hash.update(data)
}

Hmac.prototype._final = function () {
  var h = this._hash.digest()
  var hash = this._alg === 'rmd160' ? new RIPEMD160() : sha(this._alg)
  return hash.update(this._opad).update(h).digest()
}

module.exports = function createHmac (alg, key) {
  alg = alg.toLowerCase()
  if (alg === 'rmd160' || alg === 'ripemd160') {
    return new Hmac('rmd160', key)
  }
  if (alg === 'md5') {
    return new Legacy(md5, key)
  }
  return new Hmac(alg, key)
}


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

// (public) Constructor
function BigInteger(a, b, c) {
  if (!(this instanceof BigInteger))
    return new BigInteger(a, b, c)

  if (a != null) {
    if ("number" == typeof a) this.fromNumber(a, b, c)
    else if (b == null && "string" != typeof a) this.fromString(a, 256)
    else this.fromString(a, b)
  }
}

var proto = BigInteger.prototype

// duck-typed isBigInteger
proto.__bigi = __webpack_require__(117).version
BigInteger.isBigInteger = function (obj, check_ver) {
  return obj && obj.__bigi && (!check_ver || obj.__bigi === proto.__bigi)
}

// Bits per digit
var dbits

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i, x, w, j, c, n) {
  while (--n >= 0) {
    var v = x * this[i++] + w[j] + c
    c = Math.floor(v / 0x4000000)
    w[j++] = v & 0x3ffffff
  }
  return c
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i, x, w, j, c, n) {
  var xl = x & 0x7fff,
    xh = x >> 15
  while (--n >= 0) {
    var l = this[i] & 0x7fff
    var h = this[i++] >> 15
    var m = xh * l + h * xl
    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff)
    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30)
    w[j++] = l & 0x3fffffff
  }
  return c
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i, x, w, j, c, n) {
  var xl = x & 0x3fff,
    xh = x >> 14
  while (--n >= 0) {
    var l = this[i] & 0x3fff
    var h = this[i++] >> 14
    var m = xh * l + h * xl
    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c
    c = (l >> 28) + (m >> 14) + xh * h
    w[j++] = l & 0xfffffff
  }
  return c
}

// wtf?
BigInteger.prototype.am = am1
dbits = 26

BigInteger.prototype.DB = dbits
BigInteger.prototype.DM = ((1 << dbits) - 1)
var DV = BigInteger.prototype.DV = (1 << dbits)

var BI_FP = 52
BigInteger.prototype.FV = Math.pow(2, BI_FP)
BigInteger.prototype.F1 = BI_FP - dbits
BigInteger.prototype.F2 = 2 * dbits - BI_FP

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz"
var BI_RC = new Array()
var rr, vv
rr = "0".charCodeAt(0)
for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv
rr = "a".charCodeAt(0)
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv
rr = "A".charCodeAt(0)
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv

function int2char(n) {
  return BI_RM.charAt(n)
}

function intAt(s, i) {
  var c = BI_RC[s.charCodeAt(i)]
  return (c == null) ? -1 : c
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for (var i = this.t - 1; i >= 0; --i) r[i] = this[i]
  r.t = this.t
  r.s = this.s
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1
  this.s = (x < 0) ? -1 : 0
  if (x > 0) this[0] = x
  else if (x < -1) this[0] = x + DV
  else this.t = 0
}

// return bigint initialized to value
function nbv(i) {
  var r = new BigInteger()
  r.fromInt(i)
  return r
}

// (protected) set from string and radix
function bnpFromString(s, b) {
  var self = this

  var k
  if (b == 16) k = 4
  else if (b == 8) k = 3
  else if (b == 256) k = 8; // byte array
  else if (b == 2) k = 1
  else if (b == 32) k = 5
  else if (b == 4) k = 2
  else {
    self.fromRadix(s, b)
    return
  }
  self.t = 0
  self.s = 0
  var i = s.length,
    mi = false,
    sh = 0
  while (--i >= 0) {
    var x = (k == 8) ? s[i] & 0xff : intAt(s, i)
    if (x < 0) {
      if (s.charAt(i) == "-") mi = true
      continue
    }
    mi = false
    if (sh == 0)
      self[self.t++] = x
    else if (sh + k > self.DB) {
      self[self.t - 1] |= (x & ((1 << (self.DB - sh)) - 1)) << sh
      self[self.t++] = (x >> (self.DB - sh))
    } else
      self[self.t - 1] |= x << sh
    sh += k
    if (sh >= self.DB) sh -= self.DB
  }
  if (k == 8 && (s[0] & 0x80) != 0) {
    self.s = -1
    if (sh > 0) self[self.t - 1] |= ((1 << (self.DB - sh)) - 1) << sh
  }
  self.clamp()
  if (mi) BigInteger.ZERO.subTo(self, self)
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s & this.DM
  while (this.t > 0 && this[this.t - 1] == c)--this.t
}

// (public) return string representation in given radix
function bnToString(b) {
  var self = this
  if (self.s < 0) return "-" + self.negate()
    .toString(b)
  var k
  if (b == 16) k = 4
  else if (b == 8) k = 3
  else if (b == 2) k = 1
  else if (b == 32) k = 5
  else if (b == 4) k = 2
  else return self.toRadix(b)
  var km = (1 << k) - 1,
    d, m = false,
    r = "",
    i = self.t
  var p = self.DB - (i * self.DB) % k
  if (i-- > 0) {
    if (p < self.DB && (d = self[i] >> p) > 0) {
      m = true
      r = int2char(d)
    }
    while (i >= 0) {
      if (p < k) {
        d = (self[i] & ((1 << p) - 1)) << (k - p)
        d |= self[--i] >> (p += self.DB - k)
      } else {
        d = (self[i] >> (p -= k)) & km
        if (p <= 0) {
          p += self.DB
          --i
        }
      }
      if (d > 0) m = true
      if (m) r += int2char(d)
    }
  }
  return m ? r : "0"
}

// (public) -this
function bnNegate() {
  var r = new BigInteger()
  BigInteger.ZERO.subTo(this, r)
  return r
}

// (public) |this|
function bnAbs() {
  return (this.s < 0) ? this.negate() : this
}

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s - a.s
  if (r != 0) return r
  var i = this.t
  r = i - a.t
  if (r != 0) return (this.s < 0) ? -r : r
  while (--i >= 0)
    if ((r = this[i] - a[i]) != 0) return r
  return 0
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1,
    t
  if ((t = x >>> 16) != 0) {
    x = t
    r += 16
  }
  if ((t = x >> 8) != 0) {
    x = t
    r += 8
  }
  if ((t = x >> 4) != 0) {
    x = t
    r += 4
  }
  if ((t = x >> 2) != 0) {
    x = t
    r += 2
  }
  if ((t = x >> 1) != 0) {
    x = t
    r += 1
  }
  return r
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if (this.t <= 0) return 0
  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM))
}

// (public) return the number of bytes in "this"
function bnByteLength() {
  return this.bitLength() >> 3
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n, r) {
  var i
  for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i]
  for (i = n - 1; i >= 0; --i) r[i] = 0
  r.t = this.t + n
  r.s = this.s
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n, r) {
  for (var i = n; i < this.t; ++i) r[i - n] = this[i]
  r.t = Math.max(this.t - n, 0)
  r.s = this.s
}

// (protected) r = this << n
function bnpLShiftTo(n, r) {
  var self = this
  var bs = n % self.DB
  var cbs = self.DB - bs
  var bm = (1 << cbs) - 1
  var ds = Math.floor(n / self.DB),
    c = (self.s << bs) & self.DM,
    i
  for (i = self.t - 1; i >= 0; --i) {
    r[i + ds + 1] = (self[i] >> cbs) | c
    c = (self[i] & bm) << bs
  }
  for (i = ds - 1; i >= 0; --i) r[i] = 0
  r[ds] = c
  r.t = self.t + ds + 1
  r.s = self.s
  r.clamp()
}

// (protected) r = this >> n
function bnpRShiftTo(n, r) {
  var self = this
  r.s = self.s
  var ds = Math.floor(n / self.DB)
  if (ds >= self.t) {
    r.t = 0
    return
  }
  var bs = n % self.DB
  var cbs = self.DB - bs
  var bm = (1 << bs) - 1
  r[0] = self[ds] >> bs
  for (var i = ds + 1; i < self.t; ++i) {
    r[i - ds - 1] |= (self[i] & bm) << cbs
    r[i - ds] = self[i] >> bs
  }
  if (bs > 0) r[self.t - ds - 1] |= (self.s & bm) << cbs
  r.t = self.t - ds
  r.clamp()
}

// (protected) r = this - a
function bnpSubTo(a, r) {
  var self = this
  var i = 0,
    c = 0,
    m = Math.min(a.t, self.t)
  while (i < m) {
    c += self[i] - a[i]
    r[i++] = c & self.DM
    c >>= self.DB
  }
  if (a.t < self.t) {
    c -= a.s
    while (i < self.t) {
      c += self[i]
      r[i++] = c & self.DM
      c >>= self.DB
    }
    c += self.s
  } else {
    c += self.s
    while (i < a.t) {
      c -= a[i]
      r[i++] = c & self.DM
      c >>= self.DB
    }
    c -= a.s
  }
  r.s = (c < 0) ? -1 : 0
  if (c < -1) r[i++] = self.DV + c
  else if (c > 0) r[i++] = c
  r.t = i
  r.clamp()
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a, r) {
  var x = this.abs(),
    y = a.abs()
  var i = x.t
  r.t = i + y.t
  while (--i >= 0) r[i] = 0
  for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t)
  r.s = 0
  r.clamp()
  if (this.s != a.s) BigInteger.ZERO.subTo(r, r)
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs()
  var i = r.t = 2 * x.t
  while (--i >= 0) r[i] = 0
  for (i = 0; i < x.t - 1; ++i) {
    var c = x.am(i, x[i], r, 2 * i, 0, 1)
    if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
      r[i + x.t] -= x.DV
      r[i + x.t + 1] = 1
    }
  }
  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1)
  r.s = 0
  r.clamp()
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m, q, r) {
  var self = this
  var pm = m.abs()
  if (pm.t <= 0) return
  var pt = self.abs()
  if (pt.t < pm.t) {
    if (q != null) q.fromInt(0)
    if (r != null) self.copyTo(r)
    return
  }
  if (r == null) r = new BigInteger()
  var y = new BigInteger(),
    ts = self.s,
    ms = m.s
  var nsh = self.DB - nbits(pm[pm.t - 1]); // normalize modulus
  if (nsh > 0) {
    pm.lShiftTo(nsh, y)
    pt.lShiftTo(nsh, r)
  } else {
    pm.copyTo(y)
    pt.copyTo(r)
  }
  var ys = y.t
  var y0 = y[ys - 1]
  if (y0 == 0) return
  var yt = y0 * (1 << self.F1) + ((ys > 1) ? y[ys - 2] >> self.F2 : 0)
  var d1 = self.FV / yt,
    d2 = (1 << self.F1) / yt,
    e = 1 << self.F2
  var i = r.t,
    j = i - ys,
    t = (q == null) ? new BigInteger() : q
  y.dlShiftTo(j, t)
  if (r.compareTo(t) >= 0) {
    r[r.t++] = 1
    r.subTo(t, r)
  }
  BigInteger.ONE.dlShiftTo(ys, t)
  t.subTo(y, y); // "negative" y so we can replace sub with am later
  while (y.t < ys) y[y.t++] = 0
  while (--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i] == y0) ? self.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2)
    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) { // Try it out
      y.dlShiftTo(j, t)
      r.subTo(t, r)
      while (r[i] < --qd) r.subTo(t, r)
    }
  }
  if (q != null) {
    r.drShiftTo(ys, q)
    if (ts != ms) BigInteger.ZERO.subTo(q, q)
  }
  r.t = ys
  r.clamp()
  if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
  if (ts < 0) BigInteger.ZERO.subTo(r, r)
}

// (public) this mod a
function bnMod(a) {
  var r = new BigInteger()
  this.abs()
    .divRemTo(a, null, r)
  if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r)
  return r
}

// Modular reduction using "classic" algorithm
function Classic(m) {
  this.m = m
}

function cConvert(x) {
  if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m)
  else return x
}

function cRevert(x) {
  return x
}

function cReduce(x) {
  x.divRemTo(this.m, null, x)
}

function cMulTo(x, y, r) {
  x.multiplyTo(y, r)
  this.reduce(r)
}

function cSqrTo(x, r) {
  x.squareTo(r)
  this.reduce(r)
}

Classic.prototype.convert = cConvert
Classic.prototype.revert = cRevert
Classic.prototype.reduce = cReduce
Classic.prototype.mulTo = cMulTo
Classic.prototype.sqrTo = cSqrTo

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if (this.t < 1) return 0
  var x = this[0]
  if ((x & 1) == 0) return 0
  var y = x & 3; // y == 1/x mod 2^2
  y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
  y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
  y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y > 0) ? this.DV - y : -y
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m
  this.mp = m.invDigit()
  this.mpl = this.mp & 0x7fff
  this.mph = this.mp >> 15
  this.um = (1 << (m.DB - 15)) - 1
  this.mt2 = 2 * m.t
}

// xR mod m
function montConvert(x) {
  var r = new BigInteger()
  x.abs()
    .dlShiftTo(this.m.t, r)
  r.divRemTo(this.m, null, r)
  if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r)
  return r
}

// x/R mod m
function montRevert(x) {
  var r = new BigInteger()
  x.copyTo(r)
  this.reduce(r)
  return r
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while (x.t <= this.mt2) // pad x so am has enough room later
    x[x.t++] = 0
  for (var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i] & 0x7fff
    var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM
    // use am to combine the multiply-shift-add into one call
    j = i + this.m.t
    x[j] += this.m.am(0, u0, x, i, 0, this.m.t)
    // propagate carry
    while (x[j] >= x.DV) {
      x[j] -= x.DV
      x[++j]++
    }
  }
  x.clamp()
  x.drShiftTo(this.m.t, x)
  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x)
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x, r) {
  x.squareTo(r)
  this.reduce(r)
}

// r = "xy/R mod m"; x,y != r
function montMulTo(x, y, r) {
  x.multiplyTo(y, r)
  this.reduce(r)
}

Montgomery.prototype.convert = montConvert
Montgomery.prototype.revert = montRevert
Montgomery.prototype.reduce = montReduce
Montgomery.prototype.mulTo = montMulTo
Montgomery.prototype.sqrTo = montSqrTo

// (protected) true iff this is even
function bnpIsEven() {
  return ((this.t > 0) ? (this[0] & 1) : this.s) == 0
}

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e, z) {
  if (e > 0xffffffff || e < 1) return BigInteger.ONE
  var r = new BigInteger(),
    r2 = new BigInteger(),
    g = z.convert(this),
    i = nbits(e) - 1
  g.copyTo(r)
  while (--i >= 0) {
    z.sqrTo(r, r2)
    if ((e & (1 << i)) > 0) z.mulTo(r2, g, r)
    else {
      var t = r
      r = r2
      r2 = t
    }
  }
  return z.revert(r)
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e, m) {
  var z
  if (e < 256 || m.isEven()) z = new Classic(m)
  else z = new Montgomery(m)
  return this.exp(e, z)
}

// protected
proto.copyTo = bnpCopyTo
proto.fromInt = bnpFromInt
proto.fromString = bnpFromString
proto.clamp = bnpClamp
proto.dlShiftTo = bnpDLShiftTo
proto.drShiftTo = bnpDRShiftTo
proto.lShiftTo = bnpLShiftTo
proto.rShiftTo = bnpRShiftTo
proto.subTo = bnpSubTo
proto.multiplyTo = bnpMultiplyTo
proto.squareTo = bnpSquareTo
proto.divRemTo = bnpDivRemTo
proto.invDigit = bnpInvDigit
proto.isEven = bnpIsEven
proto.exp = bnpExp

// public
proto.toString = bnToString
proto.negate = bnNegate
proto.abs = bnAbs
proto.compareTo = bnCompareTo
proto.bitLength = bnBitLength
proto.byteLength = bnByteLength
proto.mod = bnMod
proto.modPowInt = bnModPowInt

// (public)
function bnClone() {
  var r = new BigInteger()
  this.copyTo(r)
  return r
}

// (public) return value as integer
function bnIntValue() {
  if (this.s < 0) {
    if (this.t == 1) return this[0] - this.DV
    else if (this.t == 0) return -1
  } else if (this.t == 1) return this[0]
  else if (this.t == 0) return 0
  // assumes 16 < DB < 32
  return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0]
}

// (public) return value as byte
function bnByteValue() {
  return (this.t == 0) ? this.s : (this[0] << 24) >> 24
}

// (public) return value as short (assumes DB>=16)
function bnShortValue() {
  return (this.t == 0) ? this.s : (this[0] << 16) >> 16
}

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) {
  return Math.floor(Math.LN2 * this.DB / Math.log(r))
}

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if (this.s < 0) return -1
  else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0
  else return 1
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if (b == null) b = 10
  if (this.signum() == 0 || b < 2 || b > 36) return "0"
  var cs = this.chunkSize(b)
  var a = Math.pow(b, cs)
  var d = nbv(a),
    y = new BigInteger(),
    z = new BigInteger(),
    r = ""
  this.divRemTo(d, y, z)
  while (y.signum() > 0) {
    r = (a + z.intValue())
      .toString(b)
      .substr(1) + r
    y.divRemTo(d, y, z)
  }
  return z.intValue()
    .toString(b) + r
}

// (protected) convert from radix string
function bnpFromRadix(s, b) {
  var self = this
  self.fromInt(0)
  if (b == null) b = 10
  var cs = self.chunkSize(b)
  var d = Math.pow(b, cs),
    mi = false,
    j = 0,
    w = 0
  for (var i = 0; i < s.length; ++i) {
    var x = intAt(s, i)
    if (x < 0) {
      if (s.charAt(i) == "-" && self.signum() == 0) mi = true
      continue
    }
    w = b * w + x
    if (++j >= cs) {
      self.dMultiply(d)
      self.dAddOffset(w, 0)
      j = 0
      w = 0
    }
  }
  if (j > 0) {
    self.dMultiply(Math.pow(b, j))
    self.dAddOffset(w, 0)
  }
  if (mi) BigInteger.ZERO.subTo(self, self)
}

// (protected) alternate constructor
function bnpFromNumber(a, b, c) {
  var self = this
  if ("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if (a < 2) self.fromInt(1)
    else {
      self.fromNumber(a, c)
      if (!self.testBit(a - 1)) // force MSB set
        self.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, self)
      if (self.isEven()) self.dAddOffset(1, 0); // force odd
      while (!self.isProbablePrime(b)) {
        self.dAddOffset(2, 0)
        if (self.bitLength() > a) self.subTo(BigInteger.ONE.shiftLeft(a - 1), self)
      }
    }
  } else {
    // new BigInteger(int,RNG)
    var x = new Array(),
      t = a & 7
    x.length = (a >> 3) + 1
    b.nextBytes(x)
    if (t > 0) x[0] &= ((1 << t) - 1)
    else x[0] = 0
    self.fromString(x, 256)
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var self = this
  var i = self.t,
    r = new Array()
  r[0] = self.s
  var p = self.DB - (i * self.DB) % 8,
    d, k = 0
  if (i-- > 0) {
    if (p < self.DB && (d = self[i] >> p) != (self.s & self.DM) >> p)
      r[k++] = d | (self.s << (self.DB - p))
    while (i >= 0) {
      if (p < 8) {
        d = (self[i] & ((1 << p) - 1)) << (8 - p)
        d |= self[--i] >> (p += self.DB - 8)
      } else {
        d = (self[i] >> (p -= 8)) & 0xff
        if (p <= 0) {
          p += self.DB
          --i
        }
      }
      if ((d & 0x80) != 0) d |= -256
      if (k === 0 && (self.s & 0x80) != (d & 0x80))++k
      if (k > 0 || d != self.s) r[k++] = d
    }
  }
  return r
}

function bnEquals(a) {
  return (this.compareTo(a) == 0)
}

function bnMin(a) {
  return (this.compareTo(a) < 0) ? this : a
}

function bnMax(a) {
  return (this.compareTo(a) > 0) ? this : a
}

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a, op, r) {
  var self = this
  var i, f, m = Math.min(a.t, self.t)
  for (i = 0; i < m; ++i) r[i] = op(self[i], a[i])
  if (a.t < self.t) {
    f = a.s & self.DM
    for (i = m; i < self.t; ++i) r[i] = op(self[i], f)
    r.t = self.t
  } else {
    f = self.s & self.DM
    for (i = m; i < a.t; ++i) r[i] = op(f, a[i])
    r.t = a.t
  }
  r.s = op(self.s, a.s)
  r.clamp()
}

// (public) this & a
function op_and(x, y) {
  return x & y
}

function bnAnd(a) {
  var r = new BigInteger()
  this.bitwiseTo(a, op_and, r)
  return r
}

// (public) this | a
function op_or(x, y) {
  return x | y
}

function bnOr(a) {
  var r = new BigInteger()
  this.bitwiseTo(a, op_or, r)
  return r
}

// (public) this ^ a
function op_xor(x, y) {
  return x ^ y
}

function bnXor(a) {
  var r = new BigInteger()
  this.bitwiseTo(a, op_xor, r)
  return r
}

// (public) this & ~a
function op_andnot(x, y) {
  return x & ~y
}

function bnAndNot(a) {
  var r = new BigInteger()
  this.bitwiseTo(a, op_andnot, r)
  return r
}

// (public) ~this
function bnNot() {
  var r = new BigInteger()
  for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i]
  r.t = this.t
  r.s = ~this.s
  return r
}

// (public) this << n
function bnShiftLeft(n) {
  var r = new BigInteger()
  if (n < 0) this.rShiftTo(-n, r)
  else this.lShiftTo(n, r)
  return r
}

// (public) this >> n
function bnShiftRight(n) {
  var r = new BigInteger()
  if (n < 0) this.lShiftTo(-n, r)
  else this.rShiftTo(n, r)
  return r
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if (x == 0) return -1
  var r = 0
  if ((x & 0xffff) == 0) {
    x >>= 16
    r += 16
  }
  if ((x & 0xff) == 0) {
    x >>= 8
    r += 8
  }
  if ((x & 0xf) == 0) {
    x >>= 4
    r += 4
  }
  if ((x & 3) == 0) {
    x >>= 2
    r += 2
  }
  if ((x & 1) == 0)++r
  return r
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for (var i = 0; i < this.t; ++i)
    if (this[i] != 0) return i * this.DB + lbit(this[i])
  if (this.s < 0) return this.t * this.DB
  return -1
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0
  while (x != 0) {
    x &= x - 1
    ++r
  }
  return r
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0,
    x = this.s & this.DM
  for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x)
  return r
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n / this.DB)
  if (j >= this.t) return (this.s != 0)
  return ((this[j] & (1 << (n % this.DB))) != 0)
}

// (protected) this op (1<<n)
function bnpChangeBit(n, op) {
  var r = BigInteger.ONE.shiftLeft(n)
  this.bitwiseTo(r, op, r)
  return r
}

// (public) this | (1<<n)
function bnSetBit(n) {
  return this.changeBit(n, op_or)
}

// (public) this & ~(1<<n)
function bnClearBit(n) {
  return this.changeBit(n, op_andnot)
}

// (public) this ^ (1<<n)
function bnFlipBit(n) {
  return this.changeBit(n, op_xor)
}

// (protected) r = this + a
function bnpAddTo(a, r) {
  var self = this

  var i = 0,
    c = 0,
    m = Math.min(a.t, self.t)
  while (i < m) {
    c += self[i] + a[i]
    r[i++] = c & self.DM
    c >>= self.DB
  }
  if (a.t < self.t) {
    c += a.s
    while (i < self.t) {
      c += self[i]
      r[i++] = c & self.DM
      c >>= self.DB
    }
    c += self.s
  } else {
    c += self.s
    while (i < a.t) {
      c += a[i]
      r[i++] = c & self.DM
      c >>= self.DB
    }
    c += a.s
  }
  r.s = (c < 0) ? -1 : 0
  if (c > 0) r[i++] = c
  else if (c < -1) r[i++] = self.DV + c
  r.t = i
  r.clamp()
}

// (public) this + a
function bnAdd(a) {
  var r = new BigInteger()
  this.addTo(a, r)
  return r
}

// (public) this - a
function bnSubtract(a) {
  var r = new BigInteger()
  this.subTo(a, r)
  return r
}

// (public) this * a
function bnMultiply(a) {
  var r = new BigInteger()
  this.multiplyTo(a, r)
  return r
}

// (public) this^2
function bnSquare() {
  var r = new BigInteger()
  this.squareTo(r)
  return r
}

// (public) this / a
function bnDivide(a) {
  var r = new BigInteger()
  this.divRemTo(a, r, null)
  return r
}

// (public) this % a
function bnRemainder(a) {
  var r = new BigInteger()
  this.divRemTo(a, null, r)
  return r
}

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = new BigInteger(),
    r = new BigInteger()
  this.divRemTo(a, q, r)
  return new Array(q, r)
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0, n - 1, this, 0, 0, this.t)
  ++this.t
  this.clamp()
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n, w) {
  if (n == 0) return
  while (this.t <= w) this[this.t++] = 0
  this[w] += n
  while (this[w] >= this.DV) {
    this[w] -= this.DV
    if (++w >= this.t) this[this.t++] = 0
    ++this[w]
  }
}

// A "null" reducer
function NullExp() {}

function nNop(x) {
  return x
}

function nMulTo(x, y, r) {
  x.multiplyTo(y, r)
}

function nSqrTo(x, r) {
  x.squareTo(r)
}

NullExp.prototype.convert = nNop
NullExp.prototype.revert = nNop
NullExp.prototype.mulTo = nMulTo
NullExp.prototype.sqrTo = nSqrTo

// (public) this^e
function bnPow(e) {
  return this.exp(e, new NullExp())
}

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a, n, r) {
  var i = Math.min(this.t + a.t, n)
  r.s = 0; // assumes a,this >= 0
  r.t = i
  while (i > 0) r[--i] = 0
  var j
  for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t)
  for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i)
  r.clamp()
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a, n, r) {
  --n
  var i = r.t = this.t + a.t - n
  r.s = 0; // assumes a,this >= 0
  while (--i >= 0) r[i] = 0
  for (i = Math.max(n - this.t, 0); i < a.t; ++i)
    r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n)
  r.clamp()
  r.drShiftTo(1, r)
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = new BigInteger()
  this.q3 = new BigInteger()
  BigInteger.ONE.dlShiftTo(2 * m.t, this.r2)
  this.mu = this.r2.divide(m)
  this.m = m
}

function barrettConvert(x) {
  if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m)
  else if (x.compareTo(this.m) < 0) return x
  else {
    var r = new BigInteger()
    x.copyTo(r)
    this.reduce(r)
    return r
  }
}

function barrettRevert(x) {
  return x
}

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  var self = this
  x.drShiftTo(self.m.t - 1, self.r2)
  if (x.t > self.m.t + 1) {
    x.t = self.m.t + 1
    x.clamp()
  }
  self.mu.multiplyUpperTo(self.r2, self.m.t + 1, self.q3)
  self.m.multiplyLowerTo(self.q3, self.m.t + 1, self.r2)
  while (x.compareTo(self.r2) < 0) x.dAddOffset(1, self.m.t + 1)
  x.subTo(self.r2, x)
  while (x.compareTo(self.m) >= 0) x.subTo(self.m, x)
}

// r = x^2 mod m; x != r
function barrettSqrTo(x, r) {
  x.squareTo(r)
  this.reduce(r)
}

// r = x*y mod m; x,y != r
function barrettMulTo(x, y, r) {
  x.multiplyTo(y, r)
  this.reduce(r)
}

Barrett.prototype.convert = barrettConvert
Barrett.prototype.revert = barrettRevert
Barrett.prototype.reduce = barrettReduce
Barrett.prototype.mulTo = barrettMulTo
Barrett.prototype.sqrTo = barrettSqrTo

// (public) this^e % m (HAC 14.85)
function bnModPow(e, m) {
  var i = e.bitLength(),
    k, r = nbv(1),
    z
  if (i <= 0) return r
  else if (i < 18) k = 1
  else if (i < 48) k = 3
  else if (i < 144) k = 4
  else if (i < 768) k = 5
  else k = 6
  if (i < 8)
    z = new Classic(m)
  else if (m.isEven())
    z = new Barrett(m)
  else
    z = new Montgomery(m)

  // precomputation
  var g = new Array(),
    n = 3,
    k1 = k - 1,
    km = (1 << k) - 1
  g[1] = z.convert(this)
  if (k > 1) {
    var g2 = new BigInteger()
    z.sqrTo(g[1], g2)
    while (n <= km) {
      g[n] = new BigInteger()
      z.mulTo(g2, g[n - 2], g[n])
      n += 2
    }
  }

  var j = e.t - 1,
    w, is1 = true,
    r2 = new BigInteger(),
    t
  i = nbits(e[j]) - 1
  while (j >= 0) {
    if (i >= k1) w = (e[j] >> (i - k1)) & km
    else {
      w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i)
      if (j > 0) w |= e[j - 1] >> (this.DB + i - k1)
    }

    n = k
    while ((w & 1) == 0) {
      w >>= 1
      --n
    }
    if ((i -= n) < 0) {
      i += this.DB
      --j
    }
    if (is1) { // ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r)
      is1 = false
    } else {
      while (n > 1) {
        z.sqrTo(r, r2)
        z.sqrTo(r2, r)
        n -= 2
      }
      if (n > 0) z.sqrTo(r, r2)
      else {
        t = r
        r = r2
        r2 = t
      }
      z.mulTo(r2, g[w], r)
    }

    while (j >= 0 && (e[j] & (1 << i)) == 0) {
      z.sqrTo(r, r2)
      t = r
      r = r2
      r2 = t
      if (--i < 0) {
        i = this.DB - 1
        --j
      }
    }
  }
  return z.revert(r)
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s < 0) ? this.negate() : this.clone()
  var y = (a.s < 0) ? a.negate() : a.clone()
  if (x.compareTo(y) < 0) {
    var t = x
    x = y
    y = t
  }
  var i = x.getLowestSetBit(),
    g = y.getLowestSetBit()
  if (g < 0) return x
  if (i < g) g = i
  if (g > 0) {
    x.rShiftTo(g, x)
    y.rShiftTo(g, y)
  }
  while (x.signum() > 0) {
    if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x)
    if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y)
    if (x.compareTo(y) >= 0) {
      x.subTo(y, x)
      x.rShiftTo(1, x)
    } else {
      y.subTo(x, y)
      y.rShiftTo(1, y)
    }
  }
  if (g > 0) y.lShiftTo(g, y)
  return y
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if (n <= 0) return 0
  var d = this.DV % n,
    r = (this.s < 0) ? n - 1 : 0
  if (this.t > 0)
    if (d == 0) r = this[0] % n
    else
      for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n
  return r
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven()
  if (this.signum() === 0) throw new Error('division by zero')
  if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO
  var u = m.clone(),
    v = this.clone()
  var a = nbv(1),
    b = nbv(0),
    c = nbv(0),
    d = nbv(1)
  while (u.signum() != 0) {
    while (u.isEven()) {
      u.rShiftTo(1, u)
      if (ac) {
        if (!a.isEven() || !b.isEven()) {
          a.addTo(this, a)
          b.subTo(m, b)
        }
        a.rShiftTo(1, a)
      } else if (!b.isEven()) b.subTo(m, b)
      b.rShiftTo(1, b)
    }
    while (v.isEven()) {
      v.rShiftTo(1, v)
      if (ac) {
        if (!c.isEven() || !d.isEven()) {
          c.addTo(this, c)
          d.subTo(m, d)
        }
        c.rShiftTo(1, c)
      } else if (!d.isEven()) d.subTo(m, d)
      d.rShiftTo(1, d)
    }
    if (u.compareTo(v) >= 0) {
      u.subTo(v, u)
      if (ac) a.subTo(c, a)
      b.subTo(d, b)
    } else {
      v.subTo(u, v)
      if (ac) c.subTo(a, c)
      d.subTo(b, d)
    }
  }
  if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO
  while (d.compareTo(m) >= 0) d.subTo(m, d)
  while (d.signum() < 0) d.addTo(m, d)
  return d
}

var lowprimes = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
]

var lplim = (1 << 26) / lowprimes[lowprimes.length - 1]

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs()
  if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
    for (i = 0; i < lowprimes.length; ++i)
      if (x[0] == lowprimes[i]) return true
    return false
  }
  if (x.isEven()) return false
  i = 1
  while (i < lowprimes.length) {
    var m = lowprimes[i],
      j = i + 1
    while (j < lowprimes.length && m < lplim) m *= lowprimes[j++]
    m = x.modInt(m)
    while (i < j) if (m % lowprimes[i++] == 0) return false
  }
  return x.millerRabin(t)
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE)
  var k = n1.getLowestSetBit()
  if (k <= 0) return false
  var r = n1.shiftRight(k)
  t = (t + 1) >> 1
  if (t > lowprimes.length) t = lowprimes.length
  var a = new BigInteger(null)
  var j, bases = []
  for (var i = 0; i < t; ++i) {
    for (;;) {
      j = lowprimes[Math.floor(Math.random() * lowprimes.length)]
      if (bases.indexOf(j) == -1) break
    }
    bases.push(j)
    a.fromInt(j)
    var y = a.modPow(r, this)
    if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1
      while (j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2, this)
        if (y.compareTo(BigInteger.ONE) == 0) return false
      }
      if (y.compareTo(n1) != 0) return false
    }
  }
  return true
}

// protected
proto.chunkSize = bnpChunkSize
proto.toRadix = bnpToRadix
proto.fromRadix = bnpFromRadix
proto.fromNumber = bnpFromNumber
proto.bitwiseTo = bnpBitwiseTo
proto.changeBit = bnpChangeBit
proto.addTo = bnpAddTo
proto.dMultiply = bnpDMultiply
proto.dAddOffset = bnpDAddOffset
proto.multiplyLowerTo = bnpMultiplyLowerTo
proto.multiplyUpperTo = bnpMultiplyUpperTo
proto.modInt = bnpModInt
proto.millerRabin = bnpMillerRabin

// public
proto.clone = bnClone
proto.intValue = bnIntValue
proto.byteValue = bnByteValue
proto.shortValue = bnShortValue
proto.signum = bnSigNum
proto.toByteArray = bnToByteArray
proto.equals = bnEquals
proto.min = bnMin
proto.max = bnMax
proto.and = bnAnd
proto.or = bnOr
proto.xor = bnXor
proto.andNot = bnAndNot
proto.not = bnNot
proto.shiftLeft = bnShiftLeft
proto.shiftRight = bnShiftRight
proto.getLowestSetBit = bnGetLowestSetBit
proto.bitCount = bnBitCount
proto.testBit = bnTestBit
proto.setBit = bnSetBit
proto.clearBit = bnClearBit
proto.flipBit = bnFlipBit
proto.add = bnAdd
proto.subtract = bnSubtract
proto.multiply = bnMultiply
proto.divide = bnDivide
proto.remainder = bnRemainder
proto.divideAndRemainder = bnDivideAndRemainder
proto.modPow = bnModPow
proto.modInverse = bnModInverse
proto.pow = bnPow
proto.gcd = bnGCD
proto.isProbablePrime = bnIsProbablePrime

// JSBN-specific extension
proto.square = bnSquare

// constants
BigInteger.ZERO = nbv(0)
BigInteger.ONE = nbv(1)
BigInteger.valueOf = nbv

module.exports = BigInteger


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

var assert = __webpack_require__(33)
var Buffer = __webpack_require__(0).Buffer
var BigInteger = __webpack_require__(9)

var THREE = BigInteger.valueOf(3)

function Point (curve, x, y, z) {
  assert.notStrictEqual(z, undefined, 'Missing Z coordinate')

  this.curve = curve
  this.x = x
  this.y = y
  this.z = z
  this._zInv = null

  this.compressed = true
}

Object.defineProperty(Point.prototype, 'zInv', {
  get: function () {
    if (this._zInv === null) {
      this._zInv = this.z.modInverse(this.curve.p)
    }

    return this._zInv
  }
})

Object.defineProperty(Point.prototype, 'affineX', {
  get: function () {
    return this.x.multiply(this.zInv).mod(this.curve.p)
  }
})

Object.defineProperty(Point.prototype, 'affineY', {
  get: function () {
    return this.y.multiply(this.zInv).mod(this.curve.p)
  }
})

Point.fromAffine = function (curve, x, y) {
  return new Point(curve, x, y, BigInteger.ONE)
}

Point.prototype.equals = function (other) {
  if (other === this) return true
  if (this.curve.isInfinity(this)) return this.curve.isInfinity(other)
  if (this.curve.isInfinity(other)) return this.curve.isInfinity(this)

  // u = Y2 * Z1 - Y1 * Z2
  var u = other.y.multiply(this.z).subtract(this.y.multiply(other.z)).mod(this.curve.p)

  if (u.signum() !== 0) return false

  // v = X2 * Z1 - X1 * Z2
  var v = other.x.multiply(this.z).subtract(this.x.multiply(other.z)).mod(this.curve.p)

  return v.signum() === 0
}

Point.prototype.negate = function () {
  var y = this.curve.p.subtract(this.y)

  return new Point(this.curve, this.x, y, this.z)
}

Point.prototype.add = function (b) {
  if (this.curve.isInfinity(this)) return b
  if (this.curve.isInfinity(b)) return this

  var x1 = this.x
  var y1 = this.y
  var x2 = b.x
  var y2 = b.y

  // u = Y2 * Z1 - Y1 * Z2
  var u = y2.multiply(this.z).subtract(y1.multiply(b.z)).mod(this.curve.p)
  // v = X2 * Z1 - X1 * Z2
  var v = x2.multiply(this.z).subtract(x1.multiply(b.z)).mod(this.curve.p)

  if (v.signum() === 0) {
    if (u.signum() === 0) {
      return this.twice() // this == b, so double
    }

    return this.curve.infinity // this = -b, so infinity
  }

  var v2 = v.square()
  var v3 = v2.multiply(v)
  var x1v2 = x1.multiply(v2)
  var zu2 = u.square().multiply(this.z)

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.p)
  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.p)
  // z3 = v^3 * z1 * z2
  var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.p)

  return new Point(this.curve, x3, y3, z3)
}

Point.prototype.twice = function () {
  if (this.curve.isInfinity(this)) return this
  if (this.y.signum() === 0) return this.curve.infinity

  var x1 = this.x
  var y1 = this.y

  var y1z1 = y1.multiply(this.z).mod(this.curve.p)
  var y1sqz1 = y1z1.multiply(y1).mod(this.curve.p)
  var a = this.curve.a

  // w = 3 * x1^2 + a * z1^2
  var w = x1.square().multiply(THREE)

  if (a.signum() !== 0) {
    w = w.add(this.z.square().multiply(a))
  }

  w = w.mod(this.curve.p)
  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.p)
  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.pow(3)).mod(this.curve.p)
  // z3 = 8 * (y1 * z1)^3
  var z3 = y1z1.pow(3).shiftLeft(3).mod(this.curve.p)

  return new Point(this.curve, x3, y3, z3)
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
Point.prototype.multiply = function (k) {
  if (this.curve.isInfinity(this)) return this
  if (k.signum() === 0) return this.curve.infinity

  var e = k
  var h = e.multiply(THREE)

  var neg = this.negate()
  var R = this

  for (var i = h.bitLength() - 2; i > 0; --i) {
    var hBit = h.testBit(i)
    var eBit = e.testBit(i)

    R = R.twice()

    if (hBit !== eBit) {
      R = R.add(hBit ? this : neg)
    }
  }

  return R
}

// Compute this*j + x*k (simultaneous multiplication)
Point.prototype.multiplyTwo = function (j, x, k) {
  var i = Math.max(j.bitLength(), k.bitLength()) - 1
  var R = this.curve.infinity
  var both = this.add(x)

  while (i >= 0) {
    var jBit = j.testBit(i)
    var kBit = k.testBit(i)

    R = R.twice()

    if (jBit) {
      if (kBit) {
        R = R.add(both)
      } else {
        R = R.add(this)
      }
    } else if (kBit) {
      R = R.add(x)
    }
    --i
  }

  return R
}

Point.prototype.getEncoded = function (compressed) {
  if (compressed == null) compressed = this.compressed
  if (this.curve.isInfinity(this)) return Buffer.alloc(1, 0) // Infinity point encoded is simply '00'

  var x = this.affineX
  var y = this.affineY
  var byteLength = this.curve.pLength
  var buffer

  // 0x02/0x03 | X
  if (compressed) {
    buffer = Buffer.allocUnsafe(1 + byteLength)
    buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0)

  // 0x04 | X | Y
  } else {
    buffer = Buffer.allocUnsafe(1 + byteLength + byteLength)
    buffer.writeUInt8(0x04, 0)

    y.toBuffer(byteLength).copy(buffer, 1 + byteLength)
  }

  x.toBuffer(byteLength).copy(buffer, 1)

  return buffer
}

Point.decodeFrom = function (curve, buffer) {
  var type = buffer.readUInt8(0)
  var compressed = (type !== 4)

  var byteLength = Math.floor((curve.p.bitLength() + 7) / 8)
  var x = BigInteger.fromBuffer(buffer.slice(1, 1 + byteLength))

  var Q
  if (compressed) {
    assert.equal(buffer.length, byteLength + 1, 'Invalid sequence length')
    assert(type === 0x02 || type === 0x03, 'Invalid sequence tag')

    var isOdd = (type === 0x03)
    Q = curve.pointFromX(isOdd, x)
  } else {
    assert.equal(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length')

    var y = BigInteger.fromBuffer(buffer.slice(1 + byteLength))
    Q = Point.fromAffine(curve, x, y)
  }

  Q.compressed = compressed
  return Q
}

Point.prototype.toString = function () {
  if (this.curve.isInfinity(this)) return '(INFINITY)'

  return '(' + this.affineX.toString() + ',' + this.affineY.toString() + ')'
}

module.exports = Point


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

var assert = __webpack_require__(33)
var BigInteger = __webpack_require__(9)

var Point = __webpack_require__(66)

function Curve (p, a, b, Gx, Gy, n, h) {
  this.p = p
  this.a = a
  this.b = b
  this.G = Point.fromAffine(this, Gx, Gy)
  this.n = n
  this.h = h

  this.infinity = new Point(this, null, null, BigInteger.ZERO)

  // result caching
  this.pOverFour = p.add(BigInteger.ONE).shiftRight(2)

  // determine size of p in bytes
  this.pLength = Math.floor((this.p.bitLength() + 7) / 8)
}

Curve.prototype.pointFromX = function (isOdd, x) {
  var alpha = x.pow(3).add(this.a.multiply(x)).add(this.b).mod(this.p)
  var beta = alpha.modPow(this.pOverFour, this.p) // XXX: not compatible with all curves

  var y = beta
  if (beta.isEven() ^ !isOdd) {
    y = this.p.subtract(y) // -y % p
  }

  return Point.fromAffine(this, x, y)
}

Curve.prototype.isInfinity = function (Q) {
  if (Q === this.infinity) return true

  return Q.z.signum() === 0 && Q.y.signum() !== 0
}

Curve.prototype.isOnCurve = function (Q) {
  if (this.isInfinity(Q)) return true

  var x = Q.affineX
  var y = Q.affineY
  var a = this.a
  var b = this.b
  var p = this.p

  // Check that xQ and yQ are integers in the interval [0, p - 1]
  if (x.signum() < 0 || x.compareTo(p) >= 0) return false
  if (y.signum() < 0 || y.compareTo(p) >= 0) return false

  // and check that y^2 = x^3 + ax + b (mod p)
  var lhs = y.square().mod(p)
  var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p)
  return lhs.equals(rhs)
}

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
Curve.prototype.validate = function (Q) {
  // Check Q != O
  assert(!this.isInfinity(Q), 'Point is at infinity')
  assert(this.isOnCurve(Q), 'Point is not on the curve')

  // Check nQ = O (where Q is a scalar multiple of G)
  var nQ = Q.multiply(this.n)
  assert(this.isInfinity(nQ), 'Point is not a scalar multiple of G')

  return true
}

module.exports = Curve


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var channel = _interopRequireWildcard(__webpack_require__(38));

var _blocks = __webpack_require__(69);

var _dates = __webpack_require__(40);

var _getChainTransactions = __webpack_require__(70);

var _integrateNewTxs = __webpack_require__(134);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

// This is the entry to the worker, doing account discovery + analysis
// increase version for forced redownload of txs
// (on either format change, or on some widespread data corruption)
//
// version 1 added infos about fees and sizes; we cannot calculate that
// version 2 was correction in mytrezor
// v3 added info, whether utxo is my own or not
// so we have to re-download everything -> setting initial state as if nothing is known
// v4 changed timestamp format
// v5 is just to force re-download on forceAdded data corruption
var LATEST_VERSION = 5; // Default starting info being used, when there is null

var defaultInfo = {
  utxos: [],
  transactions: [],
  usedAddresses: [],
  unusedAddresses: [],
  changeIndex: 0,
  balance: 0,
  sentAddresses: {},
  lastBlock: {
    height: 0,
    hash: 'abcd'
  },
  transactionHashes: {},
  changeAddresses: [],
  allowChange: false,
  lastConfirmedChange: -1,
  lastConfirmedMain: -1,
  version: LATEST_VERSION
};
var recvInfo;
var recvNetwork;
var recvXpub;
var recvSegwit;
var recvWebAssembly;
var recvGap;
var recvCashAddress; // what (new Date().getTimezoneOffset()) returns
// note that it is NEGATIVE from the UTC string timezone
// so, UTC+2 timezone returns -120...
// it's javascript, it's insane by default

var recvTimeOffset; // init on worker start

channel.initPromise.then(function (_ref) {
  var accountInfo = _ref.accountInfo,
      network = _ref.network,
      xpub = _ref.xpub,
      segwit = _ref.segwit,
      webassembly = _ref.webassembly,
      cashAddress = _ref.cashAddress,
      gap = _ref.gap,
      timeOffset = _ref.timeOffset;
  recvInfo = accountInfo;
  recvNetwork = network;
  recvSegwit = segwit;
  recvXpub = xpub;
  recvWebAssembly = webassembly;
  recvCashAddress = cashAddress;
  recvGap = gap;
  recvTimeOffset = timeOffset;
});
channel.startDiscoveryPromise.then(function () {
  var initialState = recvInfo == null ? defaultInfo : recvInfo;

  if (initialState.version == null || initialState.version < LATEST_VERSION) {
    initialState = defaultInfo;
  }

  (0, _dates.recomputeDateFormats)(initialState.transactions, recvTimeOffset); // first load blocks, then count last used indexes,
  // then start asking for new transactions,
  // then integrate new transactions into old transactions

  (0, _blocks.loadBlockRange)(initialState).then(function (range) {
    // when starting from 0, take as if there is no info
    var oldState = range.firstHeight === 0 ? defaultInfo : initialState;
    var changeAddresses = oldState.changeAddresses,
        lastConfirmedMain = oldState.lastConfirmedMain,
        lastConfirmedChange = oldState.lastConfirmedChange;
    var unconfirmedTxids = oldState.transactions.filter(function (t) {
      return t.height == null;
    }).map(function (t) {
      return t.hash;
    });
    var mainAddresses = oldState.usedAddresses.map(function (a) {
      return a.address;
    }).concat(oldState.unusedAddresses); // get all the new info, then...

    return discoverAccount(range, [lastConfirmedMain, lastConfirmedChange], oldState.transactions, mainAddresses, changeAddresses).then(function (newInfo) {
      // then find out deleted info
      var deleted = findDeleted(unconfirmedTxids, newInfo); // ... then integrate

      var res = (0, _integrateNewTxs.integrateNewTxs)(newInfo, oldState, range.last, deleted, recvGap, recvTimeOffset);
      return res;
    });
  }).then( // either success or failure
  // (other side will shut down the worker then)
  function (result) {
    return channel.returnSuccess(result);
  }, function (error) {
    return channel.returnError(error);
  });
});

function discoverAccount(range, lastUsedAddresses, transactions, mainAddresses, changeAddresses) {
  function d(i) {
    return new _getChainTransactions.GetChainTransactions(i, range, lastUsedAddresses[i], channel.chunkTransactions, i === 0 ? transactions : [], // used for visual counting
    i === 0 ? mainAddresses : changeAddresses, recvNetwork, recvXpub, recvSegwit, recvWebAssembly, recvCashAddress, recvGap).discover();
  }

  return d(0).then(function (main) {
    return d(1).then(function (change) {
      return {
        main: main,
        change: change
      };
    });
  });
}

function findDeleted(txids, newInfo) {
  return txids.filter(function (id) {
    if (newInfo.main.newTransactions[id] != null) {
      return false;
    }

    if (newInfo.change.newTransactions[id] != null) {
      return false;
    }

    return true;
  });
}

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadBlockRange = loadBlockRange;

var _channel = __webpack_require__(38);

// Some helper functions for loading block status
// from blockchain
// from which to which block do I need to do discovery
// based on whether there was a reorg, detected by last height/hash
function loadBlockRange(initialState) {
  var pBlock = initialState.lastBlock; // first, I ask for last block I will do

  return getCurrentBlock().then(function (last) {
    // then I detect first block I will do
    // detect based on whether reorg is needed
    var firstHeight = pBlock.height !== 0 ? getBlock(pBlock.height).then(function (block) {
      if (block.hash === pBlock.hash) {
        return pBlock.height;
      }

      console.warn('Blockhash mismatch', pBlock, block);
      return 0;
    }, function (err) {
      if (err.message === 'RPCError: Block height out of range') {
        console.warn('Block height out of range', pBlock.height);
        return 0;
      }

      throw err;
    }) : Promise.resolve(0);
    return firstHeight.then(function (h) {
      return {
        firstHeight: h,
        last: last
      };
    });
  });
}

function getBlock(height) {
  return (0, _channel.lookupBlockHash)(height).then(function (hash) {
    return {
      hash: hash,
      height: height
    };
  });
}

function getCurrentBlock() {
  return (0, _channel.lookupSyncStatus)().then(function (height) {
    return getBlock(height);
  });
}

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GetChainTransactions = void 0;

var _bitcoinjsLibZcash = __webpack_require__(15);

var _bchaddrjs = _interopRequireDefault(__webpack_require__(127));

var _deferred = __webpack_require__(18);

var _stream = __webpack_require__(39);

var _addressSource = __webpack_require__(133);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var GetChainTransactions =
/*#__PURE__*/
function () {
  _createClass(GetChainTransactions, [{
    key: "originalLastSearched",
    // all seen addresses, including the gap addresses
    // address -> number map
    // transactions in the range will be saved to this array
    // indexed by hash
    // path of last address that I searched
    // last address that was searched with the previous search
    value: function originalLastSearched() {
      return this.originalLastConfirmed + this.gap;
    } // this is deferred promise for result

  }, {
    key: "nullRange",
    value: function nullRange() {
      return {
        firstHeight: 0,
        last: this.range.last
      };
    }
  }]);

  function GetChainTransactions(id, range, originalLastConfirmed, getStream, originalTransactions, oldAddresses, network, xpub, segwit, webassembly, cashAddress, gap) {
    _classCallCheck(this, GetChainTransactions);

    _defineProperty(this, "allCheckedAddresses", []);

    _defineProperty(this, "backSearch", {});

    _defineProperty(this, "newTransactions", {});

    _defineProperty(this, "lastSearched", -1);

    _defineProperty(this, "dfd", (0, _deferred.deferred)());

    this.gap = gap;
    this.cashAddress = cashAddress;
    this.originalLastConfirmed = originalLastConfirmed;
    this.lastConfirmed = originalLastConfirmed;
    this.chainId = id;
    this.range = range;
    this.getStream = getStream;
    this.txids = deriveTxidSet(originalTransactions);
    this.allAddresses = oldAddresses;
    this.network = network;
    this.xpub = xpub;
    this.segwit = segwit;
    this.webassembly = webassembly;

    if (!this.webassembly) {
      this.source = new _addressSource.BrowserAddressSource(_bitcoinjsLibZcash.HDNode.fromBase58(this.xpub, this.network).derive(this.chainId), this.network, this.segwit);
    }
  }

  _createClass(GetChainTransactions, [{
    key: "discover",
    value: function discover() {
      // first and last range of addresses for the first search
      // (always 0 - 19)
      var first = 0;
      var last = this.gap - 1;
      this.iterate(first, last, this.range);
      return this.dfd.promise;
    } // one "iteration" - meaning, get stream of transactions on one chunk,
    // wait for it to end, and then decide what to do next

  }, {
    key: "iterate",
    value: function iterate(first, last, // last is inclusive
    range) {
      var _this = this;

      var addressesP = Promise.resolve(null);

      if (this.allAddresses.length - 1 >= last) {
        addressesP = Promise.resolve(this.allAddresses.slice(first, last + 1));
      } else if (!this.webassembly) {
        addressesP = this.source.derive(first, last);
      }

      addressesP.then(function (addresses) {
        var stream = _this.getStream(_this.chainId, first, last, range.firstHeight, range.last.height, _this.txids.size, addresses);

        stream.values.attach(function (value_) {
          if (value_ instanceof Error) {
            _this.dfd.reject(value_);

            stream.dispose();
            return;
          }

          var value = value_;

          try {
            _this.handleTransactions(value, first);
          } catch (error) {
            _this.dfd.reject(new Error("Error transaction parsing: ".concat(error.message || error.toString())));

            stream.dispose();
          }
        });
        stream.finish.attach(function () {
          _this.handleFinish(last);
        });
      });
    } // What to do with transactions?

  }, {
    key: "handleTransactions",
    value: function handleTransactions(value, first) {
      var _this2 = this;

      // save the addresses
      value.addresses.forEach(function (address, i) {
        _this2.allAddresses[i + first] = address;
        _this2.allCheckedAddresses[i + first] = address;
        _this2.backSearch[address] = i + first;
      });
      value.transactions.forEach(function (transaction) {
        // parse txs (error in here is handled in iterate)
        var parsed;

        try {
          parsed = _bitcoinjsLibZcash.Transaction.fromHex(transaction.hex, transaction.network);
        } catch (error) {
          // create invalid transaction with zero-valued outputs
          parsed = new _bitcoinjsLibZcash.Transaction();
          parsed.invalidTransaction = true;
          parsed.timestamp = Number(transaction.timestamp);

          if (transaction.rawTx) {
            parsed.outs = transaction.rawTx.outputs.map(function (out) {
              return {
                script: Buffer.from(out.script, 'hex'),
                value: 0
              };
            });
          }
        }

        var outputAddresses = [];
        parsed.outs.forEach(function (output) {
          var address; // try-catch, because some outputs don't have addresses

          try {
            address = _bitcoinjsLibZcash.address.fromOutputScript(output.script, _this2.network);

            if (_this2.cashAddress) {
              address = _bchaddrjs.default.toCashAddress(address);
            } // if mine...


            if (_this2.backSearch[address] != null) {
              // check if confirmed
              if (transaction.height != null) {
                var _addressI = _this2.backSearch[address]; // if it's mine and confirmed, bump lastConfirmed

                if (_addressI > _this2.lastConfirmed) {
                  _this2.lastConfirmed = _addressI;
                }
              }
            }
          } catch (e) {
            // TODO add to flowdef
            // $FlowIssue
            var type = _bitcoinjsLibZcash.script.classifyOutput(output.script);

            if (type === 'nulldata') {
              // TODO add to flowdef
              // $FlowIssue
              var buffer = _bitcoinjsLibZcash.script.nullData.output.decode(output.script);

              var text = '';

              if (buffer !== 0) {
                if (buffer.every(function (i) {
                  return i >= 32 && i <= 126;
                })) {
                  var ascii = buffer.toString('ascii');
                  text = ascii.slice(0, 40);
                } else {
                  var hex = "0x".concat(buffer.toString('hex'));
                  text = hex.slice(0, 40);
                }
              }

              address = "OP_RETURN (".concat(text, ")");
            } else {
              address = 'UNKNOWN';
            }
          }

          outputAddresses.push(address);
        });
        var c = {
          tx: parsed,
          outputAddresses: outputAddresses,
          height: transaction.height,
          timestamp: transaction.timestamp,
          hash: transaction.hash,
          vsize: transaction.vsize,
          inputAddresses: transaction.inputAddresses
        }; // more transactions with the same ID overwrite each other

        _this2.newTransactions[c.hash] = c;

        _this2.txids.add(c.hash);
      });
    } // when stream finishes, we have to decide if we want try more addresses or not

  }, {
    key: "handleFinish",
    value: function handleFinish(last) {
      this.lastSearched = last; // look at which is the next thing we want

      var shouldSearchLast = this.lastConfirmed + this.gap;
      var nextChunkEnd = this.lastSearched + this.gap;
      var nextLast = shouldSearchLast < nextChunkEnd ? shouldSearchLast : nextChunkEnd;
      var nextFirst = this.lastSearched + 1; // Is there something to search?

      if (nextLast >= nextFirst) {
        // on completely new addresses, we look from block 0
        // so we don't miss transactions
        // are there some new addresses?
        if (nextLast > this.originalLastSearched()) {
          // new addresses, all blocks
          this.iterate(nextFirst, nextLast, this.nullRange());
        } else {
          // old addresses, just new blocks
          this.iterate(nextFirst, nextLast, this.range);
        }
      } else {
        // nothing more to look for, return
        this.dfd.resolve({
          newTransactions: this.newTransactions,
          allAddresses: this.allAddresses
        });
      }
    }
  }]);

  return GetChainTransactions;
}();

exports.GetChainTransactions = GetChainTransactions;

function deriveTxidSet(transactions) {
  var res = new Set();
  transactions.forEach(function (t) {
    res.add(t.hash);
  });
  return res;
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),
/* 72 */
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var NATIVE = __webpack_require__(19)
var ERRORS = __webpack_require__(44)

function _Buffer (value) {
  return Buffer.isBuffer(value)
}

function Hex (value) {
  return typeof value === 'string' && /^([0-9a-f]{2})+$/i.test(value)
}

function _LengthN (type, length) {
  var name = type.toJSON()

  function Length (value) {
    if (!type(value)) return false
    if (value.length === length) return true

    throw ERRORS.tfCustomError(name + '(Length: ' + length + ')', name + '(Length: ' + value.length + ')')
  }
  Length.toJSON = function () { return name }

  return Length
}

var _ArrayN = _LengthN.bind(null, NATIVE.Array)
var _BufferN = _LengthN.bind(null, _Buffer)
var _HexN = _LengthN.bind(null, Hex)

var UINT53_MAX = Math.pow(2, 53) - 1

function Finite (value) {
  return typeof value === 'number' && isFinite(value)
}
function Int8 (value) { return ((value << 24) >> 24) === value }
function Int16 (value) { return ((value << 16) >> 16) === value }
function Int32 (value) { return (value | 0) === value }
function UInt8 (value) { return (value & 0xff) === value }
function UInt16 (value) { return (value & 0xffff) === value }
function UInt32 (value) { return (value >>> 0) === value }
function UInt53 (value) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= UINT53_MAX &&
    Math.floor(value) === value
}

var types = {
  ArrayN: _ArrayN,
  Buffer: _Buffer,
  BufferN: _BufferN,
  Finite: Finite,
  Hex: Hex,
  HexN: _HexN,
  Int8: Int8,
  Int16: Int16,
  Int32: Int32,
  UInt8: UInt8,
  UInt16: UInt16,
  UInt32: UInt32,
  UInt53: UInt53
}

for (var typeName in types) {
  types[typeName].toJSON = function (t) {
    return t
  }.bind(null, typeName)
}

module.exports = types

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

var OPS = __webpack_require__(5)

var map = {}
for (var op in OPS) {
  var code = OPS[op]
  map[code] = op
}

module.exports = map


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

// OP_0 [signatures ...]

var Buffer = __webpack_require__(0).Buffer
var bscript = __webpack_require__(3)
var p2mso = __webpack_require__(46)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function partialSignature (value) {
  return value === OPS.OP_0 || bscript.isCanonicalSignature(value)
}

function check (script, allowIncomplete) {
  var chunks = bscript.decompile(script)
  if (chunks.length < 2) return false
  if (chunks[0] !== OPS.OP_0) return false

  if (allowIncomplete) {
    return chunks.slice(1).every(partialSignature)
  }

  return chunks.slice(1).every(bscript.isCanonicalSignature)
}
check.toJSON = function () { return 'multisig input' }

var EMPTY_BUFFER = Buffer.allocUnsafe(0)

function encodeStack (signatures, scriptPubKey) {
  typeforce([partialSignature], signatures)

  if (scriptPubKey) {
    var scriptData = p2mso.decode(scriptPubKey)

    if (signatures.length < scriptData.m) {
      throw new TypeError('Not enough signatures provided')
    }

    if (signatures.length > scriptData.pubKeys.length) {
      throw new TypeError('Too many signatures provided')
    }
  }

  return [].concat(EMPTY_BUFFER, signatures.map(function (sig) {
    if (sig === OPS.OP_0) {
      return EMPTY_BUFFER
    }
    return sig
  }))
}

function encode (signatures, scriptPubKey) {
  return bscript.compile(encodeStack(signatures, scriptPubKey))
}

function decodeStack (stack, allowIncomplete) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack, allowIncomplete)
  return stack.slice(1)
}

function decode (buffer, allowIncomplete) {
  var stack = bscript.decompile(buffer)
  return decodeStack(stack, allowIncomplete)
}

module.exports = {
  check: check,
  decode: decode,
  decodeStack: decodeStack,
  encode: encode,
  encodeStack: encodeStack
}


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

// OP_RETURN {data}

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  return script.length === 2 &&
     script[0] === OPS.OP_RETURN
}
check.toJSON = function () { return 'null data output' }

function encode (data) {
  typeforce(types.Buffer, data)

  return bscript.compile([OPS.OP_RETURN, data])
}

function decode (buffer) {
  var script = bscript.decompile(buffer)
  typeforce(check, script)

  return script[1]
}

module.exports = {
  output: {
    check: check,
    decode: decode,
    encode: encode
  }
}


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

// {signature}

var bscript = __webpack_require__(3)
var typeforce = __webpack_require__(1)

function check (script) {
  var chunks = bscript.decompile(script)

  return chunks.length === 1 &&
    bscript.isCanonicalSignature(chunks[0])
}
check.toJSON = function () { return 'pubKey input' }

function encodeStack (signature) {
  typeforce(bscript.isCanonicalSignature, signature)
  return [signature]
}

function encode (signature) {
  return bscript.compile(encodeStack(signature))
}

function decodeStack (stack) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack)
  return stack[0]
}

function decode (buffer) {
  var stack = bscript.decompile(buffer)
  return decodeStack(stack)
}

module.exports = {
  check: check,
  decode: decode,
  decodeStack: decodeStack,
  encode: encode,
  encodeStack: encodeStack
}


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

// {pubKey} OP_CHECKSIG

var bscript = __webpack_require__(3)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  var chunks = bscript.decompile(script)

  return chunks.length === 2 &&
    bscript.isCanonicalPubKey(chunks[0]) &&
    chunks[1] === OPS.OP_CHECKSIG
}
check.toJSON = function () { return 'pubKey output' }

function encode (pubKey) {
  typeforce(bscript.isCanonicalPubKey, pubKey)

  return bscript.compile([pubKey, OPS.OP_CHECKSIG])
}

function decode (buffer) {
  var chunks = bscript.decompile(buffer)
  typeforce(check, chunks)

  return chunks[0]
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

// {signature} {pubKey}

var bscript = __webpack_require__(3)
var typeforce = __webpack_require__(1)

function check (script) {
  var chunks = bscript.decompile(script)

  return chunks.length === 2 &&
    bscript.isCanonicalSignature(chunks[0]) &&
    bscript.isCanonicalPubKey(chunks[1])
}
check.toJSON = function () { return 'pubKeyHash input' }

function encodeStack (signature, pubKey) {
  typeforce({
    signature: bscript.isCanonicalSignature,
    pubKey: bscript.isCanonicalPubKey
  }, {
    signature: signature,
    pubKey: pubKey
  })

  return [signature, pubKey]
}

function encode (signature, pubKey) {
  return bscript.compile(encodeStack(signature, pubKey))
}

function decodeStack (stack) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack)

  return {
    signature: stack[0],
    pubKey: stack[1]
  }
}

function decode (buffer) {
  var stack = bscript.decompile(buffer)
  return decodeStack(stack)
}

module.exports = {
  check: check,
  decode: decode,
  decodeStack: decodeStack,
  encode: encode,
  encodeStack: encodeStack
}


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

// OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  var buffer = bscript.compile(script)

  return buffer.length === 25 &&
    buffer[0] === OPS.OP_DUP &&
    buffer[1] === OPS.OP_HASH160 &&
    buffer[2] === 0x14 &&
    buffer[23] === OPS.OP_EQUALVERIFY &&
    buffer[24] === OPS.OP_CHECKSIG
}
check.toJSON = function () { return 'pubKeyHash output' }

function encode (pubKeyHash) {
  typeforce(types.Hash160bit, pubKeyHash)

  return bscript.compile([
    OPS.OP_DUP,
    OPS.OP_HASH160,
    pubKeyHash,
    OPS.OP_EQUALVERIFY,
    OPS.OP_CHECKSIG
  ])
}

function decode (buffer) {
  typeforce(check, buffer)

  return buffer.slice(3, 23)
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(82),
  output: __webpack_require__(83)
}


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

// <scriptSig> {serialized scriptPubKey script}

var Buffer = __webpack_require__(0).Buffer
var bscript = __webpack_require__(3)
var typeforce = __webpack_require__(1)

var p2ms = __webpack_require__(21)
var p2pk = __webpack_require__(22)
var p2pkh = __webpack_require__(23)
var p2wpkho = __webpack_require__(47)
var p2wsho = __webpack_require__(48)

function check (script, allowIncomplete) {
  var chunks = bscript.decompile(script)
  if (chunks.length < 1) return false

  var lastChunk = chunks[chunks.length - 1]
  if (!Buffer.isBuffer(lastChunk)) return false

  var scriptSigChunks = bscript.decompile(bscript.compile(chunks.slice(0, -1)))
  var redeemScriptChunks = bscript.decompile(lastChunk)

  // is redeemScript a valid script?
  if (redeemScriptChunks.length === 0) return false

  // is redeemScriptSig push only?
  if (!bscript.isPushOnly(scriptSigChunks)) return false

  // is witness?
  if (chunks.length === 1) {
    return p2wsho.check(redeemScriptChunks) ||
      p2wpkho.check(redeemScriptChunks)
  }

  // match types
  if (p2pkh.input.check(scriptSigChunks) &&
    p2pkh.output.check(redeemScriptChunks)) return true

  if (p2ms.input.check(scriptSigChunks, allowIncomplete) &&
    p2ms.output.check(redeemScriptChunks)) return true

  if (p2pk.input.check(scriptSigChunks) &&
    p2pk.output.check(redeemScriptChunks)) return true

  return false
}
check.toJSON = function () { return 'scriptHash input' }

function encodeStack (redeemScriptStack, redeemScript) {
  var serializedScriptPubKey = bscript.compile(redeemScript)

  return [].concat(redeemScriptStack, serializedScriptPubKey)
}

function encode (redeemScriptSig, redeemScript) {
  var redeemScriptStack = bscript.decompile(redeemScriptSig)

  return bscript.compile(encodeStack(redeemScriptStack, redeemScript))
}

function decodeStack (stack) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack)

  return {
    redeemScriptStack: stack.slice(0, -1),
    redeemScript: stack[stack.length - 1]
  }
}

function decode (buffer) {
  var stack = bscript.decompile(buffer)
  var result = decodeStack(stack)
  result.redeemScriptSig = bscript.compile(result.redeemScriptStack)
  delete result.redeemScriptStack
  return result
}

module.exports = {
  check: check,
  decode: decode,
  decodeStack: decodeStack,
  encode: encode,
  encodeStack: encodeStack
}


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

// OP_HASH160 {scriptHash} OP_EQUAL

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

function check (script) {
  var buffer = bscript.compile(script)

  return buffer.length === 23 &&
    buffer[0] === OPS.OP_HASH160 &&
    buffer[1] === 0x14 &&
    buffer[22] === OPS.OP_EQUAL
}
check.toJSON = function () { return 'scriptHash output' }

function encode (scriptHash) {
  typeforce(types.Hash160bit, scriptHash)

  return bscript.compile([OPS.OP_HASH160, scriptHash, OPS.OP_EQUAL])
}

function decode (buffer) {
  typeforce(check, buffer)

  return buffer.slice(2, 22)
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(85),
  output: __webpack_require__(47)
}


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

// {signature} {pubKey}

var bscript = __webpack_require__(3)
var typeforce = __webpack_require__(1)

function isCompressedCanonicalPubKey (pubKey) {
  return bscript.isCanonicalPubKey(pubKey) && pubKey.length === 33
}

function check (script) {
  var chunks = bscript.decompile(script)

  return chunks.length === 2 &&
    bscript.isCanonicalSignature(chunks[0]) &&
    isCompressedCanonicalPubKey(chunks[1])
}
check.toJSON = function () { return 'witnessPubKeyHash input' }

function encodeStack (signature, pubKey) {
  typeforce({
    signature: bscript.isCanonicalSignature,
    pubKey: isCompressedCanonicalPubKey
  }, {
    signature: signature,
    pubKey: pubKey
  })

  return [signature, pubKey]
}

function decodeStack (stack) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack)

  return {
    signature: stack[0],
    pubKey: stack[1]
  }
}

module.exports = {
  check: check,
  decodeStack: decodeStack,
  encodeStack: encodeStack
}


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  input: __webpack_require__(87),
  output: __webpack_require__(48)
}


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// <scriptSig> {serialized scriptPubKey script}

var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)

var p2ms = __webpack_require__(21)
var p2pk = __webpack_require__(22)
var p2pkh = __webpack_require__(23)

function check (chunks, allowIncomplete) {
  typeforce(types.Array, chunks)
  if (chunks.length < 1) return false

  var witnessScript = chunks[chunks.length - 1]
  if (!Buffer.isBuffer(witnessScript)) return false

  var witnessScriptChunks = bscript.decompile(witnessScript)

  // is witnessScript a valid script?
  if (witnessScriptChunks.length === 0) return false

  var witnessRawScriptSig = bscript.compile(chunks.slice(0, -1))

  // match types
  if (p2pkh.input.check(witnessRawScriptSig) &&
    p2pkh.output.check(witnessScriptChunks)) return true

  if (p2ms.input.check(witnessRawScriptSig, allowIncomplete) &&
    p2ms.output.check(witnessScriptChunks)) return true

  if (p2pk.input.check(witnessRawScriptSig) &&
    p2pk.output.check(witnessScriptChunks)) return true

  return false
}
check.toJSON = function () { return 'witnessScriptHash input' }

function encodeStack (witnessData, witnessScript) {
  typeforce({
    witnessData: [types.Buffer],
    witnessScript: types.Buffer
  }, {
    witnessData: witnessData,
    witnessScript: witnessScript
  })

  return [].concat(witnessData, witnessScript)
}

function decodeStack (stack) {
  typeforce(typeforce.Array, stack)
  typeforce(check, stack)
  return {
    witnessData: stack.slice(0, -1),
    witnessScript: stack[stack.length - 1]
  }
}

module.exports = {
  check: check,
  decodeStack: decodeStack,
  encodeStack: encodeStack
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  output: __webpack_require__(89)
}


/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

// OP_RETURN {aa21a9ed} {commitment}

var Buffer = __webpack_require__(0).Buffer
var bscript = __webpack_require__(3)
var types = __webpack_require__(4)
var typeforce = __webpack_require__(1)
var OPS = __webpack_require__(5)

var HEADER = Buffer.from('aa21a9ed', 'hex')

function check (script) {
  var buffer = bscript.compile(script)

  return buffer.length > 37 &&
    buffer[0] === OPS.OP_RETURN &&
    buffer[1] === 0x24 &&
    buffer.slice(2, 6).equals(HEADER)
}

check.toJSON = function () { return 'Witness commitment output' }

function encode (commitment) {
  typeforce(types.Hash256bit, commitment)

  var buffer = Buffer.allocUnsafe(36)
  HEADER.copy(buffer, 0)
  commitment.copy(buffer, 4)

  return bscript.compile([OPS.OP_RETURN, buffer])
}

function decode (buffer) {
  typeforce(check, buffer)

  return bscript.decompile(buffer)[1].slice(4, 36)
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var bcrypto = __webpack_require__(10)
var fastMerkleRoot = __webpack_require__(106)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var varuint = __webpack_require__(24)

var Transaction = __webpack_require__(30)

function Block () {
  this.version = 1
  this.prevHash = null
  this.merkleRoot = null
  this.timestamp = 0
  this.bits = 0
  this.nonce = 0
}

Block.fromBuffer = function (buffer) {
  if (buffer.length < 80) throw new Error('Buffer too small (< 80 bytes)')

  var offset = 0
  function readSlice (n) {
    offset += n
    return buffer.slice(offset - n, offset)
  }

  function readUInt32 () {
    var i = buffer.readUInt32LE(offset)
    offset += 4
    return i
  }

  function readInt32 () {
    var i = buffer.readInt32LE(offset)
    offset += 4
    return i
  }

  var block = new Block()
  block.version = readInt32()
  block.prevHash = readSlice(32)
  block.merkleRoot = readSlice(32)
  block.timestamp = readUInt32()
  block.bits = readUInt32()
  block.nonce = readUInt32()

  if (buffer.length === 80) return block

  function readVarInt () {
    var vi = varuint.decode(buffer, offset)
    offset += varuint.decode.bytes
    return vi
  }

  function readTransaction () {
    var tx = Transaction.fromBuffer(buffer.slice(offset), false, true)
    offset += tx.byteLength()
    return tx
  }

  var nTransactions = readVarInt()
  block.transactions = []

  for (var i = 0; i < nTransactions; ++i) {
    var tx = readTransaction()
    block.transactions.push(tx)
  }

  return block
}

Block.prototype.byteLength = function (headersOnly) {
  if (headersOnly || !this.transactions) return 80

  return 80 + varuint.encodingLength(this.transactions.length) + this.transactions.reduce(function (a, x) {
    return a + x.byteLength()
  }, 0)
}

Block.fromHex = function (hex) {
  return Block.fromBuffer(Buffer.from(hex, 'hex'))
}

Block.prototype.getHash = function () {
  return bcrypto.hash256(this.toBuffer(true))
}

Block.prototype.getId = function () {
  return this.getHash().reverse().toString('hex')
}

Block.prototype.getUTCDate = function () {
  var date = new Date(0) // epoch
  date.setUTCSeconds(this.timestamp)

  return date
}

// TODO: buffer, offset compatibility
Block.prototype.toBuffer = function (headersOnly) {
  var buffer = Buffer.allocUnsafe(this.byteLength(headersOnly))

  var offset = 0
  function writeSlice (slice) {
    slice.copy(buffer, offset)
    offset += slice.length
  }

  function writeInt32 (i) {
    buffer.writeInt32LE(i, offset)
    offset += 4
  }
  function writeUInt32 (i) {
    buffer.writeUInt32LE(i, offset)
    offset += 4
  }

  writeInt32(this.version)
  writeSlice(this.prevHash)
  writeSlice(this.merkleRoot)
  writeUInt32(this.timestamp)
  writeUInt32(this.bits)
  writeUInt32(this.nonce)

  if (headersOnly || !this.transactions) return buffer

  varuint.encode(this.transactions.length, buffer, offset)
  offset += varuint.encode.bytes

  this.transactions.forEach(function (tx) {
    var txSize = tx.byteLength() // TODO: extract from toBuffer?
    tx.toBuffer(buffer, offset)
    offset += txSize
  })

  return buffer
}

Block.prototype.toHex = function (headersOnly) {
  return this.toBuffer(headersOnly).toString('hex')
}

Block.calculateTarget = function (bits) {
  var exponent = ((bits & 0xff000000) >> 24) - 3
  var mantissa = bits & 0x007fffff
  var target = Buffer.alloc(32, 0)
  target.writeUInt32BE(mantissa, 28 - exponent)
  return target
}

Block.calculateMerkleRoot = function (transactions) {
  typeforce([{ getHash: types.Function }], transactions)
  if (transactions.length === 0) throw TypeError('Cannot compute merkle root for zero transactions')

  var hashes = transactions.map(function (transaction) {
    return transaction.getHash()
  })

  return fastMerkleRoot(hashes, bcrypto.hash256)
}

Block.prototype.checkMerkleRoot = function () {
  if (!this.transactions) return false

  var actualMerkleRoot = Block.calculateMerkleRoot(this.transactions)
  return this.merkleRoot.compare(actualMerkleRoot) === 0
}

Block.prototype.checkProofOfWork = function () {
  var hash = this.getHash().reverse()
  var target = Block.calculateTarget(this.bits)

  return hash.compare(target) <= 0
}

module.exports = Block


/***/ }),
/* 91 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = __webpack_require__(0).Buffer;
var util = __webpack_require__(93);

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}

/***/ }),
/* 93 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var scope = (typeof global !== "undefined" && global) ||
            (typeof self !== "undefined" && self) ||
            window;
var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(scope, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(95);
// On some exotic environments, it's not clear which object `setimmediate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
                       (typeof global !== "undefined" && global.setImmediate) ||
                       (this && this.setImmediate);
exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
                         (typeof global !== "undefined" && global.clearImmediate) ||
                         (this && this.clearImmediate);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7)))

/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7), __webpack_require__(11)))

/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7)))

/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;

var Transform = __webpack_require__(57);

/*<replacement>*/
var util = __webpack_require__(14);
util.inherits = __webpack_require__(2);
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(27);


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(8);


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(26).Transform


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(26).PassThrough


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = __webpack_require__(2)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = __webpack_require__(2)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = __webpack_require__(2)
var Sha256 = __webpack_require__(60)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = Buffer.allocUnsafe(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

var inherits = __webpack_require__(2)
var SHA512 = __webpack_require__(61)
var Hash = __webpack_require__(12)
var Buffer = __webpack_require__(0).Buffer

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = Buffer.allocUnsafe(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// constant-space merkle root calculation algorithm
module.exports = function fastRoot (values, digestFn) {
  if (!Array.isArray(values)) throw TypeError('Expected values Array')
  if (typeof digestFn !== 'function') throw TypeError('Expected digest Function')

  var length = values.length
  var results = values.concat()

  while (length > 1) {
    var j = 0

    for (var i = 0; i < length; i += 2, ++j) {
      var left = results[i]
      var right = i + 1 === length ? left : results[i + 1]
      var data = Buffer.concat([left, right])

      results[j] = digestFn(data)
    }

    length = j
  }

  return results[0]
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

var assert = __webpack_require__(62)
var b2wasm = __webpack_require__(108)

// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
function ADD64AA (v, a, b) {
  var o0 = v[a] + v[b]
  var o1 = v[a + 1] + v[b + 1]
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC (v, a, b0, b1) {
  var o0 = v[a] + b0
  if (b0 < 0) {
    o0 += 0x100000000
  }
  var o1 = v[a + 1] + b1
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// Little-endian byte access
function B2B_GET32 (arr, i) {
  return (arr[i] ^
  (arr[i + 1] << 8) ^
  (arr[i + 2] << 16) ^
  (arr[i + 3] << 24))
}

// G Mixing function
// The ROTRs are inlined for speed
function B2B_G (a, b, c, d, ix, iy) {
  var x0 = m[ix]
  var x1 = m[ix + 1]
  var y0 = m[iy]
  var y1 = m[iy + 1]

  ADD64AA(v, a, b) // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  ADD64AC(v, a, x0, x1) // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  var xor0 = v[d] ^ v[a]
  var xor1 = v[d + 1] ^ v[a + 1]
  v[d] = xor1
  v[d + 1] = xor0

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor0 >>> 24) ^ (xor1 << 8)
  v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8)

  ADD64AA(v, a, b)
  ADD64AC(v, a, y0, y1)

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = v[d] ^ v[a]
  xor1 = v[d + 1] ^ v[a + 1]
  v[d] = (xor0 >>> 16) ^ (xor1 << 16)
  v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16)

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor1 >>> 31) ^ (xor0 << 1)
  v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1)
}

// Initialization Vector
var BLAKE2B_IV32 = new Uint32Array([
  0xF3BCC908, 0x6A09E667, 0x84CAA73B, 0xBB67AE85,
  0xFE94F82B, 0x3C6EF372, 0x5F1D36F1, 0xA54FF53A,
  0xADE682D1, 0x510E527F, 0x2B3E6C1F, 0x9B05688C,
  0xFB41BD6B, 0x1F83D9AB, 0x137E2179, 0x5BE0CD19
])

var SIGMA8 = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
  7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
  9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
  2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
  12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
  13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
  6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
  10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3
]

// These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s
var SIGMA82 = new Uint8Array(SIGMA8.map(function (x) { return x * 2 }))

// Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s
var v = new Uint32Array(32)
var m = new Uint32Array(32)
function blake2bCompress (ctx, last) {
  var i = 0

  // init work variables
  for (i = 0; i < 16; i++) {
    v[i] = ctx.h[i]
    v[i + 16] = BLAKE2B_IV32[i]
  }

  // low 64 bits of offset
  v[24] = v[24] ^ ctx.t
  v[25] = v[25] ^ (ctx.t / 0x100000000)
  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    v[28] = ~v[28]
    v[29] = ~v[29]
  }

  // get little-endian words
  for (i = 0; i < 32; i++) {
    m[i] = B2B_GET32(ctx.b, 4 * i)
  }

  // twelve rounds of mixing
  for (i = 0; i < 12; i++) {
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1])
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3])
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5])
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7])
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9])
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11])
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13])
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15])
  }

  for (i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16]
  }
}

// reusable parameter_block
var parameter_block = new Uint8Array([
  0, 0, 0, 0,      //  0: outlen, keylen, fanout, depth
  0, 0, 0, 0,      //  4: leaf length, sequential mode
  0, 0, 0, 0,      //  8: node offset
  0, 0, 0, 0,      // 12: node offset
  0, 0, 0, 0,      // 16: node depth, inner length, rfu
  0, 0, 0, 0,      // 20: rfu
  0, 0, 0, 0,      // 24: rfu
  0, 0, 0, 0,      // 28: rfu
  0, 0, 0, 0,      // 32: salt
  0, 0, 0, 0,      // 36: salt
  0, 0, 0, 0,      // 40: salt
  0, 0, 0, 0,      // 44: salt
  0, 0, 0, 0,      // 48: personal
  0, 0, 0, 0,      // 52: personal
  0, 0, 0, 0,      // 56: personal
  0, 0, 0, 0       // 60: personal
])

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
function Blake2b (outlen, key, salt, personal) {
  // zero out parameter_block before usage
  parameter_block.fill(0)
  // state, 'param block'

  this.b = new Uint8Array(128)
  this.h = new Uint32Array(16)
  this.t = 0 // input count
  this.c = 0 // pointer within buffer
  this.outlen = outlen // output length in bytes

  parameter_block[0] = outlen
  if (key) parameter_block[1] = key.length
  parameter_block[2] = 1 // fanout
  parameter_block[3] = 1 // depth

  if (salt) parameter_block.set(salt, 32)
  if (personal) parameter_block.set(personal, 48)

  // initialize hash state
  for (var i = 0; i < 16; i++) {
    this.h[i] = BLAKE2B_IV32[i] ^ B2B_GET32(parameter_block, i * 4)
  }

  // key the hash, if applicable
  if (key) {
    blake2bUpdate(this, key)
    // at the end
    this.c = 128
  }
}

Blake2b.prototype.update = function (input) {
  assert(input != null, 'input must be Uint8Array or Buffer')
  blake2bUpdate(this, input)
  return this
}

Blake2b.prototype.digest = function (out) {
  var buf = (!out || out === 'binary' || out === 'hex') ? new Uint8Array(this.outlen) : out
  assert(buf.length >= this.outlen, 'out must have at least outlen bytes of space')
  blake2bFinal(this, buf)
  if (out === 'hex') return hexSlice(buf)
  return buf
}

Blake2b.prototype.final = Blake2b.prototype.digest

Blake2b.ready = function (cb) {
  b2wasm.ready(function () {
    cb() // ignore the error
  })
}

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2bUpdate (ctx, input) {
  for (var i = 0; i < input.length; i++) {
    if (ctx.c === 128) { // buffer full ?
      ctx.t += ctx.c // add counters
      blake2bCompress(ctx, false) // compress (not last)
      ctx.c = 0 // counter to zero
    }
    ctx.b[ctx.c++] = input[i]
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal (ctx, out) {
  ctx.t += ctx.c // mark last block offset

  while (ctx.c < 128) { // fill up with zeros
    ctx.b[ctx.c++] = 0
  }
  blake2bCompress(ctx, true) // final block flag = 1

  for (var i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> (8 * (i & 3))
  }
  return out
}

function hexSlice (buf) {
  var str = ''
  for (var i = 0; i < buf.length; i++) str += toHex(buf[i])
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

var Proto = Blake2b

module.exports = function createHash (outlen, key, salt, personal, noAssert) {
  if (noAssert !== true) {
    assert(outlen >= BYTES_MIN, 'outlen must be at least ' + BYTES_MIN + ', was given ' + outlen)
    assert(outlen <= BYTES_MAX, 'outlen must be at most ' + BYTES_MAX + ', was given ' + outlen)
    if (key != null) assert(key.length >= KEYBYTES_MIN, 'key must be at least ' + KEYBYTES_MIN + ', was given ' + key.length)
    if (key != null) assert(key.length <= KEYBYTES_MAX, 'key must be at most ' + KEYBYTES_MAX + ', was given ' + key.length)
    if (salt != null) assert(salt.length === SALTBYTES, 'salt must be exactly ' + SALTBYTES + ', was given ' + salt.length)
    if (personal != null) assert(personal.length === PERSONALBYTES, 'personal must be exactly ' + PERSONALBYTES + ', was given ' + personal.length)
  }

  return new Proto(outlen, key, salt, personal)
}

module.exports.ready = function (cb) {
  b2wasm.ready(function () { // ignore errors
    cb()
  })
}

module.exports.WASM_SUPPORTED = b2wasm.SUPPORTED
module.exports.WASM_LOADED = false

var BYTES_MIN = module.exports.BYTES_MIN = 16
var BYTES_MAX = module.exports.BYTES_MAX = 64
var BYTES = module.exports.BYTES = 32
var KEYBYTES_MIN = module.exports.KEYBYTES_MIN = 16
var KEYBYTES_MAX = module.exports.KEYBYTES_MAX = 64
var KEYBYTES = module.exports.KEYBYTES = 32
var SALTBYTES = module.exports.SALTBYTES = 16
var PERSONALBYTES = module.exports.PERSONALBYTES = 16

b2wasm.ready(function (err) {
  if (!err) {
    module.exports.WASM_LOADED = true
    Proto = b2wasm
  }
})


/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

var assert = __webpack_require__(62)
var wasm = __webpack_require__(109)()

var head = 64
var freeList = []

module.exports = Blake2b
var BYTES_MIN = module.exports.BYTES_MIN = 16
var BYTES_MAX = module.exports.BYTES_MAX = 64
var BYTES = module.exports.BYTES = 32
var KEYBYTES_MIN = module.exports.KEYBYTES_MIN = 16
var KEYBYTES_MAX = module.exports.KEYBYTES_MAX = 64
var KEYBYTES = module.exports.KEYBYTES = 32
var SALTBYTES = module.exports.SALTBYTES = 16
var PERSONALBYTES = module.exports.PERSONALBYTES = 16

function Blake2b (digestLength, key, salt, personal, noAssert) {
  if (!(this instanceof Blake2b)) return new Blake2b(digestLength, key, salt, personal, noAssert)
  if (!(wasm && wasm.exports)) throw new Error('WASM not loaded. Wait for Blake2b.ready(cb)')
  if (!digestLength) digestLength = 32

  if (noAssert !== true) {
    assert(digestLength >= BYTES_MIN, 'digestLength must be at least ' + BYTES_MIN + ', was given ' + digestLength)
    assert(digestLength <= BYTES_MAX, 'digestLength must be at most ' + BYTES_MAX + ', was given ' + digestLength)
    if (key != null) assert(key.length >= KEYBYTES_MIN, 'key must be at least ' + KEYBYTES_MIN + ', was given ' + key.length)
    if (key != null) assert(key.length <= KEYBYTES_MAX, 'key must be at least ' + KEYBYTES_MAX + ', was given ' + key.length)
    if (salt != null) assert(salt.length === SALTBYTES, 'salt must be exactly ' + SALTBYTES + ', was given ' + salt.length)
    if (personal != null) assert(personal.length === PERSONALBYTES, 'personal must be exactly ' + PERSONALBYTES + ', was given ' + personal.length)
  }

  if (!freeList.length) {
    freeList.push(head)
    head += 216
  }

  this.digestLength = digestLength
  this.finalized = false
  this.pointer = freeList.pop()

  wasm.memory.fill(0, 0, 64)
  wasm.memory[0] = this.digestLength
  wasm.memory[1] = key ? key.length : 0
  wasm.memory[2] = 1 // fanout
  wasm.memory[3] = 1 // depth

  if (salt) wasm.memory.set(salt, 32)
  if (personal) wasm.memory.set(personal, 48)

  if (this.pointer + 216 > wasm.memory.length) wasm.realloc(this.pointer + 216) // we need 216 bytes for the state
  wasm.exports.blake2b_init(this.pointer, this.digestLength)

  if (key) {
    this.update(key)
    wasm.memory.fill(0, head, head + key.length) // whiteout key
    wasm.memory[this.pointer + 200] = 128
  }
}


Blake2b.prototype.update = function (input) {
  assert(this.finalized === false, 'Hash instance finalized')
  assert(input, 'input must be TypedArray or Buffer')

  if (head + input.length > wasm.memory.length) wasm.realloc(head + input.length)
  wasm.memory.set(input, head)
  wasm.exports.blake2b_update(this.pointer, head, head + input.length)
  return this
}

Blake2b.prototype.digest = function (enc) {
  assert(this.finalized === false, 'Hash instance finalized')
  this.finalized = true

  freeList.push(this.pointer)
  wasm.exports.blake2b_final(this.pointer)

  if (!enc || enc === 'binary') {
    return wasm.memory.slice(this.pointer + 128, this.pointer + 128 + this.digestLength)
  }

  if (enc === 'hex') {
    return hexSlice(wasm.memory, this.pointer + 128, this.digestLength)
  }

  assert(enc.length >= this.digestLength, 'input must be TypedArray or Buffer')
  for (var i = 0; i < this.digestLength; i++) {
    enc[i] = wasm.memory[this.pointer + 128 + i]
  }

  return enc
}

// libsodium compat
Blake2b.prototype.final = Blake2b.prototype.digest

Blake2b.WASM = wasm && wasm.buffer
Blake2b.SUPPORTED = typeof WebAssembly !== 'undefined'

Blake2b.ready = function (cb) {
  if (!cb) cb = noop
  if (!wasm) return cb(new Error('WebAssembly not supported'))

  // backwards compat, can be removed in a new major
  var p = new Promise(function (reject, resolve) {
    wasm.onload(function (err) {
      if (err) resolve()
      else reject()
      cb(err)
    })
  })

  return p
}

Blake2b.prototype.ready = Blake2b.ready

function noop () {}

function hexSlice (buf, start, len) {
  var str = ''
  for (var i = 0; i < len; i++) str += toHex(buf[start + i])
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}


/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {


module.exports = loadWebAssembly

loadWebAssembly.supported = typeof WebAssembly !== 'undefined'

function loadWebAssembly (opts) {
  if (!loadWebAssembly.supported) return null

  var imp = opts && opts.imports
  var wasm = toUint8Array('AGFzbQEAAAABEANgAn9/AGADf39/AGABfwADBQQAAQICBQUBAQroBwdNBQZtZW1vcnkCAAxibGFrZTJiX2luaXQAAA5ibGFrZTJiX3VwZGF0ZQABDWJsYWtlMmJfZmluYWwAAhBibGFrZTJiX2NvbXByZXNzAAMK00AElgMAIABCADcDACAAQQhqQgA3AwAgAEEQakIANwMAIABBGGpCADcDACAAQSBqQgA3AwAgAEEoakIANwMAIABBMGpCADcDACAAQThqQgA3AwAgAEHAAGpCADcDACAAQcgAakIANwMAIABB0ABqQgA3AwAgAEHYAGpCADcDACAAQeAAakIANwMAIABB6ABqQgA3AwAgAEHwAGpCADcDACAAQfgAakIANwMAIABBgAFqQoiS853/zPmE6gBBACkDAIU3AwAgAEGIAWpCu86qptjQ67O7f0EIKQMAhTcDACAAQZABakKr8NP0r+68tzxBECkDAIU3AwAgAEGYAWpC8e30+KWn/aelf0EYKQMAhTcDACAAQaABakLRhZrv+s+Uh9EAQSApAwCFNwMAIABBqAFqQp/Y+dnCkdqCm39BKCkDAIU3AwAgAEGwAWpC6/qG2r+19sEfQTApAwCFNwMAIABBuAFqQvnC+JuRo7Pw2wBBOCkDAIU3AwAgAEHAAWpCADcDACAAQcgBakIANwMAIABB0AFqQgA3AwALbQEDfyAAQcABaiEDIABByAFqIQQgBCkDAKchBQJAA0AgASACRg0BIAVBgAFGBEAgAyADKQMAIAWtfDcDAEEAIQUgABADCyAAIAVqIAEtAAA6AAAgBUEBaiEFIAFBAWohAQwACwsgBCAFrTcDAAtkAQN/IABBwAFqIQEgAEHIAWohAiABIAEpAwAgAikDAHw3AwAgAEHQAWpCfzcDACACKQMApyEDAkADQCADQYABRg0BIAAgA2pBADoAACADQQFqIQMMAAsLIAIgA603AwAgABADC+U7AiB+CX8gAEGAAWohISAAQYgBaiEiIABBkAFqISMgAEGYAWohJCAAQaABaiElIABBqAFqISYgAEGwAWohJyAAQbgBaiEoICEpAwAhASAiKQMAIQIgIykDACEDICQpAwAhBCAlKQMAIQUgJikDACEGICcpAwAhByAoKQMAIQhCiJLznf/M+YTqACEJQrvOqqbY0Ouzu38hCkKr8NP0r+68tzwhC0Lx7fT4paf9p6V/IQxC0YWa7/rPlIfRACENQp/Y+dnCkdqCm38hDkLr+obav7X2wR8hD0L5wvibkaOz8NsAIRAgACkDACERIABBCGopAwAhEiAAQRBqKQMAIRMgAEEYaikDACEUIABBIGopAwAhFSAAQShqKQMAIRYgAEEwaikDACEXIABBOGopAwAhGCAAQcAAaikDACEZIABByABqKQMAIRogAEHQAGopAwAhGyAAQdgAaikDACEcIABB4ABqKQMAIR0gAEHoAGopAwAhHiAAQfAAaikDACEfIABB+ABqKQMAISAgDSAAQcABaikDAIUhDSAPIABB0AFqKQMAhSEPIAEgBSARfHwhASANIAGFQiCKIQ0gCSANfCEJIAUgCYVCGIohBSABIAUgEnx8IQEgDSABhUIQiiENIAkgDXwhCSAFIAmFQj+KIQUgAiAGIBN8fCECIA4gAoVCIIohDiAKIA58IQogBiAKhUIYiiEGIAIgBiAUfHwhAiAOIAKFQhCKIQ4gCiAOfCEKIAYgCoVCP4ohBiADIAcgFXx8IQMgDyADhUIgiiEPIAsgD3whCyAHIAuFQhiKIQcgAyAHIBZ8fCEDIA8gA4VCEIohDyALIA98IQsgByALhUI/iiEHIAQgCCAXfHwhBCAQIASFQiCKIRAgDCAQfCEMIAggDIVCGIohCCAEIAggGHx8IQQgECAEhUIQiiEQIAwgEHwhDCAIIAyFQj+KIQggASAGIBl8fCEBIBAgAYVCIIohECALIBB8IQsgBiALhUIYiiEGIAEgBiAafHwhASAQIAGFQhCKIRAgCyAQfCELIAYgC4VCP4ohBiACIAcgG3x8IQIgDSAChUIgiiENIAwgDXwhDCAHIAyFQhiKIQcgAiAHIBx8fCECIA0gAoVCEIohDSAMIA18IQwgByAMhUI/iiEHIAMgCCAdfHwhAyAOIAOFQiCKIQ4gCSAOfCEJIAggCYVCGIohCCADIAggHnx8IQMgDiADhUIQiiEOIAkgDnwhCSAIIAmFQj+KIQggBCAFIB98fCEEIA8gBIVCIIohDyAKIA98IQogBSAKhUIYiiEFIAQgBSAgfHwhBCAPIASFQhCKIQ8gCiAPfCEKIAUgCoVCP4ohBSABIAUgH3x8IQEgDSABhUIgiiENIAkgDXwhCSAFIAmFQhiKIQUgASAFIBt8fCEBIA0gAYVCEIohDSAJIA18IQkgBSAJhUI/iiEFIAIgBiAVfHwhAiAOIAKFQiCKIQ4gCiAOfCEKIAYgCoVCGIohBiACIAYgGXx8IQIgDiAChUIQiiEOIAogDnwhCiAGIAqFQj+KIQYgAyAHIBp8fCEDIA8gA4VCIIohDyALIA98IQsgByALhUIYiiEHIAMgByAgfHwhAyAPIAOFQhCKIQ8gCyAPfCELIAcgC4VCP4ohByAEIAggHnx8IQQgECAEhUIgiiEQIAwgEHwhDCAIIAyFQhiKIQggBCAIIBd8fCEEIBAgBIVCEIohECAMIBB8IQwgCCAMhUI/iiEIIAEgBiASfHwhASAQIAGFQiCKIRAgCyAQfCELIAYgC4VCGIohBiABIAYgHXx8IQEgECABhUIQiiEQIAsgEHwhCyAGIAuFQj+KIQYgAiAHIBF8fCECIA0gAoVCIIohDSAMIA18IQwgByAMhUIYiiEHIAIgByATfHwhAiANIAKFQhCKIQ0gDCANfCEMIAcgDIVCP4ohByADIAggHHx8IQMgDiADhUIgiiEOIAkgDnwhCSAIIAmFQhiKIQggAyAIIBh8fCEDIA4gA4VCEIohDiAJIA58IQkgCCAJhUI/iiEIIAQgBSAWfHwhBCAPIASFQiCKIQ8gCiAPfCEKIAUgCoVCGIohBSAEIAUgFHx8IQQgDyAEhUIQiiEPIAogD3whCiAFIAqFQj+KIQUgASAFIBx8fCEBIA0gAYVCIIohDSAJIA18IQkgBSAJhUIYiiEFIAEgBSAZfHwhASANIAGFQhCKIQ0gCSANfCEJIAUgCYVCP4ohBSACIAYgHXx8IQIgDiAChUIgiiEOIAogDnwhCiAGIAqFQhiKIQYgAiAGIBF8fCECIA4gAoVCEIohDiAKIA58IQogBiAKhUI/iiEGIAMgByAWfHwhAyAPIAOFQiCKIQ8gCyAPfCELIAcgC4VCGIohByADIAcgE3x8IQMgDyADhUIQiiEPIAsgD3whCyAHIAuFQj+KIQcgBCAIICB8fCEEIBAgBIVCIIohECAMIBB8IQwgCCAMhUIYiiEIIAQgCCAefHwhBCAQIASFQhCKIRAgDCAQfCEMIAggDIVCP4ohCCABIAYgG3x8IQEgECABhUIgiiEQIAsgEHwhCyAGIAuFQhiKIQYgASAGIB98fCEBIBAgAYVCEIohECALIBB8IQsgBiALhUI/iiEGIAIgByAUfHwhAiANIAKFQiCKIQ0gDCANfCEMIAcgDIVCGIohByACIAcgF3x8IQIgDSAChUIQiiENIAwgDXwhDCAHIAyFQj+KIQcgAyAIIBh8fCEDIA4gA4VCIIohDiAJIA58IQkgCCAJhUIYiiEIIAMgCCASfHwhAyAOIAOFQhCKIQ4gCSAOfCEJIAggCYVCP4ohCCAEIAUgGnx8IQQgDyAEhUIgiiEPIAogD3whCiAFIAqFQhiKIQUgBCAFIBV8fCEEIA8gBIVCEIohDyAKIA98IQogBSAKhUI/iiEFIAEgBSAYfHwhASANIAGFQiCKIQ0gCSANfCEJIAUgCYVCGIohBSABIAUgGnx8IQEgDSABhUIQiiENIAkgDXwhCSAFIAmFQj+KIQUgAiAGIBR8fCECIA4gAoVCIIohDiAKIA58IQogBiAKhUIYiiEGIAIgBiASfHwhAiAOIAKFQhCKIQ4gCiAOfCEKIAYgCoVCP4ohBiADIAcgHnx8IQMgDyADhUIgiiEPIAsgD3whCyAHIAuFQhiKIQcgAyAHIB18fCEDIA8gA4VCEIohDyALIA98IQsgByALhUI/iiEHIAQgCCAcfHwhBCAQIASFQiCKIRAgDCAQfCEMIAggDIVCGIohCCAEIAggH3x8IQQgECAEhUIQiiEQIAwgEHwhDCAIIAyFQj+KIQggASAGIBN8fCEBIBAgAYVCIIohECALIBB8IQsgBiALhUIYiiEGIAEgBiAXfHwhASAQIAGFQhCKIRAgCyAQfCELIAYgC4VCP4ohBiACIAcgFnx8IQIgDSAChUIgiiENIAwgDXwhDCAHIAyFQhiKIQcgAiAHIBt8fCECIA0gAoVCEIohDSAMIA18IQwgByAMhUI/iiEHIAMgCCAVfHwhAyAOIAOFQiCKIQ4gCSAOfCEJIAggCYVCGIohCCADIAggEXx8IQMgDiADhUIQiiEOIAkgDnwhCSAIIAmFQj+KIQggBCAFICB8fCEEIA8gBIVCIIohDyAKIA98IQogBSAKhUIYiiEFIAQgBSAZfHwhBCAPIASFQhCKIQ8gCiAPfCEKIAUgCoVCP4ohBSABIAUgGnx8IQEgDSABhUIgiiENIAkgDXwhCSAFIAmFQhiKIQUgASAFIBF8fCEBIA0gAYVCEIohDSAJIA18IQkgBSAJhUI/iiEFIAIgBiAWfHwhAiAOIAKFQiCKIQ4gCiAOfCEKIAYgCoVCGIohBiACIAYgGHx8IQIgDiAChUIQiiEOIAogDnwhCiAGIAqFQj+KIQYgAyAHIBN8fCEDIA8gA4VCIIohDyALIA98IQsgByALhUIYiiEHIAMgByAVfHwhAyAPIAOFQhCKIQ8gCyAPfCELIAcgC4VCP4ohByAEIAggG3x8IQQgECAEhUIgiiEQIAwgEHwhDCAIIAyFQhiKIQggBCAIICB8fCEEIBAgBIVCEIohECAMIBB8IQwgCCAMhUI/iiEIIAEgBiAffHwhASAQIAGFQiCKIRAgCyAQfCELIAYgC4VCGIohBiABIAYgEnx8IQEgECABhUIQiiEQIAsgEHwhCyAGIAuFQj+KIQYgAiAHIBx8fCECIA0gAoVCIIohDSAMIA18IQwgByAMhUIYiiEHIAIgByAdfHwhAiANIAKFQhCKIQ0gDCANfCEMIAcgDIVCP4ohByADIAggF3x8IQMgDiADhUIgiiEOIAkgDnwhCSAIIAmFQhiKIQggAyAIIBl8fCEDIA4gA4VCEIohDiAJIA58IQkgCCAJhUI/iiEIIAQgBSAUfHwhBCAPIASFQiCKIQ8gCiAPfCEKIAUgCoVCGIohBSAEIAUgHnx8IQQgDyAEhUIQiiEPIAogD3whCiAFIAqFQj+KIQUgASAFIBN8fCEBIA0gAYVCIIohDSAJIA18IQkgBSAJhUIYiiEFIAEgBSAdfHwhASANIAGFQhCKIQ0gCSANfCEJIAUgCYVCP4ohBSACIAYgF3x8IQIgDiAChUIgiiEOIAogDnwhCiAGIAqFQhiKIQYgAiAGIBt8fCECIA4gAoVCEIohDiAKIA58IQogBiAKhUI/iiEGIAMgByARfHwhAyAPIAOFQiCKIQ8gCyAPfCELIAcgC4VCGIohByADIAcgHHx8IQMgDyADhUIQiiEPIAsgD3whCyAHIAuFQj+KIQcgBCAIIBl8fCEEIBAgBIVCIIohECAMIBB8IQwgCCAMhUIYiiEIIAQgCCAUfHwhBCAQIASFQhCKIRAgDCAQfCEMIAggDIVCP4ohCCABIAYgFXx8IQEgECABhUIgiiEQIAsgEHwhCyAGIAuFQhiKIQYgASAGIB58fCEBIBAgAYVCEIohECALIBB8IQsgBiALhUI/iiEGIAIgByAYfHwhAiANIAKFQiCKIQ0gDCANfCEMIAcgDIVCGIohByACIAcgFnx8IQIgDSAChUIQiiENIAwgDXwhDCAHIAyFQj+KIQcgAyAIICB8fCEDIA4gA4VCIIohDiAJIA58IQkgCCAJhUIYiiEIIAMgCCAffHwhAyAOIAOFQhCKIQ4gCSAOfCEJIAggCYVCP4ohCCAEIAUgEnx8IQQgDyAEhUIgiiEPIAogD3whCiAFIAqFQhiKIQUgBCAFIBp8fCEEIA8gBIVCEIohDyAKIA98IQogBSAKhUI/iiEFIAEgBSAdfHwhASANIAGFQiCKIQ0gCSANfCEJIAUgCYVCGIohBSABIAUgFnx8IQEgDSABhUIQiiENIAkgDXwhCSAFIAmFQj+KIQUgAiAGIBJ8fCECIA4gAoVCIIohDiAKIA58IQogBiAKhUIYiiEGIAIgBiAgfHwhAiAOIAKFQhCKIQ4gCiAOfCEKIAYgCoVCP4ohBiADIAcgH3x8IQMgDyADhUIgiiEPIAsgD3whCyAHIAuFQhiKIQcgAyAHIB58fCEDIA8gA4VCEIohDyALIA98IQsgByALhUI/iiEHIAQgCCAVfHwhBCAQIASFQiCKIRAgDCAQfCEMIAggDIVCGIohCCAEIAggG3x8IQQgECAEhUIQiiEQIAwgEHwhDCAIIAyFQj+KIQggASAGIBF8fCEBIBAgAYVCIIohECALIBB8IQsgBiALhUIYiiEGIAEgBiAYfHwhASAQIAGFQhCKIRAgCyAQfCELIAYgC4VCP4ohBiACIAcgF3x8IQIgDSAChUIgiiENIAwgDXwhDCAHIAyFQhiKIQcgAiAHIBR8fCECIA0gAoVCEIohDSAMIA18IQwgByAMhUI/iiEHIAMgCCAafHwhAyAOIAOFQiCKIQ4gCSAOfCEJIAggCYVCGIohCCADIAggE3x8IQMgDiADhUIQiiEOIAkgDnwhCSAIIAmFQj+KIQggBCAFIBl8fCEEIA8gBIVCIIohDyAKIA98IQogBSAKhUIYiiEFIAQgBSAcfHwhBCAPIASFQhCKIQ8gCiAPfCEKIAUgCoVCP4ohBSABIAUgHnx8IQEgDSABhUIgiiENIAkgDXwhCSAFIAmFQhiKIQUgASAFIBx8fCEBIA0gAYVCEIohDSAJIA18IQkgBSAJhUI/iiEFIAIgBiAYfHwhAiAOIAKFQiCKIQ4gCiAOfCEKIAYgCoVCGIohBiACIAYgH3x8IQIgDiAChUIQiiEOIAogDnwhCiAGIAqFQj+KIQYgAyAHIB18fCEDIA8gA4VCIIohDyALIA98IQsgByALhUIYiiEHIAMgByASfHwhAyAPIAOFQhCKIQ8gCyAPfCELIAcgC4VCP4ohByAEIAggFHx8IQQgECAEhUIgiiEQIAwgEHwhDCAIIAyFQhiKIQggBCAIIBp8fCEEIBAgBIVCEIohECAMIBB8IQwgCCAMhUI/iiEIIAEgBiAWfHwhASAQIAGFQiCKIRAgCyAQfCELIAYgC4VCGIohBiABIAYgEXx8IQEgECABhUIQiiEQIAsgEHwhCyAGIAuFQj+KIQYgAiAHICB8fCECIA0gAoVCIIohDSAMIA18IQwgByAMhUIYiiEHIAIgByAVfHwhAiANIAKFQhCKIQ0gDCANfCEMIAcgDIVCP4ohByADIAggGXx8IQMgDiADhUIgiiEOIAkgDnwhCSAIIAmFQhiKIQggAyAIIBd8fCEDIA4gA4VCEIohDiAJIA58IQkgCCAJhUI/iiEIIAQgBSATfHwhBCAPIASFQiCKIQ8gCiAPfCEKIAUgCoVCGIohBSAEIAUgG3x8IQQgDyAEhUIQiiEPIAogD3whCiAFIAqFQj+KIQUgASAFIBd8fCEBIA0gAYVCIIohDSAJIA18IQkgBSAJhUIYiiEFIAEgBSAgfHwhASANIAGFQhCKIQ0gCSANfCEJIAUgCYVCP4ohBSACIAYgH3x8IQIgDiAChUIgiiEOIAogDnwhCiAGIAqFQhiKIQYgAiAGIBp8fCECIA4gAoVCEIohDiAKIA58IQogBiAKhUI/iiEGIAMgByAcfHwhAyAPIAOFQiCKIQ8gCyAPfCELIAcgC4VCGIohByADIAcgFHx8IQMgDyADhUIQiiEPIAsgD3whCyAHIAuFQj+KIQcgBCAIIBF8fCEEIBAgBIVCIIohECAMIBB8IQwgCCAMhUIYiiEIIAQgCCAZfHwhBCAQIASFQhCKIRAgDCAQfCEMIAggDIVCP4ohCCABIAYgHXx8IQEgECABhUIgiiEQIAsgEHwhCyAGIAuFQhiKIQYgASAGIBN8fCEBIBAgAYVCEIohECALIBB8IQsgBiALhUI/iiEGIAIgByAefHwhAiANIAKFQiCKIQ0gDCANfCEMIAcgDIVCGIohByACIAcgGHx8IQIgDSAChUIQiiENIAwgDXwhDCAHIAyFQj+KIQcgAyAIIBJ8fCEDIA4gA4VCIIohDiAJIA58IQkgCCAJhUIYiiEIIAMgCCAVfHwhAyAOIAOFQhCKIQ4gCSAOfCEJIAggCYVCP4ohCCAEIAUgG3x8IQQgDyAEhUIgiiEPIAogD3whCiAFIAqFQhiKIQUgBCAFIBZ8fCEEIA8gBIVCEIohDyAKIA98IQogBSAKhUI/iiEFIAEgBSAbfHwhASANIAGFQiCKIQ0gCSANfCEJIAUgCYVCGIohBSABIAUgE3x8IQEgDSABhUIQiiENIAkgDXwhCSAFIAmFQj+KIQUgAiAGIBl8fCECIA4gAoVCIIohDiAKIA58IQogBiAKhUIYiiEGIAIgBiAVfHwhAiAOIAKFQhCKIQ4gCiAOfCEKIAYgCoVCP4ohBiADIAcgGHx8IQMgDyADhUIgiiEPIAsgD3whCyAHIAuFQhiKIQcgAyAHIBd8fCEDIA8gA4VCEIohDyALIA98IQsgByALhUI/iiEHIAQgCCASfHwhBCAQIASFQiCKIRAgDCAQfCEMIAggDIVCGIohCCAEIAggFnx8IQQgECAEhUIQiiEQIAwgEHwhDCAIIAyFQj+KIQggASAGICB8fCEBIBAgAYVCIIohECALIBB8IQsgBiALhUIYiiEGIAEgBiAcfHwhASAQIAGFQhCKIRAgCyAQfCELIAYgC4VCP4ohBiACIAcgGnx8IQIgDSAChUIgiiENIAwgDXwhDCAHIAyFQhiKIQcgAiAHIB98fCECIA0gAoVCEIohDSAMIA18IQwgByAMhUI/iiEHIAMgCCAUfHwhAyAOIAOFQiCKIQ4gCSAOfCEJIAggCYVCGIohCCADIAggHXx8IQMgDiADhUIQiiEOIAkgDnwhCSAIIAmFQj+KIQggBCAFIB58fCEEIA8gBIVCIIohDyAKIA98IQogBSAKhUIYiiEFIAQgBSARfHwhBCAPIASFQhCKIQ8gCiAPfCEKIAUgCoVCP4ohBSABIAUgEXx8IQEgDSABhUIgiiENIAkgDXwhCSAFIAmFQhiKIQUgASAFIBJ8fCEBIA0gAYVCEIohDSAJIA18IQkgBSAJhUI/iiEFIAIgBiATfHwhAiAOIAKFQiCKIQ4gCiAOfCEKIAYgCoVCGIohBiACIAYgFHx8IQIgDiAChUIQiiEOIAogDnwhCiAGIAqFQj+KIQYgAyAHIBV8fCEDIA8gA4VCIIohDyALIA98IQsgByALhUIYiiEHIAMgByAWfHwhAyAPIAOFQhCKIQ8gCyAPfCELIAcgC4VCP4ohByAEIAggF3x8IQQgECAEhUIgiiEQIAwgEHwhDCAIIAyFQhiKIQggBCAIIBh8fCEEIBAgBIVCEIohECAMIBB8IQwgCCAMhUI/iiEIIAEgBiAZfHwhASAQIAGFQiCKIRAgCyAQfCELIAYgC4VCGIohBiABIAYgGnx8IQEgECABhUIQiiEQIAsgEHwhCyAGIAuFQj+KIQYgAiAHIBt8fCECIA0gAoVCIIohDSAMIA18IQwgByAMhUIYiiEHIAIgByAcfHwhAiANIAKFQhCKIQ0gDCANfCEMIAcgDIVCP4ohByADIAggHXx8IQMgDiADhUIgiiEOIAkgDnwhCSAIIAmFQhiKIQggAyAIIB58fCEDIA4gA4VCEIohDiAJIA58IQkgCCAJhUI/iiEIIAQgBSAffHwhBCAPIASFQiCKIQ8gCiAPfCEKIAUgCoVCGIohBSAEIAUgIHx8IQQgDyAEhUIQiiEPIAogD3whCiAFIAqFQj+KIQUgASAFIB98fCEBIA0gAYVCIIohDSAJIA18IQkgBSAJhUIYiiEFIAEgBSAbfHwhASANIAGFQhCKIQ0gCSANfCEJIAUgCYVCP4ohBSACIAYgFXx8IQIgDiAChUIgiiEOIAogDnwhCiAGIAqFQhiKIQYgAiAGIBl8fCECIA4gAoVCEIohDiAKIA58IQogBiAKhUI/iiEGIAMgByAafHwhAyAPIAOFQiCKIQ8gCyAPfCELIAcgC4VCGIohByADIAcgIHx8IQMgDyADhUIQiiEPIAsgD3whCyAHIAuFQj+KIQcgBCAIIB58fCEEIBAgBIVCIIohECAMIBB8IQwgCCAMhUIYiiEIIAQgCCAXfHwhBCAQIASFQhCKIRAgDCAQfCEMIAggDIVCP4ohCCABIAYgEnx8IQEgECABhUIgiiEQIAsgEHwhCyAGIAuFQhiKIQYgASAGIB18fCEBIBAgAYVCEIohECALIBB8IQsgBiALhUI/iiEGIAIgByARfHwhAiANIAKFQiCKIQ0gDCANfCEMIAcgDIVCGIohByACIAcgE3x8IQIgDSAChUIQiiENIAwgDXwhDCAHIAyFQj+KIQcgAyAIIBx8fCEDIA4gA4VCIIohDiAJIA58IQkgCCAJhUIYiiEIIAMgCCAYfHwhAyAOIAOFQhCKIQ4gCSAOfCEJIAggCYVCP4ohCCAEIAUgFnx8IQQgDyAEhUIgiiEPIAogD3whCiAFIAqFQhiKIQUgBCAFIBR8fCEEIA8gBIVCEIohDyAKIA98IQogBSAKhUI/iiEFICEgISkDACABIAmFhTcDACAiICIpAwAgAiAKhYU3AwAgIyAjKQMAIAMgC4WFNwMAICQgJCkDACAEIAyFhTcDACAlICUpAwAgBSANhYU3AwAgJiAmKQMAIAYgDoWFNwMAICcgJykDACAHIA+FhTcDACAoICgpAwAgCCAQhYU3AwAL')
  var ready = null

  var mod = {
    buffer: wasm,
    memory: null,
    exports: null,
    realloc: realloc,
    onload: onload
  }

  onload(function () {})

  return mod

  function realloc (size) {
    mod.exports.memory.grow(Math.ceil(Math.abs(size - mod.memory.length) / 65536))
    mod.memory = new Uint8Array(mod.exports.memory.buffer)
  }

  function onload (cb) {
    if (mod.exports) return cb()

    if (ready) {
      ready.then(cb.bind(null, null)).catch(cb)
      return
    }

    try {
      if (opts && opts.async) throw new Error('async')
      setup({instance: new WebAssembly.Instance(new WebAssembly.Module(wasm), imp)})
    } catch (err) {
      ready = WebAssembly.instantiate(wasm, imp).then(setup)
    }

    onload(cb)
  }

  function setup (w) {
    mod.exports = w.instance.exports
    mod.memory = mod.exports.memory && mod.exports.memory.buffer && new Uint8Array(mod.exports.memory.buffer)
  }
}

function toUint8Array (s) {
  if (typeof atob === 'function') return new Uint8Array(atob(s).split('').map(charCodeAt))
  return new (__webpack_require__(6).Buffer)(s, 'base64')
}

function charCodeAt (c) {
  return c.charCodeAt(0)
}


/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

// pre-compute lookup table
var ALPHABET_MAP = {}
for (var z = 0; z < ALPHABET.length; z++) {
  var x = ALPHABET.charAt(z)

  if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
  ALPHABET_MAP[x] = z
}

function polymodStep (pre) {
  var b = pre >> 25
  return ((pre & 0x1FFFFFF) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
}

function prefixChk (prefix) {
  var chk = 1
  for (var i = 0; i < prefix.length; ++i) {
    var c = prefix.charCodeAt(i)
    if (c < 33 || c > 126) throw new Error('Invalid prefix (' + prefix + ')')

    chk = polymodStep(chk) ^ (c >> 5)
  }
  chk = polymodStep(chk)

  for (i = 0; i < prefix.length; ++i) {
    var v = prefix.charCodeAt(i)
    chk = polymodStep(chk) ^ (v & 0x1f)
  }
  return chk
}

function encode (prefix, words, LIMIT) {
  LIMIT = LIMIT || 90
  if ((prefix.length + 7 + words.length) > LIMIT) throw new TypeError('Exceeds length limit')

  prefix = prefix.toLowerCase()

  // determine chk mod
  var chk = prefixChk(prefix)
  var result = prefix + '1'
  for (var i = 0; i < words.length; ++i) {
    var x = words[i]
    if ((x >> 5) !== 0) throw new Error('Non 5-bit word')

    chk = polymodStep(chk) ^ x
    result += ALPHABET.charAt(x)
  }

  for (i = 0; i < 6; ++i) {
    chk = polymodStep(chk)
  }
  chk ^= 1

  for (i = 0; i < 6; ++i) {
    var v = (chk >> ((5 - i) * 5)) & 0x1f
    result += ALPHABET.charAt(v)
  }

  return result
}

function decode (str, LIMIT) {
  LIMIT = LIMIT || 90
  if (str.length < 8) throw new TypeError(str + ' too short')
  if (str.length > LIMIT) throw new TypeError('Exceeds length limit')

  // don't allow mixed case
  var lowered = str.toLowerCase()
  var uppered = str.toUpperCase()
  if (str !== lowered && str !== uppered) throw new Error('Mixed-case string ' + str)
  str = lowered

  var split = str.lastIndexOf('1')
  if (split === -1) throw new Error('No separator character for ' + str)
  if (split === 0) throw new Error('Missing prefix for ' + str)

  var prefix = str.slice(0, split)
  var wordChars = str.slice(split + 1)
  if (wordChars.length < 6) throw new Error('Data too short')

  var chk = prefixChk(prefix)
  var words = []
  for (var i = 0; i < wordChars.length; ++i) {
    var c = wordChars.charAt(i)
    var v = ALPHABET_MAP[c]
    if (v === undefined) throw new Error('Unknown character ' + c)
    chk = polymodStep(chk) ^ v

    // not in the checksum?
    if (i + 6 >= wordChars.length) continue
    words.push(v)
  }

  if (chk !== 1) throw new Error('Invalid checksum for ' + str)
  return { prefix: prefix, words: words }
}

function convert (data, inBits, outBits, pad) {
  var value = 0
  var bits = 0
  var maxV = (1 << outBits) - 1

  var result = []
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i]
    bits += inBits

    while (bits >= outBits) {
      bits -= outBits
      result.push((value >> bits) & maxV)
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV)
    }
  } else {
    if (bits >= inBits) throw new Error('Excess padding')
    if ((value << (outBits - bits)) & maxV) throw new Error('Non-zero padding')
  }

  return result
}

function toWords (bytes) {
  return convert(bytes, 8, 5, true)
}

function fromWords (words) {
  return convert(words, 5, 8, false)
}

module.exports = {
  decode: decode,
  encode: encode,
  toWords: toWords,
  fromWords: fromWords
}


/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var base58 = __webpack_require__(112)
var Buffer = __webpack_require__(0).Buffer

module.exports = function (checksumFn) {
  // Encode a buffer as a base58-check encoded string
  function encode (payload) {
    var checksum = checksumFn(payload)

    return base58.encode(Buffer.concat([
      payload,
      checksum
    ], payload.length + 4))
  }

  function decodeRaw (buffer) {
    var payload = buffer.slice(0, -4)
    var checksum = buffer.slice(-4)
    var newChecksum = checksumFn(payload)

    if (checksum[0] ^ newChecksum[0] |
        checksum[1] ^ newChecksum[1] |
        checksum[2] ^ newChecksum[2] |
        checksum[3] ^ newChecksum[3]) return

    return payload
  }

  // Decode a base58-check encoded string to a buffer, no result if checksum is wrong
  function decodeUnsafe (string) {
    var buffer = base58.decodeUnsafe(string)
    if (!buffer) return

    return decodeRaw(buffer)
  }

  function decode (string) {
    var buffer = base58.decode(string)
    var payload = decodeRaw(buffer, checksumFn)
    if (!payload) throw new Error('Invalid checksum')
    return payload
  }

  return {
    encode: encode,
    decode: decode,
    decodeUnsafe: decodeUnsafe
  }
}


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

var basex = __webpack_require__(113)
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

module.exports = basex(ALPHABET)


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const Buffer = __webpack_require__(0).Buffer

module.exports = function base (ALPHABET) {
  if (ALPHABET.length >= 255) throw new TypeError('Alphabet too long')

  const BASE_MAP = new Uint8Array(256)
  BASE_MAP.fill(255)

  for (let i = 0; i < ALPHABET.length; i++) {
    const x = ALPHABET.charAt(i)
    const xc = x.charCodeAt(0)

    if (BASE_MAP[xc] !== 255) throw new TypeError(x + ' is ambiguous')
    BASE_MAP[xc] = i
  }

  const BASE = ALPHABET.length
  const LEADER = ALPHABET.charAt(0)
  const FACTOR = Math.log(BASE) / Math.log(256) // log(BASE) / log(256), rounded up
  const iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up

  function encode (source) {
    if (!Buffer.isBuffer(source)) throw new TypeError('Expected Buffer')
    if (source.length === 0) return ''

    // Skip & count leading zeroes.
    let zeroes = 0
    let length = 0
    let pbegin = 0
    const pend = source.length

    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++
      zeroes++
    }

    // Allocate enough space in big-endian base58 representation.
    const size = ((pend - pbegin) * iFACTOR + 1) >>> 0
    const b58 = new Uint8Array(size)

    // Process the bytes.
    while (pbegin !== pend) {
      let carry = source[pbegin]

      // Apply "b58 = b58 * 256 + ch".
      let i = 0
      for (let it = size - 1; (carry !== 0 || i < length) && (it !== -1); it--, i++) {
        carry += (256 * b58[it]) >>> 0
        b58[it] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }

      if (carry !== 0) throw new Error('Non-zero carry')
      length = i
      pbegin++
    }

    // Skip leading zeroes in base58 result.
    let it = size - length
    while (it !== size && b58[it] === 0) {
      it++
    }

    // Translate the result into a string.
    let str = LEADER.repeat(zeroes)
    for (; it < size; ++it) str += ALPHABET.charAt(b58[it])

    return str
  }

  function decodeUnsafe (source) {
    if (typeof source !== 'string') throw new TypeError('Expected String')
    if (source.length === 0) return Buffer.alloc(0)

    let psz = 0

    // Skip leading spaces.
    if (source[psz] === ' ') return

    // Skip and count leading '1's.
    let zeroes = 0
    let length = 0
    while (source[psz] === LEADER) {
      zeroes++
      psz++
    }

    // Allocate enough space in big-endian base256 representation.
    const size = (((source.length - psz) * FACTOR) + 1) >>> 0 // log(58) / log(256), rounded up.
    const b256 = new Uint8Array(size)

    // Process the characters.
    while (source[psz]) {
      // Decode character
      let carry = BASE_MAP[source.charCodeAt(psz)]

      // Invalid character
      if (carry === 255) return

      let i = 0
      for (let it = size - 1; (carry !== 0 || i < length) && (it !== -1); it--, i++) {
        carry += (BASE * b256[it]) >>> 0
        b256[it] = (carry % 256) >>> 0
        carry = (carry / 256) >>> 0
      }

      if (carry !== 0) throw new Error('Non-zero carry')
      length = i
      psz++
    }

    // Skip trailing spaces.
    if (source[psz] === ' ') return

    // Skip leading zeroes in b256.
    let it = size - length
    while (it !== size && b256[it] === 0) {
      it++
    }

    const vch = Buffer.allocUnsafe(zeroes + (size - it))
    vch.fill(0x00, 0, zeroes)

    let j = zeroes
    while (it !== size) {
      vch[j++] = b256[it++]
    }

    return vch
  }

  function decode (string) {
    const buffer = decodeUnsafe(string)
    if (buffer) return buffer

    throw new Error('Non-base' + BASE + ' character')
  }

  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}


/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var createHmac = __webpack_require__(64)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)

var BigInteger = __webpack_require__(9)
var ECSignature = __webpack_require__(34)

var ZERO = Buffer.alloc(1, 0)
var ONE = Buffer.alloc(1, 1)

var ecurve = __webpack_require__(35)
var secp256k1 = ecurve.getCurveByName('secp256k1')

// https://tools.ietf.org/html/rfc6979#section-3.2
function deterministicGenerateK (hash, x, checkSig) {
  typeforce(types.tuple(
    types.Hash256bit,
    types.Buffer256bit,
    types.Function
  ), arguments)

  // Step A, ignored as hash already provided
  // Step B
  // Step C
  var k = Buffer.alloc(32, 0)
  var v = Buffer.alloc(32, 1)

  // Step D
  k = createHmac('sha256', k)
    .update(v)
    .update(ZERO)
    .update(x)
    .update(hash)
    .digest()

  // Step E
  v = createHmac('sha256', k).update(v).digest()

  // Step F
  k = createHmac('sha256', k)
    .update(v)
    .update(ONE)
    .update(x)
    .update(hash)
    .digest()

  // Step G
  v = createHmac('sha256', k).update(v).digest()

  // Step H1/H2a, ignored as tlen === qlen (256 bit)
  // Step H2b
  v = createHmac('sha256', k).update(v).digest()

  var T = BigInteger.fromBuffer(v)

  // Step H3, repeat until T is within the interval [1, n - 1] and is suitable for ECDSA
  while (T.signum() <= 0 || T.compareTo(secp256k1.n) >= 0 || !checkSig(T)) {
    k = createHmac('sha256', k)
      .update(v)
      .update(ZERO)
      .digest()

    v = createHmac('sha256', k).update(v).digest()

    // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
    // Step H2b again
    v = createHmac('sha256', k).update(v).digest()
    T = BigInteger.fromBuffer(v)
  }

  return T
}

var N_OVER_TWO = secp256k1.n.shiftRight(1)

function sign (hash, d) {
  typeforce(types.tuple(types.Hash256bit, types.BigInt), arguments)

  var x = d.toBuffer(32)
  var e = BigInteger.fromBuffer(hash)
  var n = secp256k1.n
  var G = secp256k1.G

  var r, s
  deterministicGenerateK(hash, x, function (k) {
    var Q = G.multiply(k)

    if (secp256k1.isInfinity(Q)) return false

    r = Q.affineX.mod(n)
    if (r.signum() === 0) return false

    s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)
    if (s.signum() === 0) return false

    return true
  })

  // enforce low S values, see bip62: 'low s values in signatures'
  if (s.compareTo(N_OVER_TWO) > 0) {
    s = n.subtract(s)
  }

  return new ECSignature(r, s)
}

function verify (hash, signature, Q) {
  typeforce(types.tuple(
    types.Hash256bit,
    types.ECSignature,
    types.ECPoint
  ), arguments)

  var n = secp256k1.n
  var G = secp256k1.G

  var r = signature.r
  var s = signature.s

  // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
  if (r.signum() <= 0 || r.compareTo(n) >= 0) return false
  if (s.signum() <= 0 || s.compareTo(n) >= 0) return false

  // 1.4.2 H = Hash(M), already done by the user
  // 1.4.3 e = H
  var e = BigInteger.fromBuffer(hash)

  // Compute s^-1
  var sInv = s.modInverse(n)

  // 1.4.4 Compute u1 = es^−1 mod n
  //               u2 = rs^−1 mod n
  var u1 = e.multiply(sInv).mod(n)
  var u2 = r.multiply(sInv).mod(n)

  // 1.4.5 Compute R = (xR, yR)
  //               R = u1G + u2Q
  var R = G.multiplyTwo(u1, Q, u2)

  // 1.4.5 (cont.) Enforce R is not at infinity
  if (secp256k1.isInfinity(R)) return false

  // 1.4.6 Convert the field element R.x to an integer
  var xR = R.affineX

  // 1.4.7 Set v = xR mod n
  var v = xR.mod(n)

  // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
  return v.equals(r)
}

module.exports = {
  deterministicGenerateK: deterministicGenerateK,
  sign: sign,
  verify: verify,

  // TODO: remove
  __curve: secp256k1
}


/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var inherits = __webpack_require__(2)
var Buffer = __webpack_require__(0).Buffer

var Base = __webpack_require__(29)

var ZEROS = Buffer.alloc(128)
var blocksize = 64

function Hmac (alg, key) {
  Base.call(this, 'digest')
  if (typeof key === 'string') {
    key = Buffer.from(key)
  }

  this._alg = alg
  this._key = key

  if (key.length > blocksize) {
    key = alg(key)
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = this._ipad = Buffer.allocUnsafe(blocksize)
  var opad = this._opad = Buffer.allocUnsafe(blocksize)

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  this._hash = [ipad]
}

inherits(Hmac, Base)

Hmac.prototype._update = function (data) {
  this._hash.push(data)
}

Hmac.prototype._final = function () {
  var h = this._alg(Buffer.concat(this._hash))
  return this._alg(Buffer.concat([this._opad, h]))
}
module.exports = Hmac


/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

var MD5 = __webpack_require__(51)

module.exports = function (buffer) {
  return new MD5().update(buffer).digest()
}


/***/ }),
/* 117 */
/***/ (function(module) {

module.exports = {"name":"bigi","version":"1.4.2","description":"Big integers.","keywords":["cryptography","math","bitcoin","arbitrary","precision","arithmetic","big","integer","int","number","biginteger","bigint","bignumber","decimal","float"],"devDependencies":{"coveralls":"^2.11.2","istanbul":"^0.3.5","jshint":"^2.5.1","mocha":"^2.1.0","mochify":"^2.1.0"},"repository":{"url":"https://github.com/cryptocoinjs/bigi","type":"git"},"main":"./lib/index.js","scripts":{"browser-test":"./node_modules/.bin/mochify --wd -R spec","test":"./node_modules/.bin/_mocha -- test/*.js","jshint":"./node_modules/.bin/jshint --config jshint.json lib/*.js ; true","unit":"./node_modules/.bin/mocha","coverage":"./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --reporter list test/*.js","coveralls":"npm run-script coverage && node ./node_modules/.bin/coveralls < coverage/lcov.info"},"dependencies":{},"testling":{"files":"test/*.js","harness":"mocha","browsers":["ie/9..latest","firefox/latest","chrome/latest","safari/6.0..latest","iphone/6.0..latest","android-browser/4.2..latest"]}};

/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// FIXME: Kind of a weird way to throw exceptions, consider removing
var assert = __webpack_require__(33)
var BigInteger = __webpack_require__(65)

/**
 * Turns a byte array into a big integer.
 *
 * This function will interpret a byte array as a big integer in big
 * endian notation.
 */
BigInteger.fromByteArrayUnsigned = function(byteArray) {
  // BigInteger expects a DER integer conformant byte array
  if (byteArray[0] & 0x80) {
    return new BigInteger([0].concat(byteArray))
  }

  return new BigInteger(byteArray)
}

/**
 * Returns a byte array representation of the big integer.
 *
 * This returns the absolute of the contained value in big endian
 * form. A value of zero results in an empty array.
 */
BigInteger.prototype.toByteArrayUnsigned = function() {
  var byteArray = this.toByteArray()
  return byteArray[0] === 0 ? byteArray.slice(1) : byteArray
}

BigInteger.fromDERInteger = function(byteArray) {
  return new BigInteger(byteArray)
}

/*
 * Converts BigInteger to a DER integer representation.
 *
 * The format for this value uses the most significant bit as a sign
 * bit.  If the most significant bit is already set and the integer is
 * positive, a 0x00 is prepended.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0xff
 *    127 =>     0x7f
 *   -127 =>     0x81
 *    128 =>   0x0080
 *   -128 =>     0x80
 *    255 =>   0x00ff
 *   -255 =>   0xff01
 *  16300 =>   0x3fac
 * -16300 =>   0xc054
 *  62300 => 0x00f35c
 * -62300 => 0xff0ca4
*/
BigInteger.prototype.toDERInteger = BigInteger.prototype.toByteArray

BigInteger.fromBuffer = function(buffer) {
  // BigInteger expects a DER integer conformant byte array
  if (buffer[0] & 0x80) {
    var byteArray = Array.prototype.slice.call(buffer)

    return new BigInteger([0].concat(byteArray))
  }

  return new BigInteger(buffer)
}

BigInteger.fromHex = function(hex) {
  if (hex === '') return BigInteger.ZERO

  assert.equal(hex, hex.match(/^[A-Fa-f0-9]+/), 'Invalid hex string')
  assert.equal(hex.length % 2, 0, 'Incomplete hex')
  return new BigInteger(hex, 16)
}

BigInteger.prototype.toBuffer = function(size) {
  var byteArray = this.toByteArrayUnsigned()
  var zeros = []

  var padding = size - byteArray.length
  while (zeros.length < padding) zeros.push(0)

  return new Buffer(zeros.concat(byteArray))
}

BigInteger.prototype.toHex = function(size) {
  return this.toBuffer(size).toString('hex')
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(120);

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(2);

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb, null, ret) },
            function(rej) { process.nextTick(callbackifyOnRejected, rej, cb) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(11)))

/***/ }),
/* 120 */
/***/ (function(module, exports) {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

var BigInteger = __webpack_require__(9)

var curves = __webpack_require__(122)
var Curve = __webpack_require__(67)

function getCurveByName (name) {
  var curve = curves[name]
  if (!curve) return null

  var p = new BigInteger(curve.p, 16)
  var a = new BigInteger(curve.a, 16)
  var b = new BigInteger(curve.b, 16)
  var n = new BigInteger(curve.n, 16)
  var h = new BigInteger(curve.h, 16)
  var Gx = new BigInteger(curve.Gx, 16)
  var Gy = new BigInteger(curve.Gy, 16)

  return new Curve(p, a, b, Gx, Gy, n, h)
}

module.exports = getCurveByName


/***/ }),
/* 122 */
/***/ (function(module) {

module.exports = {"secp128r1":{"p":"fffffffdffffffffffffffffffffffff","a":"fffffffdfffffffffffffffffffffffc","b":"e87579c11079f43dd824993c2cee5ed3","n":"fffffffe0000000075a30d1b9038a115","h":"01","Gx":"161ff7528b899b2d0c28607ca52c5b86","Gy":"cf5ac8395bafeb13c02da292dded7a83"},"secp160k1":{"p":"fffffffffffffffffffffffffffffffeffffac73","a":"00","b":"07","n":"0100000000000000000001b8fa16dfab9aca16b6b3","h":"01","Gx":"3b4c382ce37aa192a4019e763036f4f5dd4d7ebb","Gy":"938cf935318fdced6bc28286531733c3f03c4fee"},"secp160r1":{"p":"ffffffffffffffffffffffffffffffff7fffffff","a":"ffffffffffffffffffffffffffffffff7ffffffc","b":"1c97befc54bd7a8b65acf89f81d4d4adc565fa45","n":"0100000000000000000001f4c8f927aed3ca752257","h":"01","Gx":"4a96b5688ef573284664698968c38bb913cbfc82","Gy":"23a628553168947d59dcc912042351377ac5fb32"},"secp192k1":{"p":"fffffffffffffffffffffffffffffffffffffffeffffee37","a":"00","b":"03","n":"fffffffffffffffffffffffe26f2fc170f69466a74defd8d","h":"01","Gx":"db4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d","Gy":"9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d"},"secp192r1":{"p":"fffffffffffffffffffffffffffffffeffffffffffffffff","a":"fffffffffffffffffffffffffffffffefffffffffffffffc","b":"64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1","n":"ffffffffffffffffffffffff99def836146bc9b1b4d22831","h":"01","Gx":"188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012","Gy":"07192b95ffc8da78631011ed6b24cdd573f977a11e794811"},"secp256k1":{"p":"fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f","a":"00","b":"07","n":"fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141","h":"01","Gx":"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798","Gy":"483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"},"secp256r1":{"p":"ffffffff00000001000000000000000000000000ffffffffffffffffffffffff","a":"ffffffff00000001000000000000000000000000fffffffffffffffffffffffc","b":"5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b","n":"ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551","h":"01","Gx":"6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296","Gy":"4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"}};

/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, process) {

function oldBrowser () {
  throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
}

var Buffer = __webpack_require__(0).Buffer
var crypto = global.crypto || global.msCrypto

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes
} else {
  module.exports = oldBrowser
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > 65536) throw new Error('requested too many random bytes')
  // in case browserify  isn't using the Uint8Array version
  var rawBytes = new global.Uint8Array(size)

  // This will not work in older browsers.
  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
  if (size > 0) {  // getRandomValues fails on IE if size == 0
    crypto.getRandomValues(rawBytes)
  }

  // XXX: phantomjs doesn't like a buffer being passed here
  var bytes = Buffer.from(rawBytes.buffer)

  if (typeof cb === 'function') {
    return process.nextTick(function () {
      cb(null, bytes)
    })
  }

  return bytes
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7), __webpack_require__(11)))

/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var bs58check = __webpack_require__(17)

function decodeRaw (buffer, version) {
  // check version only if defined
  if (version !== undefined && buffer[0] !== version) throw new Error('Invalid network version')

  // uncompressed
  if (buffer.length === 33) {
    return {
      version: buffer[0],
      privateKey: buffer.slice(1, 33),
      compressed: false
    }
  }

  // invalid length
  if (buffer.length !== 34) throw new Error('Invalid WIF length')

  // invalid compression flag
  if (buffer[33] !== 0x01) throw new Error('Invalid compression flag')

  return {
    version: buffer[0],
    privateKey: buffer.slice(1, 33),
    compressed: true
  }
}

function encodeRaw (version, privateKey, compressed) {
  var result = new Buffer(compressed ? 34 : 33)

  result.writeUInt8(version, 0)
  privateKey.copy(result, 1)

  if (compressed) {
    result[33] = 0x01
  }

  return result
}

function decode (string, version) {
  return decodeRaw(bs58check.decode(string), version)
}

function encode (version, privateKey, compressed) {
  if (typeof version === 'number') return bs58check.encode(encodeRaw(version, privateKey, compressed))

  return bs58check.encode(
    encodeRaw(
      version.version,
      version.privateKey,
      version.compressed
    )
  )
}

module.exports = {
  decode: decode,
  decodeRaw: decodeRaw,
  encode: encode,
  encodeRaw: encodeRaw
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var base58check = __webpack_require__(17)
var bcrypto = __webpack_require__(10)
var createHmac = __webpack_require__(64)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var NETWORKS = __webpack_require__(13)

var BigInteger = __webpack_require__(9)
var ECPair = __webpack_require__(31)

var ecurve = __webpack_require__(35)
var curve = ecurve.getCurveByName('secp256k1')

function HDNode (keyPair, chainCode) {
  typeforce(types.tuple('ECPair', types.Buffer256bit), arguments)

  if (!keyPair.compressed) throw new TypeError('BIP32 only allows compressed keyPairs')

  this.keyPair = keyPair
  this.chainCode = chainCode
  this.depth = 0
  this.index = 0
  this.parentFingerprint = 0x00000000
}

HDNode.HIGHEST_BIT = 0x80000000
HDNode.LENGTH = 78
HDNode.MASTER_SECRET = Buffer.from('Bitcoin seed', 'utf8')

HDNode.fromSeedBuffer = function (seed, network) {
  typeforce(types.tuple(types.Buffer, types.maybe(types.Network)), arguments)

  if (seed.length < 16) throw new TypeError('Seed should be at least 128 bits')
  if (seed.length > 64) throw new TypeError('Seed should be at most 512 bits')

  var I = createHmac('sha512', HDNode.MASTER_SECRET).update(seed).digest()
  var IL = I.slice(0, 32)
  var IR = I.slice(32)

  // In case IL is 0 or >= n, the master key is invalid
  // This is handled by the ECPair constructor
  var pIL = BigInteger.fromBuffer(IL)
  var keyPair = new ECPair(pIL, null, {
    network: network
  })

  return new HDNode(keyPair, IR)
}

HDNode.fromSeedHex = function (hex, network) {
  return HDNode.fromSeedBuffer(Buffer.from(hex, 'hex'), network)
}

HDNode.fromBase58 = function (string, networks, skipValidation) {
  var buffer = base58check.decode(string)
  if (buffer.length !== 78) throw new Error('Invalid buffer length')

  // 4 bytes: version bytes
  var version = buffer.readUInt32BE(0)
  var network

  // list of networks?
  if (Array.isArray(networks)) {
    network = networks.filter(function (x) {
      return version === x.bip32.private ||
             version === x.bip32.public
    }).pop()

    if (!network) throw new Error('Unknown network version')

  // otherwise, assume a network object (or default to bitcoin)
  } else {
    network = networks || NETWORKS.bitcoin
  }

  if (version !== network.bip32.private &&
    version !== network.bip32.public) throw new Error('Invalid network version')

  // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ...
  var depth = buffer[4]

  // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
  var parentFingerprint = buffer.readUInt32BE(5)
  if (depth === 0) {
    if (parentFingerprint !== 0x00000000) throw new Error('Invalid parent fingerprint')
  }

  // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
  // This is encoded in MSB order. (0x00000000 if master key)
  var index = buffer.readUInt32BE(9)
  if (depth === 0 && index !== 0) throw new Error('Invalid index')

  // 32 bytes: the chain code
  var chainCode = buffer.slice(13, 45)
  var keyPair

  // 33 bytes: private key data (0x00 + k)
  if (version === network.bip32.private) {
    if (buffer.readUInt8(45) !== 0x00) throw new Error('Invalid private key')

    var d = BigInteger.fromBuffer(buffer.slice(46, 78))
    keyPair = new ECPair(d, null, { network: network })

  // 33 bytes: public key data (0x02 + X or 0x03 + X)
  } else {
    var Q = ecurve.Point.decodeFrom(curve, buffer.slice(45, 78))
    // Q.compressed is assumed, if somehow this assumption is broken, `new HDNode` will throw

    // Skip validation if requested for efficiency
    if (!skipValidation) {
      // Verify that the X coordinate in the public point corresponds to a point on the curve.
      // If not, the extended public key is invalid.
      curve.validate(Q)
    }

    keyPair = new ECPair(null, Q, { network: network })
  }

  var hd = new HDNode(keyPair, chainCode)
  hd.depth = depth
  hd.index = index
  hd.parentFingerprint = parentFingerprint

  return hd
}

HDNode.prototype.getAddress = function () {
  return this.keyPair.getAddress()
}

HDNode.prototype.getIdentifier = function () {
  return bcrypto.hash160(this.keyPair.getPublicKeyBuffer())
}

HDNode.prototype.getFingerprint = function () {
  return this.getIdentifier().slice(0, 4)
}

HDNode.prototype.getNetwork = function () {
  return this.keyPair.getNetwork()
}

HDNode.prototype.getPublicKeyBuffer = function () {
  return this.keyPair.getPublicKeyBuffer()
}

HDNode.prototype.neutered = function () {
  var neuteredKeyPair = new ECPair(null, this.keyPair.Q, {
    network: this.keyPair.network
  })

  var neutered = new HDNode(neuteredKeyPair, this.chainCode)
  neutered.depth = this.depth
  neutered.index = this.index
  neutered.parentFingerprint = this.parentFingerprint

  return neutered
}

HDNode.prototype.sign = function (hash) {
  return this.keyPair.sign(hash)
}

HDNode.prototype.verify = function (hash, signature) {
  return this.keyPair.verify(hash, signature)
}

HDNode.prototype.toBase58 = function (__isPrivate) {
  if (__isPrivate !== undefined) throw new TypeError('Unsupported argument in 2.0.0')

  // Version
  var network = this.keyPair.network
  var version = (!this.isNeutered()) ? network.bip32.private : network.bip32.public
  var buffer = Buffer.allocUnsafe(78)

  // 4 bytes: version bytes
  buffer.writeUInt32BE(version, 0)

  // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
  buffer.writeUInt8(this.depth, 4)

  // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
  buffer.writeUInt32BE(this.parentFingerprint, 5)

  // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
  // This is encoded in big endian. (0x00000000 if master key)
  buffer.writeUInt32BE(this.index, 9)

  // 32 bytes: the chain code
  this.chainCode.copy(buffer, 13)

  // 33 bytes: the public key or private key data
  if (!this.isNeutered()) {
    // 0x00 + k for private keys
    buffer.writeUInt8(0, 45)
    this.keyPair.d.toBuffer(32).copy(buffer, 46)

  // 33 bytes: the public key
  } else {
    // X9.62 encoding for public keys
    this.keyPair.getPublicKeyBuffer().copy(buffer, 45)
  }

  return base58check.encode(buffer)
}

// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
HDNode.prototype.derive = function (index) {
  typeforce(types.UInt32, index)

  var isHardened = index >= HDNode.HIGHEST_BIT
  var data = Buffer.allocUnsafe(37)

  // Hardened child
  if (isHardened) {
    if (this.isNeutered()) throw new TypeError('Could not derive hardened child key')

    // data = 0x00 || ser256(kpar) || ser32(index)
    data[0] = 0x00
    this.keyPair.d.toBuffer(32).copy(data, 1)
    data.writeUInt32BE(index, 33)

  // Normal child
  } else {
    // data = serP(point(kpar)) || ser32(index)
    //      = serP(Kpar) || ser32(index)
    this.keyPair.getPublicKeyBuffer().copy(data, 0)
    data.writeUInt32BE(index, 33)
  }

  var I = createHmac('sha512', this.chainCode).update(data).digest()
  var IL = I.slice(0, 32)
  var IR = I.slice(32)

  var pIL = BigInteger.fromBuffer(IL)

  // In case parse256(IL) >= n, proceed with the next value for i
  if (pIL.compareTo(curve.n) >= 0) {
    return this.derive(index + 1)
  }

  // Private parent key -> private child key
  var derivedKeyPair
  if (!this.isNeutered()) {
    // ki = parse256(IL) + kpar (mod n)
    var ki = pIL.add(this.keyPair.d).mod(curve.n)

    // In case ki == 0, proceed with the next value for i
    if (ki.signum() === 0) {
      return this.derive(index + 1)
    }

    derivedKeyPair = new ECPair(ki, null, {
      network: this.keyPair.network
    })

  // Public parent key -> public child key
  } else {
    // Ki = point(parse256(IL)) + Kpar
    //    = G*IL + Kpar
    var Ki = curve.G.multiply(pIL).add(this.keyPair.Q)

    // In case Ki is the point at infinity, proceed with the next value for i
    if (curve.isInfinity(Ki)) {
      return this.derive(index + 1)
    }

    derivedKeyPair = new ECPair(null, Ki, {
      network: this.keyPair.network
    })
  }

  var hd = new HDNode(derivedKeyPair, IR)
  hd.depth = this.depth + 1
  hd.index = index
  hd.parentFingerprint = this.getFingerprint().readUInt32BE(0)

  return hd
}

HDNode.prototype.deriveHardened = function (index) {
  typeforce(types.UInt31, index)

  // Only derives hardened private keys by default
  return this.derive(index + HDNode.HIGHEST_BIT)
}

// Private === not neutered
// Public === neutered
HDNode.prototype.isNeutered = function () {
  return !(this.keyPair.d)
}

HDNode.prototype.derivePath = function (path) {
  typeforce(types.BIP32Path, path)

  var splitPath = path.split('/')
  if (splitPath[0] === 'm') {
    if (this.parentFingerprint) {
      throw new Error('Not a master node')
    }

    splitPath = splitPath.slice(1)
  }

  return splitPath.reduce(function (prevHd, indexStr) {
    var index
    if (indexStr.slice(-1) === "'") {
      index = parseInt(indexStr.slice(0, -1), 10)
      return prevHd.deriveHardened(index)
    } else {
      index = parseInt(indexStr, 10)
      return prevHd.derive(index)
    }
  }, this)
}

module.exports = HDNode


/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(0).Buffer
var baddress = __webpack_require__(32)
var bcrypto = __webpack_require__(10)
var bscript = __webpack_require__(3)
var btemplates = __webpack_require__(20)
var networks = __webpack_require__(13)
var ops = __webpack_require__(5)
var typeforce = __webpack_require__(1)
var types = __webpack_require__(4)
var scriptTypes = btemplates.types
var SIGNABLE = [btemplates.types.P2PKH, btemplates.types.P2PK, btemplates.types.MULTISIG]
var P2SH = SIGNABLE.concat([btemplates.types.P2WPKH, btemplates.types.P2WSH])

var ECPair = __webpack_require__(31)
var ECSignature = __webpack_require__(34)
var Transaction = __webpack_require__(30)

function supportedType (type) {
  return SIGNABLE.indexOf(type) !== -1
}

function supportedP2SHType (type) {
  return P2SH.indexOf(type) !== -1
}

function extractChunks (type, chunks, script) {
  var pubKeys = []
  var signatures = []
  switch (type) {
    case scriptTypes.P2PKH:
      // if (redeemScript) throw new Error('Nonstandard... P2SH(P2PKH)')
      pubKeys = chunks.slice(1)
      signatures = chunks.slice(0, 1)
      break

    case scriptTypes.P2PK:
      pubKeys[0] = script ? btemplates.pubKey.output.decode(script) : undefined
      signatures = chunks.slice(0, 1)
      break

    case scriptTypes.MULTISIG:
      if (script) {
        var multisig = btemplates.multisig.output.decode(script)
        pubKeys = multisig.pubKeys
      }

      signatures = chunks.slice(1).map(function (chunk) {
        return chunk.length === 0 ? undefined : chunk
      })
      break
  }

  return {
    pubKeys: pubKeys,
    signatures: signatures
  }
}
function expandInput (scriptSig, witnessStack) {
  if (scriptSig.length === 0 && witnessStack.length === 0) return {}

  var prevOutScript
  var prevOutType
  var scriptType
  var script
  var redeemScript
  var witnessScript
  var witnessScriptType
  var redeemScriptType
  var witness = false
  var p2wsh = false
  var p2sh = false
  var witnessProgram
  var chunks

  var scriptSigChunks = bscript.decompile(scriptSig)
  var sigType = btemplates.classifyInput(scriptSigChunks, true)
  if (sigType === scriptTypes.P2SH) {
    p2sh = true
    redeemScript = scriptSigChunks[scriptSigChunks.length - 1]
    redeemScriptType = btemplates.classifyOutput(redeemScript)
    prevOutScript = btemplates.scriptHash.output.encode(bcrypto.hash160(redeemScript))
    prevOutType = scriptTypes.P2SH
    script = redeemScript
  }

  var classifyWitness = btemplates.classifyWitness(witnessStack, true)
  if (classifyWitness === scriptTypes.P2WSH) {
    witnessScript = witnessStack[witnessStack.length - 1]
    witnessScriptType = btemplates.classifyOutput(witnessScript)
    p2wsh = true
    witness = true
    if (scriptSig.length === 0) {
      prevOutScript = btemplates.witnessScriptHash.output.encode(bcrypto.sha256(witnessScript))
      prevOutType = scriptTypes.P2WSH
      if (redeemScript !== undefined) {
        throw new Error('Redeem script given when unnecessary')
      }
      // bare witness
    } else {
      if (!redeemScript) {
        throw new Error('No redeemScript provided for P2WSH, but scriptSig non-empty')
      }
      witnessProgram = btemplates.witnessScriptHash.output.encode(bcrypto.sha256(witnessScript))
      if (!redeemScript.equals(witnessProgram)) {
        throw new Error('Redeem script didn\'t match witnessScript')
      }
    }

    if (!supportedType(btemplates.classifyOutput(witnessScript))) {
      throw new Error('unsupported witness script')
    }

    script = witnessScript
    scriptType = witnessScriptType
    chunks = witnessStack.slice(0, -1)
  } else if (classifyWitness === scriptTypes.P2WPKH) {
    witness = true
    var key = witnessStack[witnessStack.length - 1]
    var keyHash = bcrypto.hash160(key)
    if (scriptSig.length === 0) {
      prevOutScript = btemplates.witnessPubKeyHash.output.encode(keyHash)
      prevOutType = scriptTypes.P2WPKH
      if (typeof redeemScript !== 'undefined') {
        throw new Error('Redeem script given when unnecessary')
      }
    } else {
      if (!redeemScript) {
        throw new Error('No redeemScript provided for P2WPKH, but scriptSig wasn\'t empty')
      }
      witnessProgram = btemplates.witnessPubKeyHash.output.encode(keyHash)
      if (!redeemScript.equals(witnessProgram)) {
        throw new Error('Redeem script did not have the right witness program')
      }
    }

    scriptType = scriptTypes.P2PKH
    chunks = witnessStack
  } else if (redeemScript) {
    if (!supportedP2SHType(redeemScriptType)) {
      throw new Error('Bad redeemscript!')
    }

    script = redeemScript
    scriptType = redeemScriptType
    chunks = scriptSigChunks.slice(0, -1)
  } else {
    prevOutType = scriptType = btemplates.classifyInput(scriptSig)
    chunks = scriptSigChunks
  }

  var expanded = extractChunks(scriptType, chunks, script)

  var result = {
    pubKeys: expanded.pubKeys,
    signatures: expanded.signatures,
    prevOutScript: prevOutScript,
    prevOutType: prevOutType,
    signType: scriptType,
    signScript: script,
    witness: Boolean(witness)
  }

  if (p2sh) {
    result.redeemScript = redeemScript
    result.redeemScriptType = redeemScriptType
  }

  if (p2wsh) {
    result.witnessScript = witnessScript
    result.witnessScriptType = witnessScriptType
  }

  return result
}

// could be done in expandInput, but requires the original Transaction for hashForSignature
function fixMultisigOrder (input, transaction, vin) {
  if (input.redeemScriptType !== scriptTypes.MULTISIG || !input.redeemScript) return
  if (input.pubKeys.length === input.signatures.length) return

  var unmatched = input.signatures.concat()

  input.signatures = input.pubKeys.map(function (pubKey) {
    var keyPair = ECPair.fromPublicKeyBuffer(pubKey)
    var match

    // check for a signature
    unmatched.some(function (signature, i) {
      // skip if undefined || OP_0
      if (!signature) return false

      // TODO: avoid O(n) hashForSignature
      var parsed = ECSignature.parseScriptSignature(signature)
      var hash = transaction.hashForSignature(vin, input.redeemScript, parsed.hashType)

      // skip if signature does not match pubKey
      if (!keyPair.verify(hash, parsed.signature)) return false

      // remove matched signature from unmatched
      unmatched[i] = undefined
      match = signature

      return true
    })

    return match
  })
}

function expandOutput (script, scriptType, ourPubKey) {
  typeforce(types.Buffer, script)

  var scriptChunks = bscript.decompile(script)
  if (!scriptType) {
    scriptType = btemplates.classifyOutput(script)
  }

  var pubKeys = []

  switch (scriptType) {
    // does our hash160(pubKey) match the output scripts?
    case scriptTypes.P2PKH:
      if (!ourPubKey) break

      var pkh1 = scriptChunks[2]
      var pkh2 = bcrypto.hash160(ourPubKey)
      if (pkh1.equals(pkh2)) pubKeys = [ourPubKey]
      break

    // does our hash160(pubKey) match the output scripts?
    case scriptTypes.P2WPKH:
      if (!ourPubKey) break

      var wpkh1 = scriptChunks[1]
      var wpkh2 = bcrypto.hash160(ourPubKey)
      if (wpkh1.equals(wpkh2)) pubKeys = [ourPubKey]
      break

    case scriptTypes.P2PK:
      pubKeys = scriptChunks.slice(0, 1)
      break

    case scriptTypes.MULTISIG:
      pubKeys = scriptChunks.slice(1, -2)
      break

    default: return { scriptType: scriptType }
  }

  return {
    pubKeys: pubKeys,
    scriptType: scriptType,
    signatures: pubKeys.map(function () { return undefined })
  }
}

function checkP2SHInput (input, redeemScriptHash) {
  if (input.prevOutType) {
    if (input.prevOutType !== scriptTypes.P2SH) throw new Error('PrevOutScript must be P2SH')

    var prevOutScriptScriptHash = bscript.decompile(input.prevOutScript)[1]
    if (!prevOutScriptScriptHash.equals(redeemScriptHash)) throw new Error('Inconsistent hash160(RedeemScript)')
  }
}

function checkP2WSHInput (input, witnessScriptHash) {
  if (input.prevOutType) {
    if (input.prevOutType !== scriptTypes.P2WSH) throw new Error('PrevOutScript must be P2WSH')

    var scriptHash = bscript.decompile(input.prevOutScript)[1]
    if (!scriptHash.equals(witnessScriptHash)) throw new Error('Inconsistent sha25(WitnessScript)')
  }
}

function prepareInput (input, kpPubKey, redeemScript, witnessValue, witnessScript) {
  var expanded
  var prevOutType
  var prevOutScript

  var p2sh = false
  var p2shType
  var redeemScriptHash

  var witness = false
  var p2wsh = false
  var witnessType
  var witnessScriptHash

  var signType
  var signScript

  if (redeemScript && witnessScript) {
    redeemScriptHash = bcrypto.hash160(redeemScript)
    witnessScriptHash = bcrypto.sha256(witnessScript)
    checkP2SHInput(input, redeemScriptHash)

    if (!redeemScript.equals(btemplates.witnessScriptHash.output.encode(witnessScriptHash))) throw new Error('Witness script inconsistent with redeem script')

    expanded = expandOutput(witnessScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('WitnessScript not supported "' + bscript.toASM(redeemScript) + '"')

    prevOutType = btemplates.types.P2SH
    prevOutScript = btemplates.scriptHash.output.encode(redeemScriptHash)
    p2sh = witness = p2wsh = true
    p2shType = btemplates.types.P2WSH
    signType = witnessType = expanded.scriptType
    signScript = witnessScript
  } else if (redeemScript) {
    redeemScriptHash = bcrypto.hash160(redeemScript)
    checkP2SHInput(input, redeemScriptHash)

    expanded = expandOutput(redeemScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('RedeemScript not supported "' + bscript.toASM(redeemScript) + '"')

    prevOutType = btemplates.types.P2SH
    prevOutScript = btemplates.scriptHash.output.encode(redeemScriptHash)
    p2sh = true
    signType = p2shType = expanded.scriptType
    signScript = redeemScript
    witness = signType === btemplates.types.P2WPKH
  } else if (witnessScript) {
    witnessScriptHash = bcrypto.sha256(witnessScript)
    checkP2WSHInput(input, witnessScriptHash)

    expanded = expandOutput(witnessScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('WitnessScript not supported "' + bscript.toASM(redeemScript) + '"')

    prevOutType = btemplates.types.P2WSH
    prevOutScript = btemplates.witnessScriptHash.output.encode(witnessScriptHash)
    witness = p2wsh = true
    signType = witnessType = expanded.scriptType
    signScript = witnessScript
  } else if (input.prevOutType) {
    // embedded scripts are not possible without a redeemScript
    if (input.prevOutType === scriptTypes.P2SH ||
      input.prevOutType === scriptTypes.P2WSH) {
      throw new Error('PrevOutScript is ' + input.prevOutType + ', requires redeemScript')
    }

    prevOutType = input.prevOutType
    prevOutScript = input.prevOutScript
    expanded = expandOutput(input.prevOutScript, input.prevOutType, kpPubKey)
    if (!expanded.pubKeys) return

    witness = (input.prevOutType === scriptTypes.P2WPKH)
    signType = prevOutType
    signScript = prevOutScript
  } else {
    prevOutScript = btemplates.pubKeyHash.output.encode(bcrypto.hash160(kpPubKey))
    expanded = expandOutput(prevOutScript, scriptTypes.P2PKH, kpPubKey)

    prevOutType = scriptTypes.P2PKH
    witness = false
    signType = prevOutType
    signScript = prevOutScript
  }

  if (signType === scriptTypes.P2WPKH) {
    signScript = btemplates.pubKeyHash.output.encode(btemplates.witnessPubKeyHash.output.decode(signScript))
  }

  if (p2sh) {
    input.redeemScript = redeemScript
    input.redeemScriptType = p2shType
  }

  if (p2wsh) {
    input.witnessScript = witnessScript
    input.witnessScriptType = witnessType
  }

  input.pubKeys = expanded.pubKeys
  input.signatures = expanded.signatures
  input.signScript = signScript
  input.signType = signType
  input.prevOutScript = prevOutScript
  input.prevOutType = prevOutType
  input.witness = witness
}

function buildStack (type, signatures, pubKeys, allowIncomplete) {
  if (type === scriptTypes.P2PKH) {
    if (signatures.length === 1 && Buffer.isBuffer(signatures[0]) && pubKeys.length === 1) return btemplates.pubKeyHash.input.encodeStack(signatures[0], pubKeys[0])
  } else if (type === scriptTypes.P2PK) {
    if (signatures.length === 1 && Buffer.isBuffer(signatures[0])) return btemplates.pubKey.input.encodeStack(signatures[0])
  } else if (type === scriptTypes.MULTISIG) {
    if (signatures.length > 0) {
      signatures = signatures.map(function (signature) {
        return signature || ops.OP_0
      })
      if (!allowIncomplete) {
        // remove blank signatures
        signatures = signatures.filter(function (x) { return x !== ops.OP_0 })
      }

      return btemplates.multisig.input.encodeStack(signatures)
    }
  } else {
    throw new Error('Not yet supported')
  }

  if (!allowIncomplete) throw new Error('Not enough signatures provided')
  return []
}

function buildInput (input, allowIncomplete) {
  var scriptType = input.prevOutType
  var sig = []
  var witness = []

  if (supportedType(scriptType)) {
    sig = buildStack(scriptType, input.signatures, input.pubKeys, allowIncomplete)
  }

  var p2sh = false
  if (scriptType === btemplates.types.P2SH) {
    // We can remove this error later when we have a guarantee prepareInput
    // rejects unsignable scripts - it MUST be signable at this point.
    if (!allowIncomplete && !supportedP2SHType(input.redeemScriptType)) {
      throw new Error('Impossible to sign this type')
    }

    if (supportedType(input.redeemScriptType)) {
      sig = buildStack(input.redeemScriptType, input.signatures, input.pubKeys, allowIncomplete)
    }

    // If it wasn't SIGNABLE, it's witness, defer to that
    if (input.redeemScriptType) {
      p2sh = true
      scriptType = input.redeemScriptType
    }
  }

  switch (scriptType) {
    // P2WPKH is a special case of P2PKH
    case btemplates.types.P2WPKH:
      witness = buildStack(btemplates.types.P2PKH, input.signatures, input.pubKeys, allowIncomplete)
      break

    case btemplates.types.P2WSH:
      // We can remove this check later
      if (!allowIncomplete && !supportedType(input.witnessScriptType)) {
        throw new Error('Impossible to sign this type')
      }

      if (supportedType(input.witnessScriptType)) {
        witness = buildStack(input.witnessScriptType, input.signatures, input.pubKeys, allowIncomplete)
        witness.push(input.witnessScript)
        scriptType = input.witnessScriptType
      }

      break
  }

  // append redeemScript if necessary
  if (p2sh) {
    sig.push(input.redeemScript)
  }

  return {
    type: scriptType,
    script: bscript.compile(sig),
    witness: witness
  }
}

function TransactionBuilder (network, maximumFeeRate) {
  this.prevTxMap = {}
  this.network = network || networks.bitcoin

  // WARNING: This is __NOT__ to be relied on, its just another potential safety mechanism (safety in-depth)
  this.maximumFeeRate = maximumFeeRate || 2500

  this.inputs = []
  this.tx = new Transaction()

  if (this.network.txversion !== undefined) {
    this.setVersion(this.network.txversion)
  }
  if (this.network.versionGroupId !== undefined) {
    this.setVersionGroupId(this.network.versionGroupId)
  }
}

TransactionBuilder.prototype.setExpiry = function (expiry) {
  typeforce(types.UInt32, expiry)

  this.tx.expiry = expiry
}

TransactionBuilder.prototype.setVersionGroupId = function (versiongroupid) {
  typeforce(types.UInt32, versiongroupid)

  this.tx.versiongroupid = versiongroupid
}

TransactionBuilder.prototype.setLockTime = function (locktime) {
  typeforce(types.UInt32, locktime)

  // if any signatures exist, throw
  if (this.inputs.some(function (input) {
    if (!input.signatures) return false

    return input.signatures.some(function (s) { return s })
  })) {
    throw new Error('No, this would invalidate signatures')
  }

  this.tx.locktime = locktime
}

TransactionBuilder.prototype.setVersion = function (version) {
  typeforce(types.UInt32, version)

  // XXX: this might eventually become more complex depending on what the versions represent
  this.tx.version = version
}

TransactionBuilder.fromTransaction = function (transaction, network) {
  var txb = new TransactionBuilder(network)

  // Copy transaction fields
  var version = transaction.version & 0x7fffffff
  txb.setVersion(transaction.version)
  txb.setLockTime(transaction.locktime)
  if (version >= 3) {
    txb.setVersionGroupId(transaction.versiongroupid)
    txb.setExpiry(transaction.expiry)
  }

  // Copy outputs (done first to avoid signature invalidation)
  transaction.outs.forEach(function (txOut) {
    txb.addOutput(txOut.script, txOut.value)
  })

  // Copy inputs
  transaction.ins.forEach(function (txIn) {
    txb.__addInputUnsafe(txIn.hash, txIn.index, {
      sequence: txIn.sequence,
      script: txIn.script,
      witness: txIn.witness
    })
  })

  // fix some things not possible through the public API
  txb.inputs.forEach(function (input, i) {
    fixMultisigOrder(input, transaction, i)
  })

  return txb
}

TransactionBuilder.prototype.addInput = function (txHash, vout, sequence, prevOutScript) {
  if (!this.__canModifyInputs()) {
    throw new Error('No, this would invalidate signatures')
  }

  var value

  // is it a hex string?
  if (typeof txHash === 'string') {
    // transaction hashs's are displayed in reverse order, un-reverse it
    txHash = Buffer.from(txHash, 'hex').reverse()

  // is it a Transaction object?
  } else if (txHash instanceof Transaction) {
    var txOut = txHash.outs[vout]
    prevOutScript = txOut.script
    value = txOut.value

    txHash = txHash.getHash()
  }

  return this.__addInputUnsafe(txHash, vout, {
    sequence: sequence,
    prevOutScript: prevOutScript,
    value: value
  })
}

TransactionBuilder.prototype.__addInputUnsafe = function (txHash, vout, options) {
  if (Transaction.isCoinbaseHash(txHash)) {
    throw new Error('coinbase inputs not supported')
  }

  var prevTxOut = txHash.toString('hex') + ':' + vout
  if (this.prevTxMap[prevTxOut] !== undefined) throw new Error('Duplicate TxOut: ' + prevTxOut)

  var input = {}

  // derive what we can from the scriptSig
  if (options.script !== undefined) {
    input = expandInput(options.script, options.witness || [])
  }

  // if an input value was given, retain it
  if (options.value !== undefined) {
    input.value = options.value
  }

  // derive what we can from the previous transactions output script
  if (!input.prevOutScript && options.prevOutScript) {
    var prevOutType

    if (!input.pubKeys && !input.signatures) {
      var expanded = expandOutput(options.prevOutScript)

      if (expanded.pubKeys) {
        input.pubKeys = expanded.pubKeys
        input.signatures = expanded.signatures
      }

      prevOutType = expanded.scriptType
    }

    input.prevOutScript = options.prevOutScript
    input.prevOutType = prevOutType || btemplates.classifyOutput(options.prevOutScript)
  }

  var vin = this.tx.addInput(txHash, vout, options.sequence, options.scriptSig)
  this.inputs[vin] = input
  this.prevTxMap[prevTxOut] = vin
  return vin
}

TransactionBuilder.prototype.addOutput = function (scriptPubKey, value) {
  if (!this.__canModifyOutputs()) {
    throw new Error('No, this would invalidate signatures')
  }

  // Attempt to get a script if it's a base58 address string
  if (typeof scriptPubKey === 'string') {
    scriptPubKey = baddress.toOutputScript(scriptPubKey, this.network)
  }

  return this.tx.addOutput(scriptPubKey, value)
}

TransactionBuilder.prototype.build = function () {
  return this.__build(false)
}
TransactionBuilder.prototype.buildIncomplete = function () {
  return this.__build(true)
}

TransactionBuilder.prototype.__build = function (allowIncomplete) {
  if (!allowIncomplete) {
    if (!this.tx.ins.length) throw new Error('Transaction has no inputs')
    if (!this.tx.outs.length) throw new Error('Transaction has no outputs')
  }

  var tx = this.tx.clone()
  // Create script signatures from inputs
  this.inputs.forEach(function (input, i) {
    var scriptType = input.witnessScriptType || input.redeemScriptType || input.prevOutType
    if (!scriptType && !allowIncomplete) throw new Error('Transaction is not complete')
    var result = buildInput(input, allowIncomplete)

    // skip if no result
    if (!allowIncomplete) {
      if (!supportedType(result.type) && result.type !== btemplates.types.P2WPKH) {
        throw new Error(result.type + ' not supported')
      }
    }

    tx.setInputScript(i, result.script)
    tx.setWitness(i, result.witness)
  })

  if (!allowIncomplete) {
    // do not rely on this, its merely a last resort
    if (this.__overMaximumFees(tx.virtualSize())) {
      throw new Error('Transaction has absurd fees')
    }
  }

  return tx
}

function canSign (input) {
  return input.prevOutScript !== undefined &&
    input.signScript !== undefined &&
    input.pubKeys !== undefined &&
    input.signatures !== undefined &&
    input.signatures.length === input.pubKeys.length &&
    input.pubKeys.length > 0 &&
    (
      input.witness === false ||
      (input.witness === true && input.value !== undefined)
    )
}

TransactionBuilder.prototype.sign = function (vin, keyPair, redeemScript, hashType, witnessValue, witnessScript, overwintered) {
  // TODO: remove keyPair.network matching in 4.0.0
  if (keyPair.network && keyPair.network !== this.network) throw new TypeError('Inconsistent network')
  if (!this.inputs[vin]) throw new Error('No input at index: ' + vin)
  hashType = hashType || Transaction.SIGHASH_ALL

  var input = this.inputs[vin]

  // if redeemScript was previously provided, enforce consistency
  if (input.redeemScript !== undefined &&
      redeemScript &&
      !input.redeemScript.equals(redeemScript)) {
    throw new Error('Inconsistent redeemScript')
  }

  var kpPubKey = keyPair.publicKey || keyPair.getPublicKeyBuffer()
  if (!canSign(input)) {
    if (witnessValue !== undefined) {
      if (input.value !== undefined && input.value !== witnessValue) throw new Error('Input didn\'t match witnessValue')
      typeforce(types.Satoshi, witnessValue)
      input.value = witnessValue
    }

    if (!canSign(input)) prepareInput(input, kpPubKey, redeemScript, witnessValue, witnessScript)
    if (!canSign(input)) throw Error(input.prevOutType + ' not supported')
  }

  // ready to sign
  var signatureHash
  if (input.witness) {
    signatureHash = this.tx.hashForWitnessV0(vin, input.signScript, input.value, hashType)
  } else if (overwintered) {
    signatureHash = this.tx.hashForZIP143(vin, input.signScript, witnessValue, hashType)
  } else {
    signatureHash = this.tx.hashForSignature(vin, input.signScript, hashType)
  }

  // enforce in order signing of public keys
  var signed = input.pubKeys.some(function (pubKey, i) {
    if (!kpPubKey.equals(pubKey)) return false
    if (input.signatures[i]) throw new Error('Signature already exists')
    if (kpPubKey.length !== 33 &&
      input.signType === scriptTypes.P2WPKH) throw new Error('BIP143 rejects uncompressed public keys in P2WPKH or P2WSH')

    var signature = keyPair.sign(signatureHash)
    if (Buffer.isBuffer(signature)) signature = ECSignature.fromRSBuffer(signature)

    input.signatures[i] = signature.toScriptSignature(hashType)
    return true
  })

  if (!signed) throw new Error('Key pair cannot sign for this input')
}

function signatureHashType (buffer) {
  return buffer.readUInt8(buffer.length - 1)
}

TransactionBuilder.prototype.__canModifyInputs = function () {
  return this.inputs.every(function (input) {
    // any signatures?
    if (input.signatures === undefined) return true

    return input.signatures.every(function (signature) {
      if (!signature) return true
      var hashType = signatureHashType(signature)

      // if SIGHASH_ANYONECANPAY is set, signatures would not
      // be invalidated by more inputs
      return hashType & Transaction.SIGHASH_ANYONECANPAY
    })
  })
}

TransactionBuilder.prototype.__canModifyOutputs = function () {
  var nInputs = this.tx.ins.length
  var nOutputs = this.tx.outs.length

  return this.inputs.every(function (input) {
    if (input.signatures === undefined) return true

    return input.signatures.every(function (signature) {
      if (!signature) return true
      var hashType = signatureHashType(signature)

      var hashTypeMod = hashType & 0x1f
      if (hashTypeMod === Transaction.SIGHASH_NONE) return true
      if (hashTypeMod === Transaction.SIGHASH_SINGLE) {
        // if SIGHASH_SINGLE is set, and nInputs > nOutputs
        // some signatures would be invalidated by the addition
        // of more outputs
        return nInputs <= nOutputs
      }
    })
  })
}

TransactionBuilder.prototype.__overMaximumFees = function (bytes) {
  // not all inputs will have .value defined
  var incoming = this.inputs.reduce(function (a, x) { return a + (x.value >>> 0) }, 0)

  // but all outputs do, and if we have any input value
  // we can immediately determine if the outputs are too small
  var outgoing = this.tx.outs.reduce(function (a, x) { return a + x.value }, 0)
  var fee = incoming - outgoing
  var feeRate = fee / bytes

  return feeRate > this.maximumFeeRate
}

module.exports = TransactionBuilder


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {/***
 * @license
 * https://github.com/bitcoincashjs/bchaddr
 * Copyright (c) 2018 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */

var bs58check = __webpack_require__(17)
var cashaddr = __webpack_require__(128)

/**
 * General purpose Bitcoin Cash address detection and translation.<br />
 * Supports all major Bitcoin Cash address formats.<br />
 * Currently:
 * <ul>
 *    <li> Legacy format </li>
 *    <li> Bitpay format </li>
 *    <li> Cashaddr format </li>
 * </ul>
 * @module bchaddr
 */

/**
 * @static
 * Supported Bitcoin Cash address formats.
 */
var Format = {}
Format.Legacy = 'legacy'
Format.Bitpay = 'bitpay'
Format.Cashaddr = 'cashaddr'

/**
 * @static
 * Supported networks.
 */
var Network = {}
Network.Mainnet = 'mainnet'
Network.Testnet = 'testnet'

/**
 * @static
 * Supported address types.
 */
var Type = {}
Type.P2PKH = 'p2pkh'
Type.P2SH = 'p2sh'

/**
 * Detects what is the given address' format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function detectAddressFormat (address) {
  return decodeAddress(address).format
}

/**
 * Detects what is the given address' network.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function detectAddressNetwork (address) {
  return decodeAddress(address).network
}

/**
 * Detects what is the given address' type.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function detectAddressType (address) {
  return decodeAddress(address).type
}

/**
 * Translates the given address into legacy format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function toLegacyAddress (address) {
  var decoded = decodeAddress(address)
  if (decoded.format === Format.Legacy) {
    return address
  }
  return encodeAsLegacy(decoded)
}

/**
 * Translates the given address into bitpay format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function toBitpayAddress (address) {
  var decoded = decodeAddress(address)
  if (decoded.format === Format.Bitpay) {
    return address
  }
  return encodeAsBitpay(decoded)
}

/**
 * Translates the given address into cashaddr format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function toCashAddress (address) {
  var decoded = decodeAddress(address)
  return encodeAsCashaddr(decoded)
}

/**
 * Version byte table for base58 formats.
 * @private
 */
var VERSION_BYTE = {}
VERSION_BYTE[Format.Legacy] = {}
VERSION_BYTE[Format.Legacy][Network.Mainnet] = {}
VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2PKH] = 0
VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2SH] = 5
VERSION_BYTE[Format.Legacy][Network.Testnet] = {}
VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2PKH] = 111
VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2SH] = 196
VERSION_BYTE[Format.Bitpay] = {}
VERSION_BYTE[Format.Bitpay][Network.Mainnet] = {}
VERSION_BYTE[Format.Bitpay][Network.Mainnet][Type.P2PKH] = 28
VERSION_BYTE[Format.Bitpay][Network.Mainnet][Type.P2SH] = 40
VERSION_BYTE[Format.Bitpay][Network.Testnet] = {}
VERSION_BYTE[Format.Bitpay][Network.Testnet][Type.P2PKH] = 111
VERSION_BYTE[Format.Bitpay][Network.Testnet][Type.P2SH] = 196

/**
 * Decodes the given address into its constituting hash, format, network and type.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeAddress (address) {
  try {
    return decodeBase58Address(address)
  } catch (error) {
  }
  try {
    return decodeCashAddress(address)
  } catch (error) {
  }
  throw new InvalidAddressError()
}

/**
 * Length of a valid base58check encoding payload: 1 byte for
 * the version byte plus 20 bytes for a RIPEMD-160 hash.
 * @private
 */
var BASE_58_CHECK_PAYLOAD_LENGTH = 21

/**
 * Attempts to decode the given address assuming it is a base58 address.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeBase58Address (address) {
  try {
    var payload = bs58check.decode(address)
    if (payload.length !== BASE_58_CHECK_PAYLOAD_LENGTH) {
      throw new InvalidAddressError()
    }
    var versionByte = payload[0]
    var hash = Array.prototype.slice.call(payload, 1)
    switch (versionByte) {
      case VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2PKH]:
        return {
          hash: hash,
          format: Format.Legacy,
          network: Network.Mainnet,
          type: Type.P2PKH
        }
      case VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2SH]:
        return {
          hash: hash,
          format: Format.Legacy,
          network: Network.Mainnet,
          type: Type.P2SH
        }
      case VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2PKH]:
        return {
          hash: hash,
          format: Format.Legacy,
          network: Network.Testnet,
          type: Type.P2PKH
        }
      case VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2SH]:
        return {
          hash: hash,
          format: Format.Legacy,
          network: Network.Testnet,
          type: Type.P2SH
        }
      case VERSION_BYTE[Format.Bitpay][Network.Mainnet][Type.P2PKH]:
        return {
          hash: hash,
          format: Format.Bitpay,
          network: Network.Mainnet,
          type: Type.P2PKH
        }
      case VERSION_BYTE[Format.Bitpay][Network.Mainnet][Type.P2SH]:
        return {
          hash: hash,
          format: Format.Bitpay,
          network: Network.Mainnet,
          type: Type.P2SH
        }
    }
  } catch (error) {
  }
  throw new InvalidAddressError()
}

/**
 * Attempts to decode the given address assuming it is a cashaddr address.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeCashAddress (address) {
  if (address.indexOf(':') !== -1) {
    try {
      return decodeCashAddressWithPrefix(address)
    } catch (error) {
    }
  } else {
    var prefixes = ['bitcoincash', 'bchtest', 'regtest']
    for (var i = 0; i < prefixes.length; ++i) {
      try {
        var prefix = prefixes[i]
        return decodeCashAddressWithPrefix(prefix + ':' + address)
      } catch (error) {
      }
    }
  }
  throw new InvalidAddressError()
}

/**
 * Attempts to decode the given address assuming it is a cashaddr address with explicit prefix.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeCashAddressWithPrefix (address) {
  try {
    var decoded = cashaddr.decode(address)
    var hash = Array.prototype.slice.call(decoded.hash, 0)
    var type = decoded.type === 'P2PKH' ? Type.P2PKH : Type.P2SH
    switch (decoded.prefix) {
      case 'bitcoincash':
        return {
          hash: hash,
          format: Format.Cashaddr,
          network: Network.Mainnet,
          type: type
        }
      case 'bchtest':
      case 'regtest':
        return {
          hash: hash,
          format: Format.Cashaddr,
          network: Network.Testnet,
          type: type
        }
    }
  } catch (error) {
  }
  throw new InvalidAddressError()
}

/**
 * Encodes the given decoded address into legacy format.
 * @private
 * @param {object} decoded
 * @returns {string}
 */
function encodeAsLegacy (decoded) {
  var versionByte = VERSION_BYTE[Format.Legacy][decoded.network][decoded.type]
  var buffer = Buffer.alloc(1 + decoded.hash.length)
  buffer[0] = versionByte
  buffer.set(decoded.hash, 1)
  return bs58check.encode(buffer)
}

/**
 * Encodes the given decoded address into bitpay format.
 * @private
 * @param {object} decoded
 * @returns {string}
 */
function encodeAsBitpay (decoded) {
  var versionByte = VERSION_BYTE[Format.Bitpay][decoded.network][decoded.type]
  var buffer = Buffer.alloc(1 + decoded.hash.length)
  buffer[0] = versionByte
  buffer.set(decoded.hash, 1)
  return bs58check.encode(buffer)
}

/**
 * Encodes the given decoded address into cashaddr format.
 * @private
 * @param {object} decoded
 * @returns {string}
 */
function encodeAsCashaddr (decoded) {
  var prefix = decoded.network === Network.Mainnet ? 'bitcoincash' : 'bchtest'
  var type = decoded.type === Type.P2PKH ? 'P2PKH' : 'P2SH'
  var hash = Uint8Array.from(decoded.hash)
  return cashaddr.encode(prefix, type, hash)
}

/**
 * Returns a boolean indicating whether the address is in legacy format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isLegacyAddress (address) {
  return detectAddressFormat(address) === Format.Legacy
}

/**
 * Returns a boolean indicating whether the address is in bitpay format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isBitpayAddress (address) {
  return detectAddressFormat(address) === Format.Bitpay
}

/**
 * Returns a boolean indicating whether the address is in cashaddr format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isCashAddress (address) {
  return detectAddressFormat(address) === Format.Cashaddr
}

/**
 * Returns a boolean indicating whether the address is a mainnet address.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isMainnetAddress (address) {
  return detectAddressNetwork(address) === Network.Mainnet
}

/**
 * Returns a boolean indicating whether the address is a testnet address.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isTestnetAddress (address) {
  return detectAddressNetwork(address) === Network.Testnet
}

/**
 * Returns a boolean indicating whether the address is a p2pkh address.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isP2PKHAddress (address) {
  return detectAddressType(address) === Type.P2PKH
}

/**
 * Returns a boolean indicating whether the address is a p2sh address.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @returns {boolean}
 * @throws {InvalidAddressError}
 */
function isP2SHAddress (address) {
  return detectAddressType(address) === Type.P2SH
}

/**
 * Error thrown when the address given as input is not a valid Bitcoin Cash address.
 * @constructor
 * InvalidAddressError
 */
function InvalidAddressError () {
  var error = new Error()
  this.name = error.name = 'InvalidAddressError'
  this.message = error.message = 'Received an invalid Bitcoin Cash address as input.'
  this.stack = error.stack
}

InvalidAddressError.prototype = Object.create(Error.prototype)

module.exports = {
  Format: Format,
  Network: Network,
  Type: Type,
  detectAddressFormat: detectAddressFormat,
  detectAddressNetwork: detectAddressNetwork,
  detectAddressType: detectAddressType,
  toLegacyAddress: toLegacyAddress,
  toBitpayAddress: toBitpayAddress,
  toCashAddress: toCashAddress,
  isLegacyAddress: isLegacyAddress,
  isBitpayAddress: isBitpayAddress,
  isCashAddress: isCashAddress,
  isMainnetAddress: isMainnetAddress,
  isTestnetAddress: isTestnetAddress,
  isP2PKHAddress: isP2PKHAddress,
  isP2SHAddress: isP2SHAddress,
  InvalidAddressError: InvalidAddressError
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license
 * https://github.com/bitcoincashjs/cashaddr
 * Copyright (c) 2017-2018 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */



var base32 = __webpack_require__(129);
var bigInt = __webpack_require__(130);
var convertBits = __webpack_require__(132);
var validation = __webpack_require__(36);
var validate = validation.validate;

/**
 * Encoding and decoding of the new Cash Address format for Bitcoin Cash. <br />
 * Compliant with the original cashaddr specification:
 * {@link https://github.com/Bitcoin-UAHF/spec/blob/master/cashaddr.md}
 * @module cashaddr
 */

/**
 * Encodes a hash from a given type into a Bitcoin Cash address with the given prefix.
 * 
 * @static
 * @param {string} prefix Network prefix. E.g.: 'bitcoincash'.
 * @param {string} type Type of address to generate. Either 'P2PKH' or 'P2SH'.
 * @param {Uint8Array} hash Hash to encode represented as an array of 8-bit integers.
 * @returns {string}
 * @throws {ValidationError}
 */
function encode(prefix, type, hash) {
  validate(typeof prefix === 'string' && isValidPrefix(prefix), 'Invalid prefix: ' + prefix + '.');
  validate(typeof type === 'string', 'Invalid type: ' + type + '.');
  validate(hash instanceof Uint8Array, 'Invalid hash: ' + hash + '.');
  var prefixData = concat(prefixToUint5Array(prefix), new Uint8Array(1));
  var versionByte = getTypeBits(type) + getHashSizeBits(hash);
  var payloadData = toUint5Array(concat(Uint8Array.of(versionByte), hash));
  var checksumData = concat(concat(prefixData, payloadData), new Uint8Array(8));
  var payload = concat(payloadData, checksumToUint5Array(polymod(checksumData)));
  return prefix + ':' + base32.encode(payload);
}

/**
 * Decodes the given address into its constituting prefix, type and hash. See [#encode()]{@link encode}.
 * 
 * @static
 * @param {string} address Address to decode. E.g.: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'.
 * @returns {object}
 * @throws {ValidationError}
 */
function decode(address) {
  validate(typeof address === 'string' && hasSingleCase(address), 'Invalid address: ' + address + '.');
  var pieces = address.toLowerCase().split(':');
  validate(pieces.length === 2, 'Missing prefix: ' + address + '.');
  var prefix = pieces[0];
  var payload = base32.decode(pieces[1]);
  validate(validChecksum(prefix, payload), 'Invalid checksum: ' + address + '.');
  var payloadData = fromUint5Array(payload.slice(0, -8));
  var versionByte = payloadData[0];
  var hash = payloadData.slice(1);
  validate(getHashSize(versionByte) === hash.length * 8, 'Invalid hash size: ' + address + '.');
  var type = getType(versionByte);
  return {
    prefix: prefix,
    type: type,
    hash: hash,
  };
}

/**
 * Error thrown when encoding or decoding fail due to invalid input.
 *
 * @constructor ValidationError
 * @param {string} message Error description.
 */
var ValidationError = validation.ValidationError;

/**
 * Valid address prefixes.
 *
 * @private
 */
var VALID_PREFIXES = ['bitcoincash', 'bchtest', 'bchreg'];

/**
 * Checks whether a string is a valid prefix; ie., it has a single letter case
 * and is one of 'bitcoincash', 'bchtest', or 'bchreg'.
 *
 * @private
 * @param {string} prefix 
 * @returns {boolean}
 */
function isValidPrefix(prefix) {
  return hasSingleCase(prefix) && VALID_PREFIXES.indexOf(prefix.toLowerCase()) !== -1;
}

/**
 * Derives an array from the given prefix to be used in the computation
 * of the address' checksum.
 *
 * @private
 * @param {string} prefix Network prefix. E.g.: 'bitcoincash'. 
 * @returns {Uint8Array}
 */
function prefixToUint5Array(prefix) {
  var result = new Uint8Array(prefix.length);
  for (var i = 0; i < prefix.length; ++i) {
    result[i] = prefix[i].charCodeAt(0) & 31;
  }
  return result;
}

/**
 * Returns an array representation of the given checksum to be encoded
 * within the address' payload.
 *
 * @private
 * @param {BigInteger} checksum Computed checksum.
 * @returns {Uint8Array}
 */
function checksumToUint5Array(checksum) {
  var result = new Uint8Array(8);
  for (var i = 0; i < 8; ++i) {
    result[7 - i] = checksum.and(31).toJSNumber();
    checksum = checksum.shiftRight(5);
  }
  return result;
}

/**
 * Returns the bit representation of the given type within the version
 * byte.
 *
 * @private
 * @param {string} type Address type. Either 'P2PKH' or 'P2SH'.
 * @returns {number}
 * @throws {ValidationError}
 */
function getTypeBits(type) {
  switch (type) {
  case 'P2PKH':
    return 0;
  case 'P2SH':
    return 8;
  default:
    throw new ValidationError('Invalid type: ' + type + '.');
  }
}

/**
 * Retrieves the address type from its bit representation within the
 * version byte.
 *
 * @private
 * @param {number} versionByte
 * @returns {string}
 * @throws {ValidationError}
 */
function getType(versionByte) {
  switch (versionByte & 120) {
  case 0:
    return 'P2PKH';
  case 8:
    return 'P2SH';
  default:
    throw new ValidationError('Invalid address type in version byte: ' + versionByte + '.');
  }
}

/**
 * Returns the bit representation of the length in bits of the given
 * hash within the version byte.
 *
 * @private
 * @param {Uint8Array} hash Hash to encode represented as an array of 8-bit integers.
 * @returns {number}
 * @throws {ValidationError}
 */
function getHashSizeBits(hash) {
  switch (hash.length * 8) {
  case 160:
    return 0;
  case 192:
    return 1;
  case 224:
    return 2;
  case 256:
    return 3;
  case 320:
    return 4;
  case 384:
    return 5;
  case 448:
    return 6;
  case 512:
    return 7;
  default:
    throw new ValidationError('Invalid hash size: ' + hash.length + '.');
  }
}

/**
 * Retrieves the the length in bits of the encoded hash from its bit
 * representation within the version byte.
 *
 * @private
 * @param {number} versionByte
 * @returns {number}
 */
function getHashSize(versionByte) {
  switch (versionByte & 7) {
  case 0:
    return 160;
  case 1:
    return 192;
  case 2:
    return 224;
  case 3:
    return 256;
  case 4:
    return 320;
  case 5:
    return 384;
  case 6:
    return 448;
  case 7:
    return 512;
  }
}

/**
 * Converts an array of 8-bit integers into an array of 5-bit integers,
 * right-padding with zeroes if necessary.
 *
 * @private
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function toUint5Array(data) {
  return convertBits(data, 8, 5);
}

/**
 * Converts an array of 5-bit integers back into an array of 8-bit integers,
 * removing extra zeroes left from padding if necessary.
 * Throws a {@link ValidationError} if input is not a zero-padded array of 8-bit integers.
 *
 * @private
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 * @throws {ValidationError}
 */
function fromUint5Array(data) {
  return convertBits(data, 5, 8, true);
}

/**
 * Returns the concatenation a and b.
 *
 * @private
 * @param {Uint8Array} a 
 * @param {Uint8Array} b 
 * @returns {Uint8Array}
 * @throws {ValidationError}
 */
function concat(a, b) {
  var ab = new Uint8Array(a.length + b.length);
  ab.set(a);
  ab.set(b, a.length);
  return ab;
}

/**
 * Computes a checksum from the given input data as specified for the CashAddr
 * format: https://github.com/Bitcoin-UAHF/spec/blob/master/cashaddr.md.
 *
 * @private
 * @param {Uint8Array} data Array of 5-bit integers over which the checksum is to be computed.
 * @returns {BigInteger}
 */
function polymod(data) {
  var GENERATOR = [0x98f2bc8e61, 0x79b76d99e2, 0xf33e5fb3c4, 0xae2eabe2a8, 0x1e4f43e470];
  var checksum = bigInt(1);
  for (var i = 0; i < data.length; ++i) {
    var value = data[i];
    var topBits = checksum.shiftRight(35);
    checksum = checksum.and(0x07ffffffff).shiftLeft(5).xor(value);
    for (var j = 0; j < GENERATOR.length; ++j) {
      if (topBits.shiftRight(j).and(1).equals(1)) {
        checksum = checksum.xor(GENERATOR[j]);
      }
    }
  }
  return checksum.xor(1);
}

/**
 * Verify that the payload has not been corrupted by checking that the
 * checksum is valid.
 * 
 * @private
 * @param {string} prefix Network prefix. E.g.: 'bitcoincash'.
 * @param {Uint8Array} payload Array of 5-bit integers containing the address' payload.
 * @returns {boolean}
 */
function validChecksum(prefix, payload) {
  var prefixData = concat(prefixToUint5Array(prefix), new Uint8Array(1));
  var checksumData = concat(prefixData, payload);
  return polymod(checksumData).equals(0);
}

/**
 * Returns true if, and only if, the given string contains either uppercase
 * or lowercase letters, but not both.
 *
 * @private
 * @param {string} string Input string.
 * @returns {boolean}
 */
function hasSingleCase(string) {
  return string === string.toLowerCase() || string === string.toUpperCase();
}

module.exports = {
  encode: encode,
  decode: decode,
  ValidationError: ValidationError,
};


/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license
 * https://github.com/bitcoincashjs/cashaddr
 * Copyright (c) 2017-2018 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */



var validate = __webpack_require__(36).validate;

/**
 * Base32 encoding and decoding.
 *
 * @module base32
 */

/**
 * Charset containing the 32 symbols used in the base32 encoding.
 * @private
 */
var CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * Inverted index mapping each symbol into its index within the charset.
 * @private
 */
var CHARSET_INVERSE_INDEX = {
  'q': 0, 'p': 1, 'z': 2, 'r': 3, 'y': 4, '9': 5, 'x': 6, '8': 7,
  'g': 8, 'f': 9, '2': 10, 't': 11, 'v': 12, 'd': 13, 'w': 14, '0': 15,
  's': 16, '3': 17, 'j': 18, 'n': 19, '5': 20, '4': 21, 'k': 22, 'h': 23,
  'c': 24, 'e': 25, '6': 26, 'm': 27, 'u': 28, 'a': 29, '7': 30, 'l': 31,
};

/**
 * Encodes the given array of 5-bit integers as a base32-encoded string.
 *
 * @static
 * @param {Uint8Array} data Array of integers between 0 and 31 inclusive.
 * @returns {string}
 * @throws {ValidationError}
 */
function encode(data) {
  validate(data instanceof Uint8Array, 'Invalid data: ' + data + '.');
  var base32 = '';
  for (var i = 0; i < data.length; ++i) {
    var value = data[i];
    validate(0 <= value && value < 32, 'Invalid value: ' + value + '.');
    base32 += CHARSET[value];
  }
  return base32;
}

/**
 * Decodes the given base32-encoded string into an array of 5-bit integers.
 *
 * @static
 * @param {string} string
 * @returns {Uint8Array}
 * @throws {ValidationError}
 */
function decode(string) {
  validate(typeof string === 'string', 'Invalid base32-encoded string: ' + string + '.');
  var data = new Uint8Array(string.length);
  for (var i = 0; i < string.length; ++i) {
    var value = string[i];
    validate(value in CHARSET_INVERSE_INDEX, 'Invalid value: ' + value + '.');
    data[i] = CHARSET_INVERSE_INDEX[value];
  }
  return data;
}

module.exports = {
  encode: encode,
  decode: decode,
};


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var bigInt = (function (undefined) {
    "use strict";

    var BASE = 1e7,
        LOG_BASE = 7,
        MAX_INT = 9007199254740992,
        MAX_INT_ARR = smallToArray(MAX_INT),
        DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

    var supportsNativeBigInt = typeof BigInt === "function";

    function Integer(v, radix, alphabet, caseSensitive) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);
        return parseValue(v);
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
    }
    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
    }
    SmallInteger.prototype = Object.create(Integer.prototype);

    function NativeBigInt(value) {
        this.value = value;
    }
    NativeBigInt.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
    }

    function smallToArray(n) { // For performance reasons doesn't reference BASE, need to change this function if BASE changes
        if (n < 1e7)
            return [n];
        if (n < 1e14)
            return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
    }

    function arrayToSmall(arr) { // If BASE changes this function may need to change
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0: return 0;
                case 1: return arr[0];
                case 2: return arr[0] + arr[1] * BASE;
                default: return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
            }
        }
        return arr;
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0);
        v.length = i + 1;
    }

    function createArray(length) { // function shamelessly stolen from Yaffle's library https://github.com/Yaffle/BigInteger
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0;
        }
        return x;
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
    }

    function add(a, b) { // assumes a and b are arrays with a.length >= b.length
        var l_a = a.length,
            l_b = b.length,
            r = new Array(l_a),
            carry = 0,
            base = BASE,
            sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base;
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a);
    }

    function addSmall(a, carry) { // assumes a is array, carry is number with 0 <= carry < MAX_INT
        var l = a.length,
            r = new Array(l),
            base = BASE,
            sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;

    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    NativeBigInt.prototype.add = function (v) {
        return new NativeBigInt(this.value + parseValue(v).value);
    }
    NativeBigInt.prototype.plus = NativeBigInt.prototype.add;

    function subtract(a, b) { // assumes a and b are arrays with a >= b
        var a_l = a.length,
            b_l = b.length,
            r = new Array(a_l),
            borrow = 0,
            base = BASE,
            i, difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1;
            } else borrow = 0;
            r[i] = difference;
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base;
            else {
                r[i++] = difference;
                break;
            }
            r[i] = difference;
        }
        for (; i < a_l; i++) {
            r[i] = a[i];
        }
        trim(r);
        return r;
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a, b);
        } else {
            value = subtract(b, a);
            sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
    }

    function subtractSmall(a, b, sign) { // assumes a is array, b is number with 0 <= b < MAX_INT
        var l = a.length,
            r = new Array(l),
            carry = -b,
            base = BASE,
            i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r);
        } return new BigInteger(r, sign);
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
            return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;

    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;

    NativeBigInt.prototype.subtract = function (v) {
        return new NativeBigInt(this.value - parseValue(v).value);
    }
    NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
    };
    NativeBigInt.prototype.negate = function () {
        return new NativeBigInt(-this.value);
    }

    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false);
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value));
    };
    NativeBigInt.prototype.abs = function () {
        return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
    }


    function multiplyLong(a, b) {
        var a_l = a.length,
            b_l = b.length,
            l = a_l + b_l,
            r = createArray(l),
            base = BASE,
            product, carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    function multiplySmall(a, b) { // assumes a is array, b is number with |b| < BASE
        var l = a.length,
            r = new Array(l),
            base = BASE,
            carry = 0,
            product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);

        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);

        var b = x.slice(n),
            a = x.slice(0, n),
            d = y.slice(n),
            c = y.slice(0, n);

        var ac = multiplyKaratsuba(a, c),
            bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));

        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
    }

    // The following function is derived from a surface fit of a graph plotting the performance difference
    // between long multiplication and karatsuba multiplication versus the lengths of the two arrays.
    function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 0.000015 * l1 * l2 > 0;
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v),
            a = this.value, b = n.value,
            sign = this.sign !== n.sign,
            abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign);
            }
            b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length)) // Karatsuba is only faster for certain array sizes
            return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
    };

    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) { // a >= 0
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
    }
    SmallInteger.prototype._multiplyBySmall = function (a) {
        if (isPrecise(a.value * this.value)) {
            return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this);
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    NativeBigInt.prototype.multiply = function (v) {
        return new NativeBigInt(this.value * parseValue(v).value);
    }
    NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;

    function square(a) {
        //console.assert(2 * BASE * BASE < MAX_INT);
        var l = a.length,
            r = createArray(l + l),
            base = BASE,
            product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            carry = 0 - a_i * a_i;
            for (var j = i; j < l; j++) {
                a_j = a[j];
                product = 2 * (a_i * a_j) + r[i + j] + carry;
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
            }
            r[i + l] = carry;
        }
        trim(r);
        return r;
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false);
    };

    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
    };

    NativeBigInt.prototype.square = function (v) {
        return new NativeBigInt(this.value * this.value);
    }

    function divMod1(a, b) { // Left over from previous version. Performs faster than divMod2 on smaller input sizes.
        var a_l = a.length,
            b_l = b.length,
            base = BASE,
            result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            // normalization
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda),
            divisor = multiplySmall(b, lambda),
            quotientDigit, shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
                quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
            }
            // quotientDigit <= base - 1
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1;
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0;
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0;
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1;
                    }
                }
                borrow += carry;
            }
            result[shift] = quotientDigit;
        }
        // denormalization
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
    }

    function divMod2(a, b) { // Implementation idea shamelessly stolen from Silent Matt's library http://silentmatt.com/biginteger/
        // Performs faster than divMod1 on larger input sizes.
        var a_l = a.length,
            b_l = b.length,
            result = [],
            part = [],
            base = BASE,
            guess, xlen, highx, highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue;
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base;
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--;
            } while (guess);
            result.push(guess);
            part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
    }

    function divModSmall(value, lambda) {
        var length = value.length,
            quotient = createArray(length),
            base = BASE,
            i, q, remainder, divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0;
        }
        return [quotient, remainder | 0];
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        if (supportsNativeBigInt) {
            return [new NativeBigInt(self.value / n.value), new NativeBigInt(self.value % n.value)];
        }
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
            }
            return [Integer[0], self];
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)];
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
            }
            b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];

        // divMod1 is faster on smaller input sizes
        if (a.length + b.length <= 200)
            value = divMod1(a, b);
        else value = divMod2(a, b);

        quotient = value[0];
        var qSign = self.sign !== n.sign,
            mod = value[1],
            mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod);
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod];
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {
            quotient: result[0],
            remainder: result[1]
        };
    };
    NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;


    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0];
    };
    NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function (v) {
        return new NativeBigInt(this.value / parseValue(v).value);
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;

    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1];
    };
    NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function (v) {
        return new NativeBigInt(this.value % parseValue(v).value);
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;

    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value,
            value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b)))
                return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b;
            }
            if (b === 0) break;
            b /= 2;
            x = x.square();
        }
        return y;
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;

    NativeBigInt.prototype.pow = function (v) {
        var n = parseValue(v);
        var a = this.value, b = n.value;
        var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2);
        if (b === _0) return Integer[1];
        if (a === _0) return Integer[0];
        if (a === _1) return Integer[1];
        if (a === BigInt(-1)) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.isNegative()) return new NativeBigInt(_0);
        var x = this;
        var y = Integer[1];
        while (true) {
            if ((b & _1) === _1) {
                y = y.times(x);
                --b;
            }
            if (b === _0) break;
            b /= _2;
            x = x.square();
        }
        return y;
    }

    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1],
            base = this.mod(mod);
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
        }
        return 0;
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = Math.abs(this.value),
            b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
    };
    NativeBigInt.prototype.compareAbs = function (v) {
        var a = this.value;
        var b = parseValue(v).value;
        a = a >= 0 ? a : -a;
        b = b >= 0 ? b : -b;
        return a === b ? 0 : a > b ? 1 : -1;
    }

    BigInteger.prototype.compare = function (v) {
        // See discussion about comparison with Infinity:
        // https://github.com/peterolson/BigInteger.js/issues/61
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;

    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;

    NativeBigInt.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }
        var a = this.value;
        var b = parseValue(v).value;
        return a === b ? 0 : a > b ? 1 : -1;
    }
    NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;

    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0;
    };
    NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;

    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0;
    };
    NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0;
    };
    NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;

    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0;
    };
    NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;

    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0;
    };
    NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;

    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0;
    };
    NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;

    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0;
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0;
    };
    NativeBigInt.prototype.isEven = function () {
        return (this.value & BigInt(1)) === BigInt(0);
    }

    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1;
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1;
    };
    NativeBigInt.prototype.isOdd = function () {
        return (this.value & BigInt(1)) === BigInt(1);
    }

    BigInteger.prototype.isPositive = function () {
        return !this.sign;
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0;
    };
    NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;

    BigInteger.prototype.isNegative = function () {
        return this.sign;
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0;
    };
    NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;

    BigInteger.prototype.isUnit = function () {
        return false;
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1;
    };
    NativeBigInt.prototype.isUnit = function () {
        return this.abs().value === BigInt(1);
    }

    BigInteger.prototype.isZero = function () {
        return false;
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0;
    };
    NativeBigInt.prototype.isZero = function () {
        return this.value === BigInt(0);
    }

    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        if (n.isZero()) return false;
        if (n.isUnit()) return true;
        if (n.compareAbs(2) === 0) return this.isEven();
        return this.mod(n).isZero();
    };
    NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(49)) return true;
        // we don't know if it's prime: let the other functions figure it out
    }

    function millerRabinTest(n, a) {
        var nPrev = n.prev(),
            b = nPrev,
            r = 0,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2), r++;
        next: for (i = 0; i < a.length; i++) {
            if (n.lesser(a[i])) continue;
            x = bigInt(a[i]).modPow(b, n);
            if (x.isUnit() || x.equals(nPrev)) continue;
            for (d = r - 1; d != 0; d--) {
                x = x.square().mod(n);
                if (x.isUnit()) return false;
                if (x.equals(nPrev)) continue next;
            }
            return false;
        }
        return true;
    }

    // Set "strict" to true to force GRH-supported lower bound of 2*log(N)^2
    BigInteger.prototype.isPrime = function (strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if (bits <= 64)
            return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
        var logN = Math.log(2) * bits.toJSNumber();
        var t = Math.ceil((strict === true) ? (2 * Math.pow(logN, 2)) : logN);
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt(i + 2));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;

    BigInteger.prototype.isProbablePrime = function (iterations) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt.randBetween(2, n.minus(2)));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;

    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.isZero()) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.isUnit()) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n);
        }
        if (this.isNegative()) {
            return t.negate();
        }
        return t;
    };

    NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;

    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
    };
    NativeBigInt.prototype.next = function () {
        return new NativeBigInt(this.value + BigInt(1));
    }

    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
    };
    NativeBigInt.prototype.prev = function () {
        return new NativeBigInt(this.value - BigInt(1));
    }

    var powersOfTwo = [1];
    while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return Math.abs(n) <= BASE;
    }

    BigInteger.prototype.shiftLeft = function (v) {
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        if (result.isZero()) return result;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
    };
    NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;

    BigInteger.prototype.shiftRight = function (v) {
        var remQuo;
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero() || (result.isNegative() && result.isUnit())) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
    };
    NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x,
            yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
            xDivMod = divModAny(xRem, highestPower2);
            xDigit = xDivMod[1].toJSNumber();
            if (xSign) {
                xDigit = highestPower2 - 1 - xDigit; // two's complement for negative numbers
            }

            yDivMod = divModAny(yRem, highestPower2);
            yDigit = yDivMod[1].toJSNumber();
            if (ySign) {
                yDigit = highestPower2 - 1 - yDigit; // two's complement for negative numbers
            }

            xRem = xDivMod[0];
            yRem = yDivMod[0];
            result.push(fn(xDigit, yDigit));
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i = result.length - 1; i >= 0; i -= 1) {
            sum = sum.multiply(highestPower2).add(bigInt(result[i]));
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev();
    };
    NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;

    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) { return a & b; });
    };
    NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;

    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) { return a | b; });
    };
    NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;

    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) { return a ^ b; });
    };
    NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;

    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
    function roughLOB(n) { // get lowestOneBit (rough)
        // SmallInteger: return Min(lowestOneBit(n), 1 << 30)
        // BigInteger: return Min(lowestOneBit(n), 1 << 14) [BASE=1e7]
        var v = n.value,
            x = typeof v === "number" ? v | LOBMASK_I :
                typeof v === "bigint" ? v | BigInt(LOBMASK_I) :
                    v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
    }

    function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
            var tmp = integerLogarithm(value, base.square(base));
            var p = tmp.p;
            var e = tmp.e;
            var t = p.multiply(base);
            return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p: p, e: e * 2 };
        }
        return { p: bigInt(1), e: 0 };
    }

    BigInteger.prototype.bitLength = function () {
        var n = this;
        if (n.compareTo(bigInt(0)) < 0) {
            n = n.negate().subtract(bigInt(1));
        }
        if (n.compareTo(bigInt(0)) === 0) {
            return bigInt(0);
        }
        return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
    }
    NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
    }
    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
    }
    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d);
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a));
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b));
            }
            if (a.greater(b)) {
                t = b; b = a; a = t;
            }
            b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
    }
    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
    }
    function randBetween(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall) return low.add(Math.floor(Math.random() * range));
        var digits = toBase(range, BASE).value;
        var result = [], restricted = true;
        for (var i = 0; i < digits.length; i++) {
            var top = restricted ? digits[i] : BASE;
            var digit = truncate(Math.random() * top);
            result.push(digit);
            if (digit < top) restricted = false;
        }
        return low.add(Integer.fromArray(result, BASE, false));
    }

    var parseBase = function (text, base, alphabet, caseSensitive) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        text = String(text);
        if (!caseSensitive) {
            text = text.toLowerCase();
            alphabet = alphabet.toLowerCase();
        }
        var length = text.length;
        var i;
        var absBase = Math.abs(base);
        var alphabetValues = {};
        for (i = 0; i < alphabet.length; i++) {
            alphabetValues[alphabet[i]] = i;
        }
        for (i = 0; i < length; i++) {
            var c = text[i];
            if (c === "-") continue;
            if (c in alphabetValues) {
                if (alphabetValues[c] >= absBase) {
                    if (c === "1" && absBase === 1) continue;
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                }
            }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i];
            if (c in alphabetValues) digits.push(parseValue(alphabetValues[c]));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">" && i < text.length);
                digits.push(parseValue(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
    }

    function stringify(digit, alphabet) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        if (digit < alphabet.length) {
            return alphabet[digit];
        }
        return "<" + digit + ">";
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return { value: [0], isNegative: false };
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.isZero()) return { value: [0], isNegative: false };
            if (n.isNegative())
                return {
                    value: [].concat.apply([], Array.apply(null, Array(-n.toJSNumber()))
                        .map(Array.prototype.valueOf, [1, 0])
                    ),
                    isNegative: false
                };

            var arr = Array.apply(null, Array(n.toJSNumber() - 1))
                .map(Array.prototype.valueOf, [0, 1]);
            arr.unshift([1]);
            return {
                value: [].concat.apply([], arr),
                isNegative: false
            };
        }

        var neg = false;
        if (n.isNegative() && base.isPositive()) {
            neg = true;
            n = n.abs();
        }
        if (base.isUnit()) {
            if (n.isZero()) return { value: [0], isNegative: false };

            return {
                value: Array.apply(null, Array(n.toJSNumber()))
                    .map(Number.prototype.valueOf, 1),
                isNegative: neg
            };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
    }

    function toBaseString(n, base, alphabet) {
        var arr = toBase(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(function (x) {
            return stringify(x, alphabet);
        }).join('');
    }

    BigInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    SmallInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    NativeBigInt.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    BigInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBaseString(this, radix, alphabet);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
    };

    SmallInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBaseString(this, radix, alphabet);
        return String(this.value);
    };

    NativeBigInt.prototype.toString = SmallInteger.prototype.toString;

    NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () { return this.toString(); }

    BigInteger.prototype.valueOf = function () {
        return parseInt(this.toString(), 10);
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;

    SmallInteger.prototype.valueOf = function () {
        return this.value;
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;
    NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function () {
        return parseInt(this.toString(), 10);
    }

    function parseStringValue(v) {
        if (isPrecise(+v)) {
            var x = +v;
            if (x === truncate(x))
                return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);
            throw new Error("Invalid integer: " + v);
        }
        var sign = v[0] === "-";
        if (sign) v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
            var exp = split[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = +exp;
            if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
            var text = split[0];
            var decimalPlace = text.indexOf(".");
            if (decimalPlace >= 0) {
                exp -= text.length - decimalPlace - 1;
                text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
            }
            if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
            text += (new Array(exp + 1)).join("0");
            v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(sign ? "-" + v : v));
        }
        var r = [], max = v.length, l = LOG_BASE, min = max - l;
        while (max > 0) {
            r.push(+v.slice(min, max));
            min -= l;
            if (min < 0) min = 0;
            max -= l;
        }
        trim(r);
        return new BigInteger(r, sign);
    }

    function parseNumberValue(v) {
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(v));
        }
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v);
        }
        if (typeof v === "string") {
            return parseStringValue(v);
        }
        if (typeof v === "bigint") {
            return new NativeBigInt(v);
        }
        return v;
    }
    // Pre-define numbers in range [-999,999]
    for (var i = 0; i < 1000; i++) {
        Integer[i] = parseValue(i);
        if (i > 0) Integer[-i] = parseValue(-i);
    }
    // Backwards compatibility
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) { return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt; };
    Integer.randBetween = randBetween;

    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
    };

    return Integer;
})();

// Node.js check
if ( true && module.hasOwnProperty("exports")) {
    module.exports = bigInt;
}

//amd check
if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
        return bigInt;
    }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(131)(module)))

/***/ }),
/* 131 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 132 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright (c) 2017-2018 Emilio Almansi
// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



var validate = __webpack_require__(36).validate;

/**
 * Converts an array of integers made up of 'from' bits into an
 * array of integers made up of 'to' bits. The output array is
 * zero-padded if necessary, unless strict mode is true.
 * Throws a {@link ValidationError} if input is invalid.
 * Original by Pieter Wuille: https://github.com/sipa/bech32.
 *
 * @param {Uint8Array} data Array of integers made up of 'from' bits.
 * @param {number} from Length in bits of elements in the input array.
 * @param {number} to Length in bits of elements in the output array.
 * @param {bool} strictMode Require the conversion to be completed without padding.
 * @returns {Uint8Array}
 */
module.exports = function(data, from, to, strictMode) {
  var length = strictMode
    ? Math.floor(data.length * from / to)
    : Math.ceil(data.length * from / to);
  var mask = (1 << to) - 1;
  var result = new Uint8Array(length);
  var index = 0;
  var accumulator = 0;
  var bits = 0;
  for (var i = 0; i < data.length; ++i) {
    var value = data[i];
    validate(0 <= value && (value >> from) === 0, 'Invalid value: ' + value + '.');
    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result[index] = (accumulator >> bits) & mask;
      ++index;
    }
  }
  if (!strictMode) {
    if (bits > 0) {
      result[index] = (accumulator << (to - bits)) & mask;
      ++index;
    }
  } else {
    validate(
      bits < from && ((accumulator << (to - bits)) & mask) === 0,
      'Input cannot be converted to ' + to + ' bits without padding, but strict mode was used.'
    );
  }
  return result;
};


/***/ }),
/* 133 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkerAddressSource = exports.BrowserAddressSource = void 0;

var _bitcoinjsLibZcash = __webpack_require__(15);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var BrowserAddressSource =
/*#__PURE__*/
function () {
  function BrowserAddressSource(hdnode, network, segwit) {
    _classCallCheck(this, BrowserAddressSource);

    this.network = network;
    this.segwit = segwit;
    this.node = hdnode;
  }

  _createClass(BrowserAddressSource, [{
    key: "derive",
    value: function derive(first, last) {
      var addresses = []; // const chainNode = HDNode.fromBase58(this.xpub, this.network).derive(this.chainId);

      for (var i = first; i <= last; i++) {
        var addressNode = this.node.derive(i);
        var naddress = '';

        if (!this.segwit) {
          naddress = addressNode.getAddress();
        } else {
          // see https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
          // address derivation + test vectors
          var pkh = addressNode.getIdentifier();
          var scriptSig = Buffer.alloc(pkh.length + 2);
          scriptSig[0] = 0;
          scriptSig[1] = 0x14;
          pkh.copy(scriptSig, 2);

          var addressBytes = _bitcoinjsLibZcash.crypto.hash160(scriptSig);

          naddress = _bitcoinjsLibZcash.address.toBase58Check(addressBytes, this.network.scriptHash);
        }

        addresses.push(naddress);
      }

      return Promise.resolve(addresses);
    }
  }]);

  return BrowserAddressSource;
}();

exports.BrowserAddressSource = BrowserAddressSource;

var WorkerAddressSource =
/*#__PURE__*/
function () {
  function WorkerAddressSource(channel, node, version, segwit) {
    _classCallCheck(this, WorkerAddressSource);

    this.channel = channel;
    this.node = {
      depth: node.depth,
      child_num: node.index,
      fingerprint: node.parentFingerprint,
      chain_code: Array.prototype.slice.call(node.chainCode),
      public_key: Array.prototype.slice.call(node.keyPair.getPublicKeyBuffer())
    };
    this.version = version;
    this.segwit = segwit;
  }

  _createClass(WorkerAddressSource, [{
    key: "derive",
    value: function derive(firstIndex, lastIndex) {
      var request = {
        type: 'deriveAddressRange',
        node: this.node,
        version: this.version,
        firstIndex: firstIndex,
        lastIndex: lastIndex,
        addressFormat: this.segwit === 'p2sh' ? 1 : 0
      };
      return this.channel.postMessage(request).then(function (_ref) {
        var addresses = _ref.addresses;
        return addresses;
      });
    }
  }]);

  return WorkerAddressSource;
}();

exports.WorkerAddressSource = WorkerAddressSource;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(6).Buffer))

/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.integrateNewTxs = integrateNewTxs;

var _deriveUtxos = __webpack_require__(135);

var _deriveAnalysis = __webpack_require__(136);

var _utils = __webpack_require__(37);

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// When utxo transaction disappear, so does the utxo
// However, if it was transaction from us, it also means
// utxo has to be added (if it is a tx that came from us)
//
// If the utxo that needs to be added is in the new info
// - as is in the case when it is a chain of unconf txs -
// it will be readded again in derive-utxos
//
// However, if it is an old tx, it needs to be added here
// because derive-utxos does not go through old txs
function deleteTxs(oldInfo, txs, atp) {
  var set = new Set(txs);
  var filteredUtxos = oldInfo.utxos.filter(function (utxo) {
    return !set.has(utxo.transactionHash);
  });
  var deletedTransactions = oldInfo.transactions.filter(function (tx) {
    return set.has(tx.hash);
  });
  var filteredTransactions = oldInfo.transactions.filter(function (tx) {
    return !set.has(tx.hash);
  });
  var addedUtxos = [];
  deletedTransactions.forEach(function (deletedTran) {
    // this is not efficient At ALL,
    // but it does not happen frequently
    // (usually not at all)
    // => no need to optimize here, just go naively
    deletedTran.inputs.forEach(function (deletedInp) {
      var deletedInpHash = deletedInp.id;
      var deletedInpI = deletedInp.index;
      filteredTransactions.forEach(function (transaction) {
        var thash = transaction.hash;

        if (thash === deletedInpHash) {
          var o = transaction.myOutputs[deletedInpI];

          if (o != null) {
            // ALSO needs to find, if any of the inputs
            // are also mine
            var own = false;
            filteredTransactions.forEach(function (ptran) {
              transaction.inputs.forEach(function (ip) {
                if (ip.id === ptran.hash && ptran.myOutputs[ip.index] != null) {
                  own = true;
                }
              });
            });
            addedUtxos.push(utxoFromTarget(o, transaction, atp, own));
          }
        }
      });
    });
  });
  return _objectSpread({}, oldInfo, {
    utxos: filteredUtxos.concat(addedUtxos),
    transactions: filteredTransactions
  });
}

function utxoFromTarget(t, tx, atp, own) {
  var resIx = {
    index: t.i,
    value: t.value,
    transactionHash: tx.hash,
    height: tx.height,
    coinbase: tx.isCoinbase,
    addressPath: atp[t.address],
    vsize: tx.vsize,
    tsize: tx.tsize,
    own: own
  };
  return resIx;
}

function integrateNewTxs(newInfo, oldInfoUndeleted, lastBlock, deletedTxs, gap, wantedOffset) {
  var addressToPath = deriveAddressToPath(newInfo.main.allAddresses, newInfo.change.allAddresses);
  var oldInfo = deletedTxs.length !== 0 ? deleteTxs(oldInfoUndeleted, deletedTxs, addressToPath) : oldInfoUndeleted;
  var joined = deriveJoined(newInfo.main.newTransactions, newInfo.change.newTransactions);
  var utxos = (0, _deriveUtxos.deriveUtxos)(newInfo, oldInfo, addressToPath, joined);
  var transactions = (0, _deriveAnalysis.deriveAnalysis)(joined, oldInfo.transactions, addressToPath, lastBlock, wantedOffset);

  var _deriveUsedAddresses = deriveUsedAddresses(transactions, addressToPath, newInfo.main.allAddresses, 0, gap),
      usedAddresses = _deriveUsedAddresses.usedAddresses,
      unusedAddresses = _deriveUsedAddresses.unusedAddresses,
      lastConfirmedMain = _deriveUsedAddresses.lastConfirmed;

  var usedChange = deriveUsedAddresses(transactions, addressToPath, newInfo.change.allAddresses, 1, gap);
  var balance = transactions.length > 0 ? transactions[0].balance : 0;
  var utxoBalance = utxos.reduce(function (prev, a) {
    return a.value + prev;
  }, 0);

  if (balance !== utxoBalance) {
    throw new Error('Inconsistent info.');
  }

  var sentAddresses = deriveSentAddresses(transactions);
  var changeAddresses = newInfo.change.allAddresses;
  var changeIndex = usedChange.usedAddresses.length;
  var allowChange = usedChange.unusedAddresses.length > 0;
  var lastConfirmedChange = usedChange.lastConfirmed;
  var state = {
    utxos: utxos,
    transactions: transactions,
    usedAddresses: usedAddresses,
    unusedAddresses: unusedAddresses,
    lastConfirmedMain: lastConfirmedMain,
    lastConfirmedChange: lastConfirmedChange,
    changeIndex: changeIndex,
    balance: balance,
    lastBlock: lastBlock,
    sentAddresses: sentAddresses,
    changeAddresses: changeAddresses,
    allowChange: allowChange,
    version: oldInfoUndeleted.version
  };
  return state;
}

function deriveAddressToPath(main, change) {
  var res = {};
  main.forEach(function (a, i) {
    res[a] = [0, i];
  });
  change.forEach(function (a, i) {
    res[a] = [1, i];
  });
  return res;
}

function deriveJoined(main, change) {
  var res = {};
  Object.keys(main).forEach(function (id) {
    res[id] = main[id];
  });
  Object.keys(change).forEach(function (id) {
    res[id] = change[id];
  });
  return res;
}

function deriveSentAddresses(transactions) {
  var res = {};
  transactions.forEach(function (t) {
    if (t.type === 'sent') {
      t.targets.forEach(function (_ref) {
        var address = _ref.address,
            i = _ref.i;
        var txId = t.hash;
        var key = "".concat(txId, ":").concat(i);
        res[key] = address;
      });
    }
  });
  return res;
}

function deriveUsedAddresses(transactions, addressToPath, allAddresses, chain, gap) {
  var allReceived = [];
  var lastUsed = -1;
  var lastConfirmed = -1;
  transactions.forEach(function (t) {
    (0, _utils.objectValues)(t.myOutputs).forEach(function (_ref2) {
      var address = _ref2.address,
          value = _ref2.value;
      var path = addressToPath[address];

      if (path[0] === chain) {
        var id = path[1];

        if (allReceived[id] == null) {
          allReceived[id] = value;
        } else {
          allReceived[id] += value;
        }

        if (lastUsed < id) {
          lastUsed = id;
        }

        if (t.height != null) {
          if (lastConfirmed < id) {
            lastConfirmed = id;
          }
        }
      }
    });
  });
  var usedAddresses = [];

  for (var i = 0; i <= lastUsed; i++) {
    var address = allAddresses[i];
    var received = allReceived[i] == null ? 0 : allReceived[i];
    usedAddresses.push({
      address: address,
      received: received
    });
  }

  var unusedAddresses = [];

  for (var _i = lastUsed + 1; _i <= lastConfirmed + gap; _i++) {
    unusedAddresses.push(allAddresses[_i]);
  }

  return {
    usedAddresses: usedAddresses,
    unusedAddresses: unusedAddresses,
    lastConfirmed: lastConfirmed
  };
}

/***/ }),
/* 135 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deriveUtxos = deriveUtxos;

var _bitcoinjsLibZcash = __webpack_require__(15);

var _utils = __webpack_require__(37);

// what is hapenning here:
// I have a state with old utxo set
// and some new transactions
// and the only thing that can happen is that new utxos arrive
// from the new transactions, or the old utxos are spent
// The way this is done, no new utxos are added "back"
// from the old transactions.
// This is to save time - we do not need to go through old
// transactions, just through the new ones
//
// Note that this on itself could cause a problem
// If there is outgoing transaction in a mempool in the old state
// that is later removed,
// old utxos need to be added;
// I find such old utxos in index.js in findDeleted
// and later pass them here
function deriveUtxos(newInfo, oldInfo, addressToPath, joined) {
  // First do preparations
  // Make set of all my transaction IDs, old and new
  var allTransactionHashes = deriveAllTransactionHashes(newInfo.main.newTransactions, newInfo.change.newTransactions, oldInfo.transactions); // Then, make set of spent outputs
  // (tx + ":" + id)

  var spentOutputs = deriveSpentOutputs(allTransactionHashes, newInfo.main.newTransactions, newInfo.change.newTransactions, oldInfo.transactions); // actual logic

  var utxos = _deriveUtxos(oldInfo.utxos, joined, addressToPath, spentOutputs);

  return utxos;
}

function deriveAllTransactionHashes(main, change, old) {
  var res = new Set();
  Object.keys(main).forEach(function (id) {
    res.add(id);
  });
  Object.keys(change).forEach(function (id) {
    res.add(id);
  });
  old.forEach(function (t) {
    res.add(t.hash);
  });
  return res;
}

function deriveSpentOutputs(allTransactionHashes, main, change, old) {
  var res = new Set(); // saving only mine spent outputs
  // (to save some time)

  function canTxBeMine(id) {
    return allTransactionHashes.has(id);
  }

  function saveNew(ts) {
    (0, _utils.objectValues)(ts).forEach(function (tx) {
      tx.tx.ins.forEach(function (inp) {
        var i = inp.index;
        var id = (0, _utils.getInputId)(inp);

        if (canTxBeMine(id)) {
          res.add("".concat(id, ":").concat(i));
        }
      });
    });
  }

  old.forEach(function (t) {
    t.inputs.forEach(function (_ref) {
      var id = _ref.id,
          index = _ref.index;

      if (canTxBeMine(id)) {
        res.add("".concat(id, ":").concat(index));
      }
    });
  });
  saveNew(main);
  saveNew(change);
  return res;
}

function _deriveUtxos(currentUtxos, newTransactions, addressToPath, spentOutputs) {
  var res = {};

  var isOwnAddress = function isOwnAddress(address) {
    return address != null && addressToPath[address] != null;
  };

  var isCoinbase = function isCoinbase(tx) {
    return tx.ins.some(function (i) {
      return _bitcoinjsLibZcash.Transaction.isCoinbaseHash(i.hash);
    });
  }; // first, delete spent utxos from current batch from staying


  var filteredUtxos = currentUtxos.filter(function (utxo) {
    var ix = "".concat(utxo.transactionHash, ":").concat(utxo.index);
    return !spentOutputs.has(ix);
  }); // second, add them to hash, so if there is new and confirmed utxo,
  // it will overwrite existing utxo

  filteredUtxos.forEach(function (utxo) {
    var ix = "".concat(utxo.transactionHash, ":").concat(utxo.index);
    res[ix] = utxo;
  }); // third, find utxos in new txs and maybe overwrite existing

  var newTxs = (0, _utils.objectValues)(newTransactions);
  newTxs.forEach(function (_ref2) {
    var hash = _ref2.hash,
        tx = _ref2.tx,
        height = _ref2.height,
        outputAddresses = _ref2.outputAddresses,
        inputAddresses = _ref2.inputAddresses,
        vsize = _ref2.vsize;
    var coinbase = isCoinbase(tx);
    var own = inputAddresses.some(function (address) {
      return isOwnAddress(address);
    });
    tx.outs.forEach(function (o, index) {
      var ix = "".concat(hash, ":").concat(index);
      var address = outputAddresses[index];

      if (spentOutputs.has(ix) || !isOwnAddress(address)) {
        return;
      }

      var addressPath = addressToPath[address];
      var resIx = {
        index: index,
        value: o.value,
        transactionHash: hash,
        height: height,
        coinbase: coinbase,
        addressPath: addressPath,
        vsize: vsize,
        tsize: tx.byteLength(),
        own: own
      };
      res[ix] = resIx;
    });
  });
  return (0, _utils.objectValues)(res);
}

/***/ }),
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deriveAnalysis = deriveAnalysis;

var _bitcoinjsLibZcash = __webpack_require__(15);

var _utils = __webpack_require__(37);

var _dates = __webpack_require__(40);

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Pretty complicated function for deriving transaction analysis.
//
// Transaction analysis is a little heuristic - I have transactions and I try
// to find out which are "positive" and which are "negative"
// and which outputs to "display to user"
//
// Also, what is the "effective balance" of the transaction
//
// I do not re-analyze old transactions, I just analyze new transactions
function deriveAnalysis(newTransactions, oldTransactions, addressToPath, lastBlock, wantedOffset) // what (new Date().getTimezoneOffset()) returns
{
  // I need the outputs in format txid+i -> address/value
  // For old transactions, that are in history, I just need my outputs
  // For new transactions, I need all outputs (I will be analyzing them)
  var outputsForAnalysis = deriveOutputsForAnalysisMap(newTransactions, oldTransactions); // For each tx, derive info about its impact,
  // but since we don't know order, we don't know balance after it

  var analysis = deriveBalancelessAnalysisMap(newTransactions, oldTransactions, outputsForAnalysis, addressToPath, lastBlock, wantedOffset); // Add "balance" (which means balance after the transaction)

  var transactions = deriveFullInfo(analysis);
  return transactions;
} // All info about outputs


function deriveOutputsForAnalysisMap(newTs, oldTs) {
  // Take only my outputs from old
  function getOutputsFromOldTransaction(t) {
    var outputs = [];
    Object.keys(t.myOutputs).forEach(function (i) {
      outputs[parseInt(i, 10)] = t.myOutputs[parseInt(i, 10)];
    });
    var txid = t.hash;
    return {
      txid: txid,
      outputs: outputs
    };
  } // take all info from new txs, since I will be going throug them 1 by 1


  function getOutputsFromNewTransaction(t) {
    var outputs = [];

    for (var _i = 0; _i < t.tx.outs.length; _i++) {
      var output = t.tx.outs[_i];
      var _address = t.outputAddresses[_i];
      outputs.push({
        address: _address,
        value: output.value
      });
    }

    var txid = t.hash;
    return {
      txid: txid,
      outputs: outputs
    };
  }

  var res = {};
  var newOutputs = (0, _utils.objectValues)(newTs).map(function (t) {
    return getOutputsFromNewTransaction(t);
  });
  var oldOutputs = oldTs.map(function (t) {
    return getOutputsFromOldTransaction(t);
  }); // new txs are replacing the old ones
  // (rare case - new tx can have new address "discovered")

  oldOutputs.concat(newOutputs).forEach(function (_ref) {
    var txid = _ref.txid,
        outputs = _ref.outputs;
    res[txid] = outputs;
  });
  return res;
}

function deriveBalancelessAnalysisMap(newTs, oldTs, outputs, addressToPath, lastBlock, wantedOffset) {
  var res = {}; // first, save the old ones

  oldTs.forEach(function (t) {
    res[t.hash] = t;
  });
  Object.keys(newTs).forEach(function (id) {
    res[id] = analyzeTransaction(newTs[id], outputs, addressToPath, lastBlock, wantedOffset);
  });
  return res;
} // Analyze single transaction


function analyzeTransaction(t, outputs, addressToPath, lastBlock, wantedOffset) {
  var inputIds = t.tx.ins.map(function (input) {
    return {
      id: (0, _utils.getInputId)(input),
      index: input.index
    };
  });
  var hasJoinsplits = t.tx.joinsplits.length > 0;
  var isCoinbase = t.tx.ins.some(function (i) {
    return _bitcoinjsLibZcash.Transaction.isCoinbaseHash(i.hash);
  });
  var hash = t.hash; // the main logic is here

  var targets = getTargetsFromTransaction(inputIds, outputs, addressToPath, hash, hasJoinsplits);
  var dates = (0, _dates.deriveDateFormats)(t.timestamp, wantedOffset);
  var confirmations = t.height == null ? null : lastBlock.height - t.height + 1;

  var response = _objectSpread({
    isCoinbase: isCoinbase
  }, dates, {
    height: t.height,
    confirmations: confirmations,
    hash: hash
  }, targets, {
    inputs: inputIds,
    tsize: t.tx.byteLength(),
    vsize: t.vsize
  });

  if (t.tx.invalidTransaction) {
    response.invalidTransaction = t.tx.invalidTransaction;
  }

  return response;
}

function getTargetsFromTransaction(inputIds, outputs, addressToPath, id, hasJoinsplits) {
  // this function gets run only on new transactions,
  // so currentOutputs is always with full outputs, not pruned
  var currentOutputs_ = outputs[id];
  var currentOutputs = (0, _utils.filterNull)(currentOutputs_, true);
  var nCredit = 0;
  var nDebit = 0;
  var value = 0; // testing if address is mine / change / not change / ...

  function isExternal(a) {
    return a != null && addressToPath[a] != null && addressToPath[a][0] === 0;
  }

  function isInternal(a) {
    return a != null && addressToPath[a] != null && addressToPath[a][0] === 1;
  }

  function isCredit(a) {
    return a != null && addressToPath[a] != null;
  }

  function isDebit(a) {
    return !isCredit(a);
  } // subtract debit impact value
  // Transaction is TAKING me my money,
  // if its input is mine
  // == if its input belongs to a transaction
  // that's mine AND the address of corresponding output is mine


  inputIds.forEach(function (_ref2) {
    var iid = _ref2.id,
        index = _ref2.index;
    var info = outputs[iid];

    if (info) {
      var output = info[index];

      if (output) {
        if (isCredit(output.address)) {
          value -= output.value;
          nDebit++;
        }
      }
    }
  });
  var myOutputs = {}; // add credit impact value
  // Transansction is GIVING me money,
  // if its output has address that is mine. (On any chain.)

  currentOutputs.forEach(function (output, i) {
    if (isCredit(output.address)) {
      value += output.value;
      nCredit++;
      myOutputs[i] = {
        address: output.address,
        value: output.value,
        i: i
      };
    }
  });
  var targets = [];

  function filterTargets(filterFunction) {
    var res = [];
    currentOutputs.forEach(function (oinfo, i) {
      var address = oinfo.address,
          ovalue = oinfo.value;

      if (filterFunction(address)) {
        res.push({
          address: address,
          value: ovalue,
          i: i
        });
      }
    });
    return res;
  }

  var type;
  var insLength = inputIds.length;
  var outsLength = currentOutputs.length; // joinsplit is a special (zcash) case - it has no inputs - but outputs still mine
  // if all inputs are mine and all outputs are mine - no targets

  if (nDebit === insLength && !hasJoinsplits && nCredit === outsLength) {
    // within the same account
    type = 'self';
    targets = [];
  } else if (value > 0) {
    // incoming transaction, targets are either external or internal outputs
    type = 'recv';
    targets = filterTargets(function (address) {
      return isExternal(address);
    });

    if (targets.length === 0) {
      targets = filterTargets(function (address) {
        return isInternal(address);
      });
    }
  } else {
    // outgoing transaction, targets are debit outputs
    type = 'sent';
    targets = filterTargets(function (address) {
      return isDebit(address);
    });
  } // note that target selection does NOT affect value/balance
  // makes sense - even "sent to self" transactions are negative - cost fee


  return {
    targets: targets,
    type: type,
    value: value,
    myOutputs: myOutputs
  };
} // Full info is just analysis sorted and with added balances


function deriveFullInfo(analysis) {
  var sortedAnalysis = (0, _utils.objectValues)(analysis).sort(compareByOldestAndType);
  var prev = null;
  var impacts = sortedAnalysis.map(function (info) {
    var balance = prev != null ? prev.balance + info.value : info.value;
    prev = _objectSpread({}, info, {
      balance: balance
    });
    return prev;
  });
  return impacts.reverse();
}

var IMPACT_ORDERING = ['recv', 'self', 'sent'];

function compareByOldestAndType(a, b) {
  var ah = a.height != null ? a.height : Infinity;
  var bh = b.height != null ? b.height : Infinity;
  var diff = ah - bh || 0; // Infinity - Infinity = NaN

  if (diff !== 0) {
    return diff;
  }

  var odiff = IMPACT_ORDERING.indexOf(a.type) - IMPACT_ORDERING.indexOf(b.type);

  if (odiff !== 0) {
    return odiff;
  } // this does not really matter, what matter is that it is stable


  var ahash = a.hash;
  var bhash = b.hash;

  if (ahash < bhash) {
    return -1;
  }

  return 1;
}

/***/ })
/******/ ]);