/* globals chrome */

chrome.browserAction.onClicked.addListener(tab => chrome.tabs.executeScript(tab.ib, {file: 'inject.js'}))
