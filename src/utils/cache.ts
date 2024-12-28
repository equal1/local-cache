import * as e from '@actions/exec'
import * as p from 'path'

/**
 * Get the cache base directory
 * @param base is the base directory for the cache
 * @returns Returns the cache base directory
 */
export const getCacheBase = (base: string): string => {
  if (base && !base.endsWith('/')) {
    base += '/'
  }
  return base
}
/**
 * Get the cache path for a key
 * @param key is the cache key
 * @param base is the base directory for the cache
 * @returns the cache path
 */
export const getCachePath = (key: string, base: string): string => {
  return p.join(getCacheBase(base), key)
}


/**
 * Sanitize a string:
 *  - Replace all occurrences of `/`, `*`, `"`, `'`, `~`, `:`, and whitespace with `_`
 * @param str is the string to sanitize
 * @returns Returns the sanitized string with special characters replaced 
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/[\/\*\"\'~:\s]/g, '_')
}

/**
 * Sanitize a path string
 *  - Replace all occurrences of `*`, `"`, `'`, `:`, and whitespace with `_`
 *  - Remove trailing `/`
 * @param str is the path string to sanitize
 * @returns Returns the sanitized path string with special characters replaced and trailing slashes removed
 */
export const sanitizePath = (str: string): string => {
  return str.replace(/[\*\"\':\s]/g, '_').replace(/\/+$/, '')
}


class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export const checkPaths = (paths: string[]): void => {
  if (!paths || paths.length === 0) {
    throw new ValidationError(
      `Path Validation Error: At least one directory or file path is required`
    )
  }
}

export const checkKey = (key: string): void => {
  if (key.length > 512) {
    throw new ValidationError(
      `Key Validation Error: ${key} cannot be larger than 512 characters.`
    )
  }
  const regex = /^[^,]*$/
  if (!regex.test(key)) {
    throw new ValidationError(
      `Key Validation Error: ${key} cannot contain commas.`
    )
  }
}

export const exec = async (
  command: string
): Promise<{ stdout: string; stderr: string }> => {
  const { stdout, stderr } = await e.getExecOutput(command)
  return { stdout, stderr }
}
