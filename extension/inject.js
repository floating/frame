/* globals chrome */

try {
  let script = document.createElement('script')
  script.setAttribute('type', 'text/javascript')
  script.setAttribute('src', chrome.extension.getURL('frame.js'))
  script.onload = function () { this.remove() }
  document.head ? document.head.prepend(script) : document.documentElement.prepend(script)
} catch (e) {
  console.log(e)
}
