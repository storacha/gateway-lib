/* eslint-env browser */
import { CarWriter } from '@ipld/car'
import { toReadableStream } from '../util/streams.js'

/**
 * @typedef {import('../bindings').IpfsUrlContext & import('../bindings').DagulaContext  & { timeoutController?: import('../bindings').TimeoutControllerContext['timeoutController'] }} CarHandlerContext
 * @typedef {import('multiformats').CID} CID
 */

/** @type {import('../bindings').Handler<CarHandlerContext>} */
export async function handleCar (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, dagula } = ctx
  if (!dataCid) throw new Error('missing IPFS path')
  if (path == null) throw new Error('missing URL path')
  if (!dagula) throw new Error('missing dagula instance')

  /** @type {CID} */
  let cid
  if (path && path !== '/') {
    const entry = await dagula.getUnixfs(`${dataCid}${path}`, { signal: controller?.signal })
    cid = entry.cid
  } else {
    cid = dataCid
  }

  // Weak Etag W/ because we can't guarantee byte-for-byte identical
  // responses, but still want to benefit from HTTP Caching. Two CAR
  // responses for the same CID and selector will be logically equivalent,
  // but when CAR is streamed, then in theory, blocks may arrive from
  // datastore in non-deterministic order.
  const etag = `W/"${cid}.car"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  const { writer, out } = CarWriter.create(cid)
  ;(async () => {
    try {
      for await (const block of dagula.get(cid, { signal: controller?.signal })) {
        await writer.put(block)
      }
    } catch (/** @type {any} */ err) {
      console.error('writing CAR', err.stack)
    } finally {
      await writer.close()
    }
  })()

  const { searchParams } = new URL(request.url)

  const name = searchParams.get('filename') || `${cid}.car`
  const utf8Name = encodeURIComponent(name)
  // eslint-disable-next-line no-control-regex
  const asciiName = encodeURIComponent(name.replace(/[^\x00-\x7F]/g, '_'))

  const headers = {
    // Make it clear we don't support range-requests over a car stream
    'Accept-Ranges': 'none',
    'Content-Type': 'application/vnd.ipld.car; version=1',
    'X-Content-Type-Options': 'nosniff',
    Etag: etag,
    'Cache-Control': 'public, max-age=29030400, immutable',
    'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`
  }

  return new Response(toReadableStream(out), { headers })
}
