/* eslint-env browser */
import { HttpError } from '../util/errors.js'

/**
 * @typedef {import('../bindings').IpfsUrlContext & import('../bindings').DagulaContext & { timeoutController?: import('../bindings').TimeoutControllerContext['timeoutController'] }} BlockHandlerContext
 */

/** @type {import('../bindings').Handler<BlockHandlerContext>} */
export async function handleBlock (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, dagula } = ctx
  if (!dataCid) throw new Error('missing IPFS path')
  if (path == null) throw new Error('missing URL path')
  if (!dagula) throw new Error('missing dagula instance')

  /** @type {import('multiformats').CID} */
  let cid
  if (path && path !== '/') {
    const entry = await dagula.getUnixfs(`${dataCid}${path}`, { signal: controller?.signal })
    cid = entry.cid
  } else {
    cid = dataCid
  }

  const etag = `"${cid}.raw"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  const block = await dagula.getBlock(cid, { signal: controller?.signal })
  const { searchParams } = new URL(request.url)

  const name = searchParams.get('filename') || `${cid}.bin`
  const utf8Name = encodeURIComponent(name)
  // eslint-disable-next-line no-control-regex
  const asciiName = encodeURIComponent(name.replace(/[^\x00-\x7F]/g, '_'))

  const headers = {
    'Content-Type': 'application/vnd.ipld.raw',
    'X-Content-Type-Options': 'nosniff',
    Etag: etag,
    'Cache-Control': 'public, max-age=29030400, immutable',
    'Content-Length': block.bytes.length.toString(),
    'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`
  }

  return new Response(block.bytes, { headers })
}
