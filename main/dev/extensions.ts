import log from 'electron-log'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-extension-installer'

export default async function installElectronDevToolExtensions() {
  try {
    await installExtension(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: {
        allowFileAccess: true
      }
    })

    log.info('Successfully installed devtools extensions')
  } catch (err) {
    log.warn('Could not install devtools extensions', err)
  }
}
