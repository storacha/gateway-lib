/* eslint-env browser */
import { CarWriter } from '@ipld/car'
import { toReadableStream } from '../util/streams.js'
import { HttpError } from '../util/errors.js'

/**
 * @typedef {import('../bindings').IpfsUrlContext & import('../bindings').DagulaContext  & { timeoutController?: import('../bindings').TimeoutControllerContext['timeoutController'] }} CarHandlerContext
 * @typedef {import('multiformats').CID} CID
 * @typedef {{ version: 1|2, order: import('dagula').BlockOrder, dups: boolean }} CarParams
 */

/** @type {CarParams} */
const DefaultCarParams = { version: 1, order: 'unk', dups: true }

/** @type {import('../bindings').Handler<CarHandlerContext>} */
export async function handleCar (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, dagula, searchParams } = ctx
  if (!dataCid) throw new Error('missing IPFS path')
  if (path == null) throw new Error('missing URL path')
  if (!dagula) throw new Error('missing dagula instance')

  const dagScope = getDagScope(searchParams)
  const { version, order, dups } = getAcceptParams(request.headers)

  // Use root CID for etag even tho we may resolve a different root for the terminus of the path
  // as etags are only relevant per path. If the caller has an etag for this path already, and
  // the root cid matches, then take the opportunity to send them a 304 as early as we can.
  //
  // Weak Etag W/ because we can't guarantee byte-for-byte identical
  // responses, but still want to benefit from HTTP Caching. Two CAR
  // responses for the same CID and selector will be logically equivalent,
  // but when CAR is streamed, then in theory, blocks may arrive from
  // datastore in non-deterministic order.
  const etag = `W/"${dataCid}.car"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  const { writer, out } = CarWriter.create(dataCid)
  ;(async () => {
    try {
      for await (const block of dagula.getPath(`${dataCid}${path}`, { dagScope, order, signal: controller?.signal })) {
        // @ts-expect-error
        await writer.put(block)
      }
    } catch (/** @type {any} */ err) {
      console.error('writing CAR', err.stack)
    } finally {
      await writer.close()
    }
  })()

  const name = searchParams.get('filename') || `${dataCid}.car`
  const utf8Name = encodeURIComponent(name)
  // eslint-disable-next-line no-control-regex
  const asciiName = encodeURIComponent(name.replace(/[^\x00-\x7F]/g, '_'))

  const headers = {
    // Make it clear we don't support range-requests over a car stream
    'Accept-Ranges': 'none',
    'Content-Type': `application/vnd.ipld.car; version=${version}; order=${order}; dups=${dups ? 'y' : 'n'};`,
    'X-Content-Type-Options': 'nosniff',
    Etag: etag,
    'Cache-Control': 'public, max-age=29030400, immutable',
    'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`
  }

  return new Response(toReadableStream(out), { headers })
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {import('dagula').DagScope}
 */
function getDagScope (searchParams) {
  const scope = searchParams.get('dag-scope') ?? 'all'
  if (scope === 'all' || scope === 'entity' || scope === 'block') {
    return scope
  }
  throw new HttpError(`unsupported dag-scope: ${scope}`, { status: 400 })
}

/**
 * @param {Headers} headers
 * @returns {CarParams}
 */
function getAcceptParams (headers) {
  const accept = headers.get('accept')
  if (!accept) return DefaultCarParams

  const types = accept.split(',').map(s => s.trim())
  const carType = types.find(t => t.startsWith('application/vnd.ipld.car'))
  if (!carType) return DefaultCarParams

  const paramPairs = carType.split(';').slice(1).map(s => s.trim())
  const { version, order, dups } = Object.fromEntries(paramPairs.map(p => p.split('=').map(s => s.trim())))

  // only CARv1
  if (version != null && version !== '1') {
    throw new HttpError(`unsupported accept parameter: version=${version}`, { status: 400 })
  }
  // only yes duplicates
  if (dups && dups !== 'y') {
    throw new HttpError(`unsupported accept parameter: dups=${dups}`, { status: 400 })
  }
  // only dfs or unk ordering
  if (order && order !== 'dfs' && order !== 'unk') {
    throw new HttpError(`unsupported accept parameter: order=${order}`, { status: 400 })
  }

  return { version: 1, order, dups: true }
}
