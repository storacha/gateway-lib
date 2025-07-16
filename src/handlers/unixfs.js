/* eslint-env browser */
import { handleUnixfsDir } from './unixfs-dir.js'
import { handleUnixfsFile } from './unixfs-file.js'
import { HttpError } from '../util/errors.js'

/**
 * @import { IpfsUrlContext, UnixfsContext, TimeoutControllerContext, Handler } from '../bindings.js'
 */

/** @type {Handler<IpfsUrlContext & UnixfsContext & Partial<TimeoutControllerContext>>} */
export async function handleUnixfs (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, unixfs } = ctx
  if (!dataCid) throw new Error('missing data CID')
  if (path == null) throw new Error('missing URL pathname')
  if (!unixfs) throw new Error('missing UnixFS context')

  const entry = await unixfs.getUnixfs(`${dataCid}${path}`, { signal: controller?.signal })

  if (!['file', 'raw', 'directory', 'hamt-directory', 'identity'].includes(entry.type)) {
    throw new HttpError('unsupported entry type', { status: 501 })
  }

  if (entry.type.includes('directory')) {
    return await handleUnixfsDir(request, env, { ...ctx, unixfsEntry: entry })
  }

  return await handleUnixfsFile(request, env, { ...ctx, unixfsEntry: entry })
}
