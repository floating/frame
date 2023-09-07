import fs from 'fs'
import path from 'path'
import log from 'electron-log'

import persist from '.'

const backupVersion = new RegExp(/\.v(\d+)\.backup$/)

const writeFile = async (path: string, data: any) =>
  new Promise<void>((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(data), (err) => {
      if (err) return reject(err)
      resolve()
    })
  })

const removeFile = (path: string) => {
  log.debug(`Removing backup file ${path}`)

  fs.unlink(path, (err) => {
    if (err) {
      return log.error(`Failed to remove backup file ${path}`, err)
    }

    log.verbose(`Successfully removed backup file ${path}`)
  })
}

const getBackups = async (dir: string) =>
  new Promise<string[]>((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) return reject(err)

      // return all backed up config files, sorted descending by version
      const backups = files
        .filter((file) => file.endsWith('backup'))
        .sort((a, b) => {
          const aVersion = parseInt(backupVersion.exec(a)?.[1] || '0')
          const bVersion = parseInt(backupVersion.exec(b)?.[1] || '0')
          return bVersion - aVersion
        })

      resolve(backups)
    })
  })

export async function backupConfig(version: number, data: any) {
  const backupPath = `${persist.path}.v${version}.backup`

  log.verbose(`Backing up config file version ${version} to ${backupPath}`)

  try {
    await writeFile(backupPath, data)
    log.verbose(`Successfully backed up config file to ${backupPath}`)

    // once config is successfully backed up, delete all but the 5 most recent backups
    const backupDirectory = path.dirname(persist.path)
    const backups = await getBackups(backupDirectory)

    log.debug('Found backup config files', backups)

    backups.slice(5).forEach((file) => removeFile(path.join(backupDirectory, file)))
  } catch (e) {
    log.error(`Failed to backup config file`, e)
  }
}
