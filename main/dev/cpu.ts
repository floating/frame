import { app } from 'electron'
import log from 'electron-log'

export default function setupCpuMonitoring() {
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
