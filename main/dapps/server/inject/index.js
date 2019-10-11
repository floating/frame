require('./provider')
require('./storage')
const currentScript = document.currentScript || document.scripts[document.scripts.length - 1]
currentScript.parentNode.removeChild(currentScript)
