/* eslint-env browser */
/**
 * @import { IpfsUrlContext, UnixfsContext, TimeoutController } from '../bindings.js'
 */
import * as dagJSON from '@ipld/dag-json'
import * as dagCBOR from '@ipld/dag-cbor'
import { handleUnixfsDir } from './unixfs-dir.js'
import { handleUnixfsFile } from './unixfs-file.js'
import { handleBlockHtml } from './block.js'
import { HttpError } from '../util/errors.js'

/**
 * @typedef {IpfsUrlContext & UnixfsContext & { timeoutController?: TimeoutController, gatewayDomain?: string }} UnixfsHandlerContext
 */

/** @type {import('../bindings.js').Handler<UnixfsHandlerContext>} */
export async function handleUnixfs (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, unixfs } = ctx
  if (!dataCid) throw new Error('missing data CID')
  if (path == null) throw new Error('missing URL pathname')
  if (!unixfs) throw new Error('missing UnixFS context')

  const options = { signal: controller?.signal }
  const entry = await unixfs.getUnixfs(`${dataCid}${path}`, options)

  const { cid } = entry
  if (cid.code === dagCBOR.code || cid.code === dagJSON.code) {
    if (!(entry.node instanceof Uint8Array)) {
      throw new Error(`unexpected non-unixfs entry node type: ${typeof entry.node}`)
    }
    const block = { cid, bytes: entry.node }
    return await handleBlockHtml(request, env, { ...ctx, block })
  }

  if (!['file', 'raw', 'directory', 'hamt-directory', 'identity'].includes(entry.type)) {
    throw new HttpError('unsupported entry type', { status: 501 })
  }

  if (entry.type.includes('directory')) {
    return await handleUnixfsDir(request, env, { ...ctx, unixfsEntry: entry })
  }

  return await handleUnixfsFile(request, env, { ...ctx, unixfsEntry: entry })
}
