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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {"undefined"===typeof importScripts&&"undefined"!==typeof WorkerGlobalScope&&this instanceof WorkerGlobalScope&&(this.importScripts=function(){throw Error("importScripts is a stub");});function da(){function u(){}function H(){}return{r:new Promise(function(n,Y){H=n;u=Y}),resolve:H,reject:u}}
function sa(u){function H(b){eval.call(null,b)}function n(b,a){b||D("Assertion failed: "+a)}function Y(b){var d=a["_"+b];if(!d)try{d=eval("_"+b)}catch(c){}n(d,"Cannot call unknown function "+b+" (perhaps LLVM optimizations or closure removed it?)");return d}function va(b,a,c){c=c||"i8";"*"===c.charAt(c.length-1)&&(c="i32");switch(c){case "i1":q[b>>0]=a;break;case "i8":q[b>>0]=a;break;case "i16":R[b>>1]=a;break;case "i32":m[b>>2]=a;break;case "i64":tempI64=[a>>>0,(tempDouble=a,1<=+Xa(tempDouble)?0<
tempDouble?(Ya(+Za(tempDouble/4294967296),4294967295)|0)>>>0:~~+$a((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)];m[b>>2]=tempI64[0];m[b+4>>2]=tempI64[1];break;case "float":Z[b>>2]=a;break;case "double":aa[b>>3]=a;break;default:D("invalid type for setValue: "+c)}}function wa(b,a){a=a||"i8";"*"===a.charAt(a.length-1)&&(a="i32");switch(a){case "i1":return q[b>>0];case "i8":return q[b>>0];case "i16":return R[b>>1];case "i32":return m[b>>2];case "i64":return m[b>>2];case "float":return Z[b>>2];
case "double":return aa[b>>3];default:D("invalid type for setValue: "+a)}return null}function S(b,a,c,e){var r,h;"number"===typeof b?(r=!0,h=b):(r=!1,h=b.length);var g="string"===typeof a?a:null,l;4==c?l=e:l=["function"===typeof T?T:f.n,f.f,f.n,f.p][void 0===c?2:c](Math.max(h,g?1:a.length));if(r){e=l;n(0==(l&3));for(b=l+(h&-4);e<b;e+=4)m[e>>2]=0;for(b=l+h;e<b;)q[e++>>0]=0;return l}if("i8"===g)return b.subarray||b.slice?t.set(b,l):t.set(new Uint8Array(b),l),l;e=0;for(var F,xa;e<h;)r=b[e],"function"===
typeof r&&(r=f.P(r)),c=g||a[e],0===c?e++:("i64"==c&&(c="i32"),va(l+e,r,c),xa!==c&&(F=f.q(c),xa=c),e+=F);return l}function J(b,d){if(0===d||!b)return"";for(var c=0,e,f=0;;){e=t[b+f>>0];c|=e;if(0==e&&!d)break;f++;if(d&&f==d)break}d||(d=f);e="";if(128>c){for(;0<d;)c=String.fromCharCode.apply(String,t.subarray(b,b+Math.min(d,1024))),e=e?e+c:c,b+=1024,d-=1024;return e}return a.UTF8ToString(b)}function ya(b,a){for(var c=a;b[c];)++c;if(16<c-a&&b.subarray&&za)return za.decode(b.subarray(a,c));for(var e,f,
h,g,l,F,c="";;){e=b[a++];if(!e)return c;e&128?(f=b[a++]&63,192==(e&224)?c+=String.fromCharCode((e&31)<<6|f):(h=b[a++]&63,224==(e&240)?e=(e&15)<<12|f<<6|h:(g=b[a++]&63,240==(e&248)?e=(e&7)<<18|f<<12|h<<6|g:(l=b[a++]&63,248==(e&252)?e=(e&3)<<24|f<<18|h<<12|g<<6|l:(F=b[a++]&63,e=(e&1)<<30|f<<24|h<<18|g<<12|l<<6|F))),65536>e?c+=String.fromCharCode(e):(e-=65536,c+=String.fromCharCode(55296|e>>10,56320|e&1023)))):c+=String.fromCharCode(e)}}function Aa(b){return ya(t,b)}function ea(b,a,c,e){if(!(0<e))return 0;
var f=c;e=c+e-1;for(var h=0;h<b.length;++h){var g=b.charCodeAt(h);55296<=g&&57343>=g&&(g=65536+((g&1023)<<10)|b.charCodeAt(++h)&1023);if(127>=g){if(c>=e)break;a[c++]=g}else{if(2047>=g){if(c+1>=e)break;a[c++]=192|g>>6}else{if(65535>=g){if(c+2>=e)break;a[c++]=224|g>>12}else{if(2097151>=g){if(c+3>=e)break;a[c++]=240|g>>18}else{if(67108863>=g){if(c+4>=e)break;a[c++]=248|g>>24}else{if(c+5>=e)break;a[c++]=252|g>>30;a[c++]=128|g>>24&63}a[c++]=128|g>>18&63}a[c++]=128|g>>12&63}a[c++]=128|g>>6&63}a[c++]=128|
g&63}}a[c]=0;return c-f}function U(b,a,c){return ea(b,t,a,c)}function ba(b){for(var a=0,c=0;c<b.length;++c){var e=b.charCodeAt(c);55296<=e&&57343>=e&&(e=65536+((e&1023)<<10)|b.charCodeAt(++c)&1023);127>=e?++a:a=2047>=e?a+2:65535>=e?a+3:2097151>=e?a+4:67108863>=e?a+5:a+6}return a}function ab(b){return b.replace(/__Z[\w\d_]+/g,function(b){var c;a:{var e=a.___cxa_demangle||a.__cxa_demangle;if(e)try{var r=b.substr(1),h=ba(r)+1,g=T(h);U(r,g,h);var l=T(4),F=e(g,0,0,l);if(0===wa(l,"i32")&&F){c=J(F);break a}}catch(n){}finally{g&&
fa(g),l&&fa(l),F&&fa(F)}else f.b("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");c=b}return b===c?b:b+" ["+c+"]"})}function ga(){var b;a:{b=Error();if(!b.stack){try{throw Error(0);}catch(d){b=d}if(!b.stack){b="(no stack trace available)";break a}}b=b.stack.toString()}a.extraStackTrace&&(b+="\n"+a.extraStackTrace());return ab(b)}function Ba(){a.HEAP8=q=new Int8Array(k);a.HEAP16=R=new Int16Array(k);a.HEAP32=m=new Int32Array(k);a.HEAPU8=t=new Uint8Array(k);a.HEAPU16=Ca=
new Uint16Array(k);a.HEAPU32=Da=new Uint32Array(k);a.HEAPF32=Z=new Float32Array(k);a.HEAPF64=aa=new Float64Array(k)}function ha(){D("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+I+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}function N(b){for(;0<b.length;){var d=b.shift();if("function"==
typeof d)d();else{var c=d.L;"number"===typeof c?void 0===d.k?a.dynCall_v(c):a.dynCall_vi(c,d.k):c(void 0===d.k?null:d.k)}}}function Ea(b){Fa.unshift(b)}function Ga(b){Ha.unshift(b)}function ia(b,a,c){c=Array(0<c?c:ba(b)+1);b=ea(b,c,0,c.length);a&&(c.length=b);return c}function Ia(b,a){q.set(b,a)}function Ja(b,a,c){for(var e=0;e<b.length;++e)q[a++>>0]=b.charCodeAt(e);c||(q[a>>0]=0)}function ja(){K++;a.monitorRunDependencies&&a.monitorRunDependencies(K)}function ka(){K--;a.monitorRunDependencies&&a.monitorRunDependencies(K);
if(0==K&&(null!==la&&(clearInterval(la),la=null),V)){var b=V;V=null;b()}}function ma(){var b=ma;b.a||(b.a=[]);b.a.push(f.g());return b.a.length-1}function O(b){this.name="ExitStatus";this.message="Program terminated with exit("+b+")";this.status=b}function na(b){function d(){if(!a.calledRun&&(a.calledRun=!0,!W)){X||(X=!0,N(ca));N(Ka);if(a.onRuntimeInitialized)a.onRuntimeInitialized();a._main&&La&&a.callMain(b);if(a.postRun)for("function"==typeof a.postRun&&(a.postRun=[a.postRun]);a.postRun.length;)Ga(a.postRun.shift());
N(Ha)}}b=b||a.arguments;null===Ma&&(Ma=Date.now());if(!(0<K)){if(a.preRun)for("function"==typeof a.preRun&&(a.preRun=[a.preRun]);a.preRun.length;)Ea(a.preRun.shift());N(Fa);0<K||a.calledRun||(a.setStatus?(a.setStatus("Running..."),setTimeout(function(){setTimeout(function(){a.setStatus("")},1);d()},1)):d())}}function Na(b,d){if(!d||!a.noExitRuntime){if(!a.noExitRuntime&&(W=!0,z=bb,N(Oa),a.onExit))a.onExit(b);P&&process.exit(b);a.quit(b,new O(b))}}function D(b){void 0!==b?(a.print(b),a.e(b),b=JSON.stringify(b)):
b="";W=!0;var d="abort("+b+") at "+ga()+"\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";Pa&&Pa.forEach(function(a){d=a(d,b)});throw d;}var a={};a.wasmBinary=new Uint8Array(u);a||(a=eval("(function() { try { return Module || {} } catch(e) { return {} } })()"));var v={},p;for(p in a)a.hasOwnProperty(p)&&(v[p]=a[p]);var y=!1,L=!1,P=!1,G=!1;if(a.ENVIRONMENT)if("WEB"===a.ENVIRONMENT)y=!0;else if("WORKER"===a.ENVIRONMENT)L=!0;else if("NODE"===a.ENVIRONMENT)P=
!0;else if("SHELL"===a.ENVIRONMENT)G=!0;else throw Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.");else y="object"===typeof window,L="function"===typeof importScripts,P="object"===typeof process&&"function"==="function"&&!y&&!L,G=!y&&!P&&!L;if(P){a.print||(a.print=console.log);a.printErr||(a.printErr=console.warn);var oa,pa;a.read=function(b,a){oa||(oa=__webpack_require__(0));pa||(pa=__webpack_require__(0));b=pa.normalize(b);var c=oa.readFileSync(b);return a?
c:c.toString()};a.readBinary=function(b){b=a.read(b,!0);b.buffer||(b=new Uint8Array(b));n(b.buffer);return b};a.load=function(b){H(read(b))};a.thisProgram||(a.thisProgram=1<process.argv.length?process.argv[1].replace(/\\/g,"/"):"unknown-program");a.arguments=process.argv.slice(2); true&&(module.exports=a);process.on("uncaughtException",function(b){if(!(b instanceof O))throw b;});a.inspect=function(){return"[Emscripten Module object]"}}else if(G)a.print||(a.print=print),"undefined"!=
typeof printErr&&(a.printErr=printErr),a.read="undefined"!=typeof read?read:function(){throw"no read() available";},a.readBinary=function(b){if("function"===typeof readbuffer)return new Uint8Array(readbuffer(b));b=read(b,"binary");n("object"===typeof b);return b},"undefined"!=typeof scriptArgs?a.arguments=scriptArgs:"undefined"!=typeof arguments&&(a.arguments=arguments),"function"===typeof quit&&(a.quit=function(b){quit(b)}),eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined");
else if(y||L)a.read=function(b){var a=new XMLHttpRequest;a.open("GET",b,!1);a.send(null);return a.responseText},L&&(a.readBinary=function(a){var d=new XMLHttpRequest;d.open("GET",a,!1);d.responseType="arraybuffer";d.send(null);return new Uint8Array(d.response)}),a.readAsync=function(a,d,c){var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=function(){200==e.status||0==e.status&&e.response?d(e.response):c()};e.onerror=c;e.send(null)},"undefined"!=typeof arguments&&(a.arguments=
arguments),"undefined"!==typeof console?(a.print||(a.print=function(a){console.log(a)}),a.printErr||(a.printErr=function(a){console.warn(a)})):a.print||(a.print=function(){}),L&&(a.load=importScripts),"undefined"===typeof a.setWindowTitle&&(a.setWindowTitle=function(a){document.title=a});else throw"Unknown runtime environment. Where are we?";!a.load&&a.read&&(a.load=function(b){H(a.read(b))});a.print||(a.print=function(){});a.printErr||(a.printErr=a.print);a.arguments||(a.arguments=[]);a.thisProgram||
(a.thisProgram="./this.program");a.quit||(a.quit=function(a,d){throw d;});a.print=a.print;a.e=a.printErr;a.preRun=[];a.postRun=[];for(p in v)v.hasOwnProperty(p)&&(a[p]=v[p]);var v=void 0,f={s:function(a){return tempRet0=a},A:function(){return tempRet0},g:function(){return z},c:function(a){z=a},q:function(a){switch(a){case "i1":case "i8":return 1;case "i16":return 2;case "i32":return 4;case "i64":return 8;case "float":return 4;case "double":return 8;default:return"*"===a[a.length-1]?f.j:"i"===a[0]?
(a=parseInt(a.substr(1)),n(0===a%8),a/8):0}},w:function(a){return Math.max(f.q(a),f.j)},C:16,S:function(a,d){"double"===d||"i64"===d?a&7&&(n(4===(a&7)),a+=4):n(0===(a&3));return a},M:function(a,d,c){return c||"i64"!=a&&"double"!=a?a?Math.min(d||(a?f.w(a):0),f.j):Math.min(d,8):8},l:function(b,d,c){return c&&c.length?a["dynCall_"+b].apply(null,[d].concat(c)):a["dynCall_"+b].call(null,d)},d:[],t:function(a){for(var d=0;d<f.d.length;d++)if(!f.d[d])return f.d[d]=a,2*(1+d);throw"Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
},B:function(a){f.d[(a-2)/2]=null},b:function(b){f.b.a||(f.b.a={});f.b.a[b]||(f.b.a[b]=1,a.e(b))},m:{},O:function(a,d){n(d);f.m[d]||(f.m[d]={});var c=f.m[d];c[a]||(c[a]=1===d.length?function(){return f.l(d,a)}:2===d.length?function(c){return f.l(d,a,[c])}:function(){return f.l(d,a,Array.prototype.slice.call(arguments))});return c[a]},N:function(){throw"You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";},f:function(a){var d=
z;z=z+a|0;z=z+15&-16;return d},n:function(a){var d=A;A=A+a|0;A=A+15&-16;return d},p:function(a){var d=m[M>>2];a=(d+a+15|0)&-16;m[M>>2]=a;if(a=a>=I)ha(),a=!0;return a?(m[M>>2]=d,0):d},o:function(a,d){return Math.ceil(a/(d?d:16))*(d?d:16)},R:function(a,d,c){return c?+(a>>>0)+4294967296*+(d>>>0):+(a>>>0)+4294967296*+(d|0)},h:1024,j:4,D:0};a.Runtime=f;f.addFunction=f.t;f.removeFunction=f.B;var W=0,Qa,Ra;(function(){function a(b){b=b.toString().match(r).slice(1);return{arguments:b[0],body:b[1],returnValue:b[2]}}
function d(){if(!h){h={};for(var d in c)c.hasOwnProperty(d)&&(h[d]=a(c[d]))}}var c={stackSave:function(){f.g()},stackRestore:function(){f.c()},arrayToC:function(a){var b=f.f(a.length);Ia(a,b);return b},stringToC:function(a){var b=0;if(null!==a&&void 0!==a&&0!==a){var c=(a.length<<2)+1,b=f.f(c);U(a,b,c)}return b}},e={string:c.stringToC,array:c.arrayToC};Ra=function(a,b,c,d,h){a=Y(a);var r=[],n=0;if(d)for(var x=0;x<d.length;x++){var p=e[c[x]];p?(0===n&&(n=f.g()),r[x]=p(d[x])):r[x]=d[x]}c=a.apply(null,
r);"string"===b&&(c=J(c));if(0!==n){if(h&&h.async){EmterpreterAsync.F.push(function(){f.c(n)});return}f.c(n)}return c};var r=/^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/,h=null;Qa=function(c,e,f){f=f||[];var r=Y(c);c=f.every(function(a){return"number"===a});var n="string"!==e;if(n&&c)return r;var p=f.map(function(a,b){return"$"+b});e="(function("+p.join(",")+") {";var m=f.length;if(!c){d();e+="var stack = "+h.stackSave.body+";";for(var x=0;x<m;x++){var t=
p[x],k=f[x];"number"!==k&&(k=h[k+"ToC"],e+="var "+k.arguments+" = "+t+";",e+=k.body+";",e+=t+"=("+k.returnValue+");")}}f=a(function(){return r}).returnValue;e+="var ret = "+f+"("+p.join(",")+");";n||(f=a(function(){return J}).returnValue,e+="ret = "+f+"(ret);");c||(d(),e+=h.stackRestore.body.replace("()","(stack)")+";");return eval(e+"return ret})")}})();a.ccall=Ra;a.cwrap=Qa;a.setValue=va;a.getValue=wa;a.ALLOC_NORMAL=0;a.ALLOC_STACK=1;a.ALLOC_STATIC=2;a.ALLOC_DYNAMIC=3;a.ALLOC_NONE=4;a.allocate=
S;a.getMemory=function(a){return qa?X?T(a):f.p(a):f.n(a)};a.Pointer_stringify=J;a.AsciiToString=function(a){for(var d="";;){var c=q[a++>>0];if(!c)return d;d+=String.fromCharCode(c)}};a.stringToAscii=function(a,d){return Ja(a,d,!1)};var za="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;a.UTF8ArrayToString=ya;a.UTF8ToString=Aa;a.stringToUTF8Array=ea;a.stringToUTF8=U;a.lengthBytesUTF8=ba;"undefined"!==typeof TextDecoder&&new TextDecoder("utf-16le");a.stackTrace=ga;var k,q,t,R,Ca,m,Da,
Z,aa,A,qa,z,M,v=A=y=z=p=y=M=0;qa=!1;p=a.TOTAL_STACK||5242880;var I=a.TOTAL_MEMORY||16777216;I<p&&a.e("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+I+"! (TOTAL_STACK="+p+")");a.buffer?k=a.buffer:"object"===typeof WebAssembly&&"function"===typeof WebAssembly.Memory?(a.wasmMemory=new WebAssembly.Memory({initial:I/65536,maximum:I/65536}),k=a.wasmMemory.buffer):k=new ArrayBuffer(I);Ba();m[0]=1668509029;R[1]=25459;if(115!==t[2]||99!==t[3])throw"Runtime error: expected the system to be little-endian!";
a.HEAP=void 0;a.buffer=k;a.HEAP8=q;a.HEAP16=R;a.HEAP32=m;a.HEAPU8=t;a.HEAPU16=Ca;a.HEAPU32=Da;a.HEAPF32=Z;a.HEAPF64=aa;var Fa=[],ca=[],Ka=[],Oa=[],Ha=[],X=!1;a.addOnPreRun=Ea;a.addOnInit=function(a){ca.unshift(a)};a.addOnPreMain=function(a){Ka.unshift(a)};a.addOnExit=function(a){Oa.unshift(a)};a.addOnPostRun=Ga;a.intArrayFromString=ia;a.intArrayToString=function(a){for(var d=[],c=0;c<a.length;c++){var e=a[c];255<e&&(e&=255);d.push(String.fromCharCode(e))}return d.join("")};a.writeStringToMemory=function(a,
d,c){f.b("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");var e,r;c&&(r=d+ba(a),e=q[r]);U(a,d,Infinity);c&&(q[r]=e)};a.writeArrayToMemory=Ia;a.writeAsciiToMemory=Ja;Math.imul&&-5===Math.imul(4294967295,5)||(Math.imul=function(a,d){var c=a&65535,e=d&65535;return c*e+((a>>>16)*e+c*(d>>>16)<<16)|0});Math.Q=Math.imul;if(!Math.fround){var Sa=new Float32Array(1);Math.fround=function(a){Sa[0]=a;return Sa[0]}}Math.K=Math.fround;Math.clz32||(Math.clz32=function(a){a=
a>>>0;for(var d=0;32>d;d++)if(a&1<<31-d)return d;return 32});Math.H=Math.clz32;Math.trunc||(Math.trunc=function(a){return 0>a?Math.ceil(a):Math.floor(a)});Math.trunc=Math.trunc;var Xa=Math.abs,$a=Math.ceil,Za=Math.floor,Ya=Math.min,K=0,la=null,V=null;a.addRunDependency=ja;a.removeRunDependency=ka;a.preloadedImages={};a.preloadedAudios={};var E=null;(function(b){function d(a){var c=b.usingWasm?65536:16777216;0<a%c&&(a+=c-a%c);var c=b.buffer,d=c.byteLength;if(b.usingWasm)try{return-1!==b.wasmMemory.grow((a-
d)/65536)?b.buffer=b.wasmMemory.buffer:null}catch(e){return null}else return x.__growWasmMemory((a-d)/65536),b.buffer!==c?b.buffer:null}function c(a,b){var c=q;if(0>a.indexOf("."))c=(c||{})[a];else var d=a.split("."),c=(c||{})[d[0]],c=(c||{})[d[1]];b&&(c=(c||{})[b]);void 0===c&&D("bad lookupImport to ("+a+")."+b);return c}function e(c){var d=b.buffer;c.byteLength<d.byteLength&&b.printErr("the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here");
var d=new Int8Array(d),e=new Int8Array(c);E||d.set(e.subarray(b.STATIC_BASE,b.STATIC_BASE+b.STATIC_BUMP),b.STATIC_BASE);e.set(d);a.buffer=k=c;Ba()}function f(){var a;if(b.wasmBinary)a=b.wasmBinary,a=new Uint8Array(a);else if(b.readBinary)a=b.readBinary(m);else throw"on the web, we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML (but not JS)";return a}function h(){return b.wasmBinary||"function"!==typeof fetch?new Promise(function(a){a(f())}):
fetch(m,{I:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+m+"'";return a.arrayBuffer()})}function g(a,c,d){if("function"!==typeof b.asm||b.asm===y)b.asmPreload?b.asm=b.asmPreload:eval(b.read(v));return"function"!==typeof b.asm?(b.printErr("asm evalling did not set the module properly"),!1):b.asm(a,c,d)}function l(a,c){function d(a){x=a.exports;x.memory&&e(x.memory);b.asm=x;b.usingWasm=!0;ka()}if("object"!==typeof WebAssembly)return b.printErr("no native wasm support detected"),
!1;if(!(b.wasmMemory instanceof WebAssembly.Memory))return b.printErr("no native wasm Memory in use"),!1;c.memory=b.wasmMemory;q.global={NaN:NaN,Infinity:Infinity};q["global.Math"]=a.Math;q.env=c;ja();if(b.instantiateWasm)try{return b.instantiateWasm(q,d)}catch(f){return b.printErr("Module.instantiateWasm callback failed with error: "+f),!1}h().then(function(a){return WebAssembly.instantiate(a,q)}).then(function(a){d(a.instance)}).catch(function(a){b.printErr("failed to asynchronously prepare wasm: "+
a);b.quit(1,a)});return{}}var p=b.wasmJSMethod||"native-wasm";b.wasmJSMethod=p;var t=b.wasmTextFile||"fastxpub.wast",m=b.wasmBinaryFile||"fastxpub.wasm",v=b.asmjsCodeFile||"fastxpub.temp.asm.js";"function"===typeof b.locateFile&&(t=b.locateFile(t),m=b.locateFile(m),v=b.locateFile(v));var q={global:null,env:null,asm2wasm:{"f64-rem":function(a,b){return a%b},"f64-to-int":function(a){return a|0},"i32s-div":function(a,b){return(a|0)/(b|0)|0},"i32u-div":function(a,b){return(a>>>0)/(b>>>0)>>>0},"i32s-rem":function(a,
b){return(a|0)%(b|0)|0},"i32u-rem":function(a,b){return(a>>>0)%(b>>>0)>>>0},"debugger":function(){debugger}},parent:b},x=null;b.asmPreload=b.asm;var u=b.reallocBuffer;b.reallocBuffer=function(a){return"asmjs"===z?u(a):d(a)};var z="";b.asm=function(a,d,h){if(!d.table){var m=b.wasmTableSize;void 0===m&&(m=1024);var Q=b.wasmMaxTableSize;d.table="object"===typeof WebAssembly&&"function"===typeof WebAssembly.Table?void 0!==Q?new WebAssembly.Table({initial:m,maximum:Q,element:"anyfunc"}):new WebAssembly.Table({initial:m,
element:"anyfunc"}):Array(m);b.wasmTable=d.table}d.memoryBase||(d.memoryBase=b.STATIC_BASE);d.tableBase||(d.tableBase=0);for(var w,m=p.split(","),Q=0;Q<m.length;Q++)if(z=w=m[Q],"native-wasm"===w){if(w=l(a,d))break}else if("asmjs"===w){if(w=g(a,d,h))break}else if("interpret-asm2wasm"===w||"interpret-s-expr"===w||"interpret-binary"===w){var k=a,C=d,u=h;if("function"!==typeof WasmJS)b.printErr("WasmJS not detected - polyfill not bundled?"),w=!1;else{var B=WasmJS({});B.outside=b;B.info=q;B.lookupImport=
c;n(u===b.buffer);q.global=k;q.env=C;n(u===b.buffer);C.memory=u;n(C.memory instanceof ArrayBuffer);B.providedTotalMemory=b.buffer.byteLength;k=void 0;k="interpret-binary"===w?f():b.read("interpret-asm2wasm"==w?v:t);C=void 0;if("interpret-asm2wasm"==w)C=B._malloc(k.length+1),B.writeAsciiToMemory(k,C),B._load_asm2wasm(C);else if("interpret-s-expr"===w)C=B._malloc(k.length+1),B.writeAsciiToMemory(k,C),B._load_s_expr2wasm(C);else if("interpret-binary"===w)C=B._malloc(k.length),B.HEAPU8.set(k,C),B._load_binary2wasm(C,
k.length);else throw"what? "+w;B._free(C);B._instantiate(C);b.newBuffer&&(e(b.newBuffer),b.newBuffer=null);w=x=B.asmExports}if(w)break}else throw"bad method: "+w;if(!w)throw"no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: https://github.com/kripken/emscripten/wiki/WebAssembly#binaryen-methods";return w};var y=b.asm})(a);v=f.h;A=v+77952;ca.push();E=0<=a.wasmJSMethod.indexOf("asmjs")||0<=a.wasmJSMethod.indexOf("interpret-asm2wasm")?"fastxpub.js.mem":
null;a.STATIC_BASE=v;a.STATIC_BUMP=77952;v=A;A+=16;a._memset=cb;a._llvm_bswap_i32=ra;a._sbrk=db;a._memcpy=eb;M=S(1,"i32",2);y=z=f.o(A);p=y+p;y=f.o(p);m[M>>2]=y;qa=!0;a.wasmTableSize=0;a.wasmMaxTableSize=0;a.u={Math:Math,Int8Array:Int8Array,Int16Array:Int16Array,Int32Array:Int32Array,Uint8Array:Uint8Array,Uint16Array:Uint16Array,Uint32Array:Uint32Array,Float32Array:Float32Array,Float64Array:Float64Array,NaN:NaN,Infinity:Infinity};a.v={abort:D,assert:n,enlargeMemory:function(){ha()},getTotalMemory:function(){return I},
abortOnCannotGrowMemory:ha,_ed25519_publickey_keccak:function(){a.printErr("missing function: ed25519_publickey_keccak");D(-1)},_abort:function(){a.abort()},_curve25519_scalarmult_basepoint:function(){a.printErr("missing function: curve25519_scalarmult_basepoint");D(-1)},___setErrNo:function(b){a.___errno_location&&(m[a.___errno_location()>>2]=b);return b},_llvm_stacksave:ma,_ed25519_publickey_sha3:function(){a.printErr("missing function: ed25519_publickey_sha3");D(-1)},_emscripten_memcpy_big:function(a,
d,c){t.set(t.subarray(d,d+c),a);return a},_llvm_bswap_i64:function(a,d){var c=ra(d)>>>0,e=ra(a)>>>0;return(f.s(e),c)|0},_llvm_stackrestore:function(a){var d=ma,c=d.a[a];d.a.splice(a,1);f.c(c)},___assert_fail:function(a,d,c,e){W=!0;throw"Assertion failed: "+J(a)+", at: "+[d?J(d):"unknown filename",c,e?J(e):"unknown function"]+" at "+ga();},_ed25519_publickey:function(){a.printErr("missing function: ed25519_publickey");D(-1)},DYNAMICTOP_PTR:M,tempDoublePtr:v,ABORT:W,STACKTOP:z,STACK_MAX:p};v=a.asm(a.u,
a.v,k);a.asm=v;a._hdnode_serialize_public=function(){return a.asm._hdnode_serialize_public.apply(null,arguments)};a.getTempRet0=function(){return a.asm.getTempRet0.apply(null,arguments)};var fa=a._free=function(){return a.asm._free.apply(null,arguments)};a.runPostSets=function(){return a.asm.runPostSets.apply(null,arguments)};a.setTempRet0=function(){return a.asm.setTempRet0.apply(null,arguments)};a._ecdsa_read_pubkey=function(){return a.asm._ecdsa_read_pubkey.apply(null,arguments)};a.establishStackSpace=
function(){return a.asm.establishStackSpace.apply(null,arguments)};a.stackSave=function(){return a.asm.stackSave.apply(null,arguments)};var cb=a._memset=function(){return a.asm._memset.apply(null,arguments)};a._hdnode_fingerprint=function(){return a.asm._hdnode_fingerprint.apply(null,arguments)};var T=a._malloc=function(){return a.asm._malloc.apply(null,arguments)};a._emscripten_get_global_libc=function(){return a.asm._emscripten_get_global_libc.apply(null,arguments)};var eb=a._memcpy=function(){return a.asm._memcpy.apply(null,
arguments)};a._hdnode_public_ckd=function(){return a.asm._hdnode_public_ckd.apply(null,arguments)};a.stackAlloc=function(){return a.asm.stackAlloc.apply(null,arguments)};a.setThrew=function(){return a.asm.setThrew.apply(null,arguments)};var db=a._sbrk=function(){return a.asm._sbrk.apply(null,arguments)};a._hdnode_deserialize=function(){return a.asm._hdnode_deserialize.apply(null,arguments)};a.stackRestore=function(){return a.asm.stackRestore.apply(null,arguments)};a._hdnode_public_ckd_address_optimized=
function(){return a.asm._hdnode_public_ckd_address_optimized.apply(null,arguments)};var ra=a._llvm_bswap_i32=function(){return a.asm._llvm_bswap_i32.apply(null,arguments)};f.f=a.stackAlloc;f.g=a.stackSave;f.c=a.stackRestore;f.J=a.establishStackSpace;f.s=a.setTempRet0;f.A=a.getTempRet0;a.asm=v;if(E)if("function"===typeof a.locateFile?E=a.locateFile(E):a.memoryInitializerPrefixURL&&(E=a.memoryInitializerPrefixURL+E),P||G)G=a.readBinary(E),t.set(G,f.h);else{var Ua=function(){a.readAsync(E,Ta,function(){throw"could not load memory initializer "+
E;})};ja();var Ta=function(b){b.byteLength&&(b=new Uint8Array(b));t.set(b,f.h);a.memoryInitializerRequest&&delete a.memoryInitializerRequest.response;ka()};a.memoryInitializerRequest?(G=function(){var b=a.memoryInitializerRequest;200!==b.status&&0!==b.status?(console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: "+b.status+", retrying "+E),Ua()):Ta(b.response)},a.memoryInitializerRequest.response?setTimeout(G,0):a.memoryInitializerRequest.addEventListener("load",
G)):Ua()}O.prototype=Error();O.prototype.constructor=O;var bb,Ma=null,V=function d(){a.calledRun||na();a.calledRun||(V=d)};a.callMain=a.G=function(d){function c(){for(var a=0;3>a;a++)f.push(0)}d=d||[];X||(X=!0,N(ca));var e=d.length+1,f=[S(ia(a.thisProgram),"i8",0)];c();for(var h=0;h<e-1;h+=1)f.push(S(ia(d[h]),"i8",0)),c();f.push(0);f=S(f,"i32",0);try{var g=a._main(e,f,0);Na(g,!0)}catch(l){l instanceof O||("SimulateInfiniteLoop"==l?a.noExitRuntime=!0:((d=l)&&"object"===typeof l&&l.stack&&(d=[l,l.stack]),
a.e("exception thrown: "+d),a.quit(1,l)))}finally{}};a.run=a.run=na;a.exit=a.exit=Na;var Pa=[];a.abort=a.abort=D;if(a.preInit)for("function"==typeof a.preInit&&(a.preInit=[a.preInit]);0<a.preInit.length;)a.preInit.pop()();var La=!0;a.noInitialRun&&(La=!1);a.noExitRuntime=!0;na();var Va=da();a.onRuntimeInitialized=function(){function d(a){var c=new Uint8Array(33);c.set(a.public_key,0);h.set(c,u);c=new Uint8Array(32);c.set(a.chain_code,0);h.set(c,z);q(0,u,v)}function c(a,c,d){U(a,A,200);if(0!==k(A,
d,0,y,0))throw Error("Wrong XPUB type!!");E=m(y);if(1!==n(y,c))throw Error("Strange return type");if(0===p(y,E,d,A,200))throw Error("Strange return type");return Aa(A)}function e(a,c,d){l(v,z,a,c,D,60,d);return t(D)}function f(a,c,g,h,l){var k=[];d(a);for(a=c;a<=g;a++)k.push(e(a,h,l));return k}var h=a.HEAPU8,g=a._malloc,l=a._hdnode_public_ckd_address_optimized,k=a._hdnode_deserialize,m=a._hdnode_fingerprint,n=a._hdnode_public_ckd,p=a._hdnode_serialize_public,q=a._ecdsa_read_pubkey,t=a.Pointer_stringify,
v=g(72),u=g(33),z=g(32),y=g(109),D=g(60),A=g(200),E=0;Va.resolve({processMessage:function(a){a=a.data;var d=a.type;switch(d){case "deriveAddressRange":d=f(a.node,a.firstIndex,a.lastIndex,a.version,a.addressFormat);self.postMessage({addresses:d,firstIndex:a.firstIndex,lastIndex:a.lastIndex,i:a.i});break;case "deriveNode":d=c(a.xpub,a.index,a.version);self.postMessage({xpub:d,i:a.i});break;default:throw Error("Unknown message type: "+d);}},loadNode:d,deriveAddress:e,deriveNode:c,deriveAddressRange:f})};
return Va.r}if("function"===typeof importScripts){var ta=da();self.onmessage=function(u){var H=u.data;"init"===H.type?sa(H.binary).then(function(n){ta.resolve(n)}):ta.r.then(function(n){n.processMessage(u)})}}
if(true){var Wa=function(u){return function(){if(null===ua)throw Error("fastxpub not yet inited.");return ua[u].apply(void 0,arguments)}},ua=null;module.exports={deriveNode:Wa("deriveNode"),loadNode:Wa("loadNode"),deriveAddress:Wa("deriveAddress"),deriveAddressRange:Wa("deriveAddressRange"),init:function(u){return sa(u).then(function(u){ua=u})}}};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(2)))

/***/ }),
/* 2 */
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


/***/ })
/******/ ]);