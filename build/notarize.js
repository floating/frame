const fs = require('fs')
const path = require('path')
const electronNotarize = require('electron-notarize')

module.exports = async function (params) {
  if (process.platform !== 'darwin') return // Only notarize the app on Mac OS only
  console.log('afterSign hook triggered', params)
  const appId = 'sh.frame.app' // Same appId in electron-builder
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)
  if (!fs.existsSync(appPath)) throw new Error(`Cannot find application at: ${appPath}`)
  console.log(`Notarizing ${appId} found at ${appPath}`)
  try {
    await electronNotarize.notarize({
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword
    })
  } catch (error) {
    console.error(error)
  }

  console.log(`Done notarizing ${appId}`)
}
