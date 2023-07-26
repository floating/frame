const fs = require('fs')
const { execFileSync } = require('child_process')
const path = require('path')
const electronNotarize = require('@electron/notarize')

module.exports = async function (params) {
  if (process.platform !== 'darwin') return // Only notarize the app on macOS
  const appId = 'sh.frame.app' // Same appId in electron-builder
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)
  if (!fs.existsSync(appPath)) throw new Error(`Cannot find application at: ${appPath}`)

  console.log(`Notarizing ${appId} found at ${appPath}`)

  try {
    await electronNotarize.notarize({
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD
    })

    // verify signed and notarized application
    execFileSync(
      'spctl',
      ['--assess', '--type', 'execute', '--verbose', '--ignore-cache', '--no-cache', appPath],
      {}
    )

    console.log(`Successfully notarized ${appId}`)
  } catch (error) {
    console.error(error)
    throw error
  }
}
