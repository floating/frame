// build config for every platform and architecture EXCEPT linux arm64

const baseConfig = require('./electron-builder-base.js')

const config = {
  ...baseConfig,
  afterSign: './build/notarize.js',
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'snap',
        arch: ['x64']
      },
      {
        target: 'tar.gz',
        arch: ['x64']
      }
    ]
  },
  mac: {
    target: {
      target: 'default',
      arch: ['x64', 'arm64']
    },
    notarize: false,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    requirements: 'build/electron-builder-requirements.txt'
  },
  win: {
    publisherName: 'Frame Labs, Inc.',
    signAndEditExecutable: true,
    icon: 'build/icons/icon.png'
  }
}

module.exports = config
