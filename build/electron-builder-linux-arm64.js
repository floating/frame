// build config for linux arm64

const baseConfig = require('./electron-builder-base.js')

const config = {
  ...baseConfig,
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['arm64']
      },
      {
        target: 'tar.gz',
        arch: ['arm64']
      }
    ]
  }
}

module.exports = config
