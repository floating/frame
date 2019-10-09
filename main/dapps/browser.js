const path = require('path')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { userData } = require('../util')

class Browser {
  constructor () {
    this.browser = null
    this.options = {
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--no-default-browser-check'],
      defaultViewport: null,
      userDataDir: path.resolve(userData, 'chromium')
    }
    this.script = fs.readFileSync(path.resolve(__dirname, 'inject.js'), 'utf8')
  }

  async launch (url) {
    let page
    if (!this.browser) {
      this.browser = await puppeteer.launch(this.options)
      const pages = await this.browser.pages()
      page = pages[0]
    } else {
      page = await this.browser.newPage()
    }
    await page.evaluateOnNewDocument(this.script)
    await page.goto(url)
  }
}

const browser = new Browser()
module.exports = browser
