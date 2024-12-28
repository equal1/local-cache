import * as core from '@actions/core'
import * as p from 'path'
import {
  exec, sanitizeString,
  sanitizePath, checkKey, checkPaths,
  getCacheBase, getCachePath
} from '../utils/cache'

async function run(): Promise<void> {
  try {
    const key = sanitizeString(core.getInput('key'))
    const base = sanitizePath(core.getInput('base'))
    const path = sanitizePath(core.getInput('path'))
    const rsync = core.getInput('rsync') === 'true'

    core.info(`Key: ${key}`)
    core.info(`Base: ${base}`)
    core.info(`Path: ${path}`)

    checkKey(key)
    checkPaths([path])

    const cachePath = getCachePath(key, getCacheBase(base))

    let cp = null
    if (!rsync) {
      await exec(`rm -rf "${cachePath}"`)
      await exec(`mkdir -p "${cachePath}"`)
      cp = await exec(`cp -rf "${path}" -t "${cachePath}"`)
    } else {
      await exec(`mkdir -p "${cachePath}"`)
      cp = await exec(
        `rsync --archive --recursive --delete --quiet ` +
        `"${path}/" "${p.join(cachePath, path.split('/').slice(-1)[0])}/"`
      )
    }

    core.debug(cp.stdout)
    if (cp.stderr) core.error(cp.stderr)
    if (!cp.stderr) core.info(`Cache saved with key ${key}`)

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()