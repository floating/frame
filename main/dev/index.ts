import { app } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import log from 'electron-log'

export async function installElectronDevToolExtensions() {
  try {
    await installExtension([REACT_DEVELOPER_TOOLS], {
      forceDownload: false,
      loadExtensionOptions: { allowFileAccess: true }
    })

    log.info('Successfully installed devtools extensions')
  } catch (err) {
    log.warn('Could not install devtools extensions', err)
  }
}

export function setupCpuMonitoring() {
  const cpuMonitoringInterval = 10 // seconds
  const cpuThreshold = 30 // percent

  setTimeout(() => {
    app.getAppMetrics()

    setInterval(() => {
      const cpuUsers = app.getAppMetrics().filter((metric) => metric.cpu.percentCPUUsage > cpuThreshold)

      if (cpuUsers.length > 0) {
        log.verbose(
          `Following processes used more than ${cpuThreshold}% CPU over the last ${cpuMonitoringInterval} seconds`
        )
        log.verbose(JSON.stringify(cpuUsers, undefined, 2))
      }
    }, cpuMonitoringInterval * 1000)
  }, 10_000)
}
