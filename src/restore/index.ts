import * as core from '@actions/core'
import * as p from 'path'
import {
  checkKey,
  checkPaths,
  exec,
  getCacheBase,
  getCachePath,
  sanitizeString,
  sanitizePath,
} from '../utils/cache'

async function run(): Promise<void> {
  try {
    const base = sanitizePath(core.getInput('base'))
    const cacheBase = getCacheBase(base)
    const key = sanitizeString(core.getInput('key'))
    const path = sanitizePath(core.getInput('path'))
    const rsync = core.getInput('rsync') === 'true'
    const cachePath = getCachePath(key, base)
    const cleanKey = sanitizeString(core.getInput('clean-key'))

    checkKey(key)
    checkPaths([path])
    
    try {
      /* 
        clean up caches
      */
      const CLEAN_TIME = 7

      if (cleanKey) {
        await exec(
          `/bin/bash -c "find "${cacheBase}" -maxdepth 1 -name '${cleanKey}*' -type d -atime +${CLEAN_TIME} -exec rm -rf {} +"`
        )
      }
    } catch (error) {
      if (error instanceof Error) core.warning(error.message)
    }

    core.setOutput('cache-key', key)
    core.setOutput('cache-path', path)
    core.setOutput('cache-base', cacheBase)

    await exec(`mkdir -p ${cacheBase}`)
    const find = await exec(
      `find "${cacheBase}" -maxdepth 1 -name "${key}" -type d`
    )
    const cacheHit = find.stdout ? true : false
    core.setOutput('cache-hit', String(cacheHit))

    if (cacheHit === true) {
      let cp = null
      if (!rsync) {
        await exec(`rm -rf "${path}"`)
        cp = await exec(
          `cp -rf "${p.join(cachePath, path.split('/').slice(-1)[0])}" -T "${path}"`
        )
      } else {
        cp = await exec(
          `rsync --archive --recursive --delete --quiet "${p.join(cachePath, path.split('/').slice(-1)[0])}/" "${path}/"`
        )
      }
      core.debug(cp.stdout)
      if (cp.stderr) core.error(cp.stderr)
      if (!cp.stderr) core.info(`Cache restored with key ${key} `)
    } else {
      core.info(`Cache not found for ${key}`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
