import { join } from 'path'
import fs from 'fs'
import { getDirname } from 'cross-dirname'

const dirname = getDirname()
const electronBuilderConfig = JSON.parse(fs.readFileSync('./electron-builder.json'))
const { productName } = electronBuilderConfig

process.env.TEST = true

export const config = {
  services: [
    [
      'electron',
      {
        appPath: join(dirname, 'dist'),
        appName: productName,
        appArgs: [`config-root=${join(dirname, 'e2e', 'config-fixtures')}`],
        chromedriver: {
          port: 9519,
          logFileName: 'wdio-chromedriver.log'
        },
        electronVersion: '22.0.3'
      }
    ]
  ],
  capabilities: [{}],
  port: 9519,
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 90000,
  logLevel: 'debug',
  runner: 'local',
  outputDir: 'wdio-logs',
  specs: ['./e2e/test/*.test.ts'],
  autoCompileOpts: {
    autoCompile: true
    // tsNodeOpts: {
    //   transpileOnly: true,
    //   files: true,
    //   project: join(dirname, 'e2e', 'tsconfig.json')
    // }
  },
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 30000
  }
}
